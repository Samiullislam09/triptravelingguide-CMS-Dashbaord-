// Original charts for daylight-saving-time-2026-travel.
// Data: timeanddate.com sunrise/sunset tables for 1 Nov 2026 and 21 Dec 2026,
// and the Sunshine Protection Act's real House vote. Nothing here predicts
// weather; it's clock-driven and already fixed by the calendar.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "daylight-saving-time-2026-travel";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-sunset: before/after Nov 1 ----------
{
  const rows = [
    ["New York, NY", "5:53 PM", "4:52 PM"],
    ["Chicago, IL", "5:45 PM", "4:44 PM"],
    ["Denver, CO", "5:58 PM", "4:57 PM"],
    ["Seattle, WA", "5:53 PM", "4:51 PM"],
  ];
  const W = 1200, H = 520;
  const L = 260, top = 120, bh = 90;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Sunset jumps an hour earlier overnight</text>
<text x="40" y="70" font-size="15" fill="#555">Saturday 31 October vs. Sunday 1 November 2026, when clocks fall back at 2am.</text>`;
  rows.forEach(([label, before, after], i) => {
    const y = top + i * bh;
    svg += `<text x="${L - 20}" y="${y + 28}" font-size="17" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="200" height="40" rx="8" fill="#f97316"/>`;
    svg += `<text x="${L + 100}" y="${y + 26}" font-size="15" font-weight="700" fill="#fff" text-anchor="middle">${esc(before)}</text>`;
    svg += `<text x="${L + 215}" y="${y + 26}" font-size="18" fill="#444">→</text>`;
    svg += `<rect x="${L + 250}" y="${y}" width="200" height="40" rx="8" fill="#1e3a8a"/>`;
    svg += `<text x="${L + 350}" y="${y + 26}" font-size="15" font-weight="700" fill="#fff" text-anchor="middle">${esc(after)}</text>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Source: timeanddate.com sunrise/sunset tables, Nov 2026. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-sunset.jpg", svg, W, H);
}

// ---------- chart-timeline: Sunshine Protection Act status ----------
{
  const stages = [
    ["3 Jan 2025", "Bill introduced in the House (H.R. 139)"],
    ["14 Jul 2026", "Passes the House, 308 to 117"],
    ["15 Jul 2026", "Referred to Senate Commerce Committee"],
    ["Now", "Awaiting Senate action, no vote scheduled"],
  ];
  const W = 1200, H = 520;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Could this be the last clock change? Where the bill stands</text>
<text x="40" y="70" font-size="15" fill="#555">The Sunshine Protection Act would make daylight saving time permanent nationwide.</text>`;
  const top = 110, rowH = 90;
  stages.forEach(([date, text], i) => {
    const y = top + i * rowH;
    svg += `<rect x="40" y="${y}" width="190" height="52" rx="10" fill="#0e7490"/>`;
    svg += `<text x="135" y="${y + 33}" font-size="17" font-weight="700" fill="#fff" text-anchor="middle">${esc(date)}</text>`;
    svg += `<text x="250" y="${y + 33}" font-size="17" fill="#222">${esc(text)}</text>`;
    if (i < stages.length - 1) svg += `<line x1="135" y1="${y + 52}" x2="135" y2="${y + rowH}" stroke="#cbd5e1" stroke-width="3"/>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Source: Congress.gov, The Hill, NBC News reporting. Chart: TripTravelingGuide.</text></svg>`;
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
  ["story-2.jpg", { big: "Nov 1, 2am", sub: "Clocks fall back 1 hour across almost all of the US", foot: "Daylight saving time 2026", from: "#0b3140", to: "#0e7490" }],
  ["story-3.jpg", { big: "Flight length: 0 change", sub: "Aviation runs on UTC. Your flight doesn't get longer or shorter.", foot: "But connections during the switch week can get confusing", from: "#052e16", to: "#15803d" }],
  ["story-4.jpg", { big: "Sunset: 1 hour earlier", sub: "Overnight, in every city, the same Sunday morning", foot: "Chicago: 5:45pm to 4:44pm", from: "#3b0764", to: "#7e22ce" }],
  ["story-5.jpg", { big: "308 to 117", sub: "The House already passed a bill to make DST permanent", foot: "Now stuck in the Senate. See the full guide.", from: "#450a0a", to: "#b91c1c" }],
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
  console.log("wrote story-6.jpg (clock crop)");
}
