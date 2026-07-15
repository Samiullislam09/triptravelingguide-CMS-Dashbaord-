"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  StatCard,
  SectionHeader,
  Button,
  Badge,
  Spinner,
  EmptyState,
  Skeleton,
  cn,
} from "@/components/ui";
import {
  FileText,
  Send,
  MousePointerClick,
  Gauge,
  Sparkles,
  PenLine,
  Compass,
  Eye,
  CheckCircle2,
  TrendingUp,
  Clapperboard,
  AlertTriangle,
  ArrowRight,
  Link2,
  Search,
} from "lucide-react";
import dynamic from "next/dynamic";

// Lazy-load the recharts activity chart so its heavy JS is a separate chunk
// fetched after the page paints — keeps the Overview first-load fast.
const ActivityChart = dynamic(() => import("@/components/ActivityChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-56" />,
});

interface Overview {
  counts: { total: number; published: number; needsRewrite: number; stories: number };
  pipeline: Record<string, number>;
  series: { date: string; label: string; created: number; published: number }[];
  gscConnected: boolean;
  search: { clicks: number; impressions: number; avgPosition: number; pagesTracked: number } | null;
  todaysPicks: { query: string; page: string; clicks: number; impressions: number; position: number }[];
  recent: { id: string; title: string; status: string; needsRewrite: boolean; coverImageUrl: string }[];
}

const STAGES = [
  { key: "discovered", label: "Discovered", icon: Compass, tone: "neutral" as const },
  { key: "drafted", label: "Drafted", icon: PenLine, tone: "brand" as const },
  { key: "pending_review", label: "In review", icon: Eye, tone: "warn" as const },
  { key: "approved", label: "Approved", icon: CheckCircle2, tone: "success" as const },
  { key: "published", label: "Published", icon: Send, tone: "success" as const },
];

