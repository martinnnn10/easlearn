/**
 * End-to-end product-loop test (DB-free): a hydraulic run's evidence set →
 * the SAME readiness math the server's readinessForDomains() runs
 * (interpretEvidence → rollupDomain → deriveReadiness, via readinessCells).
 *
 * This proves the loop logic that the live DB only has to STORE:
 *   sim attempt → evidence → fluid_power readiness → safety review on unsafe.
 * The DB persistence itself is verified separately by scripts/hydraulic-mvp-smoke.mts
 * against a live DATABASE_URL (see docs/HYDRAULIC_MVP_LIVE_QA.md).
 */
import { describe, it, expect } from "vitest";
import {
  HYDRAULIC_SCENARIOS,
  evaluateDiagnosis,
  buildSessionEvidence,
  hydraulicCloseoutEvidence,
  safetyActionEvidence,
  getHydraulicAction,
  type HydraulicSession,
} from "./hydraulicSim";
import { readinessCells, type EvidenceEvent } from "./assessmentSpine";

/** A complete, methodical F1 run: probe everything, diagnose sound, close out. */
function soundF1Run(): EvidenceEvent[] {
  const s = HYDRAULIC_SCENARIOS.clogged_filter;
  const clues = ["observe_symptom", "sight_glass", "pump_outlet", "work_port", "filter_delta", "relief_line_temp", "flow"] as const;
  const session: HydraulicSession = {
    faultId: "clogged_filter",
    cluesGathered: [...clues],
    unsafeActionsTaken: [],
    wrongDiagnoses: 0,
    timeSeconds: 240,
  };
  session.diagnosis = evaluateDiagnosis(s, "clogged_filter", clues);
  return [
    ...buildSessionEvidence(s, session),
    safetyActionEvidence(getHydraulicAction("relieve_and_verify_zero")),
    hydraulicCloseoutEvidence("reflection", "The clamp was weak because the filter was clogged; I verified the pump was building pressure but it dropped across the filter. Still checking the contamination source."),
    hydraulicCloseoutEvidence("operator", "The filter was clogged and starving the clamp. I confirmed the pump was fine and full pressure returned after the swap. Please don't keep running it slow — call maintenance if it drags again."),
    hydraulicCloseoutEvidence("workOrder", "Symptom: clamp slow/weak. Readings: P1 1950, P2 900, filter ΔP 350. Cause: clogged pressure filter. Action: relieved pressure, replaced element, verified full pressure. Follow-up: find contamination source."),
    hydraulicCloseoutEvidence("handoff", "Clamp back up; verified full pressure at the cylinder. Contamination source still unknown — watch the filter loading again next shift."),
  ];
}

describe("hydraulic product loop → fluid_power readiness", () => {
  it("emits the full evidence set the pilot must persist", () => {
    const events = soundF1Run();
    const types = new Set(events.map((e) => e.evidenceType));
    for (const t of ["live_interaction", "reasoned_answer", "diagnosis_submitted", "simulation_completed", "safety_action", "ai_reflection", "ai_operator_communication", "ai_work_order_documentation", "ai_shift_handoff"]) {
      expect(types.has(t as EvidenceEvent["evidenceType"]), `missing evidence type ${t}`).toBe(true);
    }
    // fluid_power carries the diagnosis + sim; safety carries the safe action.
    expect(events.some((e) => e.domain === "fluid_power" && e.evidenceType === "simulation_completed")).toBe(true);
    expect(events.some((e) => e.domain === "safety")).toBe(true);
  });

  it("a methodical run lands a real fluid_power readiness (Manager Dashboard / Skills Passport row)", () => {
    const cells = readinessCells(soundF1Run());
    const fp = cells.find((c) => c.domain === "fluid_power")!;
    expect(fp.label).toBe("Hydraulic Troubleshooting");
    expect(fp.attempts).toBeGreaterThan(0); // shows up (attempts>0 filter on the passport)
    expect(fp.readinessLevel).not.toBe("Not Demonstrated");
    expect(fp.readinessLevel).not.toBe("Needs Safety Review"); // clean, safe run
    expect(fp.readinessLevel).not.toBe("Promotion Candidate"); // one run ≠ mastery (needs manager)
    expect(fp.hasSafetyViolation).toBe(false);
  });

  it("an unsafe action forces the safety domain to Needs Safety Review", () => {
    const s = HYDRAULIC_SCENARIOS.pump_wear;
    const session: HydraulicSession = {
      faultId: "pump_wear",
      cluesGathered: ["sight_glass", "filter_delta", "relief_line_temp", "pump_outlet", "flow"],
      unsafeActionsTaken: ["loosen_fitting_under_pressure"],
      wrongDiagnoses: 0,
    };
    session.diagnosis = evaluateDiagnosis(s, "pump_wear", session.cluesGathered);
    const cells = readinessCells(buildSessionEvidence(s, session));
    const safety = cells.find((c) => c.domain === "safety")!;
    expect(safety.readinessLevel).toBe("Needs Safety Review");
    expect(safety.hasSafetyViolation).toBe(true);
  });

  it("does not disturb the other domains (they stay Not Demonstrated with no hydraulic evidence)", () => {
    const cells = readinessCells(soundF1Run());
    for (const d of ["vfd", "plc", "motors", "electrical", "sensors", "networking"] as const) {
      const c = cells.find((x) => x.domain === d)!;
      expect(c.attempts).toBe(0);
    }
  });
});
