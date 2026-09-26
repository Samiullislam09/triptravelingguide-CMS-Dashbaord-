// Original charts for white-christmas-odds-2026.
// Data: NOAA NCEI historical probability of >=1 inch of snow on the ground on
// Dec 25, from the 1991-2020 US Climate Normals. Regional bands and
// representative cities from Farmers' Almanac's write-up of the same NCEI
// dataset (7 Aug 2026). State averages from Visual Capitalist's mapping of
// NOAA's full station dataset (21 Dec 2025). Nothing here is a forecast for
// this specific Christmas.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const SLUG = "white-christmas-odds-2026";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-regions: banded odds by region, low to high ----------
{
  const W = 1200, H = 760;
  const L = 330, R = 1140;
  const max = 95;
  const x = (v) => L + (v / max) * (R - L);
  const rows = [
    ["Pacific Coast & Florida", "LA, San Francisco, Miami", 0, 1],
    ["Deep South & Southwest", "Dallas, Houston, Phoenix", 0, 2],
    ["Southeast & Gulf", "Atlanta, Charlotte, Nashville", 1, 5],
    ["Pacific Northwest", "Seattle, Portland", 5, 10],
    ["Mid-South", "Washington DC, Louisville, Kansas City", 5, 15],
    ["Mid-Atlantic & Appalachians", "Pittsburgh, Philadelphia, New York", 8, 20],
    ["Mountain West (at elevation)", "Salt Lake City, Denver, Cheyenne", 25, 40],
    ["Great Lakes (south & west)", "Chicago, Detroit, Indianapolis", 25, 45],
    ["Southern New England", "Boston, Hartford, Albany", 35, 55],
    ["Upper Midwest", "Minneapolis, Madison, Des Moines", 50, 65],
    ["Great Lakes (east)", "Buffalo, Cleveland, Erie", 55, 70],
    ["Northern New England", "Burlington, Portland ME, Concord", 65, 75],
    ["Northern Plains", "Bismarck, Fargo, Rapid City", 75, 85],
    ["Far North Midwest & Great Lakes Superior", "Duluth, Marquette, Intl. Falls", 80, 95],
  ];
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="46" font-size="28" font-weight="700" fill="#111">Historical odds of a white Christmas, by US region</text>
<text x="40" y="72" font-size="17" fill="#555">Chance of at least 1 inch of snow on the ground on December 25. Bands, not exact points, on purpose.</text>`;
  for (const v of [0, 20, 40, 60, 80]) {
    svg += `<line x1="${x(v)}" y1="90" x2="${x(v)}" y2="${90 + rows.length * 46}" stroke="#eee" stroke-width="2"/><text x="${x(v)}" y="${104 + rows.length * 46}" font-size="15" fill="#666" text-anchor="middle">${v}%</text>`;
  }
  const top = 92, rowH = 46;
  rows.forEach(([label, cities, lo, hi], i) => {
    const y = top + i * rowH;
    const isHigh = lo >= 50;
    svg += `<text x="325" y="${y + 22}" font-size="16" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<text x="325" y="${y + 38}" font-size="13" fill="#777" text-anchor="end">${esc(cities)}</text>`;
    svg += `<rect x="${x(lo)}" y="${y + 8}" width="${x(hi) - x(lo)}" height="22" rx="8" fill="${isHigh ? "#0e7490" : "#f97316"}" opacity="0.9"/>`;
    svg += `<text x="${x(hi) + 10}" y="${y + 24}" font-size="14" font-weight="700" fill="#111">${lo}-${hi}%</text>`;
  });
  svg += `<text x="40" y="${H - 22}" font-size="14" fill="#666">Source: NOAA NCEI, 1991-2020 Climate Normals, via Farmers' Almanac (7 Aug 2026). Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-regions.jpg", svg, W, H);
}

// ---------- chart-states: top 15 and bottom 10 states ----------
{
  const top15 = [
    ["Alaska", 84.3], ["North Dakota", 77.3], ["Vermont", 76.9], ["Minnesota", 75.2],
    ["Maine", 74.4], ["New Hampshire", 70.1], ["Wisconsin", 66.3], ["Michigan", 64.8],
    ["Idaho", 62.1], ["New York", 55.9], ["South Dakota", 55.5], ["Montana", 56.7],
    ["Wyoming", 56.0], ["Colorado", 48.7], ["Iowa", 46.9],
  ].sort((a, b) => b[1] - a[1]);
  const bottom10 = [
    ["Florida", 0.0], ["Hawaii", 0.0], ["Alabama", 0.1], ["Louisiana", 0.1],
    ["Georgia", 0.4], ["Mississippi", 0.2], ["South Carolina", 0.6], ["Texas", 0.8],
    ["Arkansas", 1.3], ["Tennessee", 2.8],
  ].sort((a, b) => a[1] - b[1]);

  const W = 1200, H = 900;
  const colW = 540;
  const Lx = [70, 70 + colW + 60];
  const barMax = [90, 3.2];
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="46" font-size="28" font-weight="700" fill="#111">Which states have the best (and worst) white Christmas odds</text>
<text x="40" y="72" font-size="17" fill="#555">State average chance of snow on the ground December 25, from NOAA's full station dataset.</text>`;
  const colTitle = ["Highest 15 states", "Lowest 10 states"];
  const colColor = ["#0e7490", "#f97316"];
  [top15, bottom10].forEach((list, c) => {
    const bx = Lx[c];
    const bw = colW - 150;
    svg += `<text x="${bx}" y="112" font-size="20" font-weight="700" fill="#111">${colTitle[c]}</text>`;
    list.forEach(([state, pct], i) => {
      const y = 130 + i * 48;
      const w = (pct / barMax[c]) * bw;
      svg += `<text x="${bx}" y="${y + 24}" font-size="16" font-weight="700" fill="#111">${esc(state)}</text>`;
      svg += `<rect x="${bx + 150}" y="${y + 6}" width="${Math.max(w, 3)}" height="22" rx="7" fill="${colColor[c]}" opacity="0.9"/>`;
      const tx = Math.min(bx + 150 + Math.max(w, 3) + 10, bx + colW - 40);
      const anchor = tx === bx + colW - 40 ? " text-anchor=\"end\"" : "";
      svg += `<text x="${tx}" y="${y + 22}" font-size="15" font-weight="700" fill="#111"${anchor}>${pct}%</text>`;
    });
  });
  svg += `<text x="40" y="${H - 24}" font-size="14" fill="#666">Source: NOAA NCEI 1991-2020 Climate Normals, state averages via Visual Capitalist (21 Dec 2025). Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-states.jpg", svg, W, H);
}

// ---------- story frames ----------
import { readFileSync, existsSync } from "node:fs";

function card({ big, sub, foot, from, to }) {
  const size = big.length > 16 ? 58 : big.length > 11 ? 76 : 96;
  return `<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="720" height="1280" fill="url(#g)"/>
