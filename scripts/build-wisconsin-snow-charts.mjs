// Original charts for snow-predictions-for-wisconsin-2026-2027.
// Data: NWS 1991-2020 climate normals (Milwaukee, Green Bay, Madison), and
// Wisconsin State Climatology Office / NWS records for Hurley and the
// statewide snowiest winter. Nothing here is a prediction of an exact
// number for this winter.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "snow-predictions-for-wisconsin-2026-2027";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-cities: normal seasonal snowfall by Wisconsin city ----------
{
  const rows = [
    ["Madison", 51.8],
    ["Milwaukee", 48.7],
    ["Green Bay", 55.6],
    ["Hurley (avg. 1987-2010)", 174.4],
  ];
  const W = 1200, H = 560;
  const L = 260, R = 1140, top = 110, bh = 100;
  const max = 190;
  const x = (v) => L + (v / max) * (R - L);
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Normal winter snowfall across Wisconsin</text>
<text x="40" y="70" font-size="15" fill="#555">1991-2020 NWS normals for the three biggest cities; Hurley's own long-run average, in the Lake Superior snowbelt.</text>`;
  rows.forEach(([label, v], i) => {
    const y = top + i * bh;
    const color = v > 100 ? "#f97316" : "#0e7490";
    svg += `<text x="${L - 14}" y="${y + 34}" font-size="18" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y + 8}" width="${x(v) - L}" height="44" rx="8" fill="${color}"/>`;
    svg += `<text x="${x(v) + 12}" y="${y + 36}" font-size="18" font-weight="700" fill="#111">${v}"</text>`;
  });
  svg += `<text x="40" y="${H - 20}" font-size="14" fill="#666">Source: NWS 1991-2020 climate normals; Wisconsin State Climatology Office. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-cities.jpg", svg, W, H);
}

// ---------- chart-forecasters: where the 3 sources disagree on snowfall ----------
{
  const rows = [
    ["NOAA Climate Prediction Center", "Below normal", "#dc2626"],
    ["Old Farmer's Almanac", "Near to below normal", "#f97316"],
    ["Farmers' Almanac", "Above average", "#16a34a"],
  ];
  const W = 1200, H = 460;
  const L = 380, top = 120, bh = 90;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Wisconsin snowfall: three sources, three different calls</text>
<text x="40" y="70" font-size="15" fill="#555">Each publication's own snowfall category for Wisconsin this winter. Not a single consensus number.</text>`;
  rows.forEach(([label, call, color], i) => {
    const y = top + i * bh;
    svg += `<text x="${L - 20}" y="${y + 32}" font-size="18" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="420" height="48" rx="10" fill="${color}"/>`;
    svg += `<text x="${L + 210}" y="${y + 32}" font-size="19" font-weight="700" fill="#fff" text-anchor="middle">${esc(call)}</text>`;
  });
  svg += `<text x="40" y="${H - 20}" font-size="14" fill="#666">Source: NOAA CPC, Farmers' Almanac, Old Farmer's Almanac, 2026-2027 outlooks. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-forecasters.jpg", svg, W, H);
}

// ---------- story frames ----------
function card({ big, sub, foot, from, to }) {
  const size = big.length > 16 ? 48 : big.length > 11 ? 68 : 90;
  return `<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="720" height="1280" fill="url(#g)"/>
<text x="360" y="580" font-size="${size}" font-weight="700" fill="#fff" text-anchor="middle">${esc(big)}</text>
<text x="360" y="650" font-size="26" fill="#e0f2fe" text-anchor="middle">${esc(sub)}</text>
<text x="360" y="1170" font-size="20" fill="#cfe4f3" text-anchor="middle">${esc(foot)}</text></svg>`;
}
const cards = [
  ["story-2.jpg", { big: "+4 to +6°F", sub: "NOAA's warmest anomaly range for northern Wisconsin this winter", foot: "NOAA Climate Prediction Center, 2026-2027 outlook", from: "#0b3140", to: "#0e7490" }],
  ["story-3.jpg", { big: "3 forecasts, 3 answers", sub: "NOAA says below normal snow. Farmers' Almanac says above average.", foot: "See the full comparison in the guide.", from: "#052e16", to: "#15803d" }],
  ["story-4.jpg", { big: "Hurley: 277.7\"", sub: "Wisconsin's seasonal snowfall record, winter 1996-97", foot: "In the Lake Superior snowbelt, northern Wisconsin", from: "#3b0764", to: "#7e22ce" }],
  ["story-5.jpg", { big: "1991: 32\" in Brule", sub: "The Halloween Blizzard hit western Wisconsin during an El Nino winter too", foot: "A milder seasonal lean is not a guarantee. See the full guide.", from: "#450a0a", to: "#b91c1c" }],
];
for (const [name, c] of cards) await save(name, card(c), 720, 1280);

const src = DIR + "cover.jpg";
if (existsSync(src)) {
  const meta = await sharp(readFileSync(src)).metadata();
  const w = Math.round(meta.height * (720 / 1280));
  const left = Math.max(0, Math.round((meta.width - w) * 0.5));
  const buf = await sharp(readFileSync(src))
    .extract({ left, top: 0, width: Math.min(w, meta.width - left), height: meta.height })
    .resize(720, 1280)
    .jpeg({ quality: 84 })
    .toBuffer();
  writeFileSync(DIR + "story-1.jpg", buf);
  console.log("wrote story-1.jpg (cover crop)");
}

const src2 = DIR + "body2.jpg";
if (existsSync(src2)) {
  const meta = await sharp(readFileSync(src2)).metadata();
  const w = Math.round(meta.height * (720 / 1280));
  const left = Math.max(0, Math.round((meta.width - w) * 0.5));
  const buf = await sharp(readFileSync(src2))
    .extract({ left, top: 0, width: Math.min(w, meta.width - left), height: meta.height })
    .resize(720, 1280)
    .jpeg({ quality: 84 })
    .toBuffer();
  writeFileSync(DIR + "story-6.jpg", buf);
  console.log("wrote story-6.jpg (Lake Michigan crop)");
}
