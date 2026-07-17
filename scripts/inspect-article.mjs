import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const a = await prisma.article.findUnique({ where: { slug: process.argv[2] } });
if (!a) { console.log("NOT FOUND"); process.exit(0); }
console.log(JSON.stringify({
  id: a.id, slug: a.slug, status: a.status, wordCount: a.wordCount,
  coverImageUrl: a.coverImageUrl, coverImageAlt: a.coverImageAlt,
  thumbnailUrl: a.thumbnailUrl, thumbnailStatus: a.thumbnailStatus,
  publishedAt: a.publishedAt, imgTagsInBody: (a.contentHtml.match(/<img/g)||[]).length,
  h2s: [...a.contentHtml.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map(m=>m[1]),
}, null, 2));
await prisma.$disconnect();
