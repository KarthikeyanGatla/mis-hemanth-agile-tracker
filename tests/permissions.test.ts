import { describe, expect, it } from "vitest";
import { canManageBacklog, canManageProject, canManageSprints } from "@/lib/permissions";
import { projectSchema, registerSchema } from "@/lib/validation";

describe("permissions", () => {
  it("lets PO and SM manage the project, not developers", () => {
    expect(canManageProject("PRODUCT_OWNER")).toBe(true);
    expect(canManageProject("SCRUM_MASTER")).toBe(true);
    expect(canManageProject("DEVELOPER")).toBe(false);
    expect(canManageProject(null)).toBe(false);
  });
  it("restricts backlog ordering to the PO", () => {
    expect(canManageBacklog("PRODUCT_OWNER")).toBe(true);
    expect(canManageBacklog("SCRUM_MASTER")).toBe(false);
  });
  it("lets SM and PO manage sprints", () => {
    expect(canManageSprints("SCRUM_MASTER")).toBe(true);
    expect(canManageSprints("DEVELOPER")).toBe(false);
  });
});

describe("validation", () => {
  it("normalises project keys", () => {
    expect(projectSchema.parse({ key: " atlas ", name: "Atlas" }).key).toBe("ATLAS");
    expect(projectSchema.safeParse({ key: "1x", name: "Atlas" }).success).toBe(false);
  });
  it("rejects short passwords", () => {
    expect(
      registerSchema.safeParse({ name: "Al", email: "a@b.co", password: "short" }).success,
    ).toBe(false);
  });
});
