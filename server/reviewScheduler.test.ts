/**
 * Spaced Repetition Scheduler — Unit Tests
 *
 * Tests the core scheduling logic: interval calculation, trigger detection,
 * priority assignment, and SM-2 state transitions.
 */
import { describe, it, expect } from "vitest";
import {
  scheduleReviewNext,
  getInitialInterval,
  getReviewPriority,
  getReasonDetail,
  getReviewItemType,
  detectReviewTriggers,
  detectMentorReviewTriggers,
  sortReviewItems,
  MASTERY_INTERVAL_DAYS,
  TRIGGER_THRESHOLDS,
  type SchedulerState,
  type ReviewPriority,
} from "@shared/reviewScheduler";

// ── scheduleReviewNext ───────────────────────────────────────────────────────

describe("scheduleReviewNext", () => {
  const freshState: SchedulerState = { ease: 2.5, intervalDays: 0, reps: 0, lapses: 0 };
  const now = Date.now();

  it("first correct review → interval 1 day", () => {
    const result = scheduleReviewNext(freshState, { correct: true }, now);
    expect(result.state.reps).toBe(1);
    expect(result.state.intervalDays).toBe(1);
    expect(result.mastered).toBe(false);
  });

  it("second correct review → interval 3 days", () => {
    const state: SchedulerState = { ease: 2.5, intervalDays: 1, reps: 1, lapses: 0 };
    const result = scheduleReviewNext(state, { correct: true }, now);
    expect(result.state.reps).toBe(2);
    expect(result.state.intervalDays).toBe(3);
  });

  it("third correct review → interval 7 days", () => {
    const state: SchedulerState = { ease: 2.5, intervalDays: 3, reps: 2, lapses: 0 };
    const result = scheduleReviewNext(state, { correct: true }, now);
    expect(result.state.reps).toBe(3);
    expect(result.state.intervalDays).toBe(7);
  });

  it("fourth correct review → interval stretches by ease factor", () => {
    const state: SchedulerState = { ease: 2.5, intervalDays: 7, reps: 3, lapses: 0 };
    const result = scheduleReviewNext(state, { correct: true }, now);
    expect(result.state.reps).toBe(4);
    expect(result.state.intervalDays).toBe(18); // 7 * 2.5 ≈ 18
  });

  it("mastery achieved at 21+ day interval with 3+ reps", () => {
    const state: SchedulerState = { ease: 2.5, intervalDays: 18, reps: 4, lapses: 0 };
    const result = scheduleReviewNext(state, { correct: true }, now);
    expect(result.state.intervalDays).toBeGreaterThanOrEqual(MASTERY_INTERVAL_DAYS);
    expect(result.mastered).toBe(true);
  });

  it("failed review → resets reps to 0, interval to 1 day", () => {
    const state: SchedulerState = { ease: 2.5, intervalDays: 7, reps: 3, lapses: 0 };
    const result = scheduleReviewNext(state, { correct: false }, now);
    expect(result.state.reps).toBe(0);
    expect(result.state.intervalDays).toBe(1);
    expect(result.state.lapses).toBe(1);
    expect(result.state.ease).toBeLessThan(2.5);
    expect(result.mastered).toBe(false);
  });

  it("safety issue → same-day resurface, harsh ease penalty", () => {
    const state: SchedulerState = { ease: 2.5, intervalDays: 7, reps: 3, lapses: 0 };
    const result = scheduleReviewNext(state, { correct: false, safetyIssue: true }, now);
    expect(result.state.intervalDays).toBe(0);
    expect(result.state.reps).toBe(0);
    expect(result.state.lapses).toBe(1);
    expect(result.state.ease).toBeLessThanOrEqual(2.2); // -0.3 penalty
  });

  it("ease never drops below 1.3", () => {
    const state: SchedulerState = { ease: 1.3, intervalDays: 1, reps: 0, lapses: 5 };
    const result = scheduleReviewNext(state, { correct: false, safetyIssue: true }, now);
    expect(result.state.ease).toBe(1.3);
  });

  it("fast correct answer boosts ease more than normal correct", () => {
    const resultFast = scheduleReviewNext(freshState, { correct: true, fast: true }, now);
    const resultNormal = scheduleReviewNext(freshState, { correct: true, fast: false }, now);
    expect(resultFast.state.ease).toBeGreaterThan(resultNormal.state.ease);
  });

  it("dueAt is correctly calculated from now + intervalDays", () => {
    const result = scheduleReviewNext(freshState, { correct: true }, now);
    const expectedDue = now + 1 * 24 * 60 * 60 * 1000;
    expect(result.dueAt).toBe(expectedDue);
  });
});

// ── getInitialInterval ───────────────────────────────────────────────────────

