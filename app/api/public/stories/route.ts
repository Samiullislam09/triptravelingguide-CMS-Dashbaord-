import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public, read-only feed of PUBLISHED web stories for the Vercel frontend.
// No auth (allowlisted in middleware). CORS-open so any origin can read.
// Mirrors the pattern in app/api/public/posts/route.ts.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const dynamic = "force-dynamic";

// Base URL for the public site, used to build each story's articleUrl.
// Set NEXT_PUBLIC_SITE_URL (or SITE_URL) in .env; falls back to the prod domain.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://triptravelingguide.com"
).replace(/\/+$/, "");

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// GET /api/public/stories — all published stories, newest first.
export async function GET() {
  try {
    const stories = await prisma.webStory.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: { article: true },
    });

    const payload = stories.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      coverImageUrl: s.coverImageUrl,
      slides: safeParseSlides(s.slides),
      // Empty string when the source article was deleted/unlinked — the
      // frontend should hide the "read more" link in that case.
      articleUrl: s.article ? `${SITE_URL}/${s.article.slug}` : "",
    }));

    return NextResponse.json(payload, {
      headers: {
        ...CORS,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch stories" },
      { status: 500, headers: CORS }
    );
  }
}

function safeParseSlides(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
