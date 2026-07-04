import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";
import { discoverTopic } from "@/lib/contentPipeline";
import { slugify } from "@/lib/markdown";

// POST /api/topics/generate
// Module 1 — runs topic discovery and creates a new Article row in "discovered" status.
export async function POST(request: Request) {
  try {
    // Optional { keyword } from AI Studio steers discovery toward the user's topic.
    let seed: string | undefined;
    try {
      const body = await request.json();
      if (typeof body?.keyword === "string") seed = body.keyword;
    } catch {
      /* no body — model researches a trending topic on its own */
    }

    const topic = await discoverTopic(seed);

    const slug = slugify(topic.title);

    const article = await prisma.article.create({
      data: {
        title: topic.title,
        slug: `${slug}-${Date.now().toString(36)}`,
        status: "discovered",
        primaryKeyword: topic.primaryKeyword,
        comparisonType: topic.comparisonType,
        topicScore: topic.topicScore,
        searchVolumeLow: topic.searchVolumeLow,
        searchVolumeHigh: topic.searchVolumeHigh,
        keywordDifficulty: topic.keywordDifficulty,
        trendDirection: topic.trendDirection,
        intentLabel: topic.intentLabel,
        reasoning: topic.reasoning,
      },
    });

    return NextResponse.json({ article, reasoning: topic.reasoning });
  } catch (error: any) {
    console.error("Topic generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate topic" },
      { status: 500 }
    );
  }
}
