/**
 * EASLearn Learning Engine — machine-readable registry of the teaching mechanics
 * that power every lesson, mission, simulation, assessment, AI-mentor interaction,
 * competency update, manager signal, certification, skills passport, and employer
 * report.
 *
 * This is the index; the full specification (purpose, learning science, industrial
 * purpose, examples, AI/manager/assessment responsibilities per mechanic) lives in
 * docs/LEARNING_ENGINE.md. Keep the two in sync — a mechanic added here MUST be
 * documented there, and vice versa.
 *
 * EASLearn is a digital apprenticeship engine, not a lesson platform. The mechanics
 * below exist to move a learner from "I watch the master" to "I can troubleshoot
 * independently." The goal is not correct answers; it is independent maintenance
 * judgment.
 */

/** The ten-stage learning arc every competency travels, in order. */
export const ARC_STAGES = [
  { id: "observe", label: "Observe", intent: "Read the machine and the situation before touching anything." },
  { id: "commit", label: "Commit", intent: "Make a call before receiving any hint or answer." },
  { id: "reason", label: "Reason", intent: "State WHY — the thinking is assessed, not just the pick." },
  { id: "test", label: "Test", intent: "Gather evidence: meter, probe, measure — cheapest test first." },
  { id: "consequence", label: "Experience consequence", intent: "Live with the result of the call — including safe failure." },
  { id: "reflect", label: "Reflect", intent: "Name what happened and why; rate confidence honestly." },
  { id: "generalize", label: "Generalize", intent: "Transfer the method to a new fault, machine, or domain." },
  { id: "communicate", label: "Communicate", intent: "Explain the fault to an operator, a work order, the next shift." },
  { id: "verify", label: "Verify competency", intent: "Demonstrate the skill; update the competency graph; manager attests." },
  { id: "retain", label: "Retain over time", intent: "Re-demonstrate before it decays; spaced reinforcement." },
] as const;

export type ArcStageId = (typeof ARC_STAGES)[number]["id"];

/** How much of a mechanic exists in the product today. */
export type MechanicStatus = "implemented" | "partial" | "planned";

/** The four-stage apprenticeship progression a learner climbs per competency. */
export const APPRENTICESHIP_LADDER = [
  { id: "watch", label: "I watch the master", scaffolding: "full" },
  { id: "work_with", label: "I work with the master", scaffolding: "guided" },
  { id: "i_call", label: "I make the call while the master watches", scaffolding: "light" },
  { id: "independent", label: "I can troubleshoot independently", scaffolding: "none" },
] as const;

export type LearningMechanicId =
  // Observe
  | "concreteAnchor" | "observationBeforeAction" | "environmentalAwareness"
  // Commit
  | "askBeforeTell" | "commitBeforeHint" | "predictBeforeReveal" | "hypothesisFormation"
  // Reason
  | "reasonBeforeVerdict" | "thinkAloud" | "cheapestNextTest" | "mentorReaction"
  // Test
  | "evidenceCollection" | "meterBeforeReplace" | "liveSystemInteraction"
  // Consequence
  | "productiveFailure" | "secondChanceReasoning" | "safetyOverride" | "decisionUnderPressure"
  // Reflect
  | "reflection" | "rootCauseExplanation" | "confidenceRating"
  // Generalize
  | "scenarioVariation" | "faultTransfer" | "questionInternalization"
  // Communicate
  | "operatorCommunication" | "shiftHandoff" | "workOrderDocumentation"
  // Verify competency
  | "competencyUpdate" | "managerValidation" | "careerReadiness"
  // Retain
  | "knowledgeDecay" | "spacedReinforcement"
  // Cross-cutting spine (gradual release + mentor)
  | "masterDemonstration" | "guidedPractice" | "independentPractice"
  | "progressiveScaffolding" | "mentorFade" | "aiMentorIntervention";

export interface LearningMechanic {
  id: LearningMechanicId;
  name: string;
  /** Primary arc stage. "spine" = spans the whole arc (gradual-release / mentor). */
  arc: ArcStageId | "spine";
  /** One-line operating purpose. Full spec in docs/LEARNING_ENGINE.md. */
  purpose: string;
  /** The judgment ability it builds. */
  cognitiveSkill: string;
  /** The intended felt experience for the learner. */
  emotion: string;
  requiresAI: boolean;
  requiresSimulation: boolean;
  requiresManagerValidation: boolean;
  status: MechanicStatus;
  /** Concrete engine hooks that realize it today (types, helpers, components, systems). */
  implementedBy: string[];
  /** Competency-graph / methodology signals this mechanic can emit. */
  competencySignals: string[];
}

