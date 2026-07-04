import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";

// GET /api/articles — list all articles, newest first
export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      include: { humanInputMarkers: true },
    });
    return NextResponse.json({ articles });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
