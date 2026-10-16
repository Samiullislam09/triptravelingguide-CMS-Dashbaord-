// Charts for colorado-traction-law-2026.
// Data: CDOT Passenger Vehicle Traction Law page and HB26-1237 coverage
// (Post Independent, Denver7), October 2026.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "colorado-traction-law-2026";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-tread: tire tread depth comparison ----------
{
  const W = 1200, H = 640;
  const rows = [
    { label: "Colorado's minimum", sixteenths: 3, color: "#0369a1" },
    { label: "Worn, likely to fail", sixteenths: 2, color: "#b91c1c" },
    { label: "New passenger tire", sixteenths: 10, color: "#15803d" },
  ];
  const maxVal = 10;
  const chartLeft = 300, chartW = 760, barH = 70, top = 140, gap = 40;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="44" font-size="26" font-weight="700" fill="#111">Colorado's tire tread floor: 3/16 inch</text>
<text x="40" y="72" font-size="15" fill="#555">Required regardless of 2WD, AWD, or 4WD. Source: CDOT.</text>`;
  rows.forEach((r, i) => {
    const y = top + i * (barH + gap);
    const w = (r.sixteenths / maxVal) * chartW;
    svg += `<text x="${chartLeft - 20}" y="${y + barH / 2 + 6}" font-size="17" font-weight="700" fill="#111" text-anchor="end">${esc(r.label)}</text>`;
    svg += `<rect x="${chartLeft}" y="${y}" width="${chartW}" height="${barH}" rx="10" fill="#f1f5f9"/>`;
    svg += `<rect x="${chartLeft}" y="${y}" width="${w}" height="${barH}" rx="10" fill="${r.color}"/>`;
    svg += `<text x="${chartLeft + w + 16}" y="${y + barH / 2 + 7}" font-size="18" font-weight="700" fill="#111">${r.sixteenths}/16 in</text>`;
  });
  svg += `<text x="40" y="${H - 18}" font-size="14" fill="#666">Chart: TripTravelingGuide, using CDOT's published standard.</text></svg>`;
  await save("chart-tread.jpg", svg, W, H);
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
  ["story-2.jpg", { big: "2WD is covered now", sub: "HB26-1237 closes the gap, effective September 1, 2026", foot: "No more assuming the rule doesn't apply to your car", from: "#0c4a6e", to: "#0ea5e9" }],
  ["story-3.jpg", { big: "3/16 inch", sub: "Colorado's minimum tire tread, no matter what's driving the wheels", foot: "AWD and 4WD are not a substitute for tires", from: "#1e3a8a", to: "#3b82f6" }],
  ["story-4.jpg", { big: "Chains always work", sub: "Cable chains or an approved device satisfy the law on any tires", foot: "AutoSock, ISSE Tire Sock, Alpha Trax, EasySox all qualify", from: "#312e81", to: "#6366f1" }],
  ["story-5.jpg", { big: "$100 to $500", sub: "CDOT's published fine range, higher if you close a lane", foot: "Check codot.gov before you drive, figures vary by source", from: "#422006", to: "#b45309" }],
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
  console.log("wrote story-6.jpg (chains crop)");
}
