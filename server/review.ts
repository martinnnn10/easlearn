/**
 * Review router — the daily spaced-repetition surface (retention keystone).
 *
 *   review.backfill — enroll knowledge-check concepts from lessons the learner has
 *                     passed but hasn't started reviewing (idempotent; safe to call on load).
 *   review.getDue   — concepts due now, with their question payload, for the review queue.
 *   review.submit   — grade a review → reschedule via SM-2 (shared/spacedRepetition).
 *   review.stats    — counts for the "X due today / Y mastered" header.
 *
 * Concept = a lesson_assessment_questions row (type knowledge_check). Reuses
 * existing assessment content — no new authoring needed.
 */

import { z } from "zod";
import { eq, and, lte, inArray, sql } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { conceptReviews, lessonAssessmentQuestions, lessonAssessmentAttempts, courseLessons, courseModules, competencyEvidence } from "../drizzle/schema";
import { scheduleNext, type ReviewState } from "@shared/spacedRepetition";
import { skillDomainForModule } from "@shared/competencyMatrix";
import { reviewEvidence } from "@shared/assessmentSpine";
import { triggerReviewFromFailedRecall } from "./schedulerAutoTrigger";

/** Best-effort: map a review question → its module's skill domain (question → lesson → module). */
async function domainForQuestion(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, questionId: number): Promise<string> {
  try {
    const [q] = await db.select({ lessonId: lessonAssessmentQuestions.lessonId }).from(lessonAssessmentQuestions).where(eq(lessonAssessmentQuestions.id, questionId)).limit(1);
    if (!q) return "integration";
    const [l] = await db.select({ moduleId: courseLessons.moduleId }).from(courseLessons).where(eq(courseLessons.id, q.lessonId)).limit(1);
    if (!l) return "integration";
    const [m] = await db.select({ slug: courseModules.slug }).from(courseModules).where(eq(courseModules.id, l.moduleId)).limit(1);
    return m ? skillDomainForModule(m.slug) : "integration";
  } catch {
    return "integration";
  }
}

