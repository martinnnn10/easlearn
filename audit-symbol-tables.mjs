import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Get print-reading lessons that might have symbol tables
  const [printReadingLessons] = await connection.execute(
    `SELECT cl.id, cl.slug, cl.title, cl.content
     FROM course_lessons cl 
     JOIN course_modules cm ON cm.id = cl.moduleId
     WHERE cm.slug = 'print-reading'
     ORDER BY cl.orderIndex`
  );
  
  console.log('=== PRINT READING COURSE - SYMBOL TABLE SEARCH ===');
  for (const lesson of printReadingLessons) {
    const lines = lesson.content.split('\n');
    let hasSymbolTable = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if ((line.includes('symbol') && line.includes('|')) || 
          (line.includes('device') && line.includes('|') && line.includes('type')) ||
          (line.includes('contact') && line.includes('|') && line.includes('symbol'))) {
        if (!hasSymbolTable) {
          console.log(`\n--- ${lesson.title} (${lesson.slug}) ---`);
          hasSymbolTable = true;
        }
        // Print surrounding context
        for (let j = Math.max(0, i-1); j <= Math.min(lines.length-1, i+10); j++) {
          console.log(`  [${j+1}] ${lines[j]}`);
        }
        console.log('  ...');
        break;
      }
    }
  }
  
  // Also check motors-controls course
  const [motorsLessons] = await connection.execute(
    `SELECT cl.id, cl.slug, cl.title, cl.content
     FROM course_lessons cl 
     JOIN course_modules cm ON cm.id = cl.moduleId
     WHERE cm.slug = 'motors-controls'
     ORDER BY cl.orderIndex`
  );
  
  console.log('\n\n=== MOTORS & CONTROLS COURSE - SYMBOL TABLE SEARCH ===');
  for (const lesson of motorsLessons) {
    const lines = lesson.content.split('\n');
    let hasSymbolTable = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if ((line.includes('symbol') && line.includes('|')) || 
          (line.includes('device') && line.includes('|') && line.includes('type')) ||
          (line.includes('contact') && line.includes('|') && (line.includes('no') || line.includes('nc')))) {
        if (!hasSymbolTable) {
          console.log(`\n--- ${lesson.title} (${lesson.slug}) ---`);
          hasSymbolTable = true;
        }
        for (let j = Math.max(0, i-1); j <= Math.min(lines.length-1, i+10); j++) {
          console.log(`  [${j+1}] ${lines[j]}`);
        }
        console.log('  ...');
        break;
      }
    }
  }
  
  // Check electrical-fundamentals
  const [efLessons] = await connection.execute(
    `SELECT cl.id, cl.slug, cl.title, cl.content
     FROM course_lessons cl 
     JOIN course_modules cm ON cm.id = cl.moduleId
     WHERE cm.slug = 'electrical-fundamentals'
     ORDER BY cl.orderIndex`
  );
  
  console.log('\n\n=== ELECTRICAL FUNDAMENTALS - SYMBOL TABLE SEARCH ===');
  for (const lesson of efLessons) {
    const lines = lesson.content.split('\n');
    let hasSymbolTable = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if ((line.includes('symbol') && line.includes('|')) || 
          (line.includes('device') && line.includes('|') && (line.includes('type') || line.includes('function')))) {
        if (!hasSymbolTable) {
          console.log(`\n--- ${lesson.title} (${lesson.slug}) ---`);
          hasSymbolTable = true;
        }
        for (let j = Math.max(0, i-1); j <= Math.min(lines.length-1, i+10); j++) {
          console.log(`  [${j+1}] ${lines[j]}`);
        }
        console.log('  ...');
        break;
      }
    }
  }
  
  // Check PLC fundamentals
  const [plcLessons] = await connection.execute(
    `SELECT cl.id, cl.slug, cl.title, cl.content
     FROM course_lessons cl 
     JOIN course_modules cm ON cm.id = cl.moduleId
     WHERE cm.slug = 'plc-fundamentals'
     ORDER BY cl.orderIndex`
  );
  
  console.log('\n\n=== PLC FUNDAMENTALS - SYMBOL TABLE SEARCH ===');
  for (const lesson of plcLessons) {
    const lines = lesson.content.split('\n');
    let hasSymbolTable = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if ((line.includes('symbol') && line.includes('|')) || 
          (line.includes('instruction') && line.includes('|') && line.includes('symbol')) ||
          (line.includes('contact') && line.includes('|') && (line.includes('description') || line.includes('function')))) {
        if (!hasSymbolTable) {
          console.log(`\n--- ${lesson.title} (${lesson.slug}) ---`);
          hasSymbolTable = true;
        }
        for (let j = Math.max(0, i-1); j <= Math.min(lines.length-1, i+10); j++) {
          console.log(`  [${j+1}] ${lines[j]}`);
        }
        console.log('  ...');
        break;
      }
    }
  }
  
  await connection.end();
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
