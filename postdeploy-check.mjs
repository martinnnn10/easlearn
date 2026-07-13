import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Question counts by type
const [r1] = await conn.execute("SELECT type, COUNT(*) AS question_count FROM lesson_assessment_questions GROUP BY type");
console.log('Question counts by type:');
r1.forEach(r => console.log(`  ${r.type}: ${r.question_count}`));

// 2. Lessons missing KC
const [r2] = await conn.execute(`
  SELECT COUNT(*) AS lessons_missing_kc
  FROM course_lessons cl
  INNER JOIN course_modules cm ON cm.id = cl.moduleId
  WHERE cl.isPublished = 1 AND cm.isPublished = 1
    AND NOT EXISTS (SELECT 1 FROM lesson_assessment_questions laq WHERE laq.lessonId = cl.id AND laq.type = 'knowledge_check')
`);
console.log('lessons_missing_kc:', r2[0].lessons_missing_kc);

// 3. Lessons missing quiz
const [r3] = await conn.execute(`
  SELECT COUNT(*) AS lessons_missing_quiz
  FROM course_lessons cl
  INNER JOIN course_modules cm ON cm.id = cl.moduleId
  WHERE cl.isPublished = 1 AND cm.isPublished = 1
    AND NOT EXISTS (SELECT 1 FROM lesson_assessment_questions laq WHERE laq.lessonId = cl.id AND laq.type = 'lesson_quiz')
`);
console.log('lessons_missing_quiz:', r3[0].lessons_missing_quiz);

// 4. Published modules
const [r4] = await conn.execute('SELECT COUNT(*) AS published_modules FROM course_modules WHERE isPublished = 1');
console.log('published_modules:', r4[0].published_modules);

// 5. Published lessons
const [r5] = await conn.execute('SELECT COUNT(*) AS published_lessons FROM course_lessons WHERE isPublished = 1');
console.log('published_lessons:', r5[0].published_lessons);

await conn.end();
process.exit(0);
