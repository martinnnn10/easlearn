/**
 * Demo-readiness verifier — proves, against the LIVE database, that:
 *   1. competency_evidence exists (migration 0037) — applies it if missing
 *   2. rate_limit_events exists (migration 0038) — applies it if missing
 *   3. evidence rows actually persist (insert → read → delete round-trip)
 *   4. rate-limit rows actually persist (same round-trip)
 *
 * Run:  node scripts/verify-demo-readiness.mjs
 * Requires DATABASE_URL in the environment, or a local .project-config.json
 * (env_vars.DATABASE_URL). Never prints the connection string.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveDbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(root, '.project-config.json'), 'utf8'));
    return cfg?.env_vars?.DATABASE_URL ?? null;
  } catch {
    return null;
  }
}

const url = resolveDbUrl();
if (!url) {
  console.error('FAIL: DATABASE_URL not set (env or .project-config.json).');
  process.exit(1);
}

const conn = await mysql.createConnection(url);
const results = [];
const ok = (name, pass, note = '') => { results.push({ name, pass, note }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${note ? ` — ${note}` : ''}`); };

async function tableExists(name) {
  const [rows] = await conn.execute(
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [name],
  );
  return Number(rows[0].n) > 0;
}

async function applyMigration(file) {
  const raw = fs.readFileSync(path.join(root, 'drizzle', file), 'utf8');
  // Strip comment lines FIRST, then split into statements.
  const sql = raw.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
    try {
      await conn.query(stmt);
    } catch (e) {
      // Tolerate re-runs: duplicate index (1061) / table exists (1050)
      if (e?.errno === 1061 || e?.errno === 1050) continue;
      throw e;
    }
  }
}

try {
  // 0: competency_validations must match the app schema (managerId/userId/domain/note).
  // Live drift found 2026-07-05: an older, different-shaped table existed. If the
  // wrong-shaped table is EMPTY we rename it aside and apply 0036; if it has data,
  // we FAIL loudly and require a human migration decision — never destroy data.
  if (await tableExists('competency_validations')) {
    const [cols] = await conn.query('SHOW COLUMNS FROM competency_validations');
    const names = cols.map((c) => c.Field);
    if (!names.includes('managerId')) {
      const [cnt] = await conn.query('SELECT COUNT(*) AS n FROM competency_validations');
      if (Number(cnt[0].n) === 0) {
        const legacy = `competency_validations_legacy_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
        console.log(`… competency_validations has a legacy shape (no managerId) and 0 rows — renaming to ${legacy} and applying 0036`);
        await conn.query(`RENAME TABLE competency_validations TO ${legacy}`);
        await applyMigration('0036_competency_validations.sql');
        ok('competency_validations reshaped to app schema (legacy preserved)', await tableExists('competency_validations'));
      } else {
        ok('competency_validations schema matches app', false, 'legacy-shaped table HAS DATA — manual migration required, refusing to touch it');
      }
    } else {
      ok('competency_validations schema matches app', true);
    }
  } else {
    await applyMigration('0036_competency_validations.sql');
    ok('competency_validations created (migration 0036)', await tableExists('competency_validations'));
  }

  // 1+2: tables exist (apply migrations if missing)
  for (const [table, file] of [
    ['competency_evidence', '0037_competency_evidence.sql'],
    ['rate_limit_events', '0038_rate_limit_events.sql'],
  ]) {
    let exists = await tableExists(table);
    if (!exists) {
      console.log(`… ${table} missing — applying ${file}`);
      await applyMigration(file);
      exists = await tableExists(table);
    }
    ok(`${table} table exists (migration applied)`, exists);
  }

  // 3: evidence persistence round-trip (sentinel learnerId, cleaned up immediately)
  const SENTINEL = -424242;
  await conn.execute('DELETE FROM competency_evidence WHERE learnerId = ?', [SENTINEL]);
  await conn.execute(
    "INSERT INTO competency_evidence (learnerId, sourceType, evidenceType, mechanicId, domain, correctness, reasoningQuality, safetyFlag, detail) VALUES (?,?,?,?,?,?,?,?,?)",
    [SENTINEL, 'ai_mentor', 'ai_reasoning_check', 'reasonBeforeVerdict', 'motors', 'correct', 'sound', 0, JSON.stringify({ verify: true })],
  );
  const [evRows] = await conn.execute('SELECT id, evidenceType, reasoningQuality FROM competency_evidence WHERE learnerId = ?', [SENTINEL]);
  const evOk = evRows.length === 1 && evRows[0].evidenceType === 'ai_reasoning_check' && evRows[0].reasoningQuality === 'sound';
  await conn.execute('DELETE FROM competency_evidence WHERE learnerId = ?', [SENTINEL]);
  ok('mentor evidence persists (insert → read → delete)', evOk);

  // 4: rate-limit persistence round-trip
  await conn.execute('DELETE FROM rate_limit_events WHERE userId = ?', [SENTINEL]);
  await conn.execute('INSERT INTO rate_limit_events (userId, bucket) VALUES (?, ?)', [SENTINEL, 'mentor.coach']);
  const [rlRows] = await conn.execute('SELECT id FROM rate_limit_events WHERE userId = ?', [SENTINEL]);
  const rlOk = rlRows.length === 1;
  await conn.execute('DELETE FROM rate_limit_events WHERE userId = ?', [SENTINEL]);
  ok('rate-limit events persist (insert → read → delete)', rlOk);

  const failed = results.filter((r) => !r.pass);
  console.log(failed.length === 0 ? '\nALL CHECKS PASSED — evidence persistence verified against the live database.' : `\n${failed.length} CHECK(S) FAILED.`);
  process.exit(failed.length === 0 ? 0 : 1);
} finally {
  await conn.end();
}
