import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import type { ItemStatus, ItemType, Priority } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

const DAY = 86_400_000;
const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return new Date(d.getTime() - n * DAY);
};

async function main() {
  await db.$transaction([
    db.actionItem.deleteMany(),
    db.retrospective.deleteMany(),
    db.sprintSnapshot.deleteMany(),
    db.statusChange.deleteMany(),
    db.timeLog.deleteMany(),
    db.comment.deleteMany(),
    db.workItem.deleteMany(),
    db.sprint.deleteMany(),
    db.projectMember.deleteMany(),
    db.project.deleteMany(),
    db.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash("password123", 10);
  const [priya, sam, dev1, dev2] = await Promise.all(
    [
      ["priya@example.com", "Priya Patel"],
      ["sam@example.com", "Sam Rivera"],
      ["alex@example.com", "Alex Chen"],
      ["jordan@example.com", "Jordan Lee"],
    ].map(([email, name]) => db.user.create({ data: { email, name, passwordHash } })),
  );

  const project = await db.project.create({
    data: {
      key: "ATLAS",
      name: "Atlas Mobile App",
      description: "Customer-facing mobile app rebuild.",
      members: {
        create: [
          { userId: priya.id, role: "PRODUCT_OWNER" },
          { userId: sam.id, role: "SCRUM_MASTER" },
          { userId: dev1.id, role: "DEVELOPER" },
          { userId: dev2.id, role: "DEVELOPER" },
        ],
      },
    },
  });

  const devs = [dev1.id, dev2.id];
  let n = 0;
  const mk = async (
    type: ItemType,
    title: string,
    o: {
      points?: number;
      status?: ItemStatus;
      priority?: Priority;
      sprintId?: string;
      parentId?: string;
      blocked?: boolean;
      completedAt?: Date;
    } = {},
  ) => {
    n++;
    const status = o.status ?? "TODO";
    const item = await db.workItem.create({
      data: {
        projectId: project.id,
        number: n,
        type,
        title,
        status,
        priority: o.priority ?? "MEDIUM",
        storyPoints: o.points,
        blocked: o.blocked ?? false,
        position: n,
        parentId: o.parentId,
        sprintId: o.sprintId,
        reporterId: priya.id,
        assigneeId: type === "EPIC" || !o.sprintId ? null : devs[n % 2],
        completedAt: status === "DONE" ? (o.completedAt ?? new Date()) : null,
      },
    });
    return item;
  };

  const s1 = await db.sprint.create({
    data: {
      projectId: project.id,
      name: "Sprint 1",
      goal: "Authentication and onboarding",
      status: "COMPLETED",
      committedPoints: 23,
      completedPoints: 21,
      startDate: daysAgo(28),
      endDate: daysAgo(15),
    },
  });
  const s2 = await db.sprint.create({
    data: {
      projectId: project.id,
      name: "Sprint 2",
      goal: "Product catalogue and search",
      status: "ACTIVE",
      committedPoints: 29,
      startDate: daysAgo(7),
      endDate: new Date(daysAgo(7).getTime() + 13 * DAY),
    },
  });
  const s3 = await db.sprint.create({
    data: {
      projectId: project.id,
      name: "Sprint 3",
      goal: "Checkout and payments",
      status: "PLANNED",
      startDate: new Date(daysAgo(7).getTime() + 14 * DAY),
      endDate: new Date(daysAgo(7).getTime() + 27 * DAY),
    },
  });

  const eAuth = await mk("EPIC", "User accounts & onboarding", { priority: "HIGH" });
  const eCat = await mk("EPIC", "Product catalogue", { priority: "HIGH" });
  const ePay = await mk("EPIC", "Checkout & payments", { priority: "CRITICAL" });

  // Sprint 1 (completed): 23 points, 21 done
  const s1Items: [string, number, ItemStatus, ItemType][] = [
    ["Sign up with email", 5, "DONE", "STORY"],
    ["Login and session handling", 5, "DONE", "STORY"],
    ["Password reset flow", 5, "DONE", "STORY"],
    ["Onboarding carousel", 3, "DONE", "STORY"],
    ["Fix keyboard overlap on login", 3, "DONE", "BUG"],
    ["Social login (Google)", 2, "IN_PROGRESS", "STORY"],
  ];
  for (const [i, [t, p, st, ty]] of s1Items.entries()) {
    await mk(ty, t, {
      points: p,
      status: st,
      sprintId: s1.id,
      parentId: eAuth.id,
      completedAt: st === "DONE" ? daysAgo(26 - i * 2) : undefined,
    });
  }

  // Sprint 2 (active)
  const s2Items: [string, number, ItemStatus, ItemType, Priority?, boolean?][] = [
    ["Catalogue list screen", 5, "DONE", "STORY"],
    ["Product detail screen", 5, "DONE", "STORY"],
    ["Search with filters", 8, "IN_PROGRESS", "STORY", "HIGH"],
    ["Image caching", 3, "REVIEW", "TASK"],
    ["Pagination API integration", 3, "IN_PROGRESS", "TASK", "MEDIUM", true],
    ["Crash when product has no image", 2, "TODO", "BUG", "CRITICAL"],
    ["Sort by price", 3, "TODO", "STORY"],
  ];
  for (const [t, p, st, ty, pr, bl] of s2Items) {
    await mk(ty, t, {
      points: p,
      status: st,
      priority: pr,
      blocked: bl,
      sprintId: s2.id,
      parentId: eCat.id,
      completedAt: st === "DONE" ? daysAgo(3) : undefined,
    });
  }

  // Sprint 3 (planned)
  await mk("STORY", "Shopping cart", {
    points: 5,
    sprintId: s3.id,
    parentId: ePay.id,
    priority: "HIGH",
  });
  await mk("STORY", "Stripe payment integration", {
    points: 8,
    sprintId: s3.id,
    parentId: ePay.id,
    priority: "CRITICAL",
  });

  // Backlog (no sprint)
  await mk("STORY", "Order history", { points: 5, parentId: ePay.id });
  await mk("STORY", "Push notifications for orders", {
    points: 8,
    parentId: ePay.id,
    priority: "LOW",
  });
  await mk("STORY", "Wishlist", { points: 5, parentId: eCat.id, priority: "LOW" });
  await mk("TASK", "Set up CI pipeline", { points: 3, priority: "HIGH" });
  await mk("BUG", "Dark mode text contrast on settings", { points: 1, priority: "LOW" });

  // Status history for all items (TODO -> ... current)
  const flow: ItemStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
  const all = await db.workItem.findMany({
    where: { type: { not: "EPIC" }, sprintId: { not: null } },
  });
  for (const it of all) {
    const end = flow.indexOf(it.status);
    const base = it.completedAt ?? new Date();
    for (let i = 0; i <= end; i++) {
      await db.statusChange.create({
        data: {
          itemId: it.id,
          fromStatus: i === 0 ? null : flow[i - 1],
          toStatus: flow[i],
          changedAt: new Date(base.getTime() - (end - i) * DAY * 0.5),
        },
      });
    }
  }

  // Burndown snapshots for sprint 2 (day 0..7 of 14, 29 pts total)
  const total = 29;
  const remaining = [29, 29, 26, 24, 24, 19, 14, 14];
  for (const [i, r] of remaining.entries()) {
    await db.sprintSnapshot.create({
      data: {
        sprintId: s2.id,
        date: daysAgo(7 - i),
        remainingPoints: r,
        todoCount: Math.max(0, 7 - Math.floor(i / 2) - 1),
        inProgressCount: Math.min(2, i),
        reviewCount: i > 4 ? 1 : 0,
        doneCount: Math.min(2, Math.floor(i / 3)),
      },
    });
  }
  void total;

  // Sprint 1 retro
  const retro = await db.retrospective.create({
    data: {
      sprintId: s1.id,
      wentWell: "Auth flow shipped early; good pairing on login.",
      toImprove: "Stories were under-specified; social login slipped.",
      notes: "Velocity baseline: 21 points.",
    },
  });
  await db.actionItem.createMany({
    data: [
      {
        retroId: retro.id,
        text: "Add acceptance criteria to every story before planning",
        ownerId: priya.id,
      },
      { retroId: retro.id, text: "Timebox spikes to 1 day", ownerId: sam.id, status: "DONE" },
    ],
  });

  console.log(
    `Seeded project ${project.key} with ${n} work items. Login: priya@example.com / password123`,
  );
}

main().finally(() => db.$disconnect());
