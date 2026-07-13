import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 90010');
let content = rows[0].content;

// The multi-line temperature switch SVG
const multiLineTemp = `| <svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="70" x2="70" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="70" y1="50" x2="70" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="50" x2="130" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="70" x2="190" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <path d="M 80 48 A 20 20 0 0 1 120 48" fill="none" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
  </svg> | Temperature switch | Temperature detection |`;

// NMTBA EGP-1 temperature switch NO (single line) - vertical stem from pivot
const nmtbaTempSvg = `| <svg viewBox="0 0 100 80" width="100" height="80" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="30" x2="35" y2="30" stroke="oklch(0.85 0 0)" stroke-width="2.5"/><circle cx="37" cy="30" r="3" fill="oklch(0.85 0 0)"/><line x1="37" y1="30" x2="63" y2="15" stroke="oklch(0.85 0 0)" stroke-width="2.5"/><circle cx="65" cy="30" r="3" fill="oklch(0.85 0 0)"/><line x1="65" y1="30" x2="100" y2="30" stroke="oklch(0.85 0 0)" stroke-width="2.5"/><line x1="37" y1="33" x2="37" y2="60" stroke="oklch(0.85 0 0)" stroke-width="2"/></svg> | Temperature switch | Temperature detection |`;

if (content.includes(multiLineTemp)) {
  content = content.replace(multiLineTemp, nmtbaTempSvg);
  await conn.execute("UPDATE course_lessons SET content = ? WHERE id = 90010", [content]);
  console.log("✓ Fixed multi-line temperature switch SVG in lesson 90010");
} else {
  console.log("ERROR: Could not find the multi-line temperature SVG pattern");
  // Try to find it with regex
  const regex = /\| <svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;"[\s\S]*?<\/svg> \| Temperature switch \| Temperature detection \|/;
  if (regex.test(content)) {
    content = content.replace(regex, nmtbaTempSvg);
    await conn.execute("UPDATE course_lessons SET content = ? WHERE id = 90010", [content]);
    console.log("✓ Fixed multi-line temperature switch SVG (regex) in lesson 90010");
  } else {
    console.log("ERROR: Regex also failed");
  }
}

// Final verification
const [verify] = await conn.execute('SELECT content FROM course_lessons WHERE id = 90010');
const lines = verify[0].content.split('\n');
let brokenSvgs = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('|') && lines[i].includes('<svg')) {
    if (!lines[i].includes('</svg>')) {
      brokenSvgs++;
      console.log(`WARNING: Still multi-line SVG at line ${i}`);
    }
  }
}
console.log(`Remaining multi-line SVGs in tables: ${brokenSvgs}`);

await conn.end();
process.exit(0);
