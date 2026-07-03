// WordPress -> Supabase migration.
// Fetches all published posts from the WordPress REST API and imports them into
// the dashboard's Article table (Supabase Postgres), PRESERVING the exact
// slug/URL (so Google ranking equity is not lost). Thin / AI-fabricated posts
// are flagged (needsRewrite) for human review — nothing is deleted.
//
// It also RE-HOSTS every image (featured image + images embedded in the post
// body) into Supabase Storage and rewrites the URLs, so the site no longer
// depends on the old WordPress host — killing WP won't 404 the images.
//
// Run:  node --env-file=.env scripts/migrate-wordpress.mjs
// Safe to re-run (upsert by slug; images already in Storage are skipped).

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { Buffer } from "node:buffer";

// Use the DIRECT (non-pooled) connection for this bulk script.
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
  },
});

const WP = (process.env.WORDPRESS_URL || "https://triptravelingguide.com").replace(/\/$/, "");

// ---- Supabase Storage (image re-hosting) ---------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "post-images";

// Re-hosting is enabled only when real Supabase creds are present.
const REHOST = Boolean(SUPABASE_URL && SERVICE_KEY && !/PASTE_|_HERE/.test(SERVICE_KEY));
const supabase = REHOST
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null;

async function ensureBucket() {
  if (!supabase) return;
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`Cannot list Storage buckets: ${error.message}`);
  if (buckets?.some((b) => b.name === BUCKET)) return;
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "25MB",
  });
  if (createErr && !/already exists/i.test(createErr.message)) {
    throw new Error(`Cannot create bucket "${BUCKET}": ${createErr.message}`);
  }
  console.log(`Created public Storage bucket "${BUCKET}".`);
}

