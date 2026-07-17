// Insert a hand-written article as a pending_review DRAFT. Never auto-publishes:
// a named human approves it in the CMS before it goes live.
//
// Usage: node --env-file=.env scripts/insert-draft.mjs <meta.json>
//
// meta.json holds every Article field plus `htmlPath` (relative to the json
// file). wordCount is computed from the HTML, never taken from the json.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { PrismaClient } from "@prisma/client";

const [, , metaPath] = process.argv;
if (!metaPath) {
  console.error("Usage: node --env-file=.env scripts/insert-draft.mjs <meta.json>");
  process.exit(1);
}

const meta = JSON.parse(readFileSync(metaPath, "utf8"));
const { htmlPath, ...fields } = meta;
if (!htmlPath) {
  console.error("meta.json must set htmlPath");
  process.exit(1);
}

const contentHtml = readFileSync(resolve(dirname(metaPath), htmlPath), "utf8");
const text = contentHtml
  .replace(/<[^>]+>/g, " ")
  .replace(/&[a-z#0-9]+;/gi, " ")
  .replace(/\s+/g, " ")
  .trim();
const wordCount = text ? text.split(" ").length : 0;

// Em dashes are banned house-wide (WRITING_RULES.md §6). Fail closed rather than
// let one reach the CMS, where it would have to be caught by eye.
if (/—|&mdash;/.test(contentHtml)) {
  console.error("REFUSED: draft contains an em dash. Rewrite the sentence.");
  process.exit(1);
}

const prisma = new PrismaClient();

const data = {
  status: "pending_review",
  source: "manual",
  contentMarkdown: "",
  needsRewrite: false,
  ...fields,
  contentHtml,
  wordCount,
};

async function main() {
  if (data.status === "published") {
    console.error("REFUSED: this script never publishes. Approve in the CMS instead.");
    process.exit(1);
  }
  const existing = await prisma.article.findUnique({ where: { slug: data.slug } });
  if (existing) {
    console.log(
      `SKIP: slug "${data.slug}" already exists (id ${existing.id}, status ${existing.status}). Nothing inserted.`
    );
    return;
  }
  const article = await prisma.article.create({ data });
  console.log(
    JSON.stringify(
      {
        id: article.id,
        slug: article.slug,
        status: article.status,
        wordCount: article.wordCount,
        title: article.title,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error("INSERT FAILED:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
