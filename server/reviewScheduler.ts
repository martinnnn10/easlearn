/**
 * Review Scheduler Router — Competency Durability Engine (server-side)
 *
 * This router manages the broader spaced-repetition queue that goes beyond
 * concept-level questions. It handles fault retries, simulation repeats,
 * communication practice, safety rechecks, and more.
 *
 * Key procedures:
 *   scheduler.getDueItems  — items due now, sorted by priority (safety first)
 *   scheduler.submitReview — grade a review attempt → reschedule via SM-2
 *   scheduler.stats        — counts for the review queue header
 *   scheduler.getTeamOverdue — aggregated team overdue (manager visibility)
 *   scheduler.createFromAttempt — trigger reviews from a lab/scenario attempt
 *   scheduler.createFromMentor — trigger reviews from a mentor session
 */

import { z } from "zod";
import { eq, and, lte, sql, desc, inArray } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { managedMemberIds } from "./competencyGraph";
import { spacedReviewItems, competencyEvidence } from "../drizzle/schema";
import {
  scheduleReviewNext,
  getInitialInterval,
  getReviewPriority,
  getReasonDetail,
  getReviewItemType,
  reviewEvidenceType,
  detectReviewTriggers,
  detectMentorReviewTriggers,
  type ReviewReason,
  type SchedulerState,
  type LabAttemptSignals,
  type MentorSessionSignals,
} from "@shared/reviewScheduler";

// ── Internal helpers ─────────────────────────────────────────────────────────

interface CreateReviewInput {
  learnerId: number;
  reason: ReviewReason;
  sourceId: string;
  sourceLabel: string;
  domain: string;
  skill?: string;
  difficulty?: number;
  metadata?: Record<string, unknown>;
}

async function createReviewItem(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, input: CreateReviewInput) {
  const intervalDays = getInitialInterval(input.reason);
  const dueAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
  const priority = getReviewPriority(input.reason);
  const itemType = getReviewItemType(input.reason);
  const reasonDetail = getReasonDetail(input.reason, input.sourceLabel);

  await db.insert(spacedReviewItems).values({
    learnerId: input.learnerId,
    itemType,
    sourceId: input.sourceId,
    sourceLabel: input.sourceLabel,
    domain: input.domain,
    skill: input.skill ?? null,
    reason: input.reason,
    reasonDetail,
    priority,
    difficulty: input.difficulty ?? 3,
    dueAt,
    metadata: input.metadata ?? null,
  });
}

/**
 * Create review items from a mentor/closeout session's signals. Shared by the
 * scheduler router and the in-mentor server flow so the trigger→create logic
 * lives in exactly one place. Best-effort per item; returns how many were made.
 */
export async function createMentorReviews(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  learnerId: number,
  input: { sourceId: string; sourceLabel: string; domain: string; skill?: string; signals: MentorSessionSignals },
): Promise<number> {
  const triggers = detectMentorReviewTriggers(input.signals);
  let created = 0;
  for (const reason of triggers) {
    try {
      await createReviewItem(db, {
        learnerId,
        reason,
        sourceId: input.sourceId,
        sourceLabel: input.sourceLabel,
        domain: input.domain,
        skill: input.skill,
        metadata: { signals: input.signals },
      });
      created++;
    } catch {
      /* duplicate/constraint — best-effort */
    }
  }
  return created;
}

// ── Router ───────────────────────────────────────────────────────────────────