export const reviewRouter = router({
  backfill: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { enrolled: 0 };

    // Lessons the learner has passed at least one assessment on.
    const passed = await db
      .selectDistinct({ lessonId: lessonAssessmentAttempts.lessonId })
      .from(lessonAssessmentAttempts)
      .where(and(eq(lessonAssessmentAttempts.userId, ctx.user.id), eq(lessonAssessmentAttempts.passed, true)));
    const lessonIds = passed.map(p => p.lessonId);
    if (lessonIds.length === 0) return { enrolled: 0 };

    // Knowledge-check questions for those lessons.
    const questions = await db
      .select({ id: lessonAssessmentQuestions.id, lessonId: lessonAssessmentQuestions.lessonId })
      .from(lessonAssessmentQuestions)
      .where(
        and(
          inArray(lessonAssessmentQuestions.lessonId, lessonIds),
          eq(lessonAssessmentQuestions.type, "knowledge_check"),
        ),
      );
    if (questions.length === 0) return { enrolled: 0 };

    // Already enrolled.
    const existing = await db
      .select({ questionId: conceptReviews.questionId })
      .from(conceptReviews)
      .where(eq(conceptReviews.userId, ctx.user.id));
    const have = new Set(existing.map(e => e.questionId));

    const toEnroll = questions.filter(q => !have.has(q.id));
    if (toEnroll.length === 0) return { enrolled: 0 };

    const now = new Date();
    await db.insert(conceptReviews).values(
      toEnroll.map(q => ({
        userId: ctx.user.id,
        questionId: q.id,
        lessonId: q.lessonId,
        dueAt: now, // due immediately for first review
      })),
    );
    return { enrolled: toEnroll.length };
  }),

  getDue: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(30).default(15) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const due = await db
        .select({
          reviewId: conceptReviews.id,
          questionId: conceptReviews.questionId,
          question: lessonAssessmentQuestions.question,
          options: lessonAssessmentQuestions.options,
          correctIndex: lessonAssessmentQuestions.correctIndex,
          explanation: lessonAssessmentQuestions.explanation,
        })
        .from(conceptReviews)
        .innerJoin(lessonAssessmentQuestions, eq(conceptReviews.questionId, lessonAssessmentQuestions.id))
        .where(
          and(
            eq(conceptReviews.userId, ctx.user.id),
            eq(conceptReviews.mastered, false),
            lte(conceptReviews.dueAt, new Date()),
          ),
        )
        .limit(input?.limit ?? 15);
      return due;
    }),

  submit: protectedProcedure
    .input(z.object({ reviewId: z.number(), correct: z.boolean(), fast: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [row] = await db
        .select()
        .from(conceptReviews)
        .where(and(eq(conceptReviews.id, input.reviewId), eq(conceptReviews.userId, ctx.user.id)))
        .limit(1);
      if (!row) throw new Error("Review not found");

      const state: ReviewState = {
        ease: row.ease / 100,
        intervalDays: row.intervalDays,
        reps: row.reps,
        lapses: row.lapses,
      };
      const next = scheduleNext(state, { correct: input.correct, fast: input.fast });

      await db
        .update(conceptReviews)
        .set({
          ease: Math.round(next.state.ease * 100),
          intervalDays: next.state.intervalDays,
          reps: next.state.reps,
          lapses: next.state.lapses,
          mastered: next.mastered,
          dueAt: new Date(next.dueAt),
          lastReviewedAt: new Date(),
        })
        .where(eq(conceptReviews.id, input.reviewId));

      // Assessment Spine: delayed recall updates competency. A pass reinforces;
      // a fail signals decay → Needs Review. Best-effort; never fails the review.
      try {
        const domain = await domainForQuestion(db, row.questionId);
        const ev = reviewEvidence({ domain: domain as never, questionId: row.questionId, grade: input.correct ? 5 : 1 });
        await db.insert(competencyEvidence).values({
          learnerId: ctx.user.id,
          sourceType: "review",
          evidenceType: "review_recall",
          mechanicId: "spacedReinforcement",
          domain,
          competencyId: String(row.questionId),
          correctness: input.correct ? "correct" : "incorrect",
          safetyFlag: false,
          detail: { reviewId: input.reviewId, fast: input.fast ?? false, evidenceType: ev.evidenceType },
        });
      } catch {
        /* telemetry must never break the review loop */
      }

      // ── Auto-trigger scheduler review on repeated concept failures ─────────
      if (!input.correct && next.state.lapses >= 2) {
        try {
          const domain = await domainForQuestion(db, row.questionId);
          const [q] = await db.select({ question: lessonAssessmentQuestions.question }).from(lessonAssessmentQuestions).where(eq(lessonAssessmentQuestions.id, row.questionId)).limit(1);
          await triggerReviewFromFailedRecall(db as any, {
            learnerId: ctx.user.id,
            sourceId: `concept-${row.questionId}`,
            sourceLabel: q?.question?.slice(0, 80) ?? `Concept #${row.questionId}`,
            domain,
            lapses: next.state.lapses,
          });
        } catch {
          /* Scheduler must never break the review loop */
        }
      }

      return { mastered: next.mastered, nextIntervalDays: next.state.intervalDays };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { dueToday: 0, mastered: 0, total: 0 };
    const [counts] = await db
      .select({
        total: sql<number>`count(*)`,
        mastered: sql<number>`sum(case when ${conceptReviews.mastered} then 1 else 0 end)`,
        dueToday: sql<number>`sum(case when ${conceptReviews.mastered} = false and ${conceptReviews.dueAt} <= now() then 1 else 0 end)`,
      })
      .from(conceptReviews)
      .where(eq(conceptReviews.userId, ctx.user.id));
    return {
      dueToday: Number(counts?.dueToday ?? 0),
      mastered: Number(counts?.mastered ?? 0),
      total: Number(counts?.total ?? 0),
    };
  }),
});
