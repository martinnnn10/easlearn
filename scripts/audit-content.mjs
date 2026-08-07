import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get all course modules
const [modules] = await conn.execute(
  'SELECT id, slug, title, path, orderIndex, totalLessons, isPublished, prerequisiteSlug FROM course_modules ORDER BY path, orderIndex'
);
console.log("=== COURSE MODULES ===");
console.log(JSON.stringify(modules, null, 2));

// Get lesson count per module
const [lessonCounts] = await conn.execute(
  'SELECT moduleId, COUNT(*) as lessonCount FROM course_lessons GROUP BY moduleId'
);
console.log("\n=== LESSON COUNTS PER MODULE ===");
console.log(JSON.stringify(lessonCounts, null, 2));

// Get first few lessons from beginner modules
const [beginnerLessons] = await conn.execute(
  `SELECT cl.id, cl.moduleId, cl.title, cl.slug, cl.orderIndex 
   FROM course_lessons cl 
   WHERE cl.moduleId IN (SELECT id FROM course_modules WHERE path = 'foundational' OR orderIndex <= 3) 
   ORDER BY cl.moduleId, cl.orderIndex 
   LIMIT 50`
);
console.log("\n=== BEGINNER LESSONS (first 50) ===");
console.log(JSON.stringify(beginnerLessons, null, 2));

// Check scenarios for beginner-friendly ones
const [scenarios] = await conn.execute(
  `SELECT id, title, difficulty FROM scenarios WHERE isPublished = 1 ORDER BY difficulty, id LIMIT 20`
);
console.log("\n=== PUBLISHED SCENARIOS ===");
console.log(JSON.stringify(scenarios, null, 2));

// Check user table for onboarding fields
const [userCols] = await conn.execute('DESCRIBE users');
console.log("\n=== USER TABLE COLUMNS ===");
console.log(userCols.map(c => c.Field).join(', '));

await conn.end();
