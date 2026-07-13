/**
 * Wire lesson_fcu_links from lessons that have playable scenario links.
 * Run after seed-fault-types: node server/seed-lesson-fcu-links.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const SIMULATOR_IDS = new Set([
  "vfd-conveyor-multifault-v3", "vfd-overcurrent-ramp-v3", "vfd-dc-bus-undervoltage-v3",
  "vfd-ground-fault-cable-v3", "vfd-cooling-fan-seized-v3", "vfd-input-phase-loss-v3",
  "blown-control-fuse", "failed-safety-relay", "plc-io-fault-v3", "motor-overload-trip-v3",
  "comm-loss-v3", "intermittent-ground-fault-v3", "conveyor-estop-v2", "conveyor-estop",
  "24vdc-loss", "vfd-ramp", "starter-chatter", "case-packer-jam", "palletizer-safety-gate",
  "photoeye-false-trigger",
]);

const DB_MAP = {
  1: "vfd-ramp", 2: "plc-io-fault-v3", 4: "failed-safety-relay", 5: "vfd-overcurrent-ramp-v3",
  6: "vfd-dc-bus-undervoltage-v3", 8: "vfd-cooling-fan-seized-v3", 9: "comm-loss-v3",
  11: "vfd-overcurrent-ramp-v3", 12: "blown-control-fuse", 30002: "motor-overload-trip-v3",
};

function resolveSlug(slug, legacyId) {
  if (slug && SIMULATOR_IDS.has(slug)) return slug;
  const dbMatch = /^db-(\d+)$/.exec(String(slug || "").trim());
  const dbId = dbMatch ? Number(dbMatch[1]) : legacyId;
  if (dbId != null && DB_MAP[dbId]) return DB_MAP[dbId];
  return null;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);

  const [lessons] = await conn.execute(`
    SELECT id, linkedScenarioSlug, linkedScenarioId
    FROM course_lessons
    WHERE linkedScenarioSlug IS NOT NULL OR linkedScenarioId IS NOT NULL
  `);

  let linked = 0;
  for (const lesson of lessons) {
    const engineSlug = resolveSlug(lesson.linkedScenarioSlug, lesson.linkedScenarioId);
    if (!engineSlug) continue;

    const [ft] = await conn.execute(
      `SELECT id FROM fault_types WHERE scenario_slug = ? LIMIT 1`,
      [engineSlug],
    );
    if (!ft.length) continue;

    const [fcu] = await conn.execute(
      `SELECT id FROM fault_competency_units WHERE fault_type_id = ? AND mode = 'unguided' LIMIT 1`,
      [ft[0].id],
    );
    if (!fcu.length) continue;

    await conn.execute(
      `INSERT INTO lesson_fcu_links (lesson_id, fcu_id, required)
       VALUES (?, ?, true)
       ON DUPLICATE KEY UPDATE required = true`,
      [lesson.id, fcu[0].id],
    );
    linked++;
  }

  console.log(`Linked ${linked} lessons to unguided FCUs.`);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
