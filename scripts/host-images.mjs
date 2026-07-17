// Download picked Unsplash photos, resize, and re-host them in Supabase
// `post-images` so the site never hotlinks a third-party CDN.
//
// Usage: node --env-file=.env scripts/host-images.mjs <slug> <key>=<photo-id> ...
//   node --env-file=.env scripts/host-images.mjs cordelia-cruise-rules cover=1502301197179-65228ab57f78
//
// The photo id is the part after "photo-" in an images.unsplash.com URL.
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const [slug, ...pairs] = process.argv.slice(2);
if (!slug || pairs.length === 0) {
  console.error("usage: host-images.mjs <slug> <key>=<photo-id> ...");
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

let failed = 0;
for (const p of picks) {
  const src = `https://images.unsplash.com/photo-${p.id}?w=1600&q=85&fm=jpg`;
  const res = await fetch(src);
  if (!res.ok) {
    console.error(`FAIL ${p.key}: HTTP ${res.status}`);
    failed++;
    continue;
  }
  const raw = Buffer.from(await res.arrayBuffer());
  const out = await sharp(raw).resize(1200, 675, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
  const path = `articles/${slug}/${p.key}.jpg`;
  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, out, { contentType: "image/jpeg", upsert: true });
  if (error) {
    console.error(`UPLOAD FAIL ${p.key}: ${error.message}`);
    failed++;
    continue;
  }
  const url = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
  console.log(`${p.key}\t${out.length}B\t${url}`);
}

process.exit(failed ? 1 : 0);
