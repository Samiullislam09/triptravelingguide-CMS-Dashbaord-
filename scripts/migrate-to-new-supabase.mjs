// One-off: copy every row from the old (quota-frozen) Supabase project to the
// new one, table by table in FK-safe order. Generic — reads whatever columns
// exist on the source row and inserts them as-is, so it doesn't need updating
// if a column gets added. Idempotent: ON CONFLICT (id) DO NOTHING, safe to
// re-run if it's interrupted partway through.
//
// Usage: node scripts/migrate-to-new-supabase.mjs
// Reads SRC_DATABASE_URL and DST_DATABASE_URL from the environment.
import pg from "pg";
const { Pool } = pg;

const SRC = process.env.SRC_DATABASE_URL;
const DST = process.env.DST_DATABASE_URL;
if (!SRC || !DST) {
  console.error("Set SRC_DATABASE_URL and DST_DATABASE_URL");
  process.exit(1);
}

// Parent tables before the tables that reference them. `comments` is
// self-referential (parent_id -> comments.id), so it orders itself by
// created_at ascending below.
const TABLES = [
  "Article",
  "WebStory",
  "HumanInputMarker",
  "InternalLink",
  "ExternalLink",
  "AnalyticsSnapshot",
  "ReviewLog",
  "PublishSchedule",
  "KeywordMetric",
  "PageMetric",
  "AppConfig",
  "comments",
  "contact_messages",
];

const src = new Pool({ connectionString: SRC, max: 1, connectionTimeoutMillis: 10_000 });
const dst = new Pool({ connectionString: DST, max: 1, connectionTimeoutMillis: 10_000 });

async function copyTable(name) {
  const orderBy = name === "comments" ? ' ORDER BY "created_at" ASC' : "";
  const { rows } = await src.query(`SELECT * FROM "${name}"${orderBy}`);
  if (rows.length === 0) {
    console.log(`${name}: 0 rows, skipping`);
    return { name, count: 0 };
  }
  const cols = Object.keys(rows[0]);
  const colList = cols.map((c) => `"${c}"`).join(",");
  const conflictCol = cols.includes("id") ? "id" : cols[0];
  let inserted = 0;
  for (const row of rows) {
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(",");
    const values = cols.map((c) => row[c]);
    try {
      const res = await dst.query(
        `INSERT INTO "${name}" (${colList}) VALUES (${placeholders}) ON CONFLICT ("${conflictCol}") DO NOTHING`,
        values,
      );
      inserted += res.rowCount ?? 0;
    } catch (e) {
      console.error(`  FAILED row in ${name}:`, e.message, JSON.stringify(row).slice(0, 200));
    }
  }
  console.log(`${name}: ${rows.length} source rows, ${inserted} inserted`);
  return { name, count: rows.length, inserted };
}

const results = [];
for (const t of TABLES) {
  results.push(await copyTable(t));
}
await src.end();
await dst.end();
console.log("\nDone.", JSON.stringify(results, null, 2));
