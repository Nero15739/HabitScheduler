import { withUser, readJson } from "@/lib/api";
import { listHabits } from "@/lib/data";
import { createHabit, type HabitInput } from "@/app/actions/habits";
import { parseHabitText } from "@/lib/nl-parse";

export const dynamic = "force-dynamic";

/** GET /api/v1/habits — list active habits. Add ?archived=1 to include archived. */
export async function GET(req: Request) {
  return withUser(req, (user) => {
    const includeArchived = new URL(req.url).searchParams.get("archived") === "1";
    return Response.json({ habits: listHabits(user.id, { includeArchived }) });
  });
}

/** POST /api/v1/habits — body: HabitInput, or {"text": "Read 10 pages every weekday at 9pm"} for natural language. */
export async function POST(req: Request) {
  return withUser(req, async () => {
    const body = await readJson<HabitInput & { text?: string }>(req);
    if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
    let input: HabitInput = body;
    if (body.text) {
      const parsed = parseHabitText(body.text);
      input = { ...parsed, ...body, name: body.name ?? parsed.name };
    }
    const res = await createHabit(input);
    if (!res.ok) return Response.json({ error: res.error }, { status: 400 });
    return Response.json({ id: res.data?.id }, { status: 201 });
  });
}
