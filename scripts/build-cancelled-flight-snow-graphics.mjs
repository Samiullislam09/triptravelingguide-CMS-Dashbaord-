// Original graphics for flight-cancelled-due-to-snow.
// Facts come from primary text: 14 CFR 260.2 and 260.6 (refund duty, "significantly
// delayed or changed flight" thresholds, 7 business days / 20 calendar days) and the AP
// guide of 24 Jan 2026 (no federal duty to cover meals or lodging for weather).
//
// Writes chart-owed.jpg and chart-significant.jpg (1200x675), story-2..5 cards (720x1280)
// and story-1.jpg (a portrait crop of the Denver snowstorm photo) into public/media.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SLUG = "flight-cancelled-due-to-snow";
const DIR = `D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/${SLUG}/`;
mkdirSync(DIR, { recursive: true });
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-owed: what a snow cancellation gets you ----------
{
  const W = 1200, H = 675;
  const G = ["#dcfce7", "#166534"], A = ["#fef3c7", "#92400e"], R = ["#fee2e2", "#991b1b"];
  const rows = [
    ["Refund of fare and fees", ["Yes, required", G], ["Yes, required", G]],
    ["Rebooking on the same airline", ["Usually free, if seats exist", A], ["Usually free, if seats exist", A]],
    ["Rebooking on another airline", ["Not required", R], ["Check the airline's plan", A]],
    ["Meal voucher", ["Not required", R], ["Check the airline's plan", A]],
    ["Hotel room", ["Not required", R], ["Check the airline's plan", A]],
    ["Cash compensation", ["Not required", R], ["Not required", R]],
  ];
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="52" font-size="30" font-weight="700" fill="#111">What a cancelled US flight gets you</text>
<text x="40" y="84" font-size="18" fill="#555">Snow is treated as outside the airline's control. Crew and maintenance problems are within it.</text>
<text x="640" y="142" font-size="19" font-weight="700" fill="#111" text-anchor="middle">Cancelled for snow</text>
<text x="970" y="142" font-size="19" font-weight="700" fill="#111" text-anchor="middle">Cancelled for airline reasons</text>`;
  rows.forEach(([label, a, b], i) => {
    const y = 165 + i * 72;
    svg += `<rect x="40" y="${y}" width="1120" height="62" rx="12" fill="#f8fafc"/>`;
    svg += `<text x="62" y="${y + 39}" font-size="22" font-weight="700" fill="#111">${esc(label)}</text>`;
    for (const [cx, [txt, [bg, fg]]] of [[640, a], [970, b]]) {
      svg += `<rect x="${cx - 155}" y="${y + 9}" width="310" height="44" rx="22" fill="${bg}"/>`;
      svg += `<text x="${cx}" y="${y + 38}" font-size="18" font-weight="700" fill="${fg}" text-anchor="middle">${esc(txt)}</text>`;
    }
  });
  svg += `<text x="40" y="638" font-size="15" fill="#666">Sources: 14 CFR 260.6 (refunds); AP travel guide, 24 Jan 2026 (meals and lodging); The Points Guy (compensation). Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-owed.jpg", svg, W, H);
}