export const schedulerRouter = router({
  /**
   * Get review items due now, sorted by priority (safety first) then due date.
   */
  getDueItems: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(30).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const items = await db
        .select()
        .from(spacedReviewItems)
        .where(
          and(
            eq(spacedReviewItems.learnerId, ctx.user.id),
            eq(spacedReviewItems.mastered, false),
            lte(spacedReviewItems.dueAt, new Date()),
          ),
        )
        .orderBy(
          sql`FIELD(${spacedReviewItems.priority}, 'critical', 'high', 'medium', 'low')`,
          spacedReviewItems.dueAt,
        )
        .limit(input?.limit ?? 10);

      return items;
    }),

  /**
   * Get stats for the review queue header.
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { dueToday: 0, overdue: 0, completed: 0, total: 0, criticalDue: 0 };

    const [counts] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`sum(case when ${spacedReviewItems.status} = 'completed' or ${spacedReviewItems.mastered} then 1 else 0 end)`,
        dueToday: sql<number>`sum(case when ${spacedReviewItems.mastered} = false and ${spacedReviewItems.dueAt} <= now() then 1 else 0 end)`,
        overdue: sql<number>`sum(case when ${spacedReviewItems.mastered} = false and ${spacedReviewItems.dueAt} < DATE_SUB(now(), INTERVAL 1 DAY) then 1 else 0 end)`,
        criticalDue: sql<number>`sum(case when ${spacedReviewItems.mastered} = false and ${spacedReviewItems.priority} = 'critical' and ${spacedReviewItems.dueAt} <= now() then 1 else 0 end)`,
      })
      .from(spacedReviewItems)
      .where(eq(spacedReviewItems.learnerId, ctx.user.id));

    return {
      dueToday: Number(counts?.dueToday ?? 0),
      overdue: Number(counts?.overdue ?? 0),
      completed: Number(counts?.completed ?? 0),
      total: Number(counts?.total ?? 0),
      criticalDue: Number(counts?.criticalDue ?? 0),
    };
  }),

  /**
   * Submit a review attempt — grade it and reschedule.
   * Writes evidence back to the Assessment Spine with type-specific evidence.
   */
  submitReview: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      passed: z.boolean(),
      fast: z.boolean().optional(),
      safetyIssue: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [item] = await db
        .select()
        .from(spacedReviewItems)
        .where(and(
          eq(spacedReviewItems.id, input.reviewId),
          eq(spacedReviewItems.learnerId, ctx.user.id),
        ))
        .limit(1);

      if (!item) throw new Error("Review item not found");

      const state: SchedulerState = {
        ease: item.ease / 100,
        intervalDays: item.intervalDays,
        reps: item.reps,
        lapses: item.lapses,
      };

      const result = scheduleReviewNext(state, {
        correct: input.passed,
        fast: input.fast,
        safetyIssue: input.safetyIssue,
      });

      await db
        .update(spacedReviewItems)
        .set({
          ease: Math.round(result.state.ease * 100),
          intervalDays: result.state.intervalDays,
          reps: result.state.reps,
          lapses: result.state.lapses,
          mastered: result.mastered,
          dueAt: new Date(result.dueAt),
          lastAttemptResult: input.passed ? "passed" : "failed",
          status: result.mastered ? "completed" : "pending",
          updatedAt: new Date(),
        })
        .where(eq(spacedReviewItems.id, input.reviewId));

      // Write evidence to the Assessment Spine — type-specific to the practice done;
      // a safety recheck always records as a safety recheck.
      try {
        const evidenceType = input.safetyIssue ? "review_safety_recheck" : reviewEvidenceType(item.itemType);
        await db.insert(competencyEvidence).values({
          learnerId: ctx.user.id,
          sourceType: "review",
          evidenceType,
          mechanicId: "spacedReinforcement",
          domain: item.domain,
          skill: item.skill,
          competencyId: item.sourceId,
          correctness: input.passed ? "correct" : "incorrect",
          safetyFlag: input.safetyIssue ?? false,
          detail: {
            reviewItemId: item.id,
            itemType: item.itemType,
            reason: item.reason,
            fast: input.fast ?? false,
            nextIntervalDays: result.state.intervalDays,
          },
        });
      } catch {
        /* Evidence must never break the review loop */
      }

      // If failed, create a "previous_needs_review" follow-up if not already existing
      if (!input.passed && item.lapses >= 2) {
        try {
          await createReviewItem(db, {
            learnerId: ctx.user.id,
            reason: "previous_needs_review",
            sourceId: item.sourceId,
            sourceLabel: item.sourceLabel,
            domain: item.domain,
            skill: item.skill ?? undefined,
            difficulty: Math.min(5, item.difficulty + 1),
          });
        } catch {
          /* Best effort */
        }
      }

      return {
        mastered: result.mastered,
        nextIntervalDays: result.state.intervalDays,
        lapses: result.state.lapses,
      };
    }),

  /**
   * Create review items from a lab/scenario attempt.
   * Called after a learner completes a fault diagnosis.
   */
  createFromAttempt: protectedProcedure
    .input(z.object({
      sourceId: z.string(),
      sourceLabel: z.string(),
      domain: z.string(),
      skill: z.string().optional(),
      difficulty: z.number().min(1).max(5).optional(),
      signals: z.object({
        passed: z.boolean(),
        rootCauseCorrect: z.boolean(),
        timeToDiagnoseSec: z.number(),
        hintsUsed: z.number(),
        methodologyScore: z.number().nullable(),
        safetyScore: z.number().nullable(),
        firstStepCorrect: z.boolean().nullable(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { created: 0 };

      const triggers = detectReviewTriggers(input.signals);
      if (triggers.length === 0) return { created: 0 };

      let created = 0;
      for (const reason of triggers) {
        try {
          await createReviewItem(db, {
            learnerId: ctx.user.id,
            reason,
            sourceId: input.sourceId,
            sourceLabel: input.sourceLabel,
            domain: input.domain,
            skill: input.skill,
            difficulty: input.difficulty,
            metadata: { signals: input.signals },
          });
          created++;
        } catch {
          /* Duplicate or constraint error — skip */
        }
      }

      return { created };
    }),

  /**
   * Create review items from a mentor session.
   * Uses the shared createMentorReviews helper so the trigger→create logic
   * lives in exactly one place.
   */
  createFromMentor: protectedProcedure
    .input(z.object({
      sourceId: z.string(),
      sourceLabel: z.string(),
      domain: z.string(),
      skill: z.string().optional(),
      signals: z.object({
        operatorCommunicationScore: z.number().nullable(),
        workOrderScore: z.number().nullable(),
        reflectionScore: z.number().nullable(),
        confidenceScore: z.number().nullable(),
        safetyIssue: z.boolean(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { created: 0 };
      const created = await createMentorReviews(db, ctx.user.id, input);
      return { created };
    }),

  /**
   * Manager view: get overdue review items for team members.
   * Scoped to the caller's ACTUAL managed team (owner/admin/manager), not all
   * learners — reuses the same resolver the Assessment Spine uses.
   */
  getTeamOverdue: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [] as TeamOverdueRow[];

    const ids = await managedMemberIds(db, ctx.user.id);
    if (ids.length === 0) return [] as TeamOverdueRow[];

    const items = await db
      .select({
        learnerId: spacedReviewItems.learnerId,
        domain: spacedReviewItems.domain,
        reason: spacedReviewItems.reason,
        priority: spacedReviewItems.priority,
        lapses: spacedReviewItems.lapses,
      })
      .from(spacedReviewItems)
      .where(
        and(
          inArray(spacedReviewItems.learnerId, ids),
          eq(spacedReviewItems.mastered, false),
          lte(spacedReviewItems.dueAt, new Date()),
        ),
      );

    // Aggregate per member: total overdue, critical count, and the weakest domain.
    const byLearner = new Map<number, { overdueCount: number; criticalCount: number; domains: Map<string, number> }>();
    for (const it of items) {
      const agg = byLearner.get(it.learnerId) ?? { overdueCount: 0, criticalCount: 0, domains: new Map<string, number>() };
      agg.overdueCount++;
      if (it.priority === "critical") agg.criticalCount++;
      agg.domains.set(it.domain, (agg.domains.get(it.domain) ?? 0) + 1);
      byLearner.set(it.learnerId, agg);
    }

    const nameById = new Map<number, string>();
    for (const uid of ids) {
      const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, uid)).limit(1);
      nameById.set(uid, u?.name ?? "Technician");
    }

    const rows: TeamOverdueRow[] = [];
    for (const [learnerId, agg] of Array.from(byLearner.entries())) {
      let worstDomain: string | null = null;
      let worstCount = 0;
      for (const [d, n] of Array.from(agg.domains.entries())) if (n > worstCount) { worstCount = n; worstDomain = d; }
      rows.push({
        learnerId,
        name: nameById.get(learnerId) ?? "Technician",
        overdueCount: agg.overdueCount,
        criticalCount: agg.criticalCount,
        weakestDomain: worstDomain,
      });
    }
    rows.sort((a, b) => b.criticalCount - a.criticalCount || b.overdueCount - a.overdueCount);
    return rows;
  }),
});

export interface TeamOverdueRow {
  learnerId: number;
  name: string;
  overdueCount: number;
  criticalCount: number;
  weakestDomain: string | null;
}
