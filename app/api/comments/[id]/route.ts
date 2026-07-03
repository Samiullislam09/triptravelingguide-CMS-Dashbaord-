import { NextResponse } from "next/server";
import { setCommentApproved, deleteComment } from "@/lib/inbox";

// PATCH /api/comments/:id — accept (approved:true) or hide (approved:false).
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as { approved?: unknown };
    if (typeof body.approved !== "boolean") {
      return NextResponse.json(
        { error: "Body must include a boolean `approved`." },
        { status: 400 }
      );
    }
    const comment = await setCommentApproved(params.id, body.approved);
    return NextResponse.json({ comment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update comment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/comments/:id — remove the comment (and its reply thread via cascade).
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteComment(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete comment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
