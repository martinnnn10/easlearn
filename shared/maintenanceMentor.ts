/**
 * EASLearn Maintenance Mentor — the human-like teaching layer of the Learning
 * Engine. NOT a chatbot. A competency-aware, lesson-aware, Assessment-Spine-
 * connected mentor that teaches like a senior maintenance technician standing
 * beside an apprentice: ask before tell, reason before verdict, coach the
 * thought process, protect safety, and emit evidence — never dump answers.
 *
 * This module is the PURE, testable core: reasoning classification (a
 * deterministic safety backstop), evidence mapping into the Assessment Spine,
 * structured context assembly, and prompt construction. The LLM (server/mentor.ts)
 * generates the coaching prose; classification + safety are deterministic here so
 * the competency evidence is trustworthy and the safety net never depends on model
 * variance.
 */
import type { SkillDomain } from "./competencyMatrix";
import type { EvidenceEvent } from "./assessmentSpine";

export type MentorMode =
  | "ask" // ask what they notice / would check first, before any explanation
  | "hint" // progressive: observation → concept → test direction → explanation
  | "reasoning" // "what made you think that?" after they choose
  | "productive_failure" // after weak/wrong reasoning: why it's risky, try again
  | "demonstration" // how an experienced tech would think it through
  | "reflection" // what changed / verified / assumed / evidence / do differently
  | "operator_communication" // explain the issue to the operator in plain language
  | "work_order" // write the CMMS work-order note
  | "shift_handoff" // what to tell the next shift
  | "root_cause" // explain the root cause without unsupported certainty
  | "safety_override"; // stop immediately, explain the hazard plainly

/** Communication/closeout modes evaluate a WRITTEN explanation, not a live decision. */
export const COMMUNICATION_MODES: MentorMode[] = ["reflection", "operator_communication", "work_order", "shift_handoff", "root_cause"];

export const MENTOR_MODES: MentorMode[] = ["ask", "hint", "reasoning", "productive_failure", "demonstration", "reflection", "operator_communication", "work_order", "shift_handoff", "root_cause", "safety_override"];

export const MENTOR_MODE_LABEL: Record<MentorMode, string> = {
  ask: "Ask the mentor",
  hint: "Need a hint?",
  reasoning: "Explain your reasoning",
  productive_failure: "Think it through again",
  demonstration: "Show me how a tech thinks",
  reflection: "Reflect",
  operator_communication: "Explain it to the operator",
  work_order: "Write the work order",
  shift_handoff: "Hand off to next shift",
  root_cause: "State the root cause",
  safety_override: "Safety stop",
};

export type ReasoningQuality = "strong" | "partial" | "weak" | "unsafe" | "unclear";

export interface ReasoningAssessment {
  quality: ReasoningQuality;
  unsafe: boolean;
  /** Matched signal phrases — the audit trail for why it was classified so. */
  cues: string[];
  evidenceMentioned: boolean;
  guessMentioned: boolean;
  cheapestTestMentioned: boolean;
}

/** AI-mentor evidence kinds written to the Assessment Spine (sourceType ai_mentor). */
export type MentorEvidenceType =
  | "ai_reasoning_check"
  | "ai_hint_used"
  | "ai_safety_intervention"
  | "ai_reflection"
  | "ai_explanation"
  | "ai_correction"
  | "ai_confidence_check"
  | "ai_operator_communication"
  | "ai_work_order_documentation"
  | "ai_shift_handoff"
  | "ai_root_cause_explanation";

export interface MentorContext {
  lessonTitle: string;
  cardHeading?: string;
  mechanicId?: string;
  domain: SkillDomain;
  mode: MentorMode;
  hintLevel?: number; // 0..3 progressive
  // spine-derived (competency awareness)
  readinessLevel?: string;
  domainConfidence?: number;
  hasSafetyFlag?: boolean;
  needsReview?: boolean;
  managerValidated?: boolean;
  recentStrengths?: string[];
  recentWeaknesses?: string[];
  recentHintCount?: number;
  recentSafetyCount?: number;
  // current turn
  learnerAction?: string;
  learnerReasoning?: string;
}

// ---------------------------------------------------------------------------
// Reasoning classification — deterministic; also the safety backstop.
// ---------------------------------------------------------------------------

