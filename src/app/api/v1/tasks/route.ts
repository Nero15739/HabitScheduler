import { withUser, readJson } from "@/lib/api";
import { tasksInRange } from "@/lib/data";
import { addTask, deleteTask, toggleTask } from "@/app/actions/tasks";
import { isValidISODate, todayInTimezone } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** GET /api/v1/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD (defaults to today). */
export async function GET(req: Request) {
  return withUser(req, (user) => {
    const sp = new URL(req.url).searchParams;
    const today = todayInTimezone(user.timezone);
    const from = sp.get("from") ?? today;
    const to = sp.get("to") ?? from;
    if (!isValidISODate(from) || !isValidISODate(to)) return Response.json({ error: "Bad date" }, { status: 400 });
    return Response.json({ tasks: tasksInRange(user.id, from, to) });
  });
}

/** POST /api/v1/tasks — body: {"title": "...", "date"?: "YYYY-MM-DD"} */
export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson<{ title?: string; date?: string }>(req);
    if (!body?.title) return Response.json({ error: "title required" }, { status: 400 });
    const r = await addTask(body.title, body.date ?? todayInTimezone(user.timezone));
    return r.ok ? Response.json({ id: r.data?.id }, { status: 201 }) : Response.json({ error: r.error }, { status: 400 });
  });
}

/** PATCH /api/v1/tasks — body: {"id": "...", "done": true} */
export async function PATCH(req: Request) {
  return withUser(req, async () => {
    const body = await readJson<{ id?: string; done?: boolean }>(req);
    if (!body?.id || typeof body.done !== "boolean") return Response.json({ error: "id and done required" }, { status: 400 });
    const r = await toggleTask(body.id, body.done);
    return r.ok ? Response.json({ ok: true }) : Response.json({ error: r.error }, { status: 400 });
  });
}

/** DELETE /api/v1/tasks?id=... */
export async function DELETE(req: Request) {
  return withUser(req, async () => {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    await deleteTask(id);
    return Response.json({ ok: true });
  });
}
