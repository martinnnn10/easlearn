/**
 * Tests for the Scheduler Auto-Trigger Module
 *
 * Tests the deduplication, anti-spam, and trigger detection logic
 * that lives in schedulerAutoTrigger.ts. Uses the shared reviewScheduler
 * functions directly since the DB layer is mocked.
 */

import { describe, it, expect } from "vitest";
import {
  detectReviewTriggers,
  detectMentorReviewTriggers,
  getInitialInterval,
  getReviewPriority,
  getReasonDetail,
  getReviewItemType,
  type LabAttemptSignals,
  type MentorSessionSignals,
} from "@shared/reviewScheduler";

// ── Trigger Detection Tests ─────────────────────────────────────────────────

describe("detectReviewTriggers — Lab/Scenario Attempt", () => {
  it("returns empty array for a clean pass", () => {
    const signals: LabAttemptSignals = {
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: 60,
      hintsUsed: 0,
      methodologyScore: 90,
      safetyScore: 100,
      firstStepCorrect: true,
    };
    expect(detectReviewTriggers(signals)).toEqual([]);
  });

  it("triggers missed_root_cause when root cause is wrong", () => {
    const signals: LabAttemptSignals = {
      passed: false,
      rootCauseCorrect: false,
      timeToDiagnoseSec: 120,
      hintsUsed: 1,
      methodologyScore: 50,
      safetyScore: 100,
      firstStepCorrect: true,
    };
    const triggers = detectReviewTriggers(signals);
    expect(triggers).toContain("missed_root_cause");
  });

  it("triggers slow_diagnostic for time > 180s", () => {
    const signals: LabAttemptSignals = {
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: 200,
      hintsUsed: 0,
      methodologyScore: 80,
      safetyScore: 100,
      firstStepCorrect: true,
    };
    const triggers = detectReviewTriggers(signals);
    expect(triggers).toContain("slow_diagnostic");
  });

  it("triggers excess_hints when hints > 2", () => {
    const signals: LabAttemptSignals = {
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: 100,
      hintsUsed: 3,
      methodologyScore: 70,
      safetyScore: 100,
      firstStepCorrect: true,
    };
    const triggers = detectReviewTriggers(signals);
    expect(triggers).toContain("excess_hints");
  });

  it("triggers unsafe_action when safety score is 0", () => {
    const signals: LabAttemptSignals = {
      passed: false,
      rootCauseCorrect: false,
      timeToDiagnoseSec: 200,
      hintsUsed: 0,
      methodologyScore: 40,
      safetyScore: 0,
      firstStepCorrect: false,
    };
    const triggers = detectReviewTriggers(signals);
    expect(triggers).toContain("unsafe_action");
  });

  it("triggers weak_reasoning when methodology < 50", () => {
    const signals: LabAttemptSignals = {
      passed: false,
      rootCauseCorrect: false,
      timeToDiagnoseSec: 200,
      hintsUsed: 1,
      methodologyScore: 30,
      safetyScore: 100,
      firstStepCorrect: false,
    };
    const triggers = detectReviewTriggers(signals);
    expect(triggers).toContain("weak_reasoning");
  });

  it("can trigger multiple reasons from a single bad attempt", () => {
    const signals: LabAttemptSignals = {
      passed: false,
      rootCauseCorrect: false,
      timeToDiagnoseSec: 500,
      hintsUsed: 5,
      methodologyScore: 20,
      safetyScore: 0,
      firstStepCorrect: false,
    };
    const triggers = detectReviewTriggers(signals);
    expect(triggers.length).toBeGreaterThanOrEqual(3);
    expect(triggers).toContain("missed_root_cause");
    expect(triggers).toContain("unsafe_action");
    expect(triggers).toContain("slow_diagnostic");
  });

  it("does not trigger slow_diagnostic for time <= 180s", () => {
    const signals: LabAttemptSignals = {
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: 179,
      hintsUsed: 0,
      methodologyScore: 80,
      safetyScore: 100,
      firstStepCorrect: true,
    };
    const triggers = detectReviewTriggers(signals);
    expect(triggers).not.toContain("slow_diagnostic");
  });

  it("does not trigger excess_hints for hints <= 2", () => {
    const signals: LabAttemptSignals = {
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: 100,
      hintsUsed: 2,
      methodologyScore: 80,
      safetyScore: 100,
      firstStepCorrect: true,
    };
    const triggers = detectReviewTriggers(signals);
    expect(triggers).not.toContain("excess_hints");
  });
});

