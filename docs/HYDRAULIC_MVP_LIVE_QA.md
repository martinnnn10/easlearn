# Hydraulic MVP — Live QA / Smoke Test

Verifies the pilot loop: **sim attempt → evidence persists → `fluid_power` readiness updates → Manager Dashboard + Skills Passport show Hydraulic Troubleshooting → unsafe action → Needs Safety Review.**

> **Honest status:** the build environment used to author this MVP has **no `DATABASE_URL` and no `.env`**, so the *DB-persistence* leg of this test **cannot be executed here** and is marked **PENDING (live env)** below. Everything that does *not* require a DB — the code path, the readiness math, the full evidence set, and the safety gate — is **verified** here and shown with real output. The remaining step is one command against a live DB plus a glance at two pages.

---

## 1. Test environment

| | Authoring sandbox (this run) | Live pilot env (to run) |
|---|---|---|
| `DATABASE_URL` | **absent** | present (MySQL) |
| tsc / vitest / vite / esbuild | ✅ run here | re-run in CI |
| Evidence persistence (`competency_evidence`) | ⏳ **PENDING** | run the smoke command below |
| Manager Dashboard / Skills Passport render | ⏳ PENDING (needs persisted rows) | verify in browser |

Migration required in the live env: `drizzle/0037_competency_evidence.sql` (the evidence ledger).

## 2. Test user

- Live run: any real learner id you can view in Manager Dashboard / Skills Passport. Pass it as `--user=<learnerId>`.
- Sandbox: not applicable (dry run emits the rows without a learner).

## 3. Faults attempted (the four pilot paths)

Driven by `scripts/hydraulic-mvp-smoke.mts` (and mirrored by the UI at `/labs/hydraulic`):

1. **F1 clogged filter** — sound diagnosis + full closeout (operator / work order / handoff).
2. **F4 pump wear** — sound diagnosis (eliminations done first).
3. **F4 pump wear — UNSAFE** — cracks a fitting under pressure (safety path).
4. **F4 pump wear — weak guess** — "pump" on one reading (right answer, flawed reasoning).

## 4. Evidence rows — VERIFIED here (DB-free), pending persistence

`npx tsx scripts/hydraulic-mvp-smoke.mts` emits exactly these rows (this is what the DB will store). All nine required evidence types are present:

| Path | Rows | Types emitted |
|---|---|---|
| F1 sound + closeout | 13 | `live_interaction`×7, `reasoned_answer`, `diagnosis_submitted`, `simulation_completed`, `ai_operator_communication`, `ai_work_order_documentation`, `ai_shift_handoff` |
| F4 sound | 8 | `live_interaction`×5, `reasoned_answer`(sound), `diagnosis_submitted`, `simulation_completed` |
| F4 unsafe | 8 | + `safety_action`(domain=`safety`, **safetyFlag**), `simulation_completed`(**safetyFlag**) |
| F4 weak guess | 4 | `reasoned_answer`(**flawed**), `simulation_completed`(incorrect) |

- Domain on the diagnostic/sim rows: **`fluid_power`**. ✔
- Safety rows carry domain **`safety`** with **safetyFlag=true**. ✔
- `ai_reflection` / `ai_root_cause_explanation` are emitted by the reflection/root-cause closeout kinds (the loop test exercises `ai_reflection`).

**PENDING (live):** run `npx tsx scripts/hydraulic-mvp-smoke.mts --user=<id> --persist` and confirm the rows land in `competency_evidence` (the script inserts, reads back, and prints the persisted count).

## 5. Manager Dashboard — expected result

Readiness is computed server-side by `readinessForDomains()` over `Object.keys(SKILL_DOMAIN_LABELS)`, so `fluid_power` is included by construction (`teamReadiness` → per-member `readiness[]`). After persistence, the manager view for the test learner should show:

- **Hydraulic Troubleshooting** row (label for `fluid_power`).
- Level **Needs Manager Validation** after a clean sound run, or **Needs Safety Review** if the unsafe path was taken.
- Audit rationale (the "why" strings from `interpretEvidence`) and an attempt/evidence signal.

*Verified indirectly:* `readinessCells()` (same math the server runs) produces the `fluid_power` cell with the correct level (see §7). **PENDING (live):** confirm the row renders in the browser.

## 6. Skills Passport — expected result

`myReadiness` → `readinessQuery.data.readiness`, filtered to `attempts > 0 || managerValidated || hasSafetyViolation`. A hydraulic run has `attempts > 0`, so the **Hydraulic Troubleshooting** row appears with:

- readiness level + recent evidence,
- safety status if a violation is on record,
- **not fake mastery** — a single strong run lands at **Needs Manager Validation**, never **Promotion Candidate** (that requires manager validation).

**PENDING (live):** confirm in the browser.

## 7. Safety path — VERIFIED

From the dry-run readiness (same math as the server), per isolated path:

```
clean F1 run  → fluid_power: Needs Manager Validation  (confidence 70, safetyViolation false)
                safety:      Not Demonstrated
unsafe F4 run → fluid_power: Needs Safety Review        (safetyViolation true)
                safety:      Needs Safety Review         (safetyViolation true)
```

The safety violation dominates **both** the `safety` domain and the task `fluid_power` domain — a dangerous move blocks hydraulic-readiness credit until a safety review clears it. ✔ This is asserted in `shared/hydraulicSim.loop.test.ts` and `shared/hydraulicSim.test.ts`.

## 8. Issues found

- **None functional.** No Assessment Spine model changes were needed beyond adding the `fluid_power` domain (additive).
- **Design note (not a bug):** an unsafe action holds `fluid_power` at *Needs Safety Review*, not just the `safety` domain. This is intended — you do not earn troubleshooting readiness on a run where you did something dangerous.
- **Environment limit:** DB persistence unverifiable in the authoring sandbox (no `DATABASE_URL`); deferred to the live env via the smoke command.

## 9. Final verdict

**Code-complete and loop-verified; pilot-ready pending one live-DB persistence pass.**

- ✅ Discovery: featured card + flagship tab on `/labs`, route `/labs/hydraulic`.
- ✅ Evidence emission wired to `trpc.assessment.recordEvidence`; the full row set and readiness math verified DB-free (loop test + dry-run smoke).
- ✅ Safety gate verified (unsafe → Needs Safety Review on both domains).
- ⏳ **To close before calling manager readiness "proven":** in the live env, run
  `npx tsx scripts/hydraulic-mvp-smoke.mts --user=<learnerId> --persist`,
  then open **Manager Dashboard** and **Skills Passport** for that learner and confirm the **Hydraulic Troubleshooting** row (and **Needs Safety Review** after the unsafe path). Record the observed rows/levels back into §4–§7.
