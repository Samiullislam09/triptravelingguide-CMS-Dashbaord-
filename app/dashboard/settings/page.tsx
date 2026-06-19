"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Wifi, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  async function handleTest() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/wordpress/test-connection");
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, message: "Request failed" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 px-6 py-6 md:px-10 md:py-8 max-w-2xl">
        <h1 className="text-xl font-medium mb-1">Settings</h1>
        <p className="text-sm text-gray-400 mb-6">
          All credentials live in your .env file — none are stored in the
          database or sent anywhere except the services you've configured.
        </p>

        <div className="bg-ink-900 border border-ink-700 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 text-sm font-medium mb-1">
            <Wifi size={15} /> WordPress connection
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Verifies WORDPRESS_URL, WORDPRESS_USERNAME, and
            WORDPRESS_APP_PASSWORD from .env are correct.
          </p>
          <button
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-2 bg-ink-800 hover:bg-ink-700 border border-ink-600 disabled:opacity-50 rounded-lg px-3.5 py-2 text-sm font-medium"
          >
            {testing && <Loader2 size={14} className="animate-spin" />}
            {testing ? "Testing..." : "Test connection"}
          </button>

          {result && (
            <div
              className={`mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
                result.ok
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {result.ok ? (
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              ) : (
                <XCircle size={14} className="shrink-0 mt-0.5" />
              )}
              {result.message}
            </div>
          )}
        </div>

        <div className="bg-ink-900 border border-ink-700 rounded-xl p-5 mb-4">
          <div className="text-sm font-medium mb-2">Environment checklist</div>
          <ul className="text-xs text-gray-400 space-y-1.5 list-disc pl-4">
            <li>DASHBOARD_USERNAME / DASHBOARD_PASSWORD — your login to this dashboard</li>
            <li>AUTH_SECRET — random string signing your session, generate with <code className="text-gray-300">openssl rand -base64 32</code></li>
            <li>GEMINI_API_KEY — free key from aistudio.google.com/app/apikey</li>
            <li>WORDPRESS_URL / WORDPRESS_USERNAME / WORDPRESS_APP_PASSWORD</li>
            <li>WEEKLY_PUBLISH_CAP — hard limit on approvals per week (default 5)</li>
          </ul>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
          <div className="text-sm font-medium text-amber-300 mb-1">
            About keyword data
          </div>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            This setup uses Gemini's own estimate for search volume and
            difficulty — there is no paid keyword API (DataForSEO/Ahrefs)
            connected. Treat these numbers as directional, not verified.
            Cross-check anything important in the free Google Keyword
            Planner before relying on it.
          </p>
        </div>
      </main>
    </div>
  );
}
