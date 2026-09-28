// Original charts for when-will-it-first-snow-2026.
// Data: NOAA/NWS/NCEI 30-year average first-snow dates, as compiled by The
// Weather Channel (9 Oct 2017), cross-checked against Farmers' Almanac's
// September 2026 update of the same underlying climate record. The "this
// year" rollout is Direct Weather's September 2026 seasonal outlook, reported
// by Men's Journal/AOL. Nothing here is a prediction of an exact date.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const SLUG = "when-will-it-first-snow-2026";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// day-of-year offset from Sep 1 for plotting, using a non-leap reference year
const day = (m, d) => {
  const ref = new Date(Date.UTC(2026, 8, 1)); // Sep 1, 2026
  const t = new Date(Date.UTC(2026, m - 1, d));
  if (m <= 3) t.setUTCFullYear(2027); // Jan-Mar counts as the following year
  return Math.round((t - ref) / 864e5);
};

// ---------- chart-window: average first-snow date, selected cities ----------
{
  const rows = [
    ["Cheyenne, WY", 2, 10],
    ["Great Falls, MT", 2, 10],
    ["Denver, CO", 16, 10],
    ["Billings, MT", 12, 10],
    ["Duluth, MN", 21, 10],
    ["Caribou, ME", 23, 10],
    ["Salt Lake City, UT", 5, 11],
    ["Burlington, VT", 4, 11],
    ["Mpls-St Paul, MN", 2, 11],
    ["Buffalo, NY", 5, 11],
    ["Pittsburgh, PA", 14, 11],
    ["Detroit, MI", 15, 11],
    ["Chicago, IL", 16, 11],
    ["Columbus, OH", 20, 11],
    ["Indianapolis, IN", 23, 11],
    ["Boston, MA", 29, 11],
    ["Louisville, KY", 8, 12],
    ["New York, NY", 14, 12],
  ].map(([label, d, m]) => [label, day(m, d), `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]} ${d}`]);

  const W = 1200, H = 900;
  const L = 260, R = 1140;
  const min = Math.min(...rows.map((r) => r[1])) - 3;
  const max = Math.max(...rows.map((r) => r[1])) + 3;
  const x = (v) => L + ((v - min) / (max - min)) * (R - L);
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="46" font-size="27" font-weight="700" fill="#111">Average date of the season's first snow</text>
<text x="40" y="72" font-size="16" fill="#555">30-year NOAA/NWS climate average, sorted earliest to latest. Not a forecast for this year.</text>`;
  const monthMarks = [[10, 1], [11, 1], [12, 1], [1, 1]];
  for (const [m, d] of monthMarks) {
    const gx = x(day(m, d));
    const label = ["Oct 1", "Nov 1", "Dec 1", "Jan 1"][monthMarks.findIndex((mm) => mm[0] === m && mm[1] === d)];
    svg += `<line x1="${gx}" y1="96" x2="${gx}" y2="${96 + rows.length * 42}" stroke="#eee" stroke-width="2"/><text x="${gx}" y="${112 + rows.length * 42}" font-size="14" fill="#666" text-anchor="middle">${label}</text>`;
  }
  const top = 100, rowH = 42;
  rows.forEach(([label, v, dateLabel], i) => {
    const y = top + i * rowH;
    const color = v < day(11, 1) ? "#0e7490" : v < day(12, 1) ? "#16a34a" : "#f97316";
    svg += `<text x="${L - 14}" y="${y + 18}" font-size="16" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<circle cx="${x(v)}" cy="${y + 12}" r="8" fill="${color}"/>`;
    svg += `<text x="${x(v) + 16}" y="${y + 18}" font-size="15" font-weight="700" fill="#111">${dateLabel}</text>`;
  });
  svg += `<text x="40" y="${H - 20}" font-size="14" fill="#666">Source: NOAA/NWS/NCEI 30-year averages, compiled by The Weather Channel. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-window.jpg", svg, W, H);
}

