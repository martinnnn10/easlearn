import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

/**
 * Comprehensive fix for ALL filled polygons in database lesson content.
 * Handles multiple attribute orderings and patterns.
 */

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  
  // Get all lessons with polygon elements
  const [rows] = await conn.execute(
    `SELECT id, title, content FROM course_lessons WHERE content LIKE '%<polygon%'`
  );
  
  console.log(`Found ${rows.length} lessons with polygon elements`);
  
  let fixedCount = 0;
  
  for (const row of rows) {
    let content = row.content;
    let modified = false;
    
    // Replace any <polygon ...> that has a fill attribute that is NOT "none"
    // This handles all attribute orderings
    const newContent = content.replace(/<polygon([^>]*)>/g, (match, attrs) => {
      // Check if fill is already "none"
      if (/fill\s*=\s*"none"/.test(attrs)) {
        return match; // Already correct
      }
      
      // Extract the fill color
      const fillMatch = attrs.match(/fill\s*=\s*"([^"]+)"/);
      if (!fillMatch) {
        return match; // No fill attribute, leave as-is
      }
      
      const fillColor = fillMatch[1];
      
      // Remove the existing fill attribute
      let newAttrs = attrs.replace(/\s*fill\s*=\s*"[^"]*"/, '');
      
      // Check if there's already a stroke attribute
      const hasStroke = /stroke\s*=\s*"/.test(newAttrs);
      const hasStrokeWidth = /stroke-width\s*=\s*"/.test(newAttrs);
      
      // Add fill="none" and stroke if needed
      newAttrs = ` fill="none"` + newAttrs;
      if (!hasStroke) {
        newAttrs += ` stroke="${fillColor}"`;
      }
      if (!hasStrokeWidth) {
        newAttrs += ` stroke-width="2.5"`;
      }
      
      modified = true;
      return `<polygon${newAttrs}>`;
    });
    
    // Also handle self-closing polygons: <polygon ... />
    const newContent2 = newContent.replace(/<polygon([^/]*?)\/>/g, (match, attrs) => {
      // Check if fill is already "none"
      if (/fill\s*=\s*"none"/.test(attrs)) {
        return match;
      }
      
      const fillMatch = attrs.match(/fill\s*=\s*"([^"]+)"/);
      if (!fillMatch) {
        return match;
      }
      
      const fillColor = fillMatch[1];
      
      // Remove existing fill
      let newAttrs = attrs.replace(/\s*fill\s*=\s*"[^"]*"/, '');
      
      const hasStroke = /stroke\s*=\s*"/.test(newAttrs);
      const hasStrokeWidth = /stroke-width\s*=\s*"/.test(newAttrs);
      
      newAttrs = ` fill="none"` + newAttrs;
      if (!hasStroke) {
        newAttrs += ` stroke="${fillColor}"`;
      }
      if (!hasStrokeWidth) {
        newAttrs += ` stroke-width="2.5"`;
      }
      
      modified = true;
      return `<polygon${newAttrs}/>`;
    });
    
    if (modified && newContent2 !== content) {
      await conn.execute('UPDATE course_lessons SET content = ? WHERE id = ?', [newContent2, row.id]);
      fixedCount++;
      
      // Count remaining filled polygons for verification
      const remaining = (newContent2.match(/<polygon[^>]*fill="(?!none)[^"]*"/g) || []).length;
      console.log(`✅ Fixed lesson ${row.id} (${row.title}) — remaining filled: ${remaining}`);
    } else {
      console.log(`⏭️  Lesson ${row.id} (${row.title}) — no changes needed`);
    }
  }
  
  console.log(`\n✅ Total lessons fixed: ${fixedCount}`);
  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
