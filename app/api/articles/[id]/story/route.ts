import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";

import { generateStorySlides } from "@/lib/webstory";

// POST /api/articles/[id]/story
// Turns an article into a 5-7 slide web story (Gemini) and creates the
// WebStory row (status "draft"). Idempotent: calling this again on an article
// that already has a story regenerates its slides in place instead of
// creating a duplicate row.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.article.findUnique({ where: { id: params.id } });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    if (!article.contentMarkdown?.trim()) {
      return NextResponse.json(
        { error: "Article has no content yet — generate the draft first." },
        { status: 400 }
      );
    }

    const slides = await generateStorySlides({
      title: article.title,
      contentMarkdown: article.contentMarkdown,
      contentHtml: article.contentHtml,
      coverImageUrl: article.coverImageUrl,
      primaryKeyword: article.primaryKeyword,
    });

    const existing = await prisma.webStory.findFirst({
      where: { articleId: article.id },
    });

    if (existing) {
      const updated = await prisma.webStory.update({
        where: { id: existing.id },
        data: {
          title: article.title,
          coverImageUrl: article.coverImageUrl || existing.coverImageUrl,
          slides: JSON.stringify(slides),
        },
      });
      return NextResponse.json({ story: { ...updated, slides } });
    }

    const slug = await uniqueStorySlug(article.slug);

    const created = await prisma.webStory.create({
      data: {
        articleId: article.id,
        title: article.title,
        slug,
        coverImageUrl: article.coverImageUrl || "",
        slides: JSON.stringify(slides),
        status: "draft",
        source: "ai",
      },
    });

    return NextResponse.json({ story: { ...created, slides } });
  } catch (error: any) {
    console.error("Web story generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate web story" },
      { status: 500 }
    );
  }
}

/** Ensures `<articleSlug>-story` (the natural slug) is unique, appending -2, -3, … if needed. */
async function uniqueStorySlug(articleSlug: string): Promise<string> {
  const base = `${articleSlug}-story`;
  let candidate = base;
  let n = 1;
  while (await prisma.webStory.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}
