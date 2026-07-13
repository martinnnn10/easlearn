/**
 * EASLearn Assessment Spine — the trust layer.
 *
 * Connects the Learning Engine (docs/LEARNING_ENGINE.md) to the Manufacturing
 * Competency Graph. Every important learner action becomes an EvidenceEvent; the
 * spine INTERPRETS it into CompetencySignal(s), ROLLS UP signals into a competency
 * confidence, and DERIVES a manager-facing ReadinessSignal — with a full audit
 * trail of WHY competency changed.
 *
 * Non-negotiable rules encoded here:
 *   - Completion is NOT mastery.
 *   - A correct answer is NOT mastery.
 *   - A right action with weak reasoning is NOT mastery (it is coached).
 *   - Safety-critical failures lower readiness more heavily than normal mistakes.
 *   - Simulator evidence weighs more than simple lesson-interaction evidence.
 *   - Manager validation STRENGTHENS but does not blindly OVERRIDE digital evidence.
 *
 * Pure functions only — no I/O, no framework — so it is unit-testable and shared by
 * client (emit + optimistic UI) and server (persist + roll up). Persistence lives in
 * the `competency_evidence` table + server/assessment.ts.
 */
import { SKILL_DOMAIN_LABELS, type SkillDomain } from "./competencyMatrix";
import type { LearningMechanicId } from "./learningEngine";
import { competencyLevel, decayStatus, type CompetencyLevel, type DecayStatus } from "./competencyGraph";

/** Where the evidence came from. Weight/trust differs per source. */
export type SourceType = "lesson" | "simulation" | "review" | "ai_mentor" | "manager_validation";

/** The raw kind of action the learner took. */
export type EvidenceType =
  | "reasoned_answer" // action + stated reasoning (reasonedAsk)
  | "action_choice" // action only (masterAsk / choice)
  | "prediction" // predict-before-reveal
  | "ordering" // sequence / build-the-procedure
  | "live_interaction" // manipulated a live circuit/twin
  | "diagnosis_submitted" // committed a diagnosis in the simulator
  | "simulation_completed" // finished a scored simulator run
  | "review_recall" // answered a spaced-review card (delayed recall)
  | "manager_attestation" // a manager attested the competency on the floor
  | "safety_action" // a safety-relevant decision (pass/fail)
  // AI Maintenance Mentor (sourceType "ai_mentor") — lower-weight coaching evidence
  | "ai_reasoning_check"
  | "ai_hint_used"
  | "ai_safety_intervention"
  | "ai_reflection"
  | "ai_explanation"
  | "ai_correction"
  | "ai_confidence_check"
  // Communication / closeout evidence (job-readiness)
  | "ai_operator_communication"
  | "ai_work_order_documentation"
  | "ai_shift_handoff"
  | "ai_root_cause_explanation"
  // Spaced-repetition review evidence (scheduler-generated)
  | "review_fault_retry"
  | "review_reasoning_check"
  | "review_safety_recheck"
  | "review_operator_communication"
  | "review_work_order_documentation";

export type Correctness = "correct" | "incorrect" | "partial";
export type ReasoningQuality = "sound" | "weak" | "flawed" | "none";

/**
 * A single evidence event. `learnerId`/`createdAt` are filled server-side from the
 * auth context and clock when omitted client-side. Shape mirrors the
 * competency_evidence table so a row round-trips without translation.
 */
export interface EvidenceEvent {
  learnerId?: number;
  sourceType: SourceType;
  evidenceType: EvidenceType;
  mechanicId?: LearningMechanicId;
  domain: SkillDomain;
  skill?: string;
  lessonId?: string;
  courseId?: string;
  competencyId?: string;
  correctness?: Correctness;
  reasoningQuality?: ReasoningQuality;
  /** 0–100 methodology overall (simulator). */
  methodologyScore?: number;
  methodologyTier?: string;
  /** 0–100 learner-reported certainty. */
  confidenceScore?: number;
  /** true = a safety violation occurred. */
  safetyFlag?: boolean;
  attemptNumber?: number;
  timeToDecisionMs?: number;
  createdAt?: string;
  detail?: Record<string, unknown>;
}

