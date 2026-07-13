/**
 * Troubleshooting spine — slug-based lesson → scenario links (portable across environments).
 * Merges with legacy S-03 lesson ID links.
 *
 * Run: node server/seed-troubleshooting-spine-links.mjs
 * Dry run: node server/seed-troubleshooting-spine-links.mjs --dry-run
 */
try {
  await import("dotenv/config");
} catch {
  /* optional */
}

const DB_SCENARIO_ID_TO_SIMULATOR_ID = {
  1: "vfd-ramp",
  2: "plc-io-fault-v3",
  3: "vfd-conveyor-multifault-v3",
  4: "failed-safety-relay",
  5: "vfd-overcurrent-ramp-v3",
  6: "vfd-dc-bus-undervoltage-v3",
  7: "vfd-ramp",
  8: "vfd-cooling-fan-seized-v3",
  9: "comm-loss-v3",
  11: "vfd-overcurrent-ramp-v3",
  12: "blown-control-fuse",
  30002: "motor-overload-trip-v3",
  30005: "plc-io-fault-v3",
  30008: "comm-loss-v3",
};

const SIMULATOR_SCENARIO_IDS = new Set([
  "vfd-conveyor-multifault-v3", "vfd-overcurrent-ramp-v3", "vfd-dc-bus-undervoltage-v3",
  "vfd-ground-fault-cable-v3", "vfd-cooling-fan-seized-v3", "vfd-input-phase-loss-v3",
  "blown-control-fuse", "failed-safety-relay", "plc-io-fault-v3", "motor-overload-trip-v3",
  "comm-loss-v3", "intermittent-ground-fault-v3", "conveyor-estop-v2", "conveyor-estop",
  "24vdc-loss", "vfd-ramp", "starter-chatter", "case-packer-jam", "palletizer-safety-gate",
  "photoeye-false-trigger",
]);

/** @type {Array<{ moduleSlug: string, lessonSlug: string, engineSlug: string, note: string }>} */
const SPINE_SLUG_LINKS = [
  // PowerFlex VFD
  { moduleSlug: "powerflex-vfd", lessonSlug: "fault-codes-diagnostics", engineSlug: "vfd-dc-bus-undervoltage-v3", note: "Fault codes ↔ undervoltage" },
  { moduleSlug: "powerflex-vfd", lessonSlug: "common-failures", engineSlug: "vfd-overcurrent-ramp-v3", note: "Common failures ↔ overcurrent" },
  { moduleSlug: "powerflex-vfd", lessonSlug: "advanced-features", engineSlug: "comm-loss-v3", note: "Comm features ↔ comm loss" },
  { moduleSlug: "powerflex-vfd", lessonSlug: "vfd-fundamentals", engineSlug: "vfd-ramp", note: "VFD intro ↔ ramp fault" },
  { moduleSlug: "powerflex-vfd", lessonSlug: "basic-programming", engineSlug: "vfd-input-phase-loss-v3", note: "Motor data ↔ phase loss" },
  // PLC
  { moduleSlug: "plc-fundamentals", lessonSlug: "io-troubleshooting", engineSlug: "plc-io-fault-v3", note: "I/O troubleshooting" },
  { moduleSlug: "plc-fundamentals", lessonSlug: "communication-faults", engineSlug: "comm-loss-v3", note: "Comm faults" },
  { moduleSlug: "plc-fundamentals", lessonSlug: "ladder-logic-basics", engineSlug: "plc-io-fault-v3", note: "I/O logic fault" },
  // Motors
  { moduleSlug: "motors-controls", lessonSlug: "starter-troubleshooting", engineSlug: "starter-chatter", note: "Starter chatter" },
  { moduleSlug: "motors-controls", lessonSlug: "overload-protection", engineSlug: "motor-overload-trip-v3", note: "Overload trip" },
  { moduleSlug: "motors-controls", lessonSlug: "motor-testing", engineSlug: "intermittent-ground-fault-v3", note: "Megger ↔ ground fault" },
  { moduleSlug: "motors-controls", lessonSlug: "motor-control-circuits", engineSlug: "blown-control-fuse", note: "Control circuit fuse" },
  // Safety (seed-new-tracks slugs when module is safety-systems)
  { moduleSlug: "safety-systems", lessonSlug: "machine-safety-fundamentals", engineSlug: "conveyor-estop-v2", note: "E-stop chain" },
  { moduleSlug: "safety-systems", lessonSlug: "safety-devices-wiring", engineSlug: "failed-safety-relay", note: "Safety relay" },
  { moduleSlug: "safety-systems", lessonSlug: "safety-plc-programming", engineSlug: "failed-safety-relay", note: "Safety PLC" },
  // Electrical / power
  { moduleSlug: "electrical-fundamentals", lessonSlug: "electrical-schematic-basics", engineSlug: "24vdc-loss", note: "Control power" },
  { moduleSlug: "power-distribution", lessonSlug: "overcurrent-protection", engineSlug: "motor-overload-trip-v3", note: "Overload" },
  { moduleSlug: "power-distribution", lessonSlug: "grounding-bonding", engineSlug: "intermittent-ground-fault-v3", note: "Ground fault" },
  { moduleSlug: "power-distribution", lessonSlug: "industrial-power-systems", engineSlug: "blown-control-fuse", note: "Blown fuse" },
  // Networking
  { moduleSlug: "industrial-networking", lessonSlug: "ethernet-ip-fundamentals", engineSlug: "comm-loss-v3", note: "EtherNet/IP loss" },
  { moduleSlug: "industrial-networking", lessonSlug: "managed-switches-vlans", engineSlug: "comm-loss-v3", note: "Network comm" },
  { moduleSlug: "rslinx-communication-setup", lessonSlug: "plc-network-communications", engineSlug: "comm-loss-v3", note: "PLC comm path" },
  // Sensors
  { moduleSlug: "photoelectric-sensors", lessonSlug: "proximity-sensors-photoeyes", engineSlug: "photoeye-false-trigger", note: "Photoeye false trip" },
  { moduleSlug: "sensor-fundamentals", lessonSlug: "proximity-sensors-photoeyes", engineSlug: "photoeye-false-trigger", note: "Sensor false trigger" },
  // Troubleshooting modules
  { moduleSlug: "industrial-troubleshooting", lessonSlug: "vfd-troubleshooting-methodology", engineSlug: "vfd-dc-bus-undervoltage-v3", note: "VFD methodology" },
  { moduleSlug: "industrial-troubleshooting", lessonSlug: "plc-fault-diagnosis", engineSlug: "plc-io-fault-v3", note: "PLC diagnosis" },
  { moduleSlug: "industrial-troubleshooting", lessonSlug: "intermittent-fault-diagnosis", engineSlug: "intermittent-ground-fault-v3", note: "Intermittent faults" },
  { moduleSlug: "real-world-fault-scenarios", lessonSlug: "case-packer-line-stop", engineSlug: "case-packer-jam", note: "Case packer jam" },
  { moduleSlug: "real-world-fault-scenarios", lessonSlug: "palletizer-zone-fault", engineSlug: "palletizer-safety-gate", note: "Palletizer safety" },
  { moduleSlug: "real-world-fault-scenarios", lessonSlug: "multifault-integration", engineSlug: "vfd-conveyor-multifault-v3", note: "Multi-fault capstone" },
  { moduleSlug: "real-troubleshooting-workflow", lessonSlug: "divide-and-conquer", engineSlug: "blown-control-fuse", note: "Methodology practice" },
  { moduleSlug: "drives-servo-communication", lessonSlug: "drive-permissive-faults", engineSlug: "vfd-ground-fault-cable-v3", note: "Drive ground fault" },
  { moduleSlug: "preventative-maintenance", lessonSlug: "thermography", engineSlug: "vfd-cooling-fan-seized-v3", note: "Thermal ↔ fan seized" },
  { moduleSlug: "calibration-troubleshooting", lessonSlug: "analog-signals-4-20ma", engineSlug: "plc-io-fault-v3", note: "Analog I/O fault" },
  { moduleSlug: "plc-connection-fundamentals", lessonSlug: "going-online-when-failed", engineSlug: "comm-loss-v3", note: "Can't go online" },
];

