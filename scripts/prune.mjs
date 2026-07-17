// Prune step of the HCU recovery: take dead pages off the live site.
//
// This does NOT delete rows. It backs every target up to scripts/backups/ in
// full (contentHtml included) and then flips status published -> "pruned".
// The frontend only reads status="published", so a pruned post 404s, which is
// what we want Google to see. Restore is `node scripts/prune.mjs --restore <file>`.
//
// Dry run by default. Pass --apply to actually write.
import { PrismaClient } from "@prisma/client";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const restoreIdx = process.argv.indexOf("--restore");

// Expired-seasonal + dated posts. The date IS the keyword here, so there is no
// rewrite that saves them: nobody searches a 2024-25 winter forecast in 2026.
// The US-weather ones are additionally unwinnable (NOAA/AccuWeather own those
// SERPs) and are the bulk of what got the site classified as thin.
const PRUNE = [
  "snow-predictions-for-maryland-2024-2025", // superseded by the 2025-2026 post
  "pennsylvania-snow-predictions",
  "pittsburgh-winter-forecast-2024-2025",
  "europe-winter-weather-forecast-2024-2025",
  "snow-prediction-chicago-2024-2025",
  "snow-predictions-for-georgia-2024-2025",
  "will-it-snow-again-in-georgia-2025",
  "washington-d-c-snow-predictions-2024-2025",
  "snow-predictions-for-february-2025-east-coast-usa",
  "snow-predictions-for-tennessee-2024-2025",
  "bar-harbor-cruise-ship-schedule-2024-2025", // a 2024-25 port schedule, now wrong
  "costco-travel-cruises-2023-2024",
  "european-river-cruises-2024",
];
// Deliberately NOT pruned: the 2025-2026 forecasts. Their season is still ahead,
// so they are not expired — they are the one US-weather thing still in date.

// Zero-content stubs. `untitled-post-mrkn3fwb` sits at status="approved" with 0
// words, i.e. one click away from publishing an empty page.
const STUBS = ["untitled-post-mrkn3fwb", "untitled-post-mrjm4h22"];

async function restore(file) {
  const rows = JSON.parse(readFileSync(file, "utf8"));
  for (const r of rows) {
    await prisma.article.update({
      where: { slug: r.slug },
      data: { status: r.status },
    });
    console.log(`restored ${r.slug} -> ${r.status}`);
  }
}

if (restoreIdx !== -1) {
  await restore(process.argv[restoreIdx + 1]);
  await prisma.$disconnect();
  process.exit(0);
}

const targets = [...PRUNE, ...STUBS];
const rows = await prisma.article.findMany({ where: { slug: { in: targets } } });

const missing = targets.filter((s) => !rows.some((r) => r.slug === s));
if (missing.length) console.log(`WARNING not found: ${missing.join(", ")}\n`);

for (const r of rows) {
  console.log(`${apply ? "PRUNE" : "would prune"}  ${r.status.padEnd(14)} ${r.wordCount.toString().padStart(5)}w  ${r.slug}`);
}
console.log(`\n${rows.length} posts (${rows.filter((r) => r.status === "published").length} currently live)`);

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write.");
  await prisma.$disconnect();
  process.exit(0);
}

mkdirSync("scripts/backups", { recursive: true });
const stamp = process.env.STAMP || "prune";
const file = `scripts/backups/${stamp}.json`;
writeFileSync(file, JSON.stringify(rows, null, 2));
console.log(`\nBacked up ${rows.length} full rows -> ${file}`);

const res = await prisma.article.updateMany({
  where: { slug: { in: rows.map((r) => r.slug) } },
  data: { status: "pruned" },
});
console.log(`Pruned ${res.count} posts. Restore: node --env-file=.env scripts/prune.mjs --restore ${file}`);

await prisma.$disconnect();