/** The interpreted effect of one evidence event on a competency. */
export type SignalDirection = "confirm" | "improve" | "weaken" | "needs_review" | "unsafe" | "ready_for_validation";

export interface CompetencySignal {
  domain: SkillDomain;
  direction: SignalDirection;
  /** Trust weight of this evidence, 0..1 (source × mechanic). */
  weight: number;
  /** The demonstrated quality this evidence represents, 0..100 (rolls into confidence). */
  demonstratedScore: number;
  mechanicId?: LearningMechanicId;
  sourceType: SourceType;
  /** Human-readable audit line — the WHY behind a competency change. */
  reason: string;
  safetyCritical: boolean;
  createdAt: string;
}

/** Manager-facing readiness state for a (learner, domain). */
export type ReadinessLevel =
  | "Ready"
  | "Almost Ready"
  | "Needs Training"
  | "Needs Review"
  | "Needs Safety Review"
  | "Needs Manager Validation"
  | "Promotion Candidate"
  | "Not Demonstrated";

export interface ReadinessSignal {
  domain: SkillDomain;
  level: ReadinessLevel;
  confidence: number; // 0..100 weighted demonstrated confidence
  competencyLevel: CompetencyLevel;
  decay: DecayStatus;
  attempts: number;
  managerValidated: boolean;
  hasSafetyViolation: boolean;
  needsReviewCount: number;
  /** The audit trail: why this readiness is what it is. */
  rationale: string[];
}

/** The interpreted effect of evidence on a competency, for persistence/audit. */
export interface MasteryUpdate {
  domain: SkillDomain;
  before: ReadinessSignal | null;
  after: ReadinessSignal;
  signal: CompetencySignal;
}

// ---------------------------------------------------------------------------
// Weights & tuning
// ---------------------------------------------------------------------------

/** Trust per source. Simulator (real performance) > manager > AI > review > lesson. */
export const SOURCE_WEIGHT: Record<SourceType, number> = {
  simulation: 1.0,
  manager_validation: 0.9,
  ai_mentor: 0.7,
  review: 0.5,
  lesson: 0.4,
};

/** A safety violation is weighted up so it dominates readiness. */
export const SAFETY_WEIGHT = 1.5;

/** Confidence floors the demonstrated quality of each outcome, per evidence type.
 *  These caps encode the quality rules: an action-only correct answer can never
 *  demonstrate as much as a correct answer with SOUND reasoning. */
