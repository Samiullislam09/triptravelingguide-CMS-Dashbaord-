// Tells Bing/Yandex (IndexNow) that a URL now exists, by calling the frontend's
// /api/indexnow route, which holds the IndexNow key. Shared by the manual
// publish route and the scheduled-publish cron so both behave the same.
//
// Best-effort: a failure here must never undo or block a publish that already
// succeeded, so this never throws.

export interface IndexNowResult {
  ok: boolean;
  submitted?: number;
  error?: string;
}

export async function pingIndexNow(slug: string): Promise<IndexNowResult> {
  try {
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || "https://triptravelingguide.com"
    ).replace(/\/+$/, "");
    const res = await fetch(`${siteUrl}/api/indexnow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: [`${siteUrl}/${slug}/`] }),
    });
    const body = await res.json().catch(() => ({ ok: res.ok }));
    return body as IndexNowResult;
  } catch (error) {
    console.error("IndexNow ping failed (non-blocking):", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "IndexNow ping failed",
    };
  }
}