describe("detectMentorReviewTriggers — Mentor Session", () => {
  it("returns empty array for a strong session", () => {
    const signals: MentorSessionSignals = {
      operatorCommunicationScore: 90,
      workOrderScore: 85,
      reflectionScore: 80,
      confidenceScore: 75,
      safetyIssue: false,
    };
    expect(detectMentorReviewTriggers(signals)).toEqual([]);
  });

  it("triggers unsafe_action for safety issues", () => {
    const signals: MentorSessionSignals = {
      operatorCommunicationScore: 80,
      workOrderScore: 80,
      reflectionScore: 80,
      confidenceScore: 80,
      safetyIssue: true,
    };
    const triggers = detectMentorReviewTriggers(signals);
    expect(triggers).toContain("unsafe_action");
  });

  it("triggers poor_operator_communication for low comm score", () => {
    const signals: MentorSessionSignals = {
      operatorCommunicationScore: 30,
      workOrderScore: 80,
      reflectionScore: 80,
      confidenceScore: 80,
      safetyIssue: false,
    };
    const triggers = detectMentorReviewTriggers(signals);
    expect(triggers).toContain("poor_operator_communication");
  });

  it("triggers vague_work_order for low work order score", () => {
    const signals: MentorSessionSignals = {
      operatorCommunicationScore: 80,
      workOrderScore: 30,
      reflectionScore: 80,
      confidenceScore: 80,
      safetyIssue: false,
    };
    const triggers = detectMentorReviewTriggers(signals);
    expect(triggers).toContain("vague_work_order");
  });

  it("triggers failed_reflection for low reflection score", () => {
    const signals: MentorSessionSignals = {
      operatorCommunicationScore: 80,
      workOrderScore: 80,
      reflectionScore: 30,
      confidenceScore: 80,
      safetyIssue: false,
    };
    const triggers = detectMentorReviewTriggers(signals);
    expect(triggers).toContain("failed_reflection");
  });

  it("triggers low_confidence for low confidence score", () => {
    const signals: MentorSessionSignals = {
      operatorCommunicationScore: 80,
      workOrderScore: 80,
      reflectionScore: 80,
      confidenceScore: 30,
      safetyIssue: false,
    };
    const triggers = detectMentorReviewTriggers(signals);
    expect(triggers).toContain("low_confidence");
  });

  it("handles null scores gracefully", () => {
    const signals: MentorSessionSignals = {
      operatorCommunicationScore: null,
      workOrderScore: null,
      reflectionScore: null,
      confidenceScore: null,
      safetyIssue: false,
    };
    expect(detectMentorReviewTriggers(signals)).toEqual([]);
  });
});

// ── Scheduling Logic Tests ──────────────────────────────────────────────────

describe("getInitialInterval — Interval Assignment", () => {
  it("assigns 0 days (immediate) for unsafe_action", () => {
    expect(getInitialInterval("unsafe_action")).toBe(0);
  });

  it("assigns short interval for missed_root_cause", () => {
    const interval = getInitialInterval("missed_root_cause");
    expect(interval).toBeLessThanOrEqual(1);
  });

  it("assigns longer interval for slow_diagnostic", () => {
    const interval = getInitialInterval("slow_diagnostic");
    expect(interval).toBeGreaterThanOrEqual(1);
  });

  it("assigns interval for knowledge_decay", () => {
    const interval = getInitialInterval("knowledge_decay");
    expect(interval).toBeGreaterThanOrEqual(0);
  });
});

describe("getReviewPriority — Priority Assignment", () => {
  it("assigns critical priority for unsafe_action", () => {
    expect(getReviewPriority("unsafe_action")).toBe("critical");
  });

  it("assigns high priority for missed_root_cause", () => {
    expect(getReviewPriority("missed_root_cause")).toBe("high");
  });

  it("assigns medium or lower for slow_diagnostic", () => {
    const priority = getReviewPriority("slow_diagnostic");
    expect(["medium", "low"]).toContain(priority);
  });

  it("assigns medium for excess_hints", () => {
    const priority = getReviewPriority("excess_hints");
    expect(["medium", "low"]).toContain(priority);
  });
});

describe("getReviewItemType — Item Type Mapping", () => {
  it("maps unsafe_action to retry_fault (re-attempt the scenario safely)", () => {
    expect(getReviewItemType("unsafe_action")).toBe("retry_fault");
  });

  it("maps missed_root_cause to retry_fault", () => {
    expect(getReviewItemType("missed_root_cause")).toBe("retry_fault");
  });

  it("maps poor_operator_communication to practice_communication", () => {
    expect(getReviewItemType("poor_operator_communication")).toBe("practice_communication");
  });

  it("maps vague_work_order to practice_work_order", () => {
    expect(getReviewItemType("vague_work_order")).toBe("practice_work_order");
  });

  it("maps weak_reasoning to review_reasoning", () => {
    expect(getReviewItemType("weak_reasoning")).toBe("review_reasoning");
  });
});

