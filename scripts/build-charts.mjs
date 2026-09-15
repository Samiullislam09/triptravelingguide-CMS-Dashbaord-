// Rebuilds the 3 data-chart images for winter-snow-predictions-usa as SVG,
// rasterizes with sharp, and writes them into the frontend's public/media/
// folder at the same keys the article already references (cities-seasonal,
// winters-seasonal, spread-seasonal), so only the host in contentHtml needs
// to change afterward.
//
// Used to upload to Supabase post-images; moved off it, see host-images.mjs.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const FRONTEND_PUBLIC = "D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public";

const FONT = "Arial, Helvetica, sans-serif";
const INK = "#0b0b0b";
const SUB = "#555";
const GRID = "#ddd";
const NEG = "#c0392b";
const POS = "#1f6f43";

async function ship(key, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).resize(w, h).jpeg({ quality: 90 }).toBuffer();
  const relPath = `media/articles/winter-snow-predictions-usa/${key}.jpg`;
  const dest = join(FRONTEND_PUBLIC, relPath);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, jpg);
  console.log(key, jpg.length + "B", `/${relPath}`);
}

// ---------- Chart 1: cities-seasonal (diverging horizontal bars, 36 rows) ----------
const CITIES = [
  ["Seattle, WA", -100], ["Indianapolis, IN", -61], ["Dallas-Fort Worth, TX", -57],
  ["Portland, OR", -55], ["Raleigh, NC", -54], ["New York City, NY", -45],
  ["Detroit, MI", -44], ["Philadelphia, PA", -41], ["Richmond, VA", -41],
  ["Boston, MA", -39], ["Cleveland, OH", -38], ["Boise, ID", -37],
  ["Columbus, OH", -36], ["Washington, DC", -36], ["St. Louis, MO", -32],
  ["Pittsburgh, PA", -28], ["Baltimore, MD", -27], ["Anchorage, AK", -24],
  ["Chicago, IL", -24], ["Buffalo, NY", -19], ["Portland, ME", -16],
  ["Minneapolis, MN", -14], ["Concord, NH", -9], ["Memphis, TN", -6],
  ["Burlington, VT", -3], ["Charlotte, NC", -1], ["Salt Lake City, UT", 0],
  ["Atlanta, GA", 0], ["Kansas City, MO", 8], ["Nashville, TN", 14],
  ["Tahoe City, CA", 15], ["Oklahoma City, OK", 17], ["Denver, CO", 32],
  ["Reno, NV", 35], ["Albuquerque, NM", 44], ["Flagstaff, AZ", 53],
];

