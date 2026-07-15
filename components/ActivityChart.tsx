"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Split into its own client chunk so recharts (heavy) is lazy-loaded via
// next/dynamic from the Overview page instead of bloating its first-load JS.
export default function ActivityChart({
  series,
}: {
  series: { date?: string; label: string; created: number; published: number }[];
}) {
  return (
    <div className="h-56 -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b6cf6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3b6cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gPublished" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e6e9f0",
              boxShadow: "0 8px 24px -8px rgba(15,23,42,0.15)",
              fontSize: 12,
            }}
          />
          <Area type="monotone" dataKey="created" stroke="#3b6cf6" strokeWidth={2} fill="url(#gCreated)" name="Created" />
          <Area type="monotone" dataKey="published" stroke="#16a34a" strokeWidth={2} fill="url(#gPublished)" name="Published" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
