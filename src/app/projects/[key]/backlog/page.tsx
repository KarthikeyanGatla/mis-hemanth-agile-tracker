import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/session";
import { canManageSprints } from "@/lib/permissions";
import { completedPoints, totalPoints } from "@/lib/sprint";
import {
  completeSprint,
  createItem,
  createSprint,
  deleteItem,
  moveItemToSprint,
  startSprint,
} from "./actions";

const TYPE_ICON = { EPIC: "⚡", STORY: "📖", TASK: "✔", BUG: "🐞" } as const;
const PRIORITY_RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;

type Item = Awaited<ReturnType<typeof loadItems>>[number];

function loadItems(projectId: string) {
  return db.workItem.findMany({
    where: { projectId },
    include: { assignee: true, parent: true },
    orderBy: { position: "asc" },
  });
}

export default async function BacklogPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { project, role, user } = await requireProjectAccess(key);
  const [items, sprints] = await Promise.all([
    loadItems(project.id),
    db.sprint.findMany({ where: { projectId: project.id }, orderBy: { startDate: "asc" } }),
  ]);
  const manage = canManageSprints(role) || user.role === "ADMIN";
  const epics = items.filter((i) => i.type === "EPIC");
  const work = items.filter((i) => i.type !== "EPIC");
  const backlog = work
    .filter((i) => !i.sprintId)
    .sort(
      (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.position - b.position,
    );
  const openSprints = sprints.filter((s) => s.status !== "COMPLETED");

  const row = (i: Item) => (
    <li key={i.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
      <span title={i.type}>{TYPE_ICON[i.type]}</span>
      <span className="opacity-60">
        {project.key}-{i.number}
      </span>
      <span className="flex-1">
        {i.title}
        {i.blocked && <span className="ml-2 text-red-600">blocked</span>}
        {i.parent && <span className="ml-2 text-xs opacity-60">[{i.parent.title}]</span>}
      </span>
      <span className="text-xs opacity-70">{i.priority}</span>
      <span className="w-8 text-right">{i.storyPoints ?? "–"}</span>
      <span className="w-16 text-xs opacity-70">{i.status.replace("_", " ")}</span>
      {manage && i.type !== "EPIC" && (
        <form action={moveItemToSprint.bind(null, key)} className="flex gap-1">
          <input type="hidden" name="itemId" value={i.id} />
          <select name="sprintId" defaultValue={i.sprintId ?? ""} className="input w-auto py-1">
            <option value="">Backlog</option>
            {openSprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button className="underline">Move</button>
        </form>
      )}
      {role === "PRODUCT_OWNER" && (
        <form action={deleteItem.bind(null, key)}>
          <input type="hidden" name="itemId" value={i.id} />
          <button className="text-red-600 underline">Delete</button>
        </form>
      )}
    </li>
  );

  return (
    <>
      <h1 className="text-2xl font-semibold">Backlog &amp; Sprints</h1>

      <form action={createItem.bind(null, key)} className="mt-5 flex flex-wrap gap-2">
        <input name="title" placeholder="New item title" required className="input max-w-xs" />
        <select name="type" className="input w-auto">
          <option value="STORY">Story</option>
          <option value="TASK">Task</option>
          <option value="BUG">Bug</option>
          <option value="EPIC">Epic</option>
        </select>
        <select name="priority" defaultValue="MEDIUM" className="input w-auto">
          {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <input name="points" type="number" min={0} placeholder="Pts" className="input w-20" />
        <select name="parentId" className="input w-auto">
          <option value="">No epic</option>
          {epics.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
        <button className="btn">Add</button>
      </form>

      {sprints
        .filter((s) => s.status !== "COMPLETED")
        .map((s) => {
          const si = work.filter((i) => i.sprintId === s.id);
          return (
            <section key={s.id} className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-medium">
                  {s.name}{" "}
                  <span className="text-xs font-normal opacity-60">
                    {s.status} · {s.startDate.toLocaleDateString()} –{" "}
                    {s.endDate.toLocaleDateString()} · {completedPoints(si)}/{totalPoints(si)} pts
                  </span>
                </h2>
                {manage && (
                  <form
                    action={(s.status === "PLANNED" ? startSprint : completeSprint).bind(null, key)}
                  >
                    <input type="hidden" name="sprintId" value={s.id} />
                    <button className="btn">
                      {s.status === "PLANNED" ? "Start sprint" : "Complete sprint"}
                    </button>
                  </form>
                )}
              </div>
              {s.goal && <p className="text-sm opacity-70">Goal: {s.goal}</p>}
              <ul className="mt-2 divide-y divide-current/15 rounded-lg border border-current/20">
                {si.length ? (
                  si.map(row)
                ) : (
                  <li className="p-3 text-sm opacity-60">No items yet.</li>
                )}
              </ul>
            </section>
          );
        })}

      {manage && (
        <form action={createSprint.bind(null, key)} className="mt-8 flex flex-wrap gap-2">
          <input name="name" placeholder="Sprint name" required className="input max-w-[10rem]" />
          <input name="goal" placeholder="Goal" className="input max-w-xs" />
          <input name="startDate" type="date" required className="input w-auto" />
          <input name="endDate" type="date" required className="input w-auto" />
          <button className="btn">Create sprint</button>
        </form>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-medium">
          Product backlog{" "}
          <span className="text-xs font-normal opacity-60">
            {backlog.length} items · {totalPoints(backlog)} pts
          </span>
        </h2>
        <ul className="mt-2 divide-y divide-current/15 rounded-lg border border-current/20">
          {backlog.length ? backlog.map(row) : <li className="p-3 text-sm opacity-60">Empty.</li>}
        </ul>
      </section>

      {epics.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Epics</h2>
          <ul className="mt-2 divide-y divide-current/15 rounded-lg border border-current/20">
            {epics.map(row)}
          </ul>
        </section>
      )}
    </>
  );
}
