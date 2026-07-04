import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";

// GET /api/activity — day-by-day history of pipeline events.
// Buckets created / approved / published events per calendar day so the
// dashboard can show "today vs yesterday vs all history".
function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET() {
  const articles = await prisma.article.findMany();

  const days: Record<
    string,
    { date: string; created: number; published: number; approved: number }
  > = {};

  const bucket = (date: Date | null, field: "created" | "published" | "approved") => {
    if (!date) return;
    const key = dayKey(new Date(date));
    if (!days[key])
      days[key] = { date: key, created: 0, published: 0, approved: 0 };
    days[key][field]++;
  };

  for (const a of articles) {
    bucket(a.createdAt, "created");
    bucket(a.approvedAt, "approved");
    bucket(a.publishedAt, "published");
  }

  const sorted = Object.values(days).sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  // Last 14 days as a continuous series (fill gaps) for the chart.
  const series: { date: string; label: string; created: number; published: number }[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = dayKey(d);
    const rec = days[key];
    series.push({
      date: key,
      label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`,
      created: rec?.created || 0,
      published: rec?.published || 0,
    });
  }

  const todayKey = dayKey(today);
  const yKey = (() => {
    const y = new Date(today);
    y.setUTCDate(y.getUTCDate() - 1);
    return dayKey(y);
  })();

  return NextResponse.json({
    today: days[todayKey] || { date: todayKey, created: 0, published: 0, approved: 0 },
    yesterday: days[yKey] || { date: yKey, created: 0, published: 0, approved: 0 },
    series,
    history: sorted, // every day with activity, newest first
    totals: {
      created: articles.length,
      published: articles.filter((a) => a.publishedAt).length,
    },
  });
}
