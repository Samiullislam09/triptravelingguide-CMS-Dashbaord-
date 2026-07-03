# Postgres (Neon) setup — one-time, ~5 minutes

The dashboard now uses **Postgres** instead of SQLite, because Vercel's
serverless functions cannot use a local SQLite file. We use **Neon** (free tier)
— the same cloud database works for both your local machine and Vercel.

## Step 1 — Create a free Neon database

1. Go to **https://neon.tech** and sign up (Google login is fine).
2. Click **Create project**.
   - Name: `triptravelingguide`
   - Region: pick **US East (Ohio)** or whichever is closest to your Vercel region.
3. After it's created, open **Dashboard → Connect** (or "Connection Details").

## Step 2 — Copy the TWO connection strings

Neon shows a connection string. You need two variants:

- **Pooled** (the default shown, host contains `-pooler`) → this is `DATABASE_URL`
- **Direct** (toggle off "Connection pooling", host has NO `-pooler`) → this is `DIRECT_URL`

Both look like:
```
postgresql://alex:npg_xxxx@ep-cool-name-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Step 3 — Paste them into `.env`

Open `triptravelguide-dashboard/.env` and replace the two placeholder lines:

```env
DATABASE_URL="<your POOLED string, host has -pooler>"
DIRECT_URL="<your DIRECT string, host has NO -pooler>"
```

Keep `?sslmode=require` at the end of both.

## Step 4 — Tell me "Neon ready"

Once the strings are in `.env`, just say **"Neon ready"** and I'll run:

```bash
npm run db:generate   # regenerate Prisma client for Postgres
npm run db:push       # create all tables on Neon
```

…and verify the dashboard + `/api/public/posts` work against the cloud database.

## Step 5 — On Vercel (later, when we deploy the dashboard)

Add the same `DATABASE_URL` and `DIRECT_URL` as Environment Variables in the
Vercel project settings. (Or use the **Vercel + Neon integration**, which sets
them automatically.) Nothing else changes.

---

### Notes
- Your old SQLite test data (`dev.db`) is **not** migrated — it was throwaway
  test content. The real 20 WordPress posts come in via the migration phase.
- Free Neon tier is plenty for this site (0.5 GB storage, autoscaling compute).
