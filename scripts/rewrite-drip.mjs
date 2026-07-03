// Safe "drip" rewrite pipeline for the Google-penalty recovery.
//
// The site was hit by Google's Helpful-Content / scaled-content-abuse policy
// because the old posts were THIN and FABRICATED (invented prices, fake names,
// zero first-hand experience). A blind mass AI rewrite + auto-publish would look
// like the SAME scaled-abuse pattern and could deepen the penalty. So this
// script deliberately does the OPPOSITE of mass auto-publish:
//
//   1. It picks only a SMALL BATCH (default 5) of high-value, evergreen posts.
//   2. It NEVER touches the live post. It creates a separate DRAFT sibling row
//      (slug = "<slug>__rewrite", status = "draft"), so the live URL keeps
//      serving and never 404s while the rewrite is in review.
//   3. The AI is forbidden from inventing specific prices/dates/names. Wherever
//      a real current fact is needed it must emit a [HUMAN INPUT NEEDED: ...]
//      marker — those become hard review gates. AI = drafting assistant only;
//      a human fact-checks + adds real experience/photos before anything goes
//      live (E-E-A-T is the actual recovery lever).
//   4. Nothing is published. Promotion to the live slug is a separate, manual,
//      human-reviewed step (see promoteRewrite note at the bottom).
//
// Run:  node --env-file=.env scripts/rewrite-drip.mjs            (default 5 picks)
//       node --env-file=.env scripts/rewrite-drip.mjs --limit 3
//       node --env-file=.env scripts/rewrite-drip.mjs --slug how-to-visit-mackinac-island
// Safe to re-run: draft rows are upserted by their "__rewrite" slug.

import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const REWRITE_SUFFIX = "__rewrite";

// The curated, high-value, EVERGREEN batch. Deliberately hand-picked (not
// auto-selected by word count) so the drip starts with topics that have real
// search demand and can genuinely rank once written honestly. Expired seasonal
// forecasts (snow/winter 20xx) are intentionally NOT here — those get pruned,
// not rewritten.
const DEFAULT_PICKS = [
  "vantara-jamnagar-complete-visitor-guide2025",
  "how-to-become-a-travel-agent",
  "statue-of-unity-ticket-prices-2024",
  "sundarban-national-park-entry-fee",
  "how-to-visit-mackinac-island",
];

// ---- CLI args -------------------------------------------------------------

function parseArgs(argv) {
  const out = { limit: undefined, slugs: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit") out.limit = parseInt(argv[++i], 10);
    else if (argv[i] === "--slug") out.slugs.push(argv[++i]);
  }
  return out;
}

// ---- Gemini (multi-key failover, mirrors lib/gemini.ts) -------------------

function getApiKeys() {
  const raw = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY1,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY4,
  ];
  const keys = [...new Set(raw.filter((k) => k && k.trim()).map((k) => k.trim()))];
  if (!keys.length) throw new Error("No GEMINI_API_KEY in .env");
  return keys;
}

function isKeyError(error) {
  const msg = String(error?.message || error || "");
  return (
    /\b(429|403|401)\b/.test(msg) ||
    /quota|RESOURCE_EXHAUSTED|rate.?limit|Too Many Requests|PERMISSION_DENIED|API_KEY_INVALID|API key not valid|forbidden|unauthorized/i.test(
      msg
    )
  );
}

