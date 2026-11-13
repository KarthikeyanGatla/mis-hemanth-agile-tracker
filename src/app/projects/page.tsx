import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/permissions";

export default async function ProjectsPage() {
  const user = await requireUser();
  const memberships = await db.projectMember.findMany({
    where: { userId: user.id },
    include: { project: { include: { _count: { select: { items: true, members: true } } } } },
    orderBy: { project: { name: "asc" } },
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link href="/projects/new" className="btn">
          New project
        </Link>
      </div>
      {memberships.length === 0 && <p className="mt-6 text-sm opacity-70">No projects yet.</p>}
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {memberships.map(({ project, role }) => (
          <li key={project.id}>
            <Link
              href={`/projects/${project.key}`}
              className="block rounded-lg border border-current/20 p-4 hover:bg-current/5"
            >
              <div className="font-medium">
                {project.key} · {project.name}
              </div>
              <div className="text-sm opacity-70">
                {ROLE_LABELS[role]} · {project._count.items} items · {project._count.members}{" "}
                members
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
