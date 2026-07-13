/**
 * Fix remaining green-filled SVGs in lessons 20, 60010, 60017, 60020
 * 
 * Strategy:
 * - Lesson 20 (Motor Control): hardwired context → identify and replace with NMTBA or remove green fill
 * - Lesson 60010 (PLC): PLC context → convert green fills to currentColor (clean line style)
 * - Lesson 60017 (Power Supply): semiconductor context → replace with ANSI/IEEE
 * - Lesson 60020 (HVAC): mixed context → identify and fix each
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const LESSONS_TO_FIX = [20, 60010, 60017, 60020];

for (const lessonId of LESSONS_TO_FIX) {
  const [rows] = await conn.execute('SELECT id, title, content FROM course_lessons WHERE id = ?', [lessonId]);
  if (rows.length === 0) continue;
  
  const lesson = rows[0];
  let content = lesson.content;
  let fixes = 0;
  
  console.log(`\n━━━ [${lessonId}] ${lesson.title} ━━━`);
  
  // Find all SVGs with green fills
  const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
  let match;
  const greenSvgs = [];
  
  while ((match = svgRegex.exec(content)) !== null) {
    if (/fill="#22c55e"|fill="#16a34a"|fill="green"|fill="#4ade80"|fill="#10b981"|fill="#059669"|fill="#15803d"/i.test(match[0])) {
      greenSvgs.push({ svg: match[0], index: match.index });
    }
  }
  
  console.log(`  Found ${greenSvgs.length} green-filled SVGs`);
  
  for (const svgInfo of greenSvgs) {
    const svg = svgInfo.svg;
    
    // Get context around the SVG
    const contextStart = Math.max(0, svgInfo.index - 300);
    const contextEnd = Math.min(content.length, svgInfo.index + svg.length + 300);
    const context = content.substring(contextStart, contextEnd);
    
    // Universal fix: replace all green fill colors with currentColor
    // This works for ALL contexts - makes symbols theme-aware and clean
    let fixedSvg = svg
      .replace(/fill="#22c55e"/gi, 'fill="currentColor"')
      .replace(/fill="#16a34a"/gi, 'fill="currentColor"')
      .replace(/fill="green"/gi, 'fill="currentColor"')
      .replace(/fill="#4ade80"/gi, 'fill="currentColor"')
      .replace(/fill="#10b981"/gi, 'fill="currentColor"')
      .replace(/fill="#059669"/gi, 'fill="currentColor"')
      .replace(/fill="#15803d"/gi, 'fill="currentColor"')
      // Also fix green strokes
      .replace(/stroke="#22c55e"/gi, 'stroke="currentColor"')
      .replace(/stroke="#16a34a"/gi, 'stroke="currentColor"')
      .replace(/stroke="green"/gi, 'stroke="currentColor"')
      .replace(/stroke="#4ade80"/gi, 'stroke="currentColor"')
      .replace(/stroke="#10b981"/gi, 'stroke="currentColor"')
      .replace(/stroke="#059669"/gi, 'stroke="currentColor"');
    
    if (fixedSvg !== svg) {
      content = content.replace(svg, fixedSvg);
      fixes++;
      
      // Show what we found in context
      const contextSnippet = context.substring(0, 80).replace(/<[^>]+>/g, '').trim();
      console.log(`  ✓ Fixed green → currentColor (context: "${contextSnippet}...")`);
    }
  }
  
  if (fixes > 0) {
    await conn.execute('UPDATE course_lessons SET content = ? WHERE id = ?', [content, lessonId]);
    console.log(`  → Saved ${fixes} fixes to lesson ${lessonId}`);
  }
}

console.log(`\n═══ COMPLETE ═══`);
await conn.end();
