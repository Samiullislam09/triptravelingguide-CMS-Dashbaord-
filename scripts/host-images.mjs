// Download picked Unsplash/Wikimedia photos, resize, and write them straight
// into the frontend's public/media/ folder as static files.
//
// Used to upload to Supabase `post-images`, but Supabase's Free plan serves
// every public object with Cache-Control: no-cache regardless of the
// cacheControl set at upload time (verified directly), so every pageview and
// crawler hit re-fetched every image from origin. That drove the org's egress
// to 202% of its free-tier quota. See the "Move CMS-uploaded images from
// Supabase to public/media" commit in the frontend repo. Vercel's own
// /_next/image optimizer is not an alternative either: it already broke every
// image site-wide once when its transformation quota ran out (unoptimized:
// true in next.config.mjs). Plain static files under public/ get Vercel's
// ordinary long-lived edge caching with none of that risk.
//
// Usage: node --env-file=.env scripts/host-images.mjs [--portrait] <slug> <key>=<source> ...
//   node --env-file=.env scripts/host-images.mjs cordelia-cruise-rules cover=1502301197179-65228ab57f78
//
// <source> is any of three things:
//   - a bare Unsplash photo id (the part after "photo-" in an images.unsplash.com URL)
//   - a full https:// URL (Wikimedia Commons, etc.)
//   - a path to a local file already on disk
//
// Prints the root-relative /media/... URL to use in contentHtml /
// coverImageUrl. After running this, `git add public/media`, commit and push
// the frontend repo, same as any other content change.
import sharp from "sharp";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const FRONTEND_PUBLIC = "D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public";

// Web Story frames are portrait. storyImage() in the frontend appends Unsplash
// crop params that static files ignore, so a story image has to be stored at
// the right aspect ratio already or AMP letterboxes it.
const args = process.argv.slice(2);
const portrait = args.includes("--portrait");
const [slug, ...pairs] = args.filter((a) => a !== "--portrait");
const [W, H] = portrait ? [720, 1280] : [1200, 675];
if (!slug || pairs.length === 0) {
  console.error("usage: host-images.mjs [--portrait] <slug> <key>=<photo-id> ...");
  process.exit(1);
}

const picks = pairs.map((p) => {
  const [key, id] = p.split("=");
  if (!key || !id) {
    console.error(`bad pair: ${p} (expected key=photo-id)`);
    process.exit(1);
  }
  return { key, id };
});

let failed = 0;
for (const p of picks) {
  // Unsplash has no photo of most places we write about. Wikimedia Commons often
  // does, under CC0/CC-BY, and a real photo of the actual place beats generic
  // stock. So accept a full URL in place of a bare Unsplash id.
  //
  // Also accept a LOCAL FILE PATH. Every candidate has to be opened and looked at
  // before it ships anyway (a "Deep Creek Lake in December" photo turned out to
  // have no snow in it), so the file is usually already on disk by then. Reusing
  // it avoids a second download, and Wikimedia rate-limits (HTTP 429) repeat
  // fetches hard.
  let raw;
  if (/^https?:\/\//.test(p.id) || !existsSync(p.id)) {
    const src = /^https?:\/\//.test(p.id)
      ? p.id
      : `https://images.unsplash.com/photo-${p.id}?w=1600&q=85&fm=jpg`;
    // Wikimedia's policy asks for a descriptive agent with a contact route.
    const res = await fetch(src, {
      headers: {
        "User-Agent":
          "TripTravelingGuide/1.0 (https://triptravelingguide.com; musab@cgheven.com)",
      },
    });
    if (!res.ok) {
      console.error(`FAIL ${p.key}: HTTP ${res.status}`);
      failed++;
      continue;
    }
    raw = Buffer.from(await res.arrayBuffer());
  } else {
    raw = readFileSync(p.id);
  }
  const out = await sharp(raw).resize(W, H, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
  const relPath = `media/articles/${slug}/${p.key}.jpg`;
  const dest = join(FRONTEND_PUBLIC, relPath);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, out);
  console.log(`${p.key}\t${out.length}B\t/${relPath}`);
}

if (!failed) {
  console.log(
    `\nWritten to public/media. Now in the frontend repo: git add public/media, commit, and push.`
  );
}
process.exit(failed ? 1 : 0);
