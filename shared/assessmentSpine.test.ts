import { describe, it, expect } from "vitest";
import {
  interpretEvidence,
  rollupDomain,
  deriveReadiness,
  readinessFromEvidence,
  simulationEvidence,
  reviewEvidence,
  managerValidationEvidence,
  lessonInteractionEvidence,
  methodologyTierFromConfidence,
  hasAnyEvidence,
  overallConfidence,
  readinessCells,
  communicationReadiness,
  SOURCE_WEIGHT,
  type EvidenceEvent,
} from "./assessmentSpine";

const now = Date.UTC(2026, 6, 4);
const iso = (daysAgo = 0) => new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

function reasoned(quality: "sound" | "weak" | "flawed", correct = true, createdAt = iso(1)): EvidenceEvent {
  return { sourceType: "lesson", evidenceType: "reasoned_answer", domain: "motors", correctness: correct ? "correct" : "incorrect", reasoningQuality: quality, createdAt };
}

describe("Assessment Spine — interpretation", () => {
  it("right action + SOUND reasoning is mastery-grade (improve, high score)", () => {
    const s = interpretEvidence(reasoned("sound"));
    expect(s.direction).toBe("improve");
    expect(s.demonstratedScore).toBeGreaterThanOrEqual(90);
  });

  it("right action + WEAK reasoning is NOT mastery — it is coached", () => {
    const s = interpretEvidence(reasoned("weak"));
    expect(s.direction).toBe("confirm"); // not "improve"
    expect(s.demonstratedScore).toBeLessThan(70);
    expect(s.reason.toLowerCase()).toContain("weak reasoning");
  });

  it("a correct action-only answer scores below a correct sound-reasoned answer", () => {
    const choice = interpretEvidence({ sourceType: "lesson", evidenceType: "action_choice", domain: "motors", correctness: "correct", createdAt: iso(1) });
    const sound = interpretEvidence(reasoned("sound"));
    expect(choice.demonstratedScore).toBeLessThan(sound.demonstratedScore);
  });

  it("a safety violation is unsafe, heavy, and zero demonstrated quality", () => {
    const s = interpretEvidence({ sourceType: "simulation", evidenceType: "safety_action", domain: "safety", safetyFlag: true, createdAt: iso(1) });
    expect(s.direction).toBe("unsafe");
    expect(s.safetyCritical).toBe(true);
    expect(s.demonstratedScore).toBe(0);
    expect(s.weight).toBeGreaterThan(SOURCE_WEIGHT.simulation); // amplified by SAFETY_WEIGHT
  });

  it("simulator evidence carries more weight than lesson evidence", () => {
    const sim = interpretEvidence(simulationEvidence({ domain: "vfd", scenarioSlug: "x", methodologyScore: 80 }));
    const lesson = interpretEvidence(lessonInteractionEvidence({ domain: "vfd", lessonId: "l", interaction: "choice", correct: true }));
    expect(sim.weight).toBeGreaterThan(lesson.weight);
  });

  it("failed delayed recall signals decay / needs-review", () => {
    const s = interpretEvidence(reviewEvidence({ domain: "plc", questionId: 1, grade: 1 }));
    expect(s.direction).toBe("needs_review");
  });
});

