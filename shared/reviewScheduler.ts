/**
 * Spaced Repetition Scheduler — Competency Durability Engine
 *
 * This is NOT "study reminders." This is proof that EASLearn measures whether
 * maintenance competency lasts. A VP of Maintenance does not only care who passed
 * once. They care who will still troubleshoot correctly next week, next month,
 * and under pressure on the floor.
 *
 * The scheduler resurfaces faults, lessons, and scenarios the learner struggled
 * with, based on performance signals — not arbitrary timers.
 *
 * Intervals are tuned for safety-critical industrial skills:
 *   - Same day: unsafe action or major safety miss
 *   - 1 day: weak reasoning, failed reflection
 *   - 3 days: partial success, excess hints
 *   - 7 days: strong success
 *   - 14+ days: repeated success (stretching via SM-2 ease factor)
 *
 * Pure functions — no I/O — so it's unit-testable and shared by client and server.
 */

import type { SkillDomain } from "./competencyMatrix";

// ── Types ────────────────────────────────────────────────────────────────────

/** What kind of activity the review asks the learner to do. */
export type ReviewItemType =
  | "retry_fault"            // Re-diagnose this fault in the conveyor lab
  | "review_concept"         // Answer knowledge-check questions on this topic
  | "repeat_simulation"      // Re-run this simulator scenario
  | "explain_fault"          // Explain the root cause in your own words
  | "practice_work_order"    // Write a proper work order for this situation
  | "practice_communication" // Practice operator communication
  | "review_safety"          // Review safety-critical decision
  | "review_reasoning";      // Review diagnostic reasoning method

/** Why the review was assigned. */
export type ReviewReason =
  | "missed_root_cause"
  | "slow_diagnostic"
  | "excess_hints"
  | "weak_reasoning"
  | "unsafe_action"
  | "failed_reflection"
  | "poor_operator_communication"
  | "vague_work_order"
  | "low_confidence"
  | "knowledge_decay"
  | "previous_needs_review";

/** Priority levels — safety always comes first. */
export type ReviewPriority = "critical" | "high" | "medium" | "low";

/** Status of a review item. */
export type ReviewStatus = "pending" | "in_progress" | "completed" | "skipped";

/** The result of the last attempt at this review item. */
export type LastAttemptResult = "not_attempted" | "passed" | "failed" | "partial";

/** A review item as stored in the database. */
export interface ReviewItem {
  id: number;
  learnerId: number;
  /** What kind of review activity */
  itemType: ReviewItemType;
  /** Source reference (e.g., fault ID, scenario slug, lesson ID) */
  sourceId: string;
  /** Human-readable label for the source */
  sourceLabel: string;
  /** Skill domain this review targets */
  domain: SkillDomain;
  /** Specific skill within the domain */
  skill: string;
  /** Why this review was assigned */
  reason: ReviewReason;
  /** Human-readable explanation of why */
  reasonDetail: string;
  /** Priority level */
  priority: ReviewPriority;
  /** Difficulty tier (1-5) */
  difficulty: number;
  /** Current status */
  status: ReviewStatus;
  /** SM-2 interval in days */
  intervalDays: number;
  /** SM-2 ease factor (×100 for integer storage) */
  ease: number;
  /** Consecutive successful reviews */
  reps: number;
  /** Times the learner failed this review */
  lapses: number;
  /** When this review is next due */
  dueAt: Date;
  /** Result of the last attempt */
  lastAttemptResult: LastAttemptResult;
  /** Created timestamp */
  createdAt: Date;
}

// ── Interval Logic ───────────────────────────────────────────────────────────

/** Initial intervals based on the reason the review was created. */
const INITIAL_INTERVALS: Record<ReviewReason, number> = {
  unsafe_action: 0,             // Same day — safety-critical
  missed_root_cause: 1,         // Tomorrow
  weak_reasoning: 1,            // Tomorrow
  failed_reflection: 1,         // Tomorrow
  poor_operator_communication: 1, // Tomorrow
  vague_work_order: 1,          // Tomorrow
  excess_hints: 3,              // 3 days
  slow_diagnostic: 3,           // 3 days
  low_confidence: 3,            // 3 days
  knowledge_decay: 7,           // 1 week
  previous_needs_review: 1,     // Tomorrow
};

/** Priority assignment based on reason. */
const REASON_PRIORITY: Record<ReviewReason, ReviewPriority> = {
  unsafe_action: "critical",
  missed_root_cause: "high",
  weak_reasoning: "high",
  failed_reflection: "medium",
  poor_operator_communication: "medium",
  vague_work_order: "medium",
  excess_hints: "medium",
  slow_diagnostic: "low",
  low_confidence: "low",
  knowledge_decay: "low",
  previous_needs_review: "medium",
};

