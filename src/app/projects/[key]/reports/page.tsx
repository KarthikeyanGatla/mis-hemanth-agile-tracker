import Link from "next/link";
import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/session";
import { BurndownChart, CfdChart, VelocityChart } from "@/components/report-charts";
import { PrintButton } from "@/components/print-button";
import { completedPoints, totalPoints } from "@/lib/sprint";
import { averageVelocity, burndownSeries, cfdSeries, velocitySeries } from "@/lib/reports";

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ sprint?: string }>;
}) {
  const { key } = await params;
  const { sprint: sprintParam } = await searchParams;
  const { project } = await requireProjectAccess(key);
  const sprints = await db.sprint.findMany({
    where: { projectId: project.id, status: { not: "PLANNED" } },
    orderBy: { startDate: "asc" },
  });
  const selected =
    sprints.find((s) => s.id === sprintParam) ??
    sprints.find((s) => s.status === "ACTIVE") ??
    sprints.at(-1);
  const base = `/projects/${project.key}/reports`;

  if (!selected) return <p className="text-sm opacity-70">Start a sprint to see reports.</p>;

  const items = await db.workItem.findMany({
    where: { sprintId: selected.id, type: { not: "EPIC" } },
    include: { history: true, assignee: true },
  });
  const committed = selected.committedPoints ?? totalPoints(items);
  const completed = selected.completedPoints ?? completedPoints(items);
  const blocked = items.filter((i) => i.blocked && i.status !== "DONE");
  const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
  for (const i of items) counts[i.status]++;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reports · {selected.name}</h1>
        <div className="flex items-center gap-3 text-sm print:hidden">
          {sprints.map((s) => (
            <Link
              key={s.id}
              href={`${base}?sprint=${s.id}`}
              className={s.id === selected.id ? "font-semibold underline" : "opacity-70"}
            >
              {s.name}
            </Link>
          ))}
          <a href={`${base}/export?type=sprint&sprint=${selected.id}`} className="underline">
            Sprint CSV
          </a>
          <a href={`${base}/export?type=velocity`} className="underline">
            Velocity CSV
          </a>
          <PrintButton />
        </div>
      </div>

      <section className="mt-5 rounded-lg border border-current/20 p-4 text-sm">
        <h2 className="font-semibold">Sprint summary</h2>
        <p className="mt-1 opacity-80">
          {selected.goal} · {selected.startDate.toLocaleDateString()} –{" "}
          {selected.endDate.toLocaleDateString()} · {selected.status}
        </p>
        <p className="mt-2">
          Committed <b>{committed}</b> pts · Completed <b>{completed}</b> pts (
          {committed ? Math.round((completed / committed) * 100) : 0}%) · Avg velocity{" "}
          <b>{averageVelocity(sprints)}</b>
        </p>
        <p className="mt-1">
          To Do {counts.TODO} · In Progress {counts.IN_PROGRESS} · Review {counts.REVIEW} · Done{" "}
          {counts.DONE}
        </p>
        {blocked.length > 0 && (
          <p className="mt-1 text-red-600">
            Blocked: {blocked.map((b) => `${project.key}-${b.number}`).join(", ")}
          </p>
        )}
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <BurndownChart data={burndownSeries(selected.startDate, selected.endDate, items)} />
        <VelocityChart data={velocitySeries(sprints)} />
        <CfdChart data={cfdSeries(selected.startDate, selected.endDate, items)} />
      </div>
    </>
  );
}