describe("Assessment Spine — quality rules in readiness", () => {
  it("completion alone is NOT mastery (live interaction only → Almost Ready at best)", () => {
    const events: EvidenceEvent[] = [1, 2, 3].map((d) => lessonInteractionEvidence({ domain: "motors", lessonId: "l", interaction: "live", createdAt: iso(d) }));
    const r = readinessFromEvidence("motors", events, now);
    expect(r.level).not.toBe("Ready");
    expect(r.level).not.toBe("Promotion Candidate");
  });

  it("correct answers without a manager sign-off → Needs Manager Validation, not mastery", () => {
    const events = [iso(1), iso(2)].map((t) => lessonInteractionEvidence({ domain: "motors", lessonId: "l", interaction: "choice", correct: true, createdAt: t }));
    const r = readinessFromEvidence("motors", events, now);
    expect(r.confidence).toBeGreaterThanOrEqual(70);
    expect(r.level).toBe("Needs Manager Validation");
    expect(r.level).not.toBe("Promotion Candidate");
  });

  it("sound reasoning, repeated, + manager validation → Promotion Candidate", () => {
    const events: EvidenceEvent[] = [reasoned("sound", true, iso(1)), reasoned("sound", true, iso(2)), reasoned("sound", true, iso(3)), managerValidationEvidence({ domain: "motors", createdAt: iso(1) })];
    const r = readinessFromEvidence("motors", events, now);
    expect(r.confidence).toBeGreaterThanOrEqual(85);
    expect(r.managerValidated).toBe(true);
    expect(r.level).toBe("Promotion Candidate");
  });

  it("a safety violation overrides otherwise-strong evidence", () => {
    const events: EvidenceEvent[] = [
      reasoned("sound", true, iso(1)), reasoned("sound", true, iso(2)), reasoned("sound", true, iso(3)),
      { sourceType: "simulation", evidenceType: "safety_action", domain: "motors", safetyFlag: true, createdAt: iso(1) },
    ];
    const r = readinessFromEvidence("motors", events, now);
    expect(r.hasSafetyViolation).toBe(true);
    expect(r.level).toBe("Needs Safety Review");
  });

  it("manager validation alone (no demonstrated evidence) does NOT create readiness", () => {
    const r = readinessFromEvidence("motors", [managerValidationEvidence({ domain: "motors", createdAt: iso(1) })], now);
    expect(r.level).not.toBe("Ready");
    expect(r.level).not.toBe("Promotion Candidate");
    expect(r.attempts).toBe(0);
  });

  it("simulator evidence dominates when mixed with a weaker lesson signal", () => {
    const events: EvidenceEvent[] = [
      simulationEvidence({ domain: "vfd", scenarioSlug: "s", methodologyScore: 92, createdAt: iso(1) }),
      lessonInteractionEvidence({ domain: "vfd", lessonId: "l", interaction: "choice", correct: true, createdAt: iso(1) }),
    ];
    const r = readinessFromEvidence("vfd", events, now);
    // weighted toward the 92 sim, not the simple average with the 70 lesson choice
    expect(r.confidence).toBeGreaterThan(82);
  });

  it("stale evidence decays readiness to Needs Review", () => {
    const events: EvidenceEvent[] = [reasoned("sound", true, iso(400)), reasoned("sound", true, iso(410))];
    const r = readinessFromEvidence("motors", events, now);
    expect(r.decay).toBe("decayed");
    expect(r.level).toBe("Needs Review");
  });

  it("no evidence → Not Demonstrated", () => {
    const r = readinessFromEvidence("integration", [], now);
    expect(r.level).toBe("Not Demonstrated");
    expect(r.attempts).toBe(0);
  });

  it("every readiness carries an audit rationale (why it changed)", () => {
    const r = readinessFromEvidence("motors", [reasoned("sound", true, iso(1)), reasoned("sound", true, iso(2))], now);
    expect(r.rationale.length).toBeGreaterThan(0);
  });
});

describe("Assessment Spine — display helpers (page source of truth)", () => {
  it("methodology tier maps confidence on the 85/65/40 cut lines", () => {
    expect(methodologyTierFromConfidence(90)).toBe("Master Diagnostician");
    expect(methodologyTierFromConfidence(70)).toBe("Systematic Troubleshooter");
    expect(methodologyTierFromConfidence(45)).toBe("Developing Technician");
    expect(methodologyTierFromConfidence(20)).toBe("Needs Methodology Training");
  });

  it("hasAnyEvidence drives the empty state (false with no demonstrations)", () => {
    expect(hasAnyEvidence([{ attempts: 0, managerValidated: false, hasSafetyViolation: false }])).toBe(false);
    expect(hasAnyEvidence([{ attempts: 2, managerValidated: false, hasSafetyViolation: false }])).toBe(true);
    expect(hasAnyEvidence([{ attempts: 0, managerValidated: true, hasSafetyViolation: false }])).toBe(true);
    expect(hasAnyEvidence([{ attempts: 0, managerValidated: false, hasSafetyViolation: true }])).toBe(true);
  });

  it("overallConfidence averages only domains with demonstrated evidence", () => {
    expect(overallConfidence([{ confidence: 80, attempts: 2 }, { confidence: 60, attempts: 1 }, { confidence: 0, attempts: 0 }])).toBe(70);
    expect(overallConfidence([{ confidence: 0, attempts: 0 }])).toBe(0);
  });

  it("readinessCells returns one spine-based cell per domain (replacement for buildCells)", () => {
    const cells = readinessCells([reasoned("sound", true, iso(1)), reasoned("sound", true, iso(2))]);
    expect(cells.length).toBe(9); // one per SkillDomain (includes fluid_power)
    const motors = cells.find((c) => c.domain === "motors")!;
    expect(motors.attempts).toBe(2);
    expect(motors.confidence).toBeGreaterThanOrEqual(85);
    expect(motors.readinessLevel).toBeDefined();
    const idle = cells.find((c) => c.domain === "integration")!;
    expect(idle.attempts).toBe(0);
    expect(idle.readinessLevel).toBe("Not Demonstrated");
  });
});

