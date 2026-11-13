import { describe, expect, it } from "vitest";
import { averageVelocity, burndownSeries, cfdSeries, toCsv, velocitySeries } from "@/lib/reports";

const d = (s: string) => new Date(s + "T12:00:00");

describe("burndown", () => {
  const items = [
    { storyPoints: 5, completedAt: d("2026-03-03") },
    { storyPoints: 3, completedAt: null },
    { storyPoints: null, completedAt: null },
  ];
  const series = burndownSeries(d("2026-03-01"), d("2026-03-05"), items, d("2026-03-03"));
  it("starts at total and ideal reaches zero", () => {
    expect(series[0]).toMatchObject({ ideal: 8, remaining: 8 });
    expect(series.at(-1)?.ideal).toBe(0);
  });
  it("burns points on completion day and hides the future", () => {
    expect(series[1].remaining).toBe(8);
    expect(series[2].remaining).toBe(3);
    expect(series[3].remaining).toBeNull();
  });
});

describe("cfd", () => {
  it("reconstructs columns from history", () => {
    const items = [
      {
        history: [
          { toStatus: "TODO", changedAt: d("2026-03-01") },
          { toStatus: "DONE", changedAt: d("2026-03-02") },
        ],
      },
      { history: [] },
    ];
    const s = cfdSeries(d("2026-03-01"), d("2026-03-03"), items, d("2026-03-03"));
    expect(s[0]).toMatchObject({ TODO: 2, DONE: 0 });
    expect(s[1]).toMatchObject({ TODO: 1, DONE: 1 });
  });
});

describe("velocity", () => {
  const sprints = [
    { name: "S1", committedPoints: 20, completedPoints: 18 },
    { name: "S2", committedPoints: 25, completedPoints: 22 },
    { name: "S3", committedPoints: 30, completedPoints: null },
  ];
  it("averages only completed sprints", () => expect(averageVelocity(sprints)).toBe(20));
  it("maps series", () =>
    expect(velocitySeries(sprints)[0]).toEqual({ sprint: "S1", committed: 20, completed: 18 }));
});

describe("csv", () => {
  it("quotes and escapes formulas", () => {
    expect(toCsv([["a,b", 'say "hi"', "=SUM(A1)", 5, null]])).toBe(
      '"a,b","say ""hi""",\'=SUM(A1),5,\r\n',
    );
  });
});
