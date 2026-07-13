/**
 * Seed fault_types + fault_competency_units from playable scenario registry.
 * Run after migration 0026: node server/seed-fault-types.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const SCENARIO_DOMAIN = {
  "Safety Circuit": "safety",
  "Control Circuit": "power",
  VFD: "vfd",
  "Motor Control": "motor",
  "Machine Interlock": "integration",
  Sensors: "sensor",
  PLC: "plc",
  Networking: "network",
  "Power Distribution": "power",
};

const FAULT_TYPES = [
  { slug: "conveyor-estop", title: "Conveyor E-Stop Chain Open", category: "Safety Circuit", difficulty: "beginner" },
  { slug: "24vdc-loss", title: "24VDC Control Power Loss", category: "Control Circuit", difficulty: "beginner" },
  { slug: "vfd-ramp", title: "VFD Ramp / Overcurrent", category: "VFD", difficulty: "intermediate" },
  { slug: "starter-chatter", title: "Motor Starter Chatter", category: "Motor Control", difficulty: "intermediate" },
  { slug: "case-packer-jam", title: "Case Packer Jam Interlock", category: "Machine Interlock", difficulty: "intermediate" },
  { slug: "palletizer-safety-gate", title: "Palletizer Safety Gate", category: "Safety Circuit", difficulty: "advanced" },
  { slug: "photoeye-false-trigger", title: "Photoeye False Trigger", category: "Sensors", difficulty: "advanced" },
  { slug: "conveyor-estop-v2", title: "Conveyor E-Stop Chain Open — Packaging Line 4", category: "Safety Circuit", difficulty: "intermediate" },
  { slug: "vfd-conveyor-multifault-v3", title: "VFD Conveyor Multi-Fault", category: "VFD", difficulty: "advanced" },
  { slug: "vfd-overcurrent-ramp-v3", title: "VFD Overcurrent at Ramp", category: "VFD", difficulty: "intermediate" },
  { slug: "vfd-dc-bus-undervoltage-v3", title: "VFD DC Bus Undervoltage", category: "VFD", difficulty: "intermediate" },
  { slug: "vfd-ground-fault-cable-v3", title: "VFD Ground Fault — Damaged Cable", category: "VFD", difficulty: "intermediate" },
  { slug: "vfd-cooling-fan-seized-v3", title: "VFD Cooling Fan Seized", category: "VFD", difficulty: "intermediate" },
  { slug: "vfd-input-phase-loss-v3", title: "VFD Input Phase Loss", category: "VFD", difficulty: "intermediate" },
  { slug: "blown-control-fuse", title: "Blown Control Fuse — MCC", category: "Power Distribution", difficulty: "intermediate" },
  { slug: "failed-safety-relay", title: "Failed Safety Relay", category: "Safety Circuit", difficulty: "advanced" },
  { slug: "plc-io-fault-v3", title: "PLC I/O Signal Wire Fault", category: "PLC", difficulty: "advanced" },
  { slug: "motor-overload-trip-v3", title: "Motor Overload Trip", category: "Motor Control", difficulty: "intermediate" },
  { slug: "comm-loss-v3", title: "EtherNet/IP Communication Loss", category: "Networking", difficulty: "advanced" },
  { slug: "intermittent-ground-fault-v3", title: "Intermittent Ground Fault", category: "Power Distribution", difficulty: "advanced" },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);
  let types = 0;
  let fcus = 0;

  for (const row of FAULT_TYPES) {
    const domain = SCENARIO_DOMAIN[row.category] ?? "integration";
    await conn.execute(
      `INSERT INTO fault_types (slug, title, domain, difficulty, scenario_slug, is_published)
       VALUES (?, ?, ?, ?, ?, true)
       ON DUPLICATE KEY UPDATE title = VALUES(title), domain = VALUES(domain),
         scenario_slug = VALUES(scenario_slug)`,
      [row.slug, row.title, domain, row.difficulty, row.slug],
    );
    types++;

    const [ftRows] = await conn.execute(`SELECT id FROM fault_types WHERE slug = ?`, [row.slug]);
    const faultTypeId = ftRows[0]?.id;
    if (!faultTypeId) continue;

    for (const [idx, mode] of [["guided", 0], ["unguided", 1]]) {
      const threshold = mode === "unguided" ? 75 : 60;
      await conn.execute(
        `INSERT INTO fault_competency_units (fault_type_id, mode, pass_threshold, sort_order)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE pass_threshold = VALUES(pass_threshold)`,
        [faultTypeId, mode, threshold, idx],
      );
      fcus++;
    }
  }

  console.log(`Seeded ${types} fault types, ${fcus} FCU rows.`);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
