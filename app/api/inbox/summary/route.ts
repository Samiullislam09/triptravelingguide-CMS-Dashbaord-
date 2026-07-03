import { NextResponse } from "next/server";
import { inboxSummary } from "@/lib/inbox";

// GET /api/inbox/summary — counts for the sidebar badge (pending comments + new
// contact messages). Fails soft with zeros so the sidebar never breaks.
export async function GET() {
  try {
    const summary = await inboxSummary();
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ pendingComments: 0, newMessages: 0 });
  }
}