/** Human-readable templates for why a review was assigned. */
const REASON_TEMPLATES: Record<ReviewReason, string> = {
  missed_root_cause: "Assigned because your last diagnosis of this fault missed the root cause.",
  slow_diagnostic: "Assigned because your diagnostic time was significantly above target.",
  excess_hints: "Assigned because you used multiple hints during this diagnostic.",
  weak_reasoning: "Assigned because your diagnostic reasoning was incomplete or flawed.",
  unsafe_action: "Assigned because a safety-critical action was missed or incorrect.",
  failed_reflection: "Assigned because your reflection on the diagnostic process was incomplete.",
  poor_operator_communication: "Assigned because your operator communication needs improvement.",
  vague_work_order: "Assigned because your work order documentation was too vague.",
  low_confidence: "Assigned because your confidence level was low on this skill.",
  knowledge_decay: "Assigned because this skill hasn't been practiced recently and may be decaying.",
  previous_needs_review: "Assigned because a previous review attempt was unsuccessful.",
};

export interface SchedulerState {
  ease: number;       // SM-2 ease factor (e.g., 2.5)
  intervalDays: number;
  reps: number;
  lapses: number;
}

export interface SchedulerOutcome {
  correct: boolean;
  /** Was the response fast (under target time)? */
  fast?: boolean;
  /** Was there a safety issue during the review? */
  safetyIssue?: boolean;
}

export interface ScheduleResult {
  state: SchedulerState;
  dueAt: number;       // ms epoch
  mastered: boolean;
}

/** Mastery threshold: 21+ day interval means the skill is durable. */
export const MASTERY_INTERVAL_DAYS = 21;

/**
 * Compute the next schedule after a review attempt.
 * Safety-critical failures always reset to same-day regardless of prior state.
 */
export function scheduleReviewNext(
  state: SchedulerState,
  outcome: SchedulerOutcome,
  now: number = Date.now(),
): ScheduleResult {
  let { ease, intervalDays, reps, lapses } = state;

  if (outcome.safetyIssue) {
    // Safety-critical failure: immediate resurface, harsh penalty
    reps = 0;
    lapses += 1;
    intervalDays = 0; // Same day
    ease = Math.max(1.3, ease - 0.3);
  } else if (!outcome.correct) {
    // Failed review: reset reps, see it tomorrow, reduce ease
    reps = 0;
    lapses += 1;
    intervalDays = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    // Successful review: stretch interval
    reps += 1;
    if (reps === 1) intervalDays = 1;
    else if (reps === 2) intervalDays = 3;
    else if (reps === 3) intervalDays = 7;
    else intervalDays = Math.round(intervalDays * ease);

    // SM-2 ease update (quality 5 if fast, 4 if normal correct)
    const q = outcome.fast ? 5 : 4;
    ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  }

  const dueAt = now + intervalDays * 24 * 60 * 60 * 1000;
  const mastered = intervalDays >= MASTERY_INTERVAL_DAYS && reps >= 3;

  return { state: { ease, intervalDays, reps, lapses }, dueAt, mastered };
}

/**
 * Get the initial interval for a new review item based on the trigger reason.
 */
export function getInitialInterval(reason: ReviewReason): number {
  return INITIAL_INTERVALS[reason];
}

/**
 * Get the priority for a review item based on the trigger reason.
 */
export function getReviewPriority(reason: ReviewReason): ReviewPriority {
  return REASON_PRIORITY[reason];
}

/**
 * Get the human-readable reason detail string.
 */
export function getReasonDetail(reason: ReviewReason, sourceLabel?: string): string {
  const template = REASON_TEMPLATES[reason];
  if (sourceLabel) {
    return template.replace("this fault", `"${sourceLabel}"`).replace("this diagnostic", `"${sourceLabel}"`).replace("this skill", `"${sourceLabel}"`);
  }
  return template;
}

/**
 * Determine what review item type to create based on the trigger reason.
 */
export function getReviewItemType(reason: ReviewReason): ReviewItemType {
  switch (reason) {
    case "missed_root_cause":
    case "unsafe_action":
      return "retry_fault";
    case "slow_diagnostic":
    case "excess_hints":
      return "retry_fault";
    case "weak_reasoning":
    case "failed_reflection":
      return "review_reasoning";
    case "poor_operator_communication":
      return "practice_communication";
    case "vague_work_order":
      return "practice_work_order";
    case "low_confidence":
    case "knowledge_decay":
      return "review_concept";
    case "previous_needs_review":
      return "retry_fault";
  }
}

