import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE slug = ?', ['diode-fundamentals']);
fs.writeFileSync('/tmp/diode-lesson-current.md', rows[0].content);
console.log('Written', rows[0].content.length, 'chars');
await conn.end();
