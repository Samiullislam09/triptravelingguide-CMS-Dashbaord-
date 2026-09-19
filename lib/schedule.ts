// Scheduled publishing: shared rules for the schedule API and the cron that
// executes it.
//
// Design (agreed 19 Sep 2026): a schedule is a HUMAN decision. It can only be
// created from the authenticated dashboard, so the cron never publishes
// anything the owner did not explicitly schedule. The cron re-checks the gates
// at run time, so an article that was edited into an unpublishable state
// after scheduling is skipped, not pushed live.
//
// No schema change: the existing PublishSchedule table already has everything
// needed (articleId, scheduledFor, weeklyCapBucket, published). A schedule is
// cancelled by deleting its row.

import { prisma } from "@/lib/db";

export const MIN_LEAD_MINUTES = 2;
export const MAX_LEAD_DAYS = 90;

export function weeklyCap(): number {
  return parseInt(process.env.WEEKLY_PUBLISH_CAP || "5", 10);
}

// Monday 00:00 UTC of the week containing d.
export function weekStartUtc(d: Date): Date {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = start.getUTCDay() || 7; // Sunday -> 7
  start.setUTCDate(start.getUTCDate() - (day - 1));
  return start;
}

// ISO-8601 week label, e.g. "2026-W38". Stored in PublishSchedule.weeklyCapBucket.
export function isoWeekBucket(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export interface GateResult {
  ok: boolean;
  reason?: string;
}

interface GateArticle {
  status: string;
  source: string;
  contentHtml: string;
  humanInputMarkers: { resolved: boolean }[];
}

// The same bar the manual Publish button applies, plus the marker check.
export function checkPublishGates(article: GateArticle): GateResult {
  if (article.status === "published") {
    return { ok: false, reason: "Already published." };
  }
  if (article.status === "pruned") {
    return { ok: false, reason: "This post is pruned and cannot be published." };
  }
  if (!article.contentHtml.trim()) {
    return { ok: false, reason: "The post has no content yet." };
  }
  // AI-drafted posts must be approved by a human first. Manual posts, which the
  // owner writes and reviews directly, can be scheduled straight from draft.
  if (article.source !== "manual" && article.status !== "approved") {
    return { ok: false, reason: "AI posts must be approved before they can be scheduled." };
  }
  const open = article.humanInputMarkers.filter((m) => !m.resolved).length;
  if (open > 0) {
    return {
      ok: false,
      reason: `${open} unresolved HUMAN INPUT NEEDED marker(s). Resolve them first.`,
    };
  }
  return { ok: true };
}

// How many posts already go live in the ISO week containing `when`
// (published in that week, plus other pending schedules in it).
export async function countInWeek(when: Date, excludeArticleId?: string): Promise<number> {
  const start = weekStartUtc(when);
  const end = new Date(start.getTime() + 7 * 86400000);
  const published = await prisma.article.count({
    where: {
      status: "published",
      publishedAt: { gte: start, lt: end },
      ...(excludeArticleId ? { id: { not: excludeArticleId } } : {}),
    },
  });
  const scheduled = await prisma.publishSchedule.count({
    where: {
      published: false,
      scheduledFor: { gte: start, lt: end },
      ...(excludeArticleId ? { articleId: { not: excludeArticleId } } : {}),
    },
  });
  return published + scheduled;
}
