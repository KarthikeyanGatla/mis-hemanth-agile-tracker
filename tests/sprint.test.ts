import { describe, expect, it } from "vitest";
import { canStartSprint, completedPoints, totalPoints, validateSprint } from "@/lib/sprint";

const d = (s: string) => new Date(s);

describe("sprint rules", () => {
  it("validates dates", () => {
    const ok = { name: "S1", goal: "", startDate: d("2026-01-01"), endDate: d("2026-01-14") };
    expect(validateSprint(ok)).toBeNull();
    expect(validateSprint({ ...ok, endDate: d("2026-01-01") })).toMatch(/after/);
    expect(validateSprint({ ...ok, name: " " })).toMatch(/name/);
    expect(validateSprint({ ...ok, startDate: d("nope") })).toMatch(/Invalid/);
  });
  it("allows only one active sprint", () => {
    expect(canStartSprint("PLANNED", 0)).toBeNull();
    expect(canStartSprint("PLANNED", 1)).toMatch(/already active/);
    expect(canStartSprint("COMPLETED", 0)).toMatch(/planned/);
  });
  it("sums points, ignoring unestimated", () => {
    const items = [
      { storyPoints: 5, status: "DONE" },
      { storyPoints: null, status: "DONE" },
      { storyPoints: 3, status: "TODO" },
    ];
    expect(totalPoints(items)).toBe(8);
    expect(completedPoints(items)).toBe(5);
  });
});

import { sprintHealth } from "@/lib/sprint";

describe("sprintHealth", () => {
  const start = d("2026-03-01");
  const end = d("2026-03-11");
  const mid = d("2026-03-06");
  it("is on track when done matches the plan", () => {
    expect(sprintHealth(5, 10, start, end, mid)).toBe("ON_TRACK");
    expect(sprintHealth(9, 10, start, end, mid)).toBe("ON_TRACK");
  });
  it("flags at risk and behind", () => {
    expect(sprintHealth(3, 10, start, end, mid)).toBe("AT_RISK");
    expect(sprintHealth(1, 10, start, end, mid)).toBe("BEHIND");
  });
  it("handles empty sprints", () => expect(sprintHealth(0, 0, start, end, mid)).toBe("NO_DATA"));
});
