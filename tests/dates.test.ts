import { describe, expect, it } from "vitest";
import { addDays, addMonths, daysBetween, endOfMonth, endOfWeek, startOfWeek, todayInTimezone, weekdayOf } from "@/lib/dates";

describe("dates", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("adds months clamping the day", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-11-15", 2)).toBe("2027-01-15");
  });
  it("computes week boundaries for Monday and Sunday starts", () => {
    // 2026-09-30 is a Wednesday
    expect(weekdayOf("2026-09-30")).toBe(3);
    expect(startOfWeek("2026-09-30", 1)).toBe("2026-09-28");
    expect(endOfWeek("2026-09-30", 1)).toBe("2026-10-04");
    expect(startOfWeek("2026-09-30", 0)).toBe("2026-09-27");
  });
  it("knows month ends including leap years", () => {
    expect(endOfMonth("2028-02-10")).toBe("2028-02-29");
    expect(endOfMonth("2026-02-10")).toBe("2026-02-28");
  });
  it("evaluates today in a timezone", () => {
    const at = new Date("2026-09-28T23:30:00Z");
    expect(todayInTimezone("UTC", at)).toBe("2026-09-28");
    expect(todayInTimezone("Australia/Sydney", at)).toBe("2026-09-29");
    expect(todayInTimezone("America/Los_Angeles", at)).toBe("2026-09-28");
    expect(todayInTimezone("Not/AZone", at)).toBe("2026-09-28");
  });
  it("counts days between", () => {
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
  });
});
