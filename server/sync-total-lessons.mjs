/**
 * Sync course_modules.totalLessons from published lesson counts.
 * Run: node server/sync-total-lessons.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

const [result] = await connection.execute(`
  UPDATE course_modules cm
  SET totalLessons = (
    SELECT COUNT(*)
    FROM course_lessons cl
    WHERE cl.moduleId = cm.id AND cl.isPublished = 1
  )
`);

console.log(`Synced totalLessons for ${result.affectedRows ?? 0} module(s).`);

const [rows] = await connection.execute(`
  SELECT cm.slug, cm.title, cm.totalLessons,
    (SELECT COUNT(*) FROM course_lessons cl WHERE cl.moduleId = cm.id AND cl.isPublished = 1) AS actualLessons
  FROM course_modules cm
  WHERE cm.isPublished = 1
  ORDER BY cm.orderIndex
`);

for (const row of rows) {
  console.log(`  ${row.slug}: totalLessons=${row.totalLessons} (published=${row.actualLessons})`);
}

await connection.end();
console.log('\nDone.');
