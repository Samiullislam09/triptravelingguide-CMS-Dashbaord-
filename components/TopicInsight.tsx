"use client";

import { useState } from "react";
import {
  Brain,
  ChevronDown,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
} from "lucide-react";
import ScoreGauge from "./ScoreGauge";
import { getScoreBreakdown } from "@/lib/scoreBreakdown";

interface InsightArticle {
  primaryKeyword: string;
  comparisonType: string;
  topicScore: number;
  searchVolumeLow: number;
  searchVolumeHigh: number;
  keywordDifficulty: number;
  trendDirection: string;
  intentLabel: string;
  reasoning?: string;
}

/**
 * The "why did the AI pick this?" panel. Shows the AI's reasoning, the keyword
 * metrics, and an animated breakdown of every factor behind the topic score —
 * so the operator can see the decision, not just the result.
 */
export default function TopicInsight({
  article,
  defaultOpen = false,
}: {
  article: InsightArticle;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const factors = getScoreBreakdown(article);

  const TrendIcon =
    article.trendDirection === "rising"
      ? TrendingUp
      : article.trendDirection === "declining"
      ? TrendingDown
      : Minus;

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-800/50 transition"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
            <Brain size={13} className="text-blue-400" />
          </span>
          Why the AI picked this
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 animate-fade-in">
          {article.reasoning && (
            <p className="text-sm text-gray-300 leading-relaxed bg-ink-800/60 border border-ink-700 rounded-lg p-3 mb-4">
              <span className="text-blue-400 font-medium">AI&apos;s reasoning: </span>
              {article.reasoning}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="shrink-0 flex sm:flex-col items-center justify-center gap-3 sm:w-28">
              <ScoreGauge score={article.topicScore} />
            </div>

            <div className="flex-1 space-y-2.5">
              {factors.map((f, i) => (
                <div key={f.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-300">{f.label}</span>
                    <span className="text-gray-500">
                      <span className="text-gray-300 font-medium">{f.raw}</span>
                      /100 · {f.weightPct}% weight
                    </span>
                  </div>
                  <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full origin-left animate-grow-x"
                      style={{
                        width: `${f.raw}%`,
                        animationDelay: `${i * 90}ms`,
                        background:
                          f.raw >= 70
                            ? "linear-gradient(90deg,#34d399,#10b981)"
                            : f.raw >= 45
                            ? "linear-gradient(90deg,#60a5fa,#3b82f6)"
                            : "linear-gradient(90deg,#fbbf24,#f59e0b)",
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                    {f.explain}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <Metric
              icon={<Search size={12} />}
              label="Keyword"
              value={article.primaryKeyword}
              mono
            />
            <Metric
              icon={<TrendIcon size={12} />}
              label="Trend"
              value={article.trendDirection}
            />
            <Metric
              icon={<Target size={12} />}
              label="Difficulty"
              value={`${article.keywordDifficulty}/100`}
            />
            <Metric
              label="Volume/mo"
              value={`${article.searchVolumeLow.toLocaleString()}–${article.searchVolumeHigh.toLocaleString()}`}
            />
          </div>
          <p className="text-[10px] text-gray-600 mt-2">
            Volume &amp; difficulty are AI estimates, not verified search data
            (no paid keyword API connected yet — see blueprint §3.4).
          </p>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-ink-800/60 border border-ink-700 rounded-lg px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-0.5">
        {icon}
        {label}
      </div>
      <div
        className={`text-xs text-gray-200 capitalize truncate ${
          mono ? "font-mono lowercase" : ""
        }`}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