// ---------- chart-significant: when a change forces a refund ----------
{
  const W = 1200, H = 675;
  const L = 300, R = 1120, max = 8;
  const x = (h) => L + (h / max) * (R - L);
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="52" font-size="30" font-weight="700" fill="#111">When a schedule change means you can refuse and get a refund</text>
<text x="40" y="84" font-size="18" fill="#555">14 CFR 260.2: the change that counts as "significant" if the airline makes it.</text>`;
  for (let h = 0; h <= max; h += 2) {
    svg += `<line x1="${x(h)}" y1="140" x2="${x(h)}" y2="330" stroke="#e5e7eb" stroke-width="2"/><text x="${x(h)}" y="356" font-size="17" fill="#666" text-anchor="middle">${h} h</text>`;
  }
  svg += `<text x="40" y="200" font-size="22" font-weight="700" fill="#111">Domestic trip</text><text x="40" y="226" font-size="17" fill="#555">arrive or leave 3 hours or more off</text>`;
  svg += `<rect x="${x(3)}" y="178" width="${x(max) - x(3)}" height="52" rx="10" fill="#0e7490"/><text x="${x(3) + 16}" y="212" font-size="21" font-weight="700" fill="#fff">Refund if you decline</text>`;
  svg += `<rect x="${x(0)}" y="178" width="${x(3) - x(0)}" height="52" rx="10" fill="#e5e7eb"/><text x="${x(1.5)}" y="212" font-size="18" fill="#444" text-anchor="middle">No refund</text>`;
  svg += `<text x="40" y="300" font-size="22" font-weight="700" fill="#111">International trip</text><text x="40" y="326" font-size="17" fill="#555">arrive or leave 6 hours or more off</text>`;
  svg += `<rect x="${x(6)}" y="278" width="${x(max) - x(6)}" height="52" rx="10" fill="#f97316"/><text x="${x(6) + 12}" y="312" font-size="19" font-weight="700" fill="#fff">Refund</text>`;
  svg += `<rect x="${x(0)}" y="278" width="${x(6) - x(0)}" height="52" rx="10" fill="#e5e7eb"/><text x="${x(3)}" y="312" font-size="18" fill="#444" text-anchor="middle">No refund</text>`;
  svg += `<text x="40" y="410" font-size="22" font-weight="700" fill="#111">These also count, at any length of delay:</text>`;
  const boxes = [["A different departure", "or arrival airport"], ["More connections", "than you booked"], ["A lower class", "of service"]];
  boxes.forEach((t, i) => {
    const bx = 40 + i * 375;
    svg += `<rect x="${bx}" y="440" width="350" height="110" rx="14" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="2"/>`;
    svg += `<text x="${bx + 175}" y="487" font-size="22" font-weight="700" fill="#111" text-anchor="middle">${esc(t[0])}</text><text x="${bx + 175}" y="520" font-size="22" font-weight="700" fill="#111" text-anchor="middle">${esc(t[1])}</text>`;
  });
  svg += `<text x="40" y="638" font-size="15" fill="#666">Source: 14 CFR 260.2, "Significantly delayed or changed flight". A cancelled flight always qualifies. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-significant.jpg", svg, W, H);
}

// ---------- story frames ----------
function card({ big, sub, foot, from, to }) {
  const size = big.length > 14 ? 64 : big.length > 12 ? 76 : 96;
  return `<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="720" height="1280" fill="url(#g)"/>
<text x="360" y="600" font-size="${size}" font-weight="700" fill="#fff" text-anchor="middle">${esc(big)}</text>
<text x="360" y="670" font-size="30" fill="#e0f2fe" text-anchor="middle">${esc(sub)}</text>
<text x="360" y="1170" font-size="24" fill="#cfe4f3" text-anchor="middle">${esc(foot)}</text></svg>`;
}
const cards = [
  ["story-2.jpg", { big: "Refund: yes", sub: "Even on a non-refundable ticket", foot: "14 CFR 260.6, US Department of Transportation", from: "#052e16", to: "#15803d" }],
  ["story-3.jpg", { big: "Hotel and meals: no", sub: "Not required when snow is the cause", foot: "AP travel guide, 24 January 2026", from: "#450a0a", to: "#b91c1c" }],
  ["story-4.jpg", { big: "7 or 20 days", sub: "Card: 7 business days. Other: 20 calendar days", foot: "14 CFR 260.2, prompt refund", from: "#0b3140", to: "#0e7490" }],
  ["story-5.jpg", { big: "Ask for the refund", sub: "Decline the voucher unless you want it", foot: "Vouchers are the airline's offer, not your right", from: "#3b0764", to: "#7e22ce" }],
];
for (const [name, c] of cards) await save(name, card(c), 720, 1280);

// story-1: portrait crop of the Denver snowstorm photo (nose and gate sign)
const src = process.argv[2];
if (src && existsSync(src)) {
  const meta = await sharp(readFileSync(src)).metadata();
  const w = Math.round(meta.height * (720 / 1280));
  const left = Math.min(meta.width - w, Math.round(meta.width * 0.58));
  const buf = await sharp(readFileSync(src))
    .extract({ left, top: 0, width: w, height: meta.height })
    .resize(720, 1280)
    .jpeg({ quality: 84 })
    .toBuffer();
  writeFileSync(DIR + "story-1.jpg", buf);
  console.log("wrote story-1.jpg", buf.length + "B");
}
