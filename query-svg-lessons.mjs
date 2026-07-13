import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get all lessons with SVGs
const [rows] = await conn.execute(
  "SELECT id, slug, title, LENGTH(content) as content_len FROM course_lessons WHERE content LIKE '%<svg%' ORDER BY id"
);

console.log("=== Lessons with SVGs ===");
for (const row of rows) {
  console.log(`ID: ${row.id} | Title: ${row.title} | Slug: ${row.slug} | Content Length: ${row.content_len}`);
}

// For each lesson, extract a snippet around the SVG to understand what type of symbol it contains
console.log("\n=== SVG Context Snippets ===");
for (const row of rows) {
  const [content] = await conn.execute(
    "SELECT content FROM course_lessons WHERE id = ?", [row.id]
  );
  const text = content[0].content;
  // Find all SVG occurrences and extract context
  const svgRegex = /<svg[^>]*>/g;
  let match;
  let svgCount = 0;
  while ((match = svgRegex.exec(text)) !== null) {
    svgCount++;
    // Get 100 chars before the SVG for context
    const start = Math.max(0, match.index - 100);
    const contextBefore = text.substring(start, match.index).replace(/\n/g, ' ').trim();
    console.log(`  Lesson ${row.id} (${row.title}), SVG #${svgCount}: ...${contextBefore.slice(-80)}`);
  }
  console.log(`  Total SVGs in lesson ${row.id}: ${svgCount}`);
}

await conn.end();
