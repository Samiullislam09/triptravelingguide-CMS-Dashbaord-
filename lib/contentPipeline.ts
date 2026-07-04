// Core AI content pipeline. Each function maps to a Module from the PDF blueprint:
// Module 1 (topic/keyword), Module 2 (title), Module 3 (content), Module 4 (SEO),
// Module 6 (thumbnail prompt). Module 5 (linking) and Module 7-9 live elsewhere.

import { generateJson, generateText } from "./gemini";
import { calculateTopicScore, TopicCandidate } from "./topicScore";

export interface DiscoveredTopic {
  title: string;
  primaryKeyword: string;
  comparisonType: "destination" | "transport" | "stay";
  topicScore: number;
  searchVolumeLow: number;
  searchVolumeHigh: number;
  keywordDifficulty: number;
  trendDirection: "rising" | "flat" | "declining";
  intentLabel: string;
  reasoning: string;
}

/**
 * Module 1 — Topic & Keyword Discovery
 * Asks Gemini to propose a travel comparison topic for USA/Canada travelers,
 * with estimated keyword metrics. See the honesty note in topicScore.ts —
 * these numbers are AI estimates, not verified search data, unless you've
 * wired in a real keyword API.
 */
export async function discoverTopic(seed?: string): Promise<DiscoveredTopic> {
  // When the user types a topic/keyword in AI Studio we steer discovery toward it;
  // otherwise the model researches a trending topic on its own.
  const seedLine = seed && seed.trim()
    ? `\nThe user specifically wants a topic about: "${seed.trim()}". Build the topic around this — keep their intent, refine it into the strongest rankable comparison angle.\n`
    : "";

  const prompt = `You are a travel SEO strategist for TripTravelingGuide.com, a site for USA and Canada travelers.
${seedLine}
Propose ONE comparison article topic (Destination vs Destination, Train vs Flight, Cruise vs Resort, Hotel vs Airbnb, or City vs City for a trip type). Pick something genuinely useful and timely for June 2026.

Respond with ONLY valid JSON, no markdown fences, in this exact shape:
{
  "title": "short topic name, e.g. Lisbon vs Porto for Canadian travelers",
  "primaryKeyword": "the main search phrase, lowercase",
  "comparisonType": "destination" | "transport" | "stay",
  "searchVolumeLow": <integer, your honest estimate of monthly US/Canada search volume, low end>,
  "searchVolumeHigh": <integer, high end of the estimate>,
  "keywordDifficulty": <integer 0-100, your honest estimate of ranking difficulty>,
  "trendDirection": "rising" | "flat" | "declining",
  "intentLabel": "comparison" | "informational" | "transactional",
  "reasoning": "1-2 sentences on why this topic, in plain language"
}`;

  const parsed = await generateJson<any>(prompt);

  const candidate: TopicCandidate = {
    keyword: parsed.primaryKeyword,
    searchVolumeLow: parsed.searchVolumeLow,
    searchVolumeHigh: parsed.searchVolumeHigh,
    keywordDifficulty: parsed.keywordDifficulty,
    trendDirection: parsed.trendDirection,
    intentLabel: parsed.intentLabel,
    topicalFit: 70, // default mid-fit until a real content-cluster index exists
  };

  return {
    title: parsed.title,
    primaryKeyword: parsed.primaryKeyword,
    comparisonType: parsed.comparisonType,
    topicScore: calculateTopicScore(candidate),
    searchVolumeLow: parsed.searchVolumeLow,
    searchVolumeHigh: parsed.searchVolumeHigh,
    keywordDifficulty: parsed.keywordDifficulty,
    trendDirection: parsed.trendDirection,
    intentLabel: parsed.intentLabel,
    reasoning: parsed.reasoning,
  };
}

export interface TitleOptions {
  direct: string;
  question: string;
  benefitLed: string;
  metaTitle: string; // 50-60 chars, used as the actual SEO title tag
}

/**
 * Module 2 — Title & Angle Generation (PDF Section 4.1 rules)
 */
export async function generateTitles(
  topicTitle: string,
  primaryKeyword: string
): Promise<TitleOptions> {
  const prompt = `Generate title options for a travel comparison article.
Topic: ${topicTitle}
Primary keyword (must appear naturally, ideally in first 60 characters): ${primaryKeyword}

Rules:
- SEO title tag must be 50-60 characters
- No unverifiable superlatives ("#1", "best in the world") unless cited
- Include year 2026 only if genuinely time-sensitive
- Generate 3 variations: direct comparison, question format, benefit-led

Respond with ONLY valid JSON, no markdown fences:
{
  "direct": "...",
  "question": "...",
  "benefitLed": "...",
  "metaTitle": "the best one, trimmed to 50-60 characters for the actual SEO title tag"
}`;

  return generateJson<TitleOptions>(prompt);
}

export interface ArticleDraft {
  contentMarkdown: string;
  wordCount: number;
  humanInputMarkers: { markerType: string; markerText: string }[];
}

/**
 * Module 3 — Content Generation (PDF Section 5.1 structure, 700+ words)
 * Produces markdown with explicit [HUMAN INPUT NEEDED: ...] markers wherever
 * real experience, current pricing, or a real photo is required — these
 * become hard gates in the review screen (Module 7).
 */
