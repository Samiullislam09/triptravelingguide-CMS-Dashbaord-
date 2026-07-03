"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  MessageSquare,
  Mail,
  Check,
  EyeOff,
  Eye,
  Trash2,
  CornerDownRight,
  Send,
  Loader2,
  Reply,
  Archive,
  Inbox as InboxIcon,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

// ---- Types (mirror lib/inbox.ts row shapes) --------------------------------

interface CommentRow {
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

interface ContactRow {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

type Tab = "comments" | "messages";

// ---- Helpers ---------------------------------------------------------------

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

// ---- Page ------------------------------------------------------------------

export default function InboxPage() {
  const [tab, setTab] = useState<Tab>("comments");
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [messages, setMessages] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [c, m] = await Promise.all([
        fetch("/api/comments").then((r) => r.json()),
        fetch("/api/contact-messages").then((r) => r.json()),
      ]);
      if (c.error) throw new Error(c.error);
      if (m.error) throw new Error(m.error);
      setComments(c.comments ?? []);
      setMessages(m.messages ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inbox.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingComments = comments.filter((c) => !c.approved).length;
  const newMessages = messages.filter((m) => m.status === "new").length;

  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <InboxIcon size={20} className="text-blue-400" />
                Inbox
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Moderate visitor comments and read contact-form messages.
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-ink-700 hover:border-ink-600 rounded-lg px-3 py-2 transition disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-ink-900 border border-ink-700 rounded-xl w-fit mb-6">
            <TabButton
              active={tab === "comments"}
              onClick={() => setTab("comments")}
              icon={<MessageSquare size={14} />}
              label="Comments"
              badge={pendingComments}
            />
            <TabButton
              active={tab === "messages"}
              onClick={() => setTab("messages")}
              icon={<Mail size={14} />}
              label="Messages"
              badge={newMessages}
            />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-500">
              <Loader2 className="animate-spin" size={22} />
            </div>
          ) : tab === "comments" ? (
            <CommentsTab
              comments={comments}
              onChanged={load}
              setComments={setComments}
            />
          ) : (
            <MessagesTab
              messages={messages}
              onChanged={load}
              setMessages={setMessages}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
        active ? "bg-ink-800 text-white" : "text-gray-400 hover:text-white"
      }`}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

// ---- Comments tab ----------------------------------------------------------

type CommentFilter = "all" | "pending" | "hidden";

function CommentsTab({
  comments,
  onChanged,
  setComments,
}: {
  comments: CommentRow[];
  onChanged: () => void;
  setComments: React.Dispatch<React.SetStateAction<CommentRow[]>>;
}) {
  const [filter, setFilter] = useState<CommentFilter>("all");

  // Group replies under their parent.
  const { roots, repliesByParent } = useMemo(() => {
    const repliesByParent = new Map<string, CommentRow[]>();
    const roots: CommentRow[] = [];
    for (const c of comments) {
      if (c.parent_id) {
        const arr = repliesByParent.get(c.parent_id) ?? [];
        arr.push(c);
        repliesByParent.set(c.parent_id, arr);
      } else {
        roots.push(c);
      }
    }
    // Replies oldest-first within a thread.
    for (const arr of repliesByParent.values()) {
      arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
    return { roots, repliesByParent };
  }, [comments]);

  const visibleRoots = roots.filter((c) => {
    if (filter === "pending") return !c.approved;
    if (filter === "hidden") return !c.approved;
    return true;
  });

  if (roots.length === 0) {
    return <EmptyState icon={<MessageSquare size={26} />} text="No comments yet." />;
  }

  return (
    <div>
      <FilterRow
        options={[
          { key: "all", label: "All", count: roots.length },
          { key: "pending", label: "Hidden / pending", count: roots.filter((c) => !c.approved).length },
        ]}
        value={filter}
        onChange={(v) => setFilter(v as CommentFilter)}
      />
      <div className="space-y-3">
        {visibleRoots.map((c) => (
          <CommentCard
            key={c.id}
            comment={c}
            replies={repliesByParent.get(c.id) ?? []}
            onChanged={onChanged}
            setComments={setComments}
          />
        ))}
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  replies,
  onChanged,
  setComments,
}: {
  comment: CommentRow;
  replies: CommentRow[];
  onChanged: () => void;
  setComments: React.Dispatch<React.SetStateAction<CommentRow[]>>;
}) {
  const [busy, setBusy] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);

  async function toggleApproved() {
    setBusy(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: !comment.approved }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, approved: !comment.approved } : c))
      );
    } catch {
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this comment and its replies? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onChanged();
    } catch {
      setBusy(false);
    }
  }

  async function submitReply() {
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReplyText("");
      setReplyOpen(false);
      onChanged();
    } catch {
      setPosting(false);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
      <div className="flex items-start gap-3">
        <Avatar name={comment.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">{comment.name}</span>
            <PostChip slug={comment.post_slug} />
            <span className="text-xs text-gray-500">{timeAgo(comment.created_at)}</span>
            {!comment.approved && (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                Hidden
              </span>
            )}
            {comment.likes > 0 && (
              <span className="text-xs text-gray-500">♥ {comment.likes}</span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
            {comment.body}
          </p>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ActionBtn
              onClick={toggleApproved}
              disabled={busy}
              tone={comment.approved ? "muted" : "green"}
              icon={comment.approved ? <EyeOff size={13} /> : <Check size={13} />}
              label={comment.approved ? "Hide" : "Accept"}
            />
            <ActionBtn
              onClick={() => setReplyOpen((v) => !v)}
              disabled={busy}
              tone="blue"
              icon={<Reply size={13} />}
              label="Reply"
            />
            <ActionBtn
              onClick={remove}
              disabled={busy}
              tone="red"
              icon={<Trash2 size={13} />}
              label="Delete"
            />
          </div>

          {/* Reply composer */}
          {replyOpen && (
            <div className="mt-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder="Write a public reply as the TripTravelingGuide team…"
                className="w-full rounded-lg bg-ink-950 border border-ink-700 focus:border-blue-500 outline-none px-3 py-2 text-sm text-gray-200 resize-y"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={submitReply}
                  disabled={posting || !replyText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 transition"
                >
                  {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Post reply
                </button>
                <button
                  onClick={() => setReplyOpen(false)}
                  className="text-xs text-gray-400 hover:text-white px-2 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-3 space-y-2.5 border-l border-ink-700 pl-4">
              {replies.map((r) => (
                <ReplyRow key={r.id} reply={r} onChanged={onChanged} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReplyRow({ reply, onChanged }: { reply: CommentRow; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!confirm("Delete this reply?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/comments/${reply.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onChanged();
    } catch {
      setBusy(false);
    }
  }
  return (
    <div className="flex items-start gap-2">
      <CornerDownRight size={14} className="mt-1 text-gray-600 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-200">{reply.name}</span>
          {reply.is_admin_reply && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">
              Team
            </span>
          )}
          <span className="text-[11px] text-gray-500">{timeAgo(reply.created_at)}</span>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
          {reply.body}
        </p>
      </div>
      <button
        onClick={remove}
        disabled={busy}
        className="text-gray-600 hover:text-red-400 p-1 transition"
        aria-label="Delete reply"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ---- Messages tab ----------------------------------------------------------

type MessageFilter = "all" | "new" | "replied" | "archived";

function MessagesTab({
  messages,
  onChanged,
  setMessages,
}: {
  messages: ContactRow[];
  onChanged: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ContactRow[]>>;
}) {
  const [filter, setFilter] = useState<MessageFilter>("all");

  const visible = messages.filter((m) => (filter === "all" ? true : m.status === filter));

  if (messages.length === 0) {
    return <EmptyState icon={<Mail size={26} />} text="No contact messages yet." />;
  }

  return (
    <div>
      <FilterRow
        options={[
          { key: "all", label: "All", count: messages.length },
          { key: "new", label: "New", count: messages.filter((m) => m.status === "new").length },
          { key: "replied", label: "Replied", count: messages.filter((m) => m.status === "replied").length },
          { key: "archived", label: "Archived", count: messages.filter((m) => m.status === "archived").length },
        ]}
        value={filter}
        onChange={(v) => setFilter(v as MessageFilter)}
      />
      <div className="space-y-3">
        {visible.map((m) => (
          <MessageCard key={m.id} message={m} onChanged={onChanged} setMessages={setMessages} />
        ))}
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400",
  read: "bg-gray-500/15 text-gray-400",
  replied: "bg-green-500/15 text-green-400",
  archived: "bg-ink-700 text-gray-500",
};

function MessageCard({
  message,
  onChanged,
  setMessages,
}: {
  message: ContactRow;
  onChanged: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ContactRow[]>>;
}) {
  const [busy, setBusy] = useState(false);

  async function setStatus(status: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/contact-messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, status } : m)));
    } catch {
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/contact-messages/${message.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onChanged();
    } catch {
      setBusy(false);
    }
  }

  const mailto = `mailto:${message.email}?subject=${encodeURIComponent(
    "Re: your message to TripTravelingGuide"
  )}&body=${encodeURIComponent(`\n\n———\nOn your message:\n"${message.message}"`)}`;

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
      <div className="flex items-start gap-3">
        <Avatar name={message.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">{message.name}</span>
            <a
              href={`mailto:${message.email}`}
              className="text-xs text-blue-400 hover:text-blue-300 truncate"
            >
              {message.email}
            </a>
            <span className="text-xs text-gray-500">{timeAgo(message.created_at)}</span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                STATUS_STYLES[message.status] ?? STATUS_STYLES.read
              }`}
            >
              {message.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
            {message.message}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={mailto}
              onClick={() => setStatus("replied")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 transition"
            >
              <Reply size={13} />
              Reply by email
              <ExternalLink size={11} className="opacity-70" />
            </a>
            {message.status !== "read" && message.status !== "replied" && (
              <ActionBtn
                onClick={() => setStatus("read")}
                disabled={busy}
                tone="muted"
                icon={<Eye size={13} />}
                label="Mark read"
              />
            )}
            {message.status !== "archived" && (
              <ActionBtn
                onClick={() => setStatus("archived")}
                disabled={busy}
                tone="muted"
                icon={<Archive size={13} />}
                label="Archive"
              />
            )}
            <ActionBtn
              onClick={remove}
              disabled={busy}
              tone="red"
              icon={<Trash2 size={13} />}
              label="Delete"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Shared bits -----------------------------------------------------------

function Avatar({ name }: { name: string }) {
  return (
    <div className="shrink-0 grid place-items-center h-9 w-9 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-500/5 ring-1 ring-blue-500/20 text-xs font-semibold text-blue-300">
      {initials(name) || "?"}
    </div>
  );
}

function PostChip({ slug }: { slug: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-ink-800 border border-ink-700 rounded px-1.5 py-0.5">
      <MessageSquare size={10} className="opacity-60" />
      {slug}
    </span>
  );
}

function ActionBtn({
  onClick,
  disabled,
  tone,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  tone: "green" | "blue" | "red" | "muted";
  icon: React.ReactNode;
  label: string;
}) {
  const tones: Record<string, string> = {
    green: "border-green-500/30 text-green-400 hover:bg-green-500/10",
    blue: "border-blue-500/30 text-blue-400 hover:bg-blue-500/10",
    red: "border-red-500/30 text-red-400 hover:bg-red-500/10",
    muted: "border-ink-700 text-gray-400 hover:text-white hover:border-ink-600",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg border text-xs font-medium px-2.5 py-1.5 transition disabled:opacity-50 ${tones[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
}

function FilterRow({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string; count: number }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`inline-flex items-center gap-1.5 rounded-full text-xs px-3 py-1.5 border transition ${
            value === o.key
              ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
              : "border-ink-700 text-gray-400 hover:text-white"
          }`}
        >
          {o.label}
          <span className="opacity-60">{o.count}</span>
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-500">
      <div className="text-gray-600 mb-3">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
