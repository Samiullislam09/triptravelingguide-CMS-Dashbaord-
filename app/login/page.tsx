"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Login failed — check your credentials.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-canvas px-4">
      {/* Decorative brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-ai-500/15 blur-3xl"
      />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Brand header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-ai-500 text-white shadow-pop">
            <Compass size={26} />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            TripTravelingGuide
          </h1>
          <p className="text-sm text-muted">Content command center</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="glass-strong p-7 sm:p-8">
          <h2 className="text-lg font-semibold text-ink">Sign in</h2>
          <p className="mb-6 mt-1 text-sm text-muted">
            Enter your credentials to access the dashboard.
          </p>

          {/* Username */}
          <label
            htmlFor="username"
            className="mb-1.5 block text-xs font-medium text-ink"
          >
            Username
          </label>
          <div className="relative mb-4">
            <User
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              autoFocus
              required
              className="w-full rounded-xl border border-line bg-white/80 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>

          {/* Password with show/hide eye toggle */}
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium text-ink"
          >
            Password
          </label>
          <div className="relative mb-5">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-line bg-white/80 py-2.5 pl-9 pr-11 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-brand-50 hover:text-brand-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5 text-xs text-danger animate-fade-in">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <Lock size={14} />
                Sign in
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted">
          Protected area · authorized users only
        </p>
      </div>
    </div>
  );
}
