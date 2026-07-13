import { describe, it, expect } from "vitest";
import {
  classifyReasoning,
  classifyCommunication,
  mentorEvidence,
  mentorEvidenceType,
  buildMentorSystemPrompt,
  buildMentorUserPrompt,
  fallbackMentorMessage,
  buildOperatorSystemPrompt,
  buildOperatorUserPrompt,
  fallbackOperatorLine,
  crossCheckClassification,
  assessmentFromCrossCheck,
  parseCoachJson,
  type MentorContext,
  type LlmClassification,
} from "./maintenanceMentor";
import { interpretEvidence, readinessFromEvidence, communicationReadiness, SOURCE_WEIGHT } from "./assessmentSpine";

const baseCtx = (over: Partial<MentorContext> = {}): MentorContext => ({
  lessonTitle: "Motor Control Circuits",
  cardHeading: "So — what's your first move?",
  mechanicId: "reasonBeforeVerdict",
  domain: "motors",
  mode: "reasoning",
  ...over,
});

describe("Maintenance Mentor — reasoning classification", () => {
  it("classifies evidence-led reasoning as strong", () => {
    const a = classifyReasoning("I metered the coil at A1-A2, so the coil is starved of voltage");
    expect(a.quality).toBe("strong");
    expect(a.unsafe).toBe(false);
    expect(a.evidenceMentioned).toBe(true);
  });

  it("classifies guessing / parts-changing as weak", () => {
    const a = classifyReasoning("I'd just swap the contactor, it's probably bad");
    expect(a.quality).toBe("weak");
    expect(a.guessMentioned).toBe(true);
  });

  it("flags unsafe reasoning regardless of anything else", () => {
    expect(classifyReasoning("bypass the guard and jog it").unsafe).toBe(true);
    expect(classifyReasoning("just work it live, it's faster").quality).toBe("unsafe");
    expect(classifyReasoning("skip the loto and reset it").unsafe).toBe(true);
  });

  it("classifies too-short input as unclear", () => {
    expect(classifyReasoning("idk").quality).toBe("unclear");
    expect(classifyReasoning("").quality).toBe("unclear");
  });

  it("classifies mixed evidence + guess as partial", () => {
    const a = classifyReasoning("I think I should measure the voltage but maybe just replace it");
    expect(a.quality).toBe("partial");
  });
});

describe("Maintenance Mentor — evidence mapping", () => {
  it("weak reasoning does NOT create mastery-grade evidence", () => {
    const a = classifyReasoning("just swap it, probably bad");
    const ev = mentorEvidence(baseCtx(), a);
    expect(ev.sourceType).toBe("ai_mentor");
    expect(ev.reasoningQuality).toBe("flawed");
    expect(ev.correctness).toBe("incorrect");
    const sig = interpretEvidence(ev);
    expect(sig.direction).toBe("weaken");
    expect(sig.demonstratedScore).toBeLessThan(60);
  });

  it("unsafe reasoning emits a safety intervention with a safety flag", () => {
    const a = classifyReasoning("bypass the interlock");
    const ev = mentorEvidence(baseCtx({ mode: "reasoning" }), a);
    expect(ev.evidenceType).toBe("ai_safety_intervention");
    expect(ev.safetyFlag).toBe(true);
    const sig = interpretEvidence(ev);
    expect(sig.direction).toBe("unsafe");
    expect(sig.safetyCritical).toBe(true);
  });

  it("strong reasoning emits positive but LIMITED-weight evidence (lower than sim/manager)", () => {
    const a = classifyReasoning("I metered it and verified voltage is present, so the break is downstream");
    const ev = mentorEvidence(baseCtx(), a);
    expect(ev.correctness).toBe("correct");
    expect(ev.reasoningQuality).toBe("sound");
    const sig = interpretEvidence(ev);
    expect(sig.weight).toBe(SOURCE_WEIGHT.ai_mentor);
    expect(sig.weight).toBeLessThan(SOURCE_WEIGHT.simulation);
    expect(sig.weight).toBeLessThan(SOURCE_WEIGHT.manager_validation);
  });

  it("a single strong AI interaction never reaches 'Ready' (no mastery from one turn)", () => {
    const a = classifyReasoning("I metered it and verified voltage is present, so the break is downstream");
    const ev = mentorEvidence(baseCtx(), a);
    const readiness = readinessFromEvidence("motors", [ev]);
    expect(readiness.level).not.toBe("Ready");
    expect(readiness.level).not.toBe("Promotion Candidate");
  });

  it("evidence type follows the mode; unsafe live-diagnosis is a safety intervention, unsafe communication stays a comm type (safetyFlag carries the risk)", () => {
    const strong = classifyReasoning("I measured the voltage and verified it");
    expect(mentorEvidenceType("reflection", strong)).toBe("ai_reflection");
    expect(mentorEvidenceType("hint", strong)).toBe("ai_hint_used");
    const unsafe = classifyReasoning("bypass the guard");
    // live-diagnosis unsafe → pure safety intervention
    expect(mentorEvidenceType("hint", unsafe)).toBe("ai_safety_intervention");
    // communication unsafe → keeps the comm type so it feeds the area; safetyFlag flags it
    expect(mentorEvidenceType("operator_communication", unsafe)).toBe("ai_operator_communication");
    expect(mentorEvidence(baseCtx({ mode: "operator_communication" }), unsafe).safetyFlag).toBe(true);
  });
});

