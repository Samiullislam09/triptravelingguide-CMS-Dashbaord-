"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  Button,
  Badge,
  EmptyState,
  Skeleton,
  SectionHeader,
  cn,
} from "@/components/ui";
import {
  FileText,
  PenLine,
  Search,
  AlertTriangle,
  Sparkles,
  ImageIcon,
  ArrowRight,
} from "lucide-react";

interface Marker {
  id: string;
  resolved: boolean;
}

interface Article {
  id: string;
  title: string;
  status: string;
  primaryKeyword: string;
  wordCount: number;
  categoryName: string;
  comparisonType: string;
  coverImageUrl: string;
  thumbnailUrl: string;
  needsRewrite: boolean;
  source: string;
  humanInputMarkers?: Marker[];
}

type FilterKey = "all" | "published" | "draft" | "needsRewrite";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
  { key: "needsRewrite", label: "Needs rewrite" },
];

function statusTone(status: string): "success" | "warn" | "brand" | "neutral" {
  if (status === "published") return "success";
  if (status === "approved") return "brand";
  if (status === "pending_review") return "warn";
  return "neutral";
}

// useSearchParams() forces client-side rendering, so Next 14 requires the part
// of the tree that reads it to sit inside a Suspense boundary at build time.
export default function ContentPage() {
  return (
    <Suspense fallback={null}>
      <ContentPageInner />
    </Suspense>
  );
}

function ContentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [error, setError] = useState("");

  // Preselect the filter from ?filter=needsRewrite (e.g. from the Overview page).
  useEffect(() => {
    const f = searchParams.get("filter");
    if (f && FILTERS.some((x) => x.key === f)) setFilter(f as FilterKey);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/articles");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `Failed to load posts (${res.status}).`);
        }
        if (!cancelled) {
          setArticles(Array.isArray(data.articles) ? data.articles : []);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Could not load posts. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleWritePost() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/articles/create-manual", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Couldn't create the post (${res.status}).`);
      }
      if (data.article?.id) {
        router.push(`/review/${data.article.id}`);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't create the post. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      // Filter tab
      if (filter === "published" && a.status !== "published") return false;
      if (filter === "draft" && a.status === "published") return false;
      if (filter === "needsRewrite" && !a.needsRewrite) return false;
      // Search on title/keyword
      if (q) {
        const hay = `${a.title} ${a.primaryKeyword}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [articles, filter, query]);

  const countFor = (key: FilterKey) => {
    if (key === "all") return articles.length;
    if (key === "published") return articles.filter((a) => a.status === "published").length;
    if (key === "draft") return articles.filter((a) => a.status !== "published").length;
    return articles.filter((a) => a.needsRewrite).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Articles</h1>
          <p className="text-sm text-muted mt-1">
            Every post in your content engine — write, review, and publish.
          </p>
        </div>
        <Button variant="primary" icon={PenLine} loading={creating} onClick={handleWritePost}>
          Write post
        </Button>
      </div>

      {/* Error banner — surfaces DB/connection failures instead of a blank list */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger animate-fade-in">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls */}
      <Card className="p-4" delay={40}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or keyword…"
              className="w-full rounded-xl border border-line bg-white/80 pl-9 pr-3 py-2.5 text-sm text-ink outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>
          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-brand-50 text-brand-600"
                      : "text-slate-500 hover:text-ink hover:bg-slate-100"
                  )}
                >
                  {f.key === "needsRewrite" && <AlertTriangle size={13} />}
                  {f.label}
                  <span
                    className={cn(
                      "text-xs tabular-nums rounded-full px-1.5 py-0.5",
                      active ? "bg-white/70 text-brand-600" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {countFor(f.key)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* List */}
      <Card delay={80}>
        <SectionHeader title="Posts" subtitle={`${filtered.length} shown`} icon={FileText} />
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={query || filter !== "all" ? Search : Sparkles}
            title={query || filter !== "all" ? "No matching posts" : "No posts yet"}
            hint={
              query || filter !== "all"
                ? "Try a different search or filter."
                : "Write your first post or generate one with AI Studio."
            }
            action={
              !query && filter === "all" ? (
                <Button variant="primary" icon={PenLine} loading={creating} onClick={handleWritePost}>
                  Write post
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-1.5">
            {filtered.map((a) => {
              const thumb = a.coverImageUrl || a.thumbnailUrl;
              const category = a.categoryName || a.comparisonType;
              return (
                <button
                  key={a.id}
                  onClick={() => router.push(`/review/${a.id}`)}
                  className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/70 transition group"
                >
                  {/* Cover thumb */}
                  {thumb ? (
                    <span
                      className="h-12 w-16 rounded-lg bg-cover bg-center shrink-0 bg-slate-100 border border-line"
                      style={{ backgroundImage: `url(${thumb})` }}
                    />
                  ) : (
                    <span className="h-12 w-16 rounded-lg shrink-0 bg-slate-100 border border-line grid place-items-center text-slate-300">
                      <ImageIcon size={16} />
                    </span>
                  )}
                  {/* Text */}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-ink truncate">
                      {a.title || "Untitled post"}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge tone={statusTone(a.status)}>{a.status.replace(/_/g, " ")}</Badge>
                      {category && <Badge tone="neutral">{category}</Badge>}
                      <span className="text-xs text-muted">{a.wordCount} words</span>
                      {a.needsRewrite && (
                        <Badge tone="warn" icon={AlertTriangle}>
                          needs rewrite
                        </Badge>
                      )}
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition shrink-0"
                  />
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
