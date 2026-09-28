import { resolveApiUser } from "@/lib/auth";
import type { User } from "@/db/schema";

export async function withUser(req: Request, fn: (user: User) => Promise<Response> | Response): Promise<Response> {
  const user = await resolveApiUser(req);
  if (!user) return Response.json({ error: "Unauthorized. Send a session cookie or 'Authorization: Bearer <token>'." }, { status: 401 });
  try {
    return await fn(user);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
