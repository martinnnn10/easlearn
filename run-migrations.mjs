import 'dotenv/config';
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const conn = await createConnection(process.env.DATABASE_URL);

const files = ['drizzle/0027_hireready.sql', 'drizzle/0028_failure_database.sql'];

for (const file of files) {
  console.log(`\n=== Running ${file} ===`);
  const sql = readFileSync(file, 'utf8');
  const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of stmts) {
    try {
      await conn.execute(stmt);
      console.log('OK:', stmt.substring(0, 70));
    } catch(e) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.code === 'ER_DUP_FIELDNAME') {
        console.log('SKIP (already exists):', stmt.substring(0, 70));
      } else {
        console.error('ERROR:', e.message, '→', stmt.substring(0, 80));
        process.exit(1);
      }
    }
  }
  console.log(`✓ ${file} complete`);
}

await conn.end();
console.log('\nAll migrations complete');
process.exit(0);
