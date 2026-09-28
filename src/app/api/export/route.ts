import { resolveApiUser } from "@/lib/auth";
import { allLogs, listGoals, listHabits, mindsetInRange, tasksInRange } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await resolveApiUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const format = new URL(req.url).searchParams.get("format");
  const habits = listHabits(user.id, { includeArchived: true });
  const logs = allLogs(user.id);
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const names = new Map(habits.map((h) => [h.id, h.name]));
    const lines = ["date,habit,status,note"];
    for (const l of logs.sort((a, b) => a.date.localeCompare(b.date))) {
      const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
      lines.push([l.date, esc(names.get(l.habitId) ?? l.habitId), l.status, esc(l.note ?? "")].join(","));
    }
    return new Response(lines.join("\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="habit-log-${stamp}.csv"` },
    });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    app: "HabitScheduler",
    version: 1,
    user: { email: user.email, name: user.name, timezone: user.timezone, weekStart: user.weekStart, units: user.units, identityStatement: user.identityStatement },
    habits,
    habitLogs: logs,
    tasks: tasksInRange(user.id, "0000-01-01", "9999-12-31"),
    mindset: mindsetInRange(user.id, "0000-01-01", "9999-12-31"),
    goals: listGoals(user.id, { includeArchived: true }),
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="habitscheduler-export-${stamp}.json"` },
  });
}
