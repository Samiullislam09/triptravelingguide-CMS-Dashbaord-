import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishToWordPress } from "@/lib/wordpress";

// POST /api/articles/[id]/publish
// Module 8 — only allowed on articles already in "approved" status.
// Creates the post on WordPress as a draft (second safety layer per PDF Section 10.1).
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const article = await prisma.article.findUnique({ where: { id: params.id } });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // AI posts must pass the human-approval gate. Manually-written CMS posts can
  // be published directly once they have content.
  if (article.source !== "manual" && article.status !== "approved") {
    return NextResponse.json(
      { error: "Article must be approved before it can be sent to WordPress." },
      { status: 422 }
    );
  }

  if (!article.contentHtml.trim()) {
    return NextResponse.json(
      { error: "Post has no content yet — write something before publishing." },
      { status: 422 }
    );
  }

  // Body decides draft vs live. Defaults to "draft" (PDF safety layer).
  let mode: "draft" | "publish" = "draft";
  try {
    const body = await request.json();
    if (body?.mode === "publish") mode = "publish";
  } catch {
    // no body — keep default draft
  }

  try {
    const result = await publishToWordPress({
      title: article.metaTitle || article.title,
      content: article.contentHtml,
      slug: article.slug,
      status: mode,
      excerpt: article.metaDescription,
      tags: article.tags ? article.tags.split(",").map((t) => t.trim()) : [],
      seo: {
        focusKeyword: article.primaryKeyword,
        metaTitle: article.metaTitle || article.title,
        metaDescription: article.metaDescription,
      },
    });

    const updated = await prisma.article.update({
      where: { id: params.id },
      data: {
        status: "published",
        publishedAt: new Date(),
        wordpressPostId: result.postId,
        wordpressUrl: result.editUrl,
      },
    });

    return NextResponse.json({ article: updated, wordpress: { ...result, mode } });
  } catch (error: any) {
    console.error("WordPress publish error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish to WordPress" },
      { status: 500 }
    );
  }
}
