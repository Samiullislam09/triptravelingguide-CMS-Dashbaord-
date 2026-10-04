// Original charts for halloween-weather-forecast-2026.
// Data: extremeweatherwatch.com / NWS October 31 climate-normal records for
// each city, and real historical Halloween snow events. Nothing here is a
// prediction of this year's exact Halloween weather.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "halloween-weather-forecast-2026";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-cities: average Halloween-day high, 6 cities ----------
{
  const rows = [
    ["Dallas, TX", 72.8],
    ["Atlanta, GA", 68.6],
    ["New York, NY", 59.2],
    ["Denver, CO", 58.6],
    ["Boston, MA", 57.1],
    ["Chicago, IL", 56.0],
  ];
  const W = 1200, H = 560;
  const L = 240, R = 1140, top = 110, bh = 68;
  const max = 80;
  const x = (v) => L + (v / max) * (R - L);
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Average Halloween-day high, 6 US cities</text>
<text x="40" y="70" font-size="15" fill="#555">30-year NWS climate normal for October 31. Not this year's forecast.</text>`;
  rows.forEach(([label, v], i) => {
    const y = top + i * bh;
    const color = v >= 65 ? "#f97316" : v >= 58 ? "#0e7490" : "#6366f1";
    svg += `<text x="${L - 14}" y="${y + 26}" font-size="17" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y + 4}" width="${x(v) - L}" height="32" rx="8" fill="${color}"/>`;
    svg += `<text x="${x(v) + 12}" y="${y + 26}" font-size="16" font-weight="700" fill="#111">${v}°F</text>`;
  });
  svg += `<text x="40" y="${H - 20}" font-size="14" fill="#666">Source: ExtremeWeatherWatch.com / NWS October 31 climate records. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-cities.jpg", svg, W, H);
}

// ---------- chart-history: notable Halloween snow events ----------
{
  const rows = [
    ["1991", "Twin Cities, MN", "28.4\" (Halloween Blizzard)"],
    ["1991", "Duluth, MN", "36.9\" (Halloween Blizzard)"],
    ["2011", "Peru, MA", "32.0\" (Halloween nor'easter)"],
    ["2011", "Central Park, NYC", "2.9\" (record for the date)"],
  ];
  const W = 1200, H = 460;
  const L = 300, top = 120, bh = 78;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">When Halloween snow has actually happened</text>
<text x="40" y="70" font-size="15" fill="#555">Rare, but not unheard of. Two real storms, two different decades.</text>`;
  rows.forEach(([year, place, amt], i) => {
    const y = top + i * bh;
    svg += `<text x="${L - 20}" y="${y + 28}" font-size="18" font-weight="700" fill="#111" text-anchor="end">${esc(year)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="500" height="44" rx="10" fill="#0e7490"/>`;
    svg += `<text x="${L + 16}" y="${y + 28}" font-size="16" font-weight="700" fill="#fff">${esc(place)}</text>`;
    svg += `<text x="${L + 520}" y="${y + 28}" font-size="16" fill="#111">${esc(amt)}</text>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Source: NWS, Minnesota DNR, Wikipedia (2011 Halloween nor'easter). Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-history.jpg", svg, W, H);
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
  ["story-2.jpg", { big: "Chicago: 56°F", sub: "The 30-year average high for October 31", foot: "NWS climate normal, not this year's forecast", from: "#0b3140", to: "#0e7490" }],
  ["story-3.jpg", { big: "1991: 28.4\" in Minneapolis", sub: "The Halloween Blizzard, the costume-ruining standard", foot: "Minnesota DNR, Halloween Blizzard of 1991", from: "#3b0764", to: "#7e22ce" }],
  ["story-4.jpg", { big: "2011: 32\" in Peru, MA", sub: "The Halloween nor'easter broke records in 20+ cities", foot: "Including 2.9 inches in Central Park, NYC", from: "#052e16", to: "#15803d" }],
  ["story-5.jpg", { big: "El Nino this year", sub: "Wetter in the South, milder in the North, per NOAA", foot: "A trend, not a guarantee for any single day. See the full guide.", from: "#450a0a", to: "#b91c1c" }],
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
  console.log("wrote story-6.jpg (nor'easter crop)");
}
