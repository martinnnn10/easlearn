import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Read the SVG content to insert
const svgContent = readFileSync('/home/ubuntu/eas-platform/scripts/transistor-svgs.md', 'utf-8');

// Get current content
const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 60014');
let content = rows[0].content;

// Insert the SVG symbols section after the BJT description paragraph (after "Emitter (reference).")
// Find the location after the BJT intro paragraph
const insertAfter = 'The three terminals are the Base (control), Collector (load), and Emitter (reference).';
const insertIdx = content.indexOf(insertAfter);

if (insertIdx === -1) {
  console.error('Could not find insertion point for BJT symbols');
  // Try alternate insertion point - after the "### Operating Regions" heading
  const altInsert = '### Operating Regions';
  const altIdx = content.indexOf(altInsert);
  if (altIdx === -1) {
    console.error('Could not find alternate insertion point either');
    process.exit(1);
  }
  // Insert before Operating Regions
  content = content.slice(0, altIdx) + svgContent + '\n\n' + content.slice(altIdx);
} else {
  // Insert after the BJT intro paragraph
  const endOfParagraph = insertIdx + insertAfter.length;
  // Find the next paragraph break
  const nextBreak = content.indexOf('\n\n', endOfParagraph);
  if (nextBreak !== -1) {
    content = content.slice(0, nextBreak) + '\n\n' + svgContent + content.slice(nextBreak);
  } else {
    content = content.slice(0, endOfParagraph) + '\n\n' + svgContent + content.slice(endOfParagraph);
  }
}

await conn.execute('UPDATE course_lessons SET content = ? WHERE id = 60014', [content]);
console.log('Transistor lesson updated with SVG symbols. New length:', content.length);
await conn.end();
