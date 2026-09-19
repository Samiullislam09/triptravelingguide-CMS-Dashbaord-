// Original graphics for when-to-book-thanksgiving-flights-2026.
// Data: Google's published Thanksgiving low-price range (Sept 2025 report):
// 24 to 59 days before departure, lowest at 35. Dates are our own arithmetic,
// counted back from each 2026 departure date. Nothing here is a fare forecast.
//
// Writes chart-window.jpg and chart-verdict.jpg (1200x675) plus story-4.jpg and
// story-5.jpg (720x1280 date cards) into the frontend's public/media folder.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const DIR =
  "D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public/media/articles/when-to-book-thanksgiving-flights-2026/";
mkdirSync(DIR, { recursive: true });

const DAY = 864e5;
const day = (m, d) => Date.UTC(2026, m - 1, d);
const fmt = (t) =>
  new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const FONT = 'font-family="Arial, Helvetica, sans-serif"';

async function save(name, svg, w, h) {
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(DIR + name, jpg);
  console.log("wrote", name, jpg.length + "B", `${w}x${h}`);
}

// ---------- chart-window: one bar per travel day ----------
{
  const W = 1200, H = 675;
  const t0 = day(9, 15), t1 = day(11, 10);
  const L = 250, R = 900;
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (R - L);
  const rows = [
    ["Sat, Nov 21", day(11, 21), "out"],
    ["Sun, Nov 22", day(11, 22), "out"],
    ["Mon, Nov 23", day(11, 23), "out"],
    ["Tue, Nov 24", day(11, 24), "out"],
    ["Wed, Nov 25", day(11, 25), "out"],
    ["Thu, Nov 26", day(11, 26), "day"],
    ["Fri, Nov 27", day(11, 27), "back"],
    ["Sat, Nov 28", day(11, 28), "back"],
    ["Sun, Nov 29", day(11, 29), "back"],
    ["Mon, Nov 30", day(11, 30), "back"],
  ];
  const color = { out: "#0e7490", day: "#475569", back: "#f97316" };
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="50" font-size="30" font-weight="700" fill="#111">Google's Thanksgiving low-price window, by travel day</text>
<text x="40" y="80" font-size="18" fill="#555">Bars show the 24 to 59 days before departure when fares have been lowest. The dot is the single lowest point.</text>`;
  for (const [m, d, name] of [[10, 1, "Oct 1"], [10, 15, "Oct 15"], [11, 1, "Nov 1"]]) {
    const gx = x(day(m, d));
    svg += `<line x1="${gx}" y1="128" x2="${gx}" y2="580" stroke="#e3e3e3" stroke-width="2"/><text x="${gx}" y="606" font-size="17" fill="#666" text-anchor="middle">${name}</text>`;
  }
  for (const [t, label, c, anchor] of [
    [day(9, 19), "Today, Sep 19", "#111", "start"],
    [day(10, 31), "Halloween, Oct 31", "#c2410c", "end"],
  ]) {
    const mx = x(t);
    svg += `<line x1="${mx}" y1="118" x2="${mx}" y2="580" stroke="${c}" stroke-width="3" stroke-dasharray="8 6"/>`;
    svg += `<text x="${anchor === "end" ? mx - 8 : mx + 8}" y="122" font-size="16" font-weight="700" fill="${c}" text-anchor="${anchor}">${label}</text>`;
  }
  svg += `<text x="930" y="122" font-size="16" font-weight="700" fill="#555">Lowest point</text>`;
  const top = 138, rowH = 44;
  rows.forEach(([label, dep, kind], i) => {
    const cy = top + i * rowH + 22;
    const a = x(dep - 59 * DAY), b = x(dep - 24 * DAY), c = x(dep - 35 * DAY);
    svg += `<text x="40" y="${cy + 6}" font-size="20" font-weight="700" fill="#111">${label}</text>`;
    svg += `<rect x="${a}" y="${cy - 13}" width="${b - a}" height="26" rx="7" fill="${color[kind]}" opacity="0.92"/>`;
    svg += `<circle cx="${c}" cy="${cy}" r="8" fill="#111" stroke="#fff" stroke-width="3"/>`;
    svg += `<text x="${a + 12}" y="${cy + 5}" font-size="14" font-weight="700" fill="#fff">${fmt(dep - 59 * DAY)}</text>`;
    svg += `<text x="${b - 12}" y="${cy + 5}" font-size="14" font-weight="700" fill="#fff" text-anchor="end">${fmt(dep - 24 * DAY)}</text>`;
    svg += `<text x="930" y="${cy + 6}" font-size="20" font-weight="700" fill="#111">${fmt(dep - 35 * DAY)}</text>`;
  });
  // legend
  svg += `<rect x="40" y="628" width="18" height="14" rx="4" fill="${color.out}"/><text x="66" y="641" font-size="15" fill="#444">Flying out</text>`;
  svg += `<rect x="160" y="628" width="18" height="14" rx="4" fill="${color.day}"/><text x="186" y="641" font-size="15" fill="#444">Thanksgiving Day</text>`;
  svg += `<rect x="330" y="628" width="18" height="14" rx="4" fill="${color.back}"/><text x="356" y="641" font-size="15" fill="#444">Flying home</text>`;
  svg += `<text x="470" y="641" font-size="15" fill="#666">Source: Google, "Holiday travel trends" (9 Sept 2025). Dates: our arithmetic. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-window.jpg", svg, W, H);
}

