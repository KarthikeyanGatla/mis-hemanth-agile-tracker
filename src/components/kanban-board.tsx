"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/board";

export interface BoardCard {
  id: string;
  number: number;
  type: string;
  title: string;
  status: Status;
  priority: string;
  storyPoints: number | null;
  blocked: boolean;
  assignee: string | null;
}

function Card({ card, projectKey }: { card: BoardCard; projectKey: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 10 }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-md border bg-background p-3 text-sm shadow-sm ${
        card.blocked ? "border-red-500" : "border-current/20"
      } ${isDragging ? "opacity-80 shadow-lg" : ""}`}
    >
      <Link
        href={`/projects/${projectKey}/items/${card.number}`}
        draggable={false}
        className="font-medium hover:underline"
      >
        {card.title}
      </Link>
      <div className="mt-2 flex items-center justify-between text-xs opacity-70">
        <span>
          {projectKey}-{card.number} · {card.type} · {card.priority}
        </span>
        <span>{card.storyPoints ?? "–"} pts</span>
      </div>
      <div className="mt-1 text-xs opacity-70">
        {card.assignee ?? "Unassigned"}
        {card.blocked && <span className="ml-2 text-red-600">blocked</span>}
      </div>
    </div>
  );
}

function Column({
  status,
  cards,
  projectKey,
}: {
  status: Status;
  cards: BoardCard[];
  projectKey: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-64 rounded-lg border border-current/20 p-3 ${isOver ? "bg-current/10" : "bg-current/5"}`}
    >
      <h3 className="mb-3 text-sm font-semibold">
        {STATUS_LABELS[status]} <span className="font-normal opacity-60">({cards.length})</span>
      </h3>
      <div className="space-y-2">
        {cards.map((c) => (
          <Card key={c.id} card={c} projectKey={projectKey} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({
  initial,
  projectKey,
  moveCard,
}: {
  initial: BoardCard[];
  projectKey: string;
  moveCard: (itemId: string, to: string) => Promise<{ ok: boolean }>;
}) {
  const [cards, setCards] = useState(initial);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(e: DragEndEvent) {
    const to = e.over?.id as Status | undefined;
    const card = cards.find((c) => c.id === e.active.id);
    if (!to || !card || card.status === to) return;
    const prev = cards;
    setCards(cards.map((c) => (c.id === card.id ? { ...c, status: to } : c))); // optimistic
    startTransition(async () => {
      const res = await moveCard(card.id, to);
      if (!res.ok) setCards(prev);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid gap-4 md:grid-cols-4">
        {STATUSES.map((s) => (
          <Column
            key={s}
            status={s}
            projectKey={projectKey}
            cards={cards.filter((c) => c.status === s)}
          />
        ))}
      </div>
    </DndContext>
  );
}
