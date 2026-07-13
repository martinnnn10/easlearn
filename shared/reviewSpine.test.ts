import { describe, it, expect } from "vitest";
import { interpretEvidence, readinessCells, type EvidenceEvent } from "./assessmentSpine";
import { reviewEvidenceType, getReviewItemType, type ReviewReason } from "./reviewScheduler";

function reviewEvent(evidenceType: string, correct: boolean, domain = "plc"): EvidenceEvent {
  return {
    sourceType: "review",
    evidenceType: evidenceType as EvidenceEvent["evidenceType"],
    mechanicId: "spacedReinforcement",
    domain: domain as EvidenceEvent["domain"],
    correctness: correct ? "correct" : "incorrect",
    safetyFlag: false,
    createdAt: new Date().toISOString(),
  };
}

describe("reviewEvidenceType — review item → Assessment-Spine evidence type", () => {
  it("fault / simulation retries → review_fault_retry", () => {
    expect(reviewEvidenceType("retry_fault")).toBe("review_fault_retry");
    expect(reviewEvidenceType("repeat_simulation")).toBe("review_fault_retry");
  });

  it("explain / reasoning → review_reasoning_check", () => {
    expect(reviewEvidenceType("explain_fault")).toBe("review_reasoning_check");
    expect(reviewEvidenceType("review_reasoning")).toBe("review_reasoning_check");
  });

  it("safety → review_safety_recheck", () => {
    expect(reviewEvidenceType("review_safety")).toBe("review_safety_recheck");
  });

  it("operator communication → review_operator_communication", () => {
    expect(reviewEvidenceType("practice_communication")).toBe("review_operator_communication");
  });

  it("work order → review_work_order_documentation", () => {
    expect(reviewEvidenceType("practice_work_order")).toBe("review_work_order_documentation");
  });

  it("concept → review_recall", () => {
    expect(reviewEvidenceType("review_concept")).toBe("review_recall");
  });

  it("every trigger reason ultimately maps to a known review_* evidence type", () => {
    const reasons: ReviewReason[] = [
      "missed_root_cause", "slow_diagnostic", "excess_hints", "weak_reasoning",
      "unsafe_action", "failed_reflection", "poor_operator_communication",
      "vague_work_order", "low_confidence", "knowledge_decay", "previous_needs_review",
    ];
    for (const r of reasons) {
      expect(reviewEvidenceType(getReviewItemType(r)).startsWith("review_")).toBe(true);
    }
  });
});

describe("review evidence writes correctly into the Assessment Spine", () => {
  it("a FAILED review surfaces Needs Review (decay), never mastery", () => {
    const sig = interpretEvidence(reviewEvent("review_fault_retry", false));
    expect(sig.direction).toBe("needs_review");
  });

  it("a PASSED review CONFIRMS retention but does not 'improve' toward mastery", () => {
    const sig = interpretEvidence(reviewEvent("review_reasoning_check", true));
    expect(sig.direction).toBe("confirm");
    expect(sig.direction).not.toBe("improve");
  });

  it("review evidence is sourced as 'review' (lower weight than sim/manager)", () => {
    expect(interpretEvidence(reviewEvent("review_recall", true)).sourceType).toBe("review");
    expect(interpretEvidence(reviewEvent("review_safety_recheck", true)).sourceType).toBe("review");
  });

  it("repeated successful reviews strengthen confidence (durability accrues)", () => {
    const one = readinessCells([reviewEvent("review_fault_retry", true)]).find((c) => c.domain === "plc")!;
    const many = readinessCells(Array.from({ length: 5 }, () => reviewEvent("review_fault_retry", true))).find((c) => c.domain === "plc")!;
    expect(many.confidence).toBeGreaterThanOrEqual(one.confidence);
  });

  it("review ALONE never reaches Ready/Promotion (no mastery from review only)", () => {
    const cell = readinessCells(Array.from({ length: 8 }, () => reviewEvent("review_recall", true))).find((c) => c.domain === "plc")!;
    expect(["Ready", "Promotion Candidate"]).not.toContain(cell.readinessLevel);
  });
});
