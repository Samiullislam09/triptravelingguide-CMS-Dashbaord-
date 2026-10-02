// Original charts for snow-predictions-for-illinois-2026-2027.
// Data: NWS climate normals (Rockford, Springfield, Carbondale) and NWS
// seasonal snowfall records for the same stations. Nothing here is a
// prediction of an exact number for this winter.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "snow-predictions-for-illinois-2026-2027";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-gradient: north-to-south snowfall drop ----------
{
  const rows = [
    ["Rockford (north)", 37.1],
    ["Chicago/O'Hare (north)", 38.4],
    ["Springfield (central)", 21.8],
    ["Carbondale (south)", 11.4],
  ];
  const W = 1200, H = 560;
  const L = 300, R = 1140, top = 110, bh = 100;
  const max = 44;
  const x = (v) => L + (v / max) * (R - L);
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Illinois snow drops sharply from north to south</text>
<text x="40" y="70" font-size="15" fill="#555">Normal seasonal snowfall, same state, more than a 3x difference top to bottom.</text>`;
  rows.forEach(([label, v], i) => {
    const y = top + i * bh;
    const color = v > 30 ? "#0e7490" : v > 18 ? "#f97316" : "#dc2626";
    svg += `<text x="${L - 14}" y="${y + 34}" font-size="18" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y + 8}" width="${x(v) - L}" height="44" rx="8" fill="${color}"/>`;
    svg += `<text x="${x(v) + 12}" y="${y + 36}" font-size="18" font-weight="700" fill="#111">${v}"</text>`;
  });
  svg += `<text x="40" y="${H - 20}" font-size="14" fill="#666">Source: NWS 1991-2020 climate normals; Illinois State Climatologist. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-gradient.jpg", svg, W, H);
}

// ---------- chart-forecasters: 3 sources, Illinois snow call ----------
{
  const rows = [
    ["NOAA Climate Prediction Center", "No seasonal snow total; milder, drier lean", "#dc2626"],
    ["Old Farmer's Almanac", "Near to below normal", "#f97316"],
    ["Farmers' Almanac", "Near normal, sharp brief bursts", "#16a34a"],
  ];
  const W = 1200, H = 460;
  const L = 380, top = 120, bh = 90;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Illinois snowfall: what each source actually says</text>
<text x="40" y="70" font-size="15" fill="#555">Each publication's own call for Illinois this winter. Not a single consensus number.</text>`;
  rows.forEach(([label, call, color], i) => {
    const y = top + i * bh;
    svg += `<text x="${L - 20}" y="${y + 32}" font-size="18" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="420" height="48" rx="10" fill="${color}"/>`;
    svg += `<text x="${L + 210}" y="${y + 32}" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">${esc(call)}</text>`;
  });
  svg += `<text x="40" y="${H - 20}" font-size="14" fill="#666">Source: NOAA CPC, Farmers' Almanac, Old Farmer's Almanac, 2026-2027 outlooks. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-forecasters.jpg", svg, W, H);
}

// ---------- story frames ----------
function card({ big, sub, foot, from, to }) {
  const size = big.length > 16 ? 46 : big.length > 11 ? 66 : 88;
  return `<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="720" height="1280" fill="url(#g)"/>
<text x="360" y="580" font-size="${size}" font-weight="700" fill="#fff" text-anchor="middle">${esc(big)}</text>
<text x="360" y="650" font-size="26" fill="#e0f2fe" text-anchor="middle">${esc(sub)}</text>
<text x="360" y="1170" font-size="20" fill="#cfe4f3" text-anchor="middle">${esc(foot)}</text></svg>`;
}
const cards = [
  ["story-2.jpg", { big: "37\" to 11\"", sub: "Rockford's normal season vs. Carbondale's, same state", foot: "NWS 1991-2020 climate normals", from: "#0b3140", to: "#0e7490" }],
  ["story-3.jpg", { big: ">90% chance", sub: "NOAA's odds of a very strong El Nino this winter", foot: "NOAA Climate Prediction Center, 2026-2027 outlook", from: "#052e16", to: "#15803d" }],
  ["story-4.jpg", { big: "1978-79: 105.1\"", sub: "Illinois's snowiest winter on record, statewide", foot: "The same winter set Chicago's own O'Hare record too", from: "#3b0764", to: "#7e22ce" }],
  ["story-5.jpg", { big: "Nov 20 to Dec 20", sub: "First snow comes a full month later in southern Illinois", foot: "Than in the Chicago area. See the full guide.", from: "#450a0a", to: "#b91c1c" }],
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
  console.log("wrote story-6.jpg (Capitol crop)");
}
