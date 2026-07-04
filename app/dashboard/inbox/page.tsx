"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  Button,
  Badge,
  EmptyState,
  Skeleton,
  cn,
} from "@/components/ui";
import {
  MessageSquare,
  Mail,
  Check,
  EyeOff,
  Eye,
  Trash2,
  CornerDownRight,
  Send,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <InboxIcon size={22} className="text-brand-600" />
            Inbox
          </h1>
          <p className="text-sm text-muted mt-1">
            Moderate visitor comments and read contact-form messages.
          </p>
        </div>
        <Button variant="ghost" icon={RefreshCw} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 glass w-fit">
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
        <div className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : tab === "comments" ? (
        <CommentsTab comments={comments} onChanged={load} setComments={setComments} />
      ) : (
        <MessagesTab messages={messages} onChanged={load} setMessages={setMessages} />
      )}
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
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
        active ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"
      )}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}

// ---- Comments tab ----------------------------------------------------------

type CommentFilter = "all" | "pending";

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

  const visibleRoots = roots.filter((c) => (filter === "pending" ? !c.approved : true));

  if (roots.length === 0) {
    return (
      <EmptyState icon={MessageSquare} title="No comments yet" hint="Visitor comments will show up here for moderation." />
    );
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
    <Card className={cn(!comment.approved && "border-warn-soft")}>
      <div className="flex items-start gap-3">
        <Avatar name={comment.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm text-ink">{comment.name}</span>
            <PostChip slug={comment.post_slug} />
            <span className="text-xs text-muted">{timeAgo(comment.created_at)}</span>
            {!comment.approved && <Badge tone="warn">Hidden</Badge>}
            {comment.likes > 0 && <span className="text-xs text-muted">♥ {comment.likes}</span>}
          </div>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
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
                className="w-full rounded-lg bg-white border border-line focus:border-brand-400 outline-none px-3 py-2 text-sm text-ink resize-y"
              />
              <div className="mt-2 flex items-center gap-2">
                <Button variant="primary" icon={Send} loading={posting} disabled={!replyText.trim()} onClick={submitReply}>
                  Post reply
                </Button>
                <Button variant="ghost" onClick={() => setReplyOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-3 space-y-2.5 border-l border-line pl-4">
              {replies.map((r) => (
                <ReplyRow key={r.id} reply={r} onChanged={onChanged} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
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
      <CornerDownRight size={14} className="mt-1 text-slate-300 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink">{reply.name}</span>
          {reply.is_admin_reply && <Badge tone="brand">Team</Badge>}
          <span className="text-[11px] text-muted">{timeAgo(reply.created_at)}</span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
          {reply.body}
        </p>
      </div>
      <button
        onClick={remove}
        disabled={busy}
        className="text-slate-300 hover:text-danger p-1 transition"
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
    return (
      <EmptyState icon={Mail} title="No contact messages yet" hint="Submissions from the contact form will land here." />
    );
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

const STATUS_TONE: Record<string, "brand" | "neutral" | "success" | "warn"> = {
  new: "brand",
  read: "neutral",
  replied: "success",
  archived: "neutral",
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
    <Card>
      <div className="flex items-start gap-3">
        <Avatar name={message.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm text-ink">{message.name}</span>
            <a href={`mailto:${message.email}`} className="text-xs text-brand-600 hover:text-brand-700 truncate">
              {message.email}
            </a>
            <span className="text-xs text-muted">{timeAgo(message.created_at)}</span>
            <Badge tone={STATUS_TONE[message.status] ?? "neutral"}>{message.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
            {message.message}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={mailto}
              onClick={() => setStatus("replied")}
              className="btn-primary text-xs px-3 py-1.5"
            >
              <Reply size={13} />
              Reply by email
              <ExternalLink size={11} className="opacity-70" />
            </a>
            {message.status !== "read" && message.status !== "replied" && (
              <ActionBtn onClick={() => setStatus("read")} disabled={busy} tone="muted" icon={<Eye size={13} />} label="Mark read" />
            )}
            {message.status !== "archived" && (
              <ActionBtn onClick={() => setStatus("archived")} disabled={busy} tone="muted" icon={<Archive size={13} />} label="Archive" />
            )}
            <ActionBtn onClick={remove} disabled={busy} tone="red" icon={<Trash2 size={13} />} label="Delete" />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---- Shared bits -----------------------------------------------------------

function Avatar({ name }: { name: string }) {
  return (
    <div className="shrink-0 grid place-items-center h-9 w-9 rounded-full bg-brand-50 ring-1 ring-brand-100 text-xs font-semibold text-brand-600">
      {initials(name) || "?"}
    </div>
  );
}

function PostChip({ slug }: { slug: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted bg-slate-50 border border-line rounded px-1.5 py-0.5">
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
    green: "border-success/30 text-success hover:bg-success-soft",
    blue: "border-brand-300 text-brand-600 hover:bg-brand-50",
    red: "border-danger/30 text-danger hover:bg-danger-soft",
    muted: "border-line text-muted hover:text-ink hover:border-slate-300",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border text-xs font-medium px-2.5 py-1.5 transition disabled:opacity-50",
        tones[tone]
      )}
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
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full text-xs px-3 py-1.5 border transition",
            value === o.key
              ? "border-brand-300 bg-brand-50 text-brand-700"
              : "border-line text-muted hover:text-ink"
          )}
        >
          {o.label}
          <span className="opacity-60">{o.count}</span>
        </button>
      ))}
    </div>
  );
}
