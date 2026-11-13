export type ProjectRole = "PRODUCT_OWNER" | "SCRUM_MASTER" | "DEVELOPER";

export const ROLE_LABELS: Record<ProjectRole, string> = {
  PRODUCT_OWNER: "Product Owner",
  SCRUM_MASTER: "Scrum Master",
  DEVELOPER: "Developer",
};

/** Who may add/remove members and edit project settings. */
export function canManageProject(role: ProjectRole | null | undefined): boolean {
  return role === "PRODUCT_OWNER" || role === "SCRUM_MASTER";
}

/** Who may reorder the backlog and set priorities. */
export function canManageBacklog(role: ProjectRole | null | undefined): boolean {
  return role === "PRODUCT_OWNER";
}

/** Who may create/start/complete sprints. */
export function canManageSprints(role: ProjectRole | null | undefined): boolean {
  return role === "SCRUM_MASTER" || role === "PRODUCT_OWNER";
}
