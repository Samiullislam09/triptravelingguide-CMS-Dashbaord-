// Original charts for sierra-nevada-first-snow-october-2026.
// Data: OpenSnow Tahoe forecast (Bryan Allegretto, 13 Oct 2026) and
// third-party reporting on 2026-27 California resort opening targets.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "sierra-nevada-first-snow-october-2026";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-opening: resort opening targets ----------
{
  const rows = [
    ["Mt. Rose Ski Tahoe", "Fri, 6 Nov"],
    ["Mammoth Mountain", "Fri, 13 Nov"],
    ["Heavenly", "Fri, 20 Nov"],
    ["Northstar California", "Fri, 20 Nov"],
    ["Palisades Tahoe", "Wed, 25 Nov"],
    ["Sugar Bowl", "Fri, 27 Nov"],
    ["Diamond Peak", "Thu, 3 Dec"],
    ["Kirkwood", "Fri, 4 Dec"],
  ];
  const W = 1200, H = 760;
  const L = 420, top = 90, bh = 76;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="40" font-size="24" font-weight="700" fill="#111">California's 2026-27 opening targets</text>
<text x="40" y="64" font-size="14" fill="#555">Third-party reporting on resort-announced dates. All subject to snow and snowmaking.</text>`;
  rows.forEach(([label, val], i) => {
    const y = top + i * bh;
    svg += `<text x="${L - 20}" y="${y + 26}" font-size="16" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="340" height="38" rx="9" fill="${i === 0 ? "#0369a1" : "#0ea5e9"}"/>`;
    svg += `<text x="${L + 170}" y="${y + 26}" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">${esc(val)}</text>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Source: Sierra Rec Magazine. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-opening.jpg", svg, W, H);
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
  ["story-2.jpg", { big: "Sierra-at-Tahoe: first snow", sub: "The only resort with measurable snowfall, October 12, 2026", foot: "A light coating above 6,000 feet elsewhere", from: "#0c4a6e", to: "#0ea5e9" }],
  ["story-3.jpg", { big: "It's Rachel again", sub: "The same tropical storm remnant that hit Montana, Utah, Wyoming, Colorado", foot: "Fox Weather flagged the Sierra days earlier", from: "#1e3a8a", to: "#3b82f6" }],
  ["story-4.jpg", { big: "Mt. Rose: Nov 6", sub: "The earliest 2026-27 opening target of any Tahoe resort", foot: "First to fire up snowmaking, too", from: "#312e81", to: "#6366f1" }],
  ["story-5.jpg", { big: "Won't last long", sub: "Valley highs back in the 80s within days as a dry pattern returns", foot: "This week's coating is a preview, not a base", from: "#422006", to: "#b45309" }],
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
  console.log("wrote story-6.jpg (Mammoth crop)");
}
