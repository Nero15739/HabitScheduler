import { withUser, readJson } from "@/lib/api";
import { setHabitLog } from "@/app/actions/habits";
import { todayInTimezone } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/v1/habits/:id/log — body: {"date"?: "YYYY-MM-DD", "done"?: true, "note"?: "..."}. Defaults to today, done. */
export async function POST(req: Request, ctx: Ctx) {
  return withUser(req, async (user) => {
    const { id } = await ctx.params;
    const body = (await readJson<{ date?: string; done?: boolean; note?: string }>(req)) ?? {};
    const date = body.date ?? todayInTimezone(user.timezone);
    const r = await setHabitLog(id, date, body.done ?? true, body.note);
    return r.ok ? Response.json({ ok: true, date, done: r.data?.done }) : Response.json({ error: r.error }, { status: 400 });
  });
}

/** DELETE /api/v1/habits/:id/log?date=YYYY-MM-DD — remove a completion (defaults to today). */
export async function DELETE(req: Request, ctx: Ctx) {
  return withUser(req, async (user) => {
    const { id } = await ctx.params;
    const date = new URL(req.url).searchParams.get("date") ?? todayInTimezone(user.timezone);
    const r = await setHabitLog(id, date, false);
    return r.ok ? Response.json({ ok: true, date, done: false }) : Response.json({ error: r.error }, { status: 400 });
  });
}
