import { NextResponse } from "next/server";
import { setContactStatus, deleteContactMessage, isContactStatus } from "@/lib/inbox";

// PATCH /api/contact-messages/:id — update workflow status (read/replied/archived).
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as { status?: unknown };
    if (!isContactStatus(body.status)) {
      return NextResponse.json(
        { error: "Body must include a valid `status` (new | read | replied | archived)." },
        { status: 400 }
      );
    }
    const message = await setContactStatus(params.id, body.status);
    return NextResponse.json({ message });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update message.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/contact-messages/:id — remove a submission.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteContactMessage(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete message.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
