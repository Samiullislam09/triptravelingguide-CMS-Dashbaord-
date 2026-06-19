// Topic Scoring Formula — mirrors PDF Section 3.3 exactly.
//
// IMPORTANT HONESTY NOTE (per PDF Section 3.4):
// This app does NOT have a paid keyword data API (DataForSEO/Ahrefs/SEMrush)
// connected by default, because that costs $25-100/month and you asked to
// start free with Gemini only. Without a real keyword API, Gemini ESTIMATES
// volume/difficulty/trend from its own knowledge — these are NOT real,
// verified search numbers. The UI always labels them "AI estimate" so this
// is never mistaken for verified data. See the README for how to wire in
// a real keyword API later (it's a single function to swap in lib/keywordData.ts).

export interface TopicCandidate {
  keyword: string;
  searchVolumeLow: number;
  searchVolumeHigh: number;
  keywordDifficulty: number; // 0-100, lower = easier
  trendDirection: "rising" | "flat" | "declining";
  intentLabel: "comparison" | "informational" | "transactional";
  topicalFit: number; // 0-100, how well it fits existing site clusters
}

export function calculateTopicScore(candidate: TopicCandidate): number {
  const avgVolume = (candidate.searchVolumeLow + candidate.searchVolumeHigh) / 2;

  // Search Volume — 30%, normalized and capped so mega-keywords don't dominate
  const volumeScore = Math.min(avgVolume / 20, 100); // 2000/mo+ hits the cap

  // Trend Direction — 25%
  const trendScore =
    candidate.trendDirection === "rising"
      ? 100
      : candidate.trendDirection === "flat"
      ? 50
      : 10;

  // Keyword Difficulty (inverse) — 20%
  const difficultyScore = 100 - candidate.keywordDifficulty;

  // Commercial Intent — 15%
  const intentScore =
    candidate.intentLabel === "comparison"
      ? 100
      : candidate.intentLabel === "transactional"
      ? 80
      : 40;

  // Topical Fit — 10%
  const fitScore = candidate.topicalFit;

  const weighted =
    volumeScore * 0.3 +
    trendScore * 0.25 +
    difficultyScore * 0.2 +
    intentScore * 0.15 +
    fitScore * 0.1;

  return Math.round(weighted);
}
