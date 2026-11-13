"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/session";
import { canManageBacklog, canManageSprints } from "@/lib/permissions";
import { canStartSprint, validateSprint } from "@/lib/sprint";
import type { ItemType, Priority } from "@/generated/prisma/enums";
import { ItemType as ItemTypes, Priority as Priorities } from "@/generated/prisma/enums";

const refresh = (key: string) => revalidatePath(`/projects/${key}/backlog`);
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function createItem(key: string, formData: FormData) {
  const { project, user } = await requireProjectAccess(key);
  const title = str(formData, "title");
  const type = str(formData, "type") as ItemType;
  const priority = str(formData, "priority") as Priority;
  if (!title || !Object.values(ItemTypes).includes(type)) return;
  const points = Number.parseInt(str(formData, "points"), 10);
  const parentId = str(formData, "parentId") || null;

  await db.$transaction(async (tx) => {
    const agg = await tx.workItem.aggregate({
      where: { projectId: project.id },
      _max: { number: true, position: true },
    });
    await tx.workItem.create({
      data: {
        projectId: project.id,
        number: (agg._max.number ?? 0) + 1,
        position: (agg._max.position ?? 0) + 1,
        type,
        title,
        priority: Object.values(Priorities).includes(priority) ? priority : "MEDIUM",
        storyPoints: Number.isFinite(points) && points >= 0 && type !== "EPIC" ? points : null,
        parentId: type === "EPIC" ? null : parentId,
        reporterId: user.id,
      },
    });
  });
  refresh(key);
}

export async function moveItemToSprint(key: string, formData: FormData) {
  const { project, role, user } = await requireProjectAccess(key);
  if (!canManageSprints(role) && user.role !== "ADMIN") throw new Error("Forbidden");
  const itemId = str(formData, "itemId");
  const sprintId = str(formData, "sprintId") || null;
  if (sprintId) {
    const sprint = await db.sprint.findFirst({ where: { id: sprintId, projectId: project.id } });
    if (!sprint || sprint.status === "COMPLETED") return;
  }
  await db.workItem.updateMany({
    where: { id: itemId, projectId: project.id, type: { not: "EPIC" } },
    data: { sprintId },
  });
  refresh(key);
}

export async function deleteItem(key: string, formData: FormData) {
  const { project, role, user } = await requireProjectAccess(key);
  if (!canManageBacklog(role) && user.role !== "ADMIN") throw new Error("Forbidden");
  await db.workItem.deleteMany({ where: { id: str(formData, "itemId"), projectId: project.id } });
  refresh(key);
}

export async function createSprint(key: string, formData: FormData) {
  const { project, role, user } = await requireProjectAccess(key);
  if (!canManageSprints(role) && user.role !== "ADMIN") throw new Error("Forbidden");
  const input = {
    name: str(formData, "name"),
    goal: str(formData, "goal"),
    startDate: new Date(str(formData, "startDate")),
    endDate: new Date(str(formData, "endDate")),
  };
  if (validateSprint(input)) return;
  await db.sprint.create({ data: { ...input, projectId: project.id } });
  refresh(key);
}

export async function startSprint(key: string, formData: FormData) {
  const { project, role, user } = await requireProjectAccess(key);
  if (!canManageSprints(role) && user.role !== "ADMIN") throw new Error("Forbidden");
  const sprint = await db.sprint.findFirst({
    where: { id: str(formData, "sprintId"), projectId: project.id },
  });
  if (!sprint) return;
  const active = await db.sprint.count({ where: { projectId: project.id, status: "ACTIVE" } });
  if (canStartSprint(sprint.status, active)) return;
  await db.sprint.update({ where: { id: sprint.id }, data: { status: "ACTIVE" } });
  refresh(key);
}

/** Completes a sprint; unfinished items return to the backlog. */
export async function completeSprint(key: string, formData: FormData) {
  const { project, role, user } = await requireProjectAccess(key);
  if (!canManageSprints(role) && user.role !== "ADMIN") throw new Error("Forbidden");
  const sprint = await db.sprint.findFirst({
    where: { id: str(formData, "sprintId"), projectId: project.id, status: "ACTIVE" },
  });
  if (!sprint) return;
  await db.$transaction([
    db.workItem.updateMany({
      where: { sprintId: sprint.id, status: { not: "DONE" } },
      data: { sprintId: null },
    }),
    db.sprint.update({ where: { id: sprint.id }, data: { status: "COMPLETED" } }),
  ]);
  refresh(key);
}
