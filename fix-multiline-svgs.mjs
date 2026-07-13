import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Fix lesson 90010 - the pressure switch SVG is multi-line in a markdown table
const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 90010');
let content = rows[0].content;

// The problem: line 20 starts with "| <svg xmlns..." and the SVG spans multiple lines
// We need to collapse it to a single line

// Replace the multi-line pressure switch SVG with a single-line NMTBA version
const multiLinePressureSvg = `| <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="60" y1="35" x2="45" y2="15" stroke="currentColor" stroke-width="2"/>
    <circle cx="42" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </svg> | Pressure switch | Pressure detection |`;

// NMTBA EGP-1 pressure switch NO (single line)
const nmtbaPressureSvg = `| <svg viewBox="0 0 200 120" width="120" height="72" xmlns="http://www.w3.org/2000/svg"><line x1="10" y1="50" x2="70" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/><circle cx="72" cy="50" r="4" fill="oklch(0.85 0 0)"/><line x1="72" y1="50" x2="108" y2="25" stroke="oklch(0.85 0 0)" stroke-width="3"/><circle cx="128" cy="50" r="4" fill="oklch(0.85 0 0)"/><line x1="128" y1="50" x2="190" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/><line x1="72" y1="54" x2="72" y2="80" stroke="oklch(0.85 0 0)" stroke-width="2"/><path d="M 60 80 A 12 12 0 0 1 84 80" fill="none" stroke="oklch(0.85 0 0)" stroke-width="2.5"/></svg> | Pressure switch | Pressure detection |`;

if (content.includes(multiLinePressureSvg)) {
  content = content.replace(multiLinePressureSvg, nmtbaPressureSvg);
  await conn.execute("UPDATE course_lessons SET content = ? WHERE id = 90010", [content]);
  console.log("✓ Fixed multi-line pressure switch SVG in lesson 90010");
} else {
  console.log("Multi-line SVG pattern not found exactly. Trying regex approach...");
  // Try regex to find the multi-line SVG
  const regex = /\| <svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 120 80"[\s\S]*?<\/svg> \| Pressure switch \| Pressure detection \|/;
  if (regex.test(content)) {
    content = content.replace(regex, nmtbaPressureSvg);
    await conn.execute("UPDATE course_lessons SET content = ? WHERE id = 90010", [content]);
    console.log("✓ Fixed multi-line pressure switch SVG (regex) in lesson 90010");
  } else {
    console.log("ERROR: Could not find the multi-line SVG pattern");
  }
}

// Also fix the temperature switch if it's multi-line
const tempSvgCheck = content.split('\n');
let tempIssue = false;
for (let i = 0; i < tempSvgCheck.length; i++) {
  if (tempSvgCheck[i].includes('Temperature switch') && tempSvgCheck[i-1] && tempSvgCheck[i-1].includes('</svg>')) {
    // Check if the SVG before it is multi-line
    if (!tempSvgCheck[i-1].includes('| <svg')) {
      tempIssue = true;
      console.log("Temperature switch SVG is also multi-line at line", i);
    }
  }
}

// Verify no more multi-line SVGs in tables
const lines = content.split('\n');
let inTable = false;
let brokenSvgs = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('|') && lines[i].includes('<svg')) {
    if (!lines[i].includes('</svg>')) {
      brokenSvgs++;
      console.log(`WARNING: Multi-line SVG at line ${i}: ${lines[i].substring(0, 80)}...`);
    }
  }
}
console.log(`\nRemaining multi-line SVGs in tables: ${brokenSvgs}`);

await conn.end();
process.exit(0);
