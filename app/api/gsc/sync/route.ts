import { NextResponse } from "next/server";
import { isGscConfigured, syncGsc } from "@/lib/gsc";

// Calls the live Search Console API + writes to the DB: never prerender.
export const dynamic = "force-dynamic";

// POST /api/gsc/sync — pulls the trailing 28 days from Search Console and
// replaces KeywordMetric / PageMetric for that window. Triggered by the
// "Sync now" button on the SEO page.
export async function POST() {
  if (!isGscConfigured()) {
    return NextResponse.json({ error: "GSC not configured" }, { status: 400 });
  }

  try {
    const result = await syncGsc();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "GSC sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
