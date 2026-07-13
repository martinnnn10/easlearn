import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// NMTBA-style contactor (3-phase main contacts) - three disconnect blades
const NMTBA_CONTACTOR = `<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Three-phase power contacts (NMTBA EGP-1 style) -->
  <!-- Phase A -->
  <line x1="40" y1="20" x2="40" y2="40" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
  <circle cx="40" cy="42" r="3" fill="oklch(0.85 0 0)"/>
  <line x1="40" y1="42" x2="40" y2="68" stroke="oklch(0.85 0 0)" stroke-width="2.5" transform="rotate(-20 40 42)"/>
  <circle cx="40" cy="75" r="3" fill="oklch(0.85 0 0)"/>
  <line x1="40" y1="78" x2="40" y2="100" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
  <!-- Phase B -->
  <line x1="100" y1="20" x2="100" y2="40" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
  <circle cx="100" cy="42" r="3" fill="oklch(0.85 0 0)"/>
  <line x1="100" y1="42" x2="100" y2="68" stroke="oklch(0.85 0 0)" stroke-width="2.5" transform="rotate(-20 100 42)"/>
  <circle cx="100" cy="75" r="3" fill="oklch(0.85 0 0)"/>
  <line x1="100" y1="78" x2="100" y2="100" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
  <!-- Phase C -->
  <line x1="160" y1="20" x2="160" y2="40" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
  <circle cx="160" cy="42" r="3" fill="oklch(0.85 0 0)"/>
  <line x1="160" y1="42" x2="160" y2="68" stroke="oklch(0.85 0 0)" stroke-width="2.5" transform="rotate(-20 160 42)"/>
  <circle cx="160" cy="75" r="3" fill="oklch(0.85 0 0)"/>
  <line x1="160" y1="78" x2="160" y2="100" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
  <!-- Mechanical linkage (dashed line connecting all three) -->
  <line x1="35" y1="55" x2="165" y2="55" stroke="oklch(0.85 0 0)" stroke-width="1.5" stroke-dasharray="6,3"/>
</svg>`;

// For lesson 90010, the old symbol in the Power Components table is a disconnect/contactor
// Replace with NMTBA-style NO contact (the table shows basic symbols)
const NMTBA_DISCONNECT_INLINE = `<svg viewBox="0 0 100 60" width="100" height="60"><line x1="0" y1="30" x2="35" y2="30" stroke="oklch(0.85 0 0)" stroke-width="2.5"/><circle cx="37" cy="30" r="3" fill="oklch(0.85 0 0)"/><line x1="37" y1="30" x2="63" y2="15" stroke="oklch(0.85 0 0)" stroke-width="2.5"/><circle cx="65" cy="30" r="3" fill="oklch(0.85 0 0)"/><line x1="65" y1="30" x2="100" y2="30" stroke="oklch(0.85 0 0)" stroke-width="2.5"/></svg>`;

// Fix lesson 20
const [lesson20] = await conn.execute("SELECT content FROM course_lessons WHERE id = 20");
if (lesson20.length > 0) {
  let content = lesson20[0].content;
  // Find the contactor SVG (contains stroke-dasharray and "Three-phase power contacts")
  const contactorRegex = /<svg[^>]*>[\s\S]*?Three-phase power contacts[\s\S]*?<\/svg>/;
  if (contactorRegex.test(content)) {
    content = content.replace(contactorRegex, NMTBA_CONTACTOR);
    await conn.execute("UPDATE course_lessons SET content = ? WHERE id = 20", [content]);
    console.log("✓ Lesson 20: Contactor SVG replaced with NMTBA style");
  } else {
    // Try a broader match - any SVG with stroke-dasharray
    const svgRegex = /<svg[^>]*>[\s\S]*?stroke-dasharray[\s\S]*?<\/svg>/;
    if (svgRegex.test(content)) {
      // Get context to determine what it is
      const match = content.match(svgRegex);
      const idx = content.indexOf(match[0]);
      const ctx = content.substring(Math.max(0, idx - 100), idx);
      console.log("  Context:", ctx.slice(-80));
      
      if (ctx.includes('Contactor')) {
        content = content.replace(svgRegex, NMTBA_CONTACTOR);
        await conn.execute("UPDATE course_lessons SET content = ? WHERE id = 20", [content]);
        console.log("✓ Lesson 20: Contactor SVG replaced");
      }
    }
  }
}

// Fix lesson 90010
const [lesson90010] = await conn.execute("SELECT content FROM course_lessons WHERE id = 90010");
if (lesson90010.length > 0) {
  let content = lesson90010[0].content;
  // Find the SVG with stroke-dasharray in the power components table
  const svgRegex = /<svg[^>]*>[\s\S]*?stroke-dasharray[\s\S]*?<\/svg>/;
  if (svgRegex.test(content)) {
    content = content.replace(svgRegex, NMTBA_DISCONNECT_INLINE);
    await conn.execute("UPDATE course_lessons SET content = ? WHERE id = 90010", [content]);
    console.log("✓ Lesson 90010: Old dashed symbol replaced with NMTBA disconnect");
  }
}

// Verify no more dashed SVGs remain
const [remaining] = await conn.execute(
  "SELECT id, title FROM course_lessons WHERE id NOT BETWEEN 60010 AND 60020 AND content LIKE '%stroke-dasharray%'"
);
console.log(`\nRemaining lessons with stroke-dasharray: ${remaining.length}`);
for (const r of remaining) console.log(`  ${r.id}: ${r.title}`);

await conn.end();
process.exit(0);
