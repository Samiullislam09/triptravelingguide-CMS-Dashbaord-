// Rebuilds 2 of the 3 chart images for how-long-does-fall-foliage-last, whose
// originals lived on the now-deleted old Supabase project. Both use numbers
// taken directly from tables/sentences still present in the article's own
// surviving contentHtml (USA-NPN phenology data, tree-years counts included).
// chart-year (a 12-year NY red maple time series) is NOT rebuilt here: the
// surviving prose only kept 2 of the 12 yearly values (2021 and 2025), and
// inventing the other 10 would be fabrication. Left broken deliberately.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const FRONTEND_PUBLIC = "D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public";
const SLUG = "how-long-does-fall-foliage-last";
const FONT = "Arial, Helvetica, sans-serif";
const INK = "#0b0b0b", SUB = "#555", GRID = "#ddd", DOT = "#1f6f43";

async function ship(key, svg, w = 1200, h = 675) {
  const jpg = await sharp(Buffer.from(svg)).resize(w, h).jpeg({ quality: 90 }).toBuffer();
  const relPath = `media/articles/${SLUG}/${key}.jpg`;
  const dest = join(FRONTEND_PUBLIC, relPath);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, jpg);
  console.log(key, jpg.length + "B", `/${relPath}`);
}

// chart-trees: dot plot, median peak date (day-of-year offset) per species.
const trees = [
  { label: "Quaking aspen", date: "Oct 4", doy: 277, n: 690 },
  { label: "Yellow birch", date: "Oct 8", doy: 281, n: 591 },
  { label: "Paper birch", date: "Oct 9", doy: 282, n: 499 },
  { label: "Bigtooth aspen", date: "Oct 10", doy: 283, n: 44 },
  { label: "Sugar maple", date: "Oct 12", doy: 285, n: 2298 },
  { label: "Red maple", date: "Oct 16", doy: 289, n: 4561 },
  { label: "Sassafras", date: "Oct 24", doy: 297, n: 208 },
  { label: "American beech", date: "Oct 25", doy: 298, n: 1094 },
  { label: "White oak", date: "Oct 27", doy: 300, n: 1048 },
  { label: "Northern red oak", date: "Oct 27", doy: 300, n: 1494 },
  { label: "Black oak", date: "Oct 27", doy: 300, n: 304 },
  { label: "American sycamore", date: "Oct 27", doy: 300, n: 250 },
  { label: "Scarlet oak", date: "Oct 30", doy: 303, n: 51 },
  { label: "Sweetgum", date: "Nov 3", doy: 307, n: 893 },
];

function dotPlot({ title, sub, rows }) {
  const w = 1200, h = 675;
  const padL = 220, padR = 60, padT = 90, padB = 60;
  const chartW = w - padL - padR, chartH = h - padT - padB;
  const minX = Math.min(...rows.map((r) => r.doy)) - 3;
  const maxX = Math.max(...rows.map((r) => r.doy)) + 3;
  const rowH = chartH / rows.length;
  const x = (doy) => padL + ((doy - minX) / (maxX - minX)) * chartW;
  const dots = rows
    .map((r, i) => {
      const y = padT + i * rowH + rowH / 2;
      return `
        <line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="${GRID}" stroke-width="1"/>
        <text x="${padL - 12}" y="${y + 5}" text-anchor="end" font-family="${FONT}" font-size="17" fill="${INK}">${r.label}</text>
        <circle cx="${x(r.doy)}" cy="${y}" r="7" fill="${DOT}"/>
        <text x="${x(r.doy) + 14}" y="${y + 5}" font-family="${FONT}" font-size="15" fill="${SUB}">${r.date}</text>`;
    })
    .join("");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    <text x="40" y="40" font-family="${FONT}" font-size="24" font-weight="800" fill="${INK}">${title}</text>
    <text x="40" y="64" font-family="${FONT}" font-size="15" fill="${SUB}">${sub}</text>
    ${dots}
  </svg>`;
}

await ship(
  "chart-trees",
  dotPlot({
    title: "Median peak color date, 14 American trees",
    sub: "USA-NPN Nature's Notebook observations, tree-years per species vary from 44 to 4,561.",
    rows: trees,
  })
);

// chart-elevation: the surviving prose gives the elevation EFFECT (days
// earlier the high-third of monitored sites peaks vs the low-third) for
// exactly 5 states, not the two absolute dates a dumbbell needs -- so this
// renders as a diverging bar of that real, stated difference instead of
// inventing two endpoint dates. Alt/caption describe what's actually shown.
function divergingBar({ title, sub, rows }) {
  const w = 1200, h = 675;
  const padL = 220, padR = 100, padT = 90, padB = 60;
  const chartW = w - padL - padR, chartH = h - padT - padB;
  const max = Math.max(...rows.map((r) => Math.abs(r.value)));
  const mid = padL + chartW / 2;
  const scale = (chartW / 2 - 20) / max;
  const rowH = chartH / rows.length;
  const bars = rows
    .map((r, i) => {
      const y = padT + i * rowH + rowH * 0.22;
      const bh = rowH * 0.56;
      const bw = Math.abs(r.value) * scale;
      const x = r.value >= 0 ? mid - bw : mid;
      const fill = r.value >= 0 ? "#1f6f43" : "#c0392b";
      const label = r.value >= 0 ? `${r.value} days earlier` : `${Math.abs(r.value)} days later`;
      const labelInside = bw > 90;
      const labelX = labelInside ? (r.value >= 0 ? x + 10 : x + bw - 10) : (r.value >= 0 ? mid + 10 : mid - 10);
      const anchor = labelInside ? (r.value >= 0 ? "start" : "end") : (r.value >= 0 ? "start" : "end");
      const labelFill = labelInside ? "#ffffff" : INK;
      return `
        <text x="${padL - 12}" y="${y - 6}" text-anchor="end" font-family="${FONT}" font-size="18" fill="${INK}">${r.label}</text>
        <rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${fill}" rx="3"/>
        <text x="${labelX}" y="${y + bh / 2 + 5}" text-anchor="${anchor}" font-family="${FONT}" font-size="16" font-weight="700" fill="${labelFill}">${label}</text>`;
    })
    .join("");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    <text x="40" y="40" font-family="${FONT}" font-size="24" font-weight="800" fill="${INK}">${title}</text>
    <text x="40" y="64" font-family="${FONT}" font-size="15" fill="${SUB}">${sub}</text>
    <line x1="${mid}" y1="${padT - 10}" x2="${mid}" y2="${h - padB + 10}" stroke="${GRID}"/>
    ${bars}
  </svg>`;
}

await ship(
  "chart-elevation",
  divergingBar({
    title: "Does higher elevation mean earlier peak color?",
    sub: "How much earlier (green) or later (red) the highest third of monitored sites peaked vs the lowest third.",
    rows: [
      { label: "Virginia", value: 18 },
      { label: "North Carolina", value: 17 },
      { label: "Tennessee", value: 6 },
      { label: "New Hampshire", value: 0 },
      { label: "Colorado", value: -5 },
    ],
  })
);
