import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

for (const lessonId of [20, 90010]) {
  const [rows] = await conn.execute(
    "SELECT content FROM course_lessons WHERE id = ?", [lessonId]
  );
  if (rows.length === 0) continue;
  
  const content = rows[0].content;
  
  // Find all SVG blocks that contain stroke-dasharray
  const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/g;
  let match;
  let count = 0;
  while ((match = svgRegex.exec(content)) !== null) {
    if (match[0].includes('stroke-dasharray') || match[0].includes('dasharray')) {
      count++;
      const start = Math.max(0, match.index - 150);
      const contextBefore = content.substring(start, match.index).replace(/\n/g, ' ');
      console.log(`\n=== Lesson ${lessonId}, Dashed SVG #${count} ===`);
      console.log(`CONTEXT: ...${contextBefore.slice(-120)}`);
      console.log(`SVG (first 300 chars): ${match[0].substring(0, 300)}...`);
    }
  }
  console.log(`\nLesson ${lessonId}: ${count} dashed SVGs remaining`);
}

await conn.end();
process.exit(0);
