/**
 * Seed HireReady assessment packs.
 * Run after migration 0027: node server/seed-hireready-packs.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const PACKS = [
  {
    slug: "imt-core",
    title: "HireReady IMT-Core",
    role_target: "maintenance",
    scenario_ids: ["motor-overload-trip-v3", "blown-control-fuse", "photoeye-false-trigger"],
    time_limit_min: 45,
    pass_threshold: 75,
    weights: { power: 0.25, motor: 0.25, sensor: 0.15, safety: 0.15, methodology: 0.2 },
  },
  {
    slug: "et-standard",
    title: "HireReady ET-Standard",
    role_target: "electrical",
    scenario_ids: [
      "motor-overload-trip-v3",
      "blown-control-fuse",
      "photoeye-false-trigger",
      "conveyor-estop-v2",
      "intermittent-ground-fault-v3",
    ],
    time_limit_min: 60,
    pass_threshold: 78,
    weights: { power: 0.2, motor: 0.2, safety: 0.15, electrical: 0.15, sensor: 0.1, methodology: 0.2 },
  },
  {
    slug: "ct-plus",
    title: "HireReady CT-Plus",
    role_target: "controls",
    scenario_ids: [
      "motor-overload-trip-v3",
      "blown-control-fuse",
      "photoeye-false-trigger",
      "conveyor-estop-v2",
      "intermittent-ground-fault-v3",
      "plc-io-fault-v3",
      "comm-loss-v3",
      "vfd-conveyor-multifault-v3",
    ],
    time_limit_min: 90,
    pass_threshold: 82,
    weights: { plc: 0.25, vfd: 0.15, network: 0.1, motor: 0.1, safety: 0.1, power: 0.1, methodology: 0.2 },
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);
  for (const pack of PACKS) {
    await conn.execute(
      `INSERT INTO hire_ready_packs
        (slug, title, role_target, scenario_ids, time_limit_min, pass_threshold, weights)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         scenario_ids = VALUES(scenario_ids),
         time_limit_min = VALUES(time_limit_min),
         pass_threshold = VALUES(pass_threshold),
         weights = VALUES(weights)`,
      [
        pack.slug,
        pack.title,
        pack.role_target,
        JSON.stringify(pack.scenario_ids),
        pack.time_limit_min,
        pack.pass_threshold,
        JSON.stringify(pack.weights),
      ],
    );
    console.log(`  OK  ${pack.slug} (${pack.scenario_ids.length} scenarios)`);
  }
  await conn.end();
  console.log(`Seeded ${PACKS.length} HireReady packs.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
