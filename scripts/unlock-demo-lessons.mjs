#!/usr/bin/env node
/**
 * Unlock all lessons for the demo learner (Marcus Doyle) so the VP demo
 * can navigate freely without hitting lesson gating.
 *
 * Strategy: For each lesson in every module, insert a "passed" knowledge_check
 * and lesson_quiz attempt, plus mark user_progress as completed. This makes
 * buildModuleLessonGates() return unlocked:true for every subsequent lesson.
 */
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function getDbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    return JSON.parse(fs.readFileSync(path.join(root, '.project-config.json'), 'utf8'))?.env_vars?.DATABASE_URL ?? null;
  } catch { return null; }
}

const url = getDbUrl();
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
const conn = await mysql.createConnection(url);

const DEMO_EMAILS = ['demo.tech@easlearn.demo', 'demo.manager@easlearn.demo'];

// Get demo user IDs
const learnerIds = [];
for (const email of DEMO_EMAILS) {
  const [users] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (!users.length) { console.warn(`User ${email} not found, skipping.`); continue; }
  learnerIds.push({ id: users[0].id, email });
  console.log(`Demo user: ${email} (id ${users[0].id})`);
}
if (!learnerIds.length) { console.error('No demo users found. Run demo:seed first.'); await conn.end(); process.exit(1); }

// Get all published lessons across all modules
const [lessons] = await conn.query(`
  SELECT cl.id as lessonId, cl.slug, cl.moduleId, cl.orderIndex, cm.slug as moduleSlug
  FROM course_lessons cl
  JOIN course_modules cm ON cl.moduleId = cm.id
  WHERE cl.isPublished = 1
  ORDER BY cm.id, cl.orderIndex
`);
console.log(`Found ${lessons.length} published lessons across all modules`);

// Get assessment question counts per lesson (to know totalQuestions for each type)
const [questions] = await conn.query(`
  SELECT lessonId, type, COUNT(*) as cnt FROM lesson_assessment_questions GROUP BY lessonId, type
`);
const questionCounts = {};
for (const q of questions) {
  const key = `${q.lessonId}:${q.type}`;
  questionCounts[key] = q.cnt;
}

let totalUnlocked = 0;
for (const { id: learnerId, email } of learnerIds) {
  let unlocked = 0;
  for (const lesson of lessons) {
    const kcCount = questionCounts[`${lesson.lessonId}:knowledge_check`] || 0;
    const quizCount = questionCounts[`${lesson.lessonId}:lesson_quiz`] || 0;

    // Insert a passed knowledge_check attempt for this lesson
    if (kcCount > 0) {
      const [existing] = await conn.query(
        'SELECT id FROM lesson_assessment_attempts WHERE userId = ? AND lessonId = ? AND type = ? AND passed = 1 LIMIT 1',
        [learnerId, lesson.lessonId, 'knowledge_check']
      );
      if (!existing.length) {
        await conn.query(
          'INSERT INTO lesson_assessment_attempts (userId, lessonId, type, score, totalQuestions, passed, answers, completedAt) VALUES (?, ?, ?, ?, ?, 1, ?, NOW())',
          [learnerId, lesson.lessonId, 'knowledge_check', kcCount, kcCount, JSON.stringify([])]
        );
      }
    }

    // Insert a passed lesson_quiz attempt for this lesson
    if (quizCount > 0) {
      const [existing] = await conn.query(
        'SELECT id FROM lesson_assessment_attempts WHERE userId = ? AND lessonId = ? AND type = ? AND passed = 1 LIMIT 1',
        [learnerId, lesson.lessonId, 'lesson_quiz']
      );
      if (!existing.length) {
        await conn.query(
          'INSERT INTO lesson_assessment_attempts (userId, lessonId, type, score, totalQuestions, passed, answers, completedAt) VALUES (?, ?, ?, ?, ?, 1, ?, NOW())',
          [learnerId, lesson.lessonId, 'lesson_quiz', quizCount, quizCount, JSON.stringify([])]
        );
      }
    }

    // Mark lesson as completed in user_progress
    const [progressExists] = await conn.query(
      'SELECT id FROM user_progress WHERE userId = ? AND lessonId = ? LIMIT 1',
      [learnerId, lesson.lessonId]
    );
    if (!progressExists.length) {
      await conn.query(
        'INSERT INTO user_progress (userId, moduleId, lessonId, completed, completedAt) VALUES (?, ?, ?, 1, NOW())',
        [learnerId, lesson.moduleId, lesson.lessonId]
      );
    } else {
      await conn.query(
        'UPDATE user_progress SET completed = 1, completedAt = COALESCE(completedAt, NOW()) WHERE userId = ? AND lessonId = ?',
        [learnerId, lesson.lessonId]
      );
    }

    unlocked++;
  }
  console.log(`  ${email}: ${unlocked} lessons unlocked`);
  totalUnlocked += unlocked;
}

console.log(`\nTotal: ${totalUnlocked} lesson gates opened for ${learnerIds.length} demo users.`);
console.log('All demo accounts can now navigate freely.');
await conn.end();
