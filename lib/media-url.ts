// Article images are stored as root-relative paths ("/media/articles/...")
// because that is what the frontend's own domain serves them at (see
// scripts/host-images.mjs in this repo). This dashboard runs on a separate
// domain, so those same relative paths 404 when rendered here directly.
// mediaUrl() prefixes a root-relative path with the frontend's origin for
// display purposes only; absolute URLs (Unsplash, Wikimedia, etc.) pass
// through unchanged.
const FRONTEND_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://triptravelingguide.com"
).replace(/\/$/, "");

export function mediaUrl(src: string): string {
  if (!src) return src;
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
  return src.startsWith("/") ? FRONTEND_URL + src : src;
}

// Rewrites every root-relative <img src="/..."> in an HTML string to an
// absolute frontend URL, for rendering inside the CMS editor/preview only.
export function absolutizeMediaSrcs(html: string): string {
  if (!html) return html;
  return html.replace(
    /(<img\b[^>]*\bsrc=")(\/[^"]*)(")/gi,
    (_m, pre, path, post) => `${pre}${FRONTEND_URL}${path}${post}`
  );
}

// Inverse of absolutizeMediaSrcs(): rewrites the frontend's own absolute
// image URLs back to root-relative paths before saving, so storage keeps
// using the site-relative convention every other script expects.
export function relativizeMediaSrcs(html: string): string {
  if (!html) return html;
  const escaped = FRONTEND_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(<img\\b[^>]*\\bsrc=")${escaped}(/[^"]*)(")`, "gi");
  return html.replace(re, (_m, pre, path, post) => `${pre}${path}${post}`);
}
