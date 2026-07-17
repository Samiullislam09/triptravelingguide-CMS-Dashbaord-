import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const slugs = process.argv.slice(2);
const rows = await prisma.article.findMany({
  where: { slug: { in: slugs } },
  select: { slug: true, categoryName: true, categorySlug: true, publishedAt: true, status: true },
});
console.log(JSON.stringify(rows, null, 1));
await prisma.$disconnect();
