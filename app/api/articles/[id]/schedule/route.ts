import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/apiError";
import {
  MAX_LEAD_DAYS,
  MIN_LEAD_MINUTES,
  checkPublishGates,
  countInWeek,
  isoWeekBucket,
  weeklyCap,
} from "@/lib/schedule";

// DB-backed route: never prerender at build time (would try to hit the DB).
export const dynamic = "force-dynamic";

// Sits behind the dashboard login (middleware protects every /api route except
// /api/public, /api/auth/login and /api/cron). A schedule can therefore only
// be created or cancelled by the signed-in owner.

// GET /api/articles/[id]/schedule
// The pending schedule (if any) and whether the article could be scheduled now.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      include: { humanInputMarkers: true },
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    const schedule = await prisma.publishSchedule.findFirst({
      where: { articleId: params.id, published: false },
      orderBy: { scheduledFor: "asc" },
    });
    return NextResponse.json({
      schedule: schedule
        ? { id: schedule.id, scheduledFor: schedule.scheduledFor.toISOString() }
        : null,
      gates: checkPublishGates(article),
      weeklyCap: weeklyCap(),
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/articles/[id]/schedule  { scheduledFor: ISO string, overrideCap?: boolean }
// Replaces any earlier pending schedule for this article.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const when = new Date(body?.scheduledFor);
    if (!body?.scheduledFor || Number.isNaN(when.getTime())) {
      return NextResponse.json(
        { error: "Pick a valid date and time.", gate: "invalid_time" },
        { status: 400 }
      );
    }
    const now = Date.now();
    if (when.getTime() < now + MIN_LEAD_MINUTES * 60000) {
      return NextResponse.json(
        {
          error: `Pick a time at least ${MIN_LEAD_MINUTES} minutes from now. To publish immediately, use Publish live.`,
          gate: "too_soon",
        },
        { status: 422 }
      );
    }
    if (when.getTime() > now + MAX_LEAD_DAYS * 86400000) {
      return NextResponse.json(
        { error: `Schedules are limited to ${MAX_LEAD_DAYS} days ahead.`, gate: "too_far" },
        { status: 422 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id: params.id },
      include: { humanInputMarkers: true },
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const gate = checkPublishGates(article);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason, gate: "not_publishable" }, { status: 422 });
    }

    // Weekly cap (WRITING_RULES: at most 5 posts a week). This is a guard, not a
    // wall: the owner can override it explicitly, and the override is logged.
    const cap = weeklyCap();
    const inWeek = await countInWeek(when, article.id);
    if (inWeek >= cap && body?.overrideCap !== true) {
      return NextResponse.json(
        {
          error: `That week already has ${inWeek} posts published or scheduled (cap is ${cap}).`,
          gate: "weekly_cap",
          inWeek,
          cap,
        },
        { status: 409 }
      );
    }

    await prisma.publishSchedule.deleteMany({
      where: { articleId: article.id, published: false },
    });
    const created = await prisma.publishSchedule.create({
      data: {
        articleId: article.id,
        scheduledFor: when,
        weeklyCapBucket: isoWeekBucket(when),
      },
    });
    await prisma.reviewLog.create({
      data: {
        articleId: article.id,
        action: "schedule",
        notes:
          `Scheduled for ${when.toISOString()}` +
          (inWeek >= cap ? ` (weekly cap ${cap} overridden, ${inWeek} already that week)` : ""),
      },
    });

    return NextResponse.json({
      schedule: { id: created.id, scheduledFor: created.scheduledFor.toISOString() },
    });
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/articles/[id]/schedule — cancel the pending schedule.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const removed = await prisma.publishSchedule.deleteMany({
      where: { articleId: params.id, published: false },
    });
    if (removed.count > 0) {
      await prisma.reviewLog.create({
        data: { articleId: params.id, action: "unschedule", notes: "Schedule cancelled" },
      });
    }
    return NextResponse.json({ cancelled: removed.count });
  } catch (error) {
    return apiError(error);
  }
}
