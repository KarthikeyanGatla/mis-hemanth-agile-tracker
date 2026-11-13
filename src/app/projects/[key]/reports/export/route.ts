import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/session";
import { toCsv, velocitySeries } from "@/lib/reports";

export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { project } = await requireProjectAccess(key);
  const url = new URL(req.url);
  let rows: (string | number | null)[][];
  let name: string;

  if (url.searchParams.get("type") === "velocity") {
    const sprints = await db.sprint.findMany({
      where: { projectId: project.id, status: { not: "PLANNED" } },
      orderBy: { startDate: "asc" },
    });
    rows = [
      ["Sprint", "Committed", "Completed"],
      ...velocitySeries(sprints).map((v) => [v.sprint, v.committed, v.completed]),
    ];
    name = "velocity";
  } else {
    const sprint = await db.sprint.findFirst({
      where: { id: url.searchParams.get("sprint") ?? "", projectId: project.id },
    });
    if (!sprint) return new Response("Not found", { status: 404 });
    const items = await db.workItem.findMany({
      where: { sprintId: sprint.id },
      include: { assignee: true },
      orderBy: { number: "asc" },
    });
    rows = [
      ["Key", "Type", "Title", "Status", "Priority", "Points", "Assignee", "Blocked"],
      ...items.map((i) => [
        `${project.key}-${i.number}`,
        i.type,
        i.title,
        i.status,
        i.priority,
        i.storyPoints,
        i.assignee?.name ?? "",
        i.blocked ? "yes" : "no",
      ]),
    ];
    name = `sprint-${sprint.name.replace(/\W+/g, "-").toLowerCase()}`;
  }

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${project.key.toLowerCase()}-${name}.csv"`,
    },
  });
}
