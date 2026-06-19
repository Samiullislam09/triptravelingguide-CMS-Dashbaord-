// Wrapper around Google's Gemini free-tier API.
// All AI generation in this app goes through this one file, so swapping
// providers later (e.g. to Claude API) only means editing this file.

import { GoogleGenerativeAI } from "@google/generative-ai";

// Multiple free-tier keys with automatic failover: when one key hits its daily
// quota (429), the next key is tried. Add as many as you like in .env as
// GEMINI_API_KEY, GEMINI_API_KEY1, GEMINI_API_KEY2, ...
function getApiKeys(): string[] {
  const raw = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY1,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY4,
  ];
  const keys = Array.from(
    new Set(raw.filter((k): k is string => !!k && k.trim().length > 0).map((k) => k.trim()))
  );
  if (keys.length === 0) {
    throw new Error(
      "No GEMINI_API_KEY in .env. Get a free key at https://aistudio.google.com/app/apikey"
    );
  }
  return keys;
}

// A key-specific failure (quota exhausted, invalid/forbidden key) — we should
// move on to the next key. A 400/safety error is NOT key-specific (retrying
// other keys won't help) so those fail fast.
function isKeyError(error: unknown): boolean {
  const msg = String((error as any)?.message || error || "");
  return (
    /\b(429|403|401)\b/.test(msg) ||
    /quota|RESOURCE_EXHAUSTED|rate.?limit|Too Many Requests|PERMISSION_DENIED|API_KEY_INVALID|API key not valid|forbidden|unauthorized/i.test(
      msg
    )
  );
}

// Remembers which key last worked so we don't waste a call on a known-exhausted
// key every request (daily quotas mean a dead key stays dead for the day).
let keyCursor = 0;

export async function generateText(prompt: string, jsonMode = false): Promise<string> {
  const keys = getApiKeys();
  const start = keyCursor; // freeze the starting point for this whole attempt
  let lastError: unknown;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const index = (start + attempt) % keys.length;
    try {
      const genAI = new GoogleGenerativeAI(keys[index]);
      const model = genAI.getGenerativeModel({
        // Note: newer "AQ." Gemini API keys have ZERO free-tier quota on
        // gemini-2.0-flash (returns 429 limit:0). 2.5-flash works on free tier.
        model: "gemini-2.5-flash",
        generationConfig: jsonMode
          ? { responseMimeType: "application/json" }
          : undefined,
      });

      const result = await model.generateContent(prompt);
      keyCursor = index; // this key works — start here next time
      return result.response.text();
    } catch (error) {
      lastError = error;
      if (isKeyError(error)) continue; // exhausted/invalid — try the next key
      throw error; // a non-key error (bad prompt, safety block) — fail fast
    }
  }

  // Every key failed — move the cursor past the first one so next time we don't
  // start on a known-dead key, then surface a clear message.
  keyCursor = (start + 1) % keys.length;

  throw new Error(
    `All ${keys.length} Gemini API key(s) are out of quota right now. ` +
      `Add another GEMINI_API_KEY in .env or wait for the daily reset. ` +
      `(last error: ${String((lastError as any)?.message || lastError).slice(0, 160)})`
  );
}

/**
 * Cleans a model response into parseable JSON:
 * strips ```json fences and any prose before/after the JSON body.
 */
function extractJson(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
  }
  // If the model wrapped the JSON in extra prose, grab the outermost {...} or [...].
  const objStart = s.indexOf("{");
  const arrStart = s.indexOf("[");
  const start =
    objStart === -1
      ? arrStart
      : arrStart === -1
      ? objStart
      : Math.min(objStart, arrStart);
  const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  return s;
}

/**
 * Like generateText but returns parsed JSON. Free-tier models occasionally emit
 * slightly malformed JSON (unescaped quote, stray token), so we clean the output
 * and retry a fresh generation a couple of times before giving up.
 */
export async function generateJson<T = any>(
  prompt: string,
  retries = 2
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const raw = await generateText(prompt, true);
    try {
      return JSON.parse(extractJson(raw)) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    `Gemini returned invalid JSON after ${retries + 1} attempts: ${
      lastError?.message || "unknown parse error"
    }`
  );
}
