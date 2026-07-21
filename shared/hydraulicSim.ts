/**
 * Hydraulic Pressure-Loss Diagnostic Simulator — MVP domain model.
 *
 * Source of truth: docs/HYDRAULIC_SIM_DESIGN_SPEC.md. This is the PURE, DB-free
 * core: the machine (a hydraulic clamp/press station on an HPU), the two MVP
 * fault scenarios (F1 clogged pressure filter, F4 pump internal wear), the
 * diagnostic engine, the safety classifier, method scoring, and the evidence
 * builders that feed the EXISTING Assessment Spine (shared/assessmentSpine.ts).
 *
 * Design rules this file enforces:
 *   - Completion is not mastery; a correct answer is not mastery.
 *   - "Bad pump" guessed before ruling out filter / level / relief is NOT mastery
 *     (right answer, weak/flawed reasoning) — the whole point of the F1↔F4 pair.
 *   - Safety violations dominate readiness (safetyFlag → Needs Safety Review).
 *   - No new scoring system: every graded action becomes an EvidenceEvent
 *     interpreted by interpretEvidence / rollupDomain / deriveReadiness.
 */
import type { EvidenceEvent } from "./assessmentSpine";
import { simulationEvidence } from "./assessmentSpine";
import { classifyCommunication, type ReasoningQuality as MentorReasoningQuality } from "./maintenanceMentor";

/** The mentor's communication quality union → the spine's reasoning-quality union. */
const MENTOR_QUALITY_TO_SPINE: Record<MentorReasoningQuality, EvidenceEvent["reasoningQuality"]> = {
  strong: "sound",
  partial: "weak",
  weak: "flawed",
  unsafe: "flawed",
  unclear: "none",
};

export const FLUID_POWER_DOMAIN = "fluid_power" as const;

// --- Machine model ----------------------------------------------------------

/** Where a learner can look or meter on the clamp/press HPU. */
export type HydraulicTestPointId =
  | "observe_symptom" // watch the clamp cycle — slow / weak / no motion
  | "sight_glass" // reservoir level + aeration (cheapest check)
  | "reservoir_temp" // oil temperature
  | "pump_outlet" // P1 — is the pump making pressure at all?
  | "work_port" // P2 — pressure delivered to the clamp cylinder
  | "filter_delta" // ΔP across the pressure filter (restriction tell)
  | "relief_line_temp" // relief return-line temp (dumping-to-tank tell)
  | "flow"; // delivered flow / clamp speed

export const HYDRAULIC_TEST_POINTS: {
  id: HydraulicTestPointId;
  label: string;
  cheap: boolean; // an "observe first" check — rewarded early, cheap to run
}[] = [
  { id: "observe_symptom", label: "Watch the clamp cycle", cheap: true },
  { id: "sight_glass", label: "Reservoir sight glass (level / foam)", cheap: true },
  { id: "reservoir_temp", label: "Reservoir oil temperature", cheap: true },
  { id: "pump_outlet", label: "Pump outlet gauge (P1)", cheap: false },
  { id: "work_port", label: "Cylinder work-port gauge (P2)", cheap: false },
  { id: "filter_delta", label: "Filter ΔP indicator", cheap: false },
  { id: "relief_line_temp", label: "Relief return-line temperature", cheap: false },
  { id: "flow", label: "Delivered flow / clamp speed", cheap: false },
];

export interface HydraulicReading {
  value: string;
  unit: string;
  interpretation: string;
  /** True if this reading is diagnostic for the active fault. */
  isKeyClue: boolean;
  /** normal | warning | critical — drives the UI tone. */
  tone: "normal" | "warning" | "critical";
}

/** The six causes a learner must discriminate between (only one is right). */
export type HydraulicCauseId =
  | "clogged_filter"
  | "low_fluid"
  | "relief_dumping"
  | "pump_wear"
  | "valve_stuck"
  | "cylinder_bypass";

