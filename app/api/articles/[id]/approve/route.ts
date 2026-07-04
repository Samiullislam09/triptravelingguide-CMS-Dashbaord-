import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";

// POST /api/articles/[id]/approve
// Enforces PDF Section 9.2's "Hard Gate Rules" server-side — these CANNOT
// be bypassed from the UI, because the check lives here, not in a button's
// disabled state alone.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: { humanInputMarkers: true },
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // Gate 1 — No publish with unresolved HUMAN INPUT NEEDED markers
  const unresolvedMarkers = article.humanInputMarkers.filter((m) => !m.resolved);
  if (unresolvedMarkers.length > 0) {
    return NextResponse.json(
      {
        error: `${unresolvedMarkers.length} unresolved HUMAN INPUT NEEDED marker(s) remain. Resolve or explicitly dismiss each one before approving.`,
        gate: "human_input_markers",
      },
      { status: 422 }
    );
  }

  // Gate 2 — Minimum word count (PDF Section 6.1: destination 1500+, others can be shorter; this app's floor is 700 per your request)
  if (article.wordCount < 700) {
    return NextResponse.json(
      {
        error: `Article is only ${article.wordCount} words. Minimum is 700.`,
        gate: "word_count",
      },
      { status: 422 }
    );
  }

  // Gate 3 — Weekly publish cap (PDF Section 5.4 / 9.2)
  const weeklyCap = parseInt(process.env.WEEKLY_PUBLISH_CAP || "5", 10);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const approvedThisWeek = await prisma.article.count({
    where: {
      approvedAt: { gte: oneWeekAgo },
    },
  });

  if (approvedThisWeek >= weeklyCap) {
    return NextResponse.json(
      {
        error: `Weekly publish cap (${weeklyCap}) already reached. This article will need to wait until next week, or raise WEEKLY_PUBLISH_CAP in .env.`,
        gate: "weekly_cap",
      },
      { status: 422 }
    );
  }

  const updated = await prisma.article.update({
    where: { id: params.id },
    data: { status: "approved", approvedAt: new Date() },
  });

  await prisma.reviewLog.create({
    data: { articleId: params.id, action: "approve" },
  });

  return NextResponse.json({ article: updated });
}
