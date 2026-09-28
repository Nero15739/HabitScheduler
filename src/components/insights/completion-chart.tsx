"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDayMonth, monthName } from "@/lib/dates";

export function CompletionChart({ data, range }: { data: { date: string; pct: number | null }[]; range: string }) {
  const rows = data.map((d) => ({ ...d, label: formatDayMonth(d.date) }));
  const interval = range === "7" ? 0 : range === "30" ? 4 : range === "90" ? 13 : 45;
  const any = data.some((d) => d.pct !== null);
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 10, right: 28, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="completion-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={interval}
            padding={{ left: 4, right: 4 }}
            tickFormatter={(v: string, i: number) => (range === "365" ? monthName(rows[i]?.date ?? "2000-01-01", false) : v)}
          />
          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} unit="%" width={52} />
          <Tooltip
            cursor={{ stroke: "var(--border-strong)" }}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, color: "var(--text)" }}
            labelStyle={{ color: "var(--text-2)" }}
            formatter={(v) => [`${v}%`, "Completion"]}
          />
          <Area
            type="monotone"
            dataKey="pct"
            stroke="var(--accent)"
            strokeWidth={2.4}
            fill="url(#completion-fill)"
            connectNulls
            isAnimationActive={false}
            dot={range === "7" ? { r: 3.5, stroke: "var(--accent)", strokeWidth: 2, fill: "var(--surface)" } : false}
            activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2, fill: "var(--accent)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
      {!any && <div className="absolute inset-0 flex items-center justify-center text-sm text-text-3 pointer-events-none">No completions in this range yet.</div>}
    </div>
  );
}