export const HYDRAULIC_CAUSES: { id: HydraulicCauseId; label: string }[] = [
  { id: "clogged_filter", label: "Clogged pressure filter (restriction)" },
  { id: "low_fluid", label: "Low fluid level / aeration" },
  { id: "relief_dumping", label: "Relief valve stuck open / misadjusted" },
  { id: "pump_wear", label: "Pump internal wear (won't build pressure)" },
  { id: "valve_stuck", label: "Directional valve not shifting" },
  { id: "cylinder_bypass", label: "Cylinder seal bypass / drift" },
];

export type HydraulicFaultId = "clogged_filter" | "pump_wear";

export interface HydraulicScenario {
  id: string; // registry slug, e.g. "hydraulic-clamp-clogged-filter"
  faultId: HydraulicFaultId;
  title: string;
  machine: string;
  dispatch: string; // the page/complaint the tech gets
  readings: Record<HydraulicTestPointId, HydraulicReading>;
  correctCauseId: HydraulicCauseId;
  correctFixLabel: string;
  /** The tempting wrong call a shallow tech makes. */
  noviceTrapCauseId: HydraulicCauseId;
  /**
   * Clues that must be gathered for the diagnosis to count as SOUND reasoning.
   * For pump wear this is the "rule out the cheaper causes" set — the difference
   * between competence and a lucky guess.
   */
  soundReasoningRequires: HydraulicTestPointId[];
}

// --- Baseline (healthy) + the two MVP scenarios -----------------------------

const R = (
  value: string,
  unit: string,
  interpretation: string,
  isKeyClue = false,
  tone: HydraulicReading["tone"] = "normal",
): HydraulicReading => ({ value, unit, interpretation, isKeyClue, tone });

/** What a healthy 2000 psi / 5 gpm clamp station reads — the mental baseline. */
export const NORMAL_READINGS: Record<HydraulicTestPointId, HydraulicReading> = {
  observe_symptom: R("clamps firmly", "", "Full force, normal cycle time."),
  sight_glass: R("full", "", "Level at the full mark, oil clear — no aeration."),
  reservoir_temp: R("115", "°F", "Normal operating temperature."),
  pump_outlet: R("2000", "psi", "Pump builds to the relief setting under load."),
  work_port: R("1980", "psi", "Full pressure reaches the clamp cylinder."),
  filter_delta: R("15", "psi", "Clean filter — low pressure drop."),
  relief_line_temp: R("cool", "", "Relief is not dumping — no bypass heat."),
  flow: R("5.0", "gpm", "Full flow — clamp moves at normal speed."),
};