// ---------- chart-verdict: one timeline, four zones ----------
{
  const W = 1200, H = 675;
  const t0 = day(9, 19), t1 = day(11, 26);
  const L = 60, R = 1140;
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (R - L);
  const zones = [
    [day(9, 19), day(9, 26), "Track", "#94a3b8"],
    [day(9, 26), day(10, 21), "Best window to buy", "#16a34a"],
    [day(10, 21), day(10, 31), "Last days", "#f59e0b"],
    [day(10, 31), day(11, 26), "Past the usual deadline", "#dc2626"],
  ];
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="40" y="50" font-size="30" font-weight="700" fill="#111">When we would book Thanksgiving flights, 2026</text>
<text x="40" y="80" font-size="18" fill="#555">Zones for a Tuesday, November 24 departure. Our advice, not a fare forecast.</text>`;
  for (const [a, b, label, c] of zones) {
    svg += `<rect x="${x(a)}" y="170" width="${x(b) - x(a) - 3}" height="84" rx="10" fill="${c}"/>`;
    svg += `<text x="${(x(a) + x(b)) / 2 - 1}" y="219" font-size="${label === "Track" ? 18 : 22}" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`;
  }
  const ticks = [
    [day(9, 19), "Sep 19", "Today", "start", 0],
    [day(9, 26), "Sep 26", "Window opens", "middle", 0],
    [day(10, 20), "Oct 20", "Google's low point", "middle", 0],
    [day(10, 30), "Oct 30", "Our last day", "middle", 0],
    [day(11, 26), "Nov 26", "Thanksgiving", "end", 0],
  ];
  for (const [t, d, sub, anchor] of ticks) {
    const tx = Math.min(Math.max(x(t), L + 1), R - 1);
    svg += `<line x1="${tx}" y1="258" x2="${tx}" y2="282" stroke="#333" stroke-width="3"/>`;
    svg += `<text x="${tx}" y="308" font-size="21" font-weight="700" fill="#111" text-anchor="${anchor}">${d}</text>`;
    svg += `<text x="${tx}" y="332" font-size="16" fill="#555" text-anchor="${anchor}">${esc(sub)}</text>`;
  }
  const boxes = [
    ["Your dates are fixed", ["Buy between Sep 26 and Oct 20.", "Do not go past Fri, Oct 30."]],
    ["Your dates can move", ["Track now. Mon to Wed runs about", "13% cheaper than the weekend."]],
    ["Today's fare already fits", ["Buy it. Nobody can name the low,", "and fares are up 9 to 13% on 2025."]],
  ];
  boxes.forEach(([title, lines], i) => {
    const bx = 40 + i * 375;
    svg += `<rect x="${bx}" y="392" width="350" height="190" rx="14" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="2"/>`;
    svg += `<text x="${bx + 22}" y="436" font-size="23" font-weight="700" fill="#111">${esc(title)}</text>`;
    lines.forEach((ln, j) => {
      svg += `<text x="${bx + 22}" y="${480 + j * 30}" font-size="19" fill="#333">${esc(ln)}</text>`;
    });
  });
  svg += `<text x="40" y="640" font-size="16" fill="#666">Based on Google's 2025 low-price range (24 to 59 days out) and The Points Guy's September 2026 fare report. Chart: TripTravelingGuide.</text></svg>`;
  await save("chart-verdict.jpg", svg, W, H);
}

// ---------- story cards (portrait) ----------
function card({ big, sub, barFrom, barTo, foot, from, to }) {
  return `<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg" ${FONT}>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="720" height="1280" fill="url(#g)"/>
<text x="360" y="420" font-size="${big.length > 12 ? 76 : 96}" font-weight="700" fill="#fff" text-anchor="middle">${esc(big)}</text>
<text x="360" y="490" font-size="30" fill="#e2f4f8" text-anchor="middle">${esc(sub)}</text>
${barFrom ? `<rect x="70" y="560" width="580" height="64" rx="32" fill="#a7f3d0"/><text x="70" y="664" font-size="28" fill="#fff">${esc(barFrom)}</text><text x="650" y="664" font-size="28" fill="#fff" text-anchor="end">${esc(barTo)}</text>` : ""}
<text x="360" y="1170" font-size="24" fill="#d0e9ef" text-anchor="middle">${esc(foot)}</text></svg>`;
}
await save(
  "story-4.jpg",
  card({
    big: "Sep 26 to Oct 20",
    sub: "Best window for Tue, Nov 24 flights",
    barFrom: "Sep 26",
    barTo: "Oct 20",
    foot: "Google's 2025 low-price range, our 2026 dates",
    from: "#0b3140",
    to: "#0e7490",
  }),
  720,
  1280
);
await save(
  "story-5.jpg",
  card({
    big: "Oct 30",
    sub: "Our last day to buy. Halloween is a Saturday.",
    foot: "Points Path fare data, via The Points Guy, Sept 2, 2026",
    from: "#7c2d12",
    to: "#c2410c",
  }),
  720,
  1280
);
await save(
  "story-3.jpg",
  card({
    big: "About 13% cheaper",
    sub: "Mon to Wed flights vs the weekend",
    foot: "Google, Holiday travel trends, 9 Sept 2025",
    from: "#1e293b",
    to: "#475569",
  }),
  720,
  1280
);
await save(
  "story-2.jpg",
  card({
    big: "Up 9 to 13%",
    sub: "Thanksgiving fares vs last year",
    foot: "Points Path data, via The Points Guy, Sept 2, 2026",
    from: "#3b0764",
    to: "#7e22ce",
  }),
  720,
  1280
);