describe("Maintenance Mentor — communication classification (closeout)", () => {
  it("a specific, evidence-based work order note is strong", () => {
    const a = classifyCommunication("Symptom: conveyor stopped. Tested the control circuit, metered the coil at 95V, verified the overload tripped. Likely cause: transformer tap left wrong. Corrective: corrected the tap. Follow-up: monitor for repeat trips.");
    expect(a.quality).toBe("strong");
    expect(a.unsafe).toBe(false);
  });

  it("a vague work order note is weak", () => {
    expect(classifyCommunication("fixed motor").quality).toBe("weak");
    expect(classifyCommunication("reset overload, working now").quality).toBe("weak");
  });

  it("telling the operator to keep resetting is UNSAFE", () => {
    const a = classifyCommunication("Just tell the operator to keep resetting it when it trips.");
    expect(a.unsafe).toBe(true);
    expect(a.quality).toBe("unsafe");
  });

  it("a strong operator explanation (advising NOT to reset repeatedly) is strong, not unsafe", () => {
    const a = classifyCommunication("The conveyor stopped because the overload opened. I verified the control circuit and motor starter before resetting. Tell maintenance if it trips again instead of resetting repeatedly.");
    expect(a.unsafe).toBe(false); // negation guard: "instead of resetting repeatedly"
    expect(a.quality).toBe("strong");
  });

  it("root cause with unsupported certainty and no evidence is weak", () => {
    expect(classifyCommunication("It's definitely the contactor, 100% sure.").quality).toBe("weak");
  });

  it("blaming the operator is weak communication", () => {
    expect(classifyCommunication("Machine stopped, it was operator error, nothing wrong with it.").quality).toBe("weak");
  });

  it("communication evidence supports readiness but does NOT create mastery alone", () => {
    const a = classifyCommunication("Symptom: conveyor stopped. Metered coil at 95V, verified overload tripped. Cause: tap. Follow-up: monitor.");
    const ev = mentorEvidence(baseCtx({ mode: "work_order" }), a);
    expect(ev.evidenceType).toBe("ai_work_order_documentation");
    const readiness = readinessFromEvidence("motors", [ev]);
    expect(readiness.level).not.toBe("Ready");
    expect(readiness.level).not.toBe("Promotion Candidate");
  });

  it("unsafe communication creates a safety flag on the competency", () => {
    const a = classifyCommunication("tell them to bypass the guard and keep it running");
    const ev = mentorEvidence(baseCtx({ mode: "operator_communication" }), a);
    expect(ev.safetyFlag).toBe(true);
    const readiness = readinessFromEvidence("motors", [ev]);
    expect(readiness.level).toBe("Needs Safety Review");
  });
});

