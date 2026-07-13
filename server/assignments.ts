/**
 * Training Assignments — the core maintenance-manager workflow.
 *
 * A manager assigns a course module to team members with a due date; the platform
 * tracks completion (derived from real lesson progress) and flags overdue. This is
 * the "assign it and make sure it happened" loop that justifies the team plan.
 *
 *   assignments.assign          — manager assigns a module to members (with due date)
 *   assignments.teamAssignments — manager view: every assignment + live status
 *   assignments.myAssignments   — learner view: what's assigned to me
 *   assignments.unassign        — manager removes an assignment
 *
 * Completion is derived from userProgress (lessons completed vs published lessons)
 * and persisted onto assigned_paths when it flips, so compliance reports are accurate.
 */

import { z } from "zod";
import { eq, and, inArray, sql } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { assignedPaths, courseModules, courseLessons, userProgress, teamMembers, users } from "../drizzle/schema";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Teams the caller manages → array of teamIds. */
async function managedTeamIds(db: Db, userId: number): Promise<number[]> {
  const rows = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), inArray(teamMembers.role, ["owner", "admin", "manager"])));
  return Array.from(new Set(rows.map(r => r.teamId)));
}

/** Published lesson count per module id. */
async function lessonCounts(db: Db): Promise<Map<number, number>> {
  const rows = await db
    .select({ moduleId: courseLessons.moduleId, count: sql<number>`cast(count(*) as unsigned)`.mapWith(Number) })
    .from(courseLessons)
    .where(eq(courseLessons.isPublished, true))
    .groupBy(courseLessons.moduleId);
  return new Map(rows.map(r => [r.moduleId, r.count]));
}

/** Completed-lesson count per (userId, moduleId) for the given users. */
async function completedCounts(db: Db, userIds: number[]): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();
  const rows = await db
    .select({ userId: userProgress.userId, moduleId: userProgress.moduleId, count: sql<number>`cast(count(*) as unsigned)`.mapWith(Number) })
    .from(userProgress)
    .where(and(inArray(userProgress.userId, userIds), eq(userProgress.completed, true)))
    .groupBy(userProgress.userId, userProgress.moduleId);
  return new Map(rows.map(r => [`${r.userId}:${r.moduleId}`, r.count]));
}

/** Derive progress% + complete for one assignment, persisting completion when it flips. */
async function statusFor(
  db: Db,
  row: { id: number; userId: number; moduleId: number; completed: boolean; completedAt: Date | null; dueAt: Date | null },
  totalByModule: Map<number, number>,
  doneByUserModule: Map<string, number>,
): Promise<{ progressPct: number; completed: boolean; overdue: boolean; completedAt: string | null }> {
  const total = totalByModule.get(row.moduleId) ?? 0;
  const done = doneByUserModule.get(`${row.userId}:${row.moduleId}`) ?? 0;
  const isComplete = total > 0 && done >= total;
  const progressPct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  // Persist completion the first time it flips (for accurate compliance records).
  let completedAt = row.completedAt;
  if (isComplete && !row.completed) {
    completedAt = new Date();
    await db.update(assignedPaths).set({ completed: true, completedAt }).where(eq(assignedPaths.id, row.id));
  }
  const overdue = !isComplete && !!row.dueAt && row.dueAt.getTime() < Date.now();
  return { progressPct, completed: isComplete, overdue, completedAt: isComplete && completedAt ? completedAt.toISOString() : null };
}

