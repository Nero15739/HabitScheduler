# HabitScheduler

A self-hosted dashboard for your habits, tasks and goals, built on the principles of *Atomic Habits*. Inspired by the look of Dashbit: dark surfaces, a mint accent, a month grid of check circles, a weekly task board with a mindset tracker, and an Insights page that shows you the trend.

- **Today** – your habits for the day sorted by cue time, a progress ring, tasks, a mindset check-in, the day's Atomic Habits principle and quote, and your local weather with nudges for outdoor habits.
- **Habits** – daily / weekly / monthly views, a month check-grid with trend sparkline, completion %, 🔥 current streak and ⭐ best streak per habit. Natural-language quick add ("Read 10 pages every weekday at 9pm after I get into bed"), templates, and the "make it stick" fields: identity, implementation intention (time + place), habit stack, two-minute version, reward.
- **Tasks** – a 7-day board with per-day completion rings, a weekly progress chart and an energy / focus / motivation tracker.
- **Goals** – outcomes linked to the habits that produce them, with milestones, target dates and identity statements.
- **Insights** – completion area chart with habit and range filters, this week vs last week, best streak, needs attention, habit leaderboard (D / W / M), top streaks, best weekdays, perfect days.
- **Settings** – light / dark / system theme, week start, units, timezone, location search (Open-Meteo geocoding or device GPS), personal API tokens, JSON / CSV export, password, admin controls (open registration, roles, delete users).

Works great on a phone: bottom tab bar, bottom-sheet forms, installable as a PWA.

## Atomic Habits, built in

| Principle | Where it shows up |
|---|---|
| Identity-based habits | Identity statement on Today, per-habit identity, per-goal identity |
| 1st law: make it obvious | Cue time + location ("I will X at Y in Z"), habit stacking ("After X, I will Y"), habits sorted by cue time |
| 2nd law: make it attractive | Templates, colors and emoji, weather nudges ("Clear skies, great day to get outside") |
| 3rd law: make it easy | Two-minute version, surfaced automatically when you missed yesterday |
| 4th law: make it satisfying | Streaks, rings, sparkline, leaderboard, "perfect days", rewards field |
| Never miss twice | Today warns when a habit has been missed two scheduled days in a row |
| Habit tracking & review | Month grid, 12-month heatmap, Insights, weekly review reminders in the daily principle |

## Quick start (Docker)

```bash
git clone https://github.com/Nero15739/HabitScheduler.git
cd HabitScheduler
docker compose up -d --build
```

Open <http://localhost:3000>, create the first account (it becomes the admin), and start adding habits. Data lives in the `habit-data` volume as a single SQLite file (`/data/habits.db`), so backups are just a file copy.

To lock sign-ups after you've created your account, either set `ALLOW_REGISTRATION=false` in `docker-compose.yml` / `.env`, or toggle **Open registration** in Settings → Instance admin.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port inside the container / for `npm start` |
| `DATABASE_PATH` | `./data/habits.db` (`/data/habits.db` in Docker) | SQLite file location |
| `APP_URL` | `http://localhost:3000` | Public URL. When it starts with `https://` cookies are marked `Secure` |
| `COOKIE_SECURE` | derived from `APP_URL` | Force `Secure` cookies on or off |
| `ALLOW_REGISTRATION` | `true` | `false` hard-closes sign-ups (admins can also toggle it in Settings) |
| `WEATHER_PROVIDER` | `open-meteo` | `mock` serves a fixture instead of calling the network |
| `QUOTE_PROVIDER` | `zenquotes` | `local` uses only the bundled quotes (no outbound requests) |
| `OPEN_METEO_BASE`, `OPEN_METEO_AIR_BASE`, `OPEN_METEO_GEO_BASE` | official hosts | Point at a self-hosted Open-Meteo instance |

### Behind a reverse proxy

