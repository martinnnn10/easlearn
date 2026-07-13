/**
 * Fix Standard Electrical Symbols formatting in Print Reading lesson 90010.
 * Restores IEC 60617 markdown table layout with audited inline SVGs.
 *
 * Run: node server/patch-print-reading-symbols.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import {
  ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION,
  SYMBOLS_SECTION_END_MARKER,
} from "./content/electrical-schematic-symbols.mjs";

function replaceSymbolsSection(content) {
  const startIdx = content.indexOf("## Standard Electrical Symbols");
  if (startIdx === -1) {
    return null;
  }
  const endIdx = content.indexOf(SYMBOLS_SECTION_END_MARKER, startIdx);
  if (endIdx === -1) {
    return null;
  }
  return (
    content.slice(0, startIdx) +
    ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION +
    "\n\n" +
    content.slice(endIdx)
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute(
    `SELECT id, content FROM course_lessons WHERE slug = 'electrical-schematic-basics' LIMIT 1`
  );
  if (!rows.length) {
    console.log("No lesson found — skip");
    await conn.end();
    return;
  }

  const updated = replaceSymbolsSection(rows[0].content);
  if (!updated) {
    console.error("Could not locate symbols section boundaries");
    process.exit(1);
  }
  if (updated === rows[0].content) {
    console.log("Content unchanged — already patched?");
    await conn.end();
    return;
  }

  await conn.execute(
    `UPDATE course_lessons SET content = ?, updatedAt = NOW() WHERE id = ?`,
    [updated, rows[0].id]
  );
  console.log(`Patched symbols section for lesson id ${rows[0].id}`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
