// Does a slug/title exist in the DB at all? Used to check whether GA4's
// top-earning pages survived the WordPress migration.
// Usage: node --env-file=.env scripts/find-slugs.mjs virginia "north carolina" kentucky
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const terms = process.argv.slice(2);

for (const t of terms) {
  const hits = await prisma.article.findMany({
    where: {
      OR: [
        { slug: { contains: t.replace(/\s+/g, "-"), mode: "insensitive" } },
        { title: { contains: t, mode: "insensitive" } },
      ],
    },
    select: { slug: true, status: true, wordCount: true },
  });
  console.log(
    `${t.padEnd(20)} ${hits.length === 0 ? "*** NOT IN DB ***" : hits.map((h) => `${h.slug} (${h.status})`).join(", ")}`
  );
}

await prisma.$disconnect();
