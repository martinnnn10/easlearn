import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Published modules
const [r1] = await conn.execute('SELECT COUNT(*) AS published_modules FROM course_modules WHERE isPublished = 1');
console.log('published_modules:', r1[0].published_modules);

// 2. Published lessons
const [r2] = await conn.execute('SELECT COUNT(*) AS published_lessons FROM course_lessons WHERE isPublished = 1');
console.log('published_lessons:', r2[0].published_lessons);

// 3. KC questions (table may not exist)
try {
  const [r3] = await conn.execute("SELECT COUNT(*) AS kc_questions FROM lesson_assessment_questions WHERE type = 'knowledge_check'");
  console.log('kc_questions:', r3[0].kc_questions);
} catch(e) {
  console.log('kc_questions: TABLE_NOT_EXISTS (expected)');
}

// 4. Lesson quiz questions (table may not exist)
try {
  const [r4] = await conn.execute("SELECT COUNT(*) AS lesson_quiz_questions FROM lesson_assessment_questions WHERE type = 'lesson_quiz'");
  console.log('lesson_quiz_questions:', r4[0].lesson_quiz_questions);
} catch(e) {
  console.log('lesson_quiz_questions: TABLE_NOT_EXISTS (expected)');
}

// 5. Modules with capstone quiz
const [r5] = await conn.execute('SELECT COUNT(DISTINCT moduleId) AS modules_with_capstone_quiz FROM quiz_questions');
console.log('modules_with_capstone_quiz:', r5[0].modules_with_capstone_quiz);

await conn.end();
process.exit(0);
