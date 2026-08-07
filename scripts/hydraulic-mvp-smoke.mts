/**
 * Hydraulic MVP live smoke test.
 *
 * Exercises the four pilot paths (F1 sound, F4 sound, F4-with-unsafe, weak guess),
 * prints the exact EvidenceEvent rows a real run emits, and computes the resulting
 * readiness with the SAME pure math the server uses (readinessCells).
 *
 *   DRY RUN (no DB, safe anywhere):
 *     npx tsx scripts/hydraulic-mvp-smoke.mts
 *
 *   LIVE PERSISTENCE CHECK (requires DATABASE_URL + a real learner id):
 *     npx tsx scripts/hydraulic-mvp-smoke.mts --user=<learnerId> --persist
 *
 * With --persist it inserts the rows into `competency_evidence`, reads them back,
 * and recomputes readiness from the PERSISTED rows — proving the end-to-end loop
 * (attempt → persist → fluid_power readiness → Needs Safety Review on unsafe).
 * See docs/HYDRAULIC_MVP_LIVE_QA.md.
 */
import "dotenv/config";
import {
  HYDRAULIC_SCENARIOS,
  evaluateDiagnosis,
  buildSessionEvidence,
  hydraulicCloseoutEvidence,
  safetyActionEvidence,
  getHydraulicAction,
  type HydraulicSession,
} from "../shared/hydraulicSim";
import { readinessCells, type EvidenceEvent } from "../shared/assessmentSpine";

const args = process.argv.slice(2);
const userArg = args.find((a) => a.startsWith("--user="));
const learnerId = userArg ? Number(userArg.split("=")[1]) : undefined;
const persist = args.includes("--persist");

function run(faultId: "clogged_filter" | "pump_wear", clues: string[], unsafe: string[] = [], closeouts = false): EvidenceEvent[] {
  const s = HYDRAULIC_SCENARIOS[faultId];
  const session: HydraulicSession = {
    faultId,
    cluesGathered: clues as HydraulicSession["cluesGathered"],
    unsafeActionsTaken: unsafe as HydraulicSession["unsafeActionsTaken"],
    wrongDiagnoses: 0,
    timeSeconds: 210,
  };
  session.diagnosis = evaluateDiagnosis(s, faultId, session.cluesGathered);
  const events = [...buildSessionEvidence(s, session)];
  for (const u of unsafe) events.push(safetyActionEvidence(getHydraulicAction(u as never)));
  if (closeouts) {
    events.push(hydraulicCloseoutEvidence("operator", "The filter was clogged and starving the clamp; the pump was fine. I verified full pressure returned. Don't run it slow — call maintenance if it drags."));
    events.push(hydraulicCloseoutEvidence("workOrder", "Symptom: clamp slow. P1 1950, P2 900, filter ΔP 350. Cause: clogged filter. Action: relieved pressure, replaced element, verified. Follow-up: contamination source."));
    events.push(hydraulicCloseoutEvidence("handoff", "Clamp up; verified full pressure. Contamination source open — watch the filter."));
  }
  return events;
}

const paths: Record<string, EvidenceEvent[]> = {
  "F1 clogged filter (sound + closeout)": run("clogged_filter", ["observe_symptom", "sight_glass", "pump_outlet", "work_port", "filter_delta", "relief_line_temp", "flow"], [], true),
  "F4 pump wear (sound, eliminations done)": run("pump_wear", ["sight_glass", "filter_delta", "relief_line_temp", "pump_outlet", "flow"]),
  "F4 pump wear (UNSAFE: fitting under pressure)": run("pump_wear", ["sight_glass", "filter_delta", "pump_outlet"], ["loosen_fitting_under_pressure"]),
  "F4 pump wear (weak guess: pump on 1 clue)": run("pump_wear", ["pump_outlet"]),
};

const all = Object.values(paths).flat();

