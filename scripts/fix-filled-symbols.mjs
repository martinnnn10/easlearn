import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

/**
 * Fix filled polygon symbols in database lesson content.
 * Replaces filled triangles/polygons with outline-only versions per IEC 60617 drafting standards.
 * 
 * Targets:
 * - Diode triangles: fill="color" → fill="none" stroke="color"
 * - Arrow polygons: fill="color" → fill="none" stroke="color"
 * - Ensures consistent stroke-width across all symbols
 */

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  
  // Get all lessons that contain SVG content with filled polygons
  const [rows] = await conn.execute(
    `SELECT id, title, content FROM course_lessons WHERE content LIKE '%<polygon%fill="%' AND content NOT LIKE '%fill="none"%'`
  );
  
  console.log(`Found ${rows.length} lessons with potential filled polygons to fix`);
  
  let fixedCount = 0;
  
  for (const row of rows) {
    let content = row.content;
    let modified = false;
    
    // Fix filled polygon triangles (diode bodies, arrows)
    // Pattern: <polygon points="..." fill="#hexcolor" .../>
    // Replace with: <polygon points="..." fill="none" stroke="#hexcolor" stroke-width="2" .../>
    const polygonRegex = /<polygon\s+points="([^"]+)"\s+fill="(#[a-fA-F0-9]{6})"\s*(stroke="[^"]*"\s*)?stroke-width="([^"]*)"\s*\/>/g;
    const newContent = content.replace(polygonRegex, (match, points, fillColor, existingStroke, strokeWidth) => {
      modified = true;
      return `<polygon points="${points}" fill="none" stroke="${fillColor}" stroke-width="2.5"/>`;
    });
    
    // Also fix simpler pattern: <polygon points="..." fill="#color"/>
    const simplePolygonRegex = /<polygon\s+points="([^"]+)"\s+fill="(#[a-fA-F0-9]{6})"\s*\/>/g;
    const finalContent = newContent.replace(simplePolygonRegex, (match, points, fillColor) => {
      modified = true;
      return `<polygon points="${points}" fill="none" stroke="${fillColor}" stroke-width="2.5"/>`;
    });
    
    // Fix pattern with stroke before fill
    const altPolygonRegex = /<polygon\s+points="([^"]+)"\s+fill="(#[a-fA-F0-9]{6})"\s+stroke="(#[a-fA-F0-9]{6})"\s+stroke-width="([^"]*)"\s*\/>/g;
    const finalContent2 = finalContent.replace(altPolygonRegex, (match, points, fillColor, strokeColor, strokeWidth) => {
      modified = true;
      return `<polygon points="${points}" fill="none" stroke="${strokeColor}" stroke-width="2.5"/>`;
    });
    
    if (modified && finalContent2 !== content) {
      await conn.execute('UPDATE course_lessons SET content = ? WHERE id = ?', [finalContent2, row.id]);
      fixedCount++;
      console.log(`✅ Fixed lesson ${row.id}: ${row.title}`);
    }
  }
  
  // Also fix lessons that have fill="currentColor" on polygons (from React-rendered content stored in DB)
  const [rows2] = await conn.execute(
    `SELECT id, title, content FROM course_lessons WHERE content LIKE '%<polygon%fill="currentColor"%'`
  );
  
  for (const row of rows2) {
    let content = row.content;
    const fixedContent = content.replace(
      /<polygon\s+points="([^"]+)"\s+fill="currentColor"\s*\/>/g,
      '<polygon points="$1" fill="none" stroke="currentColor" stroke-width="2.5"/>'
    );
    
    if (fixedContent !== content) {
      await conn.execute('UPDATE course_lessons SET content = ? WHERE id = ?', [fixedContent, row.id]);
      fixedCount++;
      console.log(`✅ Fixed currentColor polygon in lesson ${row.id}: ${row.title}`);
    }
  }
  
  console.log(`\n✅ Total lessons fixed: ${fixedCount}`);
  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
