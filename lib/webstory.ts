// Turns a finished article into a short, mobile-first "web story" — a vertical
// story deck (Instagram/TikTok-style) that summarizes the article's best bits
// and drives readers back to the full post. All AI generation goes through
// lib/gemini's generateJson, per project convention.

import { generateJson } from "./gemini";

export interface StorySlide {
  heading: string; // <= 60 chars, punchy
  text: string; // <= 180 chars, one key point
  imageUrl?: string;
}

export interface StoryArticleInput {
  title: string;
  contentMarkdown: string;
  contentHtml?: string;
  coverImageUrl?: string;
  primaryKeyword?: string;
}

/**
 * Asks Gemini to distill an article into 5-7 web-story slides:
 *  - Slide 1 is the cover/hook, restating the article's promise.
 *  - Middle slides are punchy facts/tips/comparisons pulled from the article.
 *  - The final slide is a CTA nudging the reader to the full article.
 *
 * Image handling (kept simple, documented here): slide 1 reuses
 * article.coverImageUrl. Every other slide's imageUrl is left undefined —
 * Gemini has no way to produce real image URLs, so we don't ask it to invent
 * any. The dashboard/frontend can backfill a template background per slide.
 */
export async function generateStorySlides(
  article: StoryArticleInput
): Promise<StorySlide[]> {
  const excerpt = article.contentMarkdown.slice(0, 4000);

  const prompt = `You are turning a travel article into a punchy, mobile "web story" (like an Instagram/TikTok story deck) for TripTravelingGuide.com.

Article title: ${article.title}
Primary keyword: ${article.primaryKeyword || "n/a"}
Article content (markdown, may be truncated):
"""
${excerpt}
"""

Produce 5 to 7 slides summarizing the article's most useful, scroll-stopping points for a traveler skimming on their phone. Rules:
- Slide 1 is the cover/hook: restates the article's promise in one punchy line.
- Middle slides: one key point, tip, price, or comparison fact per slide, pulled from the article — do not invent facts not supported by the content.
- Final slide is a CTA: encourages the reader to read the full guide for more detail.
- "heading" is max 60 characters, punchy, no trailing period.
- "text" is max 180 characters, 1-2 short sentences, no markdown, no hashtags.
- Do not include image URLs or [HUMAN INPUT NEEDED] markers.

Respond with ONLY valid JSON, no markdown fences, in this exact shape:
{
  "slides": [
    { "heading": "...", "text": "..." }
  ]
}`;

  const parsed = await generateJson<{ slides: { heading: string; text: string }[] }>(
    prompt
  );

  const rawSlides = Array.isArray(parsed?.slides) ? parsed.slides : [];
  if (rawSlides.length === 0) {
    throw new Error("Gemini returned no slides for this article.");
  }

  // Clamp lengths defensively (models mostly respect the limits but don't
  // trust them blindly) and attach the cover image to slide 1 only.
  return rawSlides.slice(0, 7).map((s, i) => ({
    heading: (s.heading || "").trim().slice(0, 60),
    text: (s.text || "").trim().slice(0, 180),
    imageUrl: i === 0 ? article.coverImageUrl || undefined : undefined,
  }));
}
