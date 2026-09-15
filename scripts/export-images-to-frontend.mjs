// Supabase's Free plan always serves post-images with Cache-Control: no-cache
// on the public object URL, regardless of what cacheControl is set at upload
// time (verified directly: even a brand-new object comes back "no-cache").
// Every pageview and crawler hit re-fetches every image from origin, which is
// what drove egress to 202% of quota. Proper edge caching needs the paid
// "Smart CDN" add-on.
//
// Fix: serve images as static files from the frontend's own `public/` folder
// instead. Vercel serves `public/` assets straight from the same domain with
// its own long-lived edge caching, no transformation step involved (so the
// earlier /_next/image 402-quota outage, see next.config.mjs, does not apply
// here: this is plain static file serving, not the paid optimizer).
//
// This downloads every object out of the `post-images` bucket and writes it
// under Triptravelingguide_frontend/public/media/, preserving its path, so it
// can be committed straight into the frontend repo.
//
// Usage: node --env-file=.env scripts/export-images-to-frontend.mjs
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const BUCKET = "post-images";
const OUT_ROOT = "D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function walk(prefix) {
  const out = [];
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw new Error(`list("${prefix}") failed: ${error.message}`);
  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

async function main() {
  console.log("Listing every object in", BUCKET, "...");
  const files = await walk("");
  console.log(`Found ${files.length} objects. Downloading to ${OUT_ROOT} ...\n`);

  let ok = 0, failed = 0;
  const written = [];
  for (const path of files) {
    const { data: blob, error } = await supabase.storage.from(BUCKET).download(path);
    if (error) {
      console.error(`DOWNLOAD FAIL ${path}: ${error.message}`);
      failed++;
      continue;
    }
    const buf = Buffer.from(await blob.arrayBuffer());
    const dest = join(OUT_ROOT, path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    written.push({ path, size: buf.byteLength });
    ok++;
    if (ok % 20 === 0) console.log(`  ${ok}/${files.length} done...`);
  }
  writeFileSync(join(OUT_ROOT, "..", "media-manifest.json"), JSON.stringify(written, null, 2));
  console.log(`\nDone. ${ok} written, ${failed} failed.`);
  console.log(`Manifest: public/media-manifest.json`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
