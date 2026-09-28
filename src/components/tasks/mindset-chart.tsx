"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { weekdayShort } from "@/lib/dates";

type Mind = { date: string; energy: number | null; focus: number | null; motivation: number | null };

export function MindsetChart({ days, data }: { days: string[]; data: Mind[] }) {
  const rows = days.map((d, i) => ({ day: weekdayShort(d), ...data[i] }));
  const any = data.some((d) => d.energy || d.focus || d.motivation);
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis domain={[1, 10]} ticks={[1, 5, 10]} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ stroke: "var(--border-strong)" }}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, color: "var(--text)" }}
            labelStyle={{ color: "var(--text-2)" }}
            itemStyle={{ color: "var(--text)" }}
          />
          <Line type="monotone" dataKey="energy" name="Energy" stroke="var(--series-energy)" strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
          <Line type="monotone" dataKey="focus" name="Focus" stroke="var(--series-focus)" strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
          <Line type="monotone" dataKey="motivation" name="Motivation" stroke="var(--series-motivation)" strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      {!any && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-text-3 pointer-events-none">
          Log energy, focus and motivation in a day&apos;s Mindset section to see trends.
        </div>
      )}
    </div>
  );
}
