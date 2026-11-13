import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

/** Loads a project by key and the current user's membership; 404s for non-members. */
export async function requireProjectAccess(key: string) {
  const user = await requireUser();
  const project = await db.project.findUnique({ where: { key: key.toUpperCase() } });
  if (!project) notFound();
  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
  });
  if (!membership && user.role !== "ADMIN") notFound();
  return { user, project, role: membership?.role ?? null };
}
