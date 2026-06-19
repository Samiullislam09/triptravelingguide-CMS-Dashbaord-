// Re-derives the 5 weighted factors behind an article's topic score (PDF 3.3),
// purely from fields already stored on the article. Used to SHOW the operator
// *why* the AI picked and scored a topic — not just the final number.

export interface ScoreFactor {
  key: string;
  label: string;
  weightPct: number; // contribution weight, %
  raw: number; // 0-100 factor value before weighting
  contribution: number; // raw * weight, the points it adds to the final score
  explain: string; // plain-language reason
}

interface ScoreInput {
  searchVolumeLow: number;
  searchVolumeHigh: number;
  keywordDifficulty: number;
  trendDirection: string;
  intentLabel: string;
  topicalFit?: number;
}

export function getScoreBreakdown(a: ScoreInput): ScoreFactor[] {
  const avgVolume = (a.searchVolumeLow + a.searchVolumeHigh) / 2;
  const volumeRaw = Math.min(avgVolume / 20, 100);
  const trendRaw =
    a.trendDirection === "rising" ? 100 : a.trendDirection === "flat" ? 50 : 10;
  const difficultyRaw = 100 - a.keywordDifficulty;
  const intentRaw =
    a.intentLabel === "comparison"
      ? 100
      : a.intentLabel === "transactional"
      ? 80
      : 40;
  const fitRaw = a.topicalFit ?? 70;

  return [
    {
      key: "volume",
      label: "Search volume",
      weightPct: 30,
      raw: Math.round(volumeRaw),
      contribution: +(volumeRaw * 0.3).toFixed(1),
      explain: `~${Math.round(avgVolume).toLocaleString()} avg searches/mo (AI estimate). Higher volume = more traffic upside.`,
    },
    {
      key: "trend",
      label: "Trend direction",
      weightPct: 25,
      raw: trendRaw,
      contribution: +(trendRaw * 0.25).toFixed(1),
      explain:
        a.trendDirection === "rising"
          ? "Interest is rising — best time to publish before competition catches up."
          : a.trendDirection === "flat"
          ? "Stable, evergreen interest — reliable long-term traffic."
          : "Declining interest — lower priority.",
    },
    {
      key: "difficulty",
      label: "Ranking ease",
      weightPct: 20,
      raw: difficultyRaw,
      contribution: +(difficultyRaw * 0.2).toFixed(1),
      explain: `Keyword difficulty ${a.keywordDifficulty}/100 — ${
        a.keywordDifficulty <= 40
          ? "easy to rank for"
          : a.keywordDifficulty <= 65
          ? "moderate competition"
          : "hard, needs strong content"
      }.`,
    },
    {
      key: "intent",
      label: "Commercial intent",
      weightPct: 15,
      raw: intentRaw,
      contribution: +(intentRaw * 0.15).toFixed(1),
      explain: `"${a.intentLabel}" intent — ${
        a.intentLabel === "comparison"
          ? "comparison searches convert well and fit the site's niche."
          : a.intentLabel === "transactional"
          ? "buyers ready to act."
          : "informational, lower commercial value."
      }`,
    },
    {
      key: "fit",
      label: "Topical fit",
      weightPct: 10,
      raw: fitRaw,
      contribution: +(fitRaw * 0.1).toFixed(1),
      explain:
        "How well it fits TripTravelingGuide's existing comparison clusters.",
    },
  ];
}