describe("getInitialInterval", () => {
  it("unsafe_action → same day (0)", () => {
    expect(getInitialInterval("unsafe_action")).toBe(0);
  });

  it("missed_root_cause → 1 day", () => {
    expect(getInitialInterval("missed_root_cause")).toBe(1);
  });

  it("excess_hints → 3 days", () => {
    expect(getInitialInterval("excess_hints")).toBe(3);
  });

  it("knowledge_decay → 7 days", () => {
    expect(getInitialInterval("knowledge_decay")).toBe(7);
  });
});

// ── getReviewPriority ────────────────────────────────────────────────────────

describe("getReviewPriority", () => {
  it("unsafe_action → critical", () => {
    expect(getReviewPriority("unsafe_action")).toBe("critical");
  });

  it("missed_root_cause → high", () => {
    expect(getReviewPriority("missed_root_cause")).toBe("high");
  });

  it("excess_hints → medium", () => {
    expect(getReviewPriority("excess_hints")).toBe("medium");
  });

  it("slow_diagnostic → low", () => {
    expect(getReviewPriority("slow_diagnostic")).toBe("low");
  });
});

// ── getReasonDetail ──────────────────────────────────────────────────────────

describe("getReasonDetail", () => {
  it("returns a non-empty string for every reason", () => {
    const reasons = [
      "missed_root_cause", "slow_diagnostic", "excess_hints",
      "weak_reasoning", "unsafe_action", "failed_reflection",
      "poor_operator_communication", "vague_work_order",
      "low_confidence", "knowledge_decay", "previous_needs_review",
    ] as const;
    for (const r of reasons) {
      expect(getReasonDetail(r).length).toBeGreaterThan(10);
    }
  });

  it("substitutes sourceLabel into the template", () => {
    const detail = getReasonDetail("missed_root_cause", "Guard Open");
    expect(detail).toContain("Guard Open");
  });
});

// ── getReviewItemType ────────────────────────────────────────────────────────

describe("getReviewItemType", () => {
  it("missed_root_cause → retry_fault", () => {
    expect(getReviewItemType("missed_root_cause")).toBe("retry_fault");
  });

  it("poor_operator_communication → practice_communication", () => {
    expect(getReviewItemType("poor_operator_communication")).toBe("practice_communication");
  });

  it("vague_work_order → practice_work_order", () => {
    expect(getReviewItemType("vague_work_order")).toBe("practice_work_order");
  });

  it("weak_reasoning → review_reasoning", () => {
    expect(getReviewItemType("weak_reasoning")).toBe("review_reasoning");
  });

  it("knowledge_decay → review_concept", () => {
    expect(getReviewItemType("knowledge_decay")).toBe("review_concept");
  });
});

// ── detectReviewTriggers ─────────────────────────────────────────────────────

describe("detectReviewTriggers", () => {
  it("perfect attempt → no triggers", () => {
    const triggers = detectReviewTriggers({
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: 60,
      hintsUsed: 0,
      methodologyScore: 90,
      safetyScore: 100,
      firstStepCorrect: true,
    });
    expect(triggers).toHaveLength(0);
  });

  it("missed root cause → triggers missed_root_cause", () => {
    const triggers = detectReviewTriggers({
      passed: false,
      rootCauseCorrect: false,
      timeToDiagnoseSec: 60,
      hintsUsed: 0,
      methodologyScore: 80,
      safetyScore: 100,
      firstStepCorrect: true,
    });
    expect(triggers).toContain("missed_root_cause");
  });

  it("slow diagnostic → triggers slow_diagnostic", () => {
    const triggers = detectReviewTriggers({
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: TRIGGER_THRESHOLDS.slowDiagnosticSec + 1,
      hintsUsed: 0,
      methodologyScore: 80,
      safetyScore: 100,
      firstStepCorrect: true,
    });
    expect(triggers).toContain("slow_diagnostic");
  });

  it("excess hints → triggers excess_hints", () => {
    const triggers = detectReviewTriggers({
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: 60,
      hintsUsed: TRIGGER_THRESHOLDS.excessHints + 1,
      methodologyScore: 80,
      safetyScore: 100,
      firstStepCorrect: true,
    });
    expect(triggers).toContain("excess_hints");
  });

  it("low safety score → triggers unsafe_action", () => {
    const triggers = detectReviewTriggers({
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: 60,
      hintsUsed: 0,
      methodologyScore: 80,
      safetyScore: TRIGGER_THRESHOLDS.unsafeSafetyScore - 1,
      firstStepCorrect: true,
    });
    expect(triggers).toContain("unsafe_action");
  });

  it("weak methodology → triggers weak_reasoning", () => {
    const triggers = detectReviewTriggers({
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: 60,
      hintsUsed: 0,
      methodologyScore: TRIGGER_THRESHOLDS.weakMethodologyScore - 1,
      safetyScore: 100,
      firstStepCorrect: true,
    });
    expect(triggers).toContain("weak_reasoning");
  });

  it("multiple issues → multiple triggers", () => {
    const triggers = detectReviewTriggers({
      passed: false,
      rootCauseCorrect: false,
      timeToDiagnoseSec: 300,
      hintsUsed: 5,
      methodologyScore: 30,
      safetyScore: 40,
      firstStepCorrect: false,
    });
    expect(triggers.length).toBeGreaterThanOrEqual(4);
    expect(triggers).toContain("unsafe_action");
    expect(triggers).toContain("missed_root_cause");
    expect(triggers).toContain("slow_diagnostic");
    expect(triggers).toContain("excess_hints");
    expect(triggers).toContain("weak_reasoning");
  });

  it("null scores are ignored (not triggered)", () => {
    const triggers = detectReviewTriggers({
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: 60,
      hintsUsed: 0,
      methodologyScore: null,
      safetyScore: null,
      firstStepCorrect: null,
    });
    expect(triggers).toHaveLength(0);
  });
});

