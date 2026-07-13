import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get lesson 90011 content
const [rows] = await conn.execute(
  "SELECT content FROM course_lessons WHERE id = 90011"
);

if (rows.length > 0) {
  const content = rows[0].content;
  
  // Find all SVG blocks and print 200 chars before each one
  const svgRegex = /<svg[^>]*>/g;
  let match;
  let count = 0;
  while ((match = svgRegex.exec(content)) !== null) {
    count++;
    const start = Math.max(0, match.index - 200);
    const contextBefore = content.substring(start, match.index);
    const svgEnd = content.indexOf('</svg>', match.index);
    const svgTag = content.substring(match.index, match.index + 100);
    console.log(`\n=== SVG #${count} ===`);
    console.log(`BEFORE: ${contextBefore}`);
    console.log(`SVG TAG: ${svgTag}...`);
    console.log(`---`);
  }
}

await conn.end();
