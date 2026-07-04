import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";

// POST /api/articles/[id]/thumbnail/approve
// Promotes the generated thumbnail to the article's cover image — this is
// what the public frontend + WordPress mirror actually use.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  if (!article.thumbnailUrl) {
    return NextResponse.json(
      { error: "Generate a thumbnail before approving it." },
      { status: 422 }
    );
  }

  await prisma.article.update({
    where: { id: article.id },
    data: { thumbnailStatus: "approved", coverImageUrl: article.thumbnailUrl },
  });

  return NextResponse.json({ ok: true });
}
