import { NextResponse } from "next/server";

// Reads env presence only — never returns secret values, just booleans/counts.
export const dynamic = "force-dynamic";

// GET /api/settings/status — quick health check for the Settings page's
// "AI (Gemini)" card and general connection state. No DB access, no secrets.
export async function GET() {
  const geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY1,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY4,
  ].filter((key) => typeof key === "string" && key.trim().length > 0).length;

  const wordpress = Boolean(process.env.WORDPRESS_URL?.trim());
  const gscConfigured = Boolean(process.env.GSC_SERVICE_ACCOUNT_JSON?.trim());

  return NextResponse.json({ geminiKeys, wordpress, gscConfigured });
}
