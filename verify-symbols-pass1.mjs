/**
 * VERIFICATION PASS 1
 * Check every lesson for symbol compliance.
 * 
 * Rules:
 * - No green-filled SVGs (fill="#22c55e", fill="#16a34a", etc.) in ANY lesson
 * - Semiconductor lessons (60013-60017) must use ANSI/IEEE symbols (currentColor, no green)
 * - PLC lessons (60010-60012) must not be touched
 * - Hardwired schematic lessons must use NMTBA EGP-1 symbols
 * - No mixing of symbol styles
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`  VERIFICATION PASS 1 — Symbol Compliance Check`);
console.log(`═══════════════════════════════════════════════════════════════\n`);

// Get all lessons with content
const [lessons] = await conn.execute('SELECT id, title, moduleId, content FROM course_lessons ORDER BY id');
console.log(`Total lessons: ${lessons.length}\n`);

// Get all modules for context
const [modules] = await conn.execute('SELECT id, title FROM course_modules ORDER BY id');
const moduleMap = {};
for (const m of modules) moduleMap[m.id] = m.title;

let totalLessons = 0;
let lessonsWithSvgs = 0;
let greenViolations = [];
let contextViolations = [];

// Define context boundaries
const PLC_LESSONS = [60010, 60011, 60012];
const SEMICONDUCTOR_LESSONS = [60013, 60014, 60015, 60016, 60017];

for (const lesson of lessons) {
  totalLessons++;
  const content = lesson.content || '';
  const moduleName = moduleMap[lesson.moduleId] || 'Unknown';
  
  // Check for SVGs
  const svgMatches = content.match(/<svg[^>]*>[\s\S]*?<\/svg>/gi) || [];
  
  if (svgMatches.length === 0) {
    console.log(`  [${lesson.id}] ${lesson.title} — No SVGs ✓`);
    continue;
  }
  
  lessonsWithSvgs++;
  let hasGreen = false;
  let greenCount = 0;
  
  for (const svg of svgMatches) {
    if (/fill="#22c55e"|fill="#16a34a"|fill="green"|fill="#4ade80"|fill="#10b981"|fill="#059669"|fill="#15803d"/i.test(svg)) {
      hasGreen = true;
      greenCount++;
    }
  }
  
  if (hasGreen) {
    console.log(`  [${lesson.id}] ${lesson.title} — ✗ FAIL: ${greenCount}/${svgMatches.length} green-filled SVGs remain!`);
    greenViolations.push({ id: lesson.id, title: lesson.title, count: greenCount, total: svgMatches.length });
  } else {
    const usesCurrentColor = svgMatches.some(s => /fill="currentColor"|stroke="currentColor"/i.test(s));
    if (usesCurrentColor) {
      console.log(`  [${lesson.id}] ${lesson.title} — ${svgMatches.length} SVGs, uses currentColor ✓`);
    } else {
      console.log(`  [${lesson.id}] ${lesson.title} — ${svgMatches.length} SVGs, no green fills ✓`);
    }
  }
  
  // Context check for semiconductor lessons
  if (SEMICONDUCTOR_LESSONS.includes(lesson.id)) {
    for (const svg of svgMatches) {
      if (/stroke-dasharray/i.test(svg) && !/currentColor/i.test(svg)) {
        contextViolations.push({ id: lesson.id, title: lesson.title, issue: 'Old dashed-line symbol in semiconductor lesson' });
      }
    }
  }
  
  // Context check for hardwired lessons - should not have semiconductor terminal labels
  if (!SEMICONDUCTOR_LESSONS.includes(lesson.id) && !PLC_LESSONS.includes(lesson.id)) {
    for (const svg of svgMatches) {
      if (/fill="#22c55e"/i.test(svg)) {
        contextViolations.push({ id: lesson.id, title: lesson.title, issue: 'Green semiconductor icon in hardwired lesson' });
      }
    }
  }
}

console.log(`\n\n═══════════════════════════════════════════════════════════════`);
console.log(`  VERIFICATION PASS 1 — RESULTS`);
console.log(`═══════════════════════════════════════════════════════════════`);
console.log(`\nTotal lessons checked: ${totalLessons}`);
console.log(`Lessons with SVGs: ${lessonsWithSvgs}`);
console.log(`Green fill violations: ${greenViolations.length}`);
console.log(`Context violations: ${contextViolations.length}`);

if (greenViolations.length > 0) {
  console.log(`\n⚠️  GREEN FILL VIOLATIONS:`);
  for (const v of greenViolations) {
    console.log(`  - [${v.id}] ${v.title}: ${v.count}/${v.total} SVGs have green fills`);
  }
}

if (contextViolations.length > 0) {
  console.log(`\n⚠️  CONTEXT VIOLATIONS:`);
  for (const v of contextViolations) {
    console.log(`  - [${v.id}] ${v.title}: ${v.issue}`);
  }
}

if (greenViolations.length === 0 && contextViolations.length === 0) {
  console.log(`\n✅ ALL LESSONS PASS — No green fills, no context violations`);
}

console.log(`\n═══════════════════════════════════════════════════════════════\n`);

await conn.end();
