/**
 * VP-demo seed — a clean, REPEATABLE demo setup for the live walkthrough.
 *
 * Creates (idempotently):
 *   - Demo manager:  demo.manager@easlearn.demo / demo1234  (team owner)
 *   - Demo learner:  demo.tech@easlearn.demo    / demo1234  (team member)
 *   - Team "Demo Plant Maintenance"
 *   - A realistic readiness BASELINE for the learner — moderate, honest evidence
 *     (no fake mastery): some demonstrated motors/safety skill, a weak work-order
 *     note (so the manager sees "needs work-order coaching"), one stale PLC miss.
 *
 * Re-running RESETS the learner's evidence/validations to this baseline, so the
 * demo is repeatable: run the walkthrough live, then re-seed before the next one.
 *
 *   node scripts/seed-demo.mjs
 *
 * Requires DATABASE_URL (env or .project-config.json env_vars).
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { hash } from 'bcryptjs';
import { nanoid } from 'nanoid';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function resolveDbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try { return JSON.parse(fs.readFileSync(path.join(root, '.project-config.json'), 'utf8'))?.env_vars?.DATABASE_URL ?? null; } catch { return null; }
}
const url = resolveDbUrl();
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const MANAGER = { email: 'demo.manager@easlearn.demo', name: 'Dana Reyes (Demo Manager)' };
const TECH = { email: 'demo.tech@easlearn.demo', name: 'Marcus Doyle (Demo Tech)' };
const PASSWORD = 'demo1234';
const TEAM_NAME = 'Demo Plant Maintenance';

const conn = await mysql.createConnection(url);

async function upsertUser({ email, name }) {
  const passwordHash = await hash(PASSWORD, 10);
  const [rows] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (rows.length > 0) {
    await conn.query(
      "UPDATE users SET passwordHash = ?, name = ?, emailVerified = 1, loginMethod = 'email', subscriptionTier = 'team', subscriptionStatus = 'active' WHERE email = ?",
      [passwordHash, name, email],
    );
    return rows[0].id;
  }
  await conn.query(
    "INSERT INTO users (openId, name, email, passwordHash, emailVerified, loginMethod, role, subscriptionTier, subscriptionStatus) VALUES (?, ?, ?, ?, 1, 'email', 'user', 'team', 'active')",
    [`demo_${nanoid(24)}`, name, email, passwordHash],
  );
  const [created] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  return created[0].id;
}

async function ensureTeam(ownerId) {
  const [rows] = await conn.query('SELECT id FROM teams WHERE name = ? AND ownerId = ? LIMIT 1', [TEAM_NAME, ownerId]);
  if (rows.length > 0) return rows[0].id;
  await conn.query("INSERT INTO teams (name, ownerId, maxSeats, usedSeats, industry, isActive) VALUES (?, ?, 10, 2, 'Manufacturing (Demo)', 1)", [TEAM_NAME, ownerId]);
  const [created] = await conn.query('SELECT id FROM teams WHERE name = ? AND ownerId = ? LIMIT 1', [TEAM_NAME, ownerId]);
  return created[0].id;
}

async function ensureMember(teamId, userId, role) {
  const [rows] = await conn.query('SELECT id FROM team_members WHERE teamId = ? AND userId = ? LIMIT 1', [teamId, userId]);
  if (rows.length > 0) {
    await conn.query("UPDATE team_members SET role = ?, status = 'active' WHERE id = ?", [role, rows[0].id]);
    return;
  }
  await conn.query("INSERT INTO team_members (teamId, userId, role, status, joinedAt) VALUES (?, ?, ?, 'active', NOW())", [teamId, userId, role]);
}

const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

async function seedBaseline(learnerId) {
  // RESET: wipe the demo learner's evidence + validations so re-runs are clean.
  await conn.query('DELETE FROM competency_evidence WHERE learnerId = ?', [learnerId]);
  await conn.query('DELETE FROM competency_validations WHERE userId = ?', [learnerId]);

  // Honest baseline — moderate demonstrated skill, no fake mastery.
  const rows = [
    // Simulator: one solid Systematic-Troubleshooter run in motors (the heavyweight source).
    ['simulation', 'simulation_completed', 'competencyUpdate', 'motors', 'correct', null, 72, 0, daysAgo(7), { seed: 'demo', scenario: 'conveyor-multifault' }],
    // Lessons: sound reasoning in motors, correct action in safety.
    ['lesson', 'reasoned_answer', 'reasonBeforeVerdict', 'motors', 'correct', 'sound', null, 0, daysAgo(5), { seed: 'demo' }],
    ['lesson', 'action_choice', 'askBeforeTell', 'safety', 'correct', null, null, 0, daysAgo(6), { seed: 'demo' }],
    ['lesson', 'prediction', 'predictBeforeReveal', 'motors', 'correct', null, null, 0, daysAgo(5), { seed: 'demo' }],
    // Spaced review: retention holding in safety.
    ['review', 'review_recall', 'spacedReinforcement', 'safety', 'correct', null, null, 0, daysAgo(3), { seed: 'demo' }],
    // A PLC miss → "needs review" texture on the dashboard.
    ['lesson', 'reasoned_answer', 'reasonBeforeVerdict', 'plc', 'incorrect', 'flawed', null, 0, daysAgo(4), { seed: 'demo' }],
    // A vague work-order note → "needs work-order coaching" on the manager card.
    ['ai_mentor', 'ai_work_order_documentation', 'aiMentorIntervention', 'motors', 'incorrect', 'flawed', null, 0, daysAgo(2), { seed: 'demo', escalatedByLlm: false, mode: 'work_order', cues: ['vague claim'] }],
  ];
  for (const [sourceType, evidenceType, mechanicId, domain, correctness, reasoningQuality, methodologyScore, safetyFlag, createdAt, detail] of rows) {
    await conn.query(
      'INSERT INTO competency_evidence (learnerId, sourceType, evidenceType, mechanicId, domain, correctness, reasoningQuality, methodologyScore, safetyFlag, detail, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [learnerId, sourceType, evidenceType, mechanicId, domain, correctness, reasoningQuality, methodologyScore, safetyFlag, JSON.stringify(detail), createdAt],
    );
  }
  return rows.length;
}

const managerId = await upsertUser(MANAGER);
const techId = await upsertUser(TECH);
const teamId = await ensureTeam(managerId);
await ensureMember(teamId, managerId, 'owner');
await ensureMember(teamId, techId, 'member');
const n = await seedBaseline(techId);

console.log('Demo seed complete (repeatable — re-run to reset the baseline):');
console.log(`  Manager: ${MANAGER.email} / ${PASSWORD}  (userId ${managerId})`);
console.log(`  Learner: ${TECH.email} / ${PASSWORD}  (userId ${techId})`);
console.log(`  Team:    "${TEAM_NAME}" (id ${teamId}) — 2 active members`);
console.log(`  Baseline evidence rows: ${n} (moderate, honest — no fake mastery)`);
console.log('  NOTE: demo passwords are weak by design — never reuse for real accounts.');
await conn.end();
