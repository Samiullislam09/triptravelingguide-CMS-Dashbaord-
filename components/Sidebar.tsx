"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Clapperboard,
  LineChart,
  Inbox,
  Settings,
  LogOut,
  Menu,
  X,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/components/ui";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "inbox";
  accent?: "ai";
};

const SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/ai", label: "AI Studio", icon: Sparkles, accent: "ai" },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/dashboard/content", label: "Articles", icon: FileText },
      { href: "/dashboard/stories", label: "Web Stories", icon: Clapperboard },
      { href: "/dashboard/inbox", label: "Inbox", icon: Inbox, badgeKey: "inbox" },
    ],
  },
  {
    heading: "Growth",
    items: [
      { href: "/dashboard/seo", label: "SEO · Search", icon: LineChart },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadCount() {
      try {
        const res = await fetch("/api/inbox/summary");
        if (!res.ok) return;
        const data = await res.json();
        if (active) setInboxCount((data.pendingComments ?? 0) + (data.newMessages ?? 0));
      } catch {
        /* badge is non-critical */
      }
    }
    loadCount();
    const timer = setInterval(loadCount, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const nav = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 shrink-0">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-ai-500 text-white shadow-pop">
          <Compass size={18} />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-ink">TripTravelingGuide</div>
          <div className="text-[11px] text-muted">Content command center</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.heading}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {section.heading}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition relative",
                      active
                        ? "bg-white text-ink shadow-glass"
                        : "text-slate-500 hover:text-ink hover:bg-white/60"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-gradient-to-b from-brand-500 to-ai-500" />
                    )}
                    <Icon
                      size={17}
                      className={cn(
                        active
                          ? item.accent === "ai"
                            ? "text-ai-600"
                            : "text-brand-600"
                          : "text-slate-400 group-hover:text-brand-500"
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badgeKey === "inbox" && inboxCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                        {inboxCount}
                      </span>
                    )}
                    {item.accent === "ai" && !active && (
                      <Sparkles size={12} className="text-ai-400 opacity-0 group-hover:opacity-100 transition" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 mx-3 mb-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-danger hover:bg-danger-soft transition"
      >
        <LogOut size={17} />
        Sign out
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 glass rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-brand-500 to-ai-500 text-white">
            <Compass size={14} />
          </span>
          <span className="text-sm font-bold text-ink">TripTravelingGuide</span>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-white/60" aria-label="Open menu">
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-canvas/95 backdrop-blur-xl border-r border-white/60 animate-fade-in">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-5 p-1.5 rounded-lg hover:bg-white/60"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            {nav}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-0 h-screen">
        {nav}
      </aside>
    </>
  );
}