export const HYDRAULIC_SCENARIOS: Record<HydraulicFaultId, HydraulicScenario> = {
  // F1 — Clogged pressure filter. Pressure PRESENT at the pump, LOST across the
  // filter. The pump is fine — blaming it is the trap.
  clogged_filter: {
    id: "hydraulic-clamp-clogged-filter",
    faultId: "clogged_filter",
    title: "Clamp station — slow and weak",
    machine: "Hydraulic clamp/press station on a shared HPU",
    dispatch:
      "Line 3 clamp is slow and weak — it barely holds the part and the cycle's dragging. Quota's behind; the operator wants it back now.",
    readings: {
      observe_symptom: R("slow, weak clamp", "", "Clamp creeps in and won't hold full force.", true, "warning"),
      sight_glass: R("full", "", "Level is at the full mark, oil clear — not a fluid problem.", true, "normal"),
      reservoir_temp: R("140", "°F", "Running warm — energy burning off across a restriction.", false, "warning"),
      pump_outlet: R("1950", "psi", "Pump IS building pressure — it is not weak.", true, "normal"),
      work_port: R("900", "psi", "Pressure collapses before the cylinder — lost between pump and clamp.", true, "critical"),
      filter_delta: R("350", "psi", "Huge drop across the filter — the restriction is here.", true, "critical"),
      relief_line_temp: R("cool", "", "Relief is not dumping — this is not a relief problem.", true, "normal"),
      flow: R("2.1", "gpm", "Flow choked down by the restriction — slow clamp.", true, "warning"),
    },
    correctCauseId: "clogged_filter",
    correctFixLabel: "Relieve pressure, replace the filter element, and find the contamination source",
    noviceTrapCauseId: "pump_wear",
    // Sound call = you SAW pressure present at the pump but lost across the filter.
    soundReasoningRequires: ["pump_outlet", "work_port", "filter_delta"],
  },

  // F4 — Pump internal wear. Low pressure AND low flow, with the cheaper causes
  // (level, filter, relief) all ruled out. "Bad pump" is only mastery once you
  // have eliminated them — grabbing it first is a guess.
  pump_wear: {
    id: "hydraulic-clamp-pump-wear",
    faultId: "pump_wear",
    title: "Clamp station — won't build pressure",
    machine: "Hydraulic clamp/press station on a shared HPU",
    dispatch:
      "Same clamp is back — now it barely moves and won't build pressure at all. The operator swears 'the pump's shot, just swap it.'",
    readings: {
      observe_symptom: R("weak, sluggish clamp", "", "Low force and slow — could be several causes.", true, "warning"),
      sight_glass: R("full", "", "Level full, oil clear — NOT low fluid. (rules out low_fluid)", true, "normal"),
      reservoir_temp: R("120", "°F", "Near normal — no big bypass heat signature.", false, "normal"),
      pump_outlet: R("850", "psi", "Pump can't build pressure even at deadhead.", true, "critical"),
      work_port: R("820", "psi", "Low, and tracks the pump — no big drop across the filter.", true, "critical"),
      filter_delta: R("18", "psi", "Filter is clean — NOT a restriction. (rules out clogged_filter)", true, "normal"),
      relief_line_temp: R("cool", "", "Relief line cold — it is NOT dumping. (rules out relief_dumping)", true, "normal"),
      flow: R("2.4", "gpm", "Low flow AND low pressure — internal bypass past worn pump parts.", true, "critical"),
    },
    correctCauseId: "pump_wear",
    correctFixLabel: "Confirm low flow at rated RPM, then replace/rebuild the pump",
    noviceTrapCauseId: "pump_wear", // right answer — but only mastery AFTER eliminations
    // Sound call = you ruled out level, filter, and relief before concluding pump.
    soundReasoningRequires: ["sight_glass", "filter_delta", "relief_line_temp", "pump_outlet"],
  },
};

// --- Safety model -----------------------------------------------------------

export type HydraulicActionId =
  // safe / correct
  | "relieve_and_verify_zero"
  | "lockout_hpu"
  | "block_support_load"
  | "replace_filter"
  | "replace_pump"
  // unsafe (each maps to a stored-energy hazard)
  | "loosen_fitting_under_pressure"
  | "work_under_unsupported_load"
  | "bypass_relief"
  | "deadhead_pump_no_procedure"
  | "hand_check_leak";

export interface HydraulicAction {
  id: HydraulicActionId;
  label: string;
  safe: boolean;
  /** For unsafe actions: the hazard rule the learner violated. */
  hazard?: string;
  category: "isolate" | "verify" | "repair" | "unsafe";
}

