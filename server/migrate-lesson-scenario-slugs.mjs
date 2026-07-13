/**
 * S-02: Backfill scenarios.slug and course_lessons.linkedScenarioSlug from legacy IDs.
 * Run after drizzle/0024_lesson_scenario_slugs.sql (or db:push).
 *
 *   node server/migrate-lesson-scenario-slugs.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

const [scenarioResult] = await conn.execute(`
  UPDATE scenarios
  SET slug = CONCAT('db-', id)
  WHERE slug IS NULL OR slug = ''
`);
console.log(`scenarios.slug rows updated: ${scenarioResult.affectedRows ?? 0}`);

const [lessonResult] = await conn.execute(`
  UPDATE course_lessons
  SET linkedScenarioSlug = CONCAT('db-', linkedScenarioId)
  WHERE linkedScenarioId IS NOT NULL
    AND (linkedScenarioSlug IS NULL OR linkedScenarioSlug = '')
`);
console.log(`course_lessons.linkedScenarioSlug rows updated: ${lessonResult.affectedRows ?? 0}`);

const [sample] = await conn.execute(`
  SELECT cl.id, cl.title, cl.linkedScenarioId, cl.linkedScenarioSlug, s.slug AS scenario_slug, s.title AS scenario_title
  FROM course_lessons cl
  LEFT JOIN scenarios s ON s.id = cl.linkedScenarioId
  WHERE cl.linkedScenarioId IS NOT NULL
  LIMIT 8
`);
console.log("\nSample linked lessons:");
for (const row of sample) {
  console.log(
    `  lesson ${row.id}: linkedScenarioId=${row.linkedScenarioId} slug=${row.linkedScenarioSlug} → ${row.scenario_title ?? "?"}`
  );
}

await conn.end();
console.log("\nDone.");
