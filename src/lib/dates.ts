/**
 * Date helpers that operate on ISO day strings (YYYY-MM-DD) so that
 * "today" is always evaluated in the user's timezone and arithmetic is
 * independent of the server's clock settings.
 */

export type ISODate = string;

export function isValidISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

export function todayInTimezone(timezone: string, now: Date = new Date()): ISODate {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(now); // en-CA yields YYYY-MM-DD
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function toUTCDate(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function fromUTCDate(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = toUTCDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUTCDate(d);
}

export function addMonths(iso: ISODate, n: number): ISODate {
  const d = toUTCDate(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = daysInMonth(d.getUTCFullYear(), d.getUTCMonth() + 1);
  d.setUTCDate(Math.min(day, last));
  return fromUTCDate(d);
}

/** 0 = Sunday ... 6 = Saturday */
export function weekdayOf(iso: ISODate): number {
  return toUTCDate(iso).getUTCDay();
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUTCDate(b).getTime() - toUTCDate(a).getTime()) / 86_400_000);
}

export function compareISO(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function startOfWeek(iso: ISODate, weekStart: number): ISODate {
  const wd = weekdayOf(iso);
  const diff = (wd - weekStart + 7) % 7;
  return addDays(iso, -diff);
}

export function endOfWeek(iso: ISODate, weekStart: number): ISODate {
  return addDays(startOfWeek(iso, weekStart), 6);
}

export function startOfMonth(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(iso: ISODate): ISODate {
  const [y, m] = iso.split("-").map(Number);
  return `${iso.slice(0, 7)}-${String(daysInMonth(y, m)).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  let cur = from;
  let guard = 0;
  while (cur <= to && guard++ < 4000) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function monthKey(iso: ISODate): string {
  return iso.slice(0, 7);
}

/** Returns week buckets (start dates) that intersect [from, to]. */
export function eachWeek(from: ISODate, to: ISODate, weekStart: number): ISODate[] {
  const out: ISODate[] = [];
  let cur = startOfWeek(from, weekStart);
  let guard = 0;
  while (cur <= to && guard++ < 600) {
    out.push(cur);
    cur = addDays(cur, 7);
  }
  return out;
}

export function eachMonth(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  let cur = startOfMonth(from);
  let guard = 0;
  while (cur <= to && guard++ < 240) {
    out.push(cur);
    cur = addMonths(cur, 1);
  }
  return out;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function weekdayShort(iso: ISODate): string {
  return WEEKDAY_SHORT[weekdayOf(iso)];
}
export function weekdayLong(iso: ISODate): string {
  return WEEKDAY_LONG[weekdayOf(iso)];
}
export function weekdayName(index: number, long = false): string {
  return (long ? WEEKDAY_LONG : WEEKDAY_SHORT)[((index % 7) + 7) % 7];
}
export function monthName(iso: ISODate, long = true): string {
  const m = Number(iso.slice(5, 7)) - 1;
  return (long ? MONTH_LONG : MONTH_SHORT)[m];
}

/** "4 Sep" */
export function formatDayMonth(iso: ISODate): string {
  return `${Number(iso.slice(8, 10))} ${monthName(iso, false)}`;
}
/** "30 Aug – 05 Sept 2026" style range */
export function formatRange(from: ISODate, to: ISODate): string {
  const y = to.slice(0, 4);
  return `${Number(from.slice(8, 10))} ${monthName(from, false)} – ${Number(to.slice(8, 10))} ${monthName(to, false)} ${y}`;
}
/** "Monday, 28 September" */
export function formatLong(iso: ISODate): string {
  return `${weekdayLong(iso)}, ${Number(iso.slice(8, 10))} ${monthName(iso)}`;
}
/** "30/08/2026" */
export function formatNumeric(iso: ISODate): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

export function formatTime12(hhmm: string | null | undefined): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

export function nowTimeInTimezone(timezone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
  } catch {
    return now.toISOString().slice(11, 16);
  }
}

export function greetingFor(hhmm: string): string {
  const h = Number(hhmm.slice(0, 2));
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Winding down";
}

export function dayOfYear(iso: ISODate): number {
  return daysBetween(`${iso.slice(0, 4)}-01-01`, iso) + 1;
}
