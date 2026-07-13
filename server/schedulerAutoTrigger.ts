/**
 * Scheduler Auto-Trigger Module
 *
 * This module is the SINGLE place where automatic review creation happens.
 * It is called from:
 *   1. recordFaultCompetencyAttempt (lab/scenario attempts)
 *   2. review.submit (concept review failures)
 *   3. mentor.coach (mentor session evidence)
 *
 * It handles:
 *   - Signal detection (what went wrong)
 *   - Deduplication (no duplicate reviews within a window)
 *   - Anti-spam (max pending reviews per learner)
 *   - Review creation with proper intervals and priority
 *
 * This is NOT a reminder feature. This is retention intelligence.
 */

import { and, eq, gte, sql } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { spacedReviewItems } from "../drizzle/schema";
import {
  detectReviewTriggers,
  detectMentorReviewTriggers,
  getInitialInterval,
  getReviewPriority,
  getReasonDetail,
  getReviewItemType,
  type ReviewReason,
  type LabAttemptSignals,
  type MentorSessionSignals,
} from "@shared/reviewScheduler";

type Db = MySql2Database<Record<string, unknown>>;

// ── Configuration ───────────────────────────────────────────────────────────

/** Maximum pending (non-mastered, non-completed) reviews per learner. */
const MAX_PENDING_PER_LEARNER = 15;

/** Deduplication window in hours — no duplicate (learner, sourceId, reason) within this window. */
const DEDUP_WINDOW_HOURS = 24;

// ── Deduplication ───────────────────────────────────────────────────────────

/**
 * Check if a review item already exists for this learner/source/reason
 * within the deduplication window. Returns true if a duplicate exists.
 */
async function isDuplicate(
  db: Db,
  learnerId: number,
  sourceId: string,
  reason: ReviewReason,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000);

  const [existing] = await db
    .select({ id: spacedReviewItems.id })
    .from(spacedReviewItems)
    .where(
      and(
        eq(spacedReviewItems.learnerId, learnerId),
        eq(spacedReviewItems.sourceId, sourceId),
        eq(spacedReviewItems.reason, reason),
        gte(spacedReviewItems.createdAt, windowStart),
      ),
    )
    .limit(1);

  return !!existing;
}

/**
 * Check if the learner has hit the anti-spam cap.
 * Returns true if they already have MAX_PENDING_PER_LEARNER pending items.
 */
async function isAtCap(db: Db, learnerId: number): Promise<boolean> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(spacedReviewItems)
    .where(
      and(
        eq(spacedReviewItems.learnerId, learnerId),
        eq(spacedReviewItems.mastered, false),
        eq(spacedReviewItems.status, "pending"),
      ),
    );

  return (result?.count ?? 0) >= MAX_PENDING_PER_LEARNER;
}

// ── Review Item Creation (with dedup + cap) ─────────────────────────────────

