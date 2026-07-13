
const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function main() {
    const data = JSON.parse(fs.readFileSync('/tmp/lesson_content.json', 'utf8'));
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    await conn.execute('UPDATE course_lessons SET content = ? WHERE id = ?', [data.content, data.id]);
    console.log('Updated lesson ' + data.id + ': ' + data.content.length + ' chars');
    await conn.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
