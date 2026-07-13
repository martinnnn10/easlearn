/**
 * Expert-curated knowledge checks and lesson quizzes.
 * Replaces auto-generated header-matching questions for credibility.
 */
import {
  CURATED_LESSON_ASSESSMENTS_BATCH1,
  CURATED_BATCH_1_KEYS,
} from "./curatedLessonAssessmentsBatch1";
import {
  CURATED_LESSON_ASSESSMENTS_BATCH2,
  CURATED_BATCH_2_KEYS,
} from "./curatedLessonAssessmentsBatch2";
import {
  CURATED_LESSON_ASSESSMENTS_BATCH3,
  CURATED_BATCH_3_KEYS,
} from "./curatedLessonAssessmentsBatch3";
import {
  CURATED_LESSON_ASSESSMENTS_ILU7,
  CURATED_ILU_7_KEYS,
} from "./curatedLessonAssessmentsIlu7";
import { hasFullPedagogy, PEDAGOGY_MARKERS } from "./curatedMcqHelpers";
import type { CuratedAssessmentKey, CuratedLessonAssessment, CuratedMcq } from "./curatedLessonAssessmentTypes";
import { LESSON_PRACTICE_MAP } from "./lessonPracticeMap";

export { CURATED_BATCH_1_KEYS, CURATED_BATCH_2_KEYS, CURATED_BATCH_3_KEYS, CURATED_ILU_7_KEYS };
export { hasFullPedagogy, PEDAGOGY_MARKERS };

export type { CuratedAssessmentKey, CuratedLessonAssessment, CuratedMcq } from "./curatedLessonAssessmentTypes";

export const CURATED_LESSON_ASSESSMENTS: Record<CuratedAssessmentKey, CuratedLessonAssessment> = {
  ...CURATED_LESSON_ASSESSMENTS_BATCH1,
};

Object.assign(CURATED_LESSON_ASSESSMENTS, CURATED_LESSON_ASSESSMENTS_BATCH2);
Object.assign(CURATED_LESSON_ASSESSMENTS, CURATED_LESSON_ASSESSMENTS_BATCH3);
Object.assign(CURATED_LESSON_ASSESSMENTS, CURATED_LESSON_ASSESSMENTS_ILU7);

/** DB / legacy slugs → canonical curated key (ILU-aligned) */
export const CURATED_LESSON_SLUG_ALIASES: Partial<Record<CuratedAssessmentKey, CuratedAssessmentKey>> = {
  "sensors-instrumentation/proximity-sensors-photoeyes": "sensors-instrumentation/proximity-photoelectric",
  "sensors-instrumentation/analog-signals-4-20ma": "sensors-instrumentation/sensor-types-overview",
  "sensors-instrumentation/temperature-pressure-measurement": "sensors-instrumentation/temperature-pressure",
  "print-reading/electrical-schematic-basics": "print-reading/ladder-diagram-conventions",
  "safety-systems/safety-devices-wiring": "safety-systems/estop-circuits",
  "safety-systems/machine-safety-fundamentals": "safety-systems/risk-assessment",
  "safety-systems/machine-risk-assessment-methodology": "safety-systems/risk-assessment",
  "electrical-fundamentals/electrical-safety-lockout": "safety-systems/guarding-lockout",
  "print-reading/panel-layout-wire-tracing": "print-reading/wiring-diagrams",
  "print-reading/control-panel-wiring-terminal-strips": "print-reading/wiring-diagrams",
  "print-reading/plc-io-wiring-address-mapping": "print-reading/wiring-diagrams",
  "sensors-instrumentation/temperature-rtd-thermocouple": "sensors-instrumentation/temperature-pressure",
  "sensors-instrumentation/level-flow-measurement": "sensors-instrumentation/calibration-basics",
  "sensors-instrumentation/signal-conditioning-isolation": "sensors-instrumentation/loop-checkout",
  "safety-systems/safety-plc-programming": "safety-systems/guarding-lockout",
  "print-reading/three-phase-power-prints": "print-reading/pid-symbols",
};

export const CURATED_LESSON_KEYS = Object.keys(CURATED_LESSON_ASSESSMENTS) as CuratedAssessmentKey[];

/** All ILU Track A lesson slugs from lessonPracticeMap */
export function getIluActiveLessonKeys(): CuratedAssessmentKey[] {
  const keys: CuratedAssessmentKey[] = [];
  for (const path of LESSON_PRACTICE_MAP) {
    for (const unit of path.units) {
      keys.push(`${path.pathSlug}/${unit.lessonSlug}` as CuratedAssessmentKey);
    }
  }
  return keys;
}

export function curatedAssessmentKey(moduleSlug: string, lessonSlug: string): CuratedAssessmentKey {
  return `${moduleSlug}/${lessonSlug}`;
}

export function getCuratedLessonAssessment(
  moduleSlug: string,
  lessonSlug: string
): CuratedLessonAssessment | undefined {
  const key = curatedAssessmentKey(moduleSlug, lessonSlug);
  return (
    CURATED_LESSON_ASSESSMENTS[key] ??
    (CURATED_LESSON_SLUG_ALIASES[key]
      ? CURATED_LESSON_ASSESSMENTS[CURATED_LESSON_SLUG_ALIASES[key]!]
      : undefined)
  );
}

/** Banned phrases from auto-generator — curated questions must not contain these */
export const GENERATOR_BAN_PHRASES = [
  "Which topic is a primary focus",
  "What is the main learning objective of the lesson",
  "expected next step in the learning path",
  "Bypass safety interlocks",
  "Apply maximum voltage",
] as const;

/** Generic pedagogy boilerplate — not acceptable for curated assessments */
export const GENERIC_PEDAGOGY_BAN_PHRASES = [
  "sounds plausible under time pressure",
  "similar past failure mode",
  "Evidence that disproves it: compare live I/O or drive diagnostics, meter readings, and print/device status; those checks align with the correct path.",
] as const;

export function validateCuratedMcq(mcq: CuratedMcq): string[] {
  const errors: string[] = [];
  if (mcq.options.length !== 4) errors.push("options must be length 4");
  if (mcq.correctIndex < 0 || mcq.correctIndex > 3) errors.push("invalid correctIndex");
  if (mcq.explanation.length < 20) errors.push("explanation too short");
  if (!hasFullPedagogy(mcq.explanation)) errors.push("missing full pedagogy markers");
  for (const ban of GENERATOR_BAN_PHRASES) {
    if (mcq.question.includes(ban)) errors.push(`banned phrase: ${ban}`);
  }
  for (const ban of GENERIC_PEDAGOGY_BAN_PHRASES) {
    if (mcq.explanation.includes(ban)) errors.push(`generic pedagogy: ${ban}`);
  }
  return errors;
}
