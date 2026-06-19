"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import StatusBadge from "@/components/StatusBadge";
import TopicInsight from "@/components/TopicInsight";
import ActivityHistory from "@/components/ActivityHistory";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  TrendingUp,
  FileText,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Compass,
  PenLine,
  Eye,
  CheckCircle2,
  Send,
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  status: string;
  primaryKeyword: string;
  comparisonType: string;
  topicScore: number;
  searchVolumeLow: number;
  searchVolumeHigh: number;
  keywordDifficulty: number;
  trendDirection: string;
  intentLabel: string;
  reasoning?: string;
  wordCount: number;
  humanInputMarkers: { resolved: boolean }[];
  createdAt: string;
}

const STAGES = [
  { key: "discovered", label: "Discovered", icon: Compass, color: "text-gray-300" },
  { key: "drafted", label: "Drafted", icon: PenLine, color: "text-blue-400" },
  { key: "pending_review", label: "Pending review", icon: Eye, color: "text-amber-400" },
  { key: "approved", label: "Approved", icon: CheckCircle2, color: "text-green-400" },
  { key: "published", label: "Published", icon: Send, color: "text-emerald-400" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingTopic, setGeneratingTopic] = useState(false);
  const [generatingDraftId, setGeneratingDraftId] = useState<string | null>(null);
  const [creatingManual, setCreatingManual] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateManual() {
    setError("");
    setCreatingManual(true);
    try {
      const res = await fetch("/api/articles/create-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled post" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create post");
      router.push(`/review/${data.article.id}`);
    } catch (e: any) {
      setError(e.message);
      setCreatingManual(false);
    }
  }

  const fetchArticles = useCallback(async () => {
    const res = await fetch("/api/articles");
    const data = await res.json();
    if (res.ok) setArticles(data.articles);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  async function handleGenerateTopic() {
    setError("");
    setGeneratingTopic(true);
    try {
      const res = await fetch("/api/topics/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchArticles();
    } catch (e: any) {
      setError(e.message || "Failed to generate topic");
    } finally {
      setGeneratingTopic(false);
    }
  }

  async function handleGenerateDraft(id: string) {
    setError("");
    setGeneratingDraftId(id);
    try {
      const res = await fetch(`/api/articles/${id}/generate-draft`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchArticles();
    } catch (e: any) {
      setError(e.message || "Failed to generate draft");
    } finally {
      setGeneratingDraftId(null);
    }
  }

  const stageCounts = STAGES.reduce((acc, stage) => {
    acc[stage.key] = articles.filter((a) =>
      stage.key === "discovered"
        ? ["discovered", "titled"].includes(a.status)
        : stage.key === "drafted"
        ? ["drafted", "seo_tagged", "linked", "imaged"].includes(a.status)
        : a.status === stage.key
    ).length;
    return acc;
  }, {} as Record<string, number>);

  const newTopics = articles.filter((a) =>
    ["discovered", "titled"].includes(a.status)
  );
  const pendingReview = articles.filter((a) => a.status === "pending_review");
  const others = articles.filter(
    (a) => !["discovered", "titled", "pending_review"].includes(a.status)
  );

  return (
    <div className="md:flex">
      <Sidebar />
      <main className="flex-1 px-4 py-5 sm:px-6 md:px-10 md:py-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 animate-fade-up">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Content pipeline
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              AI discovers the topic &amp; keyword, writes an SEO draft, and shows
              you <span className="text-gray-300">exactly why</span> — you review
              and approve.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateManual}
              disabled={creatingManual}
              className="inline-flex items-center justify-center gap-2 bg-ink-800 hover:bg-ink-700 border border-ink-600 disabled:opacity-50 transition rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap"
            >
              {creatingManual ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <PenLine size={15} />
              )}
              Write post
            </button>
            <button
              onClick={handleGenerateTopic}
              disabled={generatingTopic}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 transition rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg shadow-blue-600/20 whitespace-nowrap"
            >
              {generatingTopic ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              {generatingTopic ? "AI is researching…" : "Generate topic"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 animate-fade-up">
            {error}
          </div>
        )}

        {/* Pipeline funnel */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const count = stageCounts[s.key] || 0;
            return (
              <div
                key={s.key}
                className="relative bg-ink-900 border border-ink-700 rounded-xl px-4 py-3.5 overflow-hidden animate-fade-up hover:border-ink-600 transition"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <Icon size={16} className={s.color} />
                  <span className="text-2xl font-semibold tabular-nums">
                    {count}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1.5">{s.label}</div>
                {i < STAGES.length - 1 && (
                  <ArrowRight
                    size={12}
                    className="hidden lg:block absolute -right-[7px] top-1/2 -translate-y-1/2 text-ink-600 z-10"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Daily activity history */}
        <div className="mb-8">
          <ActivityHistory />
        </div>

        {loading && (
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading articles…
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="text-center py-16 border border-dashed border-ink-700 rounded-xl animate-fade-up">
            <Sparkles className="mx-auto text-blue-400/60 mb-3" size={28} />
            <p className="text-sm text-gray-400 mb-4">
              No topics yet. Let the AI find the first one.
            </p>
            <button
              onClick={handleGenerateTopic}
              disabled={generatingTopic}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition rounded-lg px-4 py-2 text-sm font-medium"
            >
              <Sparkles size={14} /> Generate first topic
            </button>
          </div>
        )}

        {/* New topics */}
        {newTopics.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Compass size={14} className="text-blue-400" />
              New topics — ready for AI to write
            </h2>
            <div className="space-y-4">
              {newTopics.map((a, idx) => (
                <div
                  key={a.id}
                  className="bg-ink-900 border border-ink-700 rounded-xl p-4 sm:p-5 animate-fade-up"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <StatusBadge status={a.status} />
                        <span className="text-xs px-2 py-0.5 rounded-md bg-ink-800 text-gray-400 capitalize">
                          {a.comparisonType}
                        </span>
                        {a.trendDirection === "rising" && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400">
                            <TrendingUp size={11} /> Rising
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-blue-300">
                          Score {a.topicScore}/100
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-medium leading-snug">
                        {a.title}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <TopicInsight article={a} />
                  </div>

                  <button
                    onClick={() => handleGenerateDraft(a.id)}
                    disabled={generatingDraftId === a.id}
                    className="inline-flex items-center gap-2 bg-ink-800 hover:bg-ink-700 border border-ink-600 disabled:opacity-50 transition rounded-lg px-3.5 py-2 text-sm font-medium"
                  >
                    {generatingDraftId === a.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Writing 700+ word draft…
                      </>
                    ) : (
                      <>
                        <FileText size={14} /> Generate title, draft &amp; SEO
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pending review */}
        {pendingReview.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Eye size={14} className="text-amber-400" />
              Waiting for your review
            </h2>
            <div className="space-y-2">
              {pendingReview.map((a) => {
                const unresolvedCount = a.humanInputMarkers.filter(
                  (m) => !m.resolved
                ).length;
                return (
                  <button
                    key={a.id}
                    onClick={() => router.push(`/review/${a.id}`)}
                    className="w-full text-left bg-ink-900 border border-ink-700 hover:border-blue-500/40 rounded-xl p-4 transition flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={a.status} />
                        <span className="text-xs text-gray-500">
                          {a.wordCount} words
                        </span>
                      </div>
                      <div className="text-sm font-medium">{a.title}</div>
                      {unresolvedCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                          <AlertTriangle size={11} />
                          {unresolvedCount} marker{unresolvedCount > 1 ? "s" : ""} need
                          attention
                        </div>
                      )}
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-gray-500 shrink-0 group-hover:translate-x-0.5 group-hover:text-blue-400 transition"
                    />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Approved & published */}
        {others.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Send size={14} className="text-emerald-400" />
              Approved &amp; published
            </h2>
            <div className="space-y-2">
              {others.map((a) => (
                <div
                  key={a.id}
                  className="bg-ink-900 border border-ink-700 rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="text-sm font-medium">{a.title}</div>
                  </div>
                  <button
                    onClick={() => router.push(`/review/${a.id}`)}
                    className="text-xs bg-ink-800 hover:bg-ink-700 border border-ink-600 rounded-lg px-3 py-1.5 shrink-0"
                  >
                    {a.status === "approved" ? "Publish to WordPress" : "View"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
