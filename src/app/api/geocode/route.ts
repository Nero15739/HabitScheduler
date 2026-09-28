import { resolveApiUser } from "@/lib/auth";
import { geocode } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await resolveApiUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    const results = await geocode(q);
    return Response.json({ results });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Geocoding failed" }, { status: 502 });
  }
}
