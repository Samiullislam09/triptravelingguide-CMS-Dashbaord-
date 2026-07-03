import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toPublicPost } from "@/lib/publicPost";

// Public, read-only feed of PUBLISHED posts for the Vercel frontend.
// No auth (allowlisted in middleware). CORS-open so any origin can read.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// GET /api/public/posts — all published posts, newest first.
export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    const posts = articles.map(toPublicPost);

    return NextResponse.json(posts, {
      headers: {
        ...CORS,
        // Let the frontend/CDN cache for 5 min, serve stale while revalidating.
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch posts" },
      { status: 500, headers: CORS }
    );
  }
}
