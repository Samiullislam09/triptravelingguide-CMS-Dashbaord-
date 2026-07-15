// One-off: render a brand cover thumbnail for one article, upload it to Supabase
// `post-images`, and set it as the article's cover — WITHOUT the dev server.
//
// NOTE: the production thumbnail route uses next/og (@vercel/og), which works on
// Vercel/Linux but throws "Invalid URL" on this Windows box (a known @vercel/og
// Windows bug). This script renders the SAME brand template via SVG -> PNG with
// sharp so we can mint the cover locally. Visual parity, no @vercel/og.
//
// Usage: node --env-file=.env scripts/gen-thumbnail.mjs <articleId>
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const articleId = process.argv[2];
if (!articleId) {
  console.error("Usage: node --env-file=.env scripts/gen-thumbnail.mjs <articleId>");
  process.exit(1);
}

const WIDTH = 1200, HEIGHT = 630;
const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pickTitleFontSize = (t) => (t.length > 90 ? 44 : t.length > 60 ? 52 : 62);

// Greedy word-wrap to a rough character budget for the given font size.
function wrapTitle(title, fontSize) {
  const perLine = Math.floor(1000 / (fontSize * 0.55)); // ~char width = 0.55*em
  const words = title.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > perLine) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

function renderSvg({ title, category }) {
  const cleanTitle = (title || "Untitled trip guide").trim();
  const cleanCategory = (category || "Travel Guide").trim().toUpperCase();
  const size = pickTitleFontSize(cleanTitle);
  const lines = wrapTitle(cleanTitle, size);
  const lineHeight = Math.round(size * 1.18);
  // Title block is vertically centred-ish in the middle band.
  const blockH = lines.length * lineHeight;
  const startY = Math.round((HEIGHT - blockH) / 2) + size;
  const titleTspans = lines
    .map((ln, i) => `<text x="72" y="${startY + i * lineHeight}" font-family="Arial, sans-serif" font-size="${size}" font-weight="800" letter-spacing="-1" fill="#ffffff">${xml(ln)}</text>`)
    .join("\n    ");

  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Category pill -->
  <rect x="72" y="64" rx="26" ry="26" height="52" width="${72 + cleanCategory.length * 15}" fill="rgba(255,255,255,0.20)"/>
  <text x="${72 + 24}" y="99" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="2" fill="#ffffff">${xml(cleanCategory)}</text>

  <!-- Title -->
  ${titleTspans}

  <!-- Wordmark -->
  <rect x="72" y="${HEIGHT - 106}" rx="12" ry="12" width="42" height="42" fill="rgba(255,255,255,0.22)"/>
  <text x="86" y="${HEIGHT - 76}" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="#ffffff">T</text>
  <text x="128" y="${HEIGHT - 74}" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">TripTravelingGuide</text>
</svg>`;
}

const prisma = new PrismaClient();

async function main() {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new Error(`No article with id ${articleId}`);

  console.log(`Rendering thumbnail for: ${article.title}`);
  const svg = renderSvg({
    title: article.metaTitle || article.title,
    category: article.categoryName || article.comparisonType,
  });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  console.log(`Rendered PNG: ${png.length} bytes`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const path = `thumbnails/${article.id}-${Date.now()}.png`;
  const { error: upErr } = await supabase.storage
    .from("post-images")
    .upload(path, png, { contentType: "image/png", upsert: true });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
  const url = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
  console.log(`Uploaded -> ${url}`);

  const updated = await prisma.article.update({
    where: { id: article.id },
    data: {
      thumbnailUrl: url,
      thumbnailStatus: "approved",
      coverImageUrl: url,
      coverImageAlt: article.coverImageAlt || "Cordelia cruise dining cover image",
    },
  });
  console.log(JSON.stringify({
    id: updated.id, coverImageUrl: updated.coverImageUrl, thumbnailStatus: updated.thumbnailStatus,
  }, null, 2));
}

main()
  .catch((e) => { console.error("FAILED:", e && e.stack ? e.stack : e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
