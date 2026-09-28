import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { apiTokens, users } from "@/db/schema";
import { registrationOpen, requireUser } from "@/lib/auth";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const db = getDb();
  const tokens = db.select().from(apiTokens).where(eq(apiTokens.userId, user.id)).orderBy(asc(apiTokens.createdAt)).all();
  const members =
    user.role === "admin"
      ? db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users).orderBy(asc(users.createdAt)).all()
      : [];
  return (
    <SettingsView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        theme: user.theme,
        weekStart: user.weekStart as 0 | 1,
        units: user.units,
        timezone: user.timezone,
        identityStatement: user.identityStatement,
        locationName: user.locationName,
        latitude: user.latitude,
        longitude: user.longitude,
      }}
      tokens={tokens.map((t) => ({ id: t.id, name: t.name, prefix: t.prefix, lastUsedAt: t.lastUsedAt, createdAt: t.createdAt }))}
      members={members}
      registrationOpen={registrationOpen()}
      registrationLockedByEnv={process.env.ALLOW_REGISTRATION === "false"}
      weatherProvider={process.env.WEATHER_PROVIDER === "mock" ? "mock" : "open-meteo"}
      quoteProvider={process.env.QUOTE_PROVIDER ?? "zenquotes"}
      version={process.env.APP_VERSION ?? "1.0.0"}
    />
  );
}