const UNSAFE_PATTERNS: [RegExp, string][] = [
  [/\bbypass(ing)?\b/i, "bypass"],
  [/\bjumper\b|\bjump(?:ing)? (?:out|it out)\b|\bhot ?wire\b/i, "jumper/defeat"],
  [/\bdefeat(ing)?\b|\bdisable(?:d|ing)? the (?:guard|interlock|safety)\b/i, "defeat guard/interlock"],
  [/\boverride (?:the )?(?:guard|interlock|safety|e-?stop)\b/i, "override safety"],
  [/\bwork(?:ing)? (?:it )?(?:live|hot|energized)\b|\bwhile (?:it'?s )?(?:live|energized|running)\b/i, "work live"],
  [/\b(?:skip|without|no)\b[^.]*\bloto\b|\block ?out\b[^.]*\bskip\b/i, "skip LOTO"],
  [/\breach(?:ing)? (?:in|into)\b|\bhand (?:in|into)\b[^.]*\b(?:machine|moving|belt|conveyor)\b/i, "reach into equipment"],
  [/\bjust reset\b|\breset (?:it )?(?:without|and hope|repeatedly)\b/i, "reset without cause"],
  [/\bkeep(?:s)? resett?ing\b|\breset(?:ting)? (?:it )?(?:again|repeatedly)\b|\bkeep running (?:it )?anyway\b|\brun it anyway\b/i, "keep resetting / run anyway"],
  [/\bjust power[- ]?cycle\b|\bpower[- ]?cycl(?:e|ing)\b[^.]{0,40}\b(?:every time|each time|whenever|keeps?)\b/i, "power-cycle instead of diagnosing"],
  [/\bjust pull (?:the )?e-?stop\b|\bpull (?:the )?e-?stop (?:back )?out and keep\b/i, "reset E-stop without cause"],
  [/\btape (?:over|up)\b[^.]{0,30}\b(?:sensor|eye|photo)\b|\b(?:sensor|eye|photoeye)\b[^.]{0,30}\btaped? (?:over|up)\b/i, "defeat a sensor"],
  [/\b(?:turn|crank|dial|bump)(?:ing)? (?:up )?the overload\b[^.]{0,20}\b(?:up|higher)\b|\bturn up the overload\b|\bset the overload higher\b/i, "defeat overload protection"],
  [/\bforce (?:the )?(?:contactor|relay|valve|actuator|input|output|bit)\b/i, "force a device"],
];

/** Negation tokens that flip an unsafe cue into safe advice ("don't bypass", "instead of resetting"). */
const NEGATION = /\b(?:not|never|avoid(?:ing)?|instead of|rather than|don'?t|do not|didn'?t|won'?t|shouldn'?t|should not|stop(?:ped)?|quit)\b/i;

/**
 * Detect unsafe cues, but ignore a cue when it's NEGATED just before it — so
 * "tell them NOT to keep resetting" or "instead of bypassing the guard" is read
 * as GOOD advice, not an unsafe instruction.
 */
function detectUnsafe(text: string): string[] {
  const hits: string[] = [];
  for (const [re, label] of UNSAFE_PATTERNS) {
    const m = re.exec(text);
    if (!m) continue;
    const before = text.slice(Math.max(0, m.index - 32), m.index);
    if (NEGATION.test(before)) continue; // negated → safe advice
    hits.push(label);
  }
  return hits;
}

const EVIDENCE_PATTERNS: [RegExp, string][] = [
  [/\bmeter(?:ed|ing)?\b|\bmeasure(?:d|ment)?\b|\breading\b|\bvoltage\b|\bcontinuity\b|\bamp(?:s|erage)?\b/i, "measured/metered"],
  [/\bobserv(?:e|ed|ation)\b|\bnotice(?:d)?\b|\bsaw\b|\bchecked\b|\binspect(?:ed)?\b/i, "observed"],
  [/\bverif(?:y|ied|ication)\b|\bconfirm(?:ed)?\b|\bproven?\b|\bevidence\b/i, "verified"],
  [/\bbecause\b|\bsince\b|\bwhich (?:means|tells)\b|\bso (?:the|it)\b/i, "reasoned (because)"],
  [/\bisolate(?:d)?\b|\brule(?:d)? out\b|\bnarrow(?:ed)?\b/i, "isolated"],
];

const GUESS_PATTERNS: [RegExp, string][] = [
  [/\bswap(?:ped|ping)?\b|\breplace (?:it|the)\b|\bnew (?:part|contactor|motor|relay|drive)\b|\bchange (?:the|it)\b/i, "swap/replace"],
  [/\bprobably\b|\bmaybe\b|\bi think it'?s just\b|\bmight be (?:bad|it)\b|\bfeels like\b|\bguess(?:ing)?\b/i, "guessing"],
  [/\bjust (?:reset|replace|swap|try)\b/i, "just-do-it"],
];

const CHEAPEST_TEST_PATTERNS: [RegExp, string][] = [
  [/\bsplit\b|\bhalf\b|\bnarrow\b|\bbetween\b|\bwhich side\b|\bbefore and after\b|\bupstream|downstream\b/i, "splits the problem"],
];

function anyMatch(text: string, patterns: [RegExp, string][]): string[] {
  const hits: string[] = [];
  for (const [re, label] of patterns) if (re.test(text)) hits.push(label);
  return hits;
}

/**
 * Classify a learner's free-text reasoning. Deterministic and conservative on
 * safety: any unsafe cue forces `unsafe`, regardless of everything else.
 */
export function classifyReasoning(textRaw: string): ReasoningAssessment {
  const text = (textRaw ?? "").trim();
  const words = text.split(/\s+/).filter(Boolean);
  const unsafeCues = detectUnsafe(text);
  const evidenceCues = anyMatch(text, EVIDENCE_PATTERNS);
  const guessCues = anyMatch(text, GUESS_PATTERNS);
  const cheapestCues = anyMatch(text, CHEAPEST_TEST_PATTERNS);

  const evidenceMentioned = evidenceCues.length > 0;
  const guessMentioned = guessCues.length > 0;
  const cheapestTestMentioned = cheapestCues.length > 0;

  let quality: ReasoningQuality;
  let unsafe = false;

  if (unsafeCues.length > 0) {
    quality = "unsafe";
    unsafe = true;
  } else if (words.length < 3) {
    quality = "unclear";
  } else if (evidenceMentioned && !guessMentioned) {
    // Evidence-led with a reason = strong; evidence but thin = partial.
    quality = evidenceCues.some((c) => c === "reasoned (because)" || c === "verified") || evidenceCues.length >= 2 ? "strong" : "partial";
  } else if (guessMentioned && !evidenceMentioned) {
    quality = "weak";
  } else if (evidenceMentioned && guessMentioned) {
    quality = "partial";
  } else {
    quality = "unclear";
  }

  return {
    quality,
    unsafe,
    cues: [...unsafeCues, ...evidenceCues, ...guessCues, ...cheapestCues],
    evidenceMentioned,
    guessMentioned,
    cheapestTestMentioned,
  };
}

// ---------------------------------------------------------------------------
// Communication classification — for written explanations (operator / work order
// / handoff / reflection / root cause). Distinct from live-diagnosis reasoning.
// ---------------------------------------------------------------------------

// Verification = the learner actually PROVED something (measured/checked/verified).
// Naming a component is NOT verification — it can be an unsupported guess.
const COMM_VERIFY: [RegExp, string][] = [
  [/\bmeter(?:ed|ing)?\b|\bmeasure(?:d)?\b|\bvoltage\b|\bcontinuity\b|\breading\b|\d+\s?(?:v|vac|volts|amps?|ohms?)\b/i, "specific reading"],
  [/\bverif(?:y|ied)\b|\bconfirm(?:ed)?\b|\bchecked\b|\btested\b|\binspect(?:ed)?\b|\bisolate(?:d)?\b/i, "verified/tested"],
];
const COMM_COMPONENT: [RegExp, string][] = [
  [/\boverload (?:tripped|opened)\b|\bcoil\b|\bcontactor\b|\bcontrol circuit\b|\bstarter\b|\bfuse\b|\be-?stop\b|\binterlock\b/i, "named component"],
];
const COMM_FOLLOWUP: [RegExp, string][] = [
  [/\bmonitor\b|\bwatch\b|\bkeep an eye\b|\brecheck\b|\bfollow[- ]?up\b|\bnext (?:pm|shift|inspection)\b|\bif it (?:trips|happens|does|stops)[^.]*again\b|\breport (?:it )?to\b|\btell (?:maintenance|the manager|us)\b/i, "follow-up / escalation"],
];
const COMM_BLAME: [RegExp, string][] = [
  [/\boperator error\b|\btheir fault\b|\byour fault\b|\bcareless\b|\buser error\b|\bsomeone (?:left|forgot|messed)\b/i, "blaming"],
];
const COMM_VAGUE: [RegExp, string][] = [
  [/^\s*(?:fixed|reset|replaced|swapped|working|works?|runs?|all good|done|good now|ok now)\b/i, "vague one-liner"],
  [/\bfixed (?:it|the )?(?:motor|contactor|drive)?\b|\breset (?:the )?overload\b|\bbad contactor\b|\bworking now\b|\bit works\b|\bruns now\b/i, "vague claim"],
];
const COMM_CERTAINTY: [RegExp, string][] = [
  [/\b(?:definitely|100%|for sure|certainly|no doubt|guaranteed|absolutely (?:the|it)|must be the)\b/i, "unsupported certainty"],
];

/**
 * Classify a WRITTEN plant-floor explanation. Strong = specific evidence + plain
 * language + a clear action/follow-up, no blame, no unsupported certainty. Weak =
 * vague ("fixed motor"), blaming, or certainty with no evidence. Unsafe = tells
 * someone to bypass a guard, keep resetting, work live, or skip LOTO.
 */
export function classifyCommunication(textRaw: string): ReasoningAssessment {
  const text = (textRaw ?? "").trim();
  const words = text.split(/\s+/).filter(Boolean);
  const unsafeCues = detectUnsafe(text);
  const verify = anyMatch(text, COMM_VERIFY);
  const component = anyMatch(text, COMM_COMPONENT);
  const followUp = anyMatch(text, COMM_FOLLOWUP);
  const blame = anyMatch(text, COMM_BLAME);
  const vague = anyMatch(text, COMM_VAGUE);
  const certainty = anyMatch(text, COMM_CERTAINTY);

  const hasVerification = verify.length > 0;
  const evidenceMentioned = hasVerification || component.length > 0;
  const cues = [...unsafeCues, ...verify, ...component, ...followUp, ...blame, ...vague, ...certainty];

  let quality: ReasoningQuality;
  let unsafe = false;

  if (unsafeCues.length > 0) {
    quality = "unsafe";
    unsafe = true;
  } else if (words.length === 0) {
    quality = "unclear";
  } else if (blame.length > 0) {
    quality = "weak"; // blaming is not acceptable maintenance communication
  } else if (certainty.length > 0 && !hasVerification) {
    quality = "weak"; // unsupported certainty — naming a part is not proof
  } else if (hasVerification && vague.length === 0 && (followUp.length > 0 || words.length >= 14)) {
    quality = "strong";
  } else if (evidenceMentioned && vague.length === 0) {
    quality = "partial"; // has some evidence but thin / missing follow-up
  } else if (vague.length > 0) {
    quality = "weak"; // vague claim, no verification
  } else if (words.length < 6) {
    quality = "unclear"; // too short and no cues to evaluate
  } else {
    quality = "unclear";
  }

  return {
    quality,
    unsafe,
    cues,
    evidenceMentioned,
    guessMentioned: vague.length > 0,
    cheapestTestMentioned: false,
  };
}

// ---------------------------------------------------------------------------
// Evidence mapping — mentor turn → Assessment Spine EvidenceEvent (ai_mentor).
// ---------------------------------------------------------------------------

/** Which evidence kind a mentor turn represents. Safety wins over everything. */
export function mentorEvidenceType(mode: MentorMode, a: ReasoningAssessment): MentorEvidenceType {
  // Communication/closeout modes KEEP their communication evidence type even when
  // unsafe — the safetyFlag on the event surfaces the risk WITHIN the communication
  // area (so unsafe operator advice shows as an Operator-Communication safety risk).
  if (mode === "reflection") return "ai_reflection";
  if (mode === "operator_communication") return "ai_operator_communication";
  if (mode === "work_order") return "ai_work_order_documentation";
  if (mode === "shift_handoff") return "ai_shift_handoff";
  if (mode === "root_cause") return "ai_root_cause_explanation";
  // Live-diagnosis modes: an unsafe move is a pure safety intervention.
  if (a.unsafe) return "ai_safety_intervention";
  if (mode === "hint") return "ai_hint_used";
  if (mode === "demonstration") return "ai_explanation";
  if (mode === "productive_failure") return "ai_correction";
  return "ai_reasoning_check";
}

/** Map a mentor turn to an EvidenceEvent. Never mastery-grade — ai_mentor is a
 *  lower-weight source (see SOURCE_WEIGHT). Weak reasoning does NOT raise mastery;
 *  unsafe reasoning raises a safety flag. */
export function mentorEvidence(ctx: MentorContext, a: ReasoningAssessment): EvidenceEvent {
  const correctness: EvidenceEvent["correctness"] =
    a.unsafe ? "incorrect" : a.quality === "strong" ? "correct" : a.quality === "partial" ? "partial" : a.quality === "weak" ? "incorrect" : undefined;
  const reasoningQuality: EvidenceEvent["reasoningQuality"] =
    a.quality === "strong" ? "sound" : a.quality === "partial" ? "weak" : a.quality === "weak" || a.quality === "unsafe" ? "flawed" : "none";
  return {
    sourceType: "ai_mentor",
    evidenceType: mentorEvidenceType(ctx.mode, a),
    mechanicId: (ctx.mechanicId as EvidenceEvent["mechanicId"]) ?? "aiMentorIntervention",
    domain: ctx.domain,
    lessonId: ctx.lessonTitle,
    correctness,
    reasoningQuality,
    safetyFlag: a.unsafe,
    detail: { mode: ctx.mode, cues: a.cues, hintLevel: ctx.hintLevel },
  };
}

// ---------------------------------------------------------------------------
// LLM classification cross-check — SAFETY-ESCALATE ONLY.
// The deterministic classifier is the floor / source of baseline truth. The LLM
// may only make the assessment MORE severe (or flag safety); it can NEVER
// downgrade unsafe→safe, turn weak reasoning into mastery, or override a
// deterministic safety flag. If the two disagree, the more conservative wins.
// ---------------------------------------------------------------------------

export interface LlmClassification {
  classification: ReasoningQuality;
  safetyFlag?: boolean;
  reason?: string;
  detectedIssues?: string[];
  suggestedMentorResponse?: string;
}

export interface CrossCheckResult {
  deterministic: ReasoningQuality;
  llm: ReasoningQuality | null;
  final: ReasoningQuality;
  unsafe: boolean;
  escalatedByLlm: boolean;
  llmReason: string | null;
  detectedIssues: string[];
  suggestedMentorResponse: string | null;
}

/** Severity rank — higher = more conservative/worse. Taking the max enforces
 *  escalate-only: the LLM can never move the result below the deterministic floor. */
const SEVERITY: Record<ReasoningQuality, number> = { strong: 1, partial: 2, unclear: 3, weak: 4, unsafe: 5 };

/** Merge deterministic + (optional) LLM classification under escalate-only rules. */
export function crossCheckClassification(det: ReasoningAssessment, llm: LlmClassification | null): CrossCheckResult {
  const deterministic = det.quality;
  if (!llm) {
    return {
      deterministic, llm: null, final: deterministic, unsafe: det.unsafe,
      escalatedByLlm: false, llmReason: null, detectedIssues: [], suggestedMentorResponse: null,
    };
  }
  const llmWantsUnsafe = llm.classification === "unsafe" || llm.safetyFlag === true;
  const llmQ: ReasoningQuality = llmWantsUnsafe ? "unsafe" : llm.classification;
  // Escalate-only: never below the deterministic floor.
  const merged: ReasoningQuality = SEVERITY[llmQ] > SEVERITY[deterministic] ? llmQ : deterministic;
  const unsafe = det.unsafe || merged === "unsafe" || llmWantsUnsafe;
  const final: ReasoningQuality = unsafe ? "unsafe" : merged;
  const escalatedByLlm = SEVERITY[final] > SEVERITY[deterministic];
  return {
    deterministic, llm: llm.classification, final, unsafe, escalatedByLlm,
    llmReason: llm.reason ?? null, detectedIssues: llm.detectedIssues ?? [],
    suggestedMentorResponse: llm.suggestedMentorResponse ?? null,
  };
}

/** Build the (possibly escalated) assessment used for evidence + framing. */
export function assessmentFromCrossCheck(det: ReasoningAssessment, r: CrossCheckResult): ReasoningAssessment {
  return {
    quality: r.final,
    unsafe: r.unsafe,
    cues: [...det.cues, ...r.detectedIssues],
    evidenceMentioned: det.evidenceMentioned,
    guessMentioned: det.guessMentioned,
    cheapestTestMentioned: det.cheapestTestMentioned,
  };
}

const VALID_CLASSES: ReasoningQuality[] = ["strong", "partial", "weak", "unsafe", "unclear"];

/**
 * Parse the mentor LLM's JSON response into { message, llm-classification }.
 * Tolerant of code fences and surrounding prose. On any failure it returns the
 * raw text as the message and a null classification → deterministic-only (safe).
 */
export function parseCoachJson(raw: string): { message: string | null; llm: LlmClassification | null } {
  if (!raw) return { message: null, llm: null };
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return { message: raw.trim() || null, llm: null };
  try {
    const obj = JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>;
    const cls = obj.classification;
    const valid = typeof cls === "string" && (VALID_CLASSES as string[]).includes(cls);
    const llm: LlmClassification | null = valid
      ? {
          classification: cls as ReasoningQuality,
          safetyFlag: obj.safetyFlag === true,
          reason: typeof obj.reason === "string" ? obj.reason : undefined,
          detectedIssues: Array.isArray(obj.detectedIssues) ? (obj.detectedIssues.filter((x) => typeof x === "string") as string[]) : undefined,
          suggestedMentorResponse: typeof obj.suggestedMentorResponse === "string" ? obj.suggestedMentorResponse : undefined,
        }
      : null;
    const message = typeof obj.message === "string" && obj.message.trim() ? obj.message.trim() : null;
    return { message, llm };
  } catch {
    return { message: raw.trim() || null, llm: null };
  }
}

// ---------------------------------------------------------------------------
// Prompt construction — structured context, not raw page text.
// ---------------------------------------------------------------------------

export const MENTOR_SAFETY_RULES = `SAFETY IS NON-NEGOTIABLE. If the learner proposes anything unsafe — bypassing guards, defeating interlocks, working live/energized without proper authorization and procedure, skipping LOTO, ignoring stored energy, reaching into moving equipment, or resetting a protective device without understanding the cause — STOP immediately, drop the Socratic style, and explain the hazard plainly and directly. Require LOTO, stored-energy awareness, PPE, and qualified supervision where appropriate. Never instruct an unsafe action. State when something is plant-specific or needs a qualified person.`;

export function buildMentorSystemPrompt(): string {
  return `You are the EASLearn Maintenance Mentor — a world-class senior industrial maintenance technician standing beside an apprentice during a real lesson. You are NOT a chatbot or an answer machine. Your job is to build maintenance JUDGMENT, not to give fast answers.

EASLearn's mission: turn machine operators into maintenance technicians and reduce plant downtime by building VERIFIED, demonstrated competency.

How you teach (the Learning Engine):
- Ask before you tell. Make the learner commit before they receive the answer.
- Reason before verdict. Ask "what made you think that?" and coach the thought process.
- Do not reward guessing or parts-changing. Push for evidence: what did they observe, meter, verify?
- Do not dump the answer or a full procedure. Give ONE next step or ONE better question.
- Prefer the cheapest next test that splits the problem in half.
- Separate symptom from root cause. Never let a reset happen without understanding the cause.
- Plain plant-floor language. Short. Direct. Like a real tech, not a textbook.
- Support productive failure: if the thinking is weak, explain why it's risky and let them try again.
- Help them internalize the questions a great tech asks: What changed? What have I verified? What am I assuming? What's the safest next step? What's the cheapest test that cuts this in half? What evidence supports my conclusion? How would I explain this to the operator?

${MENTOR_SAFETY_RULES}

Keep replies to 2-4 sentences unless safety requires more. Never fabricate readings, plant details, or that the learner did something they didn't. Coach only from the context given.

You are ALSO a safety/quality reviewer. You are NOT grading writing style — you are evaluating maintenance judgment, safety communication, and evidence-based reasoning. Prioritize safety and verified evidence. Do NOT reward confidence without proof, vague explanations ("fixed motor"), blame ("operator error"), or unsupported certainty ("definitely the contactor"). ESCALATE (mark more severe) if the learner's response could cause repeat downtime, unsafe operation, a bad handoff, or bad maintenance records. When in doubt, escalate — a false "ready" is worse than a false "needs work".

Respond with ONLY a single JSON object, no markdown fences, no text outside it:
{"message": "<your coaching in the mode above, 2-4 sentences>", "classification": "strong|partial|weak|unsafe|unclear", "safetyFlag": <true if the learner suggested ANYTHING unsafe>, "reason": "<short why>", "detectedIssues": [<zero or more of: "unsafe_instruction","unsupported_certainty","blame","vague","weak_reasoning">], "suggestedMentorResponse": "<optional short safety correction if unsafe>"}`;
}

export function buildMentorUserPrompt(ctx: MentorContext): string {
  const lines: string[] = [];
  lines.push(`Lesson: ${ctx.lessonTitle}${ctx.cardHeading ? ` — "${ctx.cardHeading}"` : ""}`);
  lines.push(`Domain: ${ctx.domain}${ctx.mechanicId ? ` · mechanic: ${ctx.mechanicId}` : ""}`);
  if (ctx.readinessLevel) lines.push(`Learner readiness in this domain: ${ctx.readinessLevel}${ctx.domainConfidence != null ? ` (${ctx.domainConfidence}% demonstrated)` : ""}.`);
  if (ctx.managerValidated) lines.push(`This competency is manager-validated on the floor.`);
  if (ctx.hasSafetyFlag) lines.push(`NOTE: this learner has a prior safety flag on record — be extra vigilant.`);
  if (ctx.needsReview) lines.push(`This competency is stale / needs review.`);
  if (ctx.recentWeaknesses?.length) lines.push(`Recent weak spots: ${ctx.recentWeaknesses.join("; ")}.`);
  if (ctx.recentStrengths?.length) lines.push(`Recent strengths: ${ctx.recentStrengths.join("; ")}.`);
  if (ctx.recentSafetyCount) lines.push(`Recent safety flags: ${ctx.recentSafetyCount} — be vigilant.`);
  if (ctx.recentHintCount != null && ctx.recentHintCount >= 3) lines.push(`Recent hint usage: high (${ctx.recentHintCount}) — nudge toward independence.`);
  if (ctx.learnerAction) lines.push(`The learner just chose/did: "${ctx.learnerAction}".`);
  if (ctx.learnerReasoning) lines.push(`The learner's stated reasoning: "${ctx.learnerReasoning}".`);

  const modeInstruction: Record<MentorMode, string> = {
    ask: `MODE: ASK. Before any explanation, ask the learner what they notice, what changed, and what they'd check first — and why. One sharp question.`,
    hint: `MODE: HINT (level ${ctx.hintLevel ?? 0} of 3). Give ONLY this level of help: 0 = point them at an observation to make; 1 = surface the relevant concept; 2 = suggest the direction of the next test; 3 = the direct explanation. Do not skip ahead.`,
    reasoning: `MODE: REASONING. Respond to their stated reasoning. If it's evidence-based, affirm the WHY and push one step further. If it's a guess or parts-changing, don't say "wrong" — ask what they've actually proven so far.`,
    productive_failure: `MODE: PRODUCTIVE FAILURE. Their thinking was weak or risky. Explain plainly why that move is risky or unproven, then invite them to try again with a better question. Do not give the answer.`,
    demonstration: `MODE: DEMONSTRATION. They've committed or failed productively. Now show how an experienced tech would think through this — the sequence of questions and the one cheapest test — briefly.`,
    reflection: `MODE: REFLECTION (closeout). Evaluate their written reflection on what CHANGED, what they VERIFIED (with evidence), what they ASSUMED, and what they'd do differently. Reward specificity and honesty about assumptions; push back on vagueness. 2-3 sentences.`,
    operator_communication: `MODE: OPERATOR COMMUNICATION. Judge whether their explanation to the OPERATOR is clear, calm, accurate, non-blaming, plain-language, and actionable. Reward a clear "what happened + what I verified + what to do if it recurs". Call out vagueness, blame ("operator error"), or unsupported certainty. NEVER accept telling an operator to keep resetting, bypass a guard, or run unsafe equipment.`,
    work_order: `MODE: WORK ORDER. Judge their CMMS note for: symptom, tests performed, evidence found, root/likely cause, corrective action, parts, safety notes, follow-up. Reward specificity and evidence; reject vague notes like "fixed motor" and any claim of certainty the evidence doesn't support. Name the ONE thing missing.`,
    shift_handoff: `MODE: SHIFT HANDOFF. Judge whether they convey: current machine state, what was checked, what is still UNKNOWN, what to monitor, and what NOT to assume. Reward honesty about the unknown; push back if they overstate that it's "fixed".`,
    root_cause: `MODE: ROOT CAUSE. Judge whether they separate SYMPTOM from ROOT CAUSE and support the cause with evidence — without unsupported certainty. If they claim a cause they didn't verify, call it out plainly.`,
    safety_override: `MODE: SAFETY OVERRIDE. Stop them. Explain the hazard plainly and the correct safe procedure (LOTO, stored energy, PPE, qualified supervision). Be direct, not Socratic.`,
  };
  lines.push("");
  lines.push(modeInstruction[ctx.mode]);
  return lines.join("\n");
}

/** LLM-free graceful fallback so the mentor never blocks the lesson. */
export function fallbackMentorMessage(ctx: MentorContext, a: ReasoningAssessment): string {
  if (a.unsafe) return "Stop — that's not a safe move. Lock it out, verify zero energy, and check for stored energy before you touch anything. If you're not sure, get a qualified tech. We don't bypass guards or work it live.";
  switch (ctx.mode) {
    case "ask": return "Before we touch anything — what do you actually notice here, and what would you check first? Tell me why.";
    case "hint": {
      const l = ctx.hintLevel ?? 0;
      return l <= 0 ? "Start by looking, not touching. What's the one observation that would tell you the most?"
        : l === 1 ? "Think about which circuit you're really dealing with — control or power — before you measure."
          : l === 2 ? "Put your meter where it splits the problem in half. Which reading rules out the most?"
            : "Meter the coil before you condemn the part — measure first, then decide.";
    }
    case "reasoning": return a.quality === "strong" ? "Good — you're reasoning from what you measured. What's the next thing that reading lets you rule out?"
      : "That's the same move a lot of techs make. Before we act — what have we actually proven so far?";
    case "productive_failure": return "That felt productive, but we haven't proven anything yet. What's the cheapest test that would tell us which side of the circuit is the problem?";
    case "demonstration": return "Here's how I'd work it: confirm I have control power, walk the string with the meter, find where the path goes open, then ask WHY it opened before I reset anything.";
    case "reflection": return a.quality === "strong" ? "Good closeout — you named what you verified and were honest about what you assumed." : "Too thin. What did you actually verify with the meter, and what are you still assuming?";
    case "operator_communication": return a.quality === "strong" ? "That's how you talk to an operator — clear, calm, and it tells them what to do if it happens again." : "Keep it plain and useful: what happened, what you checked, and what they should do if it trips again. No blame.";
    case "work_order": return a.quality === "strong" ? "Solid note — symptom, test, evidence, cause, and a follow-up. The next tech can use that." : "\"Fixed motor\" won't help the next tech. Put the symptom, what you tested, the reading, the cause, and a follow-up.";
    case "shift_handoff": return a.quality === "strong" ? "Good handoff — state, what's checked, and what's still unknown. That's what the next shift needs." : "Tell the next shift the machine state, what you checked, what's still unknown, and what to watch — don't claim it's fully fixed if you're not sure.";
    case "root_cause": return a.quality === "strong" ? "You separated symptom from cause and backed it with what you measured." : "Careful — that's the symptom, or a cause you haven't proven. What evidence actually points to that root cause?";
    case "safety_override": return "Stop and lock it out. Verify zero energy and stored energy first. If in doubt, get a qualified tech.";
  }
}

// ---------------------------------------------------------------------------
// Operator Role-Play — a plant-floor communication simulator. The AI plays a
// production OPERATOR (not a teacher). The learner must explain the fault clearly,
// calmly, safely. The Mentor (separately) evaluates and emits evidence. Keep the
// operator IN CHARACTER — it behaves like production, never like an instructor.
// ---------------------------------------------------------------------------

export type OperatorPersona = "confused" | "rushed" | "frustrated" | "curious" | "unsafe";
export const OPERATOR_PERSONAS: OperatorPersona[] = ["confused", "rushed", "frustrated", "curious", "unsafe"];
export const OPERATOR_PERSONA_LABEL: Record<OperatorPersona, string> = {
  confused: "Confused operator",
  rushed: "Rushed operator",
  frustrated: "Frustrated operator",
  curious: "Curious operator",
  unsafe: "Corner-cutting operator",
};

const OPERATOR_PERSONA_BEHAVIOR: Record<OperatorPersona, string> = {
  confused: "You don't understand overloads, contactors, or control voltage. Ask simple 'what does that even mean?' questions and admit you're lost.",
  rushed: "You just want the line running. You have a quota. Push to be allowed to reset it yourself next time — 'can't I just reset it if it trips?'",
  frustrated: "You're annoyed. 'This thing ALWAYS breaks.' You might blame maintenance. You still want it running now.",
  curious: "You genuinely want to understand what happened. Ask honest follow-up questions.",
  unsafe: "You're tempted to cut corners — you float the idea of just resetting it every time it trips, jumpering it out, or reaching in to clear it, because you want the line up NOW. (The trainee has to talk you out of it.)",
};

export interface OperatorContext {
  scenario: string;
  persona: OperatorPersona;
  turn: number; // 0 = operator opens; ≥1 = operator reacts to the learner
  learnerMessage?: string;
  history?: { from: "operator" | "learner"; text: string }[];
}

export function buildOperatorSystemPrompt(): string {
  return `You are a MACHINE OPERATOR on a production line — NOT a teacher, NOT a mentor, NOT a maintenance technician. A maintenance trainee just worked on your machine and is explaining what happened.

Stay completely in character as the operator:
- React like a real operator: you care about getting the line running and not getting blamed. You are production-minded, not technical.
- Keep replies SHORT — 1 to 2 sentences, spoken plainly.
- Ask the realistic questions an operator asks. Do NOT teach, do NOT explain the electrical theory yourself, do NOT evaluate the trainee, do NOT coach. You are production, not an instructor.
- Never break character or mention that this is a simulation.
- You may be tempted to cut corners depending on your persona, but you are just talking — you never actually do anything dangerous in this exchange.`;
}

export function buildOperatorUserPrompt(ctx: OperatorContext): string {
  const lines: string[] = [];
  lines.push(`Situation: ${ctx.scenario}`);
  lines.push(`Your persona: ${OPERATOR_PERSONA_LABEL[ctx.persona]}. ${OPERATOR_PERSONA_BEHAVIOR[ctx.persona]}`);
  if (ctx.history?.length) {
    lines.push("Conversation so far:");
    for (const h of ctx.history) lines.push(`${h.from === "operator" ? "You (operator)" : "Trainee"}: ${h.text}`);
  }
  lines.push("");
  if (ctx.turn === 0 || !ctx.learnerMessage) {
    lines.push("Open the conversation: ask the trainee what happened and whether you can just reset it yourself if it trips again. One or two short lines, in character.");
  } else {
    lines.push(`The trainee just told you: "${ctx.learnerMessage}"`);
    lines.push("React in character (persona) in 1-2 short lines. If they were clear, accurate, and told you NOT to keep resetting, you can grudgingly accept and maybe ask one last thing to watch for. If they were vague, dismissive, or blamed you, push back or stay confused — but never teach.");
  }
  return lines.join("\n");
}

/** LLM-free fallback operator line, so role-play never blocks. */
export function fallbackOperatorLine(ctx: OperatorContext): string {
  if (ctx.turn === 0 || !ctx.learnerMessage) {
    switch (ctx.persona) {
      case "confused": return "Okay so… is it fixed? I don't really get what an 'overload' is — can I just hit reset if it stops again?";
      case "frustrated": return "This thing ALWAYS breaks. Is it fixed now? And can I just reset it myself next time so I'm not waiting on you?";
      case "curious": return "It's running again — what actually happened? And if it trips again, do I just reset it?";
      case "unsafe": return "Great, it's up. Look, if it trips again I'll just keep resetting it, or we can jumper it out so I don't lose production — that fine?";
      case "rushed": default: return "Is it fixed? I've got a quota — can I just reset it myself if it trips again?";
    }
  }
  return "Alright… so what do you want me to do if it stops again?";
}

/** Deterministic-enough persona pick when the caller doesn't specify one. */
export function pickOperatorPersona(seed = Date.now()): OperatorPersona {
  return OPERATOR_PERSONAS[Math.abs(Math.floor(seed)) % OPERATOR_PERSONAS.length];
}