// A transient server error (model overloaded) — NOT key-specific; retrying the
// same key after a short wait is the right move, not failing over.
function isTransient(error) {
  const msg = String(error?.message || error || "");
  return /\b(500|503)\b/.test(msg) || /overloaded|Service Unavailable|UNAVAILABLE|high demand/i.test(msg);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let keyCursor = 0;
async function generateText(prompt) {
  const keys = getApiKeys();
  const start = keyCursor;
  let lastError;
  // Outer loop retries transient 503s with exponential backoff (model overload).
  for (let retry = 0; retry <= 4; retry++) {
    for (let attempt = 0; attempt < keys.length; attempt++) {
      const index = (start + attempt) % keys.length;
      try {
        const genAI = new GoogleGenerativeAI(keys[index]);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        keyCursor = index;
        return result.response.text();
      } catch (error) {
        lastError = error;
        if (isKeyError(error)) continue; // exhausted key — try next key
        if (isTransient(error)) break; // overloaded — break to backoff+retry
        throw error; // real error (bad prompt/safety) — fail fast
      }
    }
    if (!isTransient(lastError)) break;
    const wait = 3000 * 2 ** retry; // 3s, 6s, 12s, 24s, 48s
    process.stdout.write(` (503, retry in ${wait / 1000}s)`);
    await sleep(wait);
  }
  keyCursor = (start + 1) % keys.length;
  throw new Error(
    `Gemini failed. (last: ${String(lastError?.message || lastError).slice(0, 160)})`
  );
}

// ---- Helpers (mirror lib/contentPipeline.ts + lib/markdown.ts) ------------

function stripCodeFences(text) {
  const t = text.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:markdown|md)?\s*/i, "").replace(/```\s*$/, "");
  }
  return text;
}

function extractMarkers(markdown) {
  const markers = [];
  const re = /\[HUMAN INPUT NEEDED:\s*([^\]]+)\]/gi;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    const text = m[1].trim();
    const lower = text.toLowerCase();
    const markerType = /photo|image|picture|screenshot/.test(lower)
      ? "photo"
      : /price|cost|fare|\$|₹|fee|rate|ticket|timing|hours|schedule/.test(lower)
      ? "price"
      : /experience|first-hand|personal|visited|we |our /.test(lower)
      ? "experience"
      : "other";
    markers.push({ markerType, markerText: text });
  }
  return markers;
}

const SITE_DOMAIN = "triptravelingguide.com";
function markdownToHtml(markdown) {
  if (!markdown) return "";
  marked.setOptions({ gfm: true, breaks: false });
  let src = markdown.replace(
    /\[HUMAN INPUT NEEDED:(.*?)\]/g,
    '<span class="human-input-marker">[HUMAN INPUT NEEDED:$1]</span>'
  );
  let html = marked.parse(src, { async: false });
  html = html.replace(/<table>/g, '<table class="comparison-table">');
  html = html.replace(/<a\s+href="([^"]+)"([^>]*)>/g, (match, href, rest) => {
    const isExternal = /^https?:\/\//i.test(href) && !href.includes(SITE_DOMAIN);
    if (!isExternal) return match;
    if (/rel=/.test(rest)) return match;
    return `<a href="${href}"${rest} target="_blank" rel="nofollow noopener noreferrer">`;
  });
  return html.trim();
}

// Reduce the old (often fabricated) HTML to plain text just so the model knows
// the topic scope — we explicitly tell it NOT to trust any numbers in it.
function htmlToText(html) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// ---- The rewrite prompt — anti-fabrication is the whole point -------------

function buildRewritePrompt(post) {
  const oldText = htmlToText(post.contentHtml || post.contentMarkdown).slice(0, 2500);
  return `You are rewriting a travel article for TripTravelingGuide.com. The site was penalized by Google for THIN, FABRICATED content (invented prices, fake names, no real experience). Your job is to produce an honest, genuinely helpful replacement that a human editor will then fact-check.

TOPIC: ${post.title}
TARGET SEARCH KEYWORD (use naturally, don't stuff): ${post.primaryKeyword || post.title}

The OLD article's text is below FOR TOPIC SCOPE ONLY. Treat every specific number, price, date, timing, name, and "fact" in it as UNVERIFIED and probably fabricated — do NOT copy any of them.
--- OLD TEXT START ---
${oldText}
--- OLD TEXT END ---

ABSOLUTE RULES (this is a penalized domain — breaking these makes it worse):
1. NEVER invent a specific price, fee, ticket cost, timing, phone number, date, distance, or official name. If a specific current fact would help the reader, DO NOT guess it — instead insert a marker in EXACTLY this format on its own line:
   [HUMAN INPUT NEEDED: <precise instruction, e.g. "confirm the current adult entry fee from the official Sundarban forest department site">]
   Include at least 4 such markers: at least one for a photo, one for a current price/fee/timing, one for first-hand/on-the-ground experience, and one for an official source to cite.
2. Write what is genuinely, durably TRUE and useful: how to plan the trip, what to expect, how to get there, best time to go, practical tips, common mistakes, who it suits. Depth over padding.
3. Link 2-3 AUTHORITATIVE official sources inline as [anchor](https://...) — official tourism boards, government (.gov / .gov.in) advisories, or the official operator/park site. Real, well-known URLs only. No blogs, no affiliates, never a link list at the bottom.
4. Natural, specific, human English (Flesch 60+). No hype, no "#1/best in the world" superlatives, no AI filler ("in conclusion", "in today's fast-paced world", "nestled").

STRUCTURE (markdown):
- Hook intro (80-120 words) naming the real decision/question the reader has.
- A short "Quick answer" / key-facts block (use a markdown table where it fits — but put [HUMAN INPUT NEEDED: ...] in any cell whose value is a live number you must not invent).
- 4-6 H2 sections (## ), each 150-250 words with at least one concrete, verifiable-in-principle detail or a marker where a live figure belongs.
- A "Who should visit / is this worth it" or persona section with direct recommendations.
- FAQ block: 4-6 real questions travelers search, each "### Question" then a straight answer (marker if the answer needs a live figure).

Length 900+ words. Output ONLY the raw markdown body — no JSON, no code fences, no preamble.`;
}

// ---- Main -----------------------------------------------------------------

async function rewriteOne(post) {
  const md = stripCodeFences(await generateText(buildRewritePrompt(post))).trim();
  const markers = extractMarkers(md);
  const wordCount = md.split(/\s+/).filter(Boolean).length;
  const html = markdownToHtml(md);
  return { md, html, markers, wordCount };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let pickSlugs = args.slugs.length ? args.slugs : DEFAULT_PICKS;
  if (args.limit && Number.isFinite(args.limit)) pickSlugs = pickSlugs.slice(0, args.limit);

  console.log(`\nSafe rewrite drip — ${pickSlugs.length} draft(s), nothing will be published.\n`);

  // Load originals (skip any that are themselves already __rewrite drafts).
  const originals = await prisma.article.findMany({
    where: { slug: { in: pickSlugs } },
  });
  const bySlug = new Map(originals.map((o) => [o.slug, o]));
  const missing = pickSlugs.filter((s) => !bySlug.has(s));
  if (missing.length) console.warn(`⚠ Not found (skipped): ${missing.join(", ")}`);

  // Backup originals to disk before doing anything (insurance; live rows are
  // never modified by this script, but keep a snapshot anyway).
  const here = dirname(fileURLToPath(import.meta.url));
  const backupDir = join(here, "backups");
  mkdirSync(backupDir, { recursive: true });
  // Date.now() is fine in a plain node script (not a workflow).
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = join(backupDir, `rewrite-originals-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify(originals, null, 2));
  console.log(`Backed up ${originals.length} original row(s) → ${backupPath}\n`);

  let ok = 0;
  for (const slug of pickSlugs) {
    const post = bySlug.get(slug);
    if (!post) continue;
    try {
      process.stdout.write(`• ${slug} … generating`);
      const { md, html, markers, wordCount } = await rewriteOne(post);
      const draftSlug = `${slug}${REWRITE_SUFFIX}`;

      // Upsert the DRAFT sibling. Live original row (`slug`) is untouched.
      await prisma.article.upsert({
        where: { slug: draftSlug },
        create: {
          title: post.title,
          slug: draftSlug,
          status: "draft", // NOT published — invisible to the live site
          primaryKeyword: post.primaryKeyword || post.title,
          contentMarkdown: md,
          contentHtml: html,
          wordCount,
          metaTitle: post.metaTitle || post.title,
          metaDescription: post.metaDescription || "",
          comparisonType: post.comparisonType || "destination",
          categoryName: post.categoryName || "",
          categorySlug: post.categorySlug || "",
          tags: post.tags || "",
          source: "ai-rewrite",
          needsRewrite: false,
          qualityNote: `rewrite-of:${slug}`, // pointer back to the live post
        },
        update: {
          contentMarkdown: md,
          contentHtml: html,
          wordCount,
          status: "draft",
          source: "ai-rewrite",
          qualityNote: `rewrite-of:${slug}`,
        },
      });

      // Refresh the human-input gates for this draft.
      const draft = await prisma.article.findUnique({ where: { slug: draftSlug } });
      await prisma.humanInputMarker.deleteMany({ where: { articleId: draft.id } });
      if (markers.length) {
        await prisma.humanInputMarker.createMany({
          data: markers.map((m) => ({
            articleId: draft.id,
            markerType: m.markerType,
            markerText: m.markerText,
            resolved: false,
          })),
        });
      }

      ok++;
      console.log(
        `\r• ${slug} → ${draftSlug}  (${wordCount} words, ${markers.length} human-input gates) ✓`
      );
    } catch (e) {
      console.log(`\r• ${slug}  -- FAILED: ${e.message}`);
    }
  }

  console.log(
    `\nDone. ${ok}/${pickSlugs.length} draft(s) created with status="draft".` +
      `\nNothing is live. Review each draft in the dashboard, resolve every` +
      `\n[HUMAN INPUT NEEDED] gate (real prices/photos/experience), then promote` +
      `\nit onto the live slug and publish — max ~5 per week.\n`
  );

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Fatal:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
