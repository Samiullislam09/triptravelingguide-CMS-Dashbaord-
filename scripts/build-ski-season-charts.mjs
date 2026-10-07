// Original charts for ski-season-2026-2027-opening-dates.
// Data: CPR's Colorado resort opening-date roundup (2 Oct 2026) and public
// resort announcements. Projected dates can and do shift with real weather.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "ski-season-2026-2027-opening-dates";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-opening: Colorado resort opening dates ----------
{
  const rows = [
    ["Arapahoe Basin", "Oct 9 (projected)"],
    ["Winter Park", "Oct 30 (projected)"],
    ["Keystone", "Oct 31 (projected)"],
    ["Breckenridge", "Nov 6"],
    ["Copper Mountain", "Nov 6"],
    ["Loveland", "Nov 6"],
    ["Vail", "Nov 13"],
    ["Steamboat", "Nov 21"],
    ["Crested Butte", "Nov 25"],
    ["Aspen Mtn / Snowmass", "Nov 26"],
    ["Telluride", "Nov 26"],
    ["Monarch Mountain", "Dec 3 (projected)"],
    ["Aspen Highlands / Buttermilk", "Dec 12"],
  ];
  const W = 1200, H = 760;
  const L = 320, top = 100, rowH = 48;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="40" font-size="25" font-weight="700" fill="#111">When Colorado's ski resorts open, 2026-2027</text>
<text x="40" y="64" font-size="14" fill="#555">Earliest to latest. Projected dates can shift with real snow and weather.</text>`;
  rows.forEach(([label, date], i) => {
    const y = top + i * rowH;
    const color = i < 3 ? "#0e7490" : i < 6 ? "#16a34a" : i < 9 ? "#f97316" : "#64748b";
    svg += `<text x="${L - 14}" y="${y + 20}" font-size="15" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="280" height="30" rx="8" fill="${color}"/>`;
    svg += `<text x="${L + 140}" y="${y + 21}" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">${esc(date)}</text>`;
  });
  svg += `<text x="40" y="${H - 16}" font-size="13" fill="#666">Source: CPR, resort announcements, 2 Oct 2026. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-opening.jpg", svg, W, H);
}

// ---------- chart-timeline: the early-season race ----------
{
  const stages = [
    ["Oct 2", "Levi and Ruka, Finland, open on stockpiled snow"],
    ["Sep 29", "Arizona Snowbowl gets 2 inches of natural snow, months early"],
    ["Oct 9", "Arapahoe Basin's projected opening, earliest in Colorado"],
    ["Nov 20", "Arizona Snowbowl's scheduled opening, possibly earlier"],
  ];
  const W = 1200, H = 520;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">The race to open the 2026-2027 ski season</text>
<text x="40" y="70" font-size="15" fill="#555">Four real markers, in the order they actually happened or are projected to.</text>`;
  const top = 110, rowH = 90;
  stages.forEach(([date, text], i) => {
    const y = top + i * rowH;
    svg += `<rect x="40" y="${y}" width="150" height="52" rx="10" fill="#0e7490"/>`;
    svg += `<text x="115" y="${y + 33}" font-size="18" font-weight="700" fill="#fff" text-anchor="middle">${esc(date)}</text>`;
    svg += `<text x="210" y="${y + 33}" font-size="16" fill="#222">${esc(text)}</text>`;
    if (i < stages.length - 1) svg += `<line x1="115" y1="${y + 52}" x2="115" y2="${y + rowH}" stroke="#cbd5e1" stroke-width="3"/>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Source: AZFamily, SnowBrains, resort announcements. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-timeline.jpg", svg, W, H);
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
  ["story-2.jpg", { big: "Sep 29: 2\" of snow", sub: "Arizona Snowbowl got real snow months before its scheduled opening", foot: "Scheduled to open Nov 20, possibly earlier", from: "#0b3140", to: "#0e7490" }],
  ["story-3.jpg", { big: "Oct 9: A-Basin", sub: "Arapahoe Basin's projected opening, earliest in Colorado", foot: "CPR, resort announcements, Oct 2026", from: "#052e16", to: "#15803d" }],
  ["story-4.jpg", { big: "35+ resorts, every date", sub: "Every 2026-2027 opening date across the US and Canada", foot: "See the complete list in the guide", from: "#3b0764", to: "#7e22ce" }],
  ["story-5.jpg", { big: "Snow before the season", sub: "Levi and Ruka, Finland, already open on stockpiled snow", foot: "A year-round snowmaking trick. See how it works.", from: "#450a0a", to: "#b91c1c" }],
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
  console.log("wrote story-6.jpg (snowmaking crop)");
}