interface CreateReviewParams {
  learnerId: number;
  reason: ReviewReason;
  sourceId: string;
  sourceLabel: string;
  domain: string;
  skill?: string;
  difficulty?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Create a single review item with deduplication and anti-spam checks.
 * Returns true if created, false if skipped (duplicate or at cap).
 */
async function createReviewIfNeeded(db: Db, params: CreateReviewParams): Promise<boolean> {
  // Check dedup first (cheap query)
  if (await isDuplicate(db, params.learnerId, params.sourceId, params.reason)) {
    return false;
  }

  // Check anti-spam cap (only for non-critical items)
  const priority = getReviewPriority(params.reason);
  if (priority !== "critical" && await isAtCap(db, params.learnerId)) {
    return false;
  }

  const intervalDays = getInitialInterval(params.reason);
  const dueAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
  const itemType = getReviewItemType(params.reason);
  const reasonDetail = getReasonDetail(params.reason, params.sourceLabel);

  try {
    await db.insert(spacedReviewItems).values({
      learnerId: params.learnerId,
      itemType,
      sourceId: params.sourceId,
      sourceLabel: params.sourceLabel,
      domain: params.domain,
      skill: params.skill ?? null,
      reason: params.reason,
      reasonDetail,
      priority,
      difficulty: params.difficulty ?? 3,
      dueAt,
      metadata: params.metadata ?? null,
    });
    return true;
  } catch {
    // Constraint violation or other DB error — best effort
    return false;
  }
}

// ── Public API: Auto-Trigger from Lab/Scenario Attempts ─────────────────────

export interface AttemptTriggerInput {
  learnerId: number;
  sourceId: string;       // scenario slug or fault ID
  sourceLabel: string;    // human-readable title
  domain: string;         // fault domain
  skill?: string;
  difficulty?: number;    // 1-5
  signals: LabAttemptSignals;
}

/**
 * Automatically create review items after a lab/scenario attempt.
 * Called from recordFaultCompetencyAttempt.
 *
 * Returns the number of review items created.
 */
export async function triggerReviewsFromAttempt(
  db: Db,
  input: AttemptTriggerInput,
): Promise<number> {
  const triggers = detectReviewTriggers(input.signals);
  if (triggers.length === 0) return 0;

  let created = 0;
  for (const reason of triggers) {
    const success = await createReviewIfNeeded(db, {
      learnerId: input.learnerId,
      reason,
      sourceId: input.sourceId,
      sourceLabel: input.sourceLabel,
      domain: input.domain,
      skill: input.skill,
      difficulty: input.difficulty,
      metadata: { signals: input.signals, triggeredAt: Date.now() },
    });
    if (success) created++;
  }

  return created;
}

// ── Public API: Auto-Trigger from Mentor Sessions ───────────────────────────

export interface MentorTriggerInput {
  learnerId: number;
  sourceId: string;       // lesson or scenario reference
  sourceLabel: string;    // human-readable title
  domain: string;
  skill?: string;
  signals: MentorSessionSignals;
}

/**
 * Automatically create review items after a mentor session.
 * Called from mentor.coach when evidence is emitted.
 *
 * Returns the number of review items created.
 */
export async function triggerReviewsFromMentor(
  db: Db,
  input: MentorTriggerInput,
): Promise<number> {
  const triggers = detectMentorReviewTriggers(input.signals);
  if (triggers.length === 0) return 0;

  let created = 0;
  for (const reason of triggers) {
    const success = await createReviewIfNeeded(db, {
      learnerId: input.learnerId,
      reason,
      sourceId: input.sourceId,
      sourceLabel: input.sourceLabel,
      domain: input.domain,
      skill: input.skill,
      metadata: { signals: input.signals, triggeredAt: Date.now() },
    });
    if (success) created++;
  }

  return created;
}

// ── Public API: Auto-Trigger from Failed Concept Review ─────────────────────

export interface ReviewFailureTriggerInput {
  learnerId: number;
  sourceId: string;       // question ID or concept ID
  sourceLabel: string;    // question text or concept name
  domain: string;
  skill?: string;
  lapses: number;         // how many times this review has been failed
}

/**
 * Automatically create a scheduler item when a concept review is failed.
 * Only triggers if the learner has failed the same concept multiple times (lapses >= 2).
 *
 * Returns true if a review item was created.
 */
export async function triggerReviewFromFailedRecall(
  db: Db,
  input: ReviewFailureTriggerInput,
): Promise<boolean> {
  // Only trigger after repeated failures — single misses are handled by the concept review's own SM-2
  if (input.lapses < 2) return false;

  return createReviewIfNeeded(db, {
    learnerId: input.learnerId,
    reason: "previous_needs_review",
    sourceId: input.sourceId,
    sourceLabel: input.sourceLabel,
    domain: input.domain,
    skill: input.skill,
    difficulty: Math.min(5, input.lapses + 1),
    metadata: { lapses: input.lapses, triggeredAt: Date.now() },
  });
}

// ── Exported Constants for Testing ──────────────────────────────────────────

export { MAX_PENDING_PER_LEARNER, DEDUP_WINDOW_HOURS };
