# Dashboard Rebuild — Shared Contract (read this first)

We are rebuilding the TripTravelingGuide dashboard into a **light, glassmorphism,
SEMrush-style AI content command center**. The **foundation already exists and
must be reused, not reinvented**. Multiple agents work in parallel on disjoint
files. Stay strictly inside your assigned files + the API contracts below.

## Golden rules
1. **Do NOT modify** any of these (owned by the foundation): `tailwind.config.ts`,
   `app/globals.css`, `components/ui/index.tsx`, `components/Sidebar.tsx`,
   `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `app/api/overview/route.ts`,
   `prisma/schema.prisma`, `package.json`, `.env`.
2. **Do NOT run** `prisma db push`, `prisma migrate`, `npm install`, `next build`,
   or `next dev`. All models + deps you need already exist. To verify your work run
   **`npx tsc --noEmit`** only. If you genuinely need a new dep or schema field,
   DO NOT add it — note it in your final report instead.
3. Every DB-backed API route MUST start with `export const dynamic = "force-dynamic";`
   right after imports (build fails otherwise — this project prerenders routes).
4. Match the existing code's voice: TypeScript, clear comments, Hinglish-free code.

## Design system (use these, never hardcode colors)
- Import primitives from `@/components/ui`: `Card`, `StatCard`, `SectionHeader`,
  `Button` (variants: `primary` | `ai` | `ghost` | `soft`; props `icon`, `loading`),
  `Badge` (tones: `brand|ai|success|warn|danger|neutral`), `Sparkline`, `ProgressBar`,
  `Spinner`, `EmptyState`, `Skeleton`, and `cn(...)`.
- Glass utilities (globals.css): `.glass`, `.glass-strong`, `.glass-hover`, and
  button classes `.btn-primary/.btn-ai/.btn-ghost/.btn-soft`.
- Tailwind tokens: `bg-canvas`, `surface`, `border-line`, `text-muted`, `text-ink`,
  `brand-{50..700}` (primary blue), `ai-{400..600}` (violet, for generative actions),
  `success`/`warn`/`danger` (+ `-soft`). Animations: `animate-fade-up`,
  `animate-scale-in`, `animate-shimmer`, `animate-float`.
- Icons: `lucide-react`. Charts: `recharts` (already installed).
- Pages under `/dashboard/*` are **content-only** — the layout renders the sidebar.
  Do NOT import or render `<Sidebar/>` in a page. First element pattern:
  `<div className="space-y-6"> … </div>` with a header (`h1.text-2xl.font-bold`).
- Optional motion polish: `framer-motion` is installed.

## Data model (Prisma — already pushed, do not change)
- `Article`: id, title, slug, status (`discovered|titled|drafted|seo_tagged|linked|
  imaged|pending_review|approved|published`), primaryKeyword, contentHtml,
  contentMarkdown, wordCount, metaTitle, metaDescription, comparisonType
  (`destination|transport|stay`), tags (comma-sep), reasoning, source
  (`ai|manual|wordpress`), wordpressPostId, wordpressUrl, coverImageUrl,
  coverImageAlt, categoryName, categorySlug, needsRewrite, qualityNote,
  topicScore, searchVolume{Low,High}, keywordDifficulty, trendDirection,
  intentLabel, **thumbnailUrl**, **thumbnailStatus** (`none|generated|approved`),
  createdAt, approvedAt, publishedAt. Relations: humanInputMarkers, webStories.
- `WebStory`: id, articleId?, title, slug (unique), coverImageUrl, slides (JSON
  string: array of `{ imageUrl, heading, text, cta? }`), status (`draft|published`),
  source, createdAt, updatedAt, publishedAt.
- `KeywordMetric`: query, page, date, clicks, impressions, ctr, position, country.
- `PageMetric`: page, date, clicks, impressions, ctr, position.
- `AppConfig`: key (PK), value, updatedAt. Use for GSC connection state / lastSync.
- `comments`, `contact_messages`: Supabase-managed — access via `lib/inbox.ts` only.

## Reusable libs (already exist)
- `@/lib/db` → `prisma`.
- `@/lib/gemini` → `generateText(prompt, jsonMode?)`, `generateJson<T>(prompt)`.
  Model = gemini-2.5-flash with automatic multi-key failover. Use for ALL AI.
- `@/lib/contentPipeline` → `discoverTopic()`, `generateTitles()`,
  `generateArticleDraft()`, `generateSeoAndThumbnail()`.
- `@/lib/supabaseAdmin` → `supabaseAdmin()` (service-role client). Storage bucket
  for images is `post-images` (public). Upload thumbnails/story images there.
- `@/lib/inbox` → comments/contact CRUD (`listComments`, `setCommentApproved`,
  `deleteComment`, `replyToComment`, `listContactMessages`, `setContactStatus`,
  `deleteContactMessage`, `inboxSummary`).
- `@/lib/markdown` → markdown→HTML (check its exports before use).
- `@/lib/wordpress` → `testWordPressConnection()` + publish helpers.
- `@/lib/publicPost` → `toPublicPost()` for the public frontend API shape.

## API CONTRACTS (cross-agent — build/consume exactly these shapes)

### Thumbnails (owned by Agent A)
`POST /api/articles/[id]/thumbnail` → generates a 1200×630 template thumbnail
(via `next/og` `ImageResponse`, rendered from article title + category + brand
gradient), uploads PNG to Supabase `post-images`, sets `thumbnailUrl` +
`thumbnailStatus="generated"`. Returns `{ url: string }`.
`POST /api/articles/[id]/thumbnail/approve` → sets `thumbnailStatus="approved"`
and copies `thumbnailUrl` into `coverImageUrl`. Returns `{ ok: true }`.

### Web stories (owned by Agent C)
`POST /api/articles/[id]/story` → Gemini turns the article into 5–7 story slides,
creates a `WebStory` row (status `draft`), returns the story `{ id, slides, ... }`.
`GET /api/stories` → all stories. `GET/PATCH/DELETE /api/stories/[id]`.
`GET /api/public/stories` (CORS-open, `force-dynamic`) → published stories for the
frontend, shape `{ id, title, slug, coverImageUrl, slides, articleUrl }[]`.

### GSC (owned by Agent B)
`GET /api/gsc/status` → `{ connected: boolean, property?: string, lastSync?: string }`.
`POST /api/gsc/sync` → pull last 28 days of Search Console analytics by `query` and
by `page`, upsert into `KeywordMetric` / `PageMetric` (clear+reinsert the window is
fine), store `lastSync` + `property` in `AppConfig`. Returns `{ queries, pages }`
counts. Auth via env `GSC_SERVICE_ACCOUNT_JSON` (raw JSON string) + `GSC_PROPERTY`
(e.g. `sc-domain:triptravelingguide.com`). If env missing → status `connected:false`,
and sync returns HTTP 400 `{ error: "GSC not configured" }`. Add a
`GSC_SETUP.md` documenting the service-account steps (create SA in Google Cloud,
enable Search Console API, add the SA email as a Full user in GSC property settings,
paste JSON into env).

### Existing endpoints you may call (do not modify)
`GET /api/articles`, `GET/PATCH /api/articles/[id]`, `POST /api/articles/create-manual`,
`POST /api/articles/[id]/generate-draft`, `POST /api/articles/[id]/publish`,
`POST /api/topics/generate`, `GET /api/overview`, `GET /api/inbox/summary`,
`GET /api/wordpress/test-connection`.

## Verification
Run `npx tsc --noEmit` and ensure zero errors in the files you touched. Report a
short summary: files created/changed, any endpoint you couldn't fully test (e.g.
needs GSC creds), and anything you had to stub.
