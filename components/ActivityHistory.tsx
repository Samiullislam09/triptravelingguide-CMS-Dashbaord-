"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CalendarDays, PenLine, Send } from "lucide-react";

interface DayRec {
  date: string;
  created: number;
  published: number;
  approved: number;
}
interface Activity {
  today: DayRec;
  yesterday: DayRec;
  series: { date: string; label: string; created: number; published: number }[];
  history: DayRec[];
  totals: { created: number; published: number };
}

export default function ActivityHistory() {
  const [data, setData] = useState<Activity | null>(null);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="bg-ink-900 border border-ink-700 rounded-xl p-5 h-[260px] animate-pulse" />
    );
  }

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-xl p-5 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays size={15} className="text-blue-400" /> Daily activity
        </div>
        <div className="text-xs text-gray-500">
          {data.totals.created} topics · {data.totals.published} published all-time
        </div>
      </div>

      {/* Today vs yesterday */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <DayCard title="Today" rec={data.today} highlight />
        <DayCard title="Yesterday" rec={data.yesterday} />
      </div>

      {/* 14-day trend */}
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data.series} margin={{ left: 0, right: 6, top: 4 }}>
          <defs>
            <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gPublished" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1A1E27" vertical={false} />
          <XAxis dataKey="label" stroke="#3a4151" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#1A1E27",
              border: "1px solid #252A36",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="created"
            name="Drafted/found"
            stroke="#3b82f6"
            fill="url(#gCreated)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="published"
            name="Published"
            stroke="#10b981"
            fill="url(#gPublished)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-1 text-[11px] text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Topics</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Published</span>
      </div>

      {/* History list */}
      {data.history.length > 0 && (
        <div className="mt-4 border-t border-ink-700 pt-3">
          <div className="text-xs text-gray-500 mb-2">History</div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {data.history.map((d) => (
              <div
                key={d.date}
                className="flex items-center justify-between text-xs py-1"
              >
                <span className="text-gray-400">{formatDate(d.date)}</span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-blue-300">
                    <PenLine size={11} /> {d.created}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <Send size={11} /> {d.published}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DayCard({
  title,
  rec,
  highlight,
}: {
  title: string;
  rec: DayRec;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2.5 border ${
        highlight
          ? "bg-blue-500/5 border-blue-500/20"
          : "bg-ink-800/50 border-ink-700"
      }`}
    >
      <div className="text-[11px] text-gray-400 mb-1">{title}</div>
      <div className="flex items-center gap-4">
        <div>
          <div className="text-lg font-semibold tabular-nums">{rec.created}</div>
          <div className="text-[10px] text-gray-500">topics</div>
        </div>
        <div>
          <div className="text-lg font-semibold tabular-nums text-emerald-400">
            {rec.published}
          </div>
          <div className="text-[10px] text-gray-500">published</div>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
