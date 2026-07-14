import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/apiError";

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
  } catch (error) {
    return apiError(error);
  }
}
