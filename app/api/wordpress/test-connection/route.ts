import { NextResponse } from "next/server";
import { testWordPressConnection } from "@/lib/wordpress";

// Hits the live WordPress API: never prerender at build time.
export const dynamic = "force-dynamic";

// GET /api/wordpress/test-connection — used by the Settings page to verify .env creds work
export async function GET() {
  const result = await testWordPressConnection();
  return NextResponse.json(result);
}
