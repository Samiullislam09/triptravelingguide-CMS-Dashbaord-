// One-off: every image already in `post-images` was uploaded with no explicit
// cacheControl, so Supabase served it as Cache-Control: no-cache and the CDN
// edge never cached it (CF-Cache-Status: MISS on every single request). That
// is what drove egress to 202% of the free-tier quota: every pageview and
// every crawler hit re-fetched every image straight from origin.
//
// host-images.mjs, gen-thumbnail.mjs and build-charts.mjs are fixed to upload
// with cacheControl: "31536000" (1 year) going forward. This script re-uploads
// every EXISTING object with the same bytes but the correct header, without
// needing the original external source again.
//
// Usage: node --env-file=.env scripts/fix-image-cache-headers.mjs [--apply]
// Dry run by default: lists what it would touch and how many bytes.
import { createClient } from "@supabase/supabase-js";

const BUCKET = "post-images";
const apply = process.argv.includes("--apply");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Supabase storage `.list()` is not recursive: it returns files AND
// sub-folders (folders have no `id`) for one path level, so walk it by hand.
async function walk(prefix) {
  const out = [];
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw new Error(`list("${prefix}") failed: ${error.message}`);
  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) {
      out.push(...(await walk(path)));
    } else {
      out.push({ path, contentType: entry.metadata?.mimetype, size: entry.metadata?.size, cacheControl: entry.metadata?.cacheControl });
    }
  }
  return out;
}

async function main() {
  console.log("Listing every object in", BUCKET, "...");
  const files = await walk("");
  console.log(`Found ${files.length} objects.\n`);

  const stale = files.filter((f) => f.cacheControl !== "31536000");
  console.log(`${stale.length} of ${files.length} need re-upload (wrong or missing cacheControl).`);
  if (!apply) {
    for (const f of stale.slice(0, 20)) {
      console.log(`  ${f.path}  (current cacheControl: ${f.cacheControl ?? "none"}, ${f.size ?? "?"}B)`);
    }
    if (stale.length > 20) console.log(`  ... and ${stale.length - 20} more`);
    console.log("\nDRY RUN. Re-run with --apply to fix them.");
    return;
  }

  let ok = 0, failed = 0, totalBytes = 0;
  for (const f of stale) {
    const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(f.path);
    if (dlErr) {
      console.error(`DOWNLOAD FAIL ${f.path}: ${dlErr.message}`);
      failed++;
      continue;
    }
    const buf = Buffer.from(await blob.arrayBuffer());
    totalBytes += buf.byteLength;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(f.path, buf, {
      contentType: f.contentType || "application/octet-stream",
      upsert: true,
      cacheControl: "31536000",
    });
    if (upErr) {
      console.error(`UPLOAD FAIL ${f.path}: ${upErr.message}`);
      failed++;
      continue;
    }
    ok++;
    if (ok % 10 === 0) console.log(`  ${ok}/${stale.length} done...`);
  }
  console.log(`\nDone. ${ok} fixed, ${failed} failed. ~${(totalBytes / 1024 / 1024).toFixed(1)} MB re-uploaded (one-time cost to stop the recurring bleed).`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
