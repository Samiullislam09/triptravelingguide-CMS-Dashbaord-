"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  BarChart3,
  AlertCircle,
  Gauge,
  Trophy,
  Layers,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Funnel,
  FunnelChart,
  LabelList,
} from "recharts";

interface Stats {
  totalPublished: number;
  totalApproved: number;
  totalPendingReview: number;
  totalArticles: number;
  avgTopicScore: number;
  pipeline: Record<string, number>;
  byComparisonType: { destination: number; transport: number; stay: number };
  avgScoreByType: { type: string; avgScore: number; count: number }[];
  topTopics: {
    id: string;
    title: string;
    topicScore: number;
    comparisonType: string;
    status: string;
  }[];
  hasRealAnalyticsData: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  destination: "#3b82f6",
  transport: "#a855f7",
  stay: "#34d399",
};

const PIPELINE_LABELS: Record<string, string> = {
  discovered: "Discovered",
  drafted: "Drafted",
  pending_review: "Pending review",
  approved: "Approved",
  published: "Published",
};

const PIPELINE_COLORS = ["#64748b", "#3b82f6", "#f59e0b", "#22c55e", "#10b981"];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard-stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  const pieData = stats
    ? Object.entries(stats.byComparisonType)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  const funnelData = stats
    ? Object.entries(stats.pipeline).map(([key, value], i) => ({
        name: PIPELINE_LABELS[key] || key,
        value: Math.max(value, 0.0001),
        realValue: value,
        fill: PIPELINE_COLORS[i],
      }))
    : [];

  return (
    <div className="md:flex">
      <Sidebar />
      <main className="flex-1 px-4 py-5 sm:px-6 md:px-10 md:py-8 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-semibold tracking-tight mb-1 animate-fade-up">
          Analytics
        </h1>
        <p className="text-sm text-gray-400 mb-6 animate-fade-up">
          Pipeline &amp; scoring come from your own database. Ranking, traffic,
          and revenue need Search Console, GA4, and AdSense connected (Module 9).
        </p>

        {stats && !stats.hasRealAnalyticsData && (
          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6 text-xs text-amber-200/80 animate-fade-up">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              No Search Console, GA4, or AdSense data connected yet, so live
              ranking/revenue charts are empty. Everything below is real data
              from your content pipeline.
            </div>
          </div>
        )}

        {stats && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <Kpi label="Total topics" value={stats.totalArticles} icon={<Layers size={15} className="text-blue-400" />} delay={0} />
              <Kpi label="Avg topic score" value={stats.avgTopicScore} suffix="/100" icon={<Gauge size={15} className="text-emerald-400" />} delay={60} />
              <Kpi label="Pending review" value={stats.totalPendingReview} icon={<BarChart3 size={15} className="text-amber-400" />} delay={120} />
              <Kpi label="Published" value={stats.totalPublished} icon={<Trophy size={15} className="text-emerald-400" />} delay={180} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Pipeline funnel */}
              <div className="bg-ink-900 border border-ink-700 rounded-xl p-5 animate-fade-up">
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Layers size={15} className="text-blue-400" /> Pipeline health
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <FunnelChart>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(_v: any, _n: any, p: any) => [
                        p.payload.realValue,
                        p.payload.name,
                      ]}
                    />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList
                        position="right"
                        fill="#c7cad3"
                        stroke="none"
                        dataKey="name"
                        fontSize={11}
                      />
                      <LabelList
                        position="left"
                        fill="#9aa1ae"
                        stroke="none"
                        dataKey="realValue"
                        fontSize={11}
                      />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>

              {/* Content type pie */}
              <div className="bg-ink-900 border border-ink-700 rounded-xl p-5 animate-fade-up">
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <BarChart3 size={15} className="text-purple-400" /> Content type mix
                </div>
                {pieData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {pieData.map((d) => (
                          <Cell key={d.name} fill={TYPE_COLORS[d.name] || "#64748b"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="flex flex-wrap justify-center gap-3 mt-1">
                  {pieData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400 capitalize">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: TYPE_COLORS[d.name] }} />
                      {d.name} ({d.value})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Avg score by type */}
            <div className="bg-ink-900 border border-ink-700 rounded-xl p-5 mb-4 animate-fade-up">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Gauge size={15} className="text-emerald-400" /> Average topic score by type
                <span className="text-xs text-gray-500 font-normal">
                  — which comparison type the AI rates highest
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.avgScoreByType} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#3a4151" fontSize={11} />
                  <YAxis type="category" dataKey="type" stroke="#9aa1ae" fontSize={12} width={80} tickFormatter={(s) => s.charAt(0).toUpperCase() + s.slice(1)} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1A1E27" }} />
                  <Bar dataKey="avgScore" radius={[0, 6, 6, 0]} isAnimationActive>
                    {stats.avgScoreByType.map((d) => (
                      <Cell key={d.type} fill={TYPE_COLORS[d.type] || "#64748b"} />
                    ))}
                    <LabelList dataKey="avgScore" position="right" fill="#c7cad3" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top topics leaderboard */}
            <div className="bg-ink-900 border border-ink-700 rounded-xl p-5 animate-fade-up">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Trophy size={15} className="text-amber-400" /> Highest-scoring topics
              </div>
              {stats.topTopics.length === 0 ? (
                <EmptyChart />
              ) : (
                <div className="space-y-2.5">
                  {stats.topTopics.map((t, i) => (
                    <div key={t.id} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-200 truncate mb-1">{t.title}</div>
                        <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full origin-left animate-grow-x"
                            style={{
                              width: `${t.topicScore}%`,
                              animationDelay: `${i * 80}ms`,
                              background: TYPE_COLORS[t.comparisonType] || "#3b82f6",
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-300 w-9 text-right shrink-0">
                        {t.topicScore}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const tooltipStyle = {
  background: "#1A1E27",
  border: "1px solid #252A36",
  borderRadius: 8,
  fontSize: 12,
  color: "#e7e9ee",
};

function Kpi({
  label,
  value,
  suffix,
  icon,
  delay,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <div
      className="bg-ink-900 border border-ink-700 rounded-xl px-4 py-3.5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-semibold tabular-nums">
        {value}
        {suffix && <span className="text-sm text-gray-500 ml-0.5">{suffix}</span>}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[200px] flex items-center justify-center text-xs text-gray-600">
      No data yet — generate a few topics first.
    </div>
  );
}
