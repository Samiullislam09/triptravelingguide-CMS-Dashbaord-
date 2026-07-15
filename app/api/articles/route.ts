import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/apiError";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";

// GET /api/articles — list all articles, newest first.
// Uses `select` to skip the heavy contentHtml/contentMarkdown columns — the list
// only needs metadata, and the editor fetches full content via /api/articles/[id].
export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        primaryKeyword: true,
        wordCount: true,
        categoryName: true,
        comparisonType: true,
        coverImageUrl: true,
        thumbnailUrl: true,
        needsRewrite: true,
        source: true,
        createdAt: true,
        humanInputMarkers: { select: { id: true, resolved: true } },
      },
    });
    return NextResponse.json(
      { articles },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
