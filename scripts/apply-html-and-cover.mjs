import { readFileSync } from "node:fs";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" };
const [slug, htmlPath, coverAlt] = process.argv.slice(2);
const contentHtml = readFileSync(htmlPath, "utf8");
if (/—|&mdash;/.test(contentHtml)) { console.error("REFUSED: em dash present."); process.exit(1); }

// verify every barkirfhlwkazxewhemt image src resolves before writing
const srcs = [...contentHtml.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]).filter(u => u.includes("barkirfhlwkazxewhemt"));
for (const u of srcs) {
  const r = await fetch(u, { method: "HEAD" });
  if (!r.ok) { console.error("REFUSED: not resolving:", u, r.status); process.exit(1); }
}

const data = { contentHtml };
if (coverAlt) data.coverImageAlt = coverAlt;

const r = await fetch(`${url}/rest/v1/Article?slug=eq.${slug}`, { method: "PATCH", headers: H, body: JSON.stringify(data) });
const body = await r.json();
if (!r.ok) { console.error("FAILED", r.status, JSON.stringify(body)); process.exit(1); }
console.log("OK", slug, "verified", srcs.length, "image URLs before write");