describe("Assessment Spine — communication readiness (job-readiness signal)", () => {
  const commEv = (evidenceType: EvidenceEvent["evidenceType"], correctness: EvidenceEvent["correctness"], reasoningQuality: EvidenceEvent["reasoningQuality"], safetyFlag = false, createdAt = iso(1)): EvidenceEvent => ({
    sourceType: "ai_mentor", evidenceType, domain: "motors", correctness, reasoningQuality, safetyFlag, createdAt,
  });

  it("empty communication evidence → hasEvidence false (empty state)", () => {
    const c = communicationReadiness([]);
    expect(c.hasEvidence).toBe(false);
    expect(c.overall.level).toBe("Not Demonstrated");
    expect(c.areas.length).toBe(5);
  });

  it("strong work-order documentation supports job-readiness (but not 'Ready' from one turn)", () => {
    const c = communicationReadiness([commEv("ai_work_order_documentation", "correct", "sound", false, iso(1))]);
    expect(c.hasEvidence).toBe(true);
    const wo = c.areas.find((a) => a.key === "work_order")!;
    expect(wo.confidence).toBeGreaterThan(0);
    expect(wo.attempts).toBe(1);
    expect(["Almost Ready", "Ready", "Needs Manager Validation"]).toContain(wo.level);
    expect(wo.level).not.toBe("Promotion Candidate");
  });

  it("vague work-order documentation does NOT create readiness", () => {
    const c = communicationReadiness([commEv("ai_work_order_documentation", "incorrect", "flawed", false, iso(1))]);
    const wo = c.areas.find((a) => a.key === "work_order")!;
    expect(["Needs Training", "Needs Review", "Not Demonstrated"]).toContain(wo.level);
  });

  it("unsafe communication creates a visible safety risk", () => {
    const c = communicationReadiness([commEv("ai_operator_communication", "incorrect", "flawed", true, iso(1))]);
    expect(c.safetyCommunicationRisk).toBe(true);
    const op = c.areas.find((a) => a.key === "operator_communication")!;
    expect(op.hasSafetyViolation).toBe(true);
    expect(op.level).toBe("Needs Safety Review");
  });

  it("verifiedVsAssumed reflects the evidence quality mix", () => {
    const strong = communicationReadiness([commEv("ai_reflection", "correct", "sound", false, iso(1)), commEv("ai_work_order_documentation", "correct", "sound", false, iso(2))]);
    expect(strong.verifiedVsAssumed).toBe("strong");
    const weak = communicationReadiness([commEv("ai_reflection", "incorrect", "flawed", false, iso(1))]);
    expect(weak.verifiedVsAssumed).toBe("weak");
  });

  const managerCommVal = (areaKey: string, createdAt = iso(0)): EvidenceEvent => ({
    sourceType: "manager_validation", evidenceType: "manager_attestation", domain: `comm:${areaKey}` as never, createdAt,
  });

  it("manager attestation strengthens a demonstrated area (Almost Ready → Ready)", () => {
    const before = communicationReadiness([commEv("ai_operator_communication", "correct", "sound", false, iso(1))]);
    const opBefore = before.areas.find((a) => a.key === "operator_communication")!;
    expect(opBefore.level).toBe("Almost Ready");
    expect(opBefore.managerValidated).toBe(false);

    const after = communicationReadiness([
      commEv("ai_operator_communication", "correct", "sound", false, iso(1)),
      managerCommVal("operator_communication"),
    ]);
    const opAfter = after.areas.find((a) => a.key === "operator_communication")!;
    expect(opAfter.managerValidated).toBe(true);
    expect(opAfter.level).toBe("Ready");
  });

  it("manager attestation does NOT override unsafe communication (safety stays visible)", () => {
    const c = communicationReadiness([
      commEv("ai_operator_communication", "incorrect", "flawed", true, iso(1)),
      managerCommVal("operator_communication"),
    ]);
    const op = c.areas.find((a) => a.key === "operator_communication")!;
    expect(op.managerValidated).toBe(true);
    expect(op.level).toBe("Needs Safety Review"); // validation cannot clear the safety flag
    expect(c.safetyCommunicationRisk).toBe(true);
  });

  it("manager attestation does not fabricate readiness with no demonstrated evidence", () => {
    const c = communicationReadiness([managerCommVal("work_order")]);
    const wo = c.areas.find((a) => a.key === "work_order")!;
    expect(wo.managerValidated).toBe(true);
    expect(wo.attempts).toBe(0);
    expect(wo.level).not.toBe("Ready");
  });

  it("cross-cutting attestations (verified vs assumed / safety communication) are surfaced", () => {
    const c = communicationReadiness([commEv("ai_reflection", "correct", "sound"), managerCommVal("verified_vs_assumed")]);
    expect(c.crossCuttingValidated.map((x) => x.key)).toContain("verified_vs_assumed");
  });

  it("communication validation does NOT leak into technical domain readiness", () => {
    // A comm: validation must not affect the 8 SkillDomain readiness cells.
    const cells = readinessCells([managerCommVal("operator_communication")]);
    expect(cells.every((c) => c.managerValidated === false)).toBe(true);
    expect(cells.every((c) => c.attempts === 0)).toBe(true);
  });

  it("communication evidence maps into the five plant-floor areas", () => {
    const c = communicationReadiness([
      commEv("ai_reflection", "correct", "sound"),
      commEv("ai_operator_communication", "correct", "sound"),
      commEv("ai_work_order_documentation", "correct", "sound"),
      commEv("ai_shift_handoff", "correct", "sound"),
      commEv("ai_root_cause_explanation", "correct", "sound"),
    ]);
    const keys = c.areas.map((a) => a.key).sort();
    expect(keys).toEqual(["fault_explanation", "operator_communication", "root_cause", "shift_handoff", "work_order"]);
    expect(c.areas.every((a) => a.attempts === 1)).toBe(true);
  });
});

