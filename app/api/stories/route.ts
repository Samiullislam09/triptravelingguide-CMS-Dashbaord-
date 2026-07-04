import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";

// GET /api/stories — all web stories, newest first, slides parsed for the client.
export async function GET() {
  try {
    const stories = await prisma.webStory.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      stories: stories.map((s) => ({ ...s, slides: safeParseSlides(s.slides) })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch stories" },
      { status: 500 }
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
