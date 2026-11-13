import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/session";
import { KanbanBoard } from "@/components/kanban-board";
import { completedPoints, totalPoints } from "@/lib/sprint";
import { moveCard } from "./actions";

export default async function BoardPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { project } = await requireProjectAccess(key);
  const sprint = await db.sprint.findFirst({ where: { projectId: project.id, status: "ACTIVE" } });
  if (!sprint) {
    return (
      <p className="text-sm opacity-70">No active sprint. Start one from Backlog &amp; Sprints.</p>
    );
  }
  const items = await db.workItem.findMany({
    where: { sprintId: sprint.id },
    include: { assignee: true },
    orderBy: { position: "asc" },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">{sprint.name}</h1>
      <p className="mb-5 text-sm opacity-70">
        {sprint.goal} · {completedPoints(items)}/{totalPoints(items)} pts done
      </p>
      <KanbanBoard
        projectKey={project.key}
        moveCard={moveCard.bind(null, project.key)}
        initial={items.map((i) => ({
          id: i.id,
          number: i.number,
          type: i.type,
          title: i.title,
          status: i.status,
          priority: i.priority,
          storyPoints: i.storyPoints,
          blocked: i.blocked,
          assignee: i.assignee?.name ?? null,
        }))}
      />
    </>
  );
}
