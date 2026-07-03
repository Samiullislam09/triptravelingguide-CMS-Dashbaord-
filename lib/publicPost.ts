// Maps an internal Article row to the public Post shape the Vercel frontend
// consumes via /api/public. Keep these field names in sync with the frontend's
// lib/types.ts (Post interface).

import type { Article } from "@prisma/client";

// The dashboard has no author table yet (single-author site). These defaults
// feed the frontend's author/E-E-A-T schema. Override via env when known.
const DEFAULT_AUTHOR = {
  name: process.env.SITE_AUTHOR_NAME || "TripTravelingGuide Editorial Team",
  slug: process.env.SITE_AUTHOR_SLUG || "editorial",
  bio:
    process.env.SITE_AUTHOR_BIO ||
    "Travel writers and trip planners covering destinations across North America, Asia, and beyond.",
  image: process.env.SITE_AUTHOR_IMAGE || "/author.jpg",
  url: "/about",
};

// comparisonType -> public category. Falls back to a generic Travel category.
const CATEGORY_MAP: Record<string, { name: string; slug: string }> = {
  destination: { name: "Destinations", slug: "destinations" },
  transport: { name: "Transport", slug: "transport" },
  stay: { name: "Stays", slug: "stays" },
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface PublicPost {
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  excerpt: string;
  contentHtml: string;
  coverImage?: string;
  coverAlt?: string;
  author: typeof DEFAULT_AUTHOR;
  category: { name: string; slug: string };
  tags: string[];
  faq: { question: string; answer: string }[];
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  featured: boolean;
  region?: "usa-canada" | "south-asia" | "global";
}

export function toPublicPost(a: Article): PublicPost {
  const tags = a.tags
    ? a.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  // Prefer the real taxonomy from migration/manual posts; fall back to the
  // comparisonType mapping for older AI posts.
  const category =
    a.categorySlug && a.categoryName
      ? { name: a.categoryName, slug: a.categorySlug }
      : CATEGORY_MAP[a.comparisonType] || { name: "Travel", slug: "travel" };

  const excerpt =
    a.metaDescription?.trim() || stripHtml(a.contentHtml).slice(0, 160);

  const published = a.publishedAt ?? a.createdAt;

  return {
    slug: a.slug,
    title: a.title,
    metaTitle: a.metaTitle || undefined,
    metaDescription: a.metaDescription || undefined,
    focusKeyword: a.primaryKeyword || undefined,
    excerpt,
    contentHtml: a.contentHtml,
    coverImage: a.coverImageUrl?.trim() || undefined,
    coverAlt: a.coverImageAlt?.trim() || undefined,
    author: DEFAULT_AUTHOR,
    category,
    tags,
    faq: [], // FAQ is currently embedded in contentHtml; structured FAQ comes later.
    publishedAt: published.toISOString(),
    updatedAt: a.publishedAt ? a.publishedAt.toISOString() : undefined,
    readingMinutes: Math.max(1, Math.round((a.wordCount || 0) / 220)) || 1,
    featured: false,
    region: undefined,
  };
}
