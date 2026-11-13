export const STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

/** Fields to write when an item moves between columns. Returns null if nothing changes. */
export function statusTransition(from: Status, to: Status, now = new Date()) {
  if (from === to) return null;
  return { status: to, completedAt: to === "DONE" ? now : null };
}
