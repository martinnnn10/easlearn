import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Get all modules
  const [modules] = await connection.execute(
    'SELECT id, slug, title, path, orderIndex, totalLessons, isPublished FROM course_modules ORDER BY orderIndex'
  );
  console.log('=== COURSE MODULES ===');
  console.log(JSON.stringify(modules, null, 2));
  
  // Get all lessons with content length
  const [lessons] = await connection.execute(
    'SELECT id, moduleId, slug, title, orderIndex, LENGTH(content) as contentLength, isPublished FROM course_lessons ORDER BY moduleId, orderIndex'
  );
  console.log('\n=== COURSE LESSONS ===');
  console.log(JSON.stringify(lessons, null, 2));
  
  // Find lessons with very short content (likely placeholder)
  const [shortLessons] = await connection.execute(
    'SELECT id, moduleId, slug, title, LEFT(content, 200) as contentPreview, LENGTH(content) as contentLength FROM course_lessons WHERE LENGTH(content) < 500 ORDER BY moduleId, orderIndex'
  );
  console.log('\n=== SHORT/POTENTIALLY EMPTY LESSONS (< 500 chars) ===');
  console.log(JSON.stringify(shortLessons, null, 2));
  
  // Count lessons per module
  const [lessonCounts] = await connection.execute(
    'SELECT cm.id, cm.slug, cm.title, cm.totalLessons as declaredLessons, COUNT(cl.id) as actualLessons FROM course_modules cm LEFT JOIN course_lessons cl ON cl.moduleId = cm.id GROUP BY cm.id ORDER BY cm.orderIndex'
  );
  console.log('\n=== LESSON COUNTS PER MODULE ===');
  console.log(JSON.stringify(lessonCounts, null, 2));
  
  await connection.end();
}

main().catch(console.error);
