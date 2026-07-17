import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
const prisma = new PrismaClient();
const a = await prisma.article.findUnique({ where: { slug: process.argv[2] } });
writeFileSync(process.argv[3], a.contentHtml, "utf8");
console.log("wrote", process.argv[3], a.contentHtml.length, "chars");
await prisma.$disconnect();
