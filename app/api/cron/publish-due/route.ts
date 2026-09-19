import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/apiError";
import { pingIndexNow } from "@/lib/indexnow";
import { checkPublishGates } from "@/lib/schedule";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Publishes every article whose schedule has come due.
//
// Called every few minutes by the GitHub Actions workflow in
// .github/workflows/publish-scheduled.yml (Vercel's Hobby plan only allows
// one cron run a day, which is too coarse for "publish at 9:00").
//
// This route is public in middleware (there is no dashboard session on a
// cron call), so it is safe by construction:
//   1. It can only act on rows in PublishSchedule, and those can only be
//      created from the signed-in dashboard.
//   2. It re-checks the publish gates at run time (content, unresolved
//      markers, AI posts must be approved), so a post edited into an
//      unpublishable state after scheduling is skipped, not pushed live.
//   3. If CRON_SECRET is set, the caller must present it. Set it.
// It deliberately skips the WordPress mirror the manual button tries: the
// site has left WordPress and a hung mirror call must not stall a cron run.

function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const alt = request.headers.get("x-cron-secret") || "";
  return bearer === secret || alt === secret;
}

async function run(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const now = new Date();
    const due = await prisma.publishSchedule.findMany({
      where: { published: false, scheduledFor: { lte: now } },
      orderBy: { scheduledFor: "asc" },
      take: 5,
    });

    const results: { slug?: string; articleId: string; outcome: string; detail?: string }[] = [];

    for (const row of due) {
      const article = await prisma.article.findUnique({
        where: { id: row.articleId },
        include: { humanInputMarkers: true },
      });

      if (!article) {
        await prisma.publishSchedule.delete({ where: { id: row.id } });
        results.push({ articleId: row.articleId, outcome: "removed", detail: "article no longer exists" });
        continue;
      }
      if (article.status === "published") {
        await prisma.publishSchedule.update({ where: { id: row.id }, data: { published: true } });
        results.push({ slug: article.slug, articleId: article.id, outcome: "already_published" });
        continue;
      }

      const gate = checkPublishGates(article);
      if (!gate.ok) {
        // Leave the row in place: fixing the post lets the next run pick it up.
        results.push({ slug: article.slug, articleId: article.id, outcome: "blocked", detail: gate.reason });
        continue;
      }

      // Claim the row first so two overlapping runs cannot both publish it.
      const claim = await prisma.publishSchedule.updateMany({
        where: { id: row.id, published: false },
        data: { published: true },
      });
      if (claim.count === 0) continue;

      try {
        await prisma.article.update({
          where: { id: article.id },
          data: { status: "published", publishedAt: article.publishedAt ?? new Date() },
        });
      } catch (error) {
        await prisma.publishSchedule.update({ where: { id: row.id }, data: { published: false } });
        throw error;
      }

      await prisma.reviewLog.create({
        data: {
          articleId: article.id,
          action: "publish_scheduled",
          notes: `Scheduled for ${row.scheduledFor.toISOString()}, published ${new Date().toISOString()}`,
        },
      });
      const indexNow = await pingIndexNow(article.slug);
      results.push({
        slug: article.slug,
        articleId: article.id,
        outcome: "published",
        detail: indexNow.ok ? "IndexNow pinged" : `IndexNow failed: ${indexNow.error ?? "unknown"}`,
      });
    }

    return NextResponse.json({ checkedAt: now.toISOString(), due: due.length, results });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  return run(request);
}
export async function POST(request: NextRequest) {
  return run(request);
}
