import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isGscConfigured, getProperty, verifyGscAuth } from "@/lib/gsc";

// Reads AppConfig + (optionally) verifies live auth: never prerender.
export const dynamic = "force-dynamic";

// GET /api/gsc/status — used by the SEO page + Overview banner to decide
// whether to show "Connect GSC" or the real dashboard.
export async function GET() {
  const configured = isGscConfigured();

  const [lastSyncRow, propertyRow] = await Promise.all([
    prisma.appConfig.findUnique({ where: { key: "gsc_last_sync" } }),
    prisma.appConfig.findUnique({ where: { key: "gsc_property" } }),
  ]);

  let connected = false;
  if (configured) {
    // Env vars present — confirm the key actually mints a token. If the
    // live check fails (e.g. transient network issue) but a previous sync
    // already succeeded, we still report connected so the UI doesn't flap.
    const auth = await verifyGscAuth();
    connected = auth.ok || Boolean(lastSyncRow);
  } else {
    connected = Boolean(lastSyncRow);
  }

  return NextResponse.json({
    connected,
    property: propertyRow?.value || (configured ? getProperty() : undefined),
    lastSync: lastSyncRow?.value || undefined,
  });
}
