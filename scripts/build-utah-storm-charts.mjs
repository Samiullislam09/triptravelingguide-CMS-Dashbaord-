// Original charts for utah-first-snow-tropical-storm-2026.
// Data: Salt Lake Tribune (10 Oct 2026), citing NWS Salt Lake City (Christine
// Kruse) and OpenSnow (Evan Thayer). Two forecasters, two different totals.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "utah-first-snow-tropical-storm-2026";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-forecasts: NWS vs OpenSnow by resort ----------
{
  const rows = [
    ["Snowbird", "2-5 in (high elev.)", "up to 14 in"],
    ["Alta", "2-5 in (high elev.)", "12+ in"],
    ["Brighton", "2-5 in (high elev.)", "~8 in"],
    ["Brian Head", "~2 in", "~7 in"],
  ];
  const W = 1200, H = 520;
  const L = 220, top = 120, bh = 85;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="25" font-weight="700" fill="#111">Two forecasts, two different storms</text>
<text x="40" y="70" font-size="15" fill="#555">NWS Salt Lake City (conservative) vs OpenSnow (optimistic), issued 10 Oct 2026.</text>`;
  rows.forEach(([label, nws, os], i) => {
    const y = top + i * bh;
    svg += `<text x="${L - 16}" y="${y + 24}" font-size="16" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="330" height="38" rx="8" fill="#0e7490"/>`;
    svg += `<text x="${L + 165}" y="${y + 25}" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">NWS: ${esc(nws)}</text>`;
    svg += `<rect x="${L + 350}" y="${y}" width="330" height="38" rx="8" fill="#f97316"/>`;
    svg += `<text x="${L + 515}" y="${y + 25}" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">OpenSnow: ${esc(os)}</text>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Source: Salt Lake Tribune, NWS SLC, OpenSnow, 10 Oct 2026. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-forecasts.jpg", svg, W, H);
}

// ---------- story frames ----------
function card({ big, sub, foot, from, to }) {
  const size = big.length > 16 ? 42 : big.length > 11 ? 62 : 84;
  return `<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="720" height="1280" fill="url(#g)"/>
<text x="360" y="580" font-size="${size}" font-weight="700" fill="#fff" text-anchor="middle">${esc(big)}</text>
<text x="360" y="650" font-size="26" fill="#e0f2fe" text-anchor="middle">${esc(sub)}</text>
<text x="360" y="1170" font-size="20" fill="#cfe4f3" text-anchor="middle">${esc(foot)}</text></svg>`;
}
const cards = [
  ["story-2.jpg", { big: "\"Twice in 20 years\"", sub: "NWS Salt Lake City's own forecaster on how rare this setup is", foot: "A tropical system's moisture reaching Utah", from: "#0b3140", to: "#0e7490" }],
  ["story-3.jpg", { big: "Snowbird: up to 14\"", sub: "OpenSnow's high-end call, down from 19 inches a few days earlier", foot: "NWS itself calls for just 2-5 inches", from: "#052e16", to: "#15803d" }],
  ["story-4.jpg", { big: "\"I don't know that it's skiable\"", sub: "The NWS forecaster's own read on this snow's quality", foot: "Real quote, Salt Lake Tribune, 10 Oct 2026", from: "#3b0764", to: "#7e22ce" }],
  ["story-5.jpg", { big: "Gone by Thursday", sub: "Both forecasters agree this snow won't last at most elevations", foot: "See the full guide for every number.", from: "#450a0a", to: "#b91c1c" }],
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
  console.log("wrote story-6.jpg (Wasatch crop)");
}