// Match any image URL that lives under a WordPress uploads folder — this also
// catches Jetpack/Photon CDN URLs like i0.wp.com/site/wp-content/uploads/...
const IMG_RE =
  /https?:\/\/[^\s"'()\\<>]+?\/wp-content\/uploads\/[^\s"'()\\<>]+?\.(?:jpe?g|png|gif|webp|svg|avif)/gi;

function extractImageUrls(...strings) {
  const urls = new Set();
  for (const s of strings) {
    if (!s) continue;
    for (const m of s.matchAll(IMG_RE)) urls.add(m[0]);
  }
  return [...urls];
}

// Deterministic Storage path derived from the WP uploads path, so re-runs and
// different size-variants of the same source dedupe naturally.
function storagePathFor(url) {
  const marker = "/wp-content/uploads/";
  const idx = url.indexOf(marker);
  let path = idx >= 0 ? url.slice(idx + marker.length) : new URL(url).pathname.replace(/^\//, "");
  path = decodeURIComponent(path.split("?")[0].split("#")[0]);
  return path
    .split("/")
    .map((seg) => seg.replace(/[^a-zA-Z0-9._-]/g, "-"))
    .filter(Boolean)
    .join("/");
}

// rehostImage return values:
//   <string>  -> public Supabase URL (success)
//   DEAD      -> fetched but it isn't a real image (WP soft-404 HTML, 404/410)
//   null      -> transient error; leave the original URL untouched
const DEAD = Symbol("dead-image");
const rehostCache = new Map(); // sourceUrl -> publicUrl | DEAD

function isImageType(ct) {
  return typeof ct === "string" && ct.toLowerCase().startsWith("image/");
}

async function rehostImage(sourceUrl) {
  if (rehostCache.has(sourceUrl)) return rehostCache.get(sourceUrl);
  const path = storagePathFor(sourceUrl);
  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  // Already uploaded as a REAL image? Skip re-download (safe re-run).
  try {
    const head = await fetch(publicUrl, { method: "HEAD" });
    if (head.ok && isImageType(head.headers.get("content-type"))) {
      rehostCache.set(sourceUrl, publicUrl);
      return publicUrl;
    }
  } catch {
    /* fall through to download */
  }

  let res;
  try {
    res = await fetch(sourceUrl, { headers: { "User-Agent": "ttg-migrator/1.0" } });
  } catch (e) {
    console.log(`   ! image fetch error: ${sourceUrl} — ${e.message}`);
    return null;
  }
  if (res.status === 404 || res.status === 410) {
    rehostCache.set(sourceUrl, DEAD);
    return DEAD;
  }
  if (!res.ok) {
    console.log(`   ! image fetch failed ${res.status}: ${sourceUrl}`);
    return null;
  }
  const contentType = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  // WordPress serves a soft-404 HTML page (HTTP 200) for missing media — reject
  // anything that isn't actually an image so we don't store junk.
  if (!isImageType(contentType) || buf.byteLength < 512) {
    rehostCache.set(sourceUrl, DEAD);
    return DEAD;
  }
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType,
    upsert: true,
    cacheControl: "31536000",
  });
  if (error) {
    console.log(`   ! upload failed: ${path} — ${error.message}`);
    return null;
  }
  rehostCache.set(sourceUrl, publicUrl);
  return publicUrl;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Strip dead images (and their <figure>/<a> wrappers) out of the post body so a
// killed WordPress host doesn't leave broken-image icons behind.
function removeDeadImages(html, deadUrls) {
  if (!html || deadUrls.length === 0) return html;
  let out = html;
  for (const url of deadUrls) {
    const u = escapeRegExp(url);
    out = out.replace(
      new RegExp(`<figure\\b[^>]*>(?:(?!</figure>)[\\s\\S])*?${u}[\\s\\S]*?</figure>`, "gi"),
      ""
    );
    out = out.replace(new RegExp(`<a\\b[^>]*>\\s*<img\\b[^>]*${u}[^>]*>\\s*</a>`, "gi"), "");
    out = out.replace(new RegExp(`<img\\b[^>]*${u}[^>]*>`, "gi"), "");
  }
  return out;
}

// Re-host every image in a mapped post, rewrite live URLs, and strip dead ones.
async function rehostPostImages(data) {
  if (!supabase) return data;
  const urls = extractImageUrls(data.contentHtml, data.coverImageUrl);
  if (urls.length === 0) return data;
  const dead = [];
  let live = 0;
  for (const src of urls) {
    const dest = await rehostImage(src);
    if (dest === DEAD) {
      dead.push(src);
      continue;
    }
    if (!dest) continue; // transient failure: leave the original URL
    if (data.contentHtml) data.contentHtml = data.contentHtml.split(src).join(dest);
    if (data.coverImageUrl === src) data.coverImageUrl = dest;
    live++;
  }
  if (dead.length) {
    data.contentHtml = removeDeadImages(data.contentHtml, dead);
    if (dead.includes(data.coverImageUrl)) data.coverImageUrl = "";
    const note = `${dead.length} broken/missing image(s) removed`;
    data.qualityNote = data.qualityNote ? `${data.qualityNote}; ${note}` : note;
    data.needsRewrite = true;
  }
  console.log(`   ↳ images: ${live} re-hosted, ${dead.length} dead removed`);
  return data;
}

// ---- helpers -------------------------------------------------------------

function decodeEntities(str = "") {
  return str
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripHtml(html = "") {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Decide whether a post needs a quality rewrite (Helpful-Content recovery).
function assessQuality(title, contentHtml) {
  const text = stripHtml(contentHtml);
  const words = text ? text.split(/\s+/).length : 0;
  const reasons = [];

  if (words < 600) reasons.push(`thin content (${words} words)`);

  // Known AI-fabrication fingerprints we found on the live site.
  if (/ship ownar|country name\s*:|\bownar\b/i.test(text)) {
    reasons.push("AI-fabrication markers (e.g. 'Ship Ownar', 'Country name :')");
  }

  // Repeated identical price = fabricated comparison table (every ship same fare).
  const prices = text.match(/(?:rs\.?|₹|\$|pkr|inr)\s?[\d,]{3,}/gi) || [];
  const counts = {};
  for (const p of prices) {
    const key = p.replace(/\s+/g, "").toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  }
  if (Object.values(counts).some((n) => n >= 4)) {
    reasons.push("repeated identical prices (likely fabricated table)");
  }

  return { words, needsRewrite: reasons.length > 0, qualityNote: reasons.join("; ") };
}

async function fetchAllPosts() {
  const all = [];
  let page = 1;
  while (true) {
    const url =
      `${WP}/wp-json/wp/v2/posts?status=publish&per_page=100&page=${page}&_embed=wp:featuredmedia,wp:term`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.status === 400) break; // past the last page
    if (!res.ok) throw new Error(`WP fetch failed (page ${page}): ${res.status}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    const totalPages = Number(res.headers.get("x-wp-totalpages") || "1");
    if (page >= totalPages) break;
    page++;
  }
  return all;
}

function mapPost(p) {
  const title = decodeEntities(p.title?.rendered || p.slug);
  const contentHtml = p.content?.rendered || "";
  const excerpt = decodeEntities(stripHtml(p.excerpt?.rendered || "")).slice(0, 180);

  // Embedded media + terms
  const media = p._embedded?.["wp:featuredmedia"]?.[0];
  const coverImageUrl = media?.source_url || "";
  const coverImageAlt = decodeEntities(media?.alt_text || "");

  const termGroups = p._embedded?.["wp:term"] || [];
  const categories = termGroups.find((g) => g?.[0]?.taxonomy === "category") || [];
  const tagsTerms = termGroups.find((g) => g?.[0]?.taxonomy === "post_tag") || [];
  const primaryCat = categories[0];

  const tags = tagsTerms.map((t) => decodeEntities(t.name)).filter(Boolean).join(", ");

  const { words, needsRewrite, qualityNote } = assessQuality(title, contentHtml);

  return {
    slug: p.slug,
    title,
    contentHtml,
    metaDescription: excerpt,
    primaryKeyword: p.slug.replace(/-/g, " "),
    comparisonType: "destination", // neutral default; refined during rewrite
    status: "published",
    source: "wordpress",
    wordpressPostId: String(p.id),
    wordpressUrl: p.link,
    coverImageUrl,
    coverImageAlt,
    categoryName: primaryCat ? decodeEntities(primaryCat.name) : "",
    categorySlug: primaryCat ? primaryCat.slug : "",
    tags,
    wordCount: words,
    needsRewrite,
    qualityNote,
    publishedAt: new Date(p.date_gmt ? p.date_gmt + "Z" : p.date),
  };
}

// ---- run -----------------------------------------------------------------

if (REHOST) {
  console.log(`Image re-hosting: ON → Supabase Storage bucket "${BUCKET}".`);
  await ensureBucket();
} else {
  console.log(
    "Image re-hosting: OFF (no SUPABASE_SERVICE_ROLE_KEY). Posts import with original WordPress image URLs."
  );
}

console.log(`Fetching published posts from ${WP} ...`);
const posts = await fetchAllPosts();
console.log(`Fetched ${posts.length} posts. Importing into Supabase...`);

let imported = 0;
let flagged = 0;
for (const p of posts) {
  const data = await rehostPostImages(mapPost(p));
  await prisma.article.upsert({
    where: { slug: data.slug },
    update: data,
    create: data,
  });
  imported++;
  if (data.needsRewrite) {
    flagged++;
    console.log(`  ⚑ ${data.slug}  —  ${data.qualityNote}`);
  }
}

const total = await prisma.article.count();
console.log(`\nDone. Imported/updated ${imported} posts (${flagged} flagged for rewrite).`);
console.log(`Total articles in Supabase: ${total}`);

await prisma.$disconnect();
