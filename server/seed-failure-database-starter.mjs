/**
 * Seed starter Industrial Failure Database entries (v1).
 * Run after 0028: node server/seed-failure-database-starter.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const INDUSTRIES = [
  { slug: "packaging", title: "Packaging" },
  { slug: "food", title: "Food Manufacturing" },
  { slug: "motors-general", title: "General Manufacturing" },
];

const MODES = [
  {
    slug: "conveyor-estop-chain-open",
    industry: "packaging",
    title: "Conveyor Will Not Start — E-Stop Chain Open",
    symptoms: ["Conveyor dead after shift change", "Operator says E-stop was reset"],
    causes: [{ cause: "E-stop chain open", frequency: "high", first_check: "Walk the E-stop chain" }],
    procedure: ["Establish safe state", "Read HMI fault", "Trace E-stop chain on print", "Measure continuity"],
    scenario: "conveyor-estop-v2",
    cost: "high",
  },
  {
    slug: "motor-overload-trip-line",
    industry: "motors-general",
    title: "Motor Trips on Overload — Production Line",
    symptoms: ["Motor runs then trips", "Overload heater tripped"],
    causes: [{ cause: "Mechanical binding", frequency: "high", first_check: "Verify load turns freely" }],
    procedure: ["Check overload state", "Measure current", "Inspect mechanical load"],
    scenario: "motor-overload-trip-v3",
    cost: "high",
  },
  {
    slug: "plc-io-signal-wire",
    industry: "food",
    title: "PLC Input Won't Transition — Field Wiring",
    symptoms: ["Sensor works locally", "PLC input never changes state"],
    causes: [{ cause: "Open signal wire", frequency: "high", first_check: "Voltage at PLC input terminal" }],
    procedure: ["Compare field device to PLC I/O LED", "Trace wiring", "Continuity test"],
    scenario: "plc-io-fault-v3",
    cost: "medium",
  },
  {
    slug: "vfd-comm-loss-filler",
    industry: "packaging",
    title: "VFD Comm Loss — Filler Integration",
    symptoms: ["Intermittent comm fault", "Ping works sometimes"],
    causes: [{ cause: "Bad patch cord", frequency: "medium", first_check: "Link lights on switch port" }],
    procedure: ["Ping device", "Check switch port stats", "Verify IP and path"],
    scenario: "comm-loss-v3",
    cost: "critical",
  },
  {
    slug: "blown-control-fuse-mcc",
    industry: "motors-general",
    title: "No Control Power — Blown Fuse in MCC",
    symptoms: ["Nothing energizes", "24VDC dead"],
    causes: [{ cause: "Blown control fuse", frequency: "high", first_check: "Control voltage at MCC" }],
    procedure: ["Check control transformer", "Test fuses", "Find short before replacing"],
    scenario: "blown-control-fuse",
    cost: "high",
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);

  for (const ind of INDUSTRIES) {
    await conn.execute(
      `INSERT INTO failure_industries (slug, title) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title)`,
      [ind.slug, ind.title],
    );
  }

  for (const mode of MODES) {
    const [indRows] = await conn.execute(
      `SELECT id FROM failure_industries WHERE slug = ?`,
      [mode.industry],
    );
    const industryId = indRows[0]?.id;
    if (!industryId) continue;

    let faultTypeId = null;
    const [ft] = await conn.execute(
      `SELECT id FROM fault_types WHERE scenario_slug = ? LIMIT 1`,
      [mode.scenario],
    );
    if (ft.length) faultTypeId = ft[0].id;

    await conn.execute(
      `INSERT INTO failure_modes
        (slug, industry_id, title, symptoms, likely_causes, diagnostic_procedure, downtime_cost_band, fault_type_id, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)
       ON DUPLICATE KEY UPDATE title = VALUES(title), is_published = true`,
      [
        mode.slug,
        industryId,
        mode.title,
        JSON.stringify(mode.symptoms),
        JSON.stringify(mode.causes),
        JSON.stringify(mode.procedure),
        mode.cost,
        faultTypeId,
      ],
    );

    const [fm] = await conn.execute(`SELECT id FROM failure_modes WHERE slug = ?`, [mode.slug]);
    if (fm[0]) {
      await conn.execute(
        `INSERT INTO failure_mode_links (failure_mode_id, link_type, link_id)
         VALUES (?, 'simulator', ?)
         ON DUPLICATE KEY UPDATE link_id = VALUES(link_id)`,
        [fm[0].id, mode.scenario],
      );
    }
    console.log(`  OK  ${mode.slug}`);
  }

  console.log(`Seeded ${MODES.length} failure modes.`);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
