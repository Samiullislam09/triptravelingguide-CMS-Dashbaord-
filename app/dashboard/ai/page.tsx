"use client";

// AI Studio — the flagship 1-click pipeline. Describe a topic (or let AI pick
// a trending one) and it chains four endpoints in sequence to produce a full
// article + thumbnail + web story, showing live step-by-step progress.
//
// Step chain (each call surfaces the article id to the next step):
//   1. POST /api/topics/generate            -> discovers + scores a topic, creates a `discovered` Article
//   2. POST /api/articles/[id]/generate-draft -> writes the 700+ word draft + SEO meta
//   3. POST /api/articles/[id]/thumbnail      -> template thumbnail (owned by Agent A; may not exist yet)
//   4. POST /api/articles/[id]/story          -> 5-7 slide web story (ours, lib/webstory.ts)
//
// This is content-only: the dashboard layout renders the sidebar around it.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  SectionHeader,
  Button,
  Badge,
  ProgressBar,
  cn,
} from "@/components/ui";
import {
  Sparkles,
  Wand2,
  PenLine,
  Image as ImageIcon,
  Clapperboard,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  BookOpen,
  Zap,
} from "lucide-react";

type StepStatus = "pending" | "running" | "done" | "error" | "skipped";

interface StepState {
  id: string;
  label: string;
  detail: string;
  icon: typeof Wand2;
  status: StepStatus;
  error?: string;
}

const INITIAL_STEPS: StepState[] = [
  {
    id: "research",
    label: "Research + draft topic",
    detail: "AI discovers and scores a trending travel-comparison angle",
    icon: Wand2,
    status: "pending",
  },
  {
    id: "write",
    label: "Write the article",
    detail: "700+ word structured draft with SEO metadata",
    icon: PenLine,
    status: "pending",
  },
  {
    id: "thumbnail",
    label: "Generate thumbnail",
    detail: "Branded 1200×630 cover image",
    icon: ImageIcon,
    status: "pending",
  },
  {
    id: "story",
    label: "Build web story",
    detail: "5-7 slide mobile story deck",
    icon: Clapperboard,
    status: "pending",
  },
];

