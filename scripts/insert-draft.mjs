// One-off: insert a hand-written article as a pending_review DRAFT (no auto-publish).
// Usage:  node --env-file=.env scripts/insert-draft.mjs <path-to-html> <slug>
// Reads the HTML body, computes wordCount, and creates the Article row via Prisma.
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const [, , htmlPath, slugArg] = process.argv;
if (!htmlPath || !slugArg) {
  console.error("Usage: node --env-file=.env scripts/insert-draft.mjs <html> <slug>");
  process.exit(1);
}

const contentHtml = readFileSync(htmlPath, "utf8");
const text = contentHtml.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
const wordCount = text ? text.split(" ").length : 0;

const prisma = new PrismaClient();

const data = {
  title: "Is Food Included on Cordelia Cruise? Dining Guide",
  slug: slugArg,
  status: "pending_review", // editable draft in the CMS — human approves before publish
  source: "manual",
  comparisonType: "stay",
  primaryKeyword: "cordelia cruise food",
  metaTitle: "Cordelia Cruise Food & Dining: What's Free vs Paid (2026)",
  metaDescription:
    "On Cordelia Cruise, buffet meals at Starlight and Food Court are included; Chopstix, the grill and all drinks cost extra. Full food, dining and price guide.",
  contentHtml,
  contentMarkdown: "",
  wordCount,
  categoryName: "Cruises",
  categorySlug: "cruises",
  coverImageAlt: "Buffet dining spread on board a Cordelia cruise ship",
  tags: "cordelia cruise, cordelia cruise food, cruise dining, cordelia menu, cruise from india",
  needsRewrite: false,
};

async function main() {
  const existing = await prisma.article.findUnique({ where: { slug: slugArg } });
  if (existing) {
    console.log(`SKIP: a post with slug "${slugArg}" already exists (id ${existing.id}, status ${existing.status}). Nothing inserted.`);
    return;
  }
  const article = await prisma.article.create({ data });
  console.log(JSON.stringify({ id: article.id, slug: article.slug, status: article.status, wordCount: article.wordCount, title: article.title }, null, 2));
}

main()
  .catch((e) => {
    console.error("INSERT FAILED:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
