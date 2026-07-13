/**
 * Dry-run validation of curated lesson assessments (no database).
 * Run: pnpm exec tsx scripts/verify-curated-assessments.mjs
 */
import {
  CURATED_LESSON_ASSESSMENTS,
  CURATED_LESSON_KEYS,
  CURATED_BATCH_1_KEYS,
  CURATED_BATCH_2_KEYS,
  CURATED_BATCH_3_KEYS,
  CURATED_ILU_7_KEYS,
  validateCuratedMcq,
  GENERATOR_BAN_PHRASES,
  getIluActiveLessonKeys,
  getCuratedLessonAssessment,
} from "../shared/curatedLessonAssessments.ts";
import { KNOWLEDGE_CHECK_MIN_QUESTIONS, LESSON_QUIZ_MIN_QUESTIONS } from "../shared/assessment.ts";

let errors = 0;
const results = [];

function check(name, pass, detail = "") {
  results.push({ name, pass, detail });
  if (!pass) errors++;
}

check("batch 1 count", CURATED_BATCH_1_KEYS.length === 15);
check("batch 2 count", CURATED_BATCH_2_KEYS.length === 15);
check("batch 3 count", CURATED_BATCH_3_KEYS.length === 19);
check("ILU7 count", CURATED_ILU_7_KEYS.length === 7);
check("total curated", CURATED_LESSON_KEYS.length === 56);

for (const key of CURATED_LESSON_KEYS) {
  const entry = CURATED_LESSON_ASSESSMENTS[key];
  check(
    `${key} KC count`,
    entry.knowledgeChecks.length >= KNOWLEDGE_CHECK_MIN_QUESTIONS,
    String(entry.knowledgeChecks.length)
  );
  check(
    `${key} quiz count`,
    entry.lessonQuizzes.length >= LESSON_QUIZ_MIN_QUESTIONS,
    String(entry.lessonQuizzes.length)
  );
  for (const mcq of [...entry.knowledgeChecks, ...entry.lessonQuizzes]) {
    const mcqErrors = validateCuratedMcq(mcq);
    check(`${key} MCQ valid`, mcqErrors.length === 0, mcqErrors.join("; "));
    for (const ban of GENERATOR_BAN_PHRASES) {
      check(`${key} no ban phrase`, !mcq.question.includes(ban), ban);
    }
    check(`${key} pedagogy`, mcq.explanation.includes("Correct:") && mcq.explanation.includes("If you chose"));
  }
}

for (const key of getIluActiveLessonKeys()) {
  const [moduleSlug, lessonSlug] = key.split("/");
  check(`ILU curated ${key}`, Boolean(getCuratedLessonAssessment(moduleSlug, lessonSlug)));
}

console.log("\n=== CURATED ASSESSMENTS DRY RUN ===\n");
for (const r of results.filter((x) => !x.pass)) {
  console.log(`FAIL ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
}
const passed = results.filter((x) => x.pass).length;
console.log(`\nSummary: ${passed}/${results.length} checks passed`);
console.log(
  `Batch 1: ${CURATED_BATCH_1_KEYS.length} | Batch 2: ${CURATED_BATCH_2_KEYS.length} | Batch 3: ${CURATED_BATCH_3_KEYS.length} | ILU7: ${CURATED_ILU_7_KEYS.length} | Total: ${CURATED_LESSON_KEYS.length}`
);
process.exit(errors === 0 ? 0 : 1);
