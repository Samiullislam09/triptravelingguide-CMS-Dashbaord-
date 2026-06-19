"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Is it running?");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Compass size={18} className="text-blue-400" />
          </div>
          <span className="text-lg font-medium">TripTravelingGuide</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-ink-900 border border-ink-700 rounded-xl p-6"
        >
          <h1 className="text-base font-medium mb-1">Sign in to the dashboard</h1>
          <p className="text-sm text-gray-400 mb-5">
            Credentials are set in your .env file
          </p>

          <label className="block text-xs text-gray-400 mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-blue-500"
            autoFocus
            required
          />

          <label className="block text-xs text-gray-400 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-blue-500"
            required
          />

          {error && (
            <p className="text-xs text-red-400 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Lock size={14} />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