export const assignmentsRouter = router({
  assign: protectedProcedure
    .input(
      z.object({
        userIds: z.array(z.number()).min(1).max(500),
        moduleId: z.number(),
        dueAt: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const teamIds = await managedTeamIds(db, ctx.user.id);
      if (teamIds.length === 0) return { ok: false, reason: "not_a_manager" as const, assigned: 0 };

      // Which of the requested users are active members of a team the caller manages?
      const members = await db
        .select({ userId: teamMembers.userId, teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(and(inArray(teamMembers.teamId, teamIds), eq(teamMembers.status, "active"), inArray(teamMembers.userId, input.userIds)));
      const teamByUser = new Map<number, number>();
      for (const m of members) if (m.userId != null) teamByUser.set(m.userId, m.teamId);
      if (teamByUser.size === 0) return { ok: false, reason: "no_valid_members" as const, assigned: 0 };

      // Skip users who already have an OPEN (incomplete) assignment for this module.
      const existing = await db
        .select({ userId: assignedPaths.userId })
        .from(assignedPaths)
        .where(and(eq(assignedPaths.moduleId, input.moduleId), eq(assignedPaths.completed, false), inArray(assignedPaths.userId, Array.from(teamByUser.keys()))));
      const alreadyOpen = new Set(existing.map(e => e.userId));

      const dueAt = input.dueAt ? new Date(input.dueAt) : null;
      const toInsert = Array.from(teamByUser.entries())
        .filter(([userId]) => !alreadyOpen.has(userId))
        .map(([userId, teamId]) => ({ teamId, userId, moduleId: input.moduleId, assignedBy: ctx.user.id, dueAt }));

      if (toInsert.length > 0) await db.insert(assignedPaths).values(toInsert);
      return { ok: true, assigned: toInsert.length, skipped: teamByUser.size - toInsert.length };
    }),

  teamAssignments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { isManager: false, rows: [] as any[] };
    const teamIds = await managedTeamIds(db, ctx.user.id);
    if (teamIds.length === 0) return { isManager: false, rows: [] as any[] };

    const rows = await db
      .select({
        id: assignedPaths.id,
        userId: assignedPaths.userId,
        moduleId: assignedPaths.moduleId,
        completed: assignedPaths.completed,
        completedAt: assignedPaths.completedAt,
        dueAt: assignedPaths.dueAt,
        createdAt: assignedPaths.createdAt,
        userName: users.name,
        moduleTitle: courseModules.title,
        moduleSlug: courseModules.slug,
      })
      .from(assignedPaths)
      .innerJoin(users, eq(assignedPaths.userId, users.id))
      .innerJoin(courseModules, eq(assignedPaths.moduleId, courseModules.id))
      .where(inArray(assignedPaths.teamId, teamIds));

    const totals = await lessonCounts(db);
    const done = await completedCounts(db, Array.from(new Set(rows.map(r => r.userId))));
    const out = [];
    for (const r of rows) {
      const st = await statusFor(db, r, totals, done);
      out.push({
        id: r.id,
        userName: r.userName ?? "Technician",
        moduleTitle: r.moduleTitle,
        moduleSlug: r.moduleSlug,
        dueAt: r.dueAt ? r.dueAt.toISOString() : null,
        assignedAt: r.createdAt.toISOString(),
        ...st,
      });
    }
    // Newest first.
    out.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
    return { isManager: true, rows: out };
  }),

  myAssignments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({
        id: assignedPaths.id,
        userId: assignedPaths.userId,
        moduleId: assignedPaths.moduleId,
        completed: assignedPaths.completed,
        completedAt: assignedPaths.completedAt,
        dueAt: assignedPaths.dueAt,
        moduleTitle: courseModules.title,
        moduleSlug: courseModules.slug,
      })
      .from(assignedPaths)
      .innerJoin(courseModules, eq(assignedPaths.moduleId, courseModules.id))
      .where(eq(assignedPaths.userId, ctx.user.id));
    if (rows.length === 0) return [];

    const totals = await lessonCounts(db);
    const done = await completedCounts(db, [ctx.user.id]);
    const out = [];
    for (const r of rows) {
      const st = await statusFor(db, r, totals, done);
      out.push({
        id: r.id,
        moduleTitle: r.moduleTitle,
        moduleSlug: r.moduleSlug,
        dueAt: r.dueAt ? r.dueAt.toISOString() : null,
        ...st,
      });
    }
    // Incomplete + soonest due first.
    out.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999");
    });
    return out;
  }),

  unassign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const teamIds = await managedTeamIds(db, ctx.user.id);
      if (teamIds.length === 0) throw new Error("Not a manager");
      await db.delete(assignedPaths).where(and(eq(assignedPaths.id, input.id), inArray(assignedPaths.teamId, teamIds)));
      return { ok: true };
    }),
});
