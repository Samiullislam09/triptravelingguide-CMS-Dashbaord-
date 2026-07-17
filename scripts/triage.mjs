// Prune/rewrite triage: dump every article with the signals a human needs to
// decide keep vs rewrite vs delete. Read-only — this script never writes.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rows = await prisma.article.findMany({
  select: {
    slug: true,
    title: true,
    status: true,
    wordCount: true,
    needsRewrite: true,
    qualityNote: true,
    coverImageUrl: true,
    categoryName: true,
    publishedAt: true,
    source: true,
  },
  orderBy: [{ needsRewrite: "desc" }, { wordCount: "asc" }],
});

const esc = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

console.log(`TOTAL: ${rows.length}`);
console.log(`needsRewrite: ${rows.filter((r) => r.needsRewrite).length}`);
console.log(`published:    ${rows.filter((r) => r.status === "published").length}`);
console.log(`no cover:     ${rows.filter((r) => !r.coverImageUrl).length}`);
console.log("");
console.log(
  ["slug", "words", "status", "cover", "flag", "category", "note"].join("\t")
);
for (const r of rows) {
  console.log(
    [
      r.slug,
      r.wordCount,
      r.status,
      r.coverImageUrl ? "Y" : "-",
      r.needsRewrite ? "FLAG" : "-",
      esc(r.categoryName) || "-",
      esc(r.qualityNote).slice(0, 90) || "-",
    ].join("\t")
  );
}

await prisma.$disconnect();
