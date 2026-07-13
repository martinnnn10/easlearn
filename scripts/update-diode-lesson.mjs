import { readFileSync } from 'fs';
import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

config();

const content = readFileSync(new URL('./diode-lesson-content.md', import.meta.url), 'utf-8');

async function main() {
  const connection = await createConnection(process.env.DATABASE_URL);
  
  console.log(`Content length: ${content.length} characters`);
  
  await connection.execute(
    'UPDATE course_lessons SET content = ? WHERE id = 60013',
    [content]
  );
  
  console.log('Successfully updated diode lesson (id=60013) with new SVG-based content');
  
  // Verify
  const [rows] = await connection.execute(
    'SELECT LENGTH(content) as len FROM course_lessons WHERE id = 60013'
  );
  console.log(`Verified content length in DB: ${rows[0].len} characters`);
  
  await connection.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
