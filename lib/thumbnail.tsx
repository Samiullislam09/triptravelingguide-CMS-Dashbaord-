import { ImageResponse } from "next/og";

// Template-based social/cover thumbnail generator (Module: Agent A — thumbnails).
// Renders a 1200x630 PNG with the brand gradient, the post title and its
// category, plus the site wordmark. No external fonts/images are fetched so
// this works reliably from a serverless function with zero network calls.

const WIDTH = 1200;
const HEIGHT = 630;

function pickTitleFontSize(title: string): number {
  // Longer titles get a smaller size so they still fit in ~3 wrapped lines.
  if (title.length > 90) return 44;
  if (title.length > 60) return 52;
  return 62;
}

export async function renderThumbnail({
  title,
  category,
}: {
  title: string;
  category?: string;
}): Promise<Buffer> {
  const cleanTitle = (title || "Untitled trip guide").trim();
  const cleanCategory = (category || "Travel Guide").trim().toUpperCase();
  const titleSize = pickTitleFontSize(cleanTitle);

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundImage: "linear-gradient(135deg, #3b6cf6 0%, #7c3aed 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Category pill */}
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 24px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.20)",
              color: "#ffffff",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            {cleanCategory}
          </div>
        </div>

        {/* Title block — wraps naturally within the fixed-width container. */}
        <div
          style={{
            display: "flex",
            color: "#ffffff",
            fontSize: titleSize,
            fontWeight: 800,
            lineHeight: 1.18,
            letterSpacing: -1,
            maxWidth: 1000,
          }}
        >
          {cleanTitle}
        </div>

        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "rgba(255,255,255,0.22)",
              color: "#ffffff",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            T
          </div>
          <div style={{ display: "flex", color: "#ffffff", fontSize: 28, fontWeight: 700 }}>
            TripTravelingGuide
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );

  const arrayBuffer = await image.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
