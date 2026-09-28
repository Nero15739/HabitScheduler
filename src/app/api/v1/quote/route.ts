import { withUser } from "@/lib/api";
import { todayInTimezone } from "@/lib/dates";
import { getDailyQuote, principleForDay } from "@/lib/quotes";

export const dynamic = "force-dynamic";

/** GET /api/v1/quote — today's quote and Atomic Habits principle. */
export async function GET(req: Request) {
  return withUser(req, async (user) => {
    const today = todayInTimezone(user.timezone);
    return Response.json({ date: today, quote: await getDailyQuote(today), principle: principleForDay(today) });
  });
}
