"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Compass,
  LayoutGrid,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Pipeline", icon: LayoutGrid },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <>
      <div className="flex items-center gap-2 px-4 py-4 border-b border-ink-700">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/30 to-blue-500/5 flex items-center justify-center ring-1 ring-blue-500/20">
          <Compass size={15} className="text-blue-400" />
        </div>
        <span className="text-sm font-semibold tracking-tight">
          TripTravelingGuide
        </span>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition relative ${
                active
                  ? "bg-ink-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-ink-800/60"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-blue-400" />
              )}
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 px-3 py-2 m-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-ink-800/60 transition"
      >
        <LogOut size={15} />
        Sign out
      </button>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-ink-700 bg-ink-900/90 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
            <Compass size={13} className="text-blue-400" />
          </div>
          <span className="text-sm font-semibold">TripTravelingGuide</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-ink-800"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60 animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-ink-900 border-r border-ink-700 flex flex-col animate-fade-in">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 p-1.5 rounded-lg hover:bg-ink-800"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            {nav}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-ink-700 bg-ink-900 min-h-screen sticky top-0 h-screen flex-col">
        {nav}
      </aside>
    </>
  );
}
