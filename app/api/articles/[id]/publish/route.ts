import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";
import { publishToWordPress } from "@/lib/wordpress";

// POST /api/articles/[id]/publish
// Module 8 — only allowed on articles already in "approved" status.
//
// The public Next.js frontend is the source of truth: it reads posts whose
// `status = "published"` straight from this database. WordPress is now a
// secondary, best-effort mirror (the site is migrating off it), so a WordPress
// failure must NOT stop an approved article from going live on the frontend.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const article = await prisma.article.findUnique({ where: { id: params.id } });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // AI posts must pass the human-approval gate. Manually-written CMS posts can
  // be published directly once they have content.
  if (article.source !== "manual" && article.status !== "approved") {
    return NextResponse.json(
      { error: "Article must be approved before it can be sent live." },
      { status: 422 }
    );
  }

  if (!article.contentHtml.trim()) {
    return NextResponse.json(
      { error: "Post has no content yet — write something before publishing." },
      { status: 422 }
    );
  }

  // Body decides the WordPress mirror mode (draft vs live). Defaults to "draft"
  // (PDF safety layer). This only affects the WordPress copy, never our own DB.
  let mode: "draft" | "publish" = "draft";
  try {
    const body = await request.json();
    if (body?.mode === "publish") mode = "publish";
  } catch {
    // no body — keep default draft
  }

  // Best-effort WordPress mirror. Never throws out of this block.
  let wordpress:
    | { postId: string; editUrl: string; mode: "draft" | "publish" }
    | null = null;
  let wordpressError: string | null = null;
  try {
    const result = await publishToWordPress({
      title: article.metaTitle || article.title,
      content: article.contentHtml,
      slug: article.slug,
      status: mode,
      excerpt: article.metaDescription,
      tags: article.tags ? article.tags.split(",").map((t) => t.trim()) : [],
      seo: {
        focusKeyword: article.primaryKeyword,
        metaTitle: article.metaTitle || article.title,
        metaDescription: article.metaDescription,
      },
    });
    wordpress = { postId: result.postId, editUrl: result.editUrl, mode };
  } catch (error: any) {
    // WordPress unreachable/retired — log and carry on. The article still goes
    // live on the frontend below.
    console.error("WordPress mirror failed (non-blocking):", error);
    wordpressError = error?.message || "WordPress publish failed";
  }

  // Mark published in OUR database — this is what makes the article visible on
  // the public frontend, regardless of WordPress.
  const updated = await prisma.article.update({
    where: { id: params.id },
    data: {
      status: "published",
      publishedAt: article.publishedAt ?? new Date(),
      ...(wordpress
        ? { wordpressPostId: wordpress.postId, wordpressUrl: wordpress.editUrl }
        : {}),
    },
  });

  // Tell Bing/Yandex (IndexNow) the new URL exists right away, instead of
  // waiting for their next scheduled crawl. This has never actually been
  // wired up before — the frontend's /api/indexnow route existed but nothing
  // called it. Best-effort: a failure here must never block the publish that
  // already succeeded above.
  let indexNow: { ok: boolean; submitted?: number; error?: string } | null = null;
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://triptravelingguide.com";
    const url = `${siteUrl.replace(/\/$/, "")}/${updated.slug}/`;
    const res = await fetch(`${siteUrl.replace(/\/$/, "")}/api/indexnow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: [url] }),
    });
    indexNow = await res.json().catch(() => ({ ok: res.ok }));
  } catch (error: any) {
    console.error("IndexNow ping failed (non-blocking):", error);
    indexNow = { ok: false, error: error?.message || "IndexNow ping failed" };
  }

  return NextResponse.json({ article: updated, wordpress, wordpressError, indexNow });
}
