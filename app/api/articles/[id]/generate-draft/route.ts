import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateTitles,
  generateArticleDraft,
  generateSeoAndThumbnail,
} from "@/lib/contentPipeline";
import { markdownToHtml } from "@/lib/markdown";

// POST /api/articles/[id]/generate-draft
// Runs Modules 2, 3, 4, 6 in sequence for one article:
// title options -> 700+ word draft with HUMAN INPUT markers -> SEO meta + thumbnail prompt.
// Ends with status = "pending_review", ready for the human gate (Module 7).
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.article.findUnique({ where: { id: params.id } });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Module 2 — Title generation
    const titles = await generateTitles(article.title, article.primaryKeyword);

    // Module 3 — Content generation (700+ words, structured, with HUMAN INPUT markers)
    const draft = await generateArticleDraft(
      titles.metaTitle,
      article.primaryKeyword,
      article.comparisonType
    );

    // Module 4 (partial) + Module 6 — SEO meta + thumbnail prompt
    const seo = await generateSeoAndThumbnail(
      titles.metaTitle,
      article.primaryKeyword,
      draft.contentMarkdown
    );

    const contentHtml = markdownToHtml(draft.contentMarkdown);

    // Replace existing markers for this article (in case of regeneration)
    await prisma.humanInputMarker.deleteMany({ where: { articleId: article.id } });

    const updated = await prisma.article.update({
      where: { id: article.id },
      data: {
        title: titles.metaTitle,
        slug: seo.slug || article.slug,
        contentMarkdown: draft.contentMarkdown,
        contentHtml,
        wordCount: draft.wordCount,
        metaTitle: titles.metaTitle,
        metaDescription: seo.metaDescription,
        featuredImagePrompt: seo.featuredImagePrompt,
        readabilityScore: seo.readabilityScore,
        primaryKeyword: seo.focusKeyword || article.primaryKeyword,
        tags: (seo.tags || []).join(", "),
        titleAlternatives: JSON.stringify([
          titles.direct,
          titles.question,
          titles.benefitLed,
        ]),
        status: "pending_review",
        humanInputMarkers: {
          create: draft.humanInputMarkers.map((m) => ({
            markerType: m.markerType,
            markerText: m.markerText,
            resolved: false,
          })),
        },
      },
      include: { humanInputMarkers: true },
    });

    return NextResponse.json({
      article: updated,
      titleOptions: titles,
    });
  } catch (error: any) {
    console.error("Draft generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate draft" },
      { status: 500 }
    );
  }
}
