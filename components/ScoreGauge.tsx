"use client";

import { useEffect, useState } from "react";

/**
 * Animated circular gauge for a 0-100 topic score.
 */
export default function ScoreGauge({
  score,
  size = 92,
  label = "Topic score",
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const [shown, setShown] = useState(0);
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const t = setTimeout(() => setShown(score), 80);
    return () => clearTimeout(t);
  }, [score]);

  const offset = circumference - (shown / 100) * circumference;
  const color =
    score >= 70 ? "#34d399" : score >= 45 ? "#60a5fa" : "#f59e0b";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#252A36"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold" style={{ color }}>
            {Math.round(shown)}
          </span>
          <span className="text-[9px] text-gray-500 -mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="text-[11px] text-gray-500 mt-1">{label}</span>
    </div>
  );
}
