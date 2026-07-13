/**
 * Deprecate legacy markdown for all card-format ILU lessons (31 slugs).
 * Run migration SQL first: mysql $DATABASE_URL < drizzle/0029_card_lesson_content_format.sql
 * Then: pnpm run db:migrate-card-content
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { LESSON_PRACTICE_MAP } from "../shared/lessonPracticeMap.ts";
import { isCardFormatLesson } from "../shared/lessonCardContent.ts";
import { CARD_LESSON_CONTENT_STUB } from "../shared/cardLessonContentStub.ts";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const targets = [];
for (const path of LESSON_PRACTICE_MAP) {
  for (const unit of path.units) {
    if (isCardFormatLesson(path.pathSlug, unit.lessonSlug)) {
      targets.push({ moduleSlug: path.pathSlug, lessonSlug: unit.lessonSlug });
    }
  }
}

console.log(`Migrating ${targets.length} card-format lessons to contentFormat=cards...\n`);

const connection = await mysql.createConnection(DATABASE_URL);
let updated = 0;
let missing = 0;

for (const { moduleSlug, lessonSlug } of targets) {
  const [mods] = await connection.execute("SELECT id FROM course_modules WHERE slug = ?", [moduleSlug]);
  if (mods.length === 0) {
    console.warn(`  SKIP module not found: ${moduleSlug}`);
    missing++;
    continue;
  }
  const moduleId = mods[0].id;
  const [result] = await connection.execute(
    `UPDATE course_lessons
     SET content = ?, contentFormat = 'cards'
     WHERE moduleId = ? AND slug = ?`,
    [CARD_LESSON_CONTENT_STUB, moduleId, lessonSlug]
  );
  if (result.affectedRows > 0) {
    console.log(`  ✓ ${moduleSlug}/${lessonSlug}`);
    updated++;
  } else {
    console.warn(`  SKIP lesson not found: ${moduleSlug}/${lessonSlug}`);
    missing++;
  }
}

const [verify] = await connection.execute(
  `SELECT COUNT(*) AS n FROM course_lessons WHERE contentFormat = 'cards'`
);
await connection.end();

console.log(`\nDone. Updated ${updated}/${targets.length}. DB card rows: ${verify[0].n}. Missing: ${missing}.`);
process.exit(missing > 0 ? 1 : 0);
