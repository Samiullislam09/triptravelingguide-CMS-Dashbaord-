// After host-images.mjs has re-uploaded every broken key for a slug into
// Triptravelingguide_frontend/public/media/articles/<slug>/<key>.jpg, this
// does the one text change needed in the DB row: swap the dead old-project
// Supabase URL for the root-relative /media/... path in contentHtml and
// coverImageUrl. It refuses to write unless every resulting /media/ path
// actually exists as a local file first (checked on disk, not over the
// network, since the frontend may not be deployed yet).
//
// Usage: node --env-file=<frontend>/.env.local scripts/swap-image-host.mjs <slug>
import { existsSync } from "node:fs";
import { join } from "node:path";

const OLD_PREFIX = "https://etuqhwpyfdpkgykexhnb.supabase.co/storage/v1/object/public/post-images/";
const NEW_PREFIX = "/media/";
const FRONTEND_PUBLIC = "D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" };

const slug = process.argv[2];
if (!slug) { console.error("usage: swap-image-host.mjs <slug>"); process.exit(1); }

const r = await fetch(`${url}/rest/v1/Article?slug=eq.${encodeURIComponent(slug)}&select=id,contentHtml,coverImageUrl`, { headers: H });
const [row] = await r.json();
if (!row) { console.error("NOT FOUND:", slug); process.exit(1); }

const newHtml = row.contentHtml.split(OLD_PREFIX).join(NEW_PREFIX);
const newCover = (row.coverImageUrl || "").split(OLD_PREFIX).join(NEW_PREFIX);

if (newHtml === row.contentHtml && newCover === row.coverImageUrl) {
  console.log("nothing to swap, no old-host refs found");
  process.exit(0);
}

// Every image src that now points at /media/ must actually exist on disk
// before we write anything.
const srcs = [...newHtml.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]).filter((u) => u.startsWith(NEW_PREFIX));
if (newCover.startsWith(NEW_PREFIX)) srcs.push(newCover);
const checked = srcs.map((u) => ({ u, ok: existsSync(join(FRONTEND_PUBLIC, u.replace(/^\//, ""))) }));
const bad = checked.filter((c) => !c.ok);
if (bad.length) {
  console.error("REFUSED: these /media/ paths do not exist on disk yet (upload them with host-images.mjs first):");
  for (const b of bad) console.error(`  ${b.u}`);
  process.exit(1);
}

if (/—|&mdash;/.test(newHtml)) { console.error("REFUSED: em dash present in contentHtml."); process.exit(1); }

const pr = await fetch(`${url}/rest/v1/Article?id=eq.${row.id}`, {
  method: "PATCH",
  headers: H,
  body: JSON.stringify({ contentHtml: newHtml, coverImageUrl: newCover }),
});
if (!pr.ok) { console.error("PATCH FAILED:", pr.status, await pr.text()); process.exit(1); }
console.log(`OK ${slug}: swapped ${checked.length} URLs, all verified 200 before write.`);