export default function OverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/overview")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-US");
  const publishedSpark = data?.series.map((s) => s.published) ?? [];
  const createdSpark = data?.series.map((s) => s.created) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Overview</h1>
          <p className="text-sm text-muted mt-1">
            Your content engine &amp; search performance at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" icon={PenLine} onClick={() => router.push("/dashboard/content")}>
            Write post
          </Button>
          <Button variant="ai" icon={Sparkles} onClick={() => router.push("/dashboard/ai")}>
            AI Studio
          </Button>
        </div>
      </div>

      {/* GSC connect banner */}
      {!loading && data && !data.gscConnected && (
        <div className="glass p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-brand-200 animate-fade-up">
          <span className="grid place-items-center h-10 w-10 rounded-xl bg-brand-50 text-brand-600 shrink-0">
            <Search size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-ink text-sm">Connect Google Search Console for real data</div>
            <div className="text-sm text-muted">
              Clicks, impressions, ranking positions &amp; "which keyword to write next" — all go live once connected.
            </div>
          </div>
          <Button variant="soft" icon={Link2} onClick={() => router.push("/dashboard/settings")}>
            Connect GSC
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatCard
              label="Total posts"
              value={fmt(data?.counts.total ?? 0)}
              icon={FileText}
              accent="brand"
              spark={createdSpark}
              delay={0}
            />
            <StatCard
              label="Published"
              value={fmt(data?.counts.published ?? 0)}
              icon={Send}
              accent="success"
              spark={publishedSpark}
              delay={60}
            />
            <StatCard
              label="Search clicks (28d)"
              value={data?.search ? fmt(data.search.clicks) : "—"}
              icon={MousePointerClick}
              accent="ai"
              delay={120}
            />
            <StatCard
              label="Avg. position"
              value={data?.search ? data.search.avgPosition : "—"}
              icon={Gauge}
              accent="warn"
              delay={180}
            />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity chart */}
        <Card className="lg:col-span-2" delay={80}>
          <SectionHeader
            title="Publishing activity"
            subtitle="Last 14 days"
            icon={TrendingUp}
          />
          {loading ? (
            <Skeleton className="h-56" />
          ) : (
            <ActivityChart series={data?.series ?? []} />
          )}
        </Card>

        {/* Content pipeline */}
        <Card delay={140}>
          <SectionHeader title="Content pipeline" icon={FileText} />
          <div className="space-y-2.5">
            {STAGES.map((s) => {
              const Icon = s.icon;
              const count = data?.pipeline[s.key] ?? 0;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="grid place-items-center h-8 w-8 rounded-lg bg-slate-50 text-slate-500">
                    <Icon size={15} />
                  </span>
                  <span className="text-sm text-slate-600 flex-1">{s.label}</span>
                  <span className="text-lg font-bold tabular-nums text-ink">{loading ? "–" : count}</span>
                </div>
              );
            })}
          </div>
          {!loading && (data?.counts.needsRewrite ?? 0) > 0 && (
            <button
              onClick={() => router.push("/dashboard/content?filter=needsRewrite")}
              className="mt-4 w-full flex items-center gap-2 rounded-xl bg-warn-soft text-warn px-3 py-2.5 text-sm font-medium hover:brightness-95 transition"
            >
              <AlertTriangle size={15} />
              {data?.counts.needsRewrite} posts need rewrite
              <ArrowRight size={14} className="ml-auto" />
            </button>
          )}
        </Card>
      </div>

      {/* Today's pick — keyword opportunities */}
      <Card delay={100}>
        <SectionHeader
          title="Today's pick — keyword opportunities"
          subtitle="Pages ranking on the edge of page 1 — a small push wins big"
          icon={TrendingUp}
          action={
            <Button variant="ai" icon={Sparkles} onClick={() => router.push("/dashboard/ai")}>
              Write with AI
            </Button>
          }
        />
        {loading ? (
          <Skeleton className="h-32" />
        ) : data?.todaysPicks.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.todaysPicks.map((p, i) => (
              <div key={i} className="rounded-xl border border-line bg-white/60 p-3.5 glass-hover">
                <div className="flex items-center justify-between mb-1.5">
                  <Badge tone="brand">#{p.position}</Badge>
                  <span className="text-xs text-muted">{fmt(p.impressions)} impr.</span>
                </div>
                <div className="text-sm font-medium text-ink line-clamp-2">{p.query}</div>
                <div className="text-xs text-muted mt-1">{p.clicks} clicks · pos {p.position}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title={data?.gscConnected ? "No opportunities yet" : "Connect Search Console"}
            hint={
              data?.gscConnected
                ? "Once you have pages ranking on page 1–3, they'll show here as quick wins."
                : "Real keyword opportunities (which post to write next) appear here after you connect GSC in Settings."
            }
            action={
              !data?.gscConnected && (
                <Button variant="soft" icon={Link2} onClick={() => router.push("/dashboard/settings")}>
                  Connect GSC
                </Button>
              )
            }
          />
        )}
      </Card>

      {/* Recent posts */}
      <Card delay={120}>
        <SectionHeader
          title="Recent posts"
          icon={FileText}
          action={
            <Button variant="ghost" onClick={() => router.push("/dashboard/content")}>
              View all
            </Button>
          }
        />
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : data?.recent.length ? (
          <div className="space-y-1.5">
            {data.recent.map((a) => (
              <button
                key={a.id}
                onClick={() => router.push(`/review/${a.id}`)}
                className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/70 transition group"
              >
                <span
                  className={cn(
                    "h-10 w-10 rounded-lg bg-cover bg-center shrink-0 bg-slate-100",
                  )}
                  style={a.coverImageUrl ? { backgroundImage: `url(${a.coverImageUrl})` } : undefined}
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-ink truncate">{a.title}</span>
                  <span className="flex items-center gap-2 mt-0.5">
                    <Badge tone={a.status === "published" ? "success" : "neutral"}>{a.status}</Badge>
                    {a.needsRewrite && <Badge tone="warn" icon={AlertTriangle}>rewrite</Badge>}
                  </span>
                </span>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition" />
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon={Sparkles} title="No posts yet" hint="Generate your first article with AI Studio." />
        )}
      </Card>
    </div>
  );
}
