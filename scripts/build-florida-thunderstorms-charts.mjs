// Charts for florida-afternoon-thunderstorms-disney-world.
// Data: climatestotravel.com Orlando climate averages, Vaisala 2022
// lightning density data (via FloridaStorms.org / WGCU).
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "florida-afternoon-thunderstorms-disney-world";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-rain-days: rain days per month ----------
{
  const rows = [
    ["May", 11], ["June", 16], ["July", 17], ["August", 17], ["September", 15], ["October", 9],
  ];
  const W = 1200, H = 640;
  const L = 160, top = 90, bw = 140, gap = 40, chartH = 420;
  const maxVal = 20;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="40" font-size="24" font-weight="700" fill="#111">Central Florida's wet season, by the numbers</text>
<text x="40" y="66" font-size="14" fill="#555">Approximate days per month with measurable rain. Source: climatestotravel.com.</text>`;
  rows.forEach(([label, days], i) => {
    const x = L + i * (bw + gap);
    const h = (days / maxVal) * chartH;
    const y = top + chartH - h;
    const color = days >= 15 ? "#0369a1" : "#60a5fa";
    svg += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="8" fill="${color}"/>`;
    svg += `<text x="${x + bw / 2}" y="${y - 12}" font-size="20" font-weight="700" fill="#111" text-anchor="middle">${days}</text>`;
    svg += `<text x="${x + bw / 2}" y="${top + chartH + 30}" font-size="16" font-weight="700" fill="#111" text-anchor="middle">${esc(label)}</text>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-rain-days.jpg", svg, W, H);
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
  ["story-2.jpg", { big: "16 to 17 days", sub: "A month see measurable rain in central Florida in summer", foot: "Almost, but not quite, every single day", from: "#0c4a6e", to: "#0ea5e9" }],
  ["story-3.jpg", { big: "#1 for lightning", sub: "Four Corners, where Disney World sits, is the most lightning-struck spot in the US", foot: "Two sea breezes collide almost overhead", from: "#1e3a8a", to: "#3b82f6" }],
  ["story-4.jpg", { big: "After 2pm", sub: "Is when afternoon storms most commonly build and arrive", foot: "Most storms clear within 30 to 60 minutes", from: "#312e81", to: "#6366f1" }],
  ["story-5.jpg", { big: "Lightning closes rides", sub: "Not rain, parks close outdoor rides on detection, before rain even falls", foot: "Indoor attractions usually keep running", from: "#422006", to: "#b45309" }],
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
  console.log("wrote story-6.jpg (storm clouds crop)");
}
