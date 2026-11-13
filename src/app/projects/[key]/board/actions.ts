"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/session";
import { isStatus, statusTransition } from "@/lib/board";

export async function moveCard(key: string, itemId: string, to: string) {
  const { project } = await requireProjectAccess(key);
  if (!isStatus(to)) return { ok: false as const };
  const item = await db.workItem.findFirst({ where: { id: itemId, projectId: project.id } });
  if (!item || item.type === "EPIC") return { ok: false as const };
  const change = statusTransition(item.status, to);
  if (!change) return { ok: true as const };
  await db.$transaction([
    db.workItem.update({ where: { id: item.id }, data: change }),
    db.statusChange.create({ data: { itemId: item.id, fromStatus: item.status, toStatus: to } }),
  ]);
  revalidatePath(`/projects/${project.key}/board`);
  return { ok: true as const };
}
