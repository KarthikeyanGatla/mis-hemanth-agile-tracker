import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await db.project.findMany({
    include: { _count: { select: { items: true, sprints: true, members: true } } },
  });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Agile Project Tracker</h1>
      <p className="mt-1 text-sm opacity-70">M1 scaffold: schema and seed data are live.</p>
      <ul className="mt-6 space-y-3">
        {projects.map((p) => (
          <li key={p.id} className="rounded-lg border border-current/20 p-4">
            <div className="font-medium">
              {p.key} · {p.name}
            </div>
            <div className="text-sm opacity-70">
              {p._count.items} items · {p._count.sprints} sprints · {p._count.members} members
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
