import { describe, expect, it } from "vitest";
import { parseHabitText } from "@/lib/nl-parse";

describe("parseHabitText", () => {
  it("parses weekday schedule, time and habit stack", () => {
    const p = parseHabitText("Read 10 pages every weekday at 9pm after I get into bed");
    expect(p.name).toBe("Read 10 pages");
    expect(p.frequency).toBe("daily");
    expect(p.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
    expect(p.cueTime).toBe("21:00");
    expect(p.stackAfter).toBe("get into bed");
  });
  it("parses N times a week", () => {
    const p = parseHabitText("Gym 3 times a week");
    expect(p.frequency).toBe("weekly");
    expect(p.timesPerPeriod).toBe(3);
    expect(p.name).toBe("Gym");
  });
  it("parses specific days and 24h time", () => {
    const p = parseHabitText("Call mum every mon, wed and fri at 18:30");
    expect(p.daysOfWeek).toEqual([1, 3, 5]);
    expect(p.cueTime).toBe("18:30");
    expect(p.name).toBe("Call mum");
  });
  it("detects break habits and monthly cadence", () => {
    expect(parseHabitText("No social media every day").kind).toBe("break");
    expect(parseHabitText("Review budget once a month").frequency).toBe("monthly");
    expect(parseHabitText("Deep clean twice a month").timesPerPeriod).toBe(2);
  });
  it("parses a location", () => {
    const p = parseHabitText("Meditate in the living room every morning at 6:30am");
    expect(p.cueLocation).toBe("the living room");
    expect(p.cueTime).toBe("06:30");
  });
});
