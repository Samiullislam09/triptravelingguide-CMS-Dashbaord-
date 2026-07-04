import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";

import { renderThumbnail } from "@/lib/thumbnail";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// POST /api/articles/[id]/thumbnail
// Renders a template thumbnail (title + category + brand gradient) via
// next/og, uploads it to the public Supabase `post-images` bucket, and
// records the URL on the article. Does NOT touch coverImageUrl — the human
// still has to approve it via /thumbnail/approve.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  try {
    const png = await renderThumbnail({
      title: article.metaTitle || article.title,
      category: article.categoryName || article.comparisonType,
    });

    const path = `thumbnails/${article.id}-${Date.now()}.png`;
    const supabase = supabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(path, png, { contentType: "image/png", upsert: true });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage.from("post-images").getPublicUrl(path);
    const url = publicUrlData.publicUrl;

    await prisma.article.update({
      where: { id: article.id },
      data: { thumbnailUrl: url, thumbnailStatus: "generated" },
    });

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Thumbnail generation failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate thumbnail" },
      { status: 500 }
    );
  }
}
