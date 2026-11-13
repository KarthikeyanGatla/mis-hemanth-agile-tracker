"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/session";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const refresh = (key: string) => revalidatePath(`/projects/${key}/retro`);

async function ownedSprint(key: string, sprintId: string) {
  const access = await requireProjectAccess(key);
  const sprint = await db.sprint.findFirst({
    where: { id: sprintId, projectId: access.project.id },
  });
  if (!sprint) throw new Error("Not found");
  return { ...access, sprint };
}

export async function saveRetro(key: string, formData: FormData) {
  const { sprint } = await ownedSprint(key, str(formData, "sprintId"));
  const data = {
    wentWell: str(formData, "wentWell"),
    toImprove: str(formData, "toImprove"),
    notes: str(formData, "notes"),
  };
  await db.retrospective.upsert({
    where: { sprintId: sprint.id },
    update: data,
    create: { sprintId: sprint.id, ...data },
  });
  refresh(key);
}

export async function addAction(key: string, formData: FormData) {
  const { sprint, project } = await ownedSprint(key, str(formData, "sprintId"));
  const text = str(formData, "text");
  if (!text) return;
  const ownerId = str(formData, "ownerId") || null;
  if (
    ownerId &&
    !(await db.projectMember.findFirst({ where: { projectId: project.id, userId: ownerId } }))
  )
    return;
  const retro = await db.retrospective.upsert({
    where: { sprintId: sprint.id },
    update: {},
    create: { sprintId: sprint.id },
  });
  await db.actionItem.create({ data: { retroId: retro.id, text, ownerId } });
  refresh(key);
}

export async function toggleAction(key: string, formData: FormData) {
  const { project } = await requireProjectAccess(key);
  const action = await db.actionItem.findFirst({
    where: { id: str(formData, "actionId"), retro: { sprint: { projectId: project.id } } },
  });
  if (!action) return;
  await db.actionItem.update({
    where: { id: action.id },
    data: { status: action.status === "OPEN" ? "DONE" : "OPEN" },
  });
  refresh(key);
}
