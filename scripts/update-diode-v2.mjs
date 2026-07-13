import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const content = fs.readFileSync('/home/ubuntu/eas-platform/scripts/diode-lesson-v2.md', 'utf-8');
console.log('Content length:', content.length, 'chars');

const conn = await mysql.createConnection(process.env.DATABASE_URL);
await conn.execute('UPDATE course_lessons SET content = ? WHERE slug = ?', [content, 'diode-fundamentals']);
console.log('Updated diode-fundamentals lesson');
await conn.end();
process.exit(0);
