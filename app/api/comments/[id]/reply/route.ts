import { NextResponse } from "next/server";
import { replyToComment } from "@/lib/inbox";

// POST /api/comments/:id/reply — post a public team reply under this comment.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as { body?: unknown };
    if (typeof body.body !== "string" || !body.body.trim()) {
      return NextResponse.json(
        { error: "Reply body is required." },
        { status: 400 }
      );
    }
    const reply = await replyToComment(params.id, body.body);
    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to post reply.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
