/**
 * Backfill the Assessment Spine evidence ledger from historical data.
 *
 * The spine's readiness queries already interpret scenario_completions and
 * competency_validations at READ time, so no historical data is ever lost even
 * without this script. This backfill additionally MATERIALIZES those historical
 * events as durable rows in `competency_evidence`, so the audit trail and any
 * future write-time rollups include the full history.
 *
 * Idempotent: it tags backfilled rows in `detail.backfill` and skips any that
 * already exist. Safe to re-run.
 *
 *   node scripts/backfill-competency-evidence.mjs
 *
 * Requires DATABASE_URL. Requires migration 0037_competency_evidence.sql applied.
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

// Fault domain → skill domain, mirroring server/competency.ts FAULT_DOMAIN_TO_SKILL.
const conn = await mysql.createConnection(DATABASE_URL);

async function main() {
  // Map scenario slug → skill domain via fault_types (same source the spine uses).
  const [faults] = await conn.execute('SELECT scenarioSlug, domain FROM fault_types WHERE scenarioSlug IS NOT NULL');
  const FAULT_TO_SKILL = { electrical: 'electrical', motor: 'motors', vfd: 'vfd', plc: 'plc', safety: 'safety', sensor: 'sensors', network: 'networking', mechanical: 'integration' };
  const slugDomain = new Map();
  for (const f of faults) slugDomain.set(f.scenarioSlug, FAULT_TO_SKILL[f.domain] ?? 'integration');

  let simInserted = 0, valInserted = 0;

  // 1. scenario_completions → simulation_completed evidence
  const [comps] = await conn.execute('SELECT userId, scenarioSlug, score, maxScore, methodologyScore, timeSeconds, completedAt FROM scenario_completions');
  for (const c of comps) {
    const domain = slugDomain.get(c.scenarioSlug) ?? 'integration';
    const method = c.methodologyScore ?? (c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0);
    const correctness = method >= 65 ? 'correct' : method >= 40 ? 'partial' : 'incorrect';
    const [exists] = await conn.execute(
      "SELECT id FROM competency_evidence WHERE learnerId=? AND sourceType='simulation' AND competencyId=? AND createdAt=? LIMIT 1",
      [c.userId, c.scenarioSlug, c.completedAt]
    );
    if (exists.length) continue;
    await conn.execute(
      "INSERT INTO competency_evidence (learnerId, sourceType, evidenceType, mechanicId, domain, competencyId, correctness, methodologyScore, timeToDecisionMs, safetyFlag, detail, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [c.userId, 'simulation', 'simulation_completed', 'competencyUpdate', domain, c.scenarioSlug, correctness, method, (c.timeSeconds ?? 0) * 1000, 0, JSON.stringify({ backfill: 'scenario_completions' }), c.completedAt]
    );
    simInserted++;
  }

  // 2. competency_validations → manager_attestation evidence
  const [vals] = await conn.execute('SELECT userId, domain, validatedAt FROM competency_validations');
  for (const v of vals) {
    const [exists] = await conn.execute(
      "SELECT id FROM competency_evidence WHERE learnerId=? AND sourceType='manager_validation' AND domain=? AND createdAt=? LIMIT 1",
      [v.userId, v.domain, v.validatedAt]
    );
    if (exists.length) continue;
    await conn.execute(
      "INSERT INTO competency_evidence (learnerId, sourceType, evidenceType, mechanicId, domain, safetyFlag, detail, createdAt) VALUES (?,?,?,?,?,?,?,?)",
      [v.userId, 'manager_validation', 'manager_attestation', 'managerValidation', v.domain, 0, JSON.stringify({ backfill: 'competency_validations' }), v.validatedAt]
    );
    valInserted++;
  }

  console.log(`Backfill complete: ${simInserted} simulation + ${valInserted} manager-validation evidence rows inserted.`);
}

main().then(() => conn.end()).catch((e) => { console.error(e); conn.end(); process.exit(1); });
