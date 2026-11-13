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
