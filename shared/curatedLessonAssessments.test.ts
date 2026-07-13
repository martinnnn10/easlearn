import { describe, expect, it } from "vitest";
import {
  CURATED_LESSON_ASSESSMENTS,
  CURATED_LESSON_KEYS,
  CURATED_BATCH_1_KEYS,
  CURATED_BATCH_2_KEYS,
  CURATED_BATCH_3_KEYS,
  CURATED_ILU_7_KEYS,
  validateCuratedMcq,
  GENERATOR_BAN_PHRASES,
  GENERIC_PEDAGOGY_BAN_PHRASES,
  getCuratedLessonAssessment,
  getIluActiveLessonKeys,
} from "./curatedLessonAssessments";
import { shuffleMcqForSeed } from "./assessment";
import {
  KNOWLEDGE_CHECK_MIN_QUESTIONS,
  LESSON_QUIZ_MIN_QUESTIONS,
} from "./assessment";

describe("curatedLessonAssessments", () => {
  it("covers 56 curated lessons (batch1 + batch2 + batch3 + ILU7)", () => {
    expect(CURATED_LESSON_KEYS).toHaveLength(56);
    expect(CURATED_BATCH_1_KEYS).toHaveLength(15);
    expect(CURATED_BATCH_2_KEYS).toHaveLength(15);
    expect(CURATED_BATCH_3_KEYS).toHaveLength(19);
    expect(CURATED_ILU_7_KEYS).toHaveLength(7);
  });

  it("meets minimum KC and quiz counts per lesson", () => {
    for (const key of CURATED_LESSON_KEYS) {
      const entry = CURATED_LESSON_ASSESSMENTS[key];
      expect(entry.knowledgeChecks.length).toBeGreaterThanOrEqual(KNOWLEDGE_CHECK_MIN_QUESTIONS);
      expect(entry.lessonQuizzes.length).toBeGreaterThanOrEqual(LESSON_QUIZ_MIN_QUESTIONS);
    }
  });

  it("has valid MCQ structure, full pedagogy, and no banned phrases", () => {
    for (const key of CURATED_LESSON_KEYS) {
      const entry = CURATED_LESSON_ASSESSMENTS[key];
      for (const mcq of [...entry.knowledgeChecks, ...entry.lessonQuizzes]) {
        const errors = validateCuratedMcq(mcq);
        expect(errors, `${key}: ${mcq.question}`).toEqual([]);
        for (const ban of GENERATOR_BAN_PHRASES) {
          expect(mcq.question).not.toContain(ban);
        }
        for (const ban of GENERIC_PEDAGOGY_BAN_PHRASES) {
          expect(mcq.explanation).not.toContain(ban);
        }
        expect(mcq.explanation).toContain("Correct:");
        expect(mcq.explanation).toContain("If you chose");
        expect(new Set(mcq.options).size).toBe(4);
      }
    }
  });

  it("audited indices point to valid questions", () => {
    for (const key of CURATED_LESSON_KEYS) {
      const entry = CURATED_LESSON_ASSESSMENTS[key];
      expect(entry.knowledgeChecks[entry.auditedKnowledgeCheck]).toBeDefined();
      expect(entry.lessonQuizzes[entry.auditedQuiz]).toBeDefined();
    }
  });

  it("covers all ILU Track A lessons (no auto-generator on active ILU paths)", () => {
    const iluKeys = getIluActiveLessonKeys();
    expect(iluKeys.length).toBe(31);
    for (const key of iluKeys) {
      expect(
        getCuratedLessonAssessment(key.split("/")[0], key.split("/")[1]),
        `missing curated for ILU lesson ${key}`
      ).toBeDefined();
    }
  });

  it("aligns io-troubleshooting with conveyor lab I/O", () => {
    const io = CURATED_LESSON_ASSESSMENTS["plc-fundamentals/io-troubleshooting"];
    const text = JSON.stringify(io);
    expect(text).toContain("I:1/5");
    expect(text).toContain("O:2/0");
    expect(text).not.toMatch(/I:0\/\d/);
  });

  it("shuffleMcqForSeed rotates correct index away from always-zero", () => {
    const mcq = CURATED_LESSON_ASSESSMENTS["plc-fundamentals/ladder-logic-basics"].lessonQuizzes[0];
    const shuffled = shuffleMcqForSeed(mcq, 42);
    expect(shuffled.options[shuffled.correctIndex]).toBe(mcq.options[mcq.correctIndex]);
    expect(shuffled.correctIndex).not.toBe(0);
  });

  it("resolves DB slug aliases to curated assessments", () => {
    expect(getCuratedLessonAssessment("safety-systems", "machine-safety-fundamentals")).toBeDefined();
    expect(getCuratedLessonAssessment("electrical-fundamentals", "electrical-safety-lockout")).toBeDefined();
    expect(getCuratedLessonAssessment("print-reading", "panel-layout-wire-tracing")).toBeDefined();
    expect(getCuratedLessonAssessment("sensors-instrumentation", "proximity-sensors-photoeyes")).toBeDefined();
    expect(getCuratedLessonAssessment("print-reading", "electrical-schematic-basics")).toBeDefined();
    expect(getCuratedLessonAssessment("safety-systems", "safety-devices-wiring")).toBeDefined();
    expect(getCuratedLessonAssessment("sensors-instrumentation", "analog-signals-4-20ma")).toBeDefined();
    expect(getCuratedLessonAssessment("sensors-instrumentation", "temperature-pressure-measurement")).toBeDefined();
    expect(getCuratedLessonAssessment("sensors-instrumentation", "temperature-rtd-thermocouple")).toBeDefined();
    expect(getCuratedLessonAssessment("sensors-instrumentation", "level-flow-measurement")).toBeDefined();
    expect(getCuratedLessonAssessment("sensors-instrumentation", "signal-conditioning-isolation")).toBeDefined();
    expect(getCuratedLessonAssessment("safety-systems", "safety-plc-programming")).toBeDefined();
    expect(getCuratedLessonAssessment("print-reading", "three-phase-power-prints")).toBeDefined();
  });
});
