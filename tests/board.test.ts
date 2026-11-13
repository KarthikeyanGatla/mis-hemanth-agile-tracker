import { describe, expect, it } from "vitest";
import { isStatus, statusTransition } from "@/lib/board";

describe("board transitions", () => {
  const now = new Date("2026-01-01");
  it("sets completedAt only when moving to DONE", () => {
    expect(statusTransition("REVIEW", "DONE", now)).toEqual({ status: "DONE", completedAt: now });
    expect(statusTransition("DONE", "IN_PROGRESS", now)).toEqual({
      status: "IN_PROGRESS",
      completedAt: null,
    });
  });
  it("is a no-op for the same column", () => {
    expect(statusTransition("TODO", "TODO")).toBeNull();
  });
  it("validates statuses", () => {
    expect(isStatus("REVIEW")).toBe(true);
    expect(isStatus("nope")).toBe(false);
  });
});
