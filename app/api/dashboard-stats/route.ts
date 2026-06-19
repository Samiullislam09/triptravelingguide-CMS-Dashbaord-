import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/dashboard-stats — aggregate counts + scoring data for the analytics page
export async function GET() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
  });

  const byStatus = (s: string) => articles.filter((a) => a.status === s).length;

  const pipeline = {
    discovered: articles.filter((a) =>
      ["discovered", "titled"].includes(a.status)
    ).length,
    drafted: articles.filter((a) =>
      ["drafted", "seo_tagged", "linked", "imaged"].includes(a.status)
    ).length,
    pending_review: byStatus("pending_review"),
    approved: byStatus("approved"),
    published: byStatus("published"),
  };

  const byComparisonType = {
    destination: articles.filter((a) => a.comparisonType === "destination").length,
    transport: articles.filter((a) => a.comparisonType === "transport").length,
    stay: articles.filter((a) => a.comparisonType === "stay").length,
  };

  // Average topic score per comparison type — which kind of topic the AI rates highest.
  const avgScoreByType = (["destination", "transport", "stay"] as const).map(
    (type) => {
      const subset = articles.filter((a) => a.comparisonType === type);
      const avg = subset.length
        ? Math.round(
            subset.reduce((sum, a) => sum + a.topicScore, 0) / subset.length
          )
        : 0;
      return { type, avgScore: avg, count: subset.length };
    }
  );

  const avgTopicScore = articles.length
    ? Math.round(
        articles.reduce((sum, a) => sum + a.topicScore, 0) / articles.length
      )
    : 0;

  // Top scored topics for a leaderboard.
  const topTopics = [...articles]
    .sort((a, b) => b.topicScore - a.topicScore)
    .slice(0, 6)
    .map((a) => ({
      id: a.id,
      title: a.title,
      topicScore: a.topicScore,
      comparisonType: a.comparisonType,
      status: a.status,
    }));

  const snapshotCount = await prisma.analyticsSnapshot.count();

  return NextResponse.json({
    totalPublished: pipeline.published,
    totalApproved: pipeline.approved,
    totalPendingReview: pipeline.pending_review,
    totalArticles: articles.length,
    avgTopicScore,
    pipeline,
    byComparisonType,
    avgScoreByType,
    topTopics,
    hasRealAnalyticsData: snapshotCount > 0,
  });
}
