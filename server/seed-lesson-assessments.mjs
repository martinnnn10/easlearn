/**
 * Seed knowledge checks (2) + lesson quizzes (4) for every published lesson.
 * Run on Manus after migration 0025: node server/seed-lesson-assessments.mjs
 *
 * Idempotent: replaces questions per lesson on each run.
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { generateQuestionsForLesson } from "./lib/generateLessonQuestions.mjs";
import { getCuratedLessonAssessment } from "../shared/curatedLessonAssessments.ts";
import { shuffleMcqForSeed } from "../shared/assessment.ts";

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);
  console.log("Connected. Seeding lesson assessments…");

  const [lessons] = await conn.execute(`
    SELECT cl.id, cl.slug, cl.title, cl.content, cl.orderIndex, cl.moduleId, cm.slug AS moduleSlug, cm.title AS moduleTitle
    FROM course_lessons cl
    INNER JOIN course_modules cm ON cm.id = cl.moduleId
    WHERE cl.isPublished = 1 AND cm.isPublished = 1
    ORDER BY cm.orderIndex, cl.orderIndex
  `);

  let kcTotal = 0;
  let quizTotal = 0;
  let curatedLessons = 0;

  for (const lesson of lessons) {
    const curated = getCuratedLessonAssessment(lesson.moduleSlug, lesson.slug);
    if (curated) curatedLessons++;
    const { knowledgeChecks, lessonQuizzes } = curated
      ? {
          knowledgeChecks: curated.knowledgeChecks,
          lessonQuizzes: curated.lessonQuizzes,
        }
      : generateQuestionsForLesson({
          content: lesson.content || "",
          title: lesson.title,
          moduleTitle: lesson.moduleTitle,
          orderIndex: lesson.orderIndex,
        });

    await conn.execute(
      `DELETE FROM lesson_assessment_questions WHERE lessonId = ?`,
      [lesson.id],
    );

    let sort = 0;
    for (const q of knowledgeChecks) {
      const shuffled = shuffleMcqForSeed(q, lesson.id * 100 + sort);
      await conn.execute(
        `INSERT INTO lesson_assessment_questions
          (lessonId, type, question, options, correctIndex, explanation, sortOrder)
         VALUES (?, 'knowledge_check', ?, ?, ?, ?, ?)`,
        [lesson.id, shuffled.question, JSON.stringify(shuffled.options), shuffled.correctIndex, shuffled.explanation, sort++],
      );
      kcTotal++;
    }

    sort = 0;
    for (const q of lessonQuizzes) {
      const shuffled = shuffleMcqForSeed(q, lesson.id * 100 + 50 + sort);
      await conn.execute(
        `INSERT INTO lesson_assessment_questions
          (lessonId, type, question, options, correctIndex, explanation, sortOrder)
         VALUES (?, 'lesson_quiz', ?, ?, ?, ?, ?)`,
        [lesson.id, shuffled.question, JSON.stringify(shuffled.options), shuffled.correctIndex, shuffled.explanation, sort++],
      );
      quizTotal++;
    }
  }

  console.log(
    `Done. ${lessons.length} lessons (${curatedLessons} curated) → ${kcTotal} knowledge checks + ${quizTotal} lesson quiz questions.`,
  );
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
