/**
 * Wave 1 Step 3 (S-03 partial): High-confidence lesson → simulator links
 * for priority modules only.
 *
 * Run: node server/seed-partial-s03-links.mjs
 * Dry run: node server/seed-partial-s03-links.mjs --dry-run
 * Validate mappings only (no DB): node server/seed-partial-s03-links.mjs --validate-only
 */
try {
  await import("dotenv/config");
} catch {
  /* optional when node_modules not installed */
}

// Keep in sync with shared/scenarioLinking.ts
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

const SCENARIO_URL_ALIASES = {
  "blown-fuse": "blown-control-fuse",
  "failed-relay": "failed-safety-relay",
  "vfd-overcurrent": "vfd-overcurrent-ramp-v3",
  "vfd-undervoltage": "vfd-dc-bus-undervoltage-v3",
  "plc-io-fault": "plc-io-fault-v3",
  "motor-overload": "motor-overload-trip-v3",
  "comm-loss": "comm-loss-v3",
  "intermittent-ground": "intermittent-ground-fault-v3",
  "conveyor-estop-v2": "conveyor-estop-v2",
};

const SIMULATOR_SCENARIO_IDS = new Set([
  "vfd-conveyor-multifault-v3",
  "vfd-overcurrent-ramp-v3",
  "vfd-dc-bus-undervoltage-v3",
  "vfd-cooling-fan-seized-v3",
  "blown-control-fuse",
  "failed-safety-relay",
  "plc-io-fault-v3",
  "motor-overload-trip-v3",
  "comm-loss-v3",
  "intermittent-ground-fault-v3",
  "conveyor-estop-v2",
  "vfd-ramp",
  "starter-chatter",
]);

function dbScenarioSlug(id) {
  return `db-${id}`;
}

function parseDbScenarioSlug(slug) {
  const match = /^db-(\d+)$/.exec(String(slug).trim());
  return match ? Number.parseInt(match[1], 10) : null;
}

function resolveSimulatorScenarioId(slugOrLegacyId, legacyNumericId) {
  const candidates = [];
  if (slugOrLegacyId?.trim()) candidates.push(slugOrLegacyId.trim());
  if (legacyNumericId != null && Number.isFinite(legacyNumericId)) {
    candidates.push(dbScenarioSlug(legacyNumericId));
  }
  for (const raw of candidates) {
    if (SIMULATOR_SCENARIO_IDS.has(raw)) return raw;
    const alias = SCENARIO_URL_ALIASES[raw];
    if (alias && SIMULATOR_SCENARIO_IDS.has(alias)) return alias;
    const dbId = parseDbScenarioSlug(raw);
    if (dbId != null) {
      const mapped = DB_SCENARIO_ID_TO_SIMULATOR_ID[dbId];
      if (mapped && SIMULATOR_SCENARIO_IDS.has(mapped)) return mapped;
    }
  }
  return null;
}

let mysql;
async function getMysql() {
  if (!mysql) {
    mysql = (await import("mysql2/promise")).default;
  }
  return mysql;
}

const PRIORITY_MODULE_SLUGS = [
  "powerflex-vfd",
  "plc-fundamentals",
  "motors-controls",
  "safety-systems",
  "industrial-troubleshooting",
];

