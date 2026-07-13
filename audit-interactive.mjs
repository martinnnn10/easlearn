import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Find lessons with LadderLogicSymbolGuide
  const [ladderLessons] = await conn.execute(`
    SELECT l.title, l.slug, m.slug as module_slug, m.title as module_title
    FROM course_lessons l
    JOIN course_modules m ON l.moduleId = m.id
    WHERE l.content LIKE '%LadderLogicSymbolGuide%'
    ORDER BY m.id, l.orderIndex
  `);
  
  console.log('=== Lessons embedding LadderLogicSymbolGuide ===');
  for (const l of ladderLessons) {
    console.log(`${l.module_slug}/${l.slug} | ${l.title}`);
  }
  console.log(`Total: ${ladderLessons.length}`);
  
  // Find lessons with any INTERACTIVE marker
  const [interactiveLessons] = await conn.execute(`
    SELECT l.title, l.slug, m.slug as module_slug, m.title as module_title,
           l.content
    FROM course_lessons l
    JOIN course_modules m ON l.moduleId = m.id
    WHERE l.content LIKE '%<!-- INTERACTIVE%'
    ORDER BY m.id, l.orderIndex
  `);
  
  console.log('\n=== Lessons with INTERACTIVE markers ===');
  for (const l of interactiveLessons) {
    const markers = l.content.match(/<!-- INTERACTIVE:\s*(\w+)\s*-->/g) || [];
    console.log(`${l.module_slug}/${l.slug} | ${l.title} | ${markers.join(', ')}`);
  }
  console.log(`Total: ${interactiveLessons.length}`);
  
  await conn.end();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