describe("Assessment Spine — LLM escalation visible in audit rationale", () => {
  it("an escalated weak signal says 'Escalated by mentor review' with the reason", () => {
    const ev: EvidenceEvent = {
      sourceType: "ai_mentor", evidenceType: "ai_work_order_documentation", domain: "motors",
      correctness: "incorrect", reasoningQuality: "flawed", createdAt: iso(1),
      detail: { escalatedByLlm: true, llmReason: "unsupported certainty without evidence", detectedIssues: ["unsupported_certainty"] },
    };
    const sig = interpretEvidence(ev);
    expect(sig.reason).toContain("Escalated by mentor review: unsupported certainty without evidence");
  });

  it("a safety escalation appears in the unsafe rationale", () => {
    const ev: EvidenceEvent = {
      sourceType: "ai_mentor", evidenceType: "ai_operator_communication", domain: "motors",
      correctness: "incorrect", reasoningQuality: "flawed", safetyFlag: true, createdAt: iso(1),
      detail: { escalatedByLlm: true, llmReason: "learner advised repeated reset" },
    };
    const sig = interpretEvidence(ev);
    expect(sig.direction).toBe("unsafe");
    expect(sig.reason).toContain("Safety-critical failure");
    expect(sig.reason).toContain("Escalated by mentor review: learner advised repeated reset");
  });

  it("escalation without llmReason falls back to detected issues in plain words", () => {
    const ev: EvidenceEvent = {
      sourceType: "ai_mentor", evidenceType: "ai_reflection", domain: "motors",
      correctness: "partial", reasoningQuality: "weak", createdAt: iso(1),
      detail: { escalatedByLlm: true, detectedIssues: ["unsupported_certainty", "vague"] },
    };
    expect(interpretEvidence(ev).reason).toContain("Escalated by mentor review: unsupported certainty, vague");
  });

  it("non-escalated evidence has no escalation note", () => {
    const ev: EvidenceEvent = {
      sourceType: "ai_mentor", evidenceType: "ai_reflection", domain: "motors",
      correctness: "correct", reasoningQuality: "sound", createdAt: iso(1),
      detail: { escalatedByLlm: false },
    };
    expect(interpretEvidence(ev).reason).not.toContain("Escalated by mentor review");
  });

  it("the escalated rationale flows into communication readiness recentAudit (manager-visible)", () => {
    const ev: EvidenceEvent = {
      sourceType: "ai_mentor", evidenceType: "ai_work_order_documentation", domain: "motors",
      correctness: "incorrect", reasoningQuality: "flawed", createdAt: iso(1),
      detail: { escalatedByLlm: true, llmReason: "vague work order note did not include test evidence" },
    };
    const c = communicationReadiness([ev]);
    const wo = c.areas.find((a) => a.key === "work_order")!;
    expect(wo.recentAudit[0].reason).toContain("Escalated by mentor review: vague work order note did not include test evidence");
  });
});

describe("Assessment Spine — rollup mechanics", () => {
  it("recent evidence outweighs old evidence of the same source", () => {
    const oldLow = interpretEvidence(reasoned("sound", false, iso(300))); // incorrect, low, old
    const newHigh = interpretEvidence(reasoned("sound", true, iso(1))); // correct sound, recent
    const r = rollupDomain("motors", [oldLow, newHigh], now);
    expect(r.confidence).toBeGreaterThan(60); // pulled toward the recent strong demo
  });
});