/** @type {Array<{ lessonId: number, dbScenarioId?: number|null, engineSlug?: string|null, confidence: number, note: string }>} */
const S03_LINKS = [
  // ── PowerFlex VFD (module 1) ─────────────────────────────────────────────
  {
    lessonId: 4,
    dbScenarioId: 6,
    confidence: 95,
    note: "Fault code diagnostics ↔ DB F004 Erratic Speed → vfd-dc-bus-undervoltage-v3",
  },
  {
    lessonId: 6,
    dbScenarioId: 6,
    confidence: 98,
    note: "Advanced comm/PID lesson ↔ same F004 undervoltage diagnostic scenario",
  },
  {
    lessonId: 30020,
    dbScenarioId: 11,
    confidence: 98,
    note: "Motor nameplate/auto-tune ↔ high current at low speed → vfd-overcurrent-ramp-v3",
  },
  {
    lessonId: 30027,
    dbScenarioId: 8,
    confidence: 93,
    note: "Thermal/fan maintenance ↔ F007 motor OT / cooling fan seized scenario",
  },
  {
    lessonId: 30025,
    dbScenarioId: 9,
    confidence: 95,
    note: "EtherNet/IP setup ↔ intermittent EtherNet/IP comm loss",
  },

  // ── PLC Fundamentals (module 2) ────────────────────────────────────────────
  {
    lessonId: 9,
    dbScenarioId: 2,
    confidence: 98,
    note: "I/O wiring troubleshooting ↔ PLC I/O broken signal wire (db-2)",
  },
  {
    lessonId: 11,
    dbScenarioId: 9,
    confidence: 95,
    note: "Communication faults ↔ EtherNet/IP comm drops",
  },
  {
    lessonId: 30009,
    dbScenarioId: 9,
    confidence: 95,
    note: "EtherNet/IP produced/consumed tags ↔ comm drops troubleshooting",
  },
  {
    lessonId: 30013,
    dbScenarioId: 4,
    confidence: 98,
    note: "GuardLogix safety PLCs ↔ dual-channel safety relay discrepancy",
  },

  // ── Motors & Motor Controls (module 4) ───────────────────────────────────
  {
    lessonId: 21,
    engineSlug: "starter-chatter",
    dbScenarioId: null,
    confidence: 97,
    note: "Motor starter troubleshooting ↔ contactor chatter condition",
  },
  {
    lessonId: 22,
    dbScenarioId: 30002,
    confidence: 95,
    note: "Overload protection sizing ↔ motor overload trip scenario",
  },
  {
    lessonId: 24,
    engineSlug: "intermittent-ground-fault-v3",
    dbScenarioId: null,
    confidence: 93,
    note: "Megger/insulation testing ↔ intermittent ground fault diagnosis",
  },

  // ── Safety Systems (module 60005) ────────────────────────────────────────
  {
    lessonId: 90014,
    engineSlug: "conveyor-estop-v2",
    dbScenarioId: null,
    confidence: 94,
    note: "E-stops & interlocks ↔ conveyor E-stop chain safety circuit",
  },
  {
    lessonId: 90015,
    dbScenarioId: 4,
    confidence: 95,
    note: "Safety PLC basics ↔ GuardLogix / failed safety relay",
  },
  {
    lessonId: 120021,
    dbScenarioId: 4,
    confidence: 98,
    note: "Safety relay wiring ↔ welded safety relay diagnosis",
  },
  {
    lessonId: 120022,
    dbScenarioId: 4,
    confidence: 95,
    note: "Safety PLC programming ↔ GuardLogix dual-channel discrepancy",
  },
  {
    lessonId: 120024,
    engineSlug: "conveyor-estop-v2",
    dbScenarioId: null,
    confidence: 96,
    note: "E-stop circuit design/testing ↔ E-stop chain scenario",
  },

  // ── Industrial Troubleshooting Academy (module 30005) ──────────────────────
  {
    lessonId: 150004,
    dbScenarioId: 6,
    confidence: 96,
    note: "VFD troubleshooting methodology ↔ F004/undervoltage VFD scenario",
  },
  {
    lessonId: 150005,
    dbScenarioId: 2,
    confidence: 94,
    note: "PLC fault diagnosis ↔ PLC I/O signal wire fault (db-2)",
  },
  {
    lessonId: 150007,
    engineSlug: "intermittent-ground-fault-v3",
    dbScenarioId: null,
    confidence: 95,
    note: "Intermittent fault diagnosis ↔ intermittent ground fault",
  },
];

