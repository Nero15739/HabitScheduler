"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useClientValue } from "@/lib/use-client-value";
import { Copy, KeyRound, LocateFixed, LogOut, MapPin, Moon, Search, Shield, Sun, SunMoon, Trash2, User as UserIcon } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { changePassword, createToken, deleteAccount, deleteUser, revokeToken, setLocation, setRegistrationOpen, setUserRole, signOutEverywhere, updatePreferences } from "@/app/actions/settings";
import { Button, Card, Field, Input, Label, Segmented, Select, Textarea, Toggle, cn } from "@/components/ui";

type Props = {
  user: {
    id: string; name: string; email: string; role: "admin" | "member"; theme: "system" | "dark" | "light"; weekStart: 0 | 1; units: "metric" | "imperial";
    timezone: string; identityStatement: string | null; locationName: string | null; latitude: number | null; longitude: number | null;
  };
  tokens: { id: string; name: string; prefix: string; lastUsedAt: string | null; createdAt: string }[];
  members: { id: string; name: string; email: string; role: "admin" | "member"; createdAt: string }[];
  registrationOpen: boolean;
  registrationLockedByEnv: boolean;
  weatherProvider: string;
  quoteProvider: string;
  version: string;
};

const TZ_FALLBACK: string[] = [];
let TZ_CACHE: string[] | null = null;
/** Stable snapshot for useSyncExternalStore: computed once per page load. */
function browserTimezones(): string[] {
  if (TZ_CACHE) return TZ_CACHE;
  try {
    TZ_CACHE = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
  } catch {
    TZ_CACHE = [];
  }
  return TZ_CACHE;
}

declare global {
  interface Window { __hsSetTheme?: (t: string) => void }
}

