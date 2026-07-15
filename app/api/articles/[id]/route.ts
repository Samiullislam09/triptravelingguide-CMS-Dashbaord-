import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/apiError";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";
import { markdownToHtml } from "@/lib/markdown";

// GET /api/articles/[id] — fetch one article with its markers and links
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      include: {
        humanInputMarkers: true,
        externalLinks: true,
        internalLinks: { include: { targetArticle: true } },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    return apiError(error);
  }
}

// PATCH /api/articles/[id] — edit content, or resolve/unresolve a marker
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const body = await request.json();

  if (body.action === "resolve_marker") {
    await prisma.humanInputMarker.update({
      where: { id: body.markerId },
      data: { resolved: body.resolved, resolvedAt: body.resolved ? new Date() : null },
    });
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      include: { humanInputMarkers: true },
    });
    return NextResponse.json({ article });
  }

  if (body.action === "edit_content") {
    // Always (re)derive HTML from markdown server-side so WordPress never
    // receives raw "##"/"**" — the previous bug shipped markdown as HTML.
    const article = await prisma.article.update({
      where: { id: params.id },
      data: {
        contentMarkdown: body.contentMarkdown,
        contentHtml: markdownToHtml(body.contentMarkdown),
        wordCount: body.contentMarkdown.trim().split(/\s+/).length,
      },
    });
    await prisma.reviewLog.create({
      data: {
        articleId: params.id,
        action: "edit",
        timeSpentSeconds: body.timeSpentSeconds || 0,
      },
    });
    return NextResponse.json({ article });
  }

  // WYSIWYG editor saves HTML directly (TipTap output is the source of truth).
  if (body.action === "save_html") {
    const html: string = body.contentHtml || "";
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const wordCount = text ? text.split(" ").length : 0;
    const article = await prisma.article.update({
      where: { id: params.id },
      data: { contentHtml: html, wordCount },
    });
    await prisma.reviewLog.create({
      data: {
        articleId: params.id,
        action: "edit",
        timeSpentSeconds: body.timeSpentSeconds || 0,
      },
    });
    return NextResponse.json({ article });
  }

  // Edit post metadata (title, SEO, tags) from the editor.
  if (body.action === "update_meta") {
    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.metaTitle === "string") data.metaTitle = body.metaTitle;
    if (typeof body.metaDescription === "string")
      data.metaDescription = body.metaDescription;
    if (typeof body.primaryKeyword === "string")
      data.primaryKeyword = body.primaryKeyword;
    if (typeof body.tags === "string") data.tags = body.tags;
    if (typeof body.categoryName === "string") data.categoryName = body.categoryName;
    if (typeof body.categorySlug === "string") data.categorySlug = body.categorySlug;
    // Slug is @unique — normalize and guard against collisions so a bad edit
    // returns a clear 409 instead of an opaque Prisma error.
    if (typeof body.slug === "string" && body.slug.trim()) {
      const slug = body.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (slug) {
        const clash = await prisma.article.findFirst({
          where: { slug, NOT: { id: params.id } },
          select: { id: true },
        });
        if (clash) {
          return NextResponse.json(
            { error: `Slug "${slug}" is already used by another post.` },
            { status: 409 }
          );
        }
        data.slug = slug;
      }
    }
    if (
      typeof body.comparisonType === "string" &&
      ["destination", "transport", "stay"].includes(body.comparisonType)
    )
      data.comparisonType = body.comparisonType;
    const article = await prisma.article.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ article });
  }

  if (body.action === "delete") {
    await prisma.article.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return apiError(error);
  }
}
