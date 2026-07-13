/**
 * Demo status — QA tool: computes EXACTLY what assessment.myReadiness will show
 * for the demo learner, from the LIVE database, using the real spine code.
 * Proves the evidence → readiness → communication pipeline end-to-end without the UI.
 *
 *   npx tsx scripts/demo-status.mts
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { readinessCells, communicationReadiness, overallConfidence, methodologyTierFromConfidence, type EvidenceEvent } from '../shared/assessmentSpine';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.DATABASE_URL ?? JSON.parse(fs.readFileSync(path.join(root, '.project-config.json'), 'utf8'))?.env_vars?.DATABASE_URL;
const conn = await mysql.createConnection(url);

const [users] = await conn.query("SELECT id, name FROM users WHERE email = 'demo.tech@easlearn.demo' LIMIT 1") as unknown as [{ id: number; name: string }[]];
if (!users.length) { console.error('Demo tech not seeded — run scripts/seed-demo.mjs first'); process.exit(1); }
const tech = users[0];

const [rows] = await conn.query('SELECT * FROM competency_evidence WHERE learnerId = ?', [tech.id]) as unknown as [Record<string, unknown>[]];
const events: EvidenceEvent[] = rows.map((r) => ({
  sourceType: r.sourceType as EvidenceEvent['sourceType'],
  evidenceType: r.evidenceType as EvidenceEvent['evidenceType'],
  mechanicId: (r.mechanicId ?? undefined) as EvidenceEvent['mechanicId'],
  domain: r.domain as EvidenceEvent['domain'],
  correctness: (r.correctness ?? undefined) as EvidenceEvent['correctness'],
  reasoningQuality: (r.reasoningQuality ?? undefined) as EvidenceEvent['reasoningQuality'],
  methodologyScore: (r.methodologyScore ?? undefined) as number | undefined,
  safetyFlag: Boolean(r.safetyFlag),
  detail: (r.detail ?? undefined) as Record<string, unknown> | undefined,
  createdAt: new Date(r.createdAt as string).toISOString(),
}));

console.log(`Demo learner: ${tech.name} — ${events.length} evidence rows (live DB)\n`);
const cells = readinessCells(events);
const demoed = cells.filter((c) => c.attempts > 0);
const overall = overallConfidence(cells);
console.log(`Overall: ${overall}% · ${methodologyTierFromConfidence(overall)}\n`);
console.log('Domain readiness (what the Competency Graph / Manager Dashboard show):');
for (const c of demoed) console.log(`  ${c.label.padEnd(28)} ${String(c.confidence).padStart(3)}%  ${c.readinessLevel}${c.hasSafetyViolation ? '  ⚠ SAFETY' : ''}`);

const comm = communicationReadiness(events);
console.log(`\nMaintenance Communication: ${comm.hasEvidence ? comm.overall.level : 'Not Demonstrated'} · verified-vs-assumed: ${comm.verifiedVsAssumed}${comm.safetyCommunicationRisk ? ' · ⚠ safety comm risk' : ''}`);
for (const a of comm.areas.filter((x) => x.attempts > 0)) console.log(`  ${a.label.padEnd(28)} ${String(a.confidence).padStart(3)}%  ${a.level}`);

await conn.end();
