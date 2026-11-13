import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/session";
import { canManageProject, ROLE_LABELS, type ProjectRole } from "@/lib/permissions";

const ROLES = Object.keys(ROLE_LABELS) as ProjectRole[];

export default async function ProjectPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { project, role } = await requireProjectAccess(key);
  const members = await db.projectMember.findMany({
    where: { projectId: project.id },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });
  const manage = canManageProject(role);

  async function guard() {
    "use server";
    const access = await requireProjectAccess(key);
    if (!canManageProject(access.role)) throw new Error("Forbidden");
    return access.project;
  }

  async function addMember(formData: FormData) {
    "use server";
    const p = await guard();
    const user = await db.user.findUnique({
      where: { email: String(formData.get("email")).trim().toLowerCase() },
    });
    const newRole = String(formData.get("role")) as ProjectRole;
    if (!user || !ROLES.includes(newRole)) return;
    await db.projectMember.upsert({
      where: { projectId_userId: { projectId: p.id, userId: user.id } },
      update: { role: newRole },
      create: { projectId: p.id, userId: user.id, role: newRole },
    });
    revalidatePath(`/projects/${p.key}`);
  }

  async function removeMember(formData: FormData) {
    "use server";
    const p = await guard();
    const memberId = String(formData.get("memberId"));
    const target = await db.projectMember.findFirst({ where: { id: memberId, projectId: p.id } });
    if (!target) return;
    // Never leave a project without a Product Owner.
    if (target.role === "PRODUCT_OWNER") {
      const owners = await db.projectMember.count({
        where: { projectId: p.id, role: "PRODUCT_OWNER" },
      });
      if (owners <= 1) return;
    }
    await db.projectMember.delete({ where: { id: target.id } });
    revalidatePath(`/projects/${p.key}`);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">
        {project.key} · {project.name}
      </h1>
      <p className="mt-1 text-sm opacity-70">{project.description}</p>
      {role && <p className="mt-1 text-xs opacity-60">Your role: {ROLE_LABELS[role]}</p>}

      <h2 className="mt-8 text-lg font-medium">Team</h2>
      <ul className="mt-3 divide-y divide-current/15 rounded-lg border border-current/20">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between p-3 text-sm">
            <span>
              {m.user.name} <span className="opacity-60">({m.user.email})</span>
            </span>
            <span className="flex items-center gap-3">
              {ROLE_LABELS[m.role]}
              {manage && (
                <form action={removeMember}>
                  <input type="hidden" name="memberId" value={m.id} />
                  <button className="text-red-600 underline">Remove</button>
                </form>
              )}
            </span>
          </li>
        ))}
      </ul>

      {manage && (
        <form action={addMember} className="mt-4 flex flex-wrap gap-2">
          <input
            name="email"
            type="email"
            placeholder="Member email"
            required
            className="input max-w-xs"
          />
          <select name="role" className="input w-auto">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button className="btn">Add / update</button>
        </form>
      )}
    </>
  );
}
