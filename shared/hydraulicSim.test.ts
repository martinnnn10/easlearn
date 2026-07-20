import { describe, it, expect } from "vitest";
import {
  HYDRAULIC_SCENARIOS,
  NORMAL_READINGS,
  evaluateDiagnosis,
  scoreMethodology,
  buildSessionEvidence,
  diagnosisEvidence,
  safetyActionEvidence,
  hydraulicCloseoutEvidence,
  getHydraulicAction,
  clueEvidence,
  type HydraulicSession,
  type HydraulicTestPointId,
} from "./hydraulicSim";
import {
  interpretEvidence,
  readinessFromEvidence,
  readinessCells,
  type EvidenceEvent,
} from "./assessmentSpine";
import { SKILL_DOMAIN_LABELS, type SkillDomain } from "./competencyMatrix";

const ALL_CLUES: HydraulicTestPointId[] = [
  "observe_symptom", "sight_glass", "reservoir_temp", "pump_outlet", "work_port", "filter_delta", "relief_line_temp", "flow",
];

describe("fluid_power domain is registered in the Assessment Spine", () => {
  it("appears in the domain labels (Manager Dashboard / Skills Passport surface)", () => {
    expect(SKILL_DOMAIN_LABELS.fluid_power).toBe("Hydraulic Troubleshooting");
  });
  it("rolls up as its own readiness cell alongside the existing domains", () => {
    const cells = readinessCells([]);
    const domains = cells.map((c) => c.domain);
    expect(domains).toContain("fluid_power");
    // existing domains still present — nothing regressed
    for (const d of ["vfd", "plc", "motors", "safety", "electrical", "sensors"] as SkillDomain[]) {
      expect(domains).toContain(d);
    }
    expect(cells.find((c) => c.domain === "fluid_power")?.label).toBe("Hydraulic Troubleshooting");
  });
});

describe("F1 clogged filter — pressure signature", () => {
  const s = HYDRAULIC_SCENARIOS.clogged_filter;
  it("pump builds pressure but it collapses downstream across the filter", () => {
    // pump outlet is (near) normal — the pump is NOT weak
    expect(Number(s.readings.pump_outlet.value)).toBeGreaterThan(1800);
    // work port has lost most of it
    expect(Number(s.readings.work_port.value)).toBeLessThan(1200);
    // huge filter ΔP is the restriction tell (normal is ~15)
    expect(Number(s.readings.filter_delta.value)).toBeGreaterThan(200);
    expect(Number(NORMAL_READINGS.filter_delta.value)).toBeLessThan(30);
    // relief is not dumping
    expect(s.readings.relief_line_temp.value).toBe("cool");
  });
  it("blaming the pump is graded as a wrong, flawed call (the trap)", () => {
    const r = evaluateDiagnosis(s, "pump_wear", ["observe_symptom", "pump_outlet", "work_port", "filter_delta"]);
    expect(r.correct).toBe(false);
    expect(r.reasoningQuality).toBe("flawed");
  });
  it("proving pressure present-at-pump / lost-across-filter is a sound call", () => {
    const r = evaluateDiagnosis(s, "clogged_filter", ["pump_outlet", "work_port", "filter_delta"]);
    expect(r.correct).toBe(true);
    expect(r.reasoningQuality).toBe("sound");
  });
});

describe("F4 pump wear — requires eliminating the easier causes", () => {
  const s = HYDRAULIC_SCENARIOS.pump_wear;
  it("low pressure AND low flow, with filter/level/relief all ruling out", () => {
    expect(Number(s.readings.pump_outlet.value)).toBeLessThan(1000);
    expect(Number(s.readings.flow.value)).toBeLessThan(3);
    expect(Number(s.readings.filter_delta.value)).toBeLessThan(30); // filter clean → not F1
    expect(s.readings.sight_glass.value).toBe("full"); // level ok → not low fluid
    expect(s.readings.relief_line_temp.value).toBe("cool"); // relief cold → not dumping
  });
  it("concluding 'pump' AFTER eliminations is sound (mastery-grade)", () => {
    const r = evaluateDiagnosis(s, "pump_wear", ["sight_glass", "filter_delta", "relief_line_temp", "pump_outlet", "flow"]);
    expect(r.correct).toBe(true);
    expect(r.reasoningQuality).toBe("sound");
    expect(r.guessedPumpEarly).toBe(false);
  });
  it("guessing 'pump' early — before eliminations — is NOT mastery", () => {
    const r = evaluateDiagnosis(s, "pump_wear", ["pump_outlet"]);
    expect(r.correct).toBe(true); // right answer...
    expect(r.reasoningQuality).not.toBe("sound"); // ...but not earned
    expect(r.guessedPumpEarly).toBe(true);
    // and the spine refuses to treat it as mastery
    const [reasoned] = diagnosisEvidence(s, r);
    const signal = interpretEvidence(reasoned);
    expect(signal.direction).not.toBe("improve");
  });
});

