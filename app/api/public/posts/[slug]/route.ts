import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toPublicPost } from "@/lib/publicPost";

// GET /api/public/posts/[slug] — a single published post by slug.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug: params.slug },
    });

    if (!article || article.status !== "published") {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: CORS }
      );
    }

    return NextResponse.json(toPublicPost(article), {
      headers: {
        ...CORS,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch post" },
      { status: 500, headers: CORS }
    );
  }
}