function demonstratedScore(e: EvidenceEvent): number {
  const correct = e.correctness === "correct";
  const partial = e.correctness === "partial";
  switch (e.evidenceType) {
    case "simulation_completed":
    case "diagnosis_submitted":
      return clamp(e.methodologyScore ?? (correct ? 70 : 25));
    case "reasoned_answer": {
      if (!correct) return partial ? 40 : 25;
      // Right action — reasoning decides whether it is mastery or luck.
      switch (e.reasoningQuality) {
        case "sound": return 92; // right action, right reason — mastery-grade
        case "weak": return 60; // right by luck — coached, NOT mastery
        case "flawed": return 50;
        default: return 68; // reasoning unknown
      }
    }
    case "action_choice":
      return correct ? 70 : partial ? 45 : 30; // action only, capped below reasoned-sound
    case "prediction":
      return correct ? 66 : 30;
    case "ordering":
      return correct ? 70 : partial ? 50 : 32;
    case "live_interaction":
      return 64; // engagement + systems understanding (completion, capped — never mastery alone)
    case "review_recall":
    case "review_fault_retry":
    case "review_reasoning_check":
    case "review_safety_recheck":
    case "review_operator_communication":
    case "review_work_order_documentation":
      return correct ? 74 : 28; // delayed recall: pass reinforces, fail signals decay
    case "manager_attestation":
      return 82;
    case "safety_action":
      return e.safetyFlag ? 0 : 75;
    // AI mentor coaching — capped below authored evidence; combined with the 0.7
    // ai_mentor source weight this keeps a single AI interaction from creating mastery.
    case "ai_reasoning_check":
    case "ai_reflection":
    case "ai_correction":
    case "ai_confidence_check":
    case "ai_operator_communication":
    case "ai_work_order_documentation":
    case "ai_shift_handoff":
    case "ai_root_cause_explanation":
      // Capped so AI coaching / communication ALONE tops out at "Almost Ready" —
      // you still need sim / lesson / manager evidence to be "Ready". Never mastery
      // from one turn. Communication supports job-readiness; it never overrides
      // simulation or safety.
      switch (e.reasoningQuality) {
        case "sound": return 68;
        case "weak": return 45;
        case "flawed": return 30;
        default: return 25;
      }
    case "ai_hint_used":
      return 40; // hint reliance is a weak positive at best
    case "ai_explanation":
      return 35; // the mentor demonstrated; the learner didn't demonstrate
    case "ai_safety_intervention":
      return 0;
    default:
      return correct ? 60 : 30;
  }
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

// ---------------------------------------------------------------------------
// Interpret: EvidenceEvent -> CompetencySignal
// ---------------------------------------------------------------------------

/**
 * Manager/audit-facing enrichment: if the mentor's LLM cross-check escalated this
 * evidence, say so — a VP must trust not just the score but the reason behind it.
 * Reads the cross-check audit fields the mentor stores in evidence detail.
 */
function escalationNote(e: EvidenceEvent): string {
  const d = e.detail as Record<string, unknown> | undefined;
  if (!d || d.escalatedByLlm !== true) return "";
  const why = typeof d.llmReason === "string" && d.llmReason.trim() ? d.llmReason.trim() : null;
  const issues = Array.isArray(d.detectedIssues) ? (d.detectedIssues as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const issueText = issues.length ? issues.map((i) => i.replace(/_/g, " ")).join(", ") : null;
  return ` Escalated by mentor review${why ? `: ${why}` : issueText ? `: ${issueText}` : ""}.`;
}

/** Turn one raw evidence event into an interpreted competency signal. */
export function interpretEvidence(e: EvidenceEvent): CompetencySignal {
  const createdAt = e.createdAt ?? new Date().toISOString();
  const score = demonstratedScore(e);
  const base = SOURCE_WEIGHT[e.sourceType];

  // Safety violation short-circuits: heavy, unsafe, zero demonstrated quality.
  if (e.safetyFlag) {
    return {
      domain: e.domain, direction: "unsafe", weight: base * SAFETY_WEIGHT, demonstratedScore: 0,
      mechanicId: e.mechanicId, sourceType: e.sourceType, safetyCritical: true, createdAt,
      reason: `Safety-critical failure — readiness held back until a safety review clears it.${escalationNote(e)}`,
    };
  }

  if (e.sourceType === "manager_validation" || e.evidenceType === "manager_attestation") {
    return {
      domain: e.domain, direction: "ready_for_validation", weight: base, demonstratedScore: score,
      mechanicId: e.mechanicId ?? "managerValidation", sourceType: "manager_validation", safetyCritical: false, createdAt,
      reason: "Manager attested this competency on the plant floor (strengthens, does not replace, demonstrated evidence).",
    };
  }

  const correct = e.correctness === "correct";
  let direction: SignalDirection;
  let reason: string;

  if (e.evidenceType === "reasoned_answer" && correct) {
    if (e.reasoningQuality === "sound") { direction = "improve"; reason = "Right action for the right reason — mastery-grade reasoning."; }
    else if (e.reasoningQuality === "weak") { direction = "confirm"; reason = "Right action, weak reasoning — coached, not counted as mastery."; }
    else if (e.reasoningQuality === "flawed") { direction = "needs_review"; reason = "Right action, flawed reasoning — right by luck; needs reinforcement."; }
    else { direction = "confirm"; reason = "Right action; reasoning not captured."; }
  } else if (e.evidenceType === "review_recall" || e.evidenceType === "review_fault_retry" || e.evidenceType === "review_reasoning_check" || e.evidenceType === "review_safety_recheck" || e.evidenceType === "review_operator_communication" || e.evidenceType === "review_work_order_documentation") {
    direction = correct ? "confirm" : "needs_review";
    reason = correct ? "Passed spaced review — retention holding." : "Failed spaced review — knowledge decaying, resurfacing for review.";
  } else if (correct) {
    direction = "improve"; reason = `Demonstrated correctly (${e.evidenceType}).`;
  } else if (e.correctness === "partial") {
    direction = "confirm"; reason = `Partially correct (${e.evidenceType}).`;
  } else {
    direction = "weaken"; reason = `Incorrect (${e.evidenceType}) — surfaced for practice.`;
  }

  return {
    domain: e.domain, direction, weight: base, demonstratedScore: score,
    mechanicId: e.mechanicId, sourceType: e.sourceType, safetyCritical: false, createdAt,
    reason: `${reason}${escalationNote(e)}`,
  };
}

// ---------------------------------------------------------------------------
// Roll up: many signals -> one competency confidence + readiness
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CompetencyRollup {
  domain: SkillDomain;
  confidence: number; // 0..100 weighted demonstrated confidence
  attempts: number; // count of scored (non-manager, non-safety) demonstrations
  managerValidated: boolean;
  hasSafetyViolation: boolean;
  needsReviewCount: number;
  daysSince: number | null;
}

/**
 * Weighted demonstrated confidence from a domain's signals. Recent evidence is
 * weighted more (competency reflects CURRENT readiness, not historical completion).
 * Manager attestations and safety flags don't count as demonstrations, but they
 * modify readiness downstream.
 */
export function rollupDomain(domain: SkillDomain, signals: CompetencySignal[], now: number = Date.now()): CompetencyRollup {
  const demos = signals.filter((s) => s.sourceType !== "manager_validation" && !s.safetyCritical);
  let wsum = 0;
  let vsum = 0;
  let latest: number | null = null;
  for (const s of demos) {
    const ageDays = Math.max(0, (now - new Date(s.createdAt).getTime()) / DAY_MS);
    const recency = 1 / (1 + ageDays / 45); // half-ish weight after ~45 days
    const w = s.weight * recency;
    wsum += w;
    vsum += w * s.demonstratedScore;
    const t = new Date(s.createdAt).getTime();
    if (latest == null || t > latest) latest = t;
  }
  const confidence = wsum > 0 ? clamp(vsum / wsum) : 0;
  return {
    domain,
    confidence,
    attempts: demos.length,
    managerValidated: signals.some((s) => s.sourceType === "manager_validation"),
    hasSafetyViolation: signals.some((s) => s.safetyCritical),
    needsReviewCount: signals.filter((s) => s.direction === "needs_review" || s.direction === "weaken").length,
    daysSince: latest == null ? null : Math.floor((now - latest) / DAY_MS),
  };
}

/**
 * Derive the manager-facing readiness state. Encodes the quality rules:
 *  - a safety violation forces "Needs Safety Review" regardless of score;
 *  - strong demonstrated evidence without a manager sign-off is "Needs Manager Validation";
 *  - manager validation promotes a strong learner to "Promotion Candidate" but cannot
 *    turn weak evidence into readiness on its own.
 */
export function deriveReadiness(r: CompetencyRollup): ReadinessSignal {
  const level = competencyLevel(r.confidence, r.attempts);
  const decay = decayStatus(r.daysSince);
  const rationale: string[] = [];
  let readiness: ReadinessLevel;

  if (r.hasSafetyViolation) {
    readiness = "Needs Safety Review";
    rationale.push("A safety-critical failure is on record — safety review required before any readiness call.");
  } else if (r.attempts === 0) {
    readiness = r.managerValidated ? "Needs Training" : "Not Demonstrated";
    rationale.push(r.managerValidated
      ? "Manager attested, but no demonstrated evidence yet — the learner must show it (evidence governs)."
      : "No demonstrated evidence yet.");
  } else if (decay === "decayed" && r.attempts > 0) {
    readiness = "Needs Review";
    rationale.push("Competency has decayed — re-demonstration required.");
  } else if (r.confidence >= 85 && r.attempts >= 3 && r.managerValidated) {
    readiness = "Promotion Candidate";
    rationale.push("Expert-level demonstrated confidence, repeated, and manager-validated.");
  } else if (r.confidence >= 70 && r.attempts >= 2 && !r.managerValidated) {
    readiness = "Needs Manager Validation";
    rationale.push("Strong demonstrated evidence — awaiting a manager attestation to fully trust it.");
  } else if (r.confidence >= 70) {
    readiness = "Ready";
    rationale.push("Consistent, high-quality demonstrated evidence.");
  } else if (r.confidence >= 50) {
    readiness = "Almost Ready";
    rationale.push("Competent but not yet consistent — more practice needed.");
  } else if (r.needsReviewCount > 0 || decay !== "fresh") {
    readiness = "Needs Review";
    rationale.push("Recent misses or staleness — resurfacing for review.");
  } else {
    readiness = "Needs Training";
    rationale.push("Below the competent threshold — foundational training needed.");
  }

  // Manager validation strengthens but does not override: it can lift a genuinely
  // strong learner one notch, never manufacture readiness from weak evidence.
  if (r.managerValidated && readiness === "Ready" && r.confidence >= 82 && r.attempts >= 3) {
    readiness = "Promotion Candidate";
    rationale.push("Manager validation applied on top of strong evidence → promotion candidate.");
  }
  if (r.managerValidated && (readiness === "Needs Training" || readiness === "Almost Ready")) {
    rationale.push("Manager attestation noted, but demonstrated evidence is too weak to mark ready — evidence governs.");
  }

  return {
    domain: r.domain, level: readiness, confidence: r.confidence, competencyLevel: level, decay,
    attempts: r.attempts, managerValidated: r.managerValidated, hasSafetyViolation: r.hasSafetyViolation,
    needsReviewCount: r.needsReviewCount, rationale,
  };
}

// ---------------------------------------------------------------------------
// Communication competency — a VISIBLE job-readiness signal derived from the
// existing communication evidence. Not a separate scoring system: same evidence,
// same interpreter, same readiness rules. "Fix the machine AND explain it."
// ---------------------------------------------------------------------------

export const COMMUNICATION_AREAS = [
  { key: "fault_explanation", label: "Fault Explanation", evidenceType: "ai_reflection" as EvidenceType, blurb: "Explain what happened, what was verified vs assumed." },
  { key: "operator_communication", label: "Operator Communication", evidenceType: "ai_operator_communication" as EvidenceType, blurb: "Tell the operator clearly, calmly, without blame." },
  { key: "work_order", label: "Work Order Documentation", evidenceType: "ai_work_order_documentation" as EvidenceType, blurb: "Symptom, tests, evidence, cause, action, follow-up." },
  { key: "shift_handoff", label: "Shift Handoff", evidenceType: "ai_shift_handoff" as EvidenceType, blurb: "State, what's checked, what's still unknown, what to watch." },
  { key: "root_cause", label: "Root Cause Communication", evidenceType: "ai_root_cause_explanation" as EvidenceType, blurb: "Separate symptom from cause; no unsupported certainty." },
] as const;

const COMMUNICATION_EVIDENCE_TYPES: EvidenceType[] = COMMUNICATION_AREAS.map((a) => a.evidenceType);
const COMM_PLACEHOLDER_DOMAIN = "integration" as SkillDomain; // areas aren't domain-scoped; domain field unused for display

/** Cross-cutting communication competencies a manager can also attest. */
export const COMMUNICATION_CROSS_CUTTING = [
  { key: "verified_vs_assumed", label: "Verified vs Assumed" },
  { key: "safety_communication", label: "Safety Communication" },
] as const;

/** All manager-attestable communication keys (5 areas + 2 cross-cutting), for the UI. */
export const COMMUNICATION_VALIDATION_OPTIONS: { key: string; label: string }[] = [
  ...COMMUNICATION_AREAS.map((a) => ({ key: a.key, label: a.label })),
  ...COMMUNICATION_CROSS_CUTTING.map((c) => ({ key: c.key, label: c.label })),
];

/** The competency_validations.domain key for a communication attestation (reuses the
 *  existing validation table with a `comm:` namespace — no separate truth). */
export function communicationDomainKey(areaKey: string): string {
  return `comm:${areaKey}`;
}

export interface CommunicationArea {
  key: string;
  label: string;
  blurb: string;
  level: ReadinessLevel;
  confidence: number;
  attempts: number;
  decay: DecayStatus;
  hasSafetyViolation: boolean;
  needsReviewCount: number;
  /** A manager attested this area on the floor. */
  managerValidated: boolean;
  recentAudit: { reason: string; direction: SignalDirection; at: string }[];
}

export interface CommunicationReadiness {
  hasEvidence: boolean;
  overall: { level: ReadinessLevel; confidence: number; attempts: number };
  areas: CommunicationArea[];
  /** true when any communication evidence flagged an unsafe instruction. */
  safetyCommunicationRisk: boolean;
  /** cross-cutting: did they separate verified facts from assumptions? */
  verifiedVsAssumed: "strong" | "mixed" | "weak" | "none";
  /** cross-cutting competencies a manager has attested. */
  crossCuttingValidated: { key: string; label: string }[];
}

/** Which communication keys a manager has attested (from `comm:*` validation evidence). */
function validatedCommKeys(events: EvidenceEvent[]): Set<string> {
  return new Set(
    events
      .filter((e) => e.evidenceType === "manager_attestation" && typeof e.domain === "string" && e.domain.startsWith("comm:"))
      .map((e) => (e.domain as string).slice("comm:".length)),
  );
}

/**
 * Derive Maintenance-Communication readiness. Manager attestation STRENGTHENS a
 * demonstrated area (Almost Ready / Needs Manager Validation → Ready) — but only
 * when there is no unresolved safety flag, and never fabricates readiness from
 * nothing. A safety violation always forces "Needs Safety Review" regardless of
 * any manager attestation. Same evidence, same spine — one truth.
 */
export function communicationReadiness(events: EvidenceEvent[], now?: number): CommunicationReadiness {
  const commEvents = events.filter((e) => COMMUNICATION_EVIDENCE_TYPES.includes(e.evidenceType));
  const validated = validatedCommKeys(events);

  const areas: CommunicationArea[] = COMMUNICATION_AREAS.map((a) => {
    const signals = commEvents.filter((e) => e.evidenceType === a.evidenceType).map(interpretEvidence);
    const rollup = rollupDomain(COMM_PLACEHOLDER_DOMAIN, signals, now);
    const base = deriveReadiness(rollup);
    const managerValidated = validated.has(a.key);

    let level = base.level;
    if (rollup.hasSafetyViolation) {
      level = "Needs Safety Review"; // safety always wins; validation never clears it
    } else if (managerValidated && rollup.attempts > 0) {
      // Strengthen a genuinely demonstrated area — never invent readiness.
      if (level === "Almost Ready" || level === "Needs Manager Validation") level = "Ready";
      else if (level === "Ready" && rollup.confidence >= 80) level = "Promotion Candidate";
    }

    const recentAudit = signals
      .slice()
      .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())
      .slice(0, 3)
      .map((s) => ({ reason: s.reason, direction: s.direction, at: s.createdAt }));

    return {
      key: a.key,
      label: a.label,
      blurb: a.blurb,
      level,
      confidence: rollup.confidence,
      attempts: rollup.attempts,
      decay: base.decay,
      hasSafetyViolation: rollup.hasSafetyViolation,
      needsReviewCount: rollup.needsReviewCount,
      managerValidated,
      recentAudit,
    };
  });

  const allSignals = commEvents.map(interpretEvidence);
  const overallRollup = rollupDomain(COMM_PLACEHOLDER_DOMAIN, allSignals, now);
  const overall = { level: deriveReadiness(overallRollup).level, confidence: overallRollup.confidence, attempts: overallRollup.attempts };

  const sound = commEvents.filter((e) => e.reasoningQuality === "sound").length;
  const weakish = commEvents.filter((e) => e.reasoningQuality === "weak" || e.reasoningQuality === "flawed").length;
  const verifiedVsAssumed = commEvents.length === 0 ? "none" : sound > weakish ? "strong" : weakish > sound ? "weak" : "mixed";

  const crossCuttingValidated = COMMUNICATION_CROSS_CUTTING.filter((c) => validated.has(c.key)).map((c) => ({ key: c.key, label: c.label }));

  return {
    hasEvidence: commEvents.length > 0 || validated.size > 0,
    overall,
    areas,
    safetyCommunicationRisk: commEvents.some((e) => e.safetyFlag),
    verifiedVsAssumed,
    crossCuttingValidated,
  };
}

/** A compact recent-evidence summary for feeding the AI mentor's context. */
export function recentEvidenceSummary(signals: CompetencySignal[], limit = 6): {
  recentStrengths: string[];
  recentWeaknesses: string[];
  safetyCount: number;
} {
  const sorted = [...signals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recent = sorted.slice(0, limit);
  return {
    recentStrengths: recent.filter((s) => s.direction === "improve" || s.direction === "confirm").map((s) => s.reason).slice(0, 3),
    recentWeaknesses: recent.filter((s) => s.direction === "weaken" || s.direction === "needs_review").map((s) => s.reason).slice(0, 3),
    safetyCount: signals.filter((s) => s.safetyCritical).length,
  };
}

/** Convenience: events → readiness for one domain, in one call. */
export function readinessFromEvidence(domain: SkillDomain, events: EvidenceEvent[], now?: number): ReadinessSignal {
  const signals = events.filter((e) => e.domain === domain).map(interpretEvidence);
  return deriveReadiness(rollupDomain(domain, signals, now));
}

/**
 * A lean per-domain competency cell derived from the spine — the replacement for
 * the legacy scenario-only `buildCells`. Server code (planner, program) consumes
 * this so ALL competency computation flows through one evidence model.
 */
export interface ReadinessCell {
  domain: SkillDomain;
  label: string;
  confidence: number;
  level: CompetencyLevel;
  attempts: number;
  decay: DecayStatus;
  managerValidated: boolean;
  hasSafetyViolation: boolean;
  readinessLevel: ReadinessLevel;
}

/** Every domain's readiness cell from a learner's evidence (pure; DB-free). */
export function readinessCells(events: EvidenceEvent[], now?: number): ReadinessCell[] {
  const domains = Object.keys(SKILL_DOMAIN_LABELS) as SkillDomain[];
  return domains.map((d) => {
    const signals = events.filter((e) => e.domain === d).map(interpretEvidence);
    const rollup = rollupDomain(d, signals, now);
    const readiness = deriveReadiness(rollup);
    return {
      domain: d,
      label: SKILL_DOMAIN_LABELS[d],
      confidence: rollup.confidence,
      level: readiness.competencyLevel,
      attempts: rollup.attempts,
      decay: readiness.decay,
      managerValidated: rollup.managerValidated,
      hasSafetyViolation: rollup.hasSafetyViolation,
      readinessLevel: readiness.level,
    };
  });
}

/** Map demonstrated confidence to the methodology tier vocabulary the product uses.
 *  Same cut lines as the simulator scoring engine (85 / 65 / 40). */
export function methodologyTierFromConfidence(confidence: number): string {
  if (confidence >= 85) return "Master Diagnostician";
  if (confidence >= 65) return "Systematic Troubleshooter";
  if (confidence >= 40) return "Developing Technician";
  return "Needs Methodology Training";
}

/** True when a readiness set has any demonstrated evidence (drives empty states). */
export function hasAnyEvidence(readiness: { attempts: number; managerValidated: boolean; hasSafetyViolation: boolean }[]): boolean {
  return readiness.some((r) => r.attempts > 0 || r.managerValidated || r.hasSafetyViolation);
}

/** Overall demonstrated confidence across domains that have evidence (0 if none). */
export function overallConfidence(readiness: { confidence: number; attempts: number }[]): number {
  const demoed = readiness.filter((r) => r.attempts > 0);
  if (demoed.length === 0) return 0;
  return Math.round(demoed.reduce((s, r) => s + r.confidence, 0) / demoed.length);
}

// ---------------------------------------------------------------------------
// Source mappers — turn existing system outputs into EvidenceEvents
// ---------------------------------------------------------------------------

/** Simulator completion → evidence (the heaviest source). */
export function simulationEvidence(input: {
  domain: SkillDomain; scenarioSlug: string; methodologyScore: number; methodologyTier?: string;
  timeSeconds?: number; safetyFailed?: boolean; createdAt?: string;
}): EvidenceEvent {
  return {
    sourceType: "simulation", evidenceType: "simulation_completed", mechanicId: "competencyUpdate",
    domain: input.domain, competencyId: input.scenarioSlug,
    correctness: input.methodologyScore >= 65 ? "correct" : input.methodologyScore >= 40 ? "partial" : "incorrect",
    methodologyScore: input.methodologyScore, methodologyTier: input.methodologyTier,
    safetyFlag: input.safetyFailed ?? false,
    timeToDecisionMs: input.timeSeconds != null ? input.timeSeconds * 1000 : undefined,
    createdAt: input.createdAt,
  };
}

/** Spaced-review grade → evidence (drives current readiness / decay). SM-2 grade 0–5. */
export function reviewEvidence(input: { domain: SkillDomain; questionId: number | string; grade: number; createdAt?: string }): EvidenceEvent {
  return {
    sourceType: "review", evidenceType: "review_recall", mechanicId: "spacedReinforcement",
    domain: input.domain, competencyId: String(input.questionId),
    correctness: input.grade >= 3 ? "correct" : "incorrect", createdAt: input.createdAt,
  };
}

/** Manager attestation → evidence. */
export function managerValidationEvidence(input: { domain: SkillDomain; createdAt?: string }): EvidenceEvent {
  return {
    sourceType: "manager_validation", evidenceType: "manager_attestation", mechanicId: "managerValidation",
    domain: input.domain, createdAt: input.createdAt,
  };
}

/** Lesson interaction → evidence. Maps the interaction mechanics to evidence types. */
export function lessonInteractionEvidence(input: {
  domain: SkillDomain; lessonId: string; courseId?: string; mechanicId?: LearningMechanicId;
  interaction: "reasoned" | "choice" | "predict" | "sequence" | "live";
  correct?: boolean; reasoningQuality?: ReasoningQuality; attemptNumber?: number; createdAt?: string;
}): EvidenceEvent {
  const map: Record<string, EvidenceType> = {
    reasoned: "reasoned_answer", choice: "action_choice", predict: "prediction", sequence: "ordering", live: "live_interaction",
  };
  const mechDefault: Record<string, LearningMechanicId> = {
    reasoned: "reasonBeforeVerdict", choice: "askBeforeTell", predict: "predictBeforeReveal", sequence: "cheapestNextTest", live: "liveSystemInteraction",
  };
  return {
    sourceType: "lesson", evidenceType: map[input.interaction], mechanicId: input.mechanicId ?? mechDefault[input.interaction],
    domain: input.domain, lessonId: input.lessonId, courseId: input.courseId,
    correctness: input.interaction === "live" ? "correct" : input.correct ? "correct" : "incorrect",
    reasoningQuality: input.reasoningQuality, attemptNumber: input.attemptNumber, createdAt: input.createdAt,
  };
}
