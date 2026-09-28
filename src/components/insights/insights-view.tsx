"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Flame, Medal } from "lucide-react";
import { Bar, Card, Label, Segmented, Select, StatTile, cn } from "@/components/ui";
import { colorVar } from "@/lib/colors";
import { weekdayName } from "@/lib/dates";
import { CompletionChart } from "./completion-chart";

type Row = { id: string; name: string; emoji: string | null; color: string; pct: number | null; streak: number; best: number };

type Props = {
  today: string;
  range: "7" | "30" | "90" | "365";
  selectedHabit: string | null;
  habits: { id: string; name: string; emoji: string | null }[];
  series: { date: string; pct: number | null }[];
  avg: number | null;
  thisWeek: number | null;
  lastWeek: number | null;
  bestStreak: number;
  needsAttention: { name: string; pct: number | null } | null;
  leaderboard: Row[];
  lb: "d" | "w" | "m";
  topStreaks: Row[];
  weekdayPerf: { weekday: number; pct: number | null }[];
  totals: { reps: number; perfectDays: number; habits: number; scheduledToday: number };
  goals: { done: number; total: number };
  tasksPct: number | null;
};

export function InsightsView(p: Props) {
  const router = useRouter();
  const q = (patch: Partial<{ h: string | null; r: string; lb: string }>) => {
    const params = new URLSearchParams();
    const h = patch.h === undefined ? p.selectedHabit : patch.h;
    const r = patch.r ?? p.range;
    const lb = patch.lb ?? p.lb;
    if (h) params.set("h", h);
    if (r !== "7") params.set("r", r);
    if (lb !== "d") params.set("lb", lb);
    router.push(`/insights${params.size ? `?${params}` : ""}`);
  };
  const delta = p.thisWeek !== null && p.lastWeek !== null ? p.thisWeek - p.lastWeek : null;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Big chart */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <Label>{p.range === "7" ? "Last 7 days" : p.range === "30" ? "Last 30 days" : p.range === "90" ? "Last 90 days" : "Last year"} · avg</Label>
            <div className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular mt-1">{p.avg === null ? "–" : `${p.avg}%`}</div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={p.selectedHabit ?? ""} onChange={(e) => q({ h: e.target.value || null })} aria-label="Habit filter" className="h-10 text-sm max-w-[200px]">
              <option value="">All habits</option>
              {p.habits.map((h) => (
                <option key={h.id} value={h.id}>{h.emoji ? `${h.emoji} ` : ""}{h.name}</option>
              ))}
            </Select>
            <Select value={p.range} onChange={(e) => q({ r: e.target.value })} aria-label="Range" className="h-10 text-sm">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </Select>
          </div>
        </div>
        <div className="mt-4 h-[260px] sm:h-[320px]">
          <CompletionChart data={p.series} range={p.range} />
        </div>
      </Card>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="This week" value={p.thisWeek === null ? "–" : `${p.thisWeek}%`} />
        <StatTile label="vs last week" value={delta === null ? "–" : `${delta >= 0 ? "+" : ""}${delta}%`} accent={delta !== null && delta >= 0} sub={p.lastWeek !== null ? `last week ${p.lastWeek}%` : undefined} />
        <StatTile label="Best streak" value={<span className="inline-flex items-center gap-1"><Flame className="text-warning" size={24} />{p.bestStreak}</span>} />
        <StatTile label="Needs attention" value={<span className="text-lg sm:text-xl truncate max-w-full">{p.needsAttention?.name ?? "–"}</span>} sub={p.needsAttention?.pct !== null && p.needsAttention ? `${p.needsAttention.pct}% ${p.lb === "d" ? "today" : p.lb === "w" ? "this week" : "this month"}` : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leaderboard */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <Label>Habit leaderboard</Label>
            <Segmented size="sm" value={p.lb} onChange={(v) => q({ lb: v })} options={[{ value: "d", label: "D" }, { value: "w", label: "W" }, { value: "m", label: "M" }]} />
          </div>
          {p.leaderboard.length === 0 ? (
            <p className="text-sm text-text-3">Add habits to see them ranked here.</p>
          ) : (
            <ul className="space-y-3.5">
              {p.leaderboard.map((h, i) => (
                <li key={h.id} className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm">{medals[i] ?? <span className="text-xs text-text-3 tabular">{i + 1}</span>}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <Link href={`/habits/${h.id}`} className="font-semibold truncate hover:underline">{h.emoji ? `${h.emoji} ` : ""}{h.name}</Link>
                      <span className="tabular font-bold text-accent ml-2">{h.pct === null ? "–" : `${h.pct}%`}</span>
                    </div>
                    <Bar value={h.pct ?? 0} color={colorVar(h.color)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Top streaks */}
        <Card>
          <Label className="mb-4">Top streaks</Label>
          {p.topStreaks.length === 0 ? (
            <p className="text-sm text-text-3">Complete a habit two days in a row to start a streak.</p>
          ) : (
            <ul className="space-y-3.5">
              {p.topStreaks.map((h, i) => (
                <li key={h.id} className="flex items-center gap-3">
                  <Medal size={18} className={cn(i === 0 ? "text-warning" : i === 1 ? "text-text-2" : "text-text-3")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-semibold truncate">{h.emoji ? `${h.emoji} ` : ""}{h.name}</span>
                      <span className="tabular font-bold text-accent ml-2">{h.streak}d</span>
                    </div>
                    <Bar value={h.best ? Math.min(100, (h.streak / Math.max(h.best, 7)) * 100) : 0} color={colorVar(h.color)} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            <Label className="mb-3">Best days (last 90 days)</Label>
            <div className="grid grid-cols-7 gap-1.5 items-end h-20">
              {p.weekdayPerf.map((w) => (
                <div key={w.weekday} className="flex flex-col items-center gap-1 h-full justify-end" title={w.pct === null ? "No data" : `${w.pct}%`}>
                  <span className="text-[10px] tabular text-text-3">{w.pct === null ? "" : `${w.pct}`}</span>
                  <div className="w-full rounded-t-md bg-accent/80" style={{ height: `${Math.max(4, w.pct ?? 0)}%`, opacity: w.pct === null ? 0.2 : 1 }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">{weekdayName(w.weekday).slice(0, 2)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between"><Label>Goals</Label><Link href="/goals" className="text-xs font-bold text-accent inline-flex items-center gap-1">Open <ArrowRight size={13} /></Link></div>
          <div className="text-2xl font-extrabold tabular mt-2">{p.goals.done} / {p.goals.total} <span className="text-sm text-text-3 font-semibold">completed</span></div>
        </Card>
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between"><Label>Tasks this week</Label><Link href="/tasks" className="text-xs font-bold text-accent inline-flex items-center gap-1">Open <ArrowRight size={13} /></Link></div>
          <div className="text-2xl font-extrabold tabular mt-2">{p.tasksPct === null ? "–" : `${p.tasksPct}%`}</div>
        </Card>
        <Card className="flex flex-col justify-between">
          <Label>Reps in range</Label>
          <div className="text-2xl font-extrabold tabular mt-2">{p.totals.reps}</div>
        </Card>
        <Card className="flex flex-col justify-between">
          <Label>Perfect days</Label>
          <div className="text-2xl font-extrabold tabular mt-2">{p.totals.perfectDays}</div>
        </Card>
      </div>
    </div>
  );
}
