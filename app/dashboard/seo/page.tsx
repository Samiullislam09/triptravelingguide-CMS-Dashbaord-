"use client";

// SEMrush-style SEO command center powered by real Google Search Console data.
// Content-only page — the dashboard layout renders the sidebar.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  StatCard,
  SectionHeader,
  Button,
  Badge,
  EmptyState,
  Skeleton,
  cn,
} from "@/components/ui";
import {
  Search,
  RefreshCw,
  MousePointerClick,
  Eye,
  Percent,
  Gauge,
  Link2,
  Trophy,
  FileText,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface Status {
  connected: boolean;
  property?: string;
  lastSync?: string;
}

interface Row {
  query?: string;
  page?: string;
  clicks: number;
  impressions: number;
  position: number;
}

interface SeoData {
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  distribution: { top3: number; top10: number; top20: number; top100: number };
  topPages: { page: string; clicks: number; impressions: number; position: number }[];
  topQueries: { query: string; page: string; clicks: number; impressions: number; position: number }[];
  opportunities: { query: string; page: string; clicks: number; impressions: number; position: number }[];
}

const fmt = (n: number) => n.toLocaleString("en-US");
// Show just the path of a full URL so tables stay readable.
const shortPath = (url: string) => {
  try {
    const u = new URL(url);
    return u.pathname === "/" ? u.hostname : u.pathname;
  } catch {
    return url;
  }
};

// Ranking-quality tiers: best (Top 3) → worst (21-100). Green→amber→slate reads
// as a quality gradient, and each bucket is directly labelled so colour is never
// the only signal.
const DIST_TIERS = [
  { key: "top3" as const, label: "Top 3", hint: "positions 1–3", color: "#16a34a", soft: "bg-success-soft", text: "text-success" },
  { key: "top10" as const, label: "Top 10", hint: "positions 4–10", color: "#3b6cf6", soft: "bg-brand-50", text: "text-brand-600" },
  { key: "top20" as const, label: "Top 20", hint: "positions 11–20", color: "#d97706", soft: "bg-warn-soft", text: "text-warn" },
  { key: "top100" as const, label: "21–100", hint: "positions 21–100", color: "#94a3b8", soft: "bg-slate-100", text: "text-slate-500" },
];

// Position colour cue for table cells: page-1 green, page-2 amber, deeper grey.
function posTone(p: number): "success" | "warn" | "neutral" {
  if (p > 0 && p <= 10) return "success";
  if (p <= 20) return "warn";
  return "neutral";
}

export default function SeoPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [data, setData] = useState<SeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/gsc/data");
    if (res.ok) setData(await res.json());
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gsc/status");
      const s: Status = await res.json();
      setStatus(s);
      if (s.connected) await loadData();
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/gsc/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setSyncError(json.error || "Sync failed");
      } else {
        await loadData();
        // Refresh lastSync/property.
        const s = await fetch("/api/gsc/status").then((r) => r.json());
        setStatus(s);
      }
    } catch {
      setSyncError("Sync request failed");
    } finally {
      setSyncing(false);
    }
  }

  const lastSyncLabel = status?.lastSync
    ? new Date(status.lastSync).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : null;

  const hasData =
    data && (data.totals.impressions > 0 || data.topQueries.length > 0 || data.topPages.length > 0);
  const distMax = data
    ? Math.max(1, data.distribution.top3, data.distribution.top10, data.distribution.top20, data.distribution.top100)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">SEO &amp; Search</h1>
          <p className="text-sm text-muted mt-1">
            Real Google Search Console performance — last 28 days.
          </p>
        </div>
        {status?.connected && (
          <div className="flex items-center gap-3">
            {lastSyncLabel && (
              <span className="text-xs text-muted hidden sm:block">
                Last synced {lastSyncLabel}
              </span>
            )}
            <Button variant="primary" icon={RefreshCw} loading={syncing} onClick={handleSync}>
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        )}
      </div>

      {syncError && (
        <div className="glass border-danger/30 text-danger text-sm px-4 py-3 animate-fade-up">
          {syncError}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      )}

      {/* Not connected → prominent connect state */}
      {!loading && status && !status.connected && (
        <Card className="!p-0 overflow-hidden animate-fade-up">
          <div className="p-8 sm:p-12 text-center">
            <span className="mx-auto mb-4 grid place-items-center h-14 w-14 rounded-2xl bg-brand-50 text-brand-600">
              <Search size={26} />
            </span>
            <h2 className="text-xl font-bold text-ink">Connect Google Search Console</h2>
            <p className="text-sm text-muted mt-2 max-w-md mx-auto">
              See exactly which keywords and pages bring you traffic, where you rank,
              and which posts sit on the edge of page 1 — real quick-win opportunities
              to write or refresh next. All of it goes live once you connect Search
              Console (a one-time, 5-minute setup).
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="primary" icon={Link2} onClick={() => router.push("/dashboard/settings")}>
                Connect in Settings
              </Button>
            </div>
            <p className="text-xs text-muted mt-4">
              Setup guide: <code className="text-ink">GSC_SETUP.md</code>
            </p>
          </div>
        </Card>
      )}

      {/* Connected */}
      {!loading && status?.connected && (
        <>
          {/* Stat row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total clicks" value={fmt(data?.totals.clicks ?? 0)} icon={MousePointerClick} accent="brand" delay={0} />
            <StatCard label="Impressions" value={fmt(data?.totals.impressions ?? 0)} icon={Eye} accent="ai" delay={60} />
            <StatCard label="Avg. CTR" value={`${data?.totals.ctr ?? 0}%`} icon={Percent} accent="success" delay={120} />
            <StatCard label="Avg. position" value={data?.totals.position ?? 0} icon={Gauge} accent="warn" delay={180} />
          </div>

          {!hasData ? (
            <EmptyState
              icon={RefreshCw}
              title="No data synced yet"
              hint="Search Console is connected — run a sync to pull the last 28 days of clicks, impressions, and rankings."
              action={
                <Button variant="primary" icon={RefreshCw} loading={syncing} onClick={handleSync}>
                  Sync now
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Position distribution */}
                <Card delay={80}>
                  <SectionHeader title="Position distribution" subtitle="Ranking keywords by page" icon={TrendingUp} />
                  <div className="space-y-3">
                    {DIST_TIERS.map((t) => {
                      const count = data!.distribution[t.key];
                      return (
                        <div key={t.key} className="flex items-center gap-3">
                          <div className="w-20 shrink-0">
                            <div className={cn("text-sm font-semibold", t.text)}>{t.label}</div>
                            <div className="text-[11px] text-muted">{t.hint}</div>
                          </div>
                          <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${(count / distMax) * 100}%`, background: t.color }}
                            />
                          </div>
                          <span className="w-8 text-right text-sm font-bold tabular-nums text-ink">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted mt-4">
                    Keywords currently ranking, bucketed by average position over the last 28 days.
                  </p>
                </Card>

                {/* Opportunities */}
                <Card className="lg:col-span-2" delay={100}>
                  <SectionHeader
                    title="Quick-win opportunities"
                    subtitle="Ranking positions 5–25 with real impressions — a small push wins big"
                    icon={Sparkles}
                    action={
                      <Button variant="ai" icon={Sparkles} onClick={() => router.push("/dashboard/ai")}>
                        Improve with AI
                      </Button>
                    }
                  />
                  {data!.opportunities.length ? (
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {data!.opportunities.slice(0, 8).map((o, i) => (
                        <div key={i} className="rounded-xl border border-line bg-white/60 p-3 glass-hover">
                          <div className="flex items-center justify-between mb-1.5">
                            <Badge tone={posTone(o.position)}>#{o.position}</Badge>
                            <span className="text-xs text-muted">{fmt(o.impressions)} impr.</span>
                          </div>
                          <div className="text-sm font-medium text-ink line-clamp-2">{o.query}</div>
                          <div className="text-xs text-muted mt-1">
                            {o.clicks} clicks{o.page ? ` · ${shortPath(o.page)}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-sm text-muted">
                      No page-1-edge keywords yet. As pages start ranking on pages 1–3, quick wins appear here.
                    </div>
                  )}
                </Card>
              </div>

              {/* Tables */}
              <div className="grid lg:grid-cols-2 gap-6">
                <MetricTable
                  title="Top pages"
                  icon={FileText}
                  headLabel="Page"
                  rows={data!.topPages.map((p) => ({ ...p }))}
                  labelFor={(r) => shortPath(r.page || "")}
                  fullFor={(r) => r.page}
                />
                <MetricTable
                  title="Top queries"
                  icon={Trophy}
                  headLabel="Query"
                  rows={data!.topQueries.map((q) => ({ ...q }))}
                  labelFor={(r) => r.query || ""}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* --------------------------- Metric table --------------------------- */
function MetricTable({
  title,
  icon,
  headLabel,
  rows,
  labelFor,
  fullFor,
}: {
  title: string;
  icon: React.ComponentProps<typeof SectionHeader>["icon"];
  headLabel: string;
  rows: Row[];
  labelFor: (r: Row) => string;
  fullFor?: (r: Row) => string | undefined;
}) {
  return (
    <Card delay={120}>
      <SectionHeader title={title} icon={icon} />
      {rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted">No data.</div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-line">
                <th className="font-medium py-2 px-1">{headLabel}</th>
                <th className="font-medium py-2 px-1 text-right">Clicks</th>
                <th className="font-medium py-2 px-1 text-right">Impr.</th>
                <th className="font-medium py-2 px-1 text-right">Pos.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const full = fullFor?.(r);
                return (
                  <tr key={i} className="border-b border-line/60 last:border-0 hover:bg-white/60 transition">
                    <td className="py-2 px-1 max-w-[220px]">
                      {full ? (
                        <a
                          href={full}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ink hover:text-brand-600 truncate inline-flex items-center gap-1"
                          title={full}
                        >
                          <span className="truncate">{labelFor(r)}</span>
                          <ExternalLink size={11} className="shrink-0 text-slate-300" />
                        </a>
                      ) : (
                        <span className="text-ink block truncate" title={labelFor(r)}>
                          {labelFor(r)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-1 text-right font-semibold text-ink tabular-nums">{fmt(r.clicks)}</td>
                    <td className="py-2 px-1 text-right text-muted tabular-nums">{fmt(r.impressions)}</td>
                    <td className="py-2 px-1 text-right tabular-nums">
                      <Badge tone={posTone(r.position)}>{r.position}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
