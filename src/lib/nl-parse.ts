/**
 * Lightweight natural-language habit parser (no external AI required).
 * "Read 10 pages every weekday at 7am after breakfast" ->
 *   { name: "Read 10 pages", frequency: "daily", daysOfWeek: [1..5], cueTime: "07:00", stackAfter: "breakfast" }
 */
export type ParsedHabit = {
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  daysOfWeek: number[];
  timesPerPeriod: number;
  cueTime: string | null;
  cueLocation: string | null;
  stackAfter: string | null;
  kind: "build" | "break";
};

const DAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2, wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6,
};
const NUM_WORDS: Record<string, number> = {
  once: 1, one: 1, twice: 2, two: 2, three: 3, thrice: 3, four: 4, five: 5, six: 6, seven: 7,
};

function clean(s: string): string {
  return s.replace(/\s+/g, " ").replace(/^[\s,.\-–]+|[\s,.\-–]+$/g, "").trim();
}

function toMinutesString(h: number, m: number, ampm?: string): string | null {
  if (ampm) {
    const p = ampm.toLowerCase().replace(/\./g, "");
    if (p.startsWith("p") && h < 12) h += 12;
    if (p.startsWith("a") && h === 12) h = 0;
  }
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseHabitText(input: string): ParsedHabit {
  let text = ` ${input.trim()} `;
  const result: ParsedHabit = {
    name: "",
    frequency: "daily",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    timesPerPeriod: 1,
    cueTime: null,
    cueLocation: null,
    stackAfter: null,
    kind: "build",
  };

  // Habit stacking: "after <anchor>"
  const stack = text.match(/\s(?:right )?after (?:i |my |the )?([a-z0-9 '\-]+?)(?=\s(?:every|each|daily|weekly|monthly|at|on|in)\b|\s*,|\s*$)/i);
  if (stack) {
    result.stackAfter = clean(stack[1]);
    text = text.replace(stack[0], " ");
  }

  // Time: "at 7am", "at 7:30 pm", "at 19:00", "@ 6"
  const time = text.match(/\s(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?(?=[\s,]|$)/i);
  if (time && (time[3] || time[2] || Number(time[1]) <= 24)) {
    const t = toMinutesString(Number(time[1]), Number(time[2] ?? 0), time[3]);
    if (t) {
      result.cueTime = t;
      text = text.replace(time[0], " ");
    }
  }

  // Location: "in the kitchen", "at the gym" (only if it's not a time)
  const loc = text.match(/\s(?:in|at) (the |my )?([a-z][a-z ]{2,30}?)(?=\s(?:every|each|daily|weekly|monthly|after|on)\b|\s*,|\s*$)/i);
  if (loc && !/^\d/.test(loc[2])) {
    result.cueLocation = clean(`${loc[1] ?? ""}${loc[2]}`);
    text = text.replace(loc[0], " ");
  }

  // Frequency: "N times a week", "twice a month", "3x per week"
  const times = text.match(/\s(\d+|once|twice|thrice|one|two|three|four|five|six|seven)\s*(?:x|times?)?\s*(?:a|per|each|every)\s+(day|week|month)/i);
  if (times) {
    const n = NUM_WORDS[times[1].toLowerCase()] ?? Number(times[1]);
    const unit = times[2].toLowerCase();
    if (unit === "week") {
      result.frequency = "weekly";
      result.timesPerPeriod = Math.max(1, n || 1);
    } else if (unit === "month") {
      result.frequency = "monthly";
      result.timesPerPeriod = Math.max(1, n || 1);
    }
    text = text.replace(times[0], " ");
  }

  // "every weekday", "on weekdays", "weekends", "every day", "daily", "weekly", "monthly"
  const weekday = text.match(/\s(?:every|on|each)?\s*(weekdays?|work ?days?)(?=[\s,]|$)/i);
  if (weekday) {
    result.frequency = "daily";
    result.daysOfWeek = [1, 2, 3, 4, 5];
    text = text.replace(weekday[0], " ");
  }
  const weekend = text.match(/\s(?:every|on|each)?\s*(weekends?)(?=[\s,]|$)/i);
  if (weekend) {
    result.frequency = "daily";
    result.daysOfWeek = [0, 6];
    text = text.replace(weekend[0], " ");
  }
  const everyDay = text.match(/\s(?:every ?day|each day|daily|everyday)(?=[\s,]|$)/i);
  if (everyDay) {
    result.frequency = "daily";
    text = text.replace(everyDay[0], " ");
  }
  const weekly = text.match(/\s(?:every week|each week|weekly|once a week)(?=[\s,]|$)/i);
  if (weekly && !times) {
    result.frequency = "weekly";
    text = text.replace(weekly[0], " ");
  }
  const monthly = text.match(/\s(?:every month|each month|monthly|once a month)(?=[\s,]|$)/i);
  if (monthly && !times) {
    result.frequency = "monthly";
    text = text.replace(monthly[0], " ");
  }

  // Specific days: "every mon, wed and fri", "on tuesdays"
  const dayList = text.match(
    /\s(?:every|on|each)\s+((?:(?:mon|tue|tues|wed|weds|thu|thur|thurs|fri|sat|sun)[a-z]*s?(?:\s*(?:,|and|&|\/)\s*)?)+)(?=[\s,]|$)/i,
  );
  if (dayList) {
    const found = new Set<number>();
    for (const tok of dayList[1].toLowerCase().split(/\s*(?:,|and|&|\/)\s*|\s+/)) {
      const key = tok.replace(/s$/, "");
      if (key in DAY_MAP) found.add(DAY_MAP[key]);
      else if (tok in DAY_MAP) found.add(DAY_MAP[tok]);
    }
    if (found.size) {
      result.frequency = "daily";
      result.daysOfWeek = [...found].sort((a, b) => a - b);
      text = text.replace(dayList[0], " ");
    }
  }

  // Break habits: "quit smoking", "no social media", "stop snacking"
  if (/^\s*(quit|stop|no|avoid|don'?t|never|skip)\b/i.test(text)) result.kind = "break";

  result.name = clean(text);
  if (!result.name) result.name = clean(input);
  result.name = result.name.charAt(0).toUpperCase() + result.name.slice(1);
  return result;
}
