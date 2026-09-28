import { withUser, readJson } from "@/lib/api";
import { saveMindset } from "@/app/actions/tasks";
import { mindsetInRange } from "@/lib/data";
import { addDays, todayInTimezone } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** GET /api/v1/mindset?days=30 */
export async function GET(req: Request) {
  return withUser(req, (user) => {
    const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days") ?? 30) || 30));
    const today = todayInTimezone(user.timezone);
    return Response.json({ mindset: mindsetInRange(user.id, addDays(today, -(days - 1)), today) });
  });
}

/** POST /api/v1/mindset — body: {"date"?: "YYYY-MM-DD", "energy"?: 1-10, "focus"?: 1-10, "motivation"?: 1-10, "note"?: "..."} */
export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson<{ date?: string; energy?: number; focus?: number; motivation?: number; note?: string }>(req);
    if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
    const r = await saveMindset(body.date ?? todayInTimezone(user.timezone), body);
    return r.ok ? Response.json({ ok: true }) : Response.json({ error: r.error }, { status: 400 });
  });
}
