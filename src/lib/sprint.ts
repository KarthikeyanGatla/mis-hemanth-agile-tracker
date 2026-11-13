export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export interface SprintInput {
  name: string;
  goal: string;
  startDate: Date;
  endDate: Date;
}

/** Validates sprint dates and name. Returns an error message or null. */
export function validateSprint(s: SprintInput): string | null {
  if (!s.name.trim()) return "Sprint name is required";
  if (Number.isNaN(s.startDate.getTime()) || Number.isNaN(s.endDate.getTime()))
    return "Invalid dates";
  if (s.endDate <= s.startDate) return "End date must be after start date";
  return null;
}

/** A sprint can only start if it is planned and no other sprint is active. */
export function canStartSprint(status: SprintStatus, activeCount: number): string | null {
  if (status !== "PLANNED") return "Only planned sprints can be started";
  if (activeCount > 0) return "Another sprint is already active";
  return null;
}

/** Sum of story points, treating unestimated items as 0. */
export function totalPoints(items: { storyPoints: number | null }[]): number {
  return items.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
}

/** Points in DONE items. */
export function completedPoints(items: { storyPoints: number | null; status: string }[]): number {
  return totalPoints(items.filter((i) => i.status === "DONE"));
}
