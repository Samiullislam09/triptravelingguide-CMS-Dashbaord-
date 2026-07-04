"use client";

// Web Stories library — lists every WebStory row, lets you preview it as a
// phone-style vertical story, publish/unpublish, or delete. Stories are
// created from an article via AI Studio (/dashboard/ai) or the "story"
// endpoint owned by lib/webstory.ts. This page is content-only: the
// dashboard layout renders the sidebar around it.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Badge,
  EmptyState,
  Skeleton,
  cn,
} from "@/components/ui";
import {
  Clapperboard,
  Sparkles,
  Eye,
  Send,
  EyeOff,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";

interface StorySlide {
  heading: string;
  text: string;
  imageUrl?: string;
}

interface Story {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string;
  slides: StorySlide[];
  status: "draft" | "published" | string;
  source: string;
  articleId: string | null;
  createdAt: string;
  publishedAt: string | null;
}

export default function StoriesPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewStory, setPreviewStory] = useState<Story | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stories");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load stories");
      setStories(data.stories ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePublish(story: Story) {
    const nextStatus = story.status === "published" ? "draft" : "published";
    setBusyId(story.id);
    try {
      const res = await fetch(`/api/stories/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update story");
      setStories((prev) => prev.map((s) => (s.id === story.id ? data.story : s)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update story.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(story: Story) {
    if (!confirm(`Delete "${story.title}"? This cannot be undone.`)) return;
    setBusyId(story.id);
    try {
      const res = await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete story");
      }
      setStories((prev) => prev.filter((s) => s.id !== story.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete story.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Web Stories</h1>
          <p className="text-sm text-muted mt-1">
            Mobile-first story decks generated from your articles.
          </p>
        </div>
        <Button variant="ai" icon={Sparkles} onClick={() => router.push("/dashboard/ai")}>
          Create in AI Studio
        </Button>
      </div>

      {error && (
        <div className="glass border-danger/30 text-danger text-sm px-4 py-3 animate-fade-up">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="No web stories yet"
          hint="Generate an article in AI Studio and it will automatically produce a matching web story."
          action={
            <Button variant="ai" icon={Sparkles} onClick={() => router.push("/dashboard/ai")}>
              Open AI Studio
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stories.map((story, i) => (
            <Card key={story.id} hover delay={i * 40} className="p-0 overflow-hidden flex flex-col">
              <div
                className="h-36 bg-cover bg-center bg-slate-100 relative"
                style={
                  story.coverImageUrl ? { backgroundImage: `url(${story.coverImageUrl})` } : undefined
                }
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />
                <div className="absolute top-2.5 right-2.5">
                  <Badge tone={story.status === "published" ? "success" : "neutral"}>
                    {story.status}
                  </Badge>
                </div>
                <div className="absolute bottom-2.5 left-2.5">
                  <Badge tone="brand" icon={Layers}>
                    {story.slides.length} slides
                  </Badge>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="font-semibold text-ink text-sm line-clamp-2 flex-1">
                  {story.title}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button variant="soft" icon={Eye} onClick={() => setPreviewStory(story)}>
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    icon={story.status === "published" ? EyeOff : Send}
                    loading={busyId === story.id}
                    onClick={() => togglePublish(story)}
                  >
                    {story.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <button
                    onClick={() => remove(story)}
                    disabled={busyId === story.id}
                    className="ml-auto grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-soft transition disabled:opacity-50"
                    aria-label="Delete story"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {previewStory && (
        <StoryPreviewModal story={previewStory} onClose={() => setPreviewStory(null)} />
      )}
    </div>
  );
}

// ---- Phone-style vertical story preview -----------------------------------

function StoryPreviewModal({ story, onClose }: { story: Story; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const slides = story.slides.length ? story.slides : [{ heading: story.title, text: "" }];
  const slide = slides[index];

  function next() {
    setIndex((i) => Math.min(slides.length - 1, i + 1));
  }
  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 text-white/80 hover:text-white grid place-items-center h-8 w-8 rounded-full bg-white/10"
          aria-label="Close preview"
        >
          <X size={16} />
        </button>

        {/* Phone frame, 9:16 */}
        <div className="relative rounded-[28px] overflow-hidden aspect-[9/16] bg-slate-900 shadow-2xl ring-1 ring-white/10">
          {/* Progress dots */}
          <div className="absolute top-3 left-3 right-3 z-10 flex gap-1.5">
            {slides.map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
                <div
                  className={cn(
                    "h-full bg-white transition-all",
                    i < index && "w-full",
                    i === index && "w-full",
                    i > index && "w-0"
                  )}
                />
              </div>
            ))}
          </div>

          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-slate-800"
            style={
              slide.imageUrl || story.coverImageUrl
                ? { backgroundImage: `url(${slide.imageUrl || story.coverImageUrl})` }
                : undefined
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

          {/* Tap zones */}
          <button className="absolute inset-y-0 left-0 w-1/2" onClick={prev} aria-label="Previous slide" />
          <button className="absolute inset-y-0 right-0 w-1/2" onClick={next} aria-label="Next slide" />

          {/* Slide content */}
          <div className="absolute inset-x-0 bottom-0 p-5 pb-7 text-white">
            <div className="text-[11px] uppercase tracking-wide text-white/70 mb-1.5">
              Slide {index + 1} of {slides.length}
            </div>
            <h3 className="text-xl font-bold leading-snug">{slide.heading}</h3>
            {slide.text && (
              <p className="text-sm text-white/85 mt-2 leading-relaxed">{slide.text}</p>
            )}
          </div>

          {/* Nav arrows (visible affordance in addition to tap zones) */}
          {index > 0 && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70">
              <ChevronLeft size={20} />
            </div>
          )}
          {index < slides.length - 1 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70">
              <ChevronRight size={20} />
            </div>
          )}
        </div>

        <div className="text-center text-white/70 text-xs mt-3">{story.title}</div>
      </div>
    </div>
  );
}