describe("method matters — a guess never reads like an earned diagnosis", () => {
  const s = HYDRAULIC_SCENARIOS.pump_wear;
  const soundSession: HydraulicSession = {
    faultId: "pump_wear",
    cluesGathered: ["observe_symptom", "sight_glass", "pump_outlet", "work_port", "filter_delta", "relief_line_temp", "flow"],
    unsafeActionsTaken: [],
    wrongDiagnoses: 0,
  };
  const guessSession: HydraulicSession = {
    faultId: "pump_wear",
    cluesGathered: ["pump_outlet"],
    unsafeActionsTaken: [],
    wrongDiagnoses: 0,
  };
  it("scores the methodical run far above the lucky guess", () => {
    soundSession.diagnosis = evaluateDiagnosis(s, "pump_wear", soundSession.cluesGathered);
    guessSession.diagnosis = evaluateDiagnosis(s, "pump_wear", guessSession.cluesGathered);
    const soundScore = scoreMethodology(s, soundSession);
    const guessScore = scoreMethodology(s, guessSession);
    expect(soundScore).toBeGreaterThan(guessScore + 30);
    expect(soundScore).toBeGreaterThanOrEqual(85);
  });
  it("strong diagnosis supports readiness but is not mastery on its own", () => {
    soundSession.diagnosis = evaluateDiagnosis(s, "pump_wear", soundSession.cluesGathered);
    const events = buildSessionEvidence(s, soundSession);
    const readiness = readinessFromEvidence("fluid_power", events);
    // it moves the needle...
    expect(readiness.confidence).toBeGreaterThan(0);
    // ...but a single sim run is never auto-promoted to mastery (that needs a manager)
    expect(readiness.level).not.toBe("Promotion Candidate");
  });
});

describe("safety — unsafe hydraulic actions dominate readiness", () => {
  it("cracking a fitting under pressure raises a safety flag → Needs Safety Review", () => {
    const action = getHydraulicAction("loosen_fitting_under_pressure");
    expect(action.safe).toBe(false);
    const ev = safetyActionEvidence(action);
    expect(ev.domain).toBe("safety");
    expect(ev.safetyFlag).toBe(true);
    const signal = interpretEvidence(ev);
    expect(signal.direction).toBe("unsafe");
    const readiness = readinessFromEvidence("safety", [ev]);
    expect(readiness.level).toBe("Needs Safety Review");
  });
  it("a safe verification (bleed to 0 psi) is not penalized", () => {
    const ev = safetyActionEvidence(getHydraulicAction("relieve_and_verify_zero"));
    expect(ev.safetyFlag).toBeUndefined();
    expect(ev.correctness).toBe("correct");
  });
  it("an unsafe action tanks the methodology score", () => {
    const s = HYDRAULIC_SCENARIOS.pump_wear;
    const session: HydraulicSession = {
      faultId: "pump_wear",
      cluesGathered: ["sight_glass", "filter_delta", "relief_line_temp", "pump_outlet", "flow"],
      unsafeActionsTaken: ["bypass_relief"],
      wrongDiagnoses: 0,
    };
    session.diagnosis = evaluateDiagnosis(s, "pump_wear", session.cluesGathered);
    expect(scoreMethodology(s, session)).toBeLessThan(scoreMethodology(s, { ...session, unsafeActionsTaken: [] }));
  });
});

describe("closeout communication maps to fluid_power", () => {
  it("a clear, verified operator explanation is positive fluid_power evidence", () => {
    const ev = hydraulicCloseoutEvidence(
      "operator",
      "The clamp was weak because the pressure filter was clogged. I verified the pump was building pressure but it dropped across the filter. I replaced the element and confirmed full pressure at the cylinder. Don't keep running it slow — call maintenance if it drags again.",
    );
    expect(ev.domain).toBe("fluid_power");
    expect(ev.evidenceType).toBe("ai_operator_communication");
    expect(ev.correctness).not.toBe("incorrect");
  });
  it("endorsing the operator's unsafe shortcut reads as unsafe communication", () => {
    const ev = hydraulicCloseoutEvidence(
      "operator",
      "Yeah just crank the relief valve up and keep pushing parts through, don't bother calling us.",
    );
    expect(ev.safetyFlag).toBe(true);
    expect(ev.correctness).toBe("incorrect");
  });
  it("work-order and handoff closeouts emit the right evidence types", () => {
    expect(hydraulicCloseoutEvidence("workOrder", "Symptom: clamp slow. Readings: P1 1950, P2 900, filter ΔP 350. Cause: clogged filter. Action: replaced element. Follow-up: find contamination source.").evidenceType).toBe("ai_work_order_documentation");
    expect(hydraulicCloseoutEvidence("handoff", "Clamp back up; verified full pressure. Contamination source still open — watch the filter loading again.").evidenceType).toBe("ai_shift_handoff");
  });
});

describe("existing domains still compute (no regression)", () => {
  it("a VFD simulation still rolls up into vfd readiness", () => {
    const vfdEvent: EvidenceEvent = {
      sourceType: "simulation",
      evidenceType: "simulation_completed",
      domain: "vfd",
      methodologyScore: 90,
      correctness: "correct",
    };
    const readiness = readinessFromEvidence("vfd", [vfdEvent]);
    expect(readiness.domain).toBe("vfd");
    expect(readiness.confidence).toBeGreaterThan(0);
  });
  it("clueEvidence carries the fluid_power domain and scenario id", () => {
    const ev = clueEvidence(HYDRAULIC_SCENARIOS.clogged_filter, "filter_delta");
    expect(ev.domain).toBe("fluid_power");
    expect(ev.evidenceType).toBe("live_interaction");
    expect(ev.correctness).toBe("correct"); // it's a key clue
  });
});