// ---------- chart-verdict: 2026-27 rollout by region ----------
{
  const W = 1200, H = 700;
  const stages = [
    ["Late Sep", "High country of Montana, Wyoming, Colorado"],
    ["Early Oct", "More of the Rockies: Idaho, Utah, South Dakota"],
    ["Late Oct", "Cascades, higher Nevada, N. Minnesota, Northeast peaks"],
    ["Early Nov", "Rest of Rockies, N. Plains, Michigan, Appalachians, upstate NY"],
    ["Late Nov", "Inland Pacific NW, central Plains, Illinois, Indiana, Wisconsin"],
    ["Early Dec", "Texas Panhandle, Ohio Valley, Mid-Atlantic interior, S. New England"],
    ["Late Dec", "Washington DC, Philadelphia, Delaware, S. Appalachians"],
    ["January", "Lower Mid-Atlantic, northern Southeast, N. Texas, Oklahoma"],
  ];
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="46" font-size="27" font-weight="700" fill="#111">This year's rollout: where first snow reaches next</text>
<text x="40" y="72" font-size="16" fill="#555">Direct Weather's September 2026 outlook. A seasonal outlook, not a date for any one storm.</text>`;
  const top = 100, rowH = 72;
  stages.forEach(([stage, areas], i) => {
    const y = top + i * rowH;
    svg += `<rect x="40" y="${y}" width="170" height="52" rx="10" fill="#0e7490"/>`;
    svg += `<text x="125" y="${y + 33}" font-size="19" font-weight="700" fill="#fff" text-anchor="middle">${esc(stage)}</text>`;
    svg += `<text x="230" y="${y + 33}" font-size="17" fill="#222">${esc(areas)}</text>`;
    if (i < stages.length - 1) svg += `<line x1="125" y1="${y + 52}" x2="125" y2="${y + rowH}" stroke="#cbd5e1" stroke-width="3"/>`;
  });
  svg += `<text x="40" y="${H - 20}" font-size="14" fill="#666">Source: Direct Weather, via Men's Journal/AOL, 22 Sep 2026. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-verdict.jpg", svg, W, H);
}

// ---------- story frames ----------
import { readFileSync, existsSync } from "node:fs";

function card({ big, sub, foot, from, to }) {
  const size = big.length > 16 ? 54 : big.length > 11 ? 74 : 96;
  return `<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="720" height="1280" fill="url(#g)"/>
<text x="360" y="580" font-size="${size}" font-weight="700" fill="#fff" text-anchor="middle">${esc(big)}</text>
<text x="360" y="650" font-size="27" fill="#e0f2fe" text-anchor="middle">${esc(sub)}</text>
<text x="360" y="1170" font-size="21" fill="#cfe4f3" text-anchor="middle">${esc(foot)}</text></svg>`;
}
const cards = [
  ["story-2.jpg", { big: "0.1 inch = snow", sub: "NOAA's own threshold for a measurable first snowfall", foot: "NOAA Climate.gov, 1981-2010 normals", from: "#0b3140", to: "#0e7490" }],
  ["story-3.jpg", { big: "Denver: Oct 16", sub: "The 30-year average, with a record as early as Sep 3", foot: "NOAA/NWS/NCEI climate data", from: "#052e16", to: "#15803d" }],
  ["story-4.jpg", { big: "NYC: Dec 14", sub: "New York's average is nearly 2 months behind Denver's", foot: "Elevation and latitude both matter", from: "#450a0a", to: "#b91c1c" }],
  ["story-5.jpg", { big: "Not this year's date", sub: "Averages are a guide. One year's first snow can be weeks off", foot: "See the full state-by-state guide", from: "#3b0764", to: "#7e22ce" }],
];
for (const [name, c] of cards) await save(name, card(c), 720, 1280);

// story-1: portrait crop of the Grand Teton cover photo
const src = process.argv[2];
if (src && existsSync(src)) {
  const meta = await sharp(readFileSync(src)).metadata();
  const w = Math.round(meta.height * (720 / 1280));
  const left = Math.max(0, Math.round((meta.width - w) * 0.5));
  const buf = await sharp(readFileSync(src))
    .extract({ left, top: 0, width: Math.min(w, meta.width - left), height: meta.height })
    .resize(720, 1280)
    .jpeg({ quality: 84 })
    .toBuffer();
  writeFileSync(DIR + "story-1.jpg", buf);
  console.log("wrote story-1.jpg", buf.length + "B");
}
