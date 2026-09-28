import { withUser } from "@/lib/api";
import { getWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

/** GET /api/v1/weather — the forecast for the user's saved location. */
export async function GET(req: Request) {
  return withUser(req, async (user) => {
    if (user.latitude === null || user.longitude === null) return Response.json({ error: "No location set. Add one in Settings." }, { status: 404 });
    const report = await getWeather(user.latitude, user.longitude, user.units, user.timezone);
    return Response.json(report);
  });
}