/** Lessons in priority modules to clear (wrong topic or no playable simulator). */
const S03_CLEAR_LESSON_IDS = [
  // VFD: weak or off-topic existing links
  5, // F005 overvoltage mapped to overcurrent engine
  30023, // PID lesson tied to F004
  30024, // braking tied to F005
  30026, // drive sync loss stretch
  30029, // predictive → F063 auto-restart stretch
  30030, // capstone → inhibit stretch
  30019, // hardware install → inhibit stretch
  // PLC: wrong scenario rows
  30004, // sequencer → PLC timer stuck (wrong)
  30008, // motion control wrongly tied to GuardLogix scenario
  12, // phantom power fault ≠ online forcing/I/O workflow
  30007, // major fault ↔ phantom power (borderline)
  30010, // DeviceNet ↔ phantom power
  30011, // remote access ↔ comm (borderline) — clear to avoid stretch
  30018, // capstone ↔ phantom power
  // Motors: alignment scenario not playable in simulator
  19,
  20,
  22, // will be re-set below — remove from clear
  23,
];

// Lesson 22 is in LINKS — do not clear
const CLEAR_IDS = S03_CLEAR_LESSON_IDS.filter((id) => id !== 22);

function buildLinkRow(entry) {
  const engineFromDb =
    entry.dbScenarioId != null ? DB_SCENARIO_ID_TO_SIMULATOR_ID[entry.dbScenarioId] : null;
  const engineSlug = entry.engineSlug ?? engineFromDb ?? null;

  if (!engineSlug || !SIMULATOR_SCENARIO_IDS.has(engineSlug)) {
    throw new Error(
      `Lesson ${entry.lessonId}: no playable simulator for db=${entry.dbScenarioId} slug=${entry.engineSlug}`
    );
  }

  const resolved = resolveSimulatorScenarioId(
    entry.dbScenarioId != null ? dbScenarioSlug(entry.dbScenarioId) : engineSlug,
    entry.dbScenarioId ?? null
  );
  if (resolved !== engineSlug) {
    throw new Error(
      `Lesson ${entry.lessonId}: resolver got ${resolved} expected ${engineSlug}`
    );
  }

  const linkedScenarioId = entry.dbScenarioId ?? null;
  const linkedScenarioSlug = entry.dbScenarioId != null ? dbScenarioSlug(entry.dbScenarioId) : engineSlug;

  return { linkedScenarioId, linkedScenarioSlug, engineSlug };
}

