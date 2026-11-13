const DAY = 86_400_000;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function endOfDay(d: Date): Date {
  return new Date(startOfDay(d).getTime() + DAY - 1);
}
export function dayLabel(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** Each calendar day from start to end inclusive. */
export function sprintDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  for (let t = startOfDay(start).getTime(); t <= startOfDay(end).getTime(); t += DAY) {
    days.push(new Date(t));
  }
  return days;
}

export interface BurndownItem {
  storyPoints: number | null;
  completedAt: Date | null;
}
export interface BurndownPoint {
  day: string;
  ideal: number;
  /** null for days in the future */
  remaining: number | null;
}

export function burndownSeries(
  start: Date,
  end: Date,
  items: BurndownItem[],
  now = new Date(),
): BurndownPoint[] {
  const total = items.reduce((s, i) => s + (i.storyPoints ?? 0), 0);
  const days = sprintDays(start, end);
  const steps = Math.max(days.length - 1, 1);
  return days.map((d, idx) => {
    const ideal = Math.round(total * (1 - idx / steps) * 10) / 10;
    if (startOfDay(d) > now) return { day: dayLabel(d), ideal, remaining: null };
    const doneBy = endOfDay(d);
    const burned = items
      .filter((i) => i.completedAt && i.completedAt <= doneBy)
      .reduce((s, i) => s + (i.storyPoints ?? 0), 0);
    return { day: dayLabel(d), ideal, remaining: total - burned };
  });
}

export interface CfdItem {
  history: { toStatus: string; changedAt: Date }[];
}
export interface CfdPoint {
  day: string;
  TODO: number;
  IN_PROGRESS: number;
  REVIEW: number;
  DONE: number;
}

/** Items per column at end of each day, reconstructed from status history. */
export function cfdSeries(start: Date, end: Date, items: CfdItem[], now = new Date()): CfdPoint[] {
  return sprintDays(start, end)
    .filter((d) => startOfDay(d) <= now)
    .map((d) => {
      const point: CfdPoint = { day: dayLabel(d), TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
      const cutoff = endOfDay(d);
      for (const item of items) {
        const past = item.history
          .filter((h) => h.changedAt <= cutoff)
          .sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());
        // Items with no history yet are treated as still To Do.
        const status = (past.at(-1)?.toStatus ?? "TODO") as keyof Omit<CfdPoint, "day">;
        point[status]++;
      }
      return point;
    });
}

export interface VelocitySprint {
  name: string;
  committedPoints: number | null;
  completedPoints: number | null;
}

export function velocitySeries(sprints: VelocitySprint[]) {
  return sprints.map((s) => ({
    sprint: s.name,
    committed: s.committedPoints ?? 0,
    completed: s.completedPoints ?? 0,
  }));
}

export function averageVelocity(sprints: VelocitySprint[]): number {
  const done = sprints.filter((s) => s.completedPoints != null);
  if (!done.length) return 0;
  return (
    Math.round((done.reduce((s, x) => s + (x.completedPoints ?? 0), 0) / done.length) * 10) / 10
  );
}

/** CSV with RFC 4180 quoting; also neutralises spreadsheet formula injection. */
export function toCsv(rows: (string | number | null)[][]): string {
  const cell = (v: string | number | null) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s) && typeof v === "string") s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
