// Module 8 — WordPress Publishing Integration (PDF Section 10.1)
// Uses WordPress's built-in REST API + Application Passwords.
// Supports both "draft" (default safety layer) and "publish" (live) per the
// dashboard's two-button flow, plus tags and Rank Math SEO meta.

interface SeoMeta {
  focusKeyword?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface WordPressPostPayload {
  title: string;
  content: string; // HTML
  slug: string;
  status: "draft" | "future" | "publish";
  excerpt?: string;
  tags?: string[]; // tag names — resolved to IDs (created if missing)
  categories?: number[]; // category IDs
  seo?: SeoMeta;
}

function getWordPressConfig() {
  const url = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;

  if (!url || !username || !appPassword) {
    throw new Error(
      "WordPress credentials missing from .env (WORDPRESS_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD)"
    );
  }

  return { url: url.replace(/\/$/, ""), username, appPassword };
}

function getAuthHeader(username: string, appPassword: string) {
  const token = Buffer.from(`${username}:${appPassword}`).toString("base64");
  return `Basic ${token}`;
}

/**
 * Verifies the WordPress connection works before allowing publish actions.
 */
export async function testWordPressConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const { url, username, appPassword } = getWordPressConfig();
    const res = await fetch(`${url}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: getAuthHeader(username, appPassword) },
    });

    if (!res.ok) {
      return {
        ok: false,
        message: `WordPress rejected the credentials (status ${res.status}). Double-check WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD in .env.`,
      };
    }

    const data = await res.json();
    return { ok: true, message: `Connected as ${data.name || username}` };
  } catch (error: any) {
    return { ok: false, message: error.message || "Connection failed" };
  }
}

/**
 * Resolves a list of tag names to WordPress tag IDs, creating any that don't
 * exist yet. Failures here are non-fatal — we just skip tags that can't resolve.
 */
async function resolveTagIds(
  url: string,
  auth: string,
  tagNames: string[]
): Promise<number[]> {
  const ids: number[] = [];
  for (const name of tagNames) {
    const clean = name.trim();
    if (!clean) continue;
    try {
      // Try to find an existing tag by search.
      const search = await fetch(
        `${url}/wp-json/wp/v2/tags?search=${encodeURIComponent(clean)}`,
        { headers: { Authorization: auth } }
      );
      const found = search.ok ? await search.json() : [];
      const match = Array.isArray(found)
        ? found.find((t: any) => t.name.toLowerCase() === clean.toLowerCase())
        : null;
      if (match) {
        ids.push(match.id);
        continue;
      }
      // Create it.
      const created = await fetch(`${url}/wp-json/wp/v2/tags`, {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      });
      if (created.ok) {
        const tag = await created.json();
        ids.push(tag.id);
      }
    } catch {
      // skip this tag
    }
  }
  return ids;
}

/**
 * Best-effort: write Rank Math SEO meta onto a post. Rank Math may not expose
 * these fields via REST on every install, so this never throws — SEO meta is a
 * nice-to-have, it must never block a publish.
 */
async function applySeoMeta(
  url: string,
  auth: string,
  postId: string,
  seo: SeoMeta
): Promise<boolean> {
  try {
    const meta: Record<string, string> = {};
    if (seo.focusKeyword) meta.rank_math_focus_keyword = seo.focusKeyword;
    if (seo.metaTitle) meta.rank_math_title = seo.metaTitle;
    if (seo.metaDescription) meta.rank_math_description = seo.metaDescription;
    if (Object.keys(meta).length === 0) return false;

    const res = await fetch(`${url}/wp-json/wp/v2/posts/${postId}`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ meta }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Creates a post on WordPress. `status` controls whether it lands as a draft
 * (safe default) or goes live ("publish"). Tags and SEO meta are applied
 * best-effort and never block the core publish.
 */
export async function publishToWordPress(payload: WordPressPostPayload): Promise<{
  postId: string;
  editUrl: string;
  link: string;
  seoApplied: boolean;
}> {
  const { url, username, appPassword } = getWordPressConfig();
  const auth = getAuthHeader(username, appPassword);

  const tagIds = payload.tags?.length
    ? await resolveTagIds(url, auth, payload.tags)
    : [];

  const body: Record<string, unknown> = {
    title: payload.title,
    content: payload.content,
    slug: payload.slug,
    status: payload.status,
    excerpt: payload.excerpt || "",
  };
  if (tagIds.length) body.tags = tagIds;
  if (payload.categories?.length) body.categories = payload.categories;

  const res = await fetch(`${url}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`WordPress publish failed (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const postId = String(data.id);

  const seoApplied = payload.seo
    ? await applySeoMeta(url, auth, postId, payload.seo)
    : false;

  return {
    postId,
    editUrl: `${url}/wp-admin/post.php?post=${postId}&action=edit`,
    link: data.link || `${url}/?p=${postId}`,
    seoApplied,
  };
}
