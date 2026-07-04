import { NextResponse } from "next/server";
import { listContactMessages } from "@/lib/inbox";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";

// GET /api/contact-messages — all contact-form submissions, newest first.
export async function GET() {
  try {
    const messages = await listContactMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load messages.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
