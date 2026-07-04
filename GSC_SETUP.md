# Connecting Google Search Console (one-time setup)

This dashboard reads your real Search Console data (clicks, impressions,
rankings) via a **Google Cloud service account** — a "robot" login that never
expires and needs no browser sign-in flow. You only have to do this once.

It works identically whether the dashboard is running on your own computer or
deployed on Vercel — the same two environment variables are used in both
places (step 6).

## 1. Create a Google Cloud project

1. Go to https://console.cloud.google.com/
2. Click the project dropdown (top left) → **New Project**.
3. Name it anything, e.g. `triptravelingguide-gsc` → **Create**.
4. Make sure the new project is selected in the dropdown before continuing.

## 2. Enable the Search Console API

1. In the search bar at the top, type **Search Console API** and open it.
   (Direct link: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com)
2. Click **Enable**.

## 3. Create a service account

1. In the left sidebar go to **IAM & Admin → Service Accounts**.
2. Click **+ Create Service Account**.
3. Name it e.g. `gsc-reader` → **Create and Continue**.
4. You can skip granting it any project role (Search Console access is
   granted separately in step 5) → **Continue** → **Done**.

## 4. Create a JSON key for the service account

1. Click on the service account you just created.
2. Go to the **Keys** tab → **Add Key → Create new key**.
3. Choose **JSON** → **Create**. A `.json` file downloads to your computer.
4. Keep this file safe — it's a permanent credential. Do not commit it to git
   or share it publicly.

## 5. Give the service account access in Search Console

1. Open the downloaded JSON file and copy the `client_email` value — it
   looks like `gsc-reader@your-project.iam.gserviceaccount.com`.
2. Go to https://search.google.com/search-console
3. Select your property (e.g. `triptravelingguide.com`).
4. Go to **Settings → Users and permissions** → **Add user**.
5. Paste the service-account email, set permission to **Full**, and save.

## 6. Add the environment variables

Open the downloaded JSON file, copy its **entire contents**, and paste it as
a single-line, single-quoted string:

```
GSC_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"gsc-reader@your-project.iam.gserviceaccount.com", ...}'
GSC_PROPERTY="sc-domain:triptravelingguide.com"
```

Notes on `GSC_PROPERTY`:
- If your Search Console property is a **Domain property** (covers http +
  https + all subdomains), use `sc-domain:triptravelingguide.com` (no
  `https://`, no trailing slash).
- If it's a **URL-prefix property** instead, use the exact URL as shown in
  Search Console, e.g. `https://triptravelingguide.com/` (with the trailing
  slash).

**Locally:** add both lines to your `.env` file at the project root, then
restart the dev server.

**On Vercel:** go to your project → **Settings → Environment Variables** →
add `GSC_SERVICE_ACCOUNT_JSON` and `GSC_PROPERTY` with the same values →
redeploy.

## 7. Verify it worked

1. Open the dashboard → **SEO** page.
2. It should show a "Sync now" button instead of the "Connect Google Search
   Console" empty state.
3. Click **Sync now**. Within a few seconds you should see real clicks,
   impressions, and ranking data for the last 28 days.

If it still shows "not connected": double-check the JSON was pasted as one
continuous string (the `private_key` field contains literal `\n` sequences —
don't reformat them), and that the service-account email was added as a
**Full** user on the exact property in step 5.
