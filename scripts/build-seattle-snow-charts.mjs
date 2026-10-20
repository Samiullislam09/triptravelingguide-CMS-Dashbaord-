// Charts for does-it-snow-in-seattle.
// Data: NOAA 1991-2020 climate normals (via Wikipedia Climate of Seattle),
// City of Seattle OEM snow hazard planning document.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "does-it-snow-in-seattle";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-snow-history: notable snow records ----------
{
  const rows = [
    ["One day (2 Feb 1916)", 21.5, "#0369a1"],
    ["February 2019", 20.2, "#0ea5e9"],
    ["One month (Jan 1950)", 57.2, "#b91c1c"],
    ["One season (1968-69)", 67.5, "#7f1d1d"],
  ];
  const W = 1200, H = 640;
  const L = 320, top = 100, bh = 80;
  const maxVal = 70;
  const chartW = 680;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="40" font-size="24" font-weight="700" fill="#111">Seattle's biggest snow totals, in inches</text>
<text x="40" y="66" font-size="14" fill="#555">Source: NOAA records via Wikipedia, Climate of Seattle.</text>`;
  rows.forEach(([label, val, color], i) => {
    const y = top + i * bh;
    const w = (val / maxVal) * chartW;
    svg += `<text x="${L - 20}" y="${y + 26}" font-size="15" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="${chartW}" height="40" rx="9" fill="#f1f5f9"/>`;
    svg += `<rect x="${L}" y="${y}" width="${w}" height="40" rx="9" fill="${color}"/>`;
    svg += `<text x="${L + w + 16}" y="${y + 26}" font-size="18" font-weight="700" fill="#111">${val}"</text>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-snow-history.jpg", svg, W, H);
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
  ["story-2.jpg", { big: "6.3 inches a year", sub: "Spread across about 5 days, per NOAA's own normals", foot: "It's the hills, not the snow, that cause the chaos", from: "#0c4a6e", to: "#0ea5e9" }],
  ["story-3.jpg", { big: "Blame the ocean", sub: "The Pacific keeps Seattle's air too mild for snow most winters", foot: "Real snow needs cold air from inland Canada first", from: "#1e3a8a", to: "#3b82f6" }],
  ["story-4.jpg", { big: "The \u201csnow hole\u201d", sub: "The Puget Sound Convergence Zone can snow one neighborhood and skip the next", foot: "Ballard has a reputation for staying dry", from: "#312e81", to: "#6366f1" }],
  ["story-5.jpg", { big: "20.2 inches", sub: "Fell in February 2019, \u201cSnowmageddon,\u201d the snowiest Feb in 50+ years", foot: "Buses stopped running for days", from: "#422006", to: "#b45309" }],
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
  console.log("wrote story-6.jpg (playground crop)");
}