describe("Operator Role-Play — operator stays in character (not a teacher)", () => {
  it("operator system prompt is an operator, not a mentor/teacher", () => {
    const p = buildOperatorSystemPrompt();
    expect(p).toMatch(/MACHINE OPERATOR/);
    expect(p).toMatch(/NOT a teacher/i);
    expect(p).toMatch(/do NOT teach/i);
  });

  it("confused-operator prompt asks simple questions and admits confusion", () => {
    const p = buildOperatorUserPrompt({ scenario: "conveyor overload", persona: "confused", turn: 0 });
    expect(p).toMatch(/Confused operator/);
    expect(p).toMatch(/don't understand|lost|what does that/i);
  });

  it("rushed-operator opener pushes to reset it again", () => {
    const line = fallbackOperatorLine({ scenario: "x", persona: "rushed", turn: 0 });
    expect(line.toLowerCase()).toMatch(/reset/);
    expect(line.toLowerCase()).toMatch(/quota|just/);
  });

  it("operator reacts to the learner on later turns using the learner's message", () => {
    const p = buildOperatorUserPrompt({ scenario: "x", persona: "rushed", turn: 1, learnerMessage: "The overload tripped to protect the motor." });
    expect(p).toContain("The overload tripped to protect the motor.");
    expect(p).toMatch(/React in character/i);
    expect(p).toMatch(/never teach/i);
  });
});

describe("Operator Role-Play — mentor evaluation of the learner's response", () => {
  it("a strong, safe operator explanation grades strong and feeds Operator Communication (not mastery alone)", () => {
    const strong = "The overload tripped, which means the motor circuit opened to protect the equipment. I verified the control circuit before resetting it. If it trips again, don't keep resetting it — call maintenance, because repeated trips usually mean something else is wrong.";
    const a = classifyCommunication(strong);
    expect(a.quality).toBe("strong");
    expect(a.unsafe).toBe(false);
    const ev = mentorEvidence(baseCtx({ mode: "operator_communication" }), a);
    expect(ev.evidenceType).toBe("ai_operator_communication");
    const c = communicationReadiness([ev]);
    const op = c.areas.find((x) => x.key === "operator_communication")!;
    expect(op.attempts).toBe(1);
    expect(op.level).not.toBe("Ready"); // no mastery from a single role-play
    expect(op.level).not.toBe("Promotion Candidate");
  });

  it("a vague response ('fixed it') grades weak", () => {
    expect(classifyCommunication("Fixed it, should be fine.").quality).toBe("weak");
  });

  it("blaming the operator grades weak", () => {
    expect(classifyCommunication("It was operator error, nothing's actually wrong with it.").quality).toBe("weak");
  });

  it("an unsafe reset/bypass instruction creates SAFETY evidence and safety risk", () => {
    const a = classifyCommunication("Yeah just keep resetting it every time it trips, or jumper out the overload.");
    expect(a.unsafe).toBe(true);
    const ev = mentorEvidence(baseCtx({ mode: "operator_communication" }), a);
    expect(ev.evidenceType).toBe("ai_operator_communication"); // stays a comm type so it feeds the area
    expect(ev.safetyFlag).toBe(true); // the safety flag carries the risk
    const c = communicationReadiness([ev]);
    expect(c.safetyCommunicationRisk).toBe(true);
    const op = c.areas.find((x) => x.key === "operator_communication")!;
    expect(op.level).toBe("Needs Safety Review");
  });
});

describe("LLM cross-check — safety-escalate only", () => {
  const llm = (over: Partial<LlmClassification>): LlmClassification => ({ classification: "strong", ...over });

  it("deterministic UNSAFE cannot be downgraded by the LLM", () => {
    const det = classifyCommunication("just bypass the guard and keep resetting it");
    expect(det.unsafe).toBe(true);
    const r = crossCheckClassification(det, llm({ classification: "strong", safetyFlag: false }));
    expect(r.final).toBe("unsafe");
    expect(r.unsafe).toBe(true);
    expect(r.escalatedByLlm).toBe(false);
  });

  it("LLM can escalate weak → unsafe", () => {
    const det = classifyCommunication("fixed motor"); // weak
    const r = crossCheckClassification(det, llm({ classification: "unsafe", safetyFlag: true, reason: "advised repeated reset" }));
    expect(r.final).toBe("unsafe");
    expect(r.escalatedByLlm).toBe(true);
    expect(assessmentFromCrossCheck(det, r).unsafe).toBe(true);
  });

  it("LLM can escalate strong → weak when it detects unsupported certainty", () => {
    const det = classifyCommunication("I metered the coil at 95V and verified the overload before resetting, so the supply is good"); // strong
    expect(det.quality).toBe("strong");
    const r = crossCheckClassification(det, llm({ classification: "weak", detectedIssues: ["unsupported_certainty"] }));
    expect(r.final).toBe("weak");
    expect(r.escalatedByLlm).toBe(true);
  });

  it("LLM cannot create mastery: weak → strong is ignored (stays weak)", () => {
    const det = classifyCommunication("fixed it, probably the contactor");
    const r = crossCheckClassification(det, llm({ classification: "strong" }));
    expect(r.final).not.toBe("strong");
    expect(r.escalatedByLlm).toBe(false);
    const ev = mentorEvidence(baseCtx({ mode: "operator_communication" }), assessmentFromCrossCheck(det, r));
    const c = readinessFromEvidence("motors", [ev]);
    expect(c.level).not.toBe("Ready");
  });

  it("safety escalation via safetyFlag creates a safety flag even if class stays non-unsafe", () => {
    const det = classifyCommunication("It stopped, control voltage was there, told them to watch it"); // partial-ish
    const r = crossCheckClassification(det, llm({ classification: "partial", safetyFlag: true }));
    expect(r.unsafe).toBe(true);
    expect(r.final).toBe("unsafe");
    const ev = mentorEvidence(baseCtx({ mode: "operator_communication" }), assessmentFromCrossCheck(det, r));
    expect(ev.safetyFlag).toBe(true);
  });

  it("a strong evidence-based explanation stays strong when the LLM agrees", () => {
    const det = classifyCommunication("I verified control voltage and checked the overload state, so I confirmed the break was downstream");
    const r = crossCheckClassification(det, llm({ classification: "strong" }));
    expect(r.final).toBe("strong");
    expect(r.escalatedByLlm).toBe(false);
  });

  it("null LLM (or parse failure) falls back to deterministic classification", () => {
    const det = classifyCommunication("fixed motor");
    const r = crossCheckClassification(det, null);
    expect(r.final).toBe(det.quality);
    expect(r.llm).toBeNull();
    expect(r.escalatedByLlm).toBe(false);
  });

  it("the cross-check exposes the full audit trail for evidence detail", () => {
    const det = classifyCommunication("fixed it");
    const r = crossCheckClassification(det, llm({ classification: "unsafe", safetyFlag: true, reason: "repeated reset", detectedIssues: ["unsafe_instruction"] }));
    expect(r.deterministic).toBe(det.quality);
    expect(r.llm).toBe("unsafe");
    expect(r.final).toBe("unsafe");
    expect(r.escalatedByLlm).toBe(true);
    expect(r.detectedIssues).toContain("unsafe_instruction");
    expect(r.llmReason).toBe("repeated reset");
  });
});

describe("LLM cross-check — JSON parsing", () => {
  it("parses a clean JSON coach response", () => {
    const p = parseCoachJson('{"message":"Keep it specific.","classification":"weak","safetyFlag":false,"reason":"vague","detectedIssues":["vague"]}');
    expect(p.message).toBe("Keep it specific.");
    expect(p.llm?.classification).toBe("weak");
    expect(p.llm?.detectedIssues).toContain("vague");
  });

  it("parses JSON inside code fences", () => {
    const p = parseCoachJson('```json\n{"message":"m","classification":"unsafe","safetyFlag":true}\n```');
    expect(p.llm?.classification).toBe("unsafe");
    expect(p.llm?.safetyFlag).toBe(true);
  });

  it("invalid JSON → raw text as message, null classification (safe fallback)", () => {
    const p = parseCoachJson("Sorry, I can't help with that.");
    expect(p.message).toBe("Sorry, I can't help with that.");
    expect(p.llm).toBeNull();
  });

  it("JSON without a valid classification → null classification", () => {
    const p = parseCoachJson('{"message":"hi","classification":"amazing"}');
    expect(p.message).toBe("hi");
    expect(p.llm).toBeNull();
  });
});

describe("Maintenance Mentor — prompt construction", () => {
  it("recent audit context (strengths/weaknesses/safety) is included in the prompt", () => {
    const p = buildMentorUserPrompt(baseCtx({
      mode: "reflection",
      recentWeaknesses: ["Failed delayed recall — knowledge decaying"],
      recentStrengths: ["Right action for the right reason"],
      recentSafetyCount: 1,
    }));
    expect(p).toMatch(/Recent weak spots/);
    expect(p).toMatch(/Recent strengths/);
    expect(p).toMatch(/Recent safety flags/);
    expect(p).toMatch(/MODE: REFLECTION/);
  });

  it("system prompt encodes ask-before-tell, no answer-dumping, and safety", () => {
    const p = buildMentorSystemPrompt();
    expect(p).toMatch(/Ask before you tell/i);
    expect(p).toMatch(/do not dump/i);
    expect(p).toMatch(/SAFETY IS NON-NEGOTIABLE/i);
  });

  it("user prompt includes structured lesson/domain/readiness context and the mode", () => {
    const p = buildMentorUserPrompt(baseCtx({ readinessLevel: "Almost Ready", domainConfidence: 55, learnerReasoning: "swap it" }));
    expect(p).toContain("Motor Control Circuits");
    expect(p).toContain("motors");
    expect(p).toMatch(/Almost Ready/);
    expect(p).toMatch(/MODE: REASONING/);
    expect(p).toContain("swap it");
  });

  it("safety fallback message is direct and stops the learner", () => {
    const msg = fallbackMentorMessage(baseCtx({ mode: "reasoning" }), classifyReasoning("bypass the guard"));
    expect(msg.toLowerCase()).toMatch(/stop|lock it out/);
  });
});
