"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/session";
import { isStatus, statusTransition } from "@/lib/board";

async function load(key: string, number: string) {
  const access = await requireProjectAccess(key);
  const item = await db.workItem.findUnique({
    where: { projectId_number: { projectId: access.project.id, number: Number(number) } },
  });
  if (!item) throw new Error("Not found");
  return { ...access, item };
}
const done = (key: string, n: string) => revalidatePath(`/projects/${key}/items/${n}`);

export async function addComment(key: string, number: string, formData: FormData) {
  const { item, user } = await load(key, number);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await db.comment.create({ data: { itemId: item.id, authorId: user.id, body } });
  done(key, number);
}

export async function logTime(key: string, number: string, formData: FormData) {
  const { item, user } = await load(key, number);
  const hours = Number(formData.get("hours"));
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) return;
  const note = String(formData.get("note") ?? "").trim();
  await db.timeLog.create({ data: { itemId: item.id, userId: user.id, hours, note } });
  done(key, number);
}

export async function updateItem(key: string, number: string, formData: FormData) {
  const { item, project } = await load(key, number);
  const to = String(formData.get("status"));
  const assigneeId = String(formData.get("assigneeId") || "") || null;
  if (assigneeId) {
    const member = await db.projectMember.findFirst({
      where: { projectId: project.id, userId: assigneeId },
    });
    if (!member) return;
  }
  const change = isStatus(to) ? statusTransition(item.status, to) : null;
  await db.$transaction([
    db.workItem.update({
      where: { id: item.id },
      data: { assigneeId, blocked: formData.get("blocked") === "on", ...change },
    }),
    ...(change
      ? [
          db.statusChange.create({
            data: { itemId: item.id, fromStatus: item.status, toStatus: change.status },
          }),
        ]
      : []),
  ]);
  done(key, number);
}
