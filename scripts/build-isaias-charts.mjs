// Original charts for hurricane-isaias-flight-travel-impact-2026.
// Data: NHC advisory discussion #5-6, issued 7-8 October 2026. A live storm's
// track and warnings change fast; treat every figure here as a snapshot, not
// a live forecast.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "hurricane-isaias-flight-travel-impact-2026";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-airports: Gulf Coast airports inside the watch/warning zone ----------
{
  const rows = [
    ["Destin-Fort Walton Beach (VPS)", "Closed 9pm Oct 8 until further notice", "#dc2626"],
    ["Pensacola (PNS)", "Weather advisory issued, monitoring", "#f97316"],
    ["Mobile Regional (MOB)", "Inside hurricane watch area", "#f97316"],
    ["Gulfport-Biloxi (GPT)", "Inside hurricane watch area", "#f97316"],
    ["New Orleans / Louis Armstrong (MSY)", "Near the watch area's western edge", "#eab308"],
  ];
  const W = 1200, H = 480;
  const L = 460, top = 110, bh = 68;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="25" font-weight="700" fill="#111">Gulf Coast airport status, as of 8 October 2026</text>
<text x="40" y="68" font-size="14" fill="#555">A snapshot, not a live tracker. Check each airport's own site before traveling.</text>`;
  rows.forEach(([label, status, color], i) => {
    const y = top + i * bh;
    svg += `<text x="${L - 16}" y="${y + 22}" font-size="15" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="620" height="40" rx="8" fill="${color}"/>`;
    svg += `<text x="${L + 310}" y="${y + 26}" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">${esc(status)}</text>`;
  });
  svg += `<text x="40" y="${H - 16}" font-size="13" fill="#666">Source: airport and NHC advisories, 7-8 Oct 2026. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-airports.jpg", svg, W, H);
}

// ---------- chart-timeline: storm timeline ----------
{
  const stages = [
    ["Oct 6", "Isaias becomes the Atlantic season's first hurricane"],
    ["Oct 7, 4pm CDT", "NHC Advisory #5: strengthening, watches posted for the central Gulf Coast"],
    ["Oct 8", "Hurricane and storm surge warnings issued, FL and AL emergencies declared"],
    ["Oct 9-10", "Landfall expected, Mississippi coast to the Florida Panhandle"],
  ];
  const W = 1200, H = 520;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Hurricane Isaias: how the week unfolded</text>
<text x="40" y="70" font-size="15" fill="#555">Based on NHC advisories through 8 October 2026. The track can still shift.</text>`;
  const top = 110, rowH = 90;
  stages.forEach(([date, text], i) => {
    const y = top + i * rowH;
    svg += `<rect x="40" y="${y}" width="190" height="52" rx="10" fill="#0e7490"/>`;
    svg += `<text x="135" y="${y + 33}" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">${esc(date)}</text>`;
    svg += `<text x="250" y="${y + 33}" font-size="16" fill="#222">${esc(text)}</text>`;
    if (i < stages.length - 1) svg += `<line x1="135" y1="${y + 52}" x2="135" y2="${y + rowH}" stroke="#cbd5e1" stroke-width="3"/>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Source: National Hurricane Center advisories. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-timeline.jpg", svg, W, H);
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
  ["story-2.jpg", { big: "Landfall: Oct 9-10", sub: "Mississippi coast to the Florida Panhandle, per NHC's track", foot: "Forecasts can still shift. Check nhc.noaa.gov.", from: "#0b3140", to: "#0e7490" }],
  ["story-3.jpg", { big: "VPS airport: closed", sub: "Destin-Fort Walton Beach closed 9pm Oct 8 until further notice", foot: "Other Gulf Coast airports are under advisory", from: "#452b00", to: "#b45309" }],
  ["story-4.jpg", { big: "FL and AL: state of emergency", sub: "Declared ahead of Hurricane Isaias's expected landfall", foot: "Hurricane and storm surge warnings in effect", from: "#450a0a", to: "#b91c1c" }],
  ["story-5.jpg", { big: "Canceled flight? Full refund.", sub: "Federal rules require a refund if you decline rebooking", foot: "Even on a non-refundable ticket. See the full guide.", from: "#052e16", to: "#15803d" }],
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
  console.log("wrote story-6.jpg (Pensacola crop)");
}