export async function generateArticleDraft(
  title: string,
  primaryKeyword: string,
  comparisonType: string
): Promise<ArticleDraft> {
  const prompt = `Write a comparison article for TripTravelingGuide.com, targeting USA and Canada travelers (use USD/CAD pricing, imperial units).

Title: ${title}
Primary keyword: ${primaryKeyword}
Comparison type: ${comparisonType}

Follow this EXACT structure:
1. Hook intro (80-120 words) — states the real decision the reader faces, not a generic opener
2. Quick verdict box — 2-3 sentences + a "Best for:" tag for each side
3. Comparison table in markdown — cost, travel time, best season, safety, visa/entry, food, activities (adapt columns to comparison type)
4. Detailed sections — one H2 per comparison factor, 150-250 words each, with at least one specific data point (price, distance, statistic)
5. "Which one should YOU choose" section — 3-4 reader personas with a direct recommendation each
6. FAQ block — 4-6 realistic questions a traveler would search, each as "### Question" then the answer
7. Insert inline markers exactly in this format wherever a real photo, current price confirmation, or first-hand experience should go:
[HUMAN INPUT NEEDED: <specific instruction>]
Include at least 3 such markers across the article (at minimum: one for a photo, one for a price/fact to confirm, one for personal/team experience).

EXTERNAL LINKS (important for trust/SEO): Insert 2-3 inline markdown links to AUTHORITATIVE sources only — official tourism boards, official airline/rail/cruise operators, or government (.gov) travel advisories. Use real, well-known official URLs (e.g. https://www.pc.gc.ca for Parks Canada, https://travel.state.gov for US advisories). Format them inline inside a relevant sentence as [anchor text](https://...), NEVER as a list at the bottom. Do not link to blogs, competitors, or affiliate pages.

Total length must be 700+ words. Use proper markdown: ## and ### headings, a | pipe | table, **bold**, - bullet lists, and [text](url) links. Write in clear, natural English, Flesch reading ease 60+.

Respond with ONLY the article in raw markdown — no JSON, no code fences, no preamble. Just the markdown body starting with the intro.`;

  // Plain-markdown (not JSON): wrapping a 700-word article inside a JSON string
  // is fragile (stray backslashes/quotes break the parse). We get the markdown
  // directly and extract the [HUMAN INPUT NEEDED: ...] markers with a regex.
  let contentMarkdown = await generateText(prompt, false);
  contentMarkdown = stripCodeFences(contentMarkdown).trim();

  const humanInputMarkers = extractMarkers(contentMarkdown);
  const wordCount = contentMarkdown.trim().split(/\s+/).length;

  return { contentMarkdown, wordCount, humanInputMarkers };
}

/** Removes an accidental ```markdown ... ``` wrapper the model sometimes adds. */
function stripCodeFences(text: string): string {
  const t = text.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:markdown|md)?\s*/i, "").replace(/```\s*$/, "");
  }
  return text;
}

/** Pulls inline [HUMAN INPUT NEEDED: ...] markers out of the markdown and
 * classifies each by what it's asking for. */
function extractMarkers(
  markdown: string
): { markerType: string; markerText: string }[] {
  const markers: { markerType: string; markerText: string }[] = [];
  const re = /\[HUMAN INPUT NEEDED:\s*([^\]]+)\]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    const text = m[1].trim();
    const lower = text.toLowerCase();
    const markerType =
      /photo|image|picture|screenshot/.test(lower)
        ? "photo"
        : /price|cost|fare|\$|fee|rate/.test(lower)
        ? "price"
        : /experience|first-hand|personal|visited|we |our /.test(lower)
        ? "experience"
        : "other";
    markers.push({ markerType, markerText: text });
  }
  return markers;
}

export interface SeoData {
  metaDescription: string;
  slug: string;
  featuredImagePrompt: string;
  readabilityScore: number;
  focusKeyword: string;
  tags: string[];
}

/**
 * Module 4 (partial) + Module 6 — SEO meta + thumbnail prompt
 */
export async function generateSeoAndThumbnail(
  title: string,
  primaryKeyword: string,
  contentMarkdown: string
): Promise<SeoData> {
  const prompt = `Given this article title and content, produce SEO metadata and an image-generation prompt.

Title: ${title}
Primary keyword: ${primaryKeyword}
Content (excerpt): ${contentMarkdown.slice(0, 1500)}

Respond with ONLY valid JSON, no markdown fences:
{
  "metaDescription": "150-160 characters, includes a reason to click, no clickbait",
  "slug": "lowercase-hyphenated-keyword-matched-slug",
  "focusKeyword": "the single primary keyword phrase this article should rank for, lowercase",
  "tags": ["5-8 relevant WordPress tags", "lowercase", "specific place/topic names", "no duplicates of the focus keyword"],
  "featuredImagePrompt": "a detailed prompt for an image generation tool to create a 1200x630 split-screen comparison thumbnail, mentioning both subjects, site brand colors, a bold VS divider",
  "readabilityScore": <integer 0-100, your honest Flesch-reading-ease style estimate for this content>
}`;

  return generateJson<SeoData>(prompt);
}
