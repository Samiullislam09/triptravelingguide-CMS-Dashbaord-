"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import { Button, Badge, Spinner, cn } from "@/components/ui";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  Image as ImageIcon,
  Globe,
  Tag,
  ArrowLeft,
  Check,
  Sparkles,
  PenLine,
  Clapperboard,
  ExternalLink,
  FolderOpen,
  Search,
} from "lucide-react";

interface Marker {
  id: string;
  markerType: string;
  markerText: string;
  resolved: boolean;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  source: string;
  primaryKeyword: string;
  contentHtml: string;
  contentMarkdown: string;
  wordCount: number;
  metaTitle: string;
  metaDescription: string;
  comparisonType: string;
  tags?: string;
  categoryName: string;
  categorySlug: string;
  coverImageUrl: string;
  thumbnailUrl: string;
  thumbnailStatus: string;
  needsRewrite: boolean;
  humanInputMarkers: Marker[];
  wordpressUrl?: string | null;
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [publishing, setPublishing] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState("");

  // editable fields
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [tags, setTags] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  // thumbnail / story local UI state
  const [thumbPreview, setThumbPreview] = useState("");
  const [genThumb, setGenThumb] = useState(false);
  const [approveThumb, setApproveThumb] = useState(false);
  const [genStory, setGenStory] = useState(false);
  const [storyDone, setStoryDone] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  const fetchArticle = useCallback(async () => {
    const res = await fetch(`/api/articles/${id}`);
    const data = await res.json();
    if (res.ok) {
      const a: Article = data.article;
      setArticle(a);
      setTitle(a.title);
      setHtml(a.contentHtml);
      setMetaTitle(a.metaTitle || a.title);
      setMetaDescription(a.metaDescription);
      setSlug(a.slug || "");
      setPrimaryKeyword(a.primaryKeyword);
      setTags(a.tags || "");
      setCategoryName(a.categoryName || "");
      setCategorySlug(a.categorySlug || "");
      setThumbPreview(a.thumbnailUrl || "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const doSave = useCallback(async () => {
    setSaveState("saving");
    await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_html", contentHtml: html }),
    });
    await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_meta",
        title,
        metaTitle: metaTitle || title,
        metaDescription,
        primaryKeyword,
        tags,
        slug,
        categoryName,
        categorySlug,
      }),
    });
    dirtyRef.current = false;
    setSaveState("saved");
  }, [
    id,
    html,
    title,
    metaTitle,
    metaDescription,
    primaryKeyword,
    tags,
    slug,
    categoryName,
    categorySlug,
  ]);

  // Debounced autosave whenever an editable field changes.
  function markDirty() {
    dirtyRef.current = true;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(), 1200);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function toggleMarker(markerId: string, resolved: boolean) {
    await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve_marker", markerId, resolved }),
    });
    fetchArticle();
  }

  async function handleApprove() {
    setError("");
    setApproving(true);
    try {
      if (dirtyRef.current) await doSave();
      const res = await fetch(`/api/articles/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      fetchArticle();
    } finally {
      setApproving(false);
    }
  }

  async function handlePublish(mode: "draft" | "publish") {
    setError("");
    setPublishing(mode);
    try {
      if (dirtyRef.current) await doSave();
      const res = await fetch(`/api/articles/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      fetchArticle();
    } finally {
      setPublishing(null);
    }
  }

  async function handleGenerateThumbnail() {
    setError("");
    setGenThumb(true);
    try {
      const res = await fetch(`/api/articles/${id}/thumbnail`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate thumbnail");
        return;
      }
      // Cache-bust so the freshly uploaded image shows immediately.
      setThumbPreview(`${data.url}?t=${Date.now()}`);
      fetchArticle();
    } finally {
      setGenThumb(false);
    }
  }

  async function handleApproveThumbnail() {
    setError("");
    setApproveThumb(true);
    try {
      const res = await fetch(`/api/articles/${id}/thumbnail/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to approve thumbnail");
        return;
      }
      fetchArticle();
    } finally {
      setApproveThumb(false);
    }
  }

  async function handleGenerateStory() {
    setError("");
    setGenStory(true);
    setStoryDone(false);
    try {
      const res = await fetch(`/api/articles/${id}/story`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to generate web story");
        return;
      }
      setStoryDone(true);
    } finally {
      setGenStory(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Spinner label="Loading editor…" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted">
        Post not found.
      </div>
    );
  }

  const isManual = article.source === "manual";
  const unresolvedCount = article.humanInputMarkers.filter((m) => !m.resolved).length;
  const canApprove = unresolvedCount === 0 && article.wordCount >= 700;
  const isApproved = article.status === "approved" || article.status === "published";
  const isPublished = article.status === "published";
  const canPublish = isManual || isApproved;

  const wordCount = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen">
      {/* Sticky glass top bar */}
      <header className="sticky top-0 z-30 glass rounded-none border-x-0 border-t-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/content")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-ink transition shrink-0"
          >
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Articles</span>
          </button>

          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            placeholder="Post title…"
            className="flex-1 min-w-0 bg-transparent text-base sm:text-lg font-semibold tracking-tight text-ink outline-none placeholder:text-slate-400"
          />

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted hidden sm:flex items-center gap-1">
              {saveState === "saving" && (
                <>
                  <Loader2 size={12} className="animate-spin" /> Saving…
                </>
              )}
              {saveState === "saved" && (
                <span className="text-success flex items-center gap-1">
                  <Check size={12} /> Saved
                </span>
              )}
            </span>
            {canPublish ? (
              <Button
                variant="primary"
                icon={Globe}
                loading={publishing === "publish"}
                disabled={publishing !== null}
                onClick={() => handlePublish("publish")}
              >
                {isPublished ? "Update" : "Publish"}
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={CheckCircle2}
                loading={approving}
                disabled={!canApprove}
                onClick={handleApprove}
              >
                {canApprove ? "Approve" : "Resolve gates"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5">
        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2 mb-4 animate-fade-up">
          <Badge tone={isPublished ? "success" : isApproved ? "brand" : "warn"}>
            {article.status.replace(/_/g, " ")}
          </Badge>
          <Badge tone={isManual ? "ai" : "brand"} icon={isManual ? PenLine : Sparkles}>
            {isManual ? "Manual" : "AI-assisted"}
          </Badge>
          <span className="text-xs text-muted">{wordCount} words</span>
          {article.needsRewrite && (
            <Badge tone="warn" icon={AlertTriangle}>
              needs rewrite
            </Badge>
          )}
        </div>

        {error && (
          <div className="mb-4 text-sm text-danger bg-danger-soft border border-danger/20 rounded-xl px-4 py-3 animate-fade-up">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* LEFT — editor */}
          <div className="space-y-4 animate-fade-up">
            {article.humanInputMarkers.length > 0 && (
              <div className="glass p-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-ink">
                  <AlertTriangle size={15} className="text-warn" />
                  Human input needed ({unresolvedCount} left)
                </div>
                <div className="space-y-2">
                  {article.humanInputMarkers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleMarker(m.id, !m.resolved)}
                      className={cn(
                        "w-full text-left flex items-start gap-2 px-3 py-2 rounded-lg text-xs transition border",
                        m.resolved
                          ? "bg-success-soft text-success border-success/20"
                          : "bg-warn-soft text-warn border-warn/20"
                      )}
                    >
                      {m.resolved ? (
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                      ) : (
                        <Circle size={14} className="shrink-0 mt-0.5" />
                      )}
                      <span>
                        <span className="uppercase text-[10px] tracking-wide opacity-70 mr-1">
                          {m.markerType}
                        </span>
                        {m.markerText}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <RichEditor
              key={article.id}
              initialHtml={article.contentHtml}
              onChange={(h) => {
                setHtml(h);
                markDirty();
              }}
            />
          </div>

          {/* RIGHT — sticky sidebar */}
          <div className="space-y-4 lg:sticky lg:top-20">
            {/* Publish panel */}
            <Panel title="Publish" icon={Globe}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted">Status</span>
                <Badge tone={isPublished ? "success" : isApproved ? "brand" : "warn"}>
                  {article.status.replace(/_/g, " ")}
                </Badge>
              </div>
              {isPublished && article.wordpressUrl && (
                <a
                  href={article.wordpressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 underline"
                >
                  <ExternalLink size={12} /> Open in WordPress
                </a>
              )}
              {canPublish ? (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    icon={PenLine}
                    className="w-full"
                    loading={publishing === "draft"}
                    disabled={publishing !== null}
                    onClick={() => handlePublish("draft")}
                  >
                    Save WP draft
                  </Button>
                  <Button
                    variant="primary"
                    icon={Globe}
                    className="w-full"
                    loading={publishing === "publish"}
                    disabled={publishing !== null}
                    onClick={() => handlePublish("publish")}
                  >
                    {isPublished ? "Update live" : "Publish live"}
                  </Button>
                  <p className="text-[11px] text-muted">
                    Live publishes to your frontend now; WordPress is a best-effort mirror.
                  </p>
                </div>
              ) : (
                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  className="w-full"
                  loading={approving}
                  disabled={!canApprove}
                  onClick={handleApprove}
                >
                  {canApprove ? "Approve for publishing" : "Resolve markers + 700 words"}
                </Button>
              )}
            </Panel>

            {/* Cover / thumbnail panel */}
            <Panel title="Cover / Thumbnail" icon={ImageIcon}>
              {(thumbPreview || article.coverImageUrl) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbPreview || article.coverImageUrl}
                  alt="Cover preview"
                  className="w-full aspect-[1200/630] object-cover rounded-xl border border-line mb-3 bg-slate-100"
                />
              )}
              {article.thumbnailStatus === "approved" && (
                <div className="mb-3">
                  <Badge tone="success" icon={CheckCircle2}>
                    Approved as cover
                  </Badge>
                </div>
              )}
              <div className="space-y-2">
                <Button
                  variant="ai"
                  icon={Sparkles}
                  className="w-full"
                  loading={genThumb}
                  onClick={handleGenerateThumbnail}
                >
                  Generate thumbnail
                </Button>
                {thumbPreview && article.thumbnailStatus !== "approved" && (
                  <Button
                    variant="soft"
                    icon={Check}
                    className="w-full"
                    loading={approveThumb}
                    onClick={handleApproveThumbnail}
                  >
                    Approve &amp; use as cover
                  </Button>
                )}
              </div>
            </Panel>

            {/* Web story panel */}
            <Panel title="Web story" icon={Clapperboard}>
              <p className="text-xs text-muted mb-3">
                Turn this article into a tappable AMP-style web story.
              </p>
              <Button
                variant="ai"
                icon={Clapperboard}
                className="w-full"
                loading={genStory}
                onClick={handleGenerateStory}
              >
                Generate web story
              </Button>
              {storyDone && (
                <button
                  onClick={() => router.push("/dashboard/stories")}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 underline"
                >
                  <ExternalLink size={12} /> View in Web Stories
                </button>
              )}
            </Panel>

            {/* SEO panel */}
            <Panel title="SEO" icon={Search}>
              <div className="space-y-3">
                <LabeledInput
                  label="Meta title"
                  counter={`${metaTitle.length}/60`}
                  value={metaTitle}
                  onChange={(v) => {
                    setMetaTitle(v);
                    markDirty();
                  }}
                  placeholder="Search-result headline…"
                />
                <div>
                  <label className="flex items-center justify-between text-xs text-muted mb-1">
                    <span>Meta description</span>
                    <span>{metaDescription.length}/160</span>
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => {
                      setMetaDescription(e.target.value);
                      markDirty();
                    }}
                    rows={3}
                    placeholder="150–160 chars with a reason to click…"
                    className="w-full rounded-lg border border-line bg-white/80 p-2 text-xs text-ink outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 resize-none transition"
                  />
                </div>
                <LabeledInput
                  label="Slug"
                  value={slug}
                  onChange={(v) => {
                    setSlug(v);
                    markDirty();
                  }}
                  placeholder="banff-vs-whistler"
                />
                <LabeledInput
                  label="Focus keyword"
                  value={primaryKeyword}
                  onChange={(v) => {
                    setPrimaryKeyword(v);
                    markDirty();
                  }}
                  placeholder="banff vs whistler"
                />
                <div>
                  <label className="flex items-center gap-1 text-xs text-muted mb-1">
                    <Tag size={11} /> Tags (comma separated)
                  </label>
                  <input
                    value={tags}
                    onChange={(e) => {
                      setTags(e.target.value);
                      markDirty();
                    }}
                    placeholder="banff, whistler, rockies"
                    className="w-full rounded-lg border border-line bg-white/80 p-2 text-xs text-ink outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition"
                  />
                  {tags.trim() && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((t) => (
                          <Badge key={t} tone="brand">
                            {t}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            {/* Category panel */}
            <Panel title="Category" icon={FolderOpen}>
              <div className="space-y-3">
                <LabeledInput
                  label="Category name"
                  value={categoryName}
                  onChange={(v) => {
                    setCategoryName(v);
                    markDirty();
                  }}
                  placeholder="Destinations"
                />
                <LabeledInput
                  label="Category slug"
                  value={categorySlug}
                  onChange={(v) => {
                    setCategorySlug(v);
                    markDirty();
                  }}
                  placeholder="destinations"
                />
                <p className="text-[11px] text-muted">
                  Saved automatically. Slug must be unique across posts.
                </p>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- helpers ------------------------------- */

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="glass p-4 animate-fade-up">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-ink">
        <span className="grid place-items-center h-7 w-7 rounded-lg bg-brand-50 text-brand-600">
          <Icon size={14} />
        </span>
        {title}
      </div>
      {children}
    </div>
  );
}

function LabeledInput({
  label,
  counter,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  counter?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="flex items-center justify-between text-xs text-muted mb-1">
        <span>{label}</span>
        {counter && <span>{counter}</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-white/80 p-2 text-xs text-ink outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition"
      />
    </div>
  );
}