/**
 * Map a review item's type to the Assessment-Spine evidence type written when the
 * learner completes it, so the spine's evidence vocabulary reflects the practice
 * performed (fault retry, reasoning, safety, communication, work order, recall).
 */
export function reviewEvidenceType(itemType: ReviewItemType): string {
  switch (itemType) {
    case "retry_fault":
    case "repeat_simulation":
      return "review_fault_retry";
    case "explain_fault":
    case "review_reasoning":
      return "review_reasoning_check";
    case "review_safety":
      return "review_safety_recheck";
    case "practice_communication":
      return "review_operator_communication";
    case "practice_work_order":
      return "review_work_order_documentation";
    case "review_concept":
      return "review_recall";
  }
}

// ── Trigger Detection ────────────────────────────────────────────────────────

/** Thresholds for triggering review items from lab/scenario attempts. */
export const TRIGGER_THRESHOLDS = {
  /** Time in seconds above which a diagnostic is considered "slow" */
  slowDiagnosticSec: 180,
  /** Number of hints above which is considered "excess" */
  excessHints: 2,
  /** Methodology score below which reasoning is "weak" */
  weakMethodologyScore: 50,
  /** Safety score below which is an "unsafe action" */
  unsafeSafetyScore: 60,
  /** Confidence score below which is "low confidence" */
  lowConfidenceScore: 40,
} as const;

export interface LabAttemptSignals {
  passed: boolean;
  rootCauseCorrect: boolean;
  timeToDiagnoseSec: number;
  hintsUsed: number;
  methodologyScore: number | null;
  safetyScore: number | null;
  firstStepCorrect: boolean | null;
}

/**
 * Analyze a lab/scenario attempt and return which review reasons should be triggered.
 * Returns empty array if the attempt was strong enough to not need review.
 */
export function detectReviewTriggers(signals: LabAttemptSignals): ReviewReason[] {
  const triggers: ReviewReason[] = [];

  // Safety-critical: always check first
  if (signals.safetyScore !== null && signals.safetyScore < TRIGGER_THRESHOLDS.unsafeSafetyScore) {
    triggers.push("unsafe_action");
  }

  // Missed root cause
  if (!signals.rootCauseCorrect) {
    triggers.push("missed_root_cause");
  }

  // Slow diagnostic
  if (signals.timeToDiagnoseSec > TRIGGER_THRESHOLDS.slowDiagnosticSec) {
    triggers.push("slow_diagnostic");
  }

  // Excess hints
  if (signals.hintsUsed > TRIGGER_THRESHOLDS.excessHints) {
    triggers.push("excess_hints");
  }

  // Weak reasoning/methodology
  if (signals.methodologyScore !== null && signals.methodologyScore < TRIGGER_THRESHOLDS.weakMethodologyScore) {
    triggers.push("weak_reasoning");
  }

  return triggers;
}

export interface MentorSessionSignals {
  operatorCommunicationScore: number | null;
  workOrderScore: number | null;
  reflectionScore: number | null;
  confidenceScore: number | null;
  safetyIssue: boolean;
}

/**
 * Analyze an AI mentor session and return which review reasons should be triggered.
 */
export function detectMentorReviewTriggers(signals: MentorSessionSignals): ReviewReason[] {
  const triggers: ReviewReason[] = [];

  if (signals.safetyIssue) {
    triggers.push("unsafe_action");
  }

  if (signals.operatorCommunicationScore !== null && signals.operatorCommunicationScore < 60) {
    triggers.push("poor_operator_communication");
  }

  if (signals.workOrderScore !== null && signals.workOrderScore < 60) {
    triggers.push("vague_work_order");
  }

  if (signals.reflectionScore !== null && signals.reflectionScore < 50) {
    triggers.push("failed_reflection");
  }

  if (signals.confidenceScore !== null && signals.confidenceScore < TRIGGER_THRESHOLDS.lowConfidenceScore) {
    triggers.push("low_confidence");
  }

  return triggers;
}

/** Sort priority: critical > high > medium > low */
const PRIORITY_ORDER: Record<ReviewPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Sort review items by priority (safety first), then by due date.
 */
export function sortReviewItems<T extends { priority: ReviewPriority; dueAt: Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pDiff !== 0) return pDiff;
    return a.dueAt.getTime() - b.dueAt.getTime();
  });
}