export function SettingsView(p: Props) {
  const router = useRouter();
  const [, start] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);
  const flash = (m: string) => { setSaved(m); setTimeout(() => setSaved(null), 2000); };

  // Preferences
  const [theme, setTheme] = useState(p.user.theme);
  const [weekStart, setWeekStart] = useState<0 | 1>(p.user.weekStart);
  const [units, setUnits] = useState(p.user.units);
  const [timezone, setTimezone] = useState(p.user.timezone);
  const [name, setName] = useState(p.user.name);
  const [identity, setIdentity] = useState(p.user.identityStatement ?? "");
  const timezones = useClientValue(browserTimezones, TZ_FALLBACK);

  const tzOptions = useMemo(() => (timezones.includes(timezone) ? timezones : [timezone, ...timezones]), [timezones, timezone]);

  function applyTheme(t: "system" | "dark" | "light") {
    setTheme(t);
    window.__hsSetTheme?.(t);
    document.documentElement.setAttribute("data-theme-pref", t);
    start(async () => { await updatePreferences({ theme: t }); });
  }

  return (
    <div className="space-y-4 animate-fade-up max-w-4xl">
      {saved && <div className="fixed top-20 right-4 z-50 rounded-full bg-accent text-accent-fg px-4 h-10 inline-flex items-center text-sm font-bold shadow">{saved}</div>}

      {/* Appearance */}
      <Card>
        <Label className="mb-3">Appearance</Label>
        <div className="grid grid-cols-3 gap-2">
          {([["system", "System", SunMoon], ["dark", "Dark", Moon], ["light", "Light", Sun]] as const).map(([v, label, Icon]) => (
            <button key={v} onClick={() => applyTheme(v)} aria-pressed={theme === v} className={cn("h-16 rounded-2xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition", theme === v ? "border-accent bg-accent-soft text-text" : "border-border bg-surface-2 text-text-2 hover:border-accent")}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Profile & identity */}
      <Card id="identity">
        <Label className="mb-3 flex items-center gap-1.5"><UserIcon size={13} /> Profile</Label>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await updatePreferences({ name, identityStatement: identity, weekStart, units, timezone });
              flash(res.ok ? "Saved" : res.error);
              router.refresh();
            });
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
            <Field label="Email"><Input value={p.user.email} disabled className="opacity-60" /></Field>
          </div>
          <Field label="Identity statement" hint="Who are you becoming? Shown at the top of Today. e.g. “I am a calm, consistent person who keeps promises to myself.”">
            <Textarea value={identity} onChange={(e) => setIdentity(e.target.value)} maxLength={240} placeholder="I am the kind of person who…" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <span className="label">Week starts on</span>
              <Segmented size="lg" value={String(weekStart) as "0" | "1"} onChange={(v) => setWeekStart(Number(v) as 0 | 1)} options={[{ value: "1", label: "Monday" }, { value: "0", label: "Sunday" }]} />
            </div>
            <div className="space-y-1.5">
              <span className="label">Units</span>
              <Segmented size="lg" value={units} onChange={setUnits} options={[{ value: "metric", label: "°C · km/h" }, { value: "imperial", label: "°F · mph" }]} />
            </div>
            <Field label="Timezone">
              <Select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full">
                {tzOptions.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end"><Button type="submit">Save profile</Button></div>
        </form>
      </Card>

      {/* Location */}
      <LocationCard user={p.user} weatherProvider={p.weatherProvider} onChanged={() => { router.refresh(); flash("Location saved"); }} />

      {/* API tokens */}
      <TokensCard tokens={p.tokens} onChanged={() => router.refresh()} />

      {/* Data */}
      <Card>
        <Label className="mb-2">Your data</Label>
        <p className="text-sm text-text-2 mb-3">Everything lives in a single SQLite file on your server. Export a JSON snapshot any time.</p>
        <div className="flex flex-wrap gap-2">
          <a href="/api/export" className="inline-flex items-center h-10 px-4 rounded-full bg-surface-2 border border-border text-sm font-semibold hover:bg-surface-3">Download JSON export</a>
          <a href="/api/export?format=csv" className="inline-flex items-center h-10 px-4 rounded-full bg-surface-2 border border-border text-sm font-semibold hover:bg-surface-3">Download habit log CSV</a>
        </div>
      </Card>

      {/* Security */}
      <SecurityCard onFlash={flash} onDeleted={() => router.push("/login")} />

      {/* Admin */}
      {p.user.role === "admin" && (
        <Card>
          <Label className="mb-3 flex items-center gap-1.5"><Shield size={13} /> Instance admin</Label>
          <div className="flex items-center justify-between gap-3 py-2">
            <div>
              <div className="font-semibold text-sm">Open registration</div>
              <div className="text-xs text-text-3">{p.registrationLockedByEnv ? "Locked closed by ALLOW_REGISTRATION=false in the environment." : "Allow anyone who can reach this server to create an account."}</div>
            </div>
            <Toggle checked={p.registrationOpen} label="Open registration" onChange={(v) => { if (p.registrationLockedByEnv) return; start(async () => { await setRegistrationOpen(v); router.refresh(); }); }} />
          </div>
          <div className="mt-3 divide-y divide-border">
            {p.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{m.name} {m.id === p.user.id && <span className="text-text-3 font-normal">(you)</span>}</div>
                  <div className="text-xs text-text-3 truncate">{m.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={m.role} disabled={m.id === p.user.id} onChange={(e) => start(async () => { await setUserRole(m.id, e.target.value as "admin" | "member"); router.refresh(); })} className="h-9 text-xs">
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </Select>
                  {m.id !== p.user.id && (
                    <Button size="sm" variant="danger" onClick={() => { if (confirm(`Delete ${m.email} and all their data?`)) start(async () => { await deleteUser(m.id); router.refresh(); }); }} aria-label="Delete user"><Trash2 size={14} /></Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-text-3">
          HabitScheduler v{p.version} · weather: {p.weatherProvider} · quotes: {p.quoteProvider} · timezone {p.user.timezone}
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" size="sm"><LogOut size={15} /> Sign out</Button>
        </form>
      </Card>
    </div>
  );
}

function LocationCard({ user, weatherProvider, onChanged }: { user: Props["user"]; weatherProvider: string; onChanged: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ name: string; country: string | null; admin1: string | null; latitude: number; longitude: number; timezone: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results ?? []);
      if (!data.results?.length) setError("No places found.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function useDevice() {
    if (!navigator.geolocation) return setError("Geolocation isn't available in this browser.");
    navigator.geolocation.getCurrentPosition(
      (pos) => start(async () => {
        await setLocation({ name: "My location", latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        onChanged();
      }),
      () => setError("Couldn't read your location. Search for a place instead."),
      { timeout: 8000 },
    );
  }

  return (
    <Card id="location">
      <Label className="mb-2 flex items-center gap-1.5"><MapPin size={13} /> Location & weather</Label>
      <p className="text-sm text-text-2 mb-3">Used only to fetch your local forecast from Open-Meteo{weatherProvider === "mock" && " (currently in mock mode)"}. Coordinates are stored on your server and never shared elsewhere.</p>
      {user.locationName && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 border border-border px-4 py-3 mb-3">
          <div className="text-sm"><span className="font-semibold">{user.locationName}</span> <span className="text-text-3 tabular">({user.latitude?.toFixed(2)}, {user.longitude?.toFixed(2)})</span></div>
          <Button size="sm" variant="ghost" onClick={() => start(async () => { await setLocation(null); onChanged(); })}>Remove</Button>
        </div>
      )}
      <form onSubmit={search} className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a city or town" aria-label="Search location" />
        <Button type="submit" variant="secondary" aria-label="Search" disabled={searching || q.trim().length < 2}><Search size={16} /></Button>
        <Button type="button" variant="secondary" onClick={useDevice} aria-label="Use device location"><LocateFixed size={16} /></Button>
      </form>
      {error && <p className="text-sm text-danger mt-2">{error}</p>}
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-border rounded-2xl border border-border overflow-hidden">
          {results.map((r, i) => (
            <li key={i}>
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-2"
                onClick={() => start(async () => {
                  await setLocation({ name: [r.name, r.admin1, r.country].filter(Boolean).join(", "), latitude: r.latitude, longitude: r.longitude, timezone: r.timezone });
                  setResults([]);
                  setQ("");
                  onChanged();
                })}
              >
                <span className="font-semibold">{r.name}</span> <span className="text-text-3">{[r.admin1, r.country].filter(Boolean).join(", ")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TokensCard({ tokens, onChanged }: { tokens: Props["tokens"]; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [, start] = useTransition();
  return (
    <Card>
      <Label className="mb-2 flex items-center gap-1.5"><KeyRound size={13} /> API tokens</Label>
      <p className="text-sm text-text-2 mb-3">
        Personal tokens for scripts, iOS Shortcuts or Home Assistant. Send <code className="text-xs bg-surface-2 px-1 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code> to <code className="text-xs bg-surface-2 px-1 py-0.5 rounded">/api/v1/…</code>. See the README for endpoints.
      </p>
      {fresh && (
        <div className="rounded-2xl border border-accent/40 bg-accent-soft p-3 mb-3">
          <div className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Copy it now, it won&apos;t be shown again</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm break-all">{fresh}</code>
            <Button size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(fresh)}><Copy size={14} /></Button>
          </div>
        </div>
      )}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const res = await createToken(name || "Token"); if (res.ok && res.data) setFresh(res.data.token); setName(""); onChanged(); }); }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Token name (e.g. iPhone shortcut)" />
        <Button type="submit" variant="secondary">Create</Button>
      </form>
      {tokens.length > 0 && (
        <ul className="mt-3 divide-y divide-border">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2 text-sm">
              <div><span className="font-semibold">{t.name}</span> <span className="text-text-3 text-xs tabular">{t.prefix}… · {t.lastUsedAt ? `used ${t.lastUsedAt.slice(0, 10)}` : "never used"}</span></div>
              <Button size="sm" variant="ghost" onClick={() => start(async () => { await revokeToken(t.id); onChanged(); })}>Revoke</Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SecurityCard({ onFlash, onDeleted }: { onFlash: (m: string) => void; onDeleted: () => void }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [del, setDel] = useState("");
  const [showDel, setShowDel] = useState(false);
  const [, start] = useTransition();
  return (
    <Card>
      <Label className="mb-3">Security</Label>
      <form className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await changePassword(cur, next); onFlash(r.ok ? "Password changed" : r.error); if (r.ok) { setCur(""); setNext(""); } }); }}>
        <Field label="Current password"><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required /></Field>
        <Field label="New password"><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required /></Field>
        <Button type="submit" variant="secondary">Change</Button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => start(async () => { await signOutEverywhere(); onDeleted(); })}>Sign out of all devices</Button>
        <Button variant="ghost" size="sm" className="text-danger" onClick={() => setShowDel((s) => !s)}>Delete my account</Button>
      </div>
      {showDel && (
        <form className="mt-3 flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await deleteAccount(del); if (r.ok) onDeleted(); else onFlash(r.error); }); }}>
          <Field label="Confirm with your password"><Input type="password" value={del} onChange={(e) => setDel(e.target.value)} required /></Field>
          <Button type="submit" variant="danger">Delete everything</Button>
        </form>
      )}
    </Card>
  );
}
