import { NextResponse } from "next/server";
import { listComments } from "@/lib/inbox";

// GET /api/comments — all comments (approved + hidden, including team replies),
// newest first. Protected by middleware (dashboard session required).
export async function GET() {
  try {
    const comments = await listComments();
    return NextResponse.json({ comments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load comments.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
