// Charts for snow-predictions-for-new-jersey-2026-2027.
// Data: computed from NOAA ACIS daily station records (Newark Liberty,
// Atlantic City Intl, Trenton-Mercer), 1950-2026, 1991-2020 normals.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "snow-predictions-for-new-jersey-2026-2027";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-elnino: normal vs strong El Nino average ----------
{
  const rows = [
    ["Newark Liberty", 32.0, 22.4],
    ["Atlantic City", 17.6, 9.1],
    ["Trenton-Mercer", 25.4, 14.0],
  ];
  const W = 1200, H = 620;
  const L = 220, top = 100, bh = 130, barH = 42;
  const maxVal = 36;
  const chartW = 820;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="40" font-size="24" font-weight="700" fill="#111">Strong El Nino winters: less snow, not more</text>
<text x="40" y="66" font-size="14" fill="#555">1991-2020 normal vs the last 7 strong El Nino winters at each station. Source: NOAA ACIS.</text>`;
  rows.forEach(([label, normal, nino], i) => {
    const y = top + i * bh;
    const wN = (normal / maxVal) * chartW;
    const wE = (nino / maxVal) * chartW;
    svg += `<text x="40" y="${y - 8}" font-size="16" font-weight="700" fill="#111">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="${wN}" height="${barH}" rx="8" fill="#0ea5e9"/>`;
    svg += `<text x="${L + wN + 12}" y="${y + barH / 2 + 6}" font-size="15" font-weight="700" fill="#111">${normal}" normal</text>`;
    svg += `<rect x="${L}" y="${y + barH + 10}" width="${wE}" height="${barH}" rx="8" fill="#b91c1c"/>`;
    svg += `<text x="${L + wE + 12}" y="${y + barH + 10 + barH / 2 + 6}" font-size="15" font-weight="700" fill="#111">${nino}" El Nino avg</text>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-elnino.jpg", svg, W, H);
}

// ---------- story frames ----------
function card({ big, sub, foot, from, to }) {
  const size = big.length > 20 ? 40 : big.length > 13 ? 58 : 84;
  return `<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="720" height="1280" fill="url(#g)"/>
<text x="360" y="580" font-size="${size}" font-weight="700" fill="#fff" text-anchor="middle">${esc(big)}</text>
<text x="360" y="650" font-size="26" fill="#e0f2fe" text-anchor="middle">${esc(sub)}</text>
<text x="360" y="1170" font-size="20" fill="#cfe4f3" text-anchor="middle">${esc(foot)}</text></svg>`;
}
const cards = [
  ["story-2.jpg", { big: "-30% to -48%", sub: "How much less snow NJ's coast got in strong El Nino winters", foot: "Computed from 76 years of NOAA station data", from: "#0c4a6e", to: "#0ea5e9" }],
  ["story-3.jpg", { big: "AccuWeather: below average", sub: "NYC 10-20in, Philly 5-15in forecast for 2026-27", foot: "The Almanac is softer: only slightly below normal", from: "#1e3a8a", to: "#3b82f6" }],
  ["story-4.jpg", { big: "17.6in to 32in", sub: "Atlantic City vs Newark, same state, nearly double the snow", foot: "Coastal air changes more storms to rain", from: "#312e81", to: "#6366f1" }],
  ["story-5.jpg", { big: "February, not January", sub: "Newark's real snowiest month, 10.3 inches on average", foot: "Jan and Feb together are 61% of the whole season", from: "#422006", to: "#b45309" }],
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
  console.log("wrote story-6.jpg (Ewing Township crop)");
}
