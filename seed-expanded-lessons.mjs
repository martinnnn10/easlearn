import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);

  // PLC module ID = 2, VFD module ID = 1
  const plcModuleId = 2;
  const vfdModuleId = 1;

  // Read PLC lessons JSON
  const plcData = JSON.parse(fs.readFileSync('/home/ubuntu/generate_plc_lessons.json', 'utf8'));
  const plcLessons = plcData.results.map((r, i) => ({
    moduleId: plcModuleId,
    slug: r.output.slug,
    title: r.output.title,
    orderIndex: i + 7, // starts at 7 (existing are 1-6)
    content: fs.readFileSync(r.output.content, 'utf8'),
    estimatedMinutes: r.output.estimated_minutes || 15,
    isPublished: true,
  }));

  // Read VFD lessons JSON
  const vfdData = JSON.parse(fs.readFileSync('/home/ubuntu/generate_vfd_lessons.json', 'utf8'));
  const vfdLessons = vfdData.results.map((r, i) => ({
    moduleId: vfdModuleId,
    slug: r.output.slug,
    title: r.output.title,
    orderIndex: i + 7, // starts at 7 (existing are 1-6)
    content: fs.readFileSync(r.output.content, 'utf8'),
    estimatedMinutes: r.output.estimated_minutes || 15,
    isPublished: true,
  }));

  const allLessons = [...plcLessons, ...vfdLessons];

  console.log(`Inserting ${plcLessons.length} PLC lessons and ${vfdLessons.length} VFD lessons...`);

  for (const lesson of allLessons) {
    await connection.execute(
      `INSERT INTO course_lessons (moduleId, slug, title, orderIndex, content, estimatedMinutes, isPublished)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [lesson.moduleId, lesson.slug, lesson.title, lesson.orderIndex, lesson.content, lesson.estimatedMinutes, lesson.isPublished]
    );
    console.log(`  ✓ Inserted: ${lesson.title}`);
  }

  // Update module lesson counts
  await connection.execute(
    `UPDATE course_modules SET totalLessons = (SELECT COUNT(*) FROM course_lessons WHERE moduleId = ?) WHERE id = ?`,
    [plcModuleId, plcModuleId]
  );
  await connection.execute(
    `UPDATE course_modules SET totalLessons = (SELECT COUNT(*) FROM course_lessons WHERE moduleId = ?) WHERE id = ?`,
    [vfdModuleId, vfdModuleId]
  );

  console.log('\n✓ All lessons inserted. Updated module lesson counts.');
  await connection.end();
}

main().catch(e => { console.error(e); process.exit(1); });