<text x="360" y="590" font-size="${size}" font-weight="700" fill="#fff" text-anchor="middle">${esc(big)}</text>
<text x="360" y="660" font-size="28" fill="#e0f2fe" text-anchor="middle">${esc(sub)}</text>
<text x="360" y="1170" font-size="22" fill="#cfe4f3" text-anchor="middle">${esc(foot)}</text></svg>`;
}
const cards = [
  ["story-2.jpg", { big: "1 inch of snow", sub: "on the ground at 7am, Dec 25. That's NOAA's official definition.", foot: "NOAA NCEI, 1991-2020 Climate Normals", from: "#0b3140", to: "#0e7490" }],
  ["story-3.jpg", { big: "Alaska: 84%", sub: "The best historical odds of any state", foot: "Minnesota 75%, Vermont 77%, Maine 74%", from: "#052e16", to: "#15803d" }],
  ["story-4.jpg", { big: "Georgia: 0.4%", sub: "Among the lowest odds in the country", foot: "Florida and Hawaii sit at 0%", from: "#450a0a", to: "#b91c1c" }],
  ["story-5.jpg", { big: "This year: El Nino", sub: "Odds shift up in the western mountains, down across the East", foot: "NOAA, greater than 90% chance of a very strong El Nino", from: "#3b0764", to: "#7e22ce" }],
];
for (const [name, c] of cards) await save(name, card(c), 720, 1280);

// story-1: portrait crop of the Woodstock, Vermont cover photo
const src = process.argv[2];
if (src && existsSync(src)) {
  const meta = await sharp(readFileSync(src)).metadata();
  const w = Math.round(meta.height * (720 / 1280));
  const left = Math.max(0, Math.round((meta.width - w) * 0.35));
  const buf = await sharp(readFileSync(src))
    .extract({ left, top: 0, width: Math.min(w, meta.width - left), height: meta.height })
    .resize(720, 1280)
    .jpeg({ quality: 84 })
    .toBuffer();
  writeFileSync(DIR + "story-1.jpg", buf);
  console.log("wrote story-1.jpg", buf.length + "B");
}
