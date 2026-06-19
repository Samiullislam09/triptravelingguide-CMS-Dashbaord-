# TripTravelingGuide — AI content dashboard

Ye real, working application hai jo PDF blueprint ke 9 modules ko follow karta hai:
topic discovery (Gemini-estimated), keyword scoring, title generation, 700+ word
draft writing, SEO meta, thumbnail prompt, human review with hard gates, aur
WordPress publishing.

## Important honesty note before you start

- **AI estimates, not real Google data**: koi paid keyword API (DataForSEO/Ahrefs)
  connected nahi hai. Gemini khud andaza lagata hai search volume/difficulty ka.
  Ye dashboard mein hamesha "AI estimate" label ke saath dikhta hai. Real verified
  numbers ke liye `lib/contentPipeline.ts` mein `discoverTopic()` function edit
  karke ek keyword API call jodni hogi.
- **WordPress posts hamesha "draft" status mein jaate hain**, "publish" nahi —
  jaisa PDF Section 10.1 mein recommend kiya gaya hai, taaki aap last-minute
  manually check kar sako WordPress admin mein.
- **Analytics page abhi sirf pipeline counts dikhata hai** (kitne articles kis
  stage mein hain). Real ranking/traffic/revenue ke liye Google Search Console,
  GA4, aur AdSense API connect karne honge — wo iss build mein shamil nahi hai.

## Step 1 — Files apne computer pe le jao

Is poore folder ko download/copy karo apne computer pe.

## Step 2 — Dependencies install karo

Apne computer ke terminal mein (is project folder ke andar):

```bash
npm install
```

## Step 3 — .env file banao

```bash
cp .env.example .env
```

Fir `.env` file kholo aur ye values bharo:

1. **DASHBOARD_USERNAME / DASHBOARD_PASSWORD** — apna login khud choose karo
2. **AUTH_SECRET** — terminal mein chalao: `openssl rand -base64 32`, jo output
   aaye wo paste karo
3. **GEMINI_API_KEY** — https://aistudio.google.com/app/apikey pe jaake free key
   banao
4. **WORDPRESS_URL** — aapki site ka URL, jaise `https://triptravelingguide.com`
5. **WORDPRESS_USERNAME** — aapka WordPress admin username
6. **WORDPRESS_APP_PASSWORD** — WordPress admin mein: Users → Profile → scroll
   down to Application Passwords → naam do → Add New Application Password →
   jo password dikhe wahi yahan paste karo (spaces ke saath bhi chalega)

## Step 4 — Database banao

```bash
npm run db:push
```

Ye `prisma/dev.db` naam ki SQLite file bana dega — koi separate database server
install karne ki zaroorat nahi.

## Step 5 — App chalu karo

```bash
npm run dev
```

Browser mein kholo: **http://localhost:3000**

Apne `.env` mein set kiya hua username/password se login karo.

## Kaise use karein

1. **"Generate new topic"** click karo — AI khud topic, keyword, score nikalega
2. Topic card pe **"Generate title, draft & SEO"** click karo — AI 700+ words
   ka article likhega, saath mein title options, meta description, aur
   thumbnail image prompt
3. Article ab **"Pending review"** mein chala jayega — usko click karo
4. Saare `[HUMAN INPUT NEEDED]` markers ko resolve karo (jaise photo add karna
   ya price confirm karna) — jab tak resolve nahi karoge, **Approve button
   lock rahega**
5. Content edit karna ho to **Edit** dabao, save karo
6. Sab clear hone ke baad **"Approve & schedule"** dabao
7. Fir **"Send to WordPress (as draft)"** dabao — article WordPress mein
   **draft** ban jayega, aapko wahan jaake aakhri baar check karke khud
   publish karna hoga

## Weekly publish cap

`.env` mein `WEEKLY_PUBLISH_CAP` set hai (default 5). Agar ek hafte mein itne
articles already approve ho chuke hain, to naya approve nahi hoga — ye PDF ke
Section 5.4 wala guardrail hai, jo bohot zyada content publish hone se rokta hai.

## Database dekhne ke liye (optional)

```bash
npm run db:studio
```

Ye browser mein ek visual database editor khol dega.

## Real keyword data jodna (baad mein, agar chaho)

`lib/contentPipeline.ts` mein `discoverTopic()` function ke andar, Gemini ko jo
prompt bhejte hain usme DataForSEO (ya kisi aur keyword API) se mile real
numbers pass kar sakte ho — bas pehle ek API call karke wo data fetch karna
hoga, fir Gemini ke prompt mein context ke taur pe daalna hoga.