let mysql;
async function getMysql() {
  if (!mysql) mysql = (await import("mysql2/promise")).default;
  return mysql;
}

function buildLinkFromEngine(engineSlug) {
  if (!SIMULATOR_SCENARIO_IDS.has(engineSlug)) {
    throw new Error(`No playable simulator: ${engineSlug}`);
  }
  return { linkedScenarioId: null, linkedScenarioSlug: engineSlug };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const mysql2 = await getMysql();
  const conn = await mysql2.createConnection(process.env.DATABASE_URL);

  let applied = 0;
  let skipped = 0;
  const missing = [];

  for (const link of SPINE_SLUG_LINKS) {
    const { linkedScenarioId, linkedScenarioSlug } = buildLinkFromEngine(link.engineSlug);

    const [rows] = await conn.execute(
      `SELECT cl.id, cl.title FROM course_lessons cl
       INNER JOIN course_modules cm ON cm.id = cl.moduleId
       WHERE cm.slug = ? AND cl.slug = ? AND cl.isPublished = 1
       LIMIT 1`,
      [link.moduleSlug, link.lessonSlug],
    );

    if (rows.length === 0) {
      missing.push(`${link.moduleSlug}/${link.lessonSlug}`);
      skipped++;
      continue;
    }

    const lesson = rows[0];
    if (!dryRun) {
      await conn.execute(
        `UPDATE course_lessons SET linkedScenarioId = ?, linkedScenarioSlug = ? WHERE id = ?`,
        [linkedScenarioId, linkedScenarioSlug, lesson.id],
      );
    }
    applied++;
    console.log(`  OK  [${link.moduleSlug}] ${lesson.title} → ${link.engineSlug}`);
  }

  console.log(`\nSpine slug links: ${applied} applied, ${skipped} skipped (lesson not found)`);
  if (missing.length) {
    console.log("Missing lessons (slug may differ in prod — safe to ignore):");
    for (const m of missing) console.log(`  - ${m}`);
  }

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
