// Original charts for montana-snow-predictions-2026-2027.
// Data: AccuWeather/NWS Missoula forecast for the 10-12 Oct 2026 storm, and
// NOAA 1991-2020 climate normals for Montana cities. The storm figures are a
// forecast, not an observed total.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "montana-snow-predictions-2026-2027";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-cities: Montana city snow normals ----------
{
  const rows = [
    ["Great Falls", 63],
    ["Billings", 57],
    ["Missoula", 43],
  ];
  const W = 1200, H = 480;
  const L = 240, R = 1140, top = 110, bh = 90;
  const max = 70;
  const x = (v) => L + (v / max) * (R - L);
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Normal winter snowfall, three Montana cities</text>
<text x="40" y="70" font-size="15" fill="#555">1991-2020 seasonal normals. Not a prediction for this winter.</text>`;
  rows.forEach(([label, v], i) => {
    const y = top + i * bh;
    svg += `<text x="${L - 14}" y="${y + 34}" font-size="18" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y + 8}" width="${x(v) - L}" height="44" rx="8" fill="#0e7490"/>`;
    svg += `<text x="${x(v) + 12}" y="${y + 36}" font-size="18" font-weight="700" fill="#111">${v}"</text>`;
  });
  svg += `<text x="40" y="${H - 20}" font-size="14" fill="#666">Source: NOAA NCEI 1991-2020 normals, via Current Results. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-cities.jpg", svg, W, H);
}

// ---------- chart-storm: this week's forecast snow ----------
{
  const rows = [
    ["Valleys, 4,000ft+", "6 to 12 in"],
    ["Highest elevations", "up to 1 ft"],
    ["Glacier NP", "heavy snow expected"],
    ["Yellowstone (mid/high elev.)", "accumulating snow"],
  ];
  const W = 1200, H = 480;
  const L = 420, top = 110, bh = 85;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">This week's forecast: 10-12 October 2026</text>
<text x="40" y="70" font-size="15" fill="#555">AccuWeather and NWS Missoula forecasts, issued 7-8 October 2026. A forecast, not an observed total.</text>`;
  rows.forEach(([label, val], i) => {
    const y = top + i * bh;
    svg += `<text x="${L - 20}" y="${y + 30}" font-size="16" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="340" height="46" rx="10" fill="#f97316"/>`;
    svg += `<text x="${L + 170}" y="${y + 30}" font-size="17" font-weight="700" fill="#fff" text-anchor="middle">${esc(val)}</text>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Source: AccuWeather, NWS Missoula, 7-8 Oct 2026. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-storm.jpg", svg, W, H);
}

// ---------- story frames ----------
function card({ big, sub, foot, from, to }) {
  const size = big.length > 16 ? 44 : big.length > 11 ? 64 : 86;
  return `<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="720" height="1280" fill="url(#g)"/>
<text x="360" y="580" font-size="${size}" font-weight="700" fill="#fff" text-anchor="middle">${esc(big)}</text>
<text x="360" y="650" font-size="26" fill="#e0f2fe" text-anchor="middle">${esc(sub)}</text>
<text x="360" y="1170" font-size="20" fill="#cfe4f3" text-anchor="middle">${esc(foot)}</text></svg>`;
}
const cards = [
  ["story-2.jpg", { big: "A rare setup", sub: "NWS Missoula calls Hurricane Rachel's remnant moisture a very rare circumstance", foot: "Combining with a cold front, Oct 10-12 2026", from: "#0b3140", to: "#0e7490" }],
  ["story-3.jpg", { big: "Up to 1 foot of snow", sub: "At the highest Montana elevations, 6-12 inches as low as 4,000 feet", foot: "AccuWeather, NWS Missoula forecasts", from: "#052e16", to: "#15803d" }],
  ["story-4.jpg", { big: "Billings: Sept 7, 1962", sub: "Montana's earliest snowfall record, 2 inches", foot: "A reminder early snow isn't new here", from: "#3b0764", to: "#7e22ce" }],
  ["story-5.jpg", { big: "One storm isn't a season", sub: "A rare early snowstorm doesn't predict the whole winter", foot: "See the full guide for what the data actually shows.", from: "#450a0a", to: "#b91c1c" }],
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
  console.log("wrote story-6.jpg (Glacier NP crop)");
}
