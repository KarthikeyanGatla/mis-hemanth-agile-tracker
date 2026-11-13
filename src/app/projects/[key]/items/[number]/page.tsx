import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/session";
import { STATUSES, STATUS_LABELS } from "@/lib/board";
import { addComment, logTime, updateItem } from "./actions";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ key: string; number: string }>;
}) {
  const { key, number } = await params;
  const { project } = await requireProjectAccess(key);
  const item = await db.workItem.findUnique({
    where: { projectId_number: { projectId: project.id, number: Number(number) || 0 } },
    include: {
      assignee: true,
      sprint: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      timeLogs: { include: { user: true }, orderBy: { loggedAt: "desc" } },
      history: { orderBy: { changedAt: "desc" } },
    },
  });
  if (!item) notFound();
  const members = await db.projectMember.findMany({
    where: { projectId: project.id },
    include: { user: true },
  });
  const hours = item.timeLogs.reduce((s, t) => s + t.hours, 0);

  return (
    <div className="max-w-2xl">
      <p className="text-xs opacity-60">
        {project.key}-{item.number} · {item.type} · {item.sprint?.name ?? "Backlog"}
      </p>
      <h1 className="text-2xl font-semibold">{item.title}</h1>
      {item.description && <p className="mt-2 text-sm">{item.description}</p>}
      <p className="mt-1 text-sm opacity-70">
        {item.storyPoints ?? "–"} pts · {hours}h logged
      </p>

      <form
        action={updateItem.bind(null, key, number)}
        className="mt-5 flex flex-wrap items-center gap-2"
      >
        <select name="status" defaultValue={item.status} className="input w-auto">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select name="assigneeId" defaultValue={item.assigneeId ?? ""} className="input w-auto">
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" name="blocked" defaultChecked={item.blocked} /> Blocked
        </label>
        <button className="btn">Save</button>
      </form>

      <h2 className="mt-8 font-medium">Log time</h2>
      <form action={logTime.bind(null, key, number)} className="mt-2 flex gap-2">
        <input
          name="hours"
          type="number"
          step="0.25"
          min="0.25"
          max="24"
          placeholder="Hours"
          required
          className="input w-24"
        />
        <input name="note" placeholder="Note" className="input" />
        <button className="btn">Log</button>
      </form>
      <ul className="mt-2 text-sm opacity-80">
        {item.timeLogs.map((t) => (
          <li key={t.id}>
            {t.user.name}: {t.hours}h {t.note && `– ${t.note}`}
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-medium">Comments</h2>
      <ul className="mt-2 space-y-2">
        {item.comments.map((c) => (
          <li key={c.id} className="rounded-md border border-current/20 p-2 text-sm">
            <span className="font-medium">{c.author.name}</span>{" "}
            <span className="text-xs opacity-60">{c.createdAt.toLocaleString()}</span>
            <p>{c.body}</p>
          </li>
        ))}
      </ul>
      <form action={addComment.bind(null, key, number)} className="mt-2 flex gap-2">
        <input name="body" placeholder="Add a comment" required className="input" />
        <button className="btn">Post</button>
      </form>

      <h2 className="mt-8 font-medium">History</h2>
      <ul className="mt-2 text-sm opacity-80">
        {item.history.map((h) => (
          <li key={h.id}>
            {h.fromStatus ? STATUS_LABELS[h.fromStatus] : "Created"} → {STATUS_LABELS[h.toStatus]} ·{" "}
            {h.changedAt.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
