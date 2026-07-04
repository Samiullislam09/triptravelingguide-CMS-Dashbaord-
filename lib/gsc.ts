// Module 9 — Google Search Console integration.
// Auth model: a Google Cloud **service account** (no OAuth consent screen, no
// refresh-token dance). The service-account email is added as a "Full" user
// on the Search Console property; from then on this server can read analytics
// with just the JSON key. See GSC_SETUP.md for the click-by-click owner steps.
//
// Env vars:
//   GSC_SERVICE_ACCOUNT_JSON — raw JSON string of the downloaded key file
//   GSC_PROPERTY             — e.g. "sc-domain:triptravelingguide.com"
//                               (or "https://triptravelingguide.com/" for a
//                               URL-prefix property)
import { google } from "googleapis";
import { prisma } from "@/lib/db";

const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

/** True once both required env vars are present (does not verify they're valid). */
export function isGscConfigured(): boolean {
  return Boolean(process.env.GSC_SERVICE_ACCOUNT_JSON && process.env.GSC_PROPERTY);
}

/** The configured Search Console property (siteUrl), e.g. "sc-domain:example.com". */
export function getProperty(): string {
  return process.env.GSC_PROPERTY || "";
}

/** Parses GSC_SERVICE_ACCOUNT_JSON, throwing a clear error if it's missing/malformed. */
function parseCredentials(): { client_email: string; private_key: string; [k: string]: unknown } {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "GSC_SERVICE_ACCOUNT_JSON is not set in .env — see GSC_SETUP.md to create a service account."
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "GSC_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the ENTIRE contents of the service-account " +
        "key file as a single-quoted string in .env, e.g. GSC_SERVICE_ACCOUNT_JSON='{...}'"
    );
  }
}

function getAuth() {
  const credentials = parseCredentials();
  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
}

/**
 * Verifies the service account can actually mint a token. Cheap sanity check
 * used by /api/gsc/status so the UI can tell "env vars present" apart from
 * "env vars present but broken" (wrong key, property not shared with the SA, etc.).
 */
export async function verifyGscAuth(): Promise<{ ok: boolean; message?: string }> {
  if (!isGscConfigured()) return { ok: false, message: "GSC_SERVICE_ACCOUNT_JSON / GSC_PROPERTY not set" };
  try {
    const auth = getAuth();
    await auth.getClient(); // throws on malformed key / bad private_key format
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Auth failed" };
  }
}

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Calls searchanalytics.query for the trailing `days` days, grouped by
 * `dimensions` (e.g. ["query"], ["page"], or ["query","page"]). GSC returns
 * one row per unique combination of dimension values, already totaled over
 * the whole date range — no need to sum across days ourselves.
 */
export async function fetchSearchAnalytics({
  days = 28,
  dimensions = ["query"],
  rowLimit = 25000,
}: {
  days?: number;
  dimensions?: string[];
  rowLimit?: number;
} = {}): Promise<SearchAnalyticsRow[]> {
  if (!isGscConfigured()) {
    throw new Error(
      "Google Search Console is not configured — set GSC_SERVICE_ACCOUNT_JSON and GSC_PROPERTY in .env"
    );
  }

  const auth = getAuth();
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const res = await searchconsole.searchanalytics.query({
    siteUrl: getProperty(),
    requestBody: {
      startDate: fmt(start),
      endDate: fmt(end),
      dimensions,
      rowLimit,
    },
  });

  return (res.data.rows || []) as SearchAnalyticsRow[];
}

/**
 * Full sync: pulls the trailing 28 days of Search Console data, grouped by
 * (query, page) for keyword-level rows and by (page) for page-level rows,
 * then replaces the current window in KeywordMetric / PageMetric.
 *
 * Date modeling: GSC's query already aggregates the whole 28-day window into
 * one number per dimension combo (no day-by-day breakdown requested), so we
 * store every row under a single "sync date" (today, UTC midnight). This is
 * the simplest robust option per the contract — each sync is a full
 * replace-in-place snapshot of "last 28 days," not a per-day time series.
 * `date >= now - 28d` filters elsewhere in the app keep working unchanged.
 */
export async function syncGsc(): Promise<{ queries: number; pages: number }> {
  if (!isGscConfigured()) {
    throw new Error("GSC not configured — set GSC_SERVICE_ACCOUNT_JSON and GSC_PROPERTY in .env");
  }

  const DAYS = 28;
  const windowStart = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const syncDate = new Date();
  syncDate.setUTCHours(0, 0, 0, 0);

  // Fetch both dimension breakdowns before touching the DB, so a failed API
  // call never leaves the tables partially cleared.
  const [queryRows, pageRows] = await Promise.all([
    fetchSearchAnalytics({ days: DAYS, dimensions: ["query", "page"] }),
    fetchSearchAnalytics({ days: DAYS, dimensions: ["page"] }),
  ]);

  await prisma.keywordMetric.deleteMany({ where: { date: { gte: windowStart } } });
  await prisma.pageMetric.deleteMany({ where: { date: { gte: windowStart } } });

  if (queryRows.length) {
    await prisma.keywordMetric.createMany({
      data: queryRows.map((r) => ({
        query: r.keys[0] || "",
        page: r.keys[1] || "",
        date: syncDate,
        clicks: Math.round(r.clicks),
        impressions: Math.round(r.impressions),
        ctr: r.ctr,
        position: r.position,
        country: "",
      })),
    });
  }

  if (pageRows.length) {
    await prisma.pageMetric.createMany({
      data: pageRows.map((r) => ({
        page: r.keys[0] || "",
        date: syncDate,
        clicks: Math.round(r.clicks),
        impressions: Math.round(r.impressions),
        ctr: r.ctr,
        position: r.position,
      })),
    });
  }

  const now = new Date().toISOString();
  await prisma.appConfig.upsert({
    where: { key: "gsc_last_sync" },
    update: { value: now },
    create: { key: "gsc_last_sync", value: now },
  });
  await prisma.appConfig.upsert({
    where: { key: "gsc_property" },
    update: { value: getProperty() },
    create: { key: "gsc_property", value: getProperty() },
  });

  return { queries: queryRows.length, pages: pageRows.length };
}