/**
 * The registry. `status` reflects the product HONESTLY as of formalization:
 * implemented = live in the flagship/engine, partial = exists but shallow or
 * un-instrumented, planned = designed here but not built.
 */
export const LEARNING_MECHANICS: Record<LearningMechanicId, LearningMechanic> = {
  concreteAnchor: {
    id: "concreteAnchor", name: "Concrete Anchor", arc: "observe",
    purpose: "Open on a real breakdown with sensory detail, never an abstract definition.",
    cognitiveSkill: "Situational recall", emotion: "Pulled in — 'this is a real call'",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["LessonCard.kind='concept' opener", "callout visual"],
    competencySignals: [],
  },
  observationBeforeAction: {
    id: "observationBeforeAction", name: "Observation Before Action", arc: "observe",
    purpose: "Force the learner to look and describe before they are allowed to act.",
    cognitiveSkill: "Observation", emotion: "Slowed down, deliberate",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "partial", implementedBy: ["lesson scene card", "SimulatorEngineV3 initial survey"],
    competencySignals: ["observationDiscipline"],
  },
  environmentalAwareness: {
    id: "environmentalAwareness", name: "Environmental Awareness", arc: "observe",
    purpose: "Notice context — LOTO state, energy sources, what changed, what's around you.",
    cognitiveSkill: "Situational awareness / safety", emotion: "Alert",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "partial", implementedBy: ["simulator machine twin state"],
    competencySignals: ["safetyJudgment"],
  },
  askBeforeTell: {
    id: "askBeforeTell", name: "Ask Before Tell", arc: "commit",
    purpose: "The mentor asks the diagnostic question before explaining anything.",
    cognitiveSkill: "Decision making", emotion: "On the spot, engaged",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["masterAsk()", "lesson opens with interaction at index 1"],
    competencySignals: ["decisionQuality"],
  },
  commitBeforeHint: {
    id: "commitBeforeHint", name: "Commit Before Hint", arc: "commit",
    purpose: "No hint or answer is available until the learner has committed to a choice.",
    cognitiveSkill: "Decision making / accountability", emotion: "Ownership of the call",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["choice/predict/reasoned lock-before-reveal", "simulator hint-after-attempt"],
    competencySignals: ["decisionQuality", "hintReliance"],
  },
  predictBeforeReveal: {
    id: "predictBeforeReveal", name: "Predict Before Reveal", arc: "commit",
    purpose: "Learner predicts the outcome, then sees what actually happens.",
    cognitiveSkill: "Mental model / pattern recognition", emotion: "Curiosity, then correction",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["predict()", "LearningCardView predict outcome payoff"],
    competencySignals: ["mentalModelAccuracy"],
  },
  hypothesisFormation: {
    id: "hypothesisFormation", name: "Hypothesis Formation", arc: "commit",
    purpose: "State a testable hypothesis ('I think X because Y') before testing.",
    cognitiveSkill: "Root cause thinking", emotion: "Deliberate reasoning",
    requiresAI: true, requiresSimulation: false, requiresManagerValidation: false,
    status: "partial", implementedBy: ["reasonedAsk() reasons", "simulator clue log"],
    competencySignals: ["hypothesisQuality"],
  },
  reasonBeforeVerdict: {
    id: "reasonBeforeVerdict", name: "Reason Before Verdict", arc: "reason",
    purpose: "Ask 'what made you think that?' before revealing right/wrong; grade the reasoning.",
    cognitiveSkill: "Judgment / metacognition", emotion: "Held accountable for thinking, not luck",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["reasonedAsk()", "ReasonedInteraction (action×reasoning branches)"],
    competencySignals: ["reasoningQuality", "rightForRightReason"],
  },
  thinkAloud: {
    id: "thinkAloud", name: "Think Aloud", arc: "reason",
    purpose: "Learner articulates reasoning in their own words; the mentor responds to it.",
    cognitiveSkill: "Communication / metacognition", emotion: "Heard, coached",
    requiresAI: true, requiresSimulation: false, requiresManagerValidation: false,
    status: "planned", implementedBy: ["(planned) free-text reasoning graded by AI mentor"],
    competencySignals: ["reasoningQuality", "communicationClarity"],
  },
  cheapestNextTest: {
    id: "cheapestNextTest", name: "Cheapest Next Test", arc: "reason",
    purpose: "Choose the single measurement that splits the problem space in half.",
    cognitiveSkill: "Troubleshooting methodology", emotion: "Efficient, clever",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "partial", implementedBy: ["reasonedAsk reasoning options", "simulator measurement scoring"],
    competencySignals: ["diagnosticEfficiency"],
  },
  mentorReaction: {
    id: "mentorReaction", name: "Mentor Reaction", arc: "reason",
    purpose: "Respond to the SPECIFIC wrong move ('that's what the last guy did — twice'), not a generic X.",
    cognitiveSkill: "Pattern recognition", emotion: "Seen, guided — not judged",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["LessonCardChoice.response", "masterAsk()"],
    competencySignals: ["misconceptionSignature"],
  },
  evidenceCollection: {
    id: "evidenceCollection", name: "Evidence Collection", arc: "test",
    purpose: "Build a case from readings and prints before committing to a diagnosis.",
    cognitiveSkill: "Troubleshooting methodology", emotion: "Methodical",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["SimulatorEngineV3 evidence/clue system"],
    competencySignals: ["evidenceQuality"],
  },
  meterBeforeReplace: {
    id: "meterBeforeReplace", name: "Meter Before Replace", arc: "test",
    purpose: "Measure a component before condemning it; parts-changing is the anti-pattern.",
    cognitiveSkill: "Troubleshooting discipline", emotion: "Restraint, professionalism",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["flagship mc-02/mc-03", "MotorStarterInteractive coil readout", "sim multimeter"],
    competencySignals: ["partsChangerPenalty", "measurementDiscipline"],
  },
  liveSystemInteraction: {
    id: "liveSystemInteraction", name: "Live System Interaction", arc: "test",
    purpose: "Manipulate a real, responsive circuit/twin inside the lesson — cause and observe.",
    cognitiveSkill: "Systems understanding", emotion: "Agency — 'I made it do that'",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["MotorStarterInteractive", "LessonCardVisual sim='motor-starter-seal-in'", "SimulatorEngineV3"],
    competencySignals: ["systemsUnderstanding"],
  },
  productiveFailure: {
    id: "productiveFailure", name: "Productive Failure", arc: "consequence",
    purpose: "Let the wrong move play out safely; the mistake is the teaching moment.",
    cognitiveSkill: "Resilience / learning from error", emotion: "Safe to be wrong",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["per-choice response + retry", "simulator consequence engine"],
    competencySignals: ["recoveryFromError"],
  },
  secondChanceReasoning: {
    id: "secondChanceReasoning", name: "Second-Chance Reasoning", arc: "consequence",
    purpose: "After a miss, the learner reasons again rather than being handed the answer.",
    cognitiveSkill: "Metacognition", emotion: "Encouraged to think, not told",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "partial", implementedBy: ["ReasonedInteraction 'think it through again'", "masterAsk retry"],
    competencySignals: ["reasoningRecovery"],
  },
  safetyOverride: {
    id: "safetyOverride", name: "Safety Override", arc: "consequence",
    purpose: "An unsafe action stops everything and forces a safety reckoning, regardless of progress.",
    cognitiveSkill: "Safety judgment", emotion: "Gravity — this is non-negotiable",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "partial", implementedBy: ["simulator LOTO/arc-flash gates", "flagship 'is it safe' question"],
    competencySignals: ["safetyJudgment", "safetyViolation"],
  },
  decisionUnderPressure: {
    id: "decisionUnderPressure", name: "Decision Under Pressure", arc: "consequence",
    purpose: "Decide with a running clock and cost of downtime, like a real line-down call.",
    cognitiveSkill: "Confidence under pressure", emotion: "Stakes, focus",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["simulator timer + $/min framing", "landing LIVE DEMO"],
    competencySignals: ["timeToSolve", "compositureUnderPressure"],
  },
  reflection: {
    id: "reflection", name: "Reflection", arc: "reflect",
    purpose: "Name what happened and why immediately after the attempt.",
    cognitiveSkill: "Metacognition", emotion: "Consolidation",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "partial", implementedBy: ["debrief methodology breakdown", "summary internalization card"],
    competencySignals: ["reflectionDepth"],
  },
  rootCauseExplanation: {
    id: "rootCauseExplanation", name: "Root Cause Explanation", arc: "reflect",
    purpose: "Explain WHY the device opened before resetting — cause, not just symptom.",
    cognitiveSkill: "Root cause thinking", emotion: "Depth, closure",
    requiresAI: true, requiresSimulation: false, requiresManagerValidation: false,
    status: "partial", implementedBy: ["flagship 'find why it's open'", "(planned) AI-graded explanation"],
    competencySignals: ["rootCauseDepth"],
  },
  confidenceRating: {
    id: "confidenceRating", name: "Confidence Rating", arc: "reflect",
    purpose: "Rate certainty; calibrate confidence against actual correctness over time.",
    cognitiveSkill: "Calibrated confidence", emotion: "Self-honesty",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "planned", implementedBy: ["(planned) confidence slider feeding calibration"],
    competencySignals: ["confidenceCalibration"],
  },
  scenarioVariation: {
    id: "scenarioVariation", name: "Scenario Variation", arc: "generalize",
    purpose: "Same fault class, different surface features — break rote pattern-matching.",
    cognitiveSkill: "Pattern recognition", emotion: "Tested, not coasting",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "partial", implementedBy: ["scenario fault variants", "(planned) systematic variation engine"],
    competencySignals: ["transferAccuracy"],
  },
  faultTransfer: {
    id: "faultTransfer", name: "Fault Transfer", arc: "generalize",
    purpose: "Apply a method learned on one machine to a genuinely different machine/domain.",
    cognitiveSkill: "Far transfer of methodology", emotion: "Mastery — 'I can do this anywhere'",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "partial", implementedBy: ["cross-domain scenarios", "(planned) transfer-tracking"],
    competencySignals: ["transferAccuracy", "methodologyGeneralization"],
  },
  questionInternalization: {
    id: "questionInternalization", name: "Question Internalization", arc: "generalize",
    purpose: "Hand the learner the questions a tech asks (what changed / verified vs assumed / cheapest test / is it safe) so they ask them unprompted.",
    cognitiveSkill: "Self-directed methodology", emotion: "Ownership — 'these are mine now'",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["flagship mc-14 summary (four questions)"],
    competencySignals: ["selfQuestioning"],
  },
  operatorCommunication: {
    id: "operatorCommunication", name: "Operator Communication", arc: "communicate",
    purpose: "Explain the fault and fix to a machine operator in plain, correct terms.",
    cognitiveSkill: "Communication", emotion: "Professional competence",
    requiresAI: true, requiresSimulation: false, requiresManagerValidation: false,
    status: "planned", implementedBy: ["(planned) AI-graded explain-to-operator prompt"],
    competencySignals: ["communicationClarity"],
  },
  shiftHandoff: {
    id: "shiftHandoff", name: "Shift Handoff", arc: "communicate",
    purpose: "Summarize state, findings, and open items for the next shift.",
    cognitiveSkill: "Communication / synthesis", emotion: "Responsibility",
    requiresAI: true, requiresSimulation: false, requiresManagerValidation: false,
    status: "planned", implementedBy: ["(planned) handoff-note builder graded by AI"],
    competencySignals: ["handoffCompleteness"],
  },
  workOrderDocumentation: {
    id: "workOrderDocumentation", name: "Work Order Documentation", arc: "communicate",
    purpose: "Write the fault, cause, and corrective action into a work order record.",
    cognitiveSkill: "Communication / documentation", emotion: "Closure, accountability",
    requiresAI: true, requiresSimulation: false, requiresManagerValidation: false,
    status: "planned", implementedBy: ["(planned) CMMS-style work-order authoring + AI grading"],
    competencySignals: ["documentationQuality"],
  },
  competencyUpdate: {
    id: "competencyUpdate", name: "Competency Update", arc: "verify",
    purpose: "Every demonstrated action updates the competency graph — demonstrated, not declared.",
    cognitiveSkill: "(system) competency measurement", emotion: "Progress is real and earned",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["competencyGraph", "methodology scoring", "(planned) lesson→graph wiring"],
    competencySignals: ["domainConfidence", "methodologyTier"],
  },
  managerValidation: {
    id: "managerValidation", name: "Manager Validation", arc: "verify",
    purpose: "A supervisor attests a competency on the plant floor, raising its trust weight.",
    cognitiveSkill: "(system) verification", emotion: "Recognized by a human who matters",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: true,
    status: "implemented", implementedBy: ["competencyGraph.validate", "ManagerDashboard attest"],
    competencySignals: ["managerValidated"],
  },
  careerReadiness: {
    id: "careerReadiness", name: "Career Readiness", arc: "verify",
    purpose: "Roll verified competency into a shareable, employer-verifiable readiness signal.",
    cognitiveSkill: "(system) credentialing", emotion: "Pride, employability",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: true,
    status: "implemented", implementedBy: ["SkillsPassport", "promotionReady", "verify/skills link"],
    competencySignals: ["promotionReady", "jobReadiness"],
  },
  knowledgeDecay: {
    id: "knowledgeDecay", name: "Knowledge Decay", arc: "retain",
    purpose: "Competency confidence decays if not re-demonstrated — honesty about skill freshness.",
    cognitiveSkill: "(system) retention modeling", emotion: "Motivation to keep sharp",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["competencyGraph decay (stale 180d / decayed 365d)"],
    competencySignals: ["decayState", "daysSinceDemonstrated"],
  },
  spacedReinforcement: {
    id: "spacedReinforcement", name: "Spaced Reinforcement", arc: "retain",
    purpose: "Resurface key facts on an SM-2 schedule so knowledge sticks, not just gets seen.",
    cognitiveSkill: "(system) durable retention", emotion: "Habit, steady mastery",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["/review SM-2 scheduler", "trpc.review", "(planned) auto-enroll from lessons"],
    competencySignals: ["retentionStrength"],
  },
  masterDemonstration: {
    id: "masterDemonstration", name: "Master Demonstration", arc: "spine",
    purpose: "The mentor shows the move once, narrated — the 'I do' of gradual release.",
    cognitiveSkill: "Modeling", emotion: "Shown, not lectured",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["flagship 'watch — we meter the coil'", "worked-example cards"],
    competencySignals: [],
  },
  guidedPractice: {
    id: "guidedPractice", name: "Guided Practice", arc: "spine",
    purpose: "The learner acts with the mentor's support and immediate reactions — the 'we do'.",
    cognitiveSkill: "Scaffolded performance", emotion: "Supported",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["masterAsk with reactions", "live circuit with hints"],
    competencySignals: ["assistedPerformance"],
  },
  independentPractice: {
    id: "independentPractice", name: "Independent Practice", arc: "spine",
    purpose: "The learner performs unaided while the mentor watches — the 'you do'.",
    cognitiveSkill: "Independent performance", emotion: "Trusted, on their own",
    requiresAI: false, requiresSimulation: true, requiresManagerValidation: false,
    status: "partial", implementedBy: ["flagship mc-13 capstone", "simulator solo scenario"],
    competencySignals: ["independentPerformance"],
  },
  progressiveScaffolding: {
    id: "progressiveScaffolding", name: "Progressive Scaffolding", arc: "spine",
    purpose: "Support decreases as demonstrated competency rises — help is earned down, not fixed.",
    cognitiveSkill: "(system) adaptivity", emotion: "Growing autonomy",
    requiresAI: true, requiresSimulation: false, requiresManagerValidation: false,
    status: "partial", implementedBy: ["within-lesson fade", "(planned) competency-driven cross-lesson fade"],
    competencySignals: ["scaffoldLevel"],
  },
  mentorFade: {
    id: "mentorFade", name: "Mentor Fade", arc: "spine",
    purpose: "The mentor visibly steps back as the learner becomes capable — the end state of apprenticeship.",
    cognitiveSkill: "Autonomy", emotion: "'I can do this without him'",
    requiresAI: false, requiresSimulation: false, requiresManagerValidation: false,
    status: "implemented", implementedBy: ["flagship 'your call — I'm just watching now' + 'you don't need me over your shoulder'"],
    competencySignals: ["autonomyReached"],
  },
  aiMentorIntervention: {
    id: "aiMentorIntervention", name: "AI Mentor Intervention", arc: "spine",
    purpose: "An AI mentor reads the learner's actual moves/words and coaches in-context, generalizing every authored mechanic to open-ended reality.",
    cognitiveSkill: "(system) adaptive coaching", emotion: "A mentor who truly responds to me",
    requiresAI: true, requiresSimulation: false, requiresManagerValidation: false,
    status: "partial", implementedBy: ["TutorDebrief / LLM gateway (debrief only today)", "(planned) in-lesson reactive mentor"],
    competencySignals: ["coachingResponsiveness"],
  },
};

export function mechanicsByArc(stage: ArcStageId | "spine"): LearningMechanic[] {
  return Object.values(LEARNING_MECHANICS).filter((m) => m.arc === stage);
}

export function mechanicsRequiring(
  need: "ai" | "simulation" | "managerValidation",
): LearningMechanic[] {
  const key = need === "ai" ? "requiresAI" : need === "simulation" ? "requiresSimulation" : "requiresManagerValidation";
  return Object.values(LEARNING_MECHANICS).filter((m) => m[key as keyof LearningMechanic] === true);
}

export function mechanicsByStatus(status: MechanicStatus): LearningMechanic[] {
  return Object.values(LEARNING_MECHANICS).filter((m) => m.status === status);
}
