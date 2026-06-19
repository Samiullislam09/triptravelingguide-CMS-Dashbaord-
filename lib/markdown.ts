// Markdown -> HTML conversion for WordPress publishing and in-dashboard preview.
// Uses `marked` (GFM: tables, links, lists) so the output renders correctly in
// WordPress instead of leaking raw "##" / "**" / "[text](url)" syntax.

import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: false,
});

const SITE_DOMAIN = "triptravelingguide.com";

/**
 * Converts an article's markdown into clean, WordPress-ready HTML.
 *  - Comparison tables get a class so the theme can style them.
 *  - External links open in a new tab and are tagged rel="nofollow noopener"
 *    (internal links to our own domain stay dofollow).
 *  - [HUMAN INPUT NEEDED: ...] markers are highlighted so they're impossible
 *    to miss in the review screen (they must never reach a live post).
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  // Highlight human-input markers BEFORE markdown parsing so the spans survive.
  let src = markdown.replace(
    /\[HUMAN INPUT NEEDED:(.*?)\]/g,
    '<span class="human-input-marker">[HUMAN INPUT NEEDED:$1]</span>'
  );

  let html = marked.parse(src, { async: false }) as string;

  // Tag comparison tables for styling.
  html = html.replace(/<table>/g, '<table class="comparison-table">');

  // Make external links open in a new tab with safe rel attributes.
  html = html.replace(/<a\s+href="([^"]+)"([^>]*)>/g, (match, href, rest) => {
    const isExternal = /^https?:\/\//i.test(href) && !href.includes(SITE_DOMAIN);
    if (!isExternal) return match;
    if (/rel=/.test(rest)) return match;
    return `<a href="${href}"${rest} target="_blank" rel="nofollow noopener noreferrer">`;
  });

  return html.trim();
}

/**
 * Strips markdown/HTML down to plain text — used for word counts and excerpts.
 */
export function stripToText(markdown: string): string {
  return markdown
    .replace(/\[HUMAN INPUT NEEDED:.*?\]/g, "")
    .replace(/[#*_`>|-]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
