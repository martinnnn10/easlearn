/** Accreditation-aligned assessment thresholds (IACET-style formative + summative). */

export const ASSESSMENT_TYPES = ["knowledge_check", "lesson_quiz"] as const;
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

/** Formative — must pass before lesson quiz unlocks */
export const KNOWLEDGE_CHECK_PASS_PERCENT = 80;
export const KNOWLEDGE_CHECK_MIN_QUESTIONS = 2;

/** Summative — must pass before lesson can be marked complete */
export const LESSON_QUIZ_PASS_PERCENT = 70;
export const LESSON_QUIZ_MIN_QUESTIONS = 3;
export const LESSON_QUIZ_MAX_ATTEMPTS = 3;
export const LESSON_QUIZ_COOLDOWN_HOURS = 24;

/** Module capstone — certificate threshold */
export const MODULE_QUIZ_PASS_PERCENT = 75;

export function scorePercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export function didPass(score: number, type: AssessmentType | "module_quiz"): boolean {
  if (type === "knowledge_check") return score >= KNOWLEDGE_CHECK_PASS_PERCENT;
  if (type === "lesson_quiz") return score >= LESSON_QUIZ_PASS_PERCENT;
  return score >= MODULE_QUIZ_PASS_PERCENT;
}

/** Rotate MCQ options so correct answer is not always index 0 (deterministic per seed). */
export function shuffleMcqForSeed<T extends { options: string[]; correctIndex: number }>(
  mcq: T,
  seed: number
): T {
  const n = mcq.options.length;
  if (n <= 1) return mcq;
  const shift = ((seed % 997) + n) % n;
  if (shift === 0) return mcq;
  const options = [...mcq.options.slice(shift), ...mcq.options.slice(0, shift)];
  const correctText = mcq.options[mcq.correctIndex];
  const correctIndex = options.indexOf(correctText);
  return { ...mcq, options, correctIndex };
}
