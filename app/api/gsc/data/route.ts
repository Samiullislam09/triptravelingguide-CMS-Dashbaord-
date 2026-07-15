import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/apiError";

// Reads KeywordMetric / PageMetric: never prerender at build time.
export const dynamic = "force-dynamic";

interface QueryAgg {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  posWeighted: number; // position * impressions, summed — divide by impressions for the avg
}

// GET /api/gsc/data — aggregates the last-synced 28-day window into the
// shapes the SEMrush-style /dashboard/seo page renders: site totals, a
// position-bucket distribution, top pages, top queries, and "quick win"
// opportunity keywords (ranking 5-25 with real impressions).
export async function GET() {
  try {
  const windowStart = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const [keywordRows, pageRows] = await Promise.all([
    prisma.keywordMetric.findMany({ where: { date: { gte: windowStart } } }),
    prisma.pageMetric.findMany({ where: { date: { gte: windowStart } } }),
  ]);

  const empty = {
    totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    distribution: { top3: 0, top10: 0, top20: 0, top100: 0 },
    topPages: [] as { page: string; clicks: number; impressions: number; position: number }[],
    topQueries: [] as { query: string; page: string; clicks: number; impressions: number; position: number }[],
    opportunities: [] as { query: string; page: string; clicks: number; impressions: number; position: number }[],
  };

  if (!keywordRows.length && !pageRows.length) {
    return NextResponse.json(empty);
  }

  // Site totals come from page-level rows: each page counted exactly once
  // (query-level rows double-count a page once per ranking query).
  const totalClicks = pageRows.reduce((s, p) => s + p.clicks, 0);
  const totalImpressions = pageRows.reduce((s, p) => s + p.impressions, 0);
  const avgPosition =
    totalImpressions > 0
      ? Math.round((pageRows.reduce((s, p) => s + p.position * p.impressions, 0) / totalImpressions) * 10) / 10
      : 0;
  const avgCtr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 1000) / 10 : 0;

  // A query can rank for several pages — collapse to one row per query,
  // summing clicks/impressions and taking an impression-weighted avg position.
  // The "representative" page shown is whichever page drives the most clicks.
  const byQuery = new Map<string, QueryAgg>();
  for (const r of keywordRows) {
    const cur = byQuery.get(r.query) || { query: r.query, page: r.page, clicks: 0, impressions: 0, posWeighted: 0 };
    if (r.clicks >= cur.clicks) cur.page = r.page || cur.page;
    cur.clicks += r.clicks;
    cur.impressions += r.impressions;
    cur.posWeighted += r.position * r.impressions;
    byQuery.set(r.query, cur);
  }
  const queries = Array.from(byQuery.values()).map((q) => ({
    query: q.query,
    page: q.page,
    clicks: q.clicks,
    impressions: q.impressions,
    position: q.impressions > 0 ? Math.round((q.posWeighted / q.impressions) * 10) / 10 : 0,
  }));

  const distribution = {
    top3: queries.filter((q) => q.position > 0 && q.position <= 3).length,
    top10: queries.filter((q) => q.position > 3 && q.position <= 10).length,
    top20: queries.filter((q) => q.position > 10 && q.position <= 20).length,
    top100: queries.filter((q) => q.position > 20 && q.position <= 100).length,
  };

  const topPages = pageRows
    .map((p) => ({ page: p.page, clicks: p.clicks, impressions: p.impressions, position: Math.round(p.position * 10) / 10 }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 15);

  const topQueries = [...queries].sort((a, b) => b.clicks - a.clicks).slice(0, 15);

  // "Quick wins": ranking on page 1-3 (position 5-25) with enough impressions
  // that a small on-page push (better title, an extra internal link, refreshed
  // content) could realistically move it into the top few results.
  const opportunities = queries
    .filter((q) => q.position >= 5 && q.position <= 25 && q.impressions >= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  return NextResponse.json({
    totals: { clicks: totalClicks, impressions: totalImpressions, ctr: avgCtr, position: avgPosition },
    distribution,
    topPages,
    topQueries,
    opportunities,
  });
  } catch (error) {
    return apiError(error);
  }
}
