// Charts for altitude-sickness-colorado-guide.
// Data: UCHealth (Dr. Benjamin Honigman), Denver Health, CU Anschutz,
// and the 1993 PubMed tourist-population AMS study.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "altitude-sickness-colorado-guide";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-elevation: elevation ladder with risk ----------
{
  const rows = [
    ["Denver", 5280, "#15803d"],
    ["DIA (airport)", 5433, "#15803d"],
    ["Aspen", 7908, "#ca8a04"],
    ["Vail (base)", 8150, "#ca8a04"],
    ["Telluride", 8750, "#ca8a04"],
    ["Breckenridge (base)", 9600, "#b91c1c"],
    ["Leadville", 10152, "#b91c1c"],
  ];
  const W = 1200, H = 760;
  const L = 320, top = 90, bh = 76;
  const maxFt = 11000;
  const chartW = 700;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="40" font-size="24" font-weight="700" fill="#111">Elevation and altitude sickness risk</text>
<text x="40" y="64" font-size="14" fill="#555">Risk rises sharply above 8,000 feet. Green = low, amber = moderate, red = high.</text>`;
  rows.forEach(([label, ft, color], i) => {
    const y = top + i * bh;
    const w = (ft / maxFt) * chartW;
    svg += `<text x="${L - 20}" y="${y + 26}" font-size="16" font-weight="700" fill="#111" text-anchor="end">${esc(label)}</text>`;
    svg += `<rect x="${L}" y="${y}" width="${chartW}" height="38" rx="9" fill="#f1f5f9"/>`;
    svg += `<rect x="${L}" y="${y}" width="${w}" height="38" rx="9" fill="${color}"/>`;
    svg += `<text x="${L + w + 16}" y="${y + 26}" font-size="16" font-weight="700" fill="#111">${ft.toLocaleString()} ft</text>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Sources: UCHealth, Denver Health, CDOT. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-elevation.jpg", svg, W, H);
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
  ["story-2.jpg", { big: "1 in 4 visitors", sub: "Get mild to moderate altitude sickness in Colorado's mountains", foot: "Denver locals: only 7 to 8 percent", from: "#0c4a6e", to: "#0ea5e9" }],
  ["story-3.jpg", { big: "6 to 24 hours", sub: "When symptoms usually start, not right when you land", foot: "Easy to mistake for a hangover or jet lag", from: "#1e3a8a", to: "#3b82f6" }],
  ["story-4.jpg", { big: "4x the risk", sub: "Skipping a night in Denver before going above 8,000 feet", foot: "Acclimatizing first cuts your odds sharply", from: "#312e81", to: "#6366f1" }],
  ["story-5.jpg", { big: "Under 1 percent", sub: "Of cases become the serious HACE or HAPE complications", foot: "Most mild cases clear up in a day or two", from: "#422006", to: "#b45309" }],
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
  console.log("wrote story-6.jpg (Breckenridge crop)");
}
