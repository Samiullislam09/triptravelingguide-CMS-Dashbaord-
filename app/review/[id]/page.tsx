"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import StatusBadge from "@/components/StatusBadge";
import TopicInsight from "@/components/TopicInsight";
import RichEditor from "@/components/RichEditor";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  Image as ImageIcon,
  FileEdit,
  Globe,
  Tag,
  ArrowLeft,
  Check,
  Sparkles,
  PenLine,
  Trash2,
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
  status: string;
  source: string;
  primaryKeyword: string;
  contentHtml: string;
  contentMarkdown: string;
  wordCount: number;
  metaTitle: string;
  metaDescription: string;
  featuredImagePrompt: string;
  readabilityScore: number;
  topicScore: number;
  comparisonType: string;
  searchVolumeLow: number;
  searchVolumeHigh: number;
  keywordDifficulty: number;
  trendDirection: string;
  intentLabel: string;
  reasoning?: string;
  tags?: string;
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
  const [metaDescription, setMetaDescription] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [tags, setTags] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

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
      setMetaDescription(a.metaDescription);
      setPrimaryKeyword(a.primaryKeyword);
      setTags(a.tags || "");
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
        metaTitle: title,
        metaDescription,
        primaryKeyword,
        tags,
      }),
    });
    dirtyRef.current = false;
    setSaveState("saved");
  }, [id, html, title, metaDescription, primaryKeyword, tags]);

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

  async function handleDelete() {
    if (!window.confirm("Delete this post permanently?")) return;
    await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete" }),
    });
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="md:flex">
        <Sidebar />
        <main className="flex-1 px-6 py-8 text-sm text-gray-400 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </main>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="md:flex">
        <Sidebar />
        <main className="flex-1 px-6 py-8 text-sm text-gray-400">
          Post not found.
        </main>
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
    <div className="md:flex">
      <Sidebar />
      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-6 max-w-6xl mx-auto w-full">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={15} /> Pipeline
          </button>
          <div className="flex items-center gap-2 text-xs">
            {saveState === "saving" && (
              <span className="text-gray-500 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Saving…
              </span>
            )}
            {saveState === "saved" && (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check size={12} /> Saved
              </span>
            )}
            <button
              onClick={handleDelete}
              title="Delete post"
              className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <StatusBadge status={article.status} />
          <span
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${
              isManual
                ? "bg-purple-500/10 text-purple-300"
                : "bg-blue-500/10 text-blue-300"
            }`}
          >
            {isManual ? <PenLine size={11} /> : <Sparkles size={11} />}
            {isManual ? "Manual" : "AI-assisted"}
          </span>
          <span className="text-xs text-gray-500">{wordCount} words</span>
        </div>

        {/* Editable title */}
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          placeholder="Post title…"
          className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-gray-600 mb-4"
        />

        {error && (
          <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Editor */}
          <div>
            {article.humanInputMarkers.length > 0 && (
              <div className="bg-ink-900 border border-ink-700 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                  <AlertTriangle size={14} className="text-amber-400" />
                  Human input needed ({unresolvedCount} left)
                </div>
                <div className="space-y-2">
                  {article.humanInputMarkers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleMarker(m.id, !m.resolved)}
                      className={`w-full text-left flex items-start gap-2 px-3 py-2 rounded-lg text-xs transition ${
                        m.resolved
                          ? "bg-green-500/5 text-green-400 border border-green-500/15"
                          : "bg-amber-500/5 text-amber-300 border border-amber-500/15"
                      }`}
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

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Publish box */}
            <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">
              <div className="text-sm font-medium mb-3">Publish</div>
              {isPublished && article.wordpressUrl ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-400">
                  Sent to WordPress.
                  <a
                    href={article.wordpressUrl}
                    target="_blank"
                    className="block underline mt-1 text-xs"
                  >
                    Open in WordPress →
                  </a>
                </div>
              ) : null}

              {!canPublish && !isManual ? (
                <button
                  onClick={handleApprove}
                  disabled={!canApprove || approving}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                    canApprove
                      ? "bg-blue-600 hover:bg-blue-500"
                      : "bg-ink-800 text-gray-500 cursor-not-allowed border border-ink-700"
                  }`}
                >
                  {approving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {canApprove ? "Approve for publishing" : "Resolve markers + 700 words"}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handlePublish("draft")}
                    disabled={publishing !== null}
                    className="w-full inline-flex items-center justify-center gap-2 bg-ink-800 hover:bg-ink-700 border border-ink-600 disabled:opacity-50 rounded-lg py-2.5 text-sm font-medium"
                  >
                    {publishing === "draft" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <FileEdit size={14} />
                    )}
                    {publishing === "draft" ? "Sending…" : "Save as Draft"}
                  </button>
                  <button
                    onClick={() => handlePublish("publish")}
                    disabled={publishing !== null}
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg py-2.5 text-sm font-medium shadow-lg shadow-emerald-600/20"
                  >
                    {publishing === "publish" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Globe size={14} />
                    )}
                    {publishing === "publish" ? "Publishing…" : "Publish Live"}
                  </button>
                  <p className="text-[11px] text-gray-500">
                    Draft = safe review on WordPress. Live = published immediately.
                  </p>
                </div>
              )}
            </div>

            {/* SEO fields */}
            <div className="bg-ink-900 border border-ink-700 rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium">SEO</div>
              <Field
                label="Focus keyword"
                value={primaryKeyword}
                onChange={(v) => {
                  setPrimaryKeyword(v);
                  markDirty();
                }}
                placeholder="banff vs whistler"
              />
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Meta description
                  <span className="text-gray-600 ml-1">
                    {metaDescription.length}/160
                  </span>
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => {
                    setMetaDescription(e.target.value);
                    markDirty();
                  }}
                  rows={3}
                  placeholder="150-160 chars with a reason to click…"
                  className="w-full bg-ink-800 border border-ink-600 rounded-lg p-2 text-xs outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                  <Tag size={11} /> Tags (comma separated)
                </label>
                <input
                  value={tags}
                  onChange={(e) => {
                    setTags(e.target.value);
                    markDirty();
                  }}
                  placeholder="banff, whistler, rockies"
                  className="w-full bg-ink-800 border border-ink-600 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
                />
                {tags.trim() && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI insight (AI posts only) */}
            {!isManual && (
              <TopicInsight article={article} />
            )}

            {/* SEO checklist */}
            <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">
              <div className="text-sm font-medium mb-3">Quality checks</div>
              <div className="space-y-2 text-xs">
                <CheckRow label="Title set" pass={title.trim().length > 0} />
                <CheckRow label="Title ≤ 60 chars" pass={title.length <= 60 && title.length > 0} />
                <CheckRow
                  label="Meta description 140-165"
                  pass={metaDescription.length >= 140 && metaDescription.length <= 165}
                />
                <CheckRow label="Focus keyword set" pass={primaryKeyword.trim().length > 0} />
                <CheckRow label="Has content (300+ words)" pass={wordCount >= 300} />
                {!isManual && (
                  <CheckRow label="No unresolved markers" pass={unresolvedCount === 0} />
                )}
              </div>
            </div>

            {/* Thumbnail prompt (AI only) */}
            {!isManual && article.featuredImagePrompt && (
              <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <ImageIcon size={14} /> Thumbnail prompt
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-mono">
                  {article.featuredImagePrompt}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-ink-800 border border-ink-600 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
      />
    </div>
  );
}

function CheckRow({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      {pass ? (
        <CheckCircle2 size={14} className="text-green-400" />
      ) : (
        <Circle size={14} className="text-gray-600" />
      )}
    </div>
  );
}
