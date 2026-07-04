"use client";

import { useEffect, useState } from "react";
import {
  Card,
  SectionHeader,
  Button,
  Badge,
  Skeleton,
  cn,
} from "@/components/ui";
import {
  Globe,
  Wifi,
  Search,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

const SITE_NAME = "TripTravelingGuide";
const FRONTEND_URL = "https://triptravelingguide.com";

// ---- Types ------------------------------------------------------------------

interface WpTestResult {
  ok: boolean;
  message: string;
}

interface GscStatus {
  connected: boolean;
  property?: string;
  lastSync?: string;
}

interface GscSyncResult {
  queries?: number;
  pages?: number;
  error?: string;
}

interface StatusInfo {
  geminiKeys: number;
  wordpress: boolean;
  gscConfigured: boolean;
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="text-sm text-muted mt-1">
          Connections and credentials — all secrets live in your .env file, never in the database.
        </p>
      </div>

      <SiteCard />
      <WordPressCard />
      <GscCard />
      <AiCard />
    </div>
  );
}

// ---- Site --------------------------------------------------------------------

function SiteCard() {
  return (
    <Card delay={0}>
      <SectionHeader title="Site" subtitle="Your published destination" icon={Globe} />
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium text-muted mb-1">Site name</div>
          <div className="text-sm font-semibold text-ink">{SITE_NAME}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted mb-1">Frontend URL</div>
          <a
            href={FRONTEND_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            {FRONTEND_URL}
          </a>
        </div>
      </div>
      <p className="text-xs text-muted mt-3">
        This is a read-only display — change your domain/DNS in Vercel, not here.
      </p>
    </Card>
  );
}

// ---- WordPress -----------------------------------------------------------------

function WordPressCard() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<WpTestResult | null>(null);

  async function handleTest() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/wordpress/test-connection");
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, message: "Request failed" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card delay={60}>
      <SectionHeader title="WordPress connection" subtitle="Legacy publishing target, used for cross-posting" icon={Wifi} />
      <p className="text-sm text-muted mb-4">
        Verifies <code className="text-xs bg-slate-50 px-1 py-0.5 rounded">WORDPRESS_URL</code>,{" "}
        <code className="text-xs bg-slate-50 px-1 py-0.5 rounded">WORDPRESS_USERNAME</code>, and{" "}
        <code className="text-xs bg-slate-50 px-1 py-0.5 rounded">WORDPRESS_APP_PASSWORD</code> from .env are correct.
      </p>
      <Button variant="soft" icon={Wifi} loading={testing} onClick={handleTest}>
        {testing ? "Testing..." : "Test connection"}
      </Button>

      {result && (
        <div
          className={cn(
            "mt-3 flex items-start gap-2 text-sm rounded-xl px-3 py-2.5 border",
            result.ok ? "bg-success-soft text-success border-success/20" : "bg-danger-soft text-danger border-danger/20"
          )}
        >
          {result.ok ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <XCircle size={15} className="shrink-0 mt-0.5" />}
          {result.message}
        </div>
      )}
    </Card>
  );
}

// ---- Google Search Console -----------------------------------------------------

function GscCard() {
  const [status, setStatus] = useState<GscStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<GscSyncResult | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  async function loadStatus() {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/gsc/status");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatus(data);
    } catch {
      // Endpoint not configured / not built yet — show a graceful fallback.
      setStatus({ connected: false });
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/gsc/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncResult({ error: data.error || "Sync failed" });
      } else {
        setSyncResult(data);
        loadStatus();
      }
    } catch {
      setSyncResult({ error: "Request failed" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card delay={120}>
      <SectionHeader
        title="Google Search Console"
        subtitle="Real clicks, impressions & ranking positions"
        icon={Search}
        action={
          loadingStatus ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <Badge tone={status?.connected ? "success" : "neutral"}>
              {status?.connected ? "Connected" : "Not connected"}
            </Badge>
          )
        }
      />

      {loadingStatus ? (
        <Skeleton className="h-16" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs font-medium text-muted mb-1">Property</div>
            <div className="text-sm text-ink">{status?.property || "—"}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted mb-1">Last sync</div>
            <div className="text-sm text-ink">
              {status?.lastSync ? new Date(status.lastSync).toLocaleString() : "Never"}
            </div>
          </div>
        </div>
      )}

      <Button variant="soft" icon={RefreshCw} loading={syncing} onClick={handleSync}>
        {syncing ? "Syncing..." : "Sync now"}
      </Button>

      {syncResult && (
        <div
          className={cn(
            "mt-3 flex items-start gap-2 text-sm rounded-xl px-3 py-2.5 border",
            syncResult.error
              ? "bg-danger-soft text-danger border-danger/20"
              : "bg-success-soft text-success border-success/20"
          )}
        >
          {syncResult.error ? (
            <XCircle size={15} className="shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
          )}
          {syncResult.error
            ? syncResult.error
            : `Synced ${syncResult.queries ?? 0} queries and ${syncResult.pages ?? 0} pages.`}
        </div>
      )}

      <button
        onClick={() => setHelpOpen((v) => !v)}
        className="mt-4 flex w-full items-center justify-between text-sm font-medium text-ink hover:text-brand-600 transition"
      >
        How to connect
        <ChevronDown size={16} className={cn("transition-transform", helpOpen && "rotate-180")} />
      </button>
      {helpOpen && (
        <ol className="mt-3 space-y-2 text-sm text-muted list-decimal pl-5">
          <li>Create a Google Cloud service account (any project you control).</li>
          <li>Enable the Search Console API for that project.</li>
          <li>
            In Google Search Console, open the property's Settings → Users and permissions, and add the
            service account's email as a <strong>Full</strong> user.
          </li>
          <li>
            Copy the service account's JSON key into env <code className="text-xs bg-slate-50 px-1 py-0.5 rounded">GSC_SERVICE_ACCOUNT_JSON</code>{" "}
            (as a raw JSON string), and set <code className="text-xs bg-slate-50 px-1 py-0.5 rounded">GSC_PROPERTY</code>{" "}
            (e.g. <code className="text-xs bg-slate-50 px-1 py-0.5 rounded">sc-domain:triptravelingguide.com</code>).
          </li>
          <li>
            Full step-by-step instructions are in <code className="text-xs bg-slate-50 px-1 py-0.5 rounded">GSC_SETUP.md</code> at the project root.
          </li>
        </ol>
      )}
    </Card>
  );
}

// ---- AI (Gemini) ---------------------------------------------------------------

function AiCard() {
  const [info, setInfo] = useState<StatusInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/status")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card delay={180}>
      <SectionHeader title="AI (Gemini)" subtitle="Used for topic discovery, drafting, SEO & thumbnails" icon={Sparkles} />
      {loading ? (
        <Skeleton className="h-10" />
      ) : (
        <div className="flex items-center gap-3">
          <Badge tone={info && info.geminiKeys > 0 ? "success" : "danger"}>
            {info ? `${info.geminiKeys} key${info.geminiKeys === 1 ? "" : "s"} configured` : "Unknown"}
          </Badge>
          <span className="text-sm text-muted">
            {info && info.geminiKeys > 1
              ? "Multiple keys enable automatic failover when a quota is hit."
              : info && info.geminiKeys === 1
              ? "Add GEMINI_API_KEY1..4 in .env for automatic failover on quota limits."
              : "No Gemini key detected — AI generation will fail until one is set."}
          </span>
        </div>
      )}
      <p className="text-xs text-muted mt-3">
        Model: gemini-2.5-flash. Free-tier keys from{" "}
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-700">
          aistudio.google.com/app/apikey
        </a>
        .
      </p>
    </Card>
  );
}
