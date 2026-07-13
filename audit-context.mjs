import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get all lessons with their module info
  const [lessons] = await conn.execute(`
    SELECT l.id, l.slug, l.title, l.moduleId, 
           m.slug as module_slug, m.title as module_title,
           SUBSTRING(l.content, 1, 500) as content_preview
    FROM course_lessons l
    JOIN course_modules m ON l.moduleId = m.id
    ORDER BY m.id, l.orderIndex
  `);
  
  let output = '# Lesson Context Audit\n\n';
  
  let currentModule = null;
  for (const lesson of lessons) {
    if (lesson.moduleId !== currentModule) {
      currentModule = lesson.moduleId;
      output += `\n## Module: ${lesson.module_title} (${lesson.module_slug})\n\n`;
    }
    
    // Check content for symbol-related keywords
    const content = lesson.content_preview || '';
    const hasLadderLogic = /ladder|PLC|RSLogix|Studio 5000|XIC|XIO|OTE|rung|scan/i.test(content);
    const hasHardwired = /elementary|schematic|motor starter|contactor|relay|overload|heater/i.test(content);
    const hasSymbolRef = /symbol|INTERACTIVE.*Symbol|NO contact|NC contact|coil/i.test(content);
    
    let flags = [];
    if (hasLadderLogic) flags.push('PLC');
    if (hasHardwired) flags.push('HARDWIRED');
    if (hasSymbolRef) flags.push('SYMBOLS');
    
    output += `- ${lesson.title} [${flags.join(', ') || 'GENERAL'}]\n`;
  }
  
  fs.writeFileSync('/home/ubuntu/lesson_context_audit.md', output);
  
  // Now get lessons that reference symbols in their full content
  const [symbolLessons] = await conn.execute(`
    SELECT l.id, l.slug, l.title, m.slug as module_slug, m.title as module_title,
           l.content
    FROM course_lessons l
    JOIN course_modules m ON l.moduleId = m.id
    WHERE l.content LIKE '%INTERACTIVE%' 
       OR l.content LIKE '%symbol%'
       OR l.content LIKE '%ladder%'
       OR l.content LIKE '%XIC%'
       OR l.content LIKE '%NO contact%'
       OR l.content LIKE '%NC contact%'
       OR l.content LIKE '%elementary diagram%'
    ORDER BY m.id, l.orderIndex
  `);
  
  let symbolOutput = '# Lessons with Symbol References\n\n';
  
  for (const lesson of symbolLessons) {
    symbolOutput += `\n### ${lesson.title} (${lesson.module_slug}/${lesson.slug})\n`;
    
    const content = lesson.content || '';
    
    // Find INTERACTIVE markers
    const interactiveMatches = content.match(/<!-- INTERACTIVE:.*?-->/g) || [];
    if (interactiveMatches.length > 0) {
      symbolOutput += `Interactive components: ${interactiveMatches.join(', ')}\n`;
    }
    
    // Check for PLC vs hardwired context
    const plcKeywords = (content.match(/ladder logic|PLC|RSLogix|Studio 5000|XIC|XIO|OTE|OTL|OTU|rung|scan time|processor|I\/O module/gi) || []).length;
    const hardwiredKeywords = (content.match(/elementary diagram|schematic|motor starter|contactor|relay coil|overload relay|heater element|control circuit|power circuit/gi) || []).length;
    
    symbolOutput += `PLC keyword count: ${plcKeywords}\n`;
    symbolOutput += `Hardwired keyword count: ${hardwiredKeywords}\n`;
    
    // Check which symbol types are referenced
    if (/NO contact|normally open contact/i.test(content)) symbolOutput += `References: NO contact\n`;
    if (/NC contact|normally closed contact/i.test(content)) symbolOutput += `References: NC contact\n`;
    if (/relay coil|coil symbol/i.test(content)) symbolOutput += `References: Relay coil\n`;
    if (/overload|OL contact/i.test(content)) symbolOutput += `References: Overload\n`;
    if (/pressure switch/i.test(content)) symbolOutput += `References: Pressure switch\n`;
    if (/temperature switch/i.test(content)) symbolOutput += `References: Temperature switch\n`;
    if (/limit switch/i.test(content)) symbolOutput += `References: Limit switch\n`;
    if (/timer|TON|TOF/i.test(content)) symbolOutput += `References: Timer\n`;
    
    // Determine context
    if (plcKeywords > hardwiredKeywords * 2) {
      symbolOutput += `**CONTEXT: PLC LADDER LOGIC**\n`;
    } else if (hardwiredKeywords > plcKeywords * 2) {
      symbolOutput += `**CONTEXT: HARDWIRED SCHEMATIC**\n`;
    } else if (plcKeywords > 0 && hardwiredKeywords > 0) {
      symbolOutput += `**CONTEXT: MIXED (potential issue)**\n`;
    } else {
      symbolOutput += `**CONTEXT: GENERAL**\n`;
    }
  }
  
  fs.writeFileSync('/home/ubuntu/symbol_context_audit.md', symbolOutput);
  
  console.log(`Total lessons: ${lessons.length}`);
  console.log(`Lessons with symbol references: ${symbolLessons.length}`);
  
  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
