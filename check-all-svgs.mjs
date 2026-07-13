import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute("SELECT id, title FROM course_lessons WHERE content LIKE '%<svg%'");

let issues = 0;
for (const r of rows) {
  const [data] = await conn.execute('SELECT content FROM course_lessons WHERE id = ?', [r.id]);
  const lines = data[0].content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('|') && line.includes('<svg') && !line.includes('</svg>')) {
      issues++;
      console.log(`BROKEN: Lesson ${r.id} "${r.title}" line ${i}: ${line.substring(0, 80)}...`);
    }
  }
}

if (issues === 0) {
  console.log("✓ All SVGs in markdown tables are single-line. No rendering issues.");
} else {
  console.log(`\n${issues} multi-line SVG(s) found in markdown tables.`);
}

await conn.end();
process.exit(0);