describe("getReasonDetail — Human-Readable Explanations", () => {
  it("includes the source label in the detail", () => {
    const detail = getReasonDetail("missed_root_cause", "Guard Interlock Fault");
    expect(detail).toContain("Guard Interlock Fault");
  });

  it("produces a non-empty string for all reasons", () => {
    const reasons = [
      "missed_root_cause", "slow_diagnostic", "excess_hints",
      "weak_reasoning", "unsafe_action", "failed_reflection",
      "poor_operator_communication", "vague_work_order",
      "low_confidence", "knowledge_decay", "previous_needs_review",
    ] as const;
    for (const reason of reasons) {
      const detail = getReasonDetail(reason, "Test Source");
      expect(detail.length).toBeGreaterThan(0);
    }
  });
});

// ── Deduplication & Anti-Spam Logic Tests ───────────────────────────────────

describe("Deduplication and Anti-Spam (unit-level)", () => {
  it("MAX_PENDING_PER_LEARNER is 15", async () => {
    const { MAX_PENDING_PER_LEARNER } = await import("./schedulerAutoTrigger");
    expect(MAX_PENDING_PER_LEARNER).toBe(15);
  });

  it("DEDUP_WINDOW_HOURS is 24", async () => {
    const { DEDUP_WINDOW_HOURS } = await import("./schedulerAutoTrigger");
    expect(DEDUP_WINDOW_HOURS).toBe(24);
  });
});

// ── Integration Scenario Tests ──────────────────────────────────────────────

describe("End-to-End Trigger Scenarios", () => {
  it("a perfect attempt generates zero triggers", () => {
    const signals: LabAttemptSignals = {
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: 90,
      hintsUsed: 0,
      methodologyScore: 95,
      safetyScore: 100,
      firstStepCorrect: true,
    };
    expect(detectReviewTriggers(signals)).toHaveLength(0);
  });

  it("a catastrophic failure generates max triggers", () => {
    const signals: LabAttemptSignals = {
      passed: false,
      rootCauseCorrect: false,
      timeToDiagnoseSec: 600,
      hintsUsed: 10,
      methodologyScore: 10,
      safetyScore: 0,
      firstStepCorrect: false,
    };
    const triggers = detectReviewTriggers(signals);
    // Should trigger at least: missed_root_cause, slow_diagnostic, excess_hints, unsafe_action, weak_reasoning
    expect(triggers.length).toBeGreaterThanOrEqual(4);
  });

  it("a mentor safety issue always creates a critical review", () => {
    const signals: MentorSessionSignals = {
      operatorCommunicationScore: 90,
      workOrderScore: 90,
      reflectionScore: 90,
      confidenceScore: 90,
      safetyIssue: true,
    };
    const triggers = detectMentorReviewTriggers(signals);
    expect(triggers).toContain("unsafe_action");
    // And the priority for unsafe_action should be critical
    expect(getReviewPriority("unsafe_action")).toBe("critical");
  });

  it("a borderline pass with slow time still triggers review", () => {
    const signals: LabAttemptSignals = {
      passed: true,
      rootCauseCorrect: true,
      timeToDiagnoseSec: 200,
      hintsUsed: 2,
      methodologyScore: 65,
      safetyScore: 100,
      firstStepCorrect: false,
    };
    const triggers = detectReviewTriggers(signals);
    expect(triggers).toContain("slow_diagnostic");
    // But should NOT trigger missed_root_cause since it was correct
    expect(triggers).not.toContain("missed_root_cause");
  });

  it("unsafe_action always gets immediate interval (0 days)", () => {
    expect(getInitialInterval("unsafe_action")).toBe(0);
  });

  it("all review item types are valid enum values", () => {
    const validTypes = [
      "retry_fault", "review_concept", "repeat_simulation",
      "explain_fault", "practice_work_order", "practice_communication",
      "review_safety", "review_reasoning",
    ];
    const reasons = [
      "missed_root_cause", "slow_diagnostic", "excess_hints",
      "weak_reasoning", "unsafe_action", "failed_reflection",
      "poor_operator_communication", "vague_work_order",
      "low_confidence", "knowledge_decay", "previous_needs_review",
    ] as const;
    for (const reason of reasons) {
      const itemType = getReviewItemType(reason);
      expect(validTypes).toContain(itemType);
    }
  });
});
