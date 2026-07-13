import type { CuratedMcq } from "./curatedLessonAssessmentTypes";

/**
 * Expert MCQ builder — full pedagogy for maintenance training assessments.
 * Each wrong option explains why a tech might pick it, why it fails, and what evidence disproves it.
 */
export function expertMcq(
  question: string,
  options: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
  correctNote: string,
  wrongNotes: [string, string, string]
): CuratedMcq {
  const wrongIdx = ([0, 1, 2, 3] as const).filter((i) => i !== correctIndex);
  const parts = [`Correct: ${correctNote}`];
  wrongNotes.forEach((note, j) => {
    parts.push(`If you chose "${options[wrongIdx[j]]}": ${note}`);
  });
  return { question, options, correctIndex, explanation: parts.join(" ") };
}

/** Pedagogy markers required on every curated MCQ */
export const PEDAGOGY_MARKERS = ["Correct:", "If you chose"] as const;

export function hasFullPedagogy(explanation: string): boolean {
  return PEDAGOGY_MARKERS.every((m) => explanation.includes(m));
}
