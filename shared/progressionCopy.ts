import {
  KNOWLEDGE_CHECK_PASS_PERCENT,
  LESSON_QUIZ_PASS_PERCENT,
} from "./assessment";

/** Shared progression messaging — must match server gate thresholds in assessment.ts */
export const LESSON_KC_PASS_LABEL = `${KNOWLEDGE_CHECK_PASS_PERCENT}%`;
export const LESSON_QUIZ_PASS_LABEL = `${LESSON_QUIZ_PASS_PERCENT}%`;

export const LESSON_PROGRESSION_ASSESS_SUMMARY =
  `Pass the knowledge check (${LESSON_KC_PASS_LABEL}) and lesson quiz (${LESSON_QUIZ_PASS_LABEL}) in the Assess step to unlock the next lesson.`;

export const LESSON_PROGRESSION_NAV_HINT =
  `Pass assessments (${LESSON_KC_PASS_LABEL} KC · ${LESSON_QUIZ_PASS_LABEL} quiz) to continue`;

export const LESSON_ILU_STRIP_FOOTER =
  `Complete the lesson, apply skills in Practice and Troubleshoot labs, then pass Assess (${LESSON_KC_PASS_LABEL} knowledge check · ${LESSON_QUIZ_PASS_LABEL} lesson quiz) to advance.`;

export const LESSON_CARD_ASSESS_NOTE =
  `${LESSON_PROGRESSION_ASSESS_SUMMARY} Use Practice and Troubleshoot labs above to apply this lesson on the floor.`;
