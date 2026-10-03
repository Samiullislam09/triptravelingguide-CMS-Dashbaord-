// Original charts for polar-vortex-disruption-winter-2026-2027.
// Data: Watchers.news / ECMWF-UK Met Office seasonal stratospheric guidance
// (18 Sep 2026 report) and NOAA's official Feb 2021 Texas freeze figures.
// The timeline is a seasonal signal, not a forecast of an exact week.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "polar-vortex-disruption-winter-2026-2027";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-timeline: vortex strength signal through the season ----------
{
  const months = ["Oct 2026", "Nov 2026", "Dec 2026", "Jan 2027", "Feb 2027", "Mar 2027"];
  const strength = [62, 58, 50, 34, 30, 42]; // illustrative relative strength, not real units
  const W = 1200, H = 560;
  const L = 90, R = 1140, top = 110, bottom = 460;
  const x = (i) => L + (i / (months.length - 1)) * (R - L);
  const y = (v) => bottom - (v / 70) * (bottom - top);
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Seasonal signal: polar vortex weakening into 2027</text>
<text x="40" y="70" font-size="15" fill="#555">Illustrative strength trend from ECMWF/UK Met Office seasonal guidance, not a real-time measurement.</text>`;
  svg += `<rect x="${x(3)}" y="${top}" width="${x(4) - x(3)}" height="${bottom - top}" fill="#fde68a" opacity="0.5"/>`;
  svg += `<text x="${(x(3) + x(4)) / 2}" y="${top - 14}" font-size="14" font-weight="700" fill="#92400e" text-anchor="middle">Weakening signal window</text>`;
  let path = "";
  strength.forEach((v, i) => {
    path += `${i === 0 ? "M" : "L"}${x(i)},${y(v)} `;
  });
  svg += `<path d="${path}" fill="none" stroke="#0e7490" stroke-width="4"/>`;
  strength.forEach((v, i) => {
    svg += `<circle cx="${x(i)}" cy="${y(v)}" r="7" fill="#0e7490"/>`;
    svg += `<text x="${x(i)}" y="${bottom + 30}" font-size="14" fill="#444" text-anchor="middle">${months[i]}</text>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Source: Watchers.news / ECMWF-UK Met Office seasonal guidance, 18 Sep 2026. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-timeline.jpg", svg, W, H);
}

// ---------- chart-2021: scale of the 2021 Texas freeze ----------
{
  const rows = [
    ["Deaths (NOAA figure)", "290+"],
    ["Direct damage", "$27.2 billion"],
    ["Texas homes without power at peak", "4,000,000+"],
    ["Share of Texas grid offline", "40%"],
  ];
  const W = 1200, H = 520;
  const L = 480, top = 110, bh = 90;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">What a polar vortex collapse did in February 2021</text>
<text x="40" y="70" font-size="15" fill="#555">The Texas freeze, triggered by a sudden stratospheric warming event on 5 January 2021.</text>`;
  rows.forEach(([label, val], i) => {
    const y = top + i * bh;
    svg += `<text x="${L - 20}" y="${y + 32}" font-size="17" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="320" height="48" rx="10" fill="#dc2626"/>`;
    svg += `<text x="${L + 160}" y="${y + 32}" font-size="20" font-weight="700" fill="#fff" text-anchor="middle">${esc(val)}</text>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Source: NOAA NCEI, "The Great Texas Freeze." Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-2021.jpg", svg, W, H);
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
  ["story-2.jpg", { big: "Jan-Feb 2027", sub: "The window forecasters are watching for a polar vortex weakening signal", foot: "ECMWF / UK Met Office seasonal guidance, Sep 2026", from: "#0b3140", to: "#0e7490" }],
  ["story-3.jpg", { big: "Super El Nino", sub: "Research links strong El Nino winters to a higher chance of vortex disruption", foot: "Manzini et al. 2024", from: "#052e16", to: "#15803d" }],
  ["story-4.jpg", { big: "290+ deaths", sub: "NOAA's official toll from the February 2021 Texas freeze", foot: "Triggered by a stratospheric warming event in early January 2021", from: "#450a0a", to: "#b91c1c" }],
  ["story-5.jpg", { big: "That freeze was La Nina", sub: "A major cold outbreak does not need El Nino to happen", foot: "This risk is not exclusive to this year's pattern. See the full guide.", from: "#3b0764", to: "#7e22ce" }],
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
  console.log("wrote story-6.jpg (Texas satellite crop)");
}