export const HYDRAULIC_ACTIONS: HydraulicAction[] = [
  { id: "relieve_and_verify_zero", label: "Relieve system pressure and verify 0 psi on the gauge", safe: true, category: "verify" },
  { id: "lockout_hpu", label: "Lock out the HPU motor (electrical LOTO) and isolate hydraulic energy", safe: true, category: "isolate" },
  { id: "block_support_load", label: "Block/support the clamp and relieve trapped pressure before working", safe: true, category: "isolate" },
  { id: "replace_filter", label: "Replace the pressure filter element", safe: true, category: "repair" },
  { id: "replace_pump", label: "Replace / rebuild the pump", safe: true, category: "repair" },
  { id: "loosen_fitting_under_pressure", label: "Crack a fitting to check for flow (system still pressurized)", safe: false, category: "unsafe", hazard: "Stored hydraulic energy — pressurized oil / injection injury. Bleed to 0 psi first." },
  { id: "work_under_unsupported_load", label: "Reach under the clamp/ram while it is unsupported", safe: false, category: "unsafe", hazard: "Suspended load can drop. Block/support and relieve pressure first." },
  { id: "bypass_relief", label: "Bypass or over-set the relief to force pressure", safe: false, category: "unsafe", hazard: "Removing over-pressure protection — burst line / injection. Never exceed rated pressure." },
  { id: "deadhead_pump_no_procedure", label: "Deadhead the pump against a closed valve to 'test' it", safe: false, category: "unsafe", hazard: "Uncontrolled over-pressure with no relief path. Follow a deadhead procedure only." },
  { id: "hand_check_leak", label: "Feel along the line by hand to find the pinhole leak", safe: false, category: "unsafe", hazard: "High-pressure injection injury is a surgical emergency. Never use your hand." },
];

