import type { CuratedMcq } from "../curatedLessonAssessmentTypes";
import type { LessonCardInteraction, LessonCardSequenceStep } from "../learningCardTypes";

/** Map a curated assessment MCQ onto a card interaction (KC cards). */
export function curatedChoiceMcq(mcq: CuratedMcq): LessonCardInteraction {
  const ids = ["a", "b", "c", "d"] as const;
  const correctNote =
    mcq.explanation.split("If you chose")[0]?.replace(/^Correct:\s*/, "").trim() || mcq.explanation;
  return {
    type: "choice",
    prompt: mcq.question,
    choices: mcq.options.map((label, i) => ({ id: ids[i], label })),
    correctChoiceId: ids[mcq.correctIndex],
    feedbackCorrect: correctNote,
    feedbackIncorrect: mcq.explanation,
  };
}

export function choiceMcq(
  question: string,
  options: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
  feedbackCorrect: string,
  feedbackIncorrect = "Not quite — review the card above and try again."
): LessonCardInteraction {
  const ids = ["a", "b", "c", "d"] as const;
  return {
    type: "choice",
    prompt: question,
    choices: options.map((label, i) => ({ id: ids[i], label })),
    correctChoiceId: ids[correctIndex],
    feedbackCorrect,
    feedbackIncorrect,
  };
}

/**
 * Ordering interaction — the learner arranges a real procedure into the correct
 * sequence. Author the steps IN THE RIGHT ORDER; the renderer shuffles them for
 * the learner. This turns "read the troubleshooting steps" into "build them".
 */
export function orderSteps(
  prompt: string,
  steps: LessonCardSequenceStep[],
  feedbackCorrect: string,
  feedbackIncorrect = "Not the order a tech would work it — think about what has to be true before the next step makes sense.",
): LessonCardInteraction {
  return { type: "sequence", prompt, steps, feedbackCorrect, feedbackIncorrect };
}

/**
 * Master-tech question — the apprenticeship loop: the master points and asks
 * BEFORE explaining, reacts to the learner's SPECIFIC choice, and lets a wrong
 * move play out so they can try again (productive failure). Each option carries
 * the master's reaction; the correct one advances, the rest invite another go.
 */
export function masterAsk(
  question: string,
  options: [
    { label: string; response: string },
    { label: string; response: string },
    { label: string; response: string },
    { label: string; response: string },
  ],
  correctIndex: 0 | 1 | 2 | 3,
  feedbackCorrect: string,
): LessonCardInteraction {
  const ids = ["a", "b", "c", "d"] as const;
  return {
    type: "choice",
    prompt: question,
    choices: options.map((o, i) => ({ id: ids[i], label: o.label, response: o.response })),
    correctChoiceId: ids[correctIndex],
    feedbackCorrect,
    feedbackIncorrect: "Not the first move a tech would make — read what I told you and try again.",
  };
}

/**
 * Reasoning-required question — the apprenticeship core: teach JUDGMENT, not the
 * answer. The learner commits to an action, then the mentor asks "what made you
 * think that?" BEFORE revealing any verdict, and the feedback branches on
 * (action × reasoning). The key case is a right action chosen for a weak reason —
 * the mentor coaches the WHY so the learner can repeat it deliberately, not by luck.
 */
export function reasonedAsk(args: {
  question: string;
  actions: [string, string, string, string];
  correctActionIndex: 0 | 1 | 2 | 3;
  reasonPrompt?: string;
  reasons: [string, string, string] | [string, string, string, string];
  correctReasonIndex: 0 | 1 | 2 | 3;
  feedbackRightReason: string; // right action + right reasoning (mastery)
  feedbackWeakReason: string; // right action + weak reasoning (coach the why)
  feedbackWrongAction: string; // wrong action
}): LessonCardInteraction {
  const ids = ["a", "b", "c", "d"] as const;
  return {
    type: "reasoned",
    prompt: args.question,
    choices: args.actions.map((label, i) => ({ id: ids[i], label })),
    correctChoiceId: ids[args.correctActionIndex],
    reasonPrompt: args.reasonPrompt ?? "What made you think that?",
    reasons: args.reasons.map((label, i) => ({ id: ids[i], label })),
    correctReasonId: ids[args.correctReasonIndex],
    feedbackRightReason: args.feedbackRightReason,
    feedbackWeakReason: args.feedbackWeakReason,
    feedbackIncorrect: args.feedbackWrongAction,
  };
}

/**
 * Predict-then-verify — the learner commits to what WILL happen, then sees the
 * real outcome. Prediction-before-feedback is one of the strongest retention
 * levers we have. `options`/`correctIndex` work like choiceMcq; the outcome is
 * the payoff revealed after answering.
 */
export function predict(
  prompt: string,
  options: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
  outcomeTitle: string,
  outcomeBody: string,
  feedbackCorrect = "You called it.",
  feedbackIncorrect = "Not what happens — read the outcome below and see why.",
): LessonCardInteraction {
  const ids = ["a", "b", "c", "d"] as const;
  return {
    type: "predict",
    prompt,
    choices: options.map((label, i) => ({ id: ids[i], label })),
    correctChoiceId: ids[correctIndex],
    outcomeTitle,
    outcomeBody,
    feedbackCorrect,
    feedbackIncorrect,
  };
}
