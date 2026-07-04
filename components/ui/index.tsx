"use client";

// Shared design-system primitives for the TripTravelingGuide command center.
// Every page composes these so the whole dashboard stays visually coherent.
// Light glass theme — tokens live in tailwind.config.ts / globals.css.

import { forwardRef, type ReactNode } from "react";
import { Loader2, type LucideIcon } from "lucide-react";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------- Card ------------------------------- */
export function Card({
  children,
  className,
  hover,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}) {
  return (
    <div
      className={cn("glass p-5 animate-fade-up", hover && "glass-hover", className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ----------------------------- Section ------------------------------ */
export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-brand-50 text-brand-600 shrink-0">
            <Icon size={17} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-ink leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ StatCard ---------------------------- */
export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "brand",
  spark,
  delay = 0,
}: {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  icon?: LucideIcon;
  accent?: "brand" | "ai" | "success" | "warn" | "danger";
  spark?: number[];
  delay?: number;
}) {
  const accentMap = {
    brand: "text-brand-600 bg-brand-50",
    ai: "text-ai-600 bg-ai-500/10",
    success: "text-success bg-success-soft",
    warn: "text-warn bg-warn-soft",
    danger: "text-danger bg-danger-soft",
  } as const;
  return (
    <Card hover delay={delay} className="p-4">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        {Icon && (
          <span className={cn("grid place-items-center h-8 w-8 rounded-lg", accentMap[accent])}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <div className="stat-value">{value}</div>
          {delta && (
            <div
              className={cn(
                "text-xs font-semibold mt-1",
                delta.positive === false ? "text-danger" : "text-success"
              )}
            >
              {delta.positive === false ? "▼" : "▲"} {delta.value}
            </div>
          )}
        </div>
        {spark && spark.length > 1 && (
          <Sparkline data={spark} className="w-20 h-8 shrink-0" />
        )}
      </div>
    </Card>
  );
}

/* ------------------------------ Sparkline --------------------------- */
export function Sparkline({
  data,
  className,
  stroke = "#3b6cf6",
  fill = true,
}: {
  data: number[];
  className?: string;
  stroke?: string;
  fill?: boolean;
}) {
  if (!data.length) return null;
  const w = 100;
  const h = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1 || 1);
  const pts = data.map((d, i) => [i * step, h - ((d - min) / range) * (h - 4) - 2]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `sg-${stroke.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------- Badge ------------------------------ */
const BADGE_TONES = {
  brand: "bg-brand-50 text-brand-700",
  ai: "bg-ai-500/10 text-ai-600",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-slate-100 text-slate-600",
} as const;

export function Badge({
  children,
  tone = "neutral",
  icon: Icon,
}: {
  children: ReactNode;
  tone?: keyof typeof BADGE_TONES;
  icon?: LucideIcon;
}) {
  return (
    <span className={cn("pill", BADGE_TONES[tone])}>
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

/* ------------------------------ Button ------------------------------ */
type BtnVariant = "primary" | "ai" | "ghost" | "soft";
export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: BtnVariant;
    icon?: LucideIcon;
    loading?: boolean;
  }
>(function Button({ variant = "primary", icon: Icon, loading, children, className, disabled, ...rest }, ref) {
  const cls = { primary: "btn-primary", ai: "btn-ai", ghost: "btn-ghost", soft: "btn-soft" }[variant];
  return (
    <button ref={ref} disabled={disabled || loading} className={cn(cls, className)} {...rest}>
      {loading ? <Loader2 size={15} className="animate-spin" /> : Icon && <Icon size={15} />}
      {children}
    </button>
  );
});

/* --------------------------- ProgressBar ---------------------------- */
export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "ai" | "success" }) {
  const bg = { brand: "bg-brand-500", ai: "bg-ai-500", success: "bg-success" }[tone];
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-500", bg)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ------------------------------ Spinner ----------------------------- */
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <Loader2 size={15} className="animate-spin" /> {label || "Loading…"}
    </div>
  );
}

/* ---------------------------- EmptyState ---------------------------- */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass border-dashed text-center py-14 px-6 animate-fade-up">
      <span className="mx-auto mb-3 grid place-items-center h-12 w-12 rounded-2xl bg-brand-50 text-brand-500">
        <Icon size={22} />
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="text-sm text-muted mt-1 max-w-md mx-auto">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/* ------------------------------ Skeleton ---------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}
