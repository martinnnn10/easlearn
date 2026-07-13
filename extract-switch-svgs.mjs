import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 90010');
const content = rows[0].content;
const lines = content.split('\n');

// Extract lines 19, 20, 21 which contain limit, pressure, temperature switches
const output = [];
for (let i = 18; i <= 22; i++) {
  output.push(`\n=== LINE ${i} ===\n`);
  output.push(lines[i]);
}

fs.writeFileSync('/home/ubuntu/lesson90010-switch-svgs.txt', output.join('\n'));
console.log('Written to /home/ubuntu/lesson90010-switch-svgs.txt');
await conn.end();
process.exit(0);