// ── detectMentorReviewTriggers ───────────────────────────────────────────────

describe("detectMentorReviewTriggers", () => {
  it("perfect mentor session → no triggers", () => {
    const triggers = detectMentorReviewTriggers({
      operatorCommunicationScore: 90,
      workOrderScore: 85,
      reflectionScore: 80,
      confidenceScore: 70,
      safetyIssue: false,
    });
    expect(triggers).toHaveLength(0);
  });

  it("safety issue → triggers unsafe_action", () => {
    const triggers = detectMentorReviewTriggers({
      operatorCommunicationScore: 90,
      workOrderScore: 85,
      reflectionScore: 80,
      confidenceScore: 70,
      safetyIssue: true,
    });
    expect(triggers).toContain("unsafe_action");
  });

  it("poor communication → triggers poor_operator_communication", () => {
    const triggers = detectMentorReviewTriggers({
      operatorCommunicationScore: 40,
      workOrderScore: 85,
      reflectionScore: 80,
      confidenceScore: 70,
      safetyIssue: false,
    });
    expect(triggers).toContain("poor_operator_communication");
  });

  it("vague work order → triggers vague_work_order", () => {
    const triggers = detectMentorReviewTriggers({
      operatorCommunicationScore: 90,
      workOrderScore: 40,
      reflectionScore: 80,
      confidenceScore: 70,
      safetyIssue: false,
    });
    expect(triggers).toContain("vague_work_order");
  });

  it("failed reflection → triggers failed_reflection", () => {
    const triggers = detectMentorReviewTriggers({
      operatorCommunicationScore: 90,
      workOrderScore: 85,
      reflectionScore: 30,
      confidenceScore: 70,
      safetyIssue: false,
    });
    expect(triggers).toContain("failed_reflection");
  });

  it("low confidence → triggers low_confidence", () => {
    const triggers = detectMentorReviewTriggers({
      operatorCommunicationScore: 90,
      workOrderScore: 85,
      reflectionScore: 80,
      confidenceScore: 30,
      safetyIssue: false,
    });
    expect(triggers).toContain("low_confidence");
  });
});

// ── sortReviewItems ──────────────────────────────────────────────────────────

describe("sortReviewItems", () => {
  it("sorts by priority first (critical > high > medium > low)", () => {
    const items = [
      { priority: "low" as ReviewPriority, dueAt: new Date("2025-01-01") },
      { priority: "critical" as ReviewPriority, dueAt: new Date("2025-01-03") },
      { priority: "medium" as ReviewPriority, dueAt: new Date("2025-01-02") },
      { priority: "high" as ReviewPriority, dueAt: new Date("2025-01-01") },
    ];
    const sorted = sortReviewItems(items);
    expect(sorted[0].priority).toBe("critical");
    expect(sorted[1].priority).toBe("high");
    expect(sorted[2].priority).toBe("medium");
    expect(sorted[3].priority).toBe("low");
  });

  it("within same priority, sorts by due date (earliest first)", () => {
    const items = [
      { priority: "high" as ReviewPriority, dueAt: new Date("2025-01-05") },
      { priority: "high" as ReviewPriority, dueAt: new Date("2025-01-01") },
      { priority: "high" as ReviewPriority, dueAt: new Date("2025-01-03") },
    ];
    const sorted = sortReviewItems(items);
    expect(sorted[0].dueAt.getTime()).toBeLessThan(sorted[1].dueAt.getTime());
    expect(sorted[1].dueAt.getTime()).toBeLessThan(sorted[2].dueAt.getTime());
  });
});