async function checkAllLessonLinks(conn) {
  const [rows] = await conn.execute(
    `SELECT id, title, linkedScenarioId, linkedScenarioSlug FROM course_lessons
     WHERE linkedScenarioId IS NOT NULL OR (linkedScenarioSlug IS NOT NULL AND linkedScenarioSlug != '')`
  );
  const broken = [];
  for (const row of rows) {
    const engine = resolveSimulatorScenarioId(
      row.linkedScenarioSlug,
      row.linkedScenarioId != null ? Number(row.linkedScenarioId) : null
    );
    if (!engine) {
      broken.push(row);
    }
  }
  return broken;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const validateOnly = process.argv.includes("--validate-only");

  console.log("S-03 partial link seed — pre-flight validation\n");
  for (const entry of S03_LINKS) {
    if (entry.confidence < 90) {
      throw new Error(`Lesson ${entry.lessonId} below 90% threshold`);
    }
    buildLinkRow(entry);
    console.log(`  OK  [${entry.confidence}%] lesson ${entry.lessonId}: ${entry.note}`);
  }

  if (validateOnly) {
    console.log(`\nValidated ${S03_LINKS.length} mappings (>=90% confidence). No DB writes.`);
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set (use --validate-only to skip DB)");
    process.exit(1);
  }

  const mysql2 = await getMysql();
  const conn = await mysql2.createConnection(process.env.DATABASE_URL);
  const slugPlaceholders = PRIORITY_MODULE_SLUGS.map(() => "?").join(",");

  const [priorityLessons] = await conn.execute(
    `SELECT cl.id, cl.title, cl.linkedScenarioId, cl.linkedScenarioSlug, cm.slug AS moduleSlug, cm.title AS moduleTitle
     FROM course_lessons cl
     JOIN course_modules cm ON cm.id = cl.moduleId
     WHERE cm.slug IN (${slugPlaceholders})
     ORDER BY cm.orderIndex, cl.orderIndex`,
    PRIORITY_MODULE_SLUGS
  );

  const priorityIds = new Set(priorityLessons.map((r) => Number(r.id)));

  let applied = 0;
  let cleared = 0;

  if (!dryRun) {
    for (const lessonId of CLEAR_IDS) {
      if (!priorityIds.has(lessonId)) continue;
      const [res] = await conn.execute(
        `UPDATE course_lessons SET linkedScenarioId = NULL, linkedScenarioSlug = NULL WHERE id = ?`,
        [lessonId]
      );
      if (res.affectedRows) cleared++;
    }

    for (const entry of S03_LINKS) {
      const { linkedScenarioId, linkedScenarioSlug } = buildLinkRow(entry);
      await conn.execute(
        `UPDATE course_lessons
         SET linkedScenarioId = ?, linkedScenarioSlug = ?
         WHERE id = ?`,
        [linkedScenarioId, linkedScenarioSlug, entry.lessonId]
      );
      applied++;
    }
  }

  const [afterRows] = await conn.execute(
    `SELECT cl.id, cl.title, cl.linkedScenarioId, cl.linkedScenarioSlug, cm.slug AS moduleSlug
     FROM course_lessons cl
     JOIN course_modules cm ON cm.id = cl.moduleId
     WHERE cm.slug IN (${slugPlaceholders})
     ORDER BY cm.slug, cl.orderIndex`,
    PRIORITY_MODULE_SLUGS
  );

  const linked = [];
  const skipped = [];
  const broken = [];

  for (const row of afterRows) {
    const id = Number(row.id);
    const slug = row.linkedScenarioSlug;
    const legacyId = row.linkedScenarioId != null ? Number(row.linkedScenarioId) : null;
    const engine = resolveSimulatorScenarioId(slug, legacyId);

    if (dryRun) {
      const planned = S03_LINKS.find((e) => e.lessonId === id);
      const willClear = CLEAR_IDS.includes(id);
      if (planned) linked.push({ ...row, engine: buildLinkRow(planned).engineSlug, planned: true });
      else if (willClear) skipped.push({ ...row, reason: "cleared (weak link)" });
      else if (legacyId || slug) {
        if (engine) linked.push({ ...row, engine });
        else broken.push({ ...row, reason: "linked but not playable" });
      } else skipped.push({ ...row, reason: "no link" });
      continue;
    }

    if (legacyId || slug) {
      if (engine) {
        linked.push({ ...row, engine });
      } else {
        broken.push({ ...row, reason: "has link but no simulator mapping" });
      }
    } else {
      skipped.push({ ...row, reason: "intentionally unlinked" });
    }
  }

  console.log("\n--- S-03 Summary ---");
  console.log(`Priority modules: ${PRIORITY_MODULE_SLUGS.join(", ")}`);
  console.log(`Lessons in scope: ${afterRows.length}`);
  console.log(`Links applied (this run): ${dryRun ? S03_LINKS.length + " (dry-run)" : applied}`);
  console.log(`Weak links cleared: ${dryRun ? CLEAR_IDS.length + " (dry-run)" : cleared}`);
  console.log(`Playable links after run: ${linked.length}`);
  console.log(`Unlinked / skipped: ${skipped.length}`);
  if (broken.length) {
    console.log(`BROKEN references: ${broken.length}`);
    for (const b of broken) {
      console.log(`  ! ${b.id} ${b.title} (${b.moduleSlug}) — ${b.reason}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Consistency check: no broken simulator references in priority modules.");
  }

  console.log("\nLinked lessons:");
  for (const l of linked) {
    console.log(`  • [${l.moduleSlug}] ${l.title} → ${l.engine ?? "(engine)"}`);
  }

  const globalBroken = await checkAllLessonLinks(conn);
  if (globalBroken.length) {
    console.log(`\nGlobal consistency: ${globalBroken.length} lesson(s) with broken simulator refs:`);
    for (const b of globalBroken) {
      console.log(`  ! ${b.id} ${b.title} slug=${b.linkedScenarioSlug} id=${b.linkedScenarioId}`);
    }
    process.exitCode = 1;
  } else if (!dryRun) {
    console.log("\nGlobal consistency: all linked lessons resolve to playable simulators.");
  }

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
