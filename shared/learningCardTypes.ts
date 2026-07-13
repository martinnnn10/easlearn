/**
 * Slide/card lesson types — Priority 1 pilot.
 */

export type LessonCardKind = "concept" | "example" | "interaction" | "summary";

export type LessonCardVisual =
  | { type: "none" }
  | {
      type: "diagram";
      variant:
        | "io-terminal"
        | "nc-chain"
        | "photoeye-loop"
        | "refrigeration-cycle"
        | "refrigeration-pt-table"
        | "vfd-stages"
        | "scan-cycle"
        | "motor-starter-chain"
        | "loto-steps"
        | "ladder-seal-in"
        | "timer-ton-block"
        | "ethernet-ip-topology"
        | "npn-pnp-wiring"
        | "powerflex-fault-table"
        | "wire-numbering-convention"
        | "pid-symbol-table"
        | "ohms-law-wheel"
        | "series-parallel-circuit"
        | "ac-dc-waveform"
        | "kvl-kcl-diagram"
        | "meter-mode-table";
    }
  | { type: "callout"; tone: "field" | "tip" | "warning"; text: string }
  | {
      /** A live circuit/sim the learner manipulates inside the lesson. */
      type: "interactive";
      sim: "motor-starter-seal-in";
    };

export interface LessonCardChoice {
  id: string;
  label: string;
  /**
   * The master tech's reaction to THIS specific choice. When choices carry
   * responses, a wrong pick shows the master's response and the learner can try
   * again (productive failure) instead of the card locking on first answer.
   */
  response?: string;
}

/** A step in an ordering/sequence interaction (authored in CORRECT order). */
export interface LessonCardSequenceStep {
  id: string;
  label: string;
  /** Optional one-line rationale shown after a correct check. */
  because?: string;
}

/**
 * Interaction model. `reveal` and `choice` are the original mechanics; `sequence`
 * and `predict` are the active-learning upgrades — the learner PRODUCES an answer
 * (orders a real procedure, predicts an outcome) instead of reading. Every added
 * field is optional, so existing decks and pinned content tests are unaffected.
 */
export interface LessonCardInteraction {
  type: "reveal" | "choice" | "sequence" | "predict" | "reasoned";
  prompt: string;
  // reveal
  revealTitle?: string;
  revealBody?: string;
  // choice / predict / reasoned (action step)
  choices?: LessonCardChoice[];
  correctChoiceId?: string;
  /** predict: the "what actually happens" payoff shown after answering. */
  outcomeTitle?: string;
  outcomeBody?: string;
  // sequence (ordering) — steps authored in correct order; renderer shuffles them
  steps?: LessonCardSequenceStep[];
  /**
   * reasoned: teach JUDGMENT, not answers. The learner commits to an action,
   * the mentor asks their reasoning BEFORE any verdict, then feedback branches on
   * (answer × reasoning) — crucially catching a right answer chosen for the wrong
   * reason, which a mentor knows is not yet mastery.
   */
  reasonPrompt?: string; // e.g. "What made you think that?"
  reasons?: LessonCardChoice[];
  correctReasonId?: string;
  feedbackRightReason?: string; // right action, right reasoning — mastery
  feedbackWeakReason?: string; // right action, weak reasoning — coach the WHY
  // shared feedback
  feedbackCorrect?: string;
  feedbackIncorrect?: string;
}

export interface LessonCard {
  id: string;
  kind: LessonCardKind;
  heading: string;
  body: string;
  takeaway?: string;
  visual?: LessonCardVisual;
  interaction?: LessonCardInteraction;
  /** Optional LearningMechanicId (shared/learningEngine.ts) this card exercises,
   *  so the Assessment Spine can attribute evidence to a mechanic. */
  mechanicId?: string;
}

export interface LessonCardDeck {
  moduleSlug: string;
  lessonSlug: string;
  title: string;
  /** When true, the lesson ends with the mentor's "close the ticket" reflection +
   *  communication + work-order closeout (see LessonReflection). Opt-in per deck. */
  reflection?: boolean;
  whatYoullLearn: string[];
  estimatedMinutes: number;
  previewCardCount: number;
  cards: LessonCard[];
}
