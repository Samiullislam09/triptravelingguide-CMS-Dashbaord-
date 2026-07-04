import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";

// GET /api/stories/[id] — one story, slides parsed.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const story = await prisma.webStory.findUnique({ where: { id: params.id } });
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  return NextResponse.json({ story: { ...story, slides: safeParseSlides(story.slides) } });
}

// PATCH /api/stories/[id] — update title / slides / status.
// Publishing (status -> "published") stamps publishedAt.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const existing = await prisma.webStory.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.coverImageUrl === "string") data.coverImageUrl = body.coverImageUrl;
    if (Array.isArray(body.slides)) data.slides = JSON.stringify(body.slides);

    if (typeof body.status === "string") {
      if (!["draft", "published"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = body.status;
      if (body.status === "published") data.publishedAt = new Date();
    }

    const updated = await prisma.webStory.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ story: { ...updated, slides: safeParseSlides(updated.slides) } });
  } catch (error: any) {
    console.error("Story update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update story" },
      { status: 500 }
    );
  }
}

// DELETE /api/stories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.webStory.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete story" },
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
