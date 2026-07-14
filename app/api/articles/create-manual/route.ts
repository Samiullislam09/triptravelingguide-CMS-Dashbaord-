import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/apiError";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";
import { slugify } from "@/lib/markdown";

// POST /api/articles/create-manual
// Creates a blank manually-written post (full-CMS mode). No AI involved.
export async function POST(request: NextRequest) {
  let title = "Untitled post";
  let comparisonType = "destination";
  try {
    const body = await request.json();
    if (body?.title?.trim()) title = body.title.trim();
    if (["destination", "transport", "stay"].includes(body?.comparisonType))
      comparisonType = body.comparisonType;
  } catch {
    // use defaults
  }

  try {
    const base = slugify(title) || "post";
    const article = await prisma.article.create({
      data: {
        title,
        slug: `${base}-${Date.now().toString(36)}`,
        status: "pending_review", // editable draft in the CMS
        source: "manual",
        comparisonType,
        primaryKeyword: "",
        metaTitle: title,
        contentHtml: "",
        contentMarkdown: "",
      },
    });

    return NextResponse.json({ article });
  } catch (error) {
    return apiError(error);
  }
}
