// Original charts for best-day-to-fly-new-years.
// Data: TSA daily checkpoint passenger volumes, tsa.gov/travel/passenger-volumes,
// read directly from the site's own year archive pages (2019, 2022-2025; 2020 and
// 2021 excluded, see the article's sources section for why). Averages are ours,
// the daily counts are TSA's.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const SLUG = "best-day-to-fly-new-years";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// 5-year average TSA checkpoint counts (2019, 2022-2025), computed from the
// daily figures published at tsa.gov/travel/passenger-volumes/<year>.
const ROWS = [
  ["Sat, Dec 26", 2593273, "out"],
  ["Sun, Dec 27", 2629891, "out"],
  ["Mon, Dec 28", 2598759, "out"],
  ["Tue, Dec 29", 2615846, "out"],
  ["Wed, Dec 30", 2622600, "out"],
  ["Thu, Dec 31 (NYE)", 2118019, "eve"],
  ["Fri, Jan 1 (NYD)", 2097378, "day"],
  ["Sat, Jan 2", 2397241, "back"],
  ["Sun, Jan 3", 2279246, "back"],
  ["Mon, Jan 4", 2142849, "back"],
  ["Tue, Jan 5", 2088294, "back"],
];

// ---------- chart-window: bar chart of all 11 days ----------
{
  const W = 1200, H = 840;
  const L = 240, R = 1150;
  const max = Math.max(...ROWS.map((r) => r[1])) * 1.05;
  const x = (v) => L + (v / max) * (R - L);
  const color = { out: "#94a3b8", eve: "#f97316", day: "#16a34a", back: "#0e7490" };
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="46" font-size="28" font-weight="700" fill="#111">TSA checkpoint travelers, Dec 26 to Jan 5</text>
<text x="40" y="72" font-size="17" fill="#555">5-year average (2019, 2022-2025). New Year's Day is the quietest day of the whole window.</text>`;
  const top = 100, rowH = 58;
  ROWS.forEach(([label, val, kind], i) => {
    const y = top + i * rowH;
    svg += `<text x="${L - 16}" y="${y + 26}" font-size="18" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y + 6}" width="${x(val) - L}" height="34" rx="9" fill="${color[kind]}" opacity="0.92"/>`;
    svg += `<text x="${x(val) + 12}" y="${y + 29}" font-size="18" font-weight="700" fill="#111">${(val / 1e6).toFixed(2)}M</text>`;
  });
  svg += `<rect x="40" y="${H - 56}" width="18" height="14" rx="4" fill="${color.out}"/><text x="66" y="${H - 44}" font-size="15" fill="#444">Pre-holiday rush</text>`;
  svg += `<rect x="230" y="${H - 56}" width="18" height="14" rx="4" fill="${color.eve}"/><text x="256" y="${H - 44}" font-size="15" fill="#444">New Year's Eve</text>`;
  svg += `<rect x="420" y="${H - 56}" width="18" height="14" rx="4" fill="${color.day}"/><text x="446" y="${H - 44}" font-size="15" fill="#444">New Year's Day</text>`;
  svg += `<rect x="610" y="${H - 56}" width="18" height="14" rx="4" fill="${color.back}"/><text x="636" y="${H - 44}" font-size="15" fill="#444">The return rush</text>`;
  svg += `<text x="40" y="${H - 14}" font-size="15" fill="#666">Source: TSA, tsa.gov/travel/passenger-volumes. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-window.jpg", svg, W, H);
}

// ---------- chart-verdict: when to fly out / when to fly back ----------
{
  const W = 1200, H = 640;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="46" font-size="28" font-weight="700" fill="#111">When we would fly, based on 5 years of TSA data</text>
<text x="40" y="72" font-size="17" fill="#555">Averages, not a forecast for this specific New Year's.</text>`;
  const cols = [
    ["Flying out", "Thu, Dec 31", "19% quieter than the Dec 26-30 rush", "#0e7490"],
    ["Best overall", "Fri, Jan 1", "The single quietest day of the window", "#16a34a"],
    ["Avoid", "Sat, Jan 2", "The busiest day after the holiday, 14% above Jan 1", "#dc2626"],
    ["Flying home", "Tue, Jan 5", "Essentially tied with Jan 1 for the quietest day", "#0e7490"],
  ];
  cols.forEach(([tag, day, note, color], i) => {
    const bx = 40 + i * 290;
    svg += `<rect x="${bx}" y="110" width="265" height="380" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>`;
    svg += `<rect x="${bx}" y="110" width="265" height="54" rx="16" fill="${color}"/>`;
    svg += `<rect x="${bx}" y="140" width="265" height="24" fill="${color}"/>`;
    svg += `<text x="${bx + 132}" y="144" font-size="20" font-weight="700" fill="#fff" text-anchor="middle">${esc(tag)}</text>`;
    svg += `<text x="${bx + 132}" y="230" font-size="30" font-weight="700" fill="#111" text-anchor="middle">${esc(day)}</text>`;
    const words = note.split(" ");
    let line = "", ly = 280, lines = [];
    for (const w of words) { const t = line ? line + " " + w : w; if (t.length > 26) { lines.push(line); line = w; } else line = t; }
    lines.push(line);
    lines.forEach((l, j) => {
      svg += `<text x="${bx + 132}" y="${ly + j * 26}" font-size="17" fill="#444" text-anchor="middle">${esc(l)}</text>`;
    });
  });
  svg += `<text x="40" y="${H - 24}" font-size="15" fill="#666">Source: TSA checkpoint data, 5-year average (2019, 2022-2025). Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-verdict.jpg", svg, W, H);
}

// ---------- story frames ----------
import { readFileSync, existsSync } from "node:fs";

function card({ big, sub, foot, from, to }) {
  const size = big.length > 14 ? 62 : big.length > 10 ? 80 : 100;
  return `<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="720" height="1280" fill="url(#g)"/>
<text x="360" y="590" font-size="${size}" font-weight="700" fill="#fff" text-anchor="middle">${esc(big)}</text>
<text x="360" y="660" font-size="28" fill="#e0f2fe" text-anchor="middle">${esc(sub)}</text>
<text x="360" y="1170" font-size="22" fill="#cfe4f3" text-anchor="middle">${esc(foot)}</text></svg>`;
}
const cards = [
  ["story-2.jpg", { big: "Jan 1 is quietest", sub: "The single quietest day in our 11-day TSA window", foot: "5-year TSA average, 2019 + 2022-2025", from: "#052e16", to: "#15803d" }],
  ["story-3.jpg", { big: "Quieter than NYE", sub: "New Year's Day beats New Year's Eve for a quiet terminal", foot: "2.10M vs 2.12M average travelers", from: "#0b3140", to: "#0e7490" }],
  ["story-4.jpg", { big: "Avoid Jan 2", sub: "The busiest return day, 14% above New Year's Day", foot: "TSA checkpoint data", from: "#450a0a", to: "#b91c1c" }],
  ["story-5.jpg", { big: "Fly out Dec 31", sub: "19% quieter than the Dec 26-30 pre-holiday rush", foot: "See the full day-by-day breakdown", from: "#3b0764", to: "#7e22ce" }],
];
for (const [name, c] of cards) await save(name, card(c), 720, 1280);

// story-1: portrait crop of the Denver airport terminal photo
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
