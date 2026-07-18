// Replace the body of an EXISTING article in place, keeping its slug and its
// published state. This is the rewrite path for pages that already rank: moving
// them back to pending_review would 404 a live URL and throw away the ranking
// equity the rewrite exists to protect.
//
// Was hardcoded to one post (cordelia-cruise-food-dining). Now takes a meta.json
// like insert-draft.mjs, so every rewrite in the top-20 queue can use it.
//
// Dry run by default. Nothing is written without --apply, and --apply backs the
// current row up to scripts/backups/ first.
//
// Usage:
//   node --env-file=.env scripts/update-article.mjs <meta.json>
//   node --env-file=.env scripts/update-article.mjs <meta.json> --apply
//   node --env-file=.env scripts/update-article.mjs --restore scripts/backups/<file>.json
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const argv = process.argv.slice(2);

async function restore(file) {
  const row = JSON.parse(readFileSync(file, "utf8"));
  await prisma.article.update({ where: { id: row.id }, data: row.before });
  console.log(`RESTORED ${row.before.slug} from ${file}`);
}

async function main() {
  const restoreIdx = argv.indexOf("--restore");
  if (restoreIdx !== -1) return restore(argv[restoreIdx + 1]);

  const apply = argv.includes("--apply");
  const metaPath = argv.find((a) => !a.startsWith("--"));
  if (!metaPath) {
    console.error("Usage: update-article.mjs <meta.json> [--apply]");
    process.exit(1);
  }

  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  const { htmlPath, slug, ...fields } = meta;
  if (!htmlPath || !slug) {
    console.error("meta.json must set slug and htmlPath");
    process.exit(1);
  }

  const contentHtml = readFileSync(resolve(dirname(metaPath), htmlPath), "utf8");

  // Same house rule the insert path enforces. Fail closed rather than let one
  // reach a live page, where it would have to be caught by eye.
  if (/—|&mdash;/.test(contentHtml)) {
    console.error("REFUSED: draft contains an em dash. Rewrite the sentence.");
    process.exit(1);
  }

  const wordCount = contentHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ").length;

  const existing = await prisma.article.findUnique({ where: { slug } });
  if (!existing) {
    console.error(`NOT FOUND: no article with slug "${slug}". Use insert-draft.mjs for new posts.`);
    process.exit(1);
  }

  // Bumping publishedAt is what moves dateModified and the sitemap lastmod, so
  // do it only because the content really changed, which for a rewrite it has.
  const data = { ...fields, contentHtml, wordCount, needsRewrite: false, publishedAt: new Date() };

  console.log(`slug          ${slug}`);
  console.log(`status        ${existing.status} (unchanged)`);
  console.log(`words         ${existing.wordCount} -> ${wordCount}`);
  console.log(`title         ${existing.title}`);
  console.log(`           -> ${data.title ?? existing.title}`);
  console.log(`needsRewrite  ${existing.needsRewrite} -> false`);

  if (!apply) {
    console.log("\nDRY RUN. Nothing written. Re-run with --apply to commit.");
    return;
  }

  const stamp = process.env.STAMP || `update-${slug}`;
  mkdirSync("scripts/backups", { recursive: true });
  const backup = `scripts/backups/${stamp}.json`;
  writeFileSync(backup, JSON.stringify({ id: existing.id, before: existing }, null, 2));
  console.log(`\nbacked up to ${backup}`);

  await prisma.article.update({ where: { id: existing.id }, data });
  console.log(`UPDATED ${slug}`);
  console.log(`Restore with: node --env-file=.env scripts/update-article.mjs --restore ${backup}`);
}

main()
  .catch((e) => {
    console.error("FAILED:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