export function getHydraulicAction(id: HydraulicActionId): HydraulicAction {
  const a = HYDRAULIC_ACTIONS.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown hydraulic action: ${id}`);
  return a;
}

export function isUnsafeAction(id: HydraulicActionId): boolean {
  return !getHydraulicAction(id).safe;
}

// --- Diagnostic engine ------------------------------------------------------

export interface DiagnosisResult {
  correct: boolean;
  reasoningQuality: "sound" | "weak" | "flawed";
  /** True when the learner picked "bad pump" without ruling out cheaper causes. */
  guessedPumpEarly: boolean;
  message: string;
}

export function readTestPoint(scenario: HydraulicScenario, point: HydraulicTestPointId): HydraulicReading {
  return scenario.readings[point];
}

/**
 * Grade a committed diagnosis. The reasoning quality — not just correctness — is
 * what the spine turns into readiness:
 *   sound  → mastery-grade
 *   weak   → right call, coached (not mastery)
 *   flawed → wrong, or right-by-luck with no evidence
 */
export function evaluateDiagnosis(
  scenario: HydraulicScenario,
  chosenCauseId: HydraulicCauseId,
  cluesGathered: Iterable<HydraulicTestPointId>,
): DiagnosisResult {
  const clues = new Set(cluesGathered);
  const correct = chosenCauseId === scenario.correctCauseId;
  const hasEliminations = scenario.soundReasoningRequires.every((c) => clues.has(c));
  const guessedPumpEarly =
    chosenCauseId === "pump_wear" && !hasEliminations;

  if (!correct) {
    const trap = chosenCauseId === scenario.noviceTrapCauseId && scenario.faultId === "clogged_filter";
    return {
      correct: false,
      reasoningQuality: "flawed",
      guessedPumpEarly: chosenCauseId === "pump_wear",
      message: trap
        ? "You blamed the pump — but the pump outlet was building pressure. The loss is downstream. Re-check where pressure disappears."
        : "That does not match the evidence. Compare where pressure is present versus where it is lost.",
    };
  }

  // Correct cause chosen — but was it earned?
  if (hasEliminations) {
    return {
      correct: true,
      reasoningQuality: "sound",
      guessedPumpEarly: false,
      message:
        scenario.faultId === "pump_wear"
          ? "Sound call: you ruled out level, filter, and relief before concluding the pump. That is the method."
          : "Sound call: pressure present at the pump, lost across the filter — you proved the restriction.",
    };
  }

  // Right answer, method not shown.
  if (clues.size <= 1) {
    return {
      correct: true,
      reasoningQuality: "flawed",
      guessedPumpEarly,
      message:
        "Right cause — but you called it with almost no evidence. Right by luck is not troubleshooting; prove it next time.",
    };
  }
  return {
    correct: true,
    reasoningQuality: "weak",
    guessedPumpEarly,
    message:
      scenario.faultId === "pump_wear"
        ? "It IS the pump — but you didn't rule out the filter, level, and relief first. Correct, not yet mastery. Do the eliminations."
        : "Correct — but you skipped a confirming check. Show the pressure-drop evidence to make it mastery.",
  };
}

// --- Method scoring (feeds methodologyScore on the completion evidence) ------

export interface HydraulicSession {
  faultId: HydraulicFaultId;
  cluesGathered: HydraulicTestPointId[];
  unsafeActionsTaken: HydraulicActionId[];
  wrongDiagnoses: number;
  diagnosis?: DiagnosisResult;
  timeSeconds?: number;
}

/** 0–100 methodology score — clue discovery + method, minus guessing/unsafe. */
export function scoreMethodology(scenario: HydraulicScenario, session: HydraulicSession): number {
  const clues = new Set(session.cluesGathered);
  const keyClues = HYDRAULIC_TEST_POINTS.filter((p) => scenario.readings[p.id].isKeyClue);
  const keyFound = keyClues.filter((p) => clues.has(p.id)).length;
  const eliminationsDone = scenario.soundReasoningRequires.filter((c) => clues.has(c)).length;

  let score = 0;
  score += Math.round((keyFound / Math.max(1, keyClues.length)) * 45); // discovery
  score += Math.round((eliminationsDone / scenario.soundReasoningRequires.length) * 30); // method
  if (session.diagnosis?.correct && session.diagnosis.reasoningQuality === "sound") score += 25;
  else if (session.diagnosis?.correct && session.diagnosis.reasoningQuality === "weak") score += 10;

  score -= session.wrongDiagnoses * 10;
  score -= session.unsafeActionsTaken.length * 25; // unsafe dominates the method score too
  return Math.max(0, Math.min(100, score));
}

export function methodologyTier(score: number): string {
  if (score >= 85) return "master";
  if (score >= 70) return "proficient";
  if (score >= 50) return "developing";
  return "novice";
}

// --- Evidence builders (into the existing Assessment Spine) ------------------

const now = () => new Date().toISOString();

/** One measurement / observation → low-weight live_interaction evidence. */
export function clueEvidence(scenario: HydraulicScenario, point: HydraulicTestPointId): EvidenceEvent {
  const reading = scenario.readings[point];
  return {
    sourceType: "simulation",
    evidenceType: "live_interaction",
    domain: FLUID_POWER_DOMAIN,
    skill: "hydraulic_pressure_diagnosis",
    lessonId: scenario.id,
    correctness: reading.isKeyClue ? "correct" : "partial",
    createdAt: now(),
    detail: { point, value: `${reading.value} ${reading.unit}`.trim() },
  };
}

/**
 * The committed diagnosis — emitted as `reasoned_answer` so the spine applies the
 * sound/weak/flawed branching (this is where "guessed the pump" fails to become
 * mastery), plus a raw `diagnosis_submitted` record.
 */
export function diagnosisEvidence(
  scenario: HydraulicScenario,
  result: DiagnosisResult,
  confidenceScore?: number,
): EvidenceEvent[] {
  const correctness: EvidenceEvent["correctness"] = result.correct ? "correct" : "incorrect";
  const common = {
    sourceType: "simulation" as const,
    domain: FLUID_POWER_DOMAIN,
    skill: "hydraulic_pressure_diagnosis",
    lessonId: scenario.id,
    correctness,
    createdAt: now(),
  };
  return [
    {
      ...common,
      evidenceType: "reasoned_answer",
      reasoningQuality: result.reasoningQuality,
      confidenceScore,
      detail: { message: result.message, guessedPumpEarly: result.guessedPumpEarly },
    },
    {
      ...common,
      evidenceType: "diagnosis_submitted",
      confidenceScore,
    },
  ];
}

/** A safety-relevant action. Unsafe → safety domain, safetyFlag → Needs Safety Review. */
export function safetyActionEvidence(action: HydraulicAction): EvidenceEvent {
  return {
    sourceType: "simulation",
    evidenceType: "safety_action",
    domain: "safety",
    skill: "hydraulic_stored_energy",
    correctness: action.safe ? "correct" : "incorrect",
    safetyFlag: action.safe ? undefined : true,
    createdAt: now(),
    detail: action.safe ? { action: action.id } : { action: action.id, hazard: action.hazard },
  };
}

/** Finished, scored run → simulation_completed via the shared spine helper. */
export function hydraulicCompletionEvidence(scenario: HydraulicScenario, session: HydraulicSession): EvidenceEvent {
  const score = scoreMethodology(scenario, session);
  return simulationEvidence({
    domain: FLUID_POWER_DOMAIN,
    scenarioSlug: scenario.id,
    methodologyScore: score,
    methodologyTier: methodologyTier(score),
    timeSeconds: session.timeSeconds,
    safetyFailed: session.unsafeActionsTaken.length > 0,
  });
}

export type CloseoutKind = "reflection" | "operator" | "workOrder" | "handoff" | "rootCause";

const CLOSEOUT_EVIDENCE_TYPE: Record<CloseoutKind, EvidenceEvent["evidenceType"]> = {
  reflection: "ai_reflection",
  operator: "ai_operator_communication",
  workOrder: "ai_work_order_documentation",
  handoff: "ai_shift_handoff",
  rootCause: "ai_root_cause_explanation",
};

/**
 * Closeout communication → graded by the SAME classifier used across the app
 * (classifyCommunication), mapped to fluid_power job-readiness evidence.
 * Endorsing the operator's unsafe shortcut reads as poor, unsafe communication.
 */
/** Hydraulic-specific unsafe endorsements the generic classifier's lexicon misses. */
const HYDRAULIC_UNSAFE_CLOSEOUT =
  /(crank|turn|bump|set|adjust|jack)\s+(the\s+)?(relief|pressure)\s*(valve)?\s*(up|higher|past)|bypass(ing)?\s+(the\s+)?relief|over.?set\s+(the\s+)?relief|don'?t\s+bother\s+(call|tell)|just\s+keep\s+(going|running|pushing)/i;

export function hydraulicCloseoutEvidence(kind: CloseoutKind, text: string): EvidenceEvent {
  const a = classifyCommunication(text);
  const unsafe = a.unsafe || HYDRAULIC_UNSAFE_CLOSEOUT.test(text);
  const reasoningQuality: EvidenceEvent["reasoningQuality"] = unsafe ? "flawed" : MENTOR_QUALITY_TO_SPINE[a.quality];
  const correctness: EvidenceEvent["correctness"] =
    unsafe ? "incorrect" : a.quality === "strong" ? "correct" : "partial";
  return {
    sourceType: "ai_mentor",
    evidenceType: CLOSEOUT_EVIDENCE_TYPE[kind],
    domain: FLUID_POWER_DOMAIN,
    skill: "hydraulic_closeout",
    correctness,
    reasoningQuality,
    safetyFlag: unsafe || undefined,
    createdAt: now(),
    detail: { kind, cues: a.cues },
  };
}

/** Convenience: roll a whole session (diagnosis + safety + completion) to evidence. */
export function buildSessionEvidence(scenario: HydraulicScenario, session: HydraulicSession): EvidenceEvent[] {
  const events: EvidenceEvent[] = [];
  for (const point of session.cluesGathered) events.push(clueEvidence(scenario, point));
  for (const id of session.unsafeActionsTaken) events.push(safetyActionEvidence(getHydraulicAction(id)));
  if (session.diagnosis) events.push(...diagnosisEvidence(scenario, session.diagnosis));
  events.push(hydraulicCompletionEvidence(scenario, session));
  return events;
}
