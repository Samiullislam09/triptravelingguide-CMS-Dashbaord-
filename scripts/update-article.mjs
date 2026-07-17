import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
const prisma = new PrismaClient();
const [slug, file] = process.argv.slice(2);
const html = readFileSync(file, "utf8");
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const a = await prisma.article.update({
  where: { slug },
  data: {
    contentHtml: html,
    wordCount: text.split(" ").length,
    coverImageUrl: "https://etuqhwpyfdpkgykexhnb.supabase.co/storage/v1/object/public/post-images/articles/cordelia-cruise-food-dining/buffet-cover.jpg",
    coverImageAlt: "Buffet counter filled with hot dishes, salads and desserts",
    thumbnailUrl: "https://etuqhwpyfdpkgykexhnb.supabase.co/storage/v1/object/public/post-images/articles/cordelia-cruise-food-dining/buffet-cover.jpg",
    thumbnailStatus: "approved",
  },
});
console.log(JSON.stringify({ slug: a.slug, wordCount: a.wordCount, cover: a.coverImageUrl, status: a.status }, null, 1));
await prisma.$disconnect();