Put Caddy / Traefik / nginx in front of port 3000 and set `APP_URL=https://habits.example.com`. Nothing else is required. The app never calls home; the only outbound requests are to Open-Meteo (weather, air quality, geocoding, no API key) and ZenQuotes (one request per day, falls back to bundled quotes). Both can be turned off with the env vars above for a fully offline instance.

## Running without Docker

Requires Node 22+.

```bash
npm install
npm run dev            # http://localhost:3000, SQLite at ./data/habits.db
npm run build && npm start   # production, standalone server
```

Migrations run automatically at startup (`src/instrumentation.ts`). To edit the schema, change `src/db/schema.ts` and run `npm run db:generate`.

## External data

- **Weather**: [Open-Meteo](https://open-meteo.com/) forecast + air-quality APIs. Today's card shows current conditions, feels-like, sunrise/sunset, rain chance, wind, UV and AQI plus a 7-day strip. Outdoor habits (run, walk, cycle, swim, garden…) get a nudge when rain, storms, high UV or poor air quality are forecast.
- **Quotes**: [ZenQuotes](https://zenquotes.io/) "today" endpoint, cached per day; a curated local list is the fallback. The Atomic Habits principle of the day is always local.

## REST API

Create a token in **Settings → API tokens** and send it as `Authorization: Bearer hs_…`. Handy for iOS Shortcuts, Home Assistant, or a widget.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/today` | Today's habits with done state, streaks, period progress; today's tasks |
| `GET` | `/api/v1/habits` | List habits (`?archived=1` includes archived) |
| `POST` | `/api/v1/habits` | Create. Body is a habit object, or `{"text": "Gym 3 times a week"}` for natural language |
| `GET` | `/api/v1/habits/:id` | Habit + stats + last 365 days of completions |
| `PATCH` | `/api/v1/habits/:id` | Partial update, or `{"archived": true}` |
| `DELETE` | `/api/v1/habits/:id` | Delete |
| `POST` | `/api/v1/habits/:id/log` | Mark done: `{"date"?: "YYYY-MM-DD", "done"?: true, "note"?: "…"}` |
| `DELETE` | `/api/v1/habits/:id/log?date=` | Undo a completion |
| `GET/POST/PATCH/DELETE` | `/api/v1/tasks` | Tasks by date range; create; `{"id","done"}`; `?id=` |
| `GET/POST` | `/api/v1/mindset` | Energy / focus / motivation logs |
| `GET` | `/api/v1/weather` | Forecast for your saved location |
| `GET` | `/api/v1/quote` | Today's quote and principle |
| `GET` | `/api/export` | Full JSON export (`?format=csv` for the habit log) |
| `GET` | `/api/health` | Liveness check |

Example, from a shell:

```bash
TOKEN=hs_xxx
curl -s -H "Authorization: Bearer $TOKEN" https://habits.example.com/api/v1/today | jq .
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"text":"Stretch every day at 7am after I make coffee"}' https://habits.example.com/api/v1/habits
```

## Development

```bash
npm run typecheck   # tsc
npm run lint        # eslint
npm test            # vitest unit tests (dates, streaks, NL parser)
npm run build && npm run test:e2e   # Playwright journey at desktop + mobile, screenshots in ./screenshots
```

If Playwright's browser download is unavailable, point it at an existing Chromium: `PW_CHROMIUM_PATH=/path/to/chrome npm run test:e2e`.

### Stack

Next.js 16 (App Router, server actions), React 19, TypeScript, Tailwind CSS 4, Drizzle ORM on better-sqlite3, Recharts, lucide-react, bcryptjs sessions. Single container, single file database, no external services required.

## Backup & restore

```bash
docker compose stop
docker run --rm -v habitscheduler_habit-data:/data -v "$PWD":/backup alpine cp /data/habits.db /backup/habits-backup.db
docker compose start
```

Restore by copying the file back into the volume. Or use **Settings → Download JSON export** for a portable snapshot.

## License

MIT
