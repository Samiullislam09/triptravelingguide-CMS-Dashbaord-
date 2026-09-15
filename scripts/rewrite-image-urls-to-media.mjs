// Rewrites every Supabase post-images URL in the DB (contentHtml,
// coverImageUrl, thumbnailUrl) to the root-relative /media/... path now that
// export-images-to-frontend.mjs has copied every object into the frontend's
// public/media/ folder. See fix-image-cache-headers.mjs and
// export-images-to-frontend.mjs for why: Supabase's Free plan always serves
// public objects with Cache-Control: no-cache, so every request re-fetched
// from origin and drove egress to 202% of quota.
//
// Uses the REST API directly (not Prisma): the pooler at
// aws-0-ap-southeast-1.pooler.supabase.com:6543 has been intermittently
// unreachable from this machine all session; the REST endpoint (443) has not.
//
// Usage: node --env-file=.env scripts/rewrite-image-urls-to-media.mjs [--apply]
const OLD_PREFIX = "https://barkirfhlwkazxewhemt.supabase.co/storage/v1/object/public/post-images/";
const NEW_PREFIX = "/media/";
const apply = process.argv.includes("--apply");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" };

function rewrite(s) {
  if (!s) return s;
  return s.split(OLD_PREFIX).join(NEW_PREFIX);
}

async function main() {
  const q = `${url}/rest/v1/Article?or=(contentHtml.ilike.*${encodeURIComponent(OLD_PREFIX)}*,coverImageUrl.ilike.*${encodeURIComponent(OLD_PREFIX)}*,thumbnailUrl.ilike.*${encodeURIComponent(OLD_PREFIX)}*)&select=id,slug,contentHtml,coverImageUrl,thumbnailUrl`;
  const res = await fetch(q, { headers: H });
  const articles = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(articles));

  console.log(`${articles.length} articles reference the old Supabase URL.\n`);

  for (const a of articles) {
    const newContentHtml = rewrite(a.contentHtml);
    const newCover = rewrite(a.coverImageUrl);
    const newThumb = rewrite(a.thumbnailUrl);
    const imgCount = (a.contentHtml.split(OLD_PREFIX).length - 1);
    console.log(`${a.slug}: ${imgCount} content image(s)${a.coverImageUrl?.startsWith(OLD_PREFIX) ? " + cover" : ""}${a.thumbnailUrl?.startsWith(OLD_PREFIX) ? " + thumbnail" : ""}`);
    if (apply) {
      const r = await fetch(`${url}/rest/v1/Article?id=eq.${a.id}`, {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ contentHtml: newContentHtml, coverImageUrl: newCover, thumbnailUrl: newThumb }),
      });
      if (!r.ok) console.error(`  FAILED to update ${a.slug}: ${await r.text()}`);
    }
  }

  if (!apply) console.log("\nDRY RUN. Re-run with --apply to write these changes.");
  else console.log(`\nUPDATED ${articles.length} articles.`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
