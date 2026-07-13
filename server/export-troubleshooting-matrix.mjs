/**
 * Export Troubleshooting Coverage Matrix (Phase 1 deliverable).
 *
 * Run on Manus/production (DATABASE_URL required):
 *   node server/export-troubleshooting-matrix.mjs
 *   node server/export-troubleshooting-matrix.mjs --summary-only
 *   node server/export-troubleshooting-matrix.mjs --csv > troubleshooting-matrix.csv
 *   pnpm run db:export-troubleshooting-matrix
 *
 * Outputs:
 *   Default  → troubleshooting-matrix.json (summary + 193-row matrix)
 *   --csv    → stdout CSV for spreadsheets
 *   --summary-only → stdout JSON summary only (no file write)
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { writeFileSync } from "fs";

dotenv.config();

// Inline from shared/scenarioLinking.ts (Node cannot import .ts directly)
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
// Keep in sync with shared/scenarioLinking.ts
const SCENARIO_URL_ALIASES = {
  "blown-fuse": "blown-control-fuse",
  "failed-relay": "failed-safety-relay",
  "vfd-overcurrent": "vfd-overcurrent-ramp-v3",
  "vfd-undervoltage": "vfd-dc-bus-undervoltage-v3",
  "vfd-ground-fault": "vfd-ground-fault-cable-v3",
  "multi-fault": "vfd-conveyor-multifault-v3",
  "vfd-cooling-fan": "vfd-cooling-fan-seized-v3",
  "vfd-phase-loss": "vfd-input-phase-loss-v3",
  "plc-io-fault": "plc-io-fault-v3",
  "motor-overload": "motor-overload-trip-v3",
  "comm-loss": "comm-loss-v3",
  "intermittent-ground": "intermittent-ground-fault-v3",
  "conveyor-estop": "conveyor-estop",
  "conveyor-estop-v2": "conveyor-estop-v2",
};
const SIMULATOR_SCENARIO_IDS = new Set([
  "vfd-conveyor-multifault-v3", "vfd-overcurrent-ramp-v3", "vfd-dc-bus-undervoltage-v3",
  "vfd-ground-fault-cable-v3", "vfd-cooling-fan-seized-v3", "vfd-input-phase-loss-v3",
  "blown-control-fuse", "failed-safety-relay", "plc-io-fault-v3", "motor-overload-trip-v3",
  "comm-loss-v3", "intermittent-ground-fault-v3", "conveyor-estop-v2", "conveyor-estop",
  "24vdc-loss", "vfd-ramp", "starter-chatter", "case-packer-jam", "palletizer-safety-gate",
  "photoeye-false-trigger",
]);

function parseDbScenarioSlug(slug) {
  const match = /^db-(\d+)$/.exec(String(slug).trim());
  return match ? Number.parseInt(match[1], 10) : null;
}

function resolveSimulatorScenarioId(slugOrLegacyId, legacyNumericId) {
  const candidates = [];
  if (slugOrLegacyId?.trim()) candidates.push(slugOrLegacyId.trim());
  if (legacyNumericId != null && Number.isFinite(legacyNumericId)) {
    candidates.push(`db-${legacyNumericId}`);
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

const INTERACTIVE_RE = /<!--\s*INTERACTIVE:\s*(\w+)\s*-->/g;

function parseInteractiveMarkers(content) {
  const names = [];
  let m;
  const text = content || "";
  while ((m = INTERACTIVE_RE.exec(text)) !== null) {
    names.push(m[1]);
  }
  return names;
}

function missingComponents(row) {
  const missing = [];
  if (!row.hasKnowledgeCheck) missing.push("knowledge_check");
  if (!row.hasLessonQuiz) missing.push("lesson_quiz");
  if (!row.hasInteractive) missing.push("practical_exercise");
  if (!row.hasSimulatorLink) missing.push("simulator_link");
  if (!row.hasPlayableScenario) missing.push("playable_scenario");
  if (!row.scenarioCompletionTracked) missing.push("scenario_gate");
  return missing.join(";") || "none";
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);
  const csvMode = process.argv.includes("--csv");
  const summaryOnly = process.argv.includes("--summary-only");

  const [rows] = await conn.execute(`
    SELECT
      cl.id AS lessonId,
      cl.slug AS lessonSlug,
      cl.title AS lessonTitle,
      cl.orderIndex,
      cl.linkedScenarioId,
      cl.linkedScenarioSlug,
      cl.content,
      cm.id AS moduleId,
      cm.slug AS moduleSlug,
      cm.title AS moduleTitle,
      (SELECT COUNT(*) FROM lesson_assessment_questions laq
        WHERE laq.lessonId = cl.id AND laq.type = 'knowledge_check') AS kcCount,
      (SELECT COUNT(*) FROM lesson_assessment_questions laq
        WHERE laq.lessonId = cl.id AND laq.type = 'lesson_quiz') AS quizCount
    FROM course_lessons cl
    INNER JOIN course_modules cm ON cm.id = cl.moduleId
    WHERE cl.isPublished = 1 AND cm.isPublished = 1
    ORDER BY cm.orderIndex, cl.orderIndex
  `);

  const matrix = rows.map((r) => {
    const interactive = parseInteractiveMarkers(r.content);
    const engineId = resolveSimulatorScenarioId(
      r.linkedScenarioSlug,
      r.linkedScenarioId != null ? Number(r.linkedScenarioId) : null,
    );
    const hasSimulatorLink = Boolean(r.linkedScenarioSlug || r.linkedScenarioId);
    const hasPlayableScenario = Boolean(engineId);

    return {
      lessonId: r.lessonId,
      lessonSlug: r.lessonSlug,
      lessonTitle: r.lessonTitle,
      moduleId: r.moduleId,
      moduleSlug: r.moduleSlug,
      moduleTitle: r.moduleTitle,
      topic: r.moduleTitle,
      hasKnowledgeCheck: Number(r.kcCount) > 0,
      hasLessonQuiz: Number(r.quizCount) > 0,
      kcCount: Number(r.kcCount),
      quizCount: Number(r.quizCount),
      hasInteractive: interactive.length > 0,
      interactiveComponents: interactive.join("|") || null,
      linkedScenarioSlug: r.linkedScenarioSlug,
      simulatorEngineId: engineId,
      hasSimulatorLink,
      hasPlayableScenario,
      scenarioCompletionTracked: hasPlayableScenario,
      missing: null,
    };
  });

  for (const row of matrix) {
    row.missing = missingComponents(row);
  }

  const byModule = {};
  for (const r of matrix) {
    if (!byModule[r.moduleSlug]) {
      byModule[r.moduleSlug] = {
        moduleSlug: r.moduleSlug,
        moduleTitle: r.moduleTitle,
        lessons: 0,
        withPlayableScenario: 0,
        withInteractive: 0,
        fullySpined: 0,
      };
    }
    const m = byModule[r.moduleSlug];
    m.lessons++;
    if (r.hasPlayableScenario) m.withPlayableScenario++;
    if (r.hasInteractive) m.withInteractive++;
    if (r.missing === "none") m.fullySpined++;
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    totalLessons: matrix.length,
    withKC: matrix.filter((r) => r.hasKnowledgeCheck).length,
    withQuiz: matrix.filter((r) => r.hasLessonQuiz).length,
    withInteractive: matrix.filter((r) => r.hasInteractive).length,
    withSimulatorLink: matrix.filter((r) => r.hasSimulatorLink).length,
    withPlayableScenario: matrix.filter((r) => r.hasPlayableScenario).length,
    fullySpined: matrix.filter((r) => r.missing === "none").length,
    missingSimOnly: matrix.filter(
      (r) => r.hasKnowledgeCheck && r.hasLessonQuiz && !r.hasPlayableScenario,
    ).length,
    byModule: Object.values(byModule).sort((a, b) => a.moduleSlug.localeCompare(b.moduleSlug)),
  };

  if (summaryOnly) {
    console.log(JSON.stringify(summary, null, 2));
  } else if (csvMode) {
    const headers = [
      "lessonId",
      "moduleSlug",
      "lessonSlug",
      "lessonTitle",
      "hasKnowledgeCheck",
      "hasLessonQuiz",
      "hasInteractive",
      "interactiveComponents",
      "linkedScenarioSlug",
      "simulatorEngineId",
      "hasPlayableScenario",
      "missing",
    ];
    console.log(headers.join(","));
    for (const r of matrix) {
      console.log(
        [
          r.lessonId,
          r.moduleSlug,
          r.lessonSlug,
          `"${String(r.lessonTitle).replace(/"/g, '""')}"`,
          r.hasKnowledgeCheck,
          r.hasLessonQuiz,
          r.hasInteractive,
          r.interactiveComponents ?? "",
          r.linkedScenarioSlug ?? "",
          r.simulatorEngineId ?? "",
          r.hasPlayableScenario,
          r.missing,
        ].join(","),
      );
    }
  } else {
    const outPath = "troubleshooting-matrix.json";
    writeFileSync(outPath, JSON.stringify({ summary, matrix }, null, 2));
    console.log("Troubleshooting Coverage Matrix");
    console.log(JSON.stringify(summary, null, 2));
    console.log(`\nWrote ${outPath} (${matrix.length} lessons)`);
  }

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