function chart1() {
  const W = 1240, H = 1056;
  const left = 200, right = 60, top = 50, bottom = 40;
  const rowH = (H - top - bottom) / CITIES.length;
  const plotW = W - left - right;
  const maxAbs = 100;
  const xScale = (v) => left + plotW / 2 + (v / maxAbs) * (plotW / 2);
  const zeroX = xScale(0);
  let rows = "";
  CITIES.forEach(([name, val], i) => {
    const y = top + i * rowH;
    const barY = y + rowH * 0.2;
    const barH = rowH * 0.6;
    const x1 = xScale(Math.min(0, val));
    const x2 = xScale(Math.max(0, val));
    const color = val < 0 ? NEG : val > 0 ? POS : "#999";
    rows += `<rect x="${x1}" y="${barY}" width="${Math.max(1, x2 - x1)}" height="${barH}" fill="${color}"/>`;
    rows += `<text x="${left - 10}" y="${y + rowH / 2 + 4}" font-family="${FONT}" font-size="14" fill="${INK}" text-anchor="end">${name}</text>`;
    const barPx = x2 - x1;
    const label = `${val > 0 ? "+" : ""}${val}%`;
    if (barPx > 55) {
      // Long enough bar: put the label inside it, near the far end, in white.
      const labelX = val < 0 ? x1 + 8 : x2 - 8;
      const anchor = val < 0 ? "start" : "end";
      rows += `<text x="${labelX}" y="${y + rowH / 2 + 4}" font-family="${FONT}" font-size="12" fill="#fff" text-anchor="${anchor}">${label}</text>`;
    } else {
      const labelX = val < 0 ? x1 - 6 : x2 + 6;
      const anchor = val < 0 ? "end" : "start";
      rows += `<text x="${labelX}" y="${y + rowH / 2 + 4}" font-family="${FONT}" font-size="12" fill="${SUB}" text-anchor="${anchor}">${label}</text>`;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#fcfcfb"/>
<text x="${left}" y="28" font-family="${FONT}" font-size="20" font-weight="bold" fill="${INK}">Strong El Nino winters vs. each city's own normal</text>
<line x1="${zeroX}" y1="${top - 6}" x2="${zeroX}" y2="${H - bottom + 6}" stroke="${GRID}" stroke-width="2"/>
<text x="${zeroX}" y="${H - bottom + 24}" font-family="${FONT}" font-size="12" fill="${SUB}" text-anchor="middle">normal (0%)</text>
${rows}
</svg>`;
}

// ---------- Chart 2: winters-seasonal (paired columns, 7 winters) ----------
const WINTERS2 = [
  ["1957-58", 42, 55], ["1972-73", 47, 40], ["1982-83", 53, 41],
  ["1991-92", 74, 49], ["1997-98", 72, 47], ["2015-16", 75, 50], ["2023-24", 81, 61],
];
function chart2() {
  const W = 1240, H = 620;
  const left = 70, right = 40, top = 60, bottom = 90;
  const plotH = H - top - bottom;
  const plotW = W - left - right;
  const groupW = plotW / WINTERS2.length;
  const barW = groupW * 0.3;
  const yScale = (v) => top + plotH - (v / 100) * plotH;
  let bars = "";
  WINTERS2.forEach(([label, elnino, ordinary], i) => {
    const gx = left + i * groupW + groupW / 2;
    const x1 = gx - barW - 6, x2 = gx + 6;
    const y1 = yScale(elnino), y2 = yScale(ordinary);
    bars += `<rect x="${x1}" y="${y1}" width="${barW}" height="${top + plotH - y1}" fill="${NEG}"/>`;
    bars += `<rect x="${x2}" y="${y2}" width="${barW}" height="${top + plotH - y2}" fill="#888"/>`;
    bars += `<text x="${x1 + barW / 2}" y="${y1 - 8}" font-family="${FONT}" font-size="13" fill="${INK}" text-anchor="middle">${elnino}%</text>`;
    bars += `<text x="${x2 + barW / 2}" y="${y2 - 8}" font-family="${FONT}" font-size="13" fill="${INK}" text-anchor="middle">${ordinary}%</text>`;
    bars += `<text x="${gx}" y="${top + plotH + 24}" font-family="${FONT}" font-size="14" fill="${INK}" text-anchor="middle">${label}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#fcfcfb"/>
<text x="${left}" y="30" font-family="${FONT}" font-size="20" font-weight="bold" fill="${INK}">Share of stations below normal: El Nino winter vs. nearby ordinary winters</text>
<line x1="${left}" y1="${top + plotH}" x2="${W - right}" y2="${top + plotH}" stroke="${INK}" stroke-width="1.5"/>
${bars}
<rect x="${left}" y="${H - 34}" width="16" height="16" fill="${NEG}"/>
<text x="${left + 22}" y="${H - 21}" font-family="${FONT}" font-size="13" fill="${INK}">Strong El Nino winter</text>
<rect x="${left + 220}" y="${H - 34}" width="16" height="16" fill="#888"/>
<text x="${left + 242}" y="${H - 21}" font-family="${FONT}" font-size="13" fill="${INK}">Ordinary winters within 5 years</text>
</svg>`;
}

// ---------- Chart 3: spread-seasonal (dot chart, 10 cities x their El Nino winters) ----------
const SPREAD = [
  ["Tahoe City, CA", [172.6, 96.2, 130.6, 137.4, 82.4, 99.8]],
  ["Buffalo, NY", [133.4, 84.3, 56.0, 99.3, 80.9, 58.9, 76.3]],
  ["Flagstaff, AZ", [80.2, 235.4, 159.9, 178.1, 153.3, 87.8, 120.6]],
  ["Burlington, VT", [114.6, 108.3, 97.2, 95.7, 113.4, 41.4, 73.4]],
  ["Anchorage, AK", [40.9, 65.2, 96.0, 134.0, 75.9, 51.5, 179.2]],
  ["Portland, ME", [136.8, 107.2, 69.7, 90.2, 83.8, 79.7, 58.5]],
  ["Concord, NH", [112.3, 95.6, 63.4, 57.7, 96.9, 48.7, 91.0]],
  ["Denver, CO", [165.0, 141.9, 137.4, 125.4, 127.1, 77.0]],
  ["Salt Lake City, UT", [117.3, 155.7, 99.6, 68.8, 116.4, 61.3, 50.5]],
  ["Cleveland, OH", [57.0, 125.5, 69.6, 120.3, 62.3, 60.1, 47.1]],
];
function chart3() {
  const W = 1240, H = 716;
  const left = 190, right = 60, top = 50, bottom = 50;
  const plotW = W - left - right;
  const rowH = (H - top - bottom) / SPREAD.length;
  const maxPct = 250;
  const xScale = (v) => left + (v / maxPct) * plotW;
  const normX = xScale(100);
  let rows = "";
  SPREAD.forEach(([name, vals], i) => {
    const y = top + i * rowH + rowH / 2;
    rows += `<text x="${left - 12}" y="${y + 4}" font-family="${FONT}" font-size="14" fill="${INK}" text-anchor="end">${name}</text>`;
    rows += `<line x1="${left}" y1="${y}" x2="${W - right}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
    for (const v of vals) {
      const color = v < 100 ? NEG : POS;
      rows += `<circle cx="${xScale(v)}" cy="${y}" r="6" fill="${color}" fill-opacity="0.75"/>`;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#fcfcfb"/>
<text x="${left}" y="28" font-family="${FONT}" font-size="20" font-weight="bold" fill="${INK}">Each strong El Nino winter as a percent of that city's normal</text>
<line x1="${normX}" y1="${top - 10}" x2="${normX}" y2="${H - bottom + 10}" stroke="${GRID}" stroke-width="2"/>
<text x="${normX}" y="${H - bottom + 28}" font-family="${FONT}" font-size="12" fill="${SUB}" text-anchor="middle">100% (normal)</text>
${rows}
</svg>`;
}

await ship("cities-seasonal", chart1(), 1240, 1056);
await ship("winters-seasonal", chart2(), 1240, 620);
await ship("spread-seasonal", chart3(), 1240, 716);
