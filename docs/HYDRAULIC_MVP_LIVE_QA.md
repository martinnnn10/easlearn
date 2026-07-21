# Hydraulic MVP — Live QA / Smoke Test

Verifies the pilot loop: **sim attempt → evidence persists → `fluid_power` readiness updates → Manager Dashboard + Skills Passport show Hydraulic Troubleshooting → unsafe action → Needs Safety Review.**

> **Honest status (re-confirmed this session):** the authoring/CI sandbox has **no `DATABASE_URL`, no `.env`, no reachable deployed environment, and no browser.** The *DB-persistence* and *browser-QA* legs therefore **cannot be executed from here** and remain **PENDING (live env)**. I will not fabricate rows, dashboard states, or screenshots. Everything that does *not* require a live DB — code path, readiness math, the full evidence set, the safety gate, **and confirmation that both required migrations exist in the repo** — is **verified** and shown with real output. The remaining step is one command against a live DB plus a glance at two pages.
>
> **Migrations confirmed present in the repo** (task 2): `drizzle/0037_competency_evidence.sql` ✔ and `drizzle/0038_rate_limit_events.sql` ✔ — they must be *applied* in the live DB before the smoke run.

---

## Local browser QA (headless Chromium against the built client, no DB) — this session

The production client build was served locally (SPA static server) and driven with real Chromium. This verifies **everything that does not require the server/DB** — the UI, the full diagnostic flow, the safety gate, discovery, and mobile layout. Evidence emission is a no-op here (unauthenticated, no server), so DB persistence + dashboards remain PENDING.

| Check | Result |
|---|---|
| `/labs/hydraulic` renders the sim | ✅ (`hydqa-1-brief`, `hydqa-2-investigate`) |
| Schematic + probing (readings appear, color-toned, F1 signature correct: P1 1950 green, filter ΔP 350 red, P2 900 red) | ✅ (`hydqa-2-investigate`) |
| Full flow brief → investigate → diagnose → act → closeout → **debrief** ("Methodology · proficient") | ✅ (`hydqa-act`, `hydqa-closeout`, `hydqa-debrief`) |
| Diagnosis completes; wrong call allows retry | ✅ |
| **Unsafe action → "Stored hydraulic energy" warning modal with "Do it anyway"/"Cancel"** | ✅ (`hydqa-4-unsafe-modal`) |
| Closeout textareas fillable + submittable | ✅ |
| No runtime/page errors through the whole flow | ✅ (only expected API-404s from having no server) |
| Mobile 375px: no horizontal overflow, no overlay blocks the primary action | ✅ (`hydqa-5-mobile`) |
| `/labs` featured card + CTA "Start Hydraulic Lab" + flagship tab entry present & **visible on desktop** | ✅ **after bug fix** (see Bugs) |

**Bug found & fixed this session:** the `/labs` featured card carried `landscape:hidden`, so it was `display:none` on desktop (landscape orientation) — present in the DOM but invisible, defeating "appears as a featured card." **Fixed** by removing `landscape:hidden` (1-line change); re-verified `isVisible: true` and the description text visible on a 1280×900 desktop viewport. tsc clean, 289 tests still pass.

**Minor UX note (not fixed — no behavior change requested):** on a *correct* diagnosis the sim auto-advances to the Act phase, so the "Sound call…" reasoning feedback flashes rather than pausing. Consider a brief confirm step so the learner reads why they were right. Non-blocking.

**Still requires the live env (server + DB):** competency_evidence persistence, Manager Dashboard, Skills Passport — these render server-fetched data and cannot be exercised without `DATABASE_URL`.

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

**Code-complete, self-contained, and loop-verified — NOT yet pilot-ready.** Per the standing rule, the pilot-ready call is withheld until live DB persistence is verified, which could **not** be done from this session (no DB / no deploy / no browser — re-confirmed).

- ✅ **UI browser-verified** (headless Chromium on the built client): full diagnostic flow, unsafe-action warning modal, closeout, debrief, and mobile layout all work with no page errors.
- ✅ Discovery: featured card + flagship tab on `/labs`, route `/labs/hydraulic` — **card now visible on desktop after fixing a `landscape:hidden` bug this session.**
- ✅ Evidence emission wired to `trpc.assessment.recordEvidence`; the full row set and readiness math verified DB-free (loop test + dry-run smoke).
- ✅ Safety gate verified — in logic (unsafe → Needs Safety Review on both domains) and in the live UI (warning modal fires).
- ✅ Both required migrations exist in the repo (`0037_competency_evidence`, `0038_rate_limit_events`).
- ✅ Clean, self-contained PR branch `claude/hydraulic-pressure-loss-mvp` — builds and tests green on the bare platform baseline (no electrical/strategy commits).
- ⏳ **To close before calling manager readiness "proven"** (run in the live env with `DATABASE_URL`, after applying the two migrations):
  1. `npx tsx scripts/hydraulic-mvp-smoke.mts --user=<learnerId> --persist` → confirm the rows insert + read back.
  2. Open `/labs` → confirm the Hydraulic tile/tab. Open `/labs/hydraulic` → run F1, F4, one unsafe path, one closeout.
  3. **Manager Dashboard** (as manager) → confirm the **Hydraulic Troubleshooting** row, **Needs Manager Validation** on a clean run, **Needs Safety Review** after the unsafe path, audit rationale visible.
  4. **Skills Passport** → confirm the row, recent evidence, safety status, and **no fake mastery** from one run.
  5. Record the observed rows/levels/screenshots back into §4–§7 and flip this verdict to pilot-ready.