console.log("\n=== EVIDENCE ROWS EMITTED (what the DB must persist) ===");
console.log("evidenceType".padEnd(28), "domain".padEnd(12), "correct".padEnd(10), "reasoning".padEnd(8), "safety");
for (const [name, evs] of Object.entries(paths)) {
  console.log(`\n-- ${name} (${evs.length} rows) --`);
  for (const e of evs) {
    console.log(
      String(e.evidenceType).padEnd(28),
      String(e.domain).padEnd(12),
      String(e.correctness ?? "").padEnd(10),
      String(e.reasoningQuality ?? "").padEnd(8),
      e.safetyFlag ? "⚠ FLAG" : "",
    );
  }
}

function printReadiness(label: string, events: EvidenceEvent[]) {
  const cells = readinessCells(events);
  const fp = cells.find((c) => c.domain === "fluid_power")!;
  const safety = cells.find((c) => c.domain === "safety")!;
  console.log(`\n=== READINESS (${label}) ===`);
  console.log(`fluid_power → ${fp.label}: ${fp.readinessLevel}  (confidence ${fp.confidence}, attempts ${fp.attempts}, safetyViolation ${fp.hasSafetyViolation})`);
  console.log(`safety      → ${safety.label}: ${safety.readinessLevel}  (safetyViolation ${safety.hasSafetyViolation})`);
}
printReadiness("clean F1 run ALONE — earns hydraulic readiness, no safety gate", paths["F1 clogged filter (sound + closeout)"]);
printReadiness("unsafe F4 run ALONE — safety violation gates BOTH safety and fluid_power", paths["F4 pump wear (UNSAFE: fitting under pressure)"]);
printReadiness("this learner's AGGREGATE across all runs (safety violation on record dominates)", all);

if (!persist) {
  console.log("\nDRY RUN — no rows written. The rows above are exactly what persists.");
  console.log("For the live check: npx tsx scripts/hydraulic-mvp-smoke.mts --user=<learnerId> --persist\n");
  process.exit(0);
}

if (!process.env.DATABASE_URL) { console.error("\n--persist requires DATABASE_URL"); process.exit(1); }
if (!learnerId || Number.isNaN(learnerId)) { console.error("\n--persist requires --user=<learnerId>"); process.exit(1); }

const mysql = (await import("mysql2/promise")).default;
const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  console.log(`\n=== PERSISTING ${all.length} rows for learnerId=${learnerId} ===`);
  for (const e of all) {
    await conn.execute(
      `INSERT INTO competency_evidence (learnerId, sourceType, evidenceType, domain, skill, lessonId, correctness, reasoningQuality, methodologyScore, confidenceScore, safetyFlag, timeToDecisionMs, detail)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        learnerId, e.sourceType, e.evidenceType, e.domain, e.skill ?? null, e.lessonId ?? null,
        e.correctness ?? null, e.reasoningQuality ?? null, e.methodologyScore ?? null, e.confidenceScore ?? null,
        e.safetyFlag ? 1 : 0, e.timeToDecisionMs ?? null, JSON.stringify({ ...(e.detail ?? {}), smoke: "hydraulic-mvp" }),
      ],
    );
  }
  const [rows] = await conn.execute(
    "SELECT evidenceType, domain, correctness, reasoningQuality, safetyFlag FROM competency_evidence WHERE learnerId=? AND domain IN ('fluid_power','safety') ORDER BY id DESC LIMIT 100",
    [learnerId],
  );
  const persisted = rows as Array<Record<string, unknown>>;
  console.log(`Persisted + read back ${persisted.length} fluid_power/safety rows.`);
  const asEvents: EvidenceEvent[] = persisted.map((r) => ({
    sourceType: "simulation", evidenceType: r.evidenceType as EvidenceEvent["evidenceType"], domain: r.domain as EvidenceEvent["domain"],
    correctness: (r.correctness ?? undefined) as EvidenceEvent["correctness"], reasoningQuality: (r.reasoningQuality ?? undefined) as EvidenceEvent["reasoningQuality"],
    safetyFlag: !!r.safetyFlag,
  }));
  printReadiness("recomputed from PERSISTED rows", asEvents);
  console.log("\nNow open Manager Dashboard (teamReadiness) and Skills Passport (myReadiness) for this learner and confirm the Hydraulic Troubleshooting row + Needs Safety Review.\n");
} finally {
  await conn.end();
}
