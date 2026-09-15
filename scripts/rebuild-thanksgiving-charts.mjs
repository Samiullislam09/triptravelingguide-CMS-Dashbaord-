// Rebuilds the 3 chart images for best-day-to-fly-thanksgiving, whose
// original files lived on the now-deleted old Supabase project. All numbers
// are taken directly from the article's own surviving contentHtml (which
// kept its data tables, only the chart <img> broke) or, where the article's
// prose didn't state a figure, from tsa.gov/travel/passenger-volumes/2025
// directly (fetched today).
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const FRONTEND_PUBLIC = "D:/Trip_traveling_guide_auto_dashboard/Triptravelingguide_frontend/public";
const SLUG = "best-day-to-fly-thanksgiving";
const FONT = "Arial, Helvetica, sans-serif";
const INK = "#0b0b0b", SUB = "#555", GRID = "#ddd", BAR = "#c0392b", HI = "#1f6f43";

async function ship(key, svg, w = 1200, h = 675) {
  const jpg = await sharp(Buffer.from(svg)).resize(w, h).jpeg({ quality: 90 }).toBuffer();
  const relPath = `media/articles/${SLUG}/${key}.jpg`;
  const dest = join(FRONTEND_PUBLIC, relPath);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, jpg);
  console.log(key, jpg.length + "B", `/${relPath}`);
}

function barChart({ title, sub, rows, highlightLabel, w = 1200, h = 675 }) {
  const padL = 260, padR = 160, padT = 90, padB = 50;
  const chartW = w - padL - padR, chartH = h - padT - padB;
  const max = Math.max(...rows.map((r) => r.value));
  const rowH = chartH / rows.length;
  const bars = rows
    .map((r, i) => {
      const y = padT + i * rowH + rowH * 0.2;
      const bh = rowH * 0.6;
      const bw = (r.value / max) * chartW;
      const fill = r.label === highlightLabel ? HI : BAR;
      return `
        <text x="${padL - 12}" y="${y + bh / 2 + 5}" text-anchor="end" font-family="${FONT}" font-size="20" fill="${INK}">${r.label}</text>
        <rect x="${padL}" y="${y}" width="${bw}" height="${bh}" fill="${fill}" rx="3"/>
        <text x="${padL + bw + 10}" y="${y + bh / 2 + 5}" font-family="${FONT}" font-size="18" font-weight="700" fill="${INK}">${r.value.toLocaleString("en-US")}</text>`;
    })
    .join("");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    <text x="40" y="40" font-family="${FONT}" font-size="26" font-weight="800" fill="${INK}">${title}</text>
    <text x="40" y="66" font-family="${FONT}" font-size="16" fill="${SUB}">${sub}</text>
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="${GRID}"/>
    ${bars}
  </svg>`;
}

// chart-fortnight: full 14-day table, straight from the article's own surviving text.
await ship(
  "chart-fortnight",
  barChart({
    title: "The Thanksgiving fortnight, averaged 2021-2025",
    sub: "TSA daily screening volume, mapped onto 2026 dates. Source: article's own TSA-derived table.",
    highlightLabel: "Thu 26 Nov",
    rows: [
      { label: "Wed 18 Nov", value: 2007640 },
      { label: "Thu 19 Nov", value: 2393008 },
      { label: "Fri 20 Nov", value: 2589190 },
      { label: "Sat 21 Nov", value: 2315849 },
      { label: "Sun 22 Nov", value: 2497493 },
      { label: "Mon 23 Nov", value: 2378267 },
      { label: "Tue 24 Nov", value: 2521042 },
      { label: "Wed 25 Nov", value: 2603742 },
      { label: "Thu 26 Nov", value: 1493635 },
      { label: "Fri 27 Nov", value: 2147584 },
      { label: "Sat 28 Nov", value: 2533817 },
      { label: "Sun 29 Nov", value: 2846035 },
      { label: "Mon 30 Nov", value: 2597188 },
      { label: "Tue 1 Dec", value: 2092560 },
    ],
  })
);

// chart-holidays: Thanksgiving's own 2025 figure is in the article's text
// (3,134,613, confirmed again directly against tsa.gov/travel/passenger-volumes/2025
// for 30 Nov 2025). The other four 2025 holiday peaks were not stated in the
// surviving prose, so they are pulled fresh from the same official source,
// same methodology (the single busiest day inside each holiday's travel
// window): Memorial Day peak 23 May 2025, Independence Day peak 6 Jul 2025,
// Labor Day peak 29 Aug 2025 (all tsa.gov, fetched today). Christmas's
// 2,924,593 is the one figure the article's own prose already stated.
await ship(
  "chart-holidays",
  barChart({
    title: "Busiest single day in each 2025 US holiday window",
    sub: "TSA checkpoint volume. Source: tsa.gov/travel/passenger-volumes/2025.",
    highlightLabel: "Thanksgiving",
    rows: [
      { label: "Thanksgiving", value: 3134613 },
      { label: "Independence Day", value: 3041954 },
      { label: "Labor Day", value: 2971455 },
      { label: "Memorial Day", value: 2953905 },
      { label: "Christmas", value: 2924593 },
    ],
  })
);

// chart-weekday: the article's surviving prose states only the two extremes
// (Tuesday quietest, Sunday busiest, 2022-2025 average) rather than all 7
// days, so the chart shows those two rather than inventing the other five.
await ship(
  "chart-weekday",
  barChart({
    title: "Quietest vs busiest weekday to fly, averaged 2022-2025",
    sub: "TSA daily screening volume. Source: article's own TSA-derived figures.",
    highlightLabel: "Tuesday",
    rows: [
      { label: "Sunday", value: 2542664 },
      { label: "Tuesday", value: 2082231 },
    ],
  })
);
