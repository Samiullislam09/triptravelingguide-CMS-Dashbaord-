import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Data layer for the moderation Inbox. Reads/writes the same Supabase tables the
// public frontend uses: `comments` (visitor comments + team replies) and
// `contact_messages` (contact-form submissions). Service role bypasses RLS.

const COMMENTS = "comments";
const CONTACT = "contact_messages";

const ADMIN_REPLY_NAME = "TripTravelingGuide Team";

export interface CommentRow {
  id: string;
  post_slug: string;
  name: string;
  body: string;
  parent_id: string | null;
  likes: number;
  approved: boolean;
  is_admin_reply: boolean;
  created_at: string;
}

export interface ContactRow {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

function sanitize(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}

// ---- Comments --------------------------------------------------------------

export async function listComments(): Promise<CommentRow[]> {
  const { data, error } = await supabaseAdmin()
    .from(COMMENTS)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as CommentRow[] | null) ?? [];
}

export async function setCommentApproved(id: string, approved: boolean): Promise<CommentRow> {
  const { data, error } = await supabaseAdmin()
    .from(COMMENTS)
    .update({ approved })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as CommentRow;
}

export async function deleteComment(id: string): Promise<void> {
  // Replies reference the parent via ON DELETE CASCADE, so deleting a top-level
  // comment also removes its thread.
  const { error } = await supabaseAdmin().from(COMMENTS).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function replyToComment(parentId: string, body: string): Promise<CommentRow> {
  const clean = sanitize(body);
  if (!clean) throw new Error("Reply cannot be empty.");

  // Look up the parent to inherit its post slug.
  const { data: parent, error: parentError } = await supabaseAdmin()
    .from(COMMENTS)
    .select("post_slug")
    .eq("id", parentId)
    .single();

  if (parentError) throw new Error(parentError.message);

  const { data, error } = await supabaseAdmin()
    .from(COMMENTS)
    .insert({
      post_slug: (parent as { post_slug: string }).post_slug,
      name: ADMIN_REPLY_NAME,
      body: clean,
      parent_id: parentId,
      approved: true,
      is_admin_reply: true,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as CommentRow;
}

// ---- Contact messages ------------------------------------------------------

const CONTACT_STATUSES = ["new", "read", "replied", "archived"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export function isContactStatus(value: unknown): value is ContactStatus {
  return typeof value === "string" && (CONTACT_STATUSES as readonly string[]).includes(value);
}

export async function listContactMessages(): Promise<ContactRow[]> {
  const { data, error } = await supabaseAdmin()
    .from(CONTACT)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ContactRow[] | null) ?? [];
}

export async function setContactStatus(id: string, status: ContactStatus): Promise<ContactRow> {
  const { data, error } = await supabaseAdmin()
    .from(CONTACT)
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as ContactRow;
}

export async function deleteContactMessage(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from(CONTACT).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Summary (sidebar badge) ----------------------------------------------

export async function inboxSummary(): Promise<{ pendingComments: number; newMessages: number }> {
  const admin = supabaseAdmin();

  const [{ count: pendingComments }, { count: newMessages }] = await Promise.all([
    admin
      .from(COMMENTS)
      .select("id", { count: "exact", head: true })
      .eq("approved", false),
    admin
      .from(CONTACT)
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  return {
    pendingComments: pendingComments ?? 0,
    newMessages: newMessages ?? 0,
  };
}