export default function AIStudioPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [picks, setPicks] = useState<{ query: string }[]>([]);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<StepState[]>(INITIAL_STEPS);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch("/api/overview")
      .then((r) => r.json())
      .then((d) => setPicks(d?.todaysPicks ?? []))
      .catch(() => {});
  }, []);

  function updateStep(id: string, patch: Partial<StepState>) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  async function runPipeline() {
    setRunning(true);
    setFinished(false);
    setArticleId(null);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending", error: undefined })));

    let currentId: string | null = null;

    // Step 1 — research + draft topic (creates the Article row). A typed topic
    // is passed as a seed keyword; blank lets Gemini research a trending one.
    updateStep("research", { status: "running" });
    try {
      const seed = topic.trim();
      const res = await fetch("/api/topics/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seed ? { keyword: seed } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Topic research failed");
      currentId = data.article?.id;
      if (!currentId) throw new Error("No article id returned");
      setArticleId(currentId);
      updateStep("research", { status: "done" });
    } catch (e) {
      updateStep("research", {
        status: "error",
        error: e instanceof Error ? e.message : "Failed",
      });
      setRunning(false);
      return; // can't continue without an article id
    }

    // Step 2 — write the full draft.
    updateStep("write", { status: "running" });
    try {
      const res = await fetch(`/api/articles/${currentId}/generate-draft`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Draft generation failed");
      updateStep("write", { status: "done" });
    } catch (e) {
      updateStep("write", {
        status: "error",
        error: e instanceof Error ? e.message : "Failed",
      });
      // Keep going — thumbnail/story can still be attempted, though they may
      // fail too if there's no content yet.
    }

    // Step 3 — thumbnail (owned by another agent; treat 404/failure as non-fatal).
    updateStep("thumbnail", { status: "running" });
    try {
      const res = await fetch(`/api/articles/${currentId}/thumbnail`, { method: "POST" });
      if (res.status === 404) {
        updateStep("thumbnail", { status: "skipped", error: "Not available yet" });
      } else {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Thumbnail generation failed");
        updateStep("thumbnail", { status: "done" });
      }
    } catch (e) {
      updateStep("thumbnail", {
        status: "skipped",
        error: e instanceof Error ? e.message : "Skipped",
      });
    }

    // Step 4 — web story.
    updateStep("story", { status: "running" });
    try {
      const res = await fetch(`/api/articles/${currentId}/story`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Web story generation failed");
      updateStep("story", { status: "done" });
    } catch (e) {
      updateStep("story", {
        status: "error",
        error: e instanceof Error ? e.message : "Failed",
      });
    }

    setRunning(false);
    setFinished(true);
  }

  const progressPct =
    (steps.filter((s) => s.status === "done" || s.status === "skipped" || s.status === "error").length /
      steps.length) *
    100;

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight text-ink">AI Studio</h1>
        <p className="text-sm text-muted mt-1">
          One click: research, write, illustrate, and package a full article + web story.
        </p>
      </div>

      {/* Hero */}
      <div className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-br from-ai-500 to-brand-600 shadow-glass-lg animate-fade-up relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 animate-float" />
        <div className="absolute bottom-0 right-24 h-24 w-24 rounded-full bg-white/10 animate-float" style={{ animationDelay: "1.2s" }} />
        <div className="relative flex items-start gap-3">
          <span className="grid place-items-center h-11 w-11 rounded-2xl bg-white/15 shrink-0">
            <Sparkles size={20} />
          </span>
          <div>
            <h2 className="text-lg font-bold">Describe a topic, or let AI research a trending one</h2>
            <p className="text-sm text-white/80 mt-1 max-w-xl">
              Type a destination, comparison, or keyword idea below — or leave it blank and hit
              Generate. TripTravelingGuide AI will discover a scored topic, draft the article,
              build a thumbnail, and package a web story automatically.
            </p>
          </div>
        </div>

        <div className="relative mt-5 flex flex-col sm:flex-row gap-3">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Banff vs Jasper for a Canadian road trip"
            disabled={running}
            className="flex-1 rounded-xl bg-white/15 placeholder-white/60 text-white border border-white/25 focus:border-white/60 outline-none px-4 py-3 text-sm backdrop-blur-sm disabled:opacity-60"
          />
          <button
            onClick={runPipeline}
            disabled={running}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-brand-700 font-semibold px-5 py-3 text-sm shadow-lg hover:brightness-105 transition disabled:opacity-60 whitespace-nowrap"
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {running ? "Generating…" : "Generate with AI"}
          </button>
        </div>

        {picks.length > 0 && (
          <div className="relative mt-4">
            <div className="text-xs text-white/70 mb-2">Today's picks — tap to prefill</div>
            <div className="flex flex-wrap gap-2">
              {picks.slice(0, 6).map((p, i) => (
                <button
                  key={i}
                  onClick={() => setTopic(p.query)}
                  disabled={running}
                  className="text-xs bg-white/15 hover:bg-white/25 border border-white/20 rounded-full px-3 py-1.5 transition disabled:opacity-60"
                >
                  {p.query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step progress */}
      {(running || finished) && (
        <Card className="animate-fade-up">
          <SectionHeader
            title="Pipeline progress"
            subtitle={articleId ? `Article ID: ${articleId}` : undefined}
            icon={Sparkles}
          />
          <ProgressBar value={progressPct} tone="ai" />
          <div className="mt-5 space-y-4">
            {steps.map((step) => (
              <StepRow key={step.id} step={step} />
            ))}
          </div>
        </Card>
      )}

      {/* Success card */}
      {finished && articleId && (
        <Card className="animate-fade-up border-success/30">
          <div className="flex items-start gap-3">
            <span className="grid place-items-center h-11 w-11 rounded-2xl bg-success-soft text-success shrink-0">
              <CheckCircle2 size={20} />
            </span>
            <div className="flex-1">
              <h3 className="font-bold text-ink">Your content is ready</h3>
              <p className="text-sm text-muted mt-1">
                Review the draft, confirm any human-input markers, then publish — and check out
                the auto-generated web story.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button variant="primary" icon={BookOpen} onClick={() => router.push(`/review/${articleId}`)}>
                  Review &amp; edit article
                </Button>
                <Button variant="soft" icon={Clapperboard} onClick={() => router.push("/dashboard/stories")}>
                  View web story
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function StepRow({ step }: { step: StepState }) {
  const Icon = step.icon;
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "grid place-items-center h-9 w-9 rounded-xl shrink-0 transition",
          step.status === "done" && "bg-success-soft text-success",
          step.status === "running" && "bg-ai-500/10 text-ai-600",
          step.status === "error" && "bg-danger-soft text-danger",
          step.status === "skipped" && "bg-warn-soft text-warn",
          step.status === "pending" && "bg-slate-100 text-slate-400"
        )}
      >
        {step.status === "running" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : step.status === "done" ? (
          <CheckCircle2 size={16} />
        ) : step.status === "error" ? (
          <XCircle size={16} />
        ) : step.status === "skipped" ? (
          <Icon size={16} />
        ) : (
          <Circle size={16} />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-ink">{step.label}</span>
          {step.status === "done" && <Badge tone="success">Done</Badge>}
          {step.status === "running" && <Badge tone="ai">Running</Badge>}
          {step.status === "error" && <Badge tone="danger">Error</Badge>}
          {step.status === "skipped" && <Badge tone="warn">Skipped</Badge>}
        </div>
        <p className="text-xs text-muted mt-0.5">{step.detail}</p>
        {step.error && (step.status === "error" || step.status === "skipped") && (
          <p className="text-xs text-danger mt-1">{step.error}</p>
        )}
      </div>
    </div>
  );
}
