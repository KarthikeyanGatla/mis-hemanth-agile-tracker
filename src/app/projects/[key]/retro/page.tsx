import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/session";
import { addAction, saveRetro, toggleAction } from "./actions";

export default async function RetroPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { project } = await requireProjectAccess(key);
  const [sprints, members] = await Promise.all([
    db.sprint.findMany({
      where: { projectId: project.id, status: { in: ["ACTIVE", "COMPLETED"] } },
      include: { retro: { include: { actions: { include: { owner: true } } } } },
      orderBy: { startDate: "desc" },
    }),
    db.projectMember.findMany({ where: { projectId: project.id }, include: { user: true } }),
  ]);

  return (
    <>
      <h1 className="text-2xl font-semibold">Retrospectives</h1>
      {sprints.length === 0 && <p className="mt-4 text-sm opacity-70">No sprints to review yet.</p>}
      {sprints.map((s) => (
        <section key={s.id} className="mt-6 rounded-lg border border-current/20 p-4">
          <h2 className="font-medium">
            {s.name} <span className="text-xs font-normal opacity-60">{s.status}</span>
          </h2>
          <form action={saveRetro.bind(null, key)} className="mt-3 grid gap-2 sm:grid-cols-3">
            <input type="hidden" name="sprintId" value={s.id} />
            <textarea
              name="wentWell"
              rows={4}
              placeholder="What went well"
              defaultValue={s.retro?.wentWell}
              className="input"
            />
            <textarea
              name="toImprove"
              rows={4}
              placeholder="What to improve"
              defaultValue={s.retro?.toImprove}
              className="input"
            />
            <textarea
              name="notes"
              rows={4}
              placeholder="Notes"
              defaultValue={s.retro?.notes}
              className="input"
            />
            <div>
              <button className="btn">Save retro</button>
            </div>
          </form>

          <h3 className="mt-4 text-sm font-semibold">Action items</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {s.retro?.actions.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <form action={toggleAction.bind(null, key)}>
                  <input type="hidden" name="actionId" value={a.id} />
                  <button title="Toggle done">{a.status === "DONE" ? "☑" : "☐"}</button>
                </form>
                <span className={a.status === "DONE" ? "line-through opacity-60" : ""}>
                  {a.text}
                </span>
                {a.owner && <span className="text-xs opacity-60">· {a.owner.name}</span>}
              </li>
            ))}
          </ul>
          <form action={addAction.bind(null, key)} className="mt-2 flex flex-wrap gap-2">
            <input type="hidden" name="sprintId" value={s.id} />
            <input name="text" placeholder="New action item" required className="input max-w-sm" />
            <select name="ownerId" className="input w-auto">
              <option value="">No owner</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name}
                </option>
              ))}
            </select>
            <button className="btn">Add</button>
          </form>
        </section>
      ))}
    </>
  );
}
