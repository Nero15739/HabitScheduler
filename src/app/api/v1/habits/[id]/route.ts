import { withUser, readJson } from "@/lib/api";
import { getHabit, logsInRange } from "@/lib/data";
import { archiveHabit, deleteHabit, updateHabit, type HabitInput } from "@/app/actions/habits";
import { addDays, todayInTimezone } from "@/lib/dates";
import { bestStreak, completionRate, currentStreak, indexLogs } from "@/lib/habit-stats";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/v1/habits/:id — habit with stats and the last 365 days of completions. */
export async function GET(req: Request, ctx: Ctx) {
  return withUser(req, async (user) => {
    const { id } = await ctx.params;
    const habit = getHabit(user.id, id);
    if (!habit) return Response.json({ error: "Not found" }, { status: 404 });
    const today = todayInTimezone(user.timezone);
    const idx = indexLogs(logsInRange(user.id, addDays(today, -764), today, [id]));
    const done = idx.get(id) ?? new Set<string>();
    const r30 = completionRate(habit, done, addDays(today, -29), today, user.weekStart);
    return Response.json({
      habit,
      stats: { rate30: r30 === null ? null : Math.round(r30 * 100), streak: currentStreak(habit, done, today, user.weekStart), best: bestStreak(habit, done, today, user.weekStart), total: done.size },
      completions: [...done].filter((d) => d >= addDays(today, -364)).sort(),
    });
  });
}

/** PATCH /api/v1/habits/:id — body: full HabitInput (same as create) or {"archived": true|false}. */
export async function PATCH(req: Request, ctx: Ctx) {
  return withUser(req, async (user) => {
    const { id } = await ctx.params;
    const body = await readJson<Partial<HabitInput> & { archived?: boolean }>(req);
    if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
    if (typeof body.archived === "boolean" && Object.keys(body).length === 1) {
      const r = await archiveHabit(id, body.archived);
      return r.ok ? Response.json({ ok: true }) : Response.json({ error: r.error }, { status: 400 });
    }
    const existing = getHabit(user.id, id);
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    const merged: HabitInput = {
      name: existing.name,
      emoji: existing.emoji,
      color: existing.color,
      kind: existing.kind,
      frequency: existing.frequency,
      daysOfWeek: JSON.parse(existing.daysOfWeek),
      timesPerPeriod: existing.timesPerPeriod,
      identity: existing.identity,
      cueTime: existing.cueTime,
      cueLocation: existing.cueLocation,
      stackAfter: existing.stackAfter,
      twoMinuteVersion: existing.twoMinuteVersion,
      reward: existing.reward,
      notes: existing.notes,
      startDate: existing.startDate,
      ...body,
    };
    const r = await updateHabit(id, merged);
    return r.ok ? Response.json({ ok: true }) : Response.json({ error: r.error }, { status: 400 });
  });
}

/** DELETE /api/v1/habits/:id */
export async function DELETE(req: Request, ctx: Ctx) {
  return withUser(req, async () => {
    const { id } = await ctx.params;
    await deleteHabit(id);
    return Response.json({ ok: true });
  });
}
