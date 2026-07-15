import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/apiError";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// GET /api/overview — one call powering the command-center home:
// content pipeline counts, 14-day activity series, GSC search totals (if synced),
// and the "Today's pick" keyword opportunity (high impressions, page 1-2 position).
export async function GET() {
  try {
  const [articles, storyCount, gscTotals, opportunities] = await Promise.all([
    // Only the columns the overview actually uses — NEVER pull the heavy
    // contentHtml/contentMarkdown for all posts (that made this call slow).
    prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        needsRewrite: true,
        coverImageUrl: true,
        createdAt: true,
        publishedAt: true,
      },
    }),
    prisma.webStory.count(),
    // GSC page metrics over the trailing 28 days (empty until GSC is connected).
    prisma.pageMetric.findMany({
      where: { date: { gte: new Date(Date.now() - 28 * 864e5) } },
    }),
    // Opportunity keywords: ranking on page 1-3 (pos 5-25) with real impressions —
    // "small push = big win". Empty until GSC is connected.
    prisma.keywordMetric.findMany({
      where: {
        date: { gte: new Date(Date.now() - 28 * 864e5) },
        position: { gte: 5, lte: 25 },
        impressions: { gt: 30 },
      },
      orderBy: { impressions: "desc" },
      take: 60,
    }),
  ]);

  const byStatus = (s: string) => articles.filter((a) => a.status === s).length;
  const inStatuses = (arr: string[]) => articles.filter((a) => arr.includes(a.status)).length;

  const pipeline = {
    discovered: inStatuses(["discovered", "titled"]),
    drafted: inStatuses(["drafted", "seo_tagged", "linked", "imaged"]),
    pending_review: byStatus("pending_review"),
    approved: byStatus("approved"),
    published: byStatus("published"),
  };

  // 14-day created/published activity series.
  const days: Record<string, { created: number; published: number }> = {};
  for (const a of articles) {
    const c = dayKey(new Date(a.createdAt));
    (days[c] ||= { created: 0, published: 0 }).created++;
    if (a.publishedAt) {
      const p = dayKey(new Date(a.publishedAt));
      (days[p] ||= { created: 0, published: 0 }).published++;
    }
  }
  const series: { date: string; label: string; created: number; published: number }[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = dayKey(d);
    series.push({
      date: key,
      label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`,
      created: days[key]?.created || 0,
      published: days[key]?.published || 0,
    });
  }

  // GSC search totals (null when not connected yet → UI shows "connect GSC").
  const gscConnected = gscTotals.length > 0;
  const search = gscConnected
    ? {
        clicks: gscTotals.reduce((s, m) => s + m.clicks, 0),
        impressions: gscTotals.reduce((s, m) => s + m.impressions, 0),
        avgPosition:
          Math.round(
            (gscTotals.reduce((s, m) => s + m.position * m.impressions, 0) /
              (gscTotals.reduce((s, m) => s + m.impressions, 0) || 1)) * 10
          ) / 10,
        pagesTracked: new Set(gscTotals.map((m) => m.page)).size,
      }
    : null;

  // Dedupe opportunities by query, keep best.
  const seen = new Set<string>();
  const todaysPicks = opportunities
    .filter((k) => (seen.has(k.query) ? false : (seen.add(k.query), true)))
    .slice(0, 6)
    .map((k) => ({
      query: k.query,
      page: k.page,
      clicks: k.clicks,
      impressions: k.impressions,
      position: Math.round(k.position * 10) / 10,
    }));

  return NextResponse.json({
    counts: {
      total: articles.length,
      published: pipeline.published,
      needsRewrite: articles.filter((a) => a.needsRewrite).length,
      stories: storyCount,
    },
    pipeline,
    series,
    gscConnected,
    search,
    todaysPicks,
    recent: articles.slice(0, 6).map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      needsRewrite: a.needsRewrite,
      coverImageUrl: a.coverImageUrl,
      updatedAt: a.createdAt,
    })),
  }, {
    // Serve instantly from the browser cache on quick re-navigation, revalidate
    // in the background. Short window keeps the dashboard feeling live.
    headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" },
  });
  } catch (error) {
    return apiError(error);
  }
}
