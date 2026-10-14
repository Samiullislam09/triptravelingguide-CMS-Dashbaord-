// Original charts for colorado-mountain-snow-october-2026.
// Data: live NWS active alerts for Colorado, pulled 14 Oct 2026
// (api.weather.gov/alerts/active?area=CO). Forecast totals, not observed.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "colorado-mountain-snow-october-2026";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-elevation: rain vs snow by elevation ----------
{
  const W = 1200, H = 420;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="25" font-weight="700" fill="#111">Colorado's rain/snow split, 14 October 2026</text>
<text x="40" y="70" font-size="14" fill="#555">Live NWS Winter Weather Advisories vs. Denver's forecast for the same day.</text>
<rect x="40" y="110" width="520" height="260" rx="10" fill="#0ea5e9"/>
<text x="300" y="220" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">Denver, 5,280 ft</text>
<text x="300" y="255" font-size="34" font-weight="700" fill="#fff" text-anchor="middle">Rain</text>
<text x="300" y="285" font-size="16" fill="#e0f2fe" text-anchor="middle">Upper 40s to low 50s</text>
<rect x="620" y="110" width="540" height="260" rx="10" fill="#1d4ed8"/>
<text x="890" y="220" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">High country, 9,000+ ft</text>
<text x="890" y="255" font-size="34" font-weight="700" fill="#fff" text-anchor="middle">4-12 in snow</text>
<text x="890" y="285" font-size="16" fill="#dbeafe" text-anchor="middle">RMNP, Summit County, San Juans</text>
<text x="40" y="${H - 18}" font-size="14" fill="#666">Source: NWS active alerts, 14 Oct 2026. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-elevation.jpg", svg, W, H);
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
  ["story-2.jpg", { big: "4 to 12 inches", sub: "Forecast for Colorado's high country above 9,000 feet, 14 October 2026", foot: "NWS active alerts, 14 Oct 2026", from: "#0c4a6e", to: "#0ea5e9" }],
  ["story-3.jpg", { big: "Denver: just rain", sub: "Upper 40s to low 50s on the Front Range while the mountains get snow", foot: "Elevation is the whole story today", from: "#1e3a8a", to: "#3b82f6" }],
  ["story-4.jpg", { big: "Watch these passes", sub: "Wolf Creek, Rabbit Ears, and the Summit County passes along I-70", foot: "Check COtrip before you drive", from: "#312e81", to: "#6366f1" }],
  ["story-5.jpg", { big: "A-Basin: not yet", sub: "Colorado's usual first resort to open still has no confirmed date", foot: "See our full ski season guide for every resort", from: "#422006", to: "#b45309" }],
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
  console.log("wrote story-6.jpg (I-70 crop)");
}
