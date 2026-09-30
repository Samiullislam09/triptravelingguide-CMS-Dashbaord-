// Original charts for snow-predictions-for-minnesota-2026-2027.
// Data: Minnesota DNR climate journal (1508_el_nino.html) for El Nino-winter
// Twin Cities totals and the 1991-2020 normal; NWS Duluth 1991-2020 climate
// normal for Duluth's seasonal figure. Nothing here is a prediction of an
// exact number for this winter.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "snow-predictions-for-minnesota-2026-2027";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-elnino: Twin Cities snowfall in past El Nino winters ----------
{
  const NORMAL = 51.2;
  const rows = [
    ["1957-58", 21.2],
    ["1972-73", 41.7],
    ["1982-83", 74.4],
    ["1997-98", 45.0],
  ];
  const W = 1200, H = 620;
  const L = 140, R = 1140, top = 110, bh = 90;
  const max = 80;
  const x = (v) => L + (v / max) * (R - L);
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Twin Cities snow in past strong El Nino winters</text>
<text x="40" y="70" font-size="15" fill="#555">Actual seasonal totals vs. the 1991-2020 normal of 51.2 inches. Not this year's forecast.</text>`;
  const gx = x(NORMAL);
  svg += `<line x1="${gx}" y1="${top - 10}" x2="${gx}" y2="${top + rows.length * bh}" stroke="#111" stroke-width="2" stroke-dasharray="6,5"/>`;
  svg += `<text x="${gx}" y="${top - 18}" font-size="14" font-weight="700" fill="#111" text-anchor="middle">51.2" normal</text>`;
  rows.forEach(([label, v], i) => {
    const y = top + i * bh;
    const above = v > NORMAL;
    const color = above ? "#f97316" : "#0e7490";
    svg += `<text x="${L - 14}" y="${y + 34}" font-size="18" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y + 8}" width="${x(v) - L}" height="44" rx="8" fill="${color}"/>`;
    svg += `<text x="${x(v) + 12}" y="${y + 36}" font-size="18" font-weight="700" fill="#111">${v}"${above ? " (above normal)" : ""}</text>`;
  });
  svg += `<text x="40" y="${H - 20}" font-size="14" fill="#666">Source: Minnesota DNR climate journal, "Strong El Nino and Winter in the Twin Cities." Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-elnino.jpg", svg, W, H);
}

// ---------- chart-normals: Minneapolis-St Paul vs Duluth ----------
{
  const rows = [
    ["Minneapolis-St Paul", 51.2, 98.6, "1983-84"],
    ["Duluth", 90.2, 138.3, "2022-23"],
  ];
  const W = 1200, H = 520;
  const L = 260, R = 1140, top = 130, bh = 150;
  const max = 150;
  const x = (v) => L + (v / max) * (R - L);
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Normal winter vs. record winter: two Minnesota cities</text>
<text x="40" y="70" font-size="15" fill="#555">1991-2020 NWS/DNR seasonal snowfall normal, and each city's snowiest season on record.</text>`;
  rows.forEach(([label, normal, record, year], i) => {
    const y = top + i * bh;
    svg += `<text x="${L - 14}" y="${y - 4}" font-size="19" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="${x(normal) - L}" height="40" rx="8" fill="#0e7490"/>`;
    svg += `<text x="${x(normal) + 12}" y="${y + 28}" font-size="17" font-weight="700" fill="#111">${normal}" normal</text>`;
    svg += `<rect x="${L}" y="${y + 50}" width="${x(record) - L}" height="40" rx="8" fill="#f97316"/>`;
    svg += `<text x="${x(record) + 12}" y="${y + 78}" font-size="17" font-weight="700" fill="#111">${record}" record (${year})</text>`;
  });
  svg += `<text x="40" y="${H - 20}" font-size="14" fill="#666">Source: NWS 1991-2020 climate normals; Minnesota DNR, Fox Weather. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-normals.jpg", svg, W, H);
}

// ---------- story frames ----------
function card({ big, sub, foot, from, to }) {
  const size = big.length > 16 ? 50 : big.length > 11 ? 70 : 92;
  return `<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="720" height="1280" fill="url(#g)"/>
<text x="360" y="580" font-size="${size}" font-weight="700" fill="#fff" text-anchor="middle">${esc(big)}</text>
<text x="360" y="650" font-size="26" fill="#e0f2fe" text-anchor="middle">${esc(sub)}</text>
<text x="360" y="1170" font-size="20" fill="#cfe4f3" text-anchor="middle">${esc(foot)}</text></svg>`;
}
const cards = [
  ["story-2.jpg", { big: ">90% chance", sub: "NOAA's odds of a very strong El Nino this winter", foot: "NOAA Climate Prediction Center, Aug 2026", from: "#0b3140", to: "#0e7490" }],
  ["story-3.jpg", { big: "24% less snow", sub: "Average El Nino-winter snowfall drop for the Twin Cities", foot: "Minnesota DNR, 27 El Nino winters since 1950", from: "#052e16", to: "#15803d" }],
  ["story-4.jpg", { big: "Duluth: 90.2\"", sub: "Normal season, almost double Minneapolis-St Paul's 51.2\"", foot: "NWS 1991-2020 climate normals", from: "#3b0764", to: "#7e22ce" }],
  ["story-5.jpg", { big: "1991: 28.4\" in 1 storm", sub: "The Halloween Blizzard hit during an El Nino winter too", foot: "El Nino sets a trend, not a guarantee. See the full guide.", from: "#450a0a", to: "#b91c1c" }],
];
for (const [name, c] of cards) await save(name, card(c), 720, 1280);

// story-1: portrait crop of the cover photo
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

// story-6: portrait crop of the Duluth body photo
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
  console.log("wrote story-6.jpg (Duluth crop)");
}
