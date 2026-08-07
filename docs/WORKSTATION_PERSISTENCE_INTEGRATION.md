# Motor Control Workstation — Persistence Integration (Production Wiring)

**Branch:** `claude/workstation-persistence` (base: `easplatform_17` deployed snapshot, import `fdb559a`)
**Companion audit:** `docs/WORKSTATION_REPO_AUDIT.md`

## What this change does

Closes the single blocker from the production handoff: gameplay is now wired to the
persistence system. The full production loop works end-to-end:

learner action → persisted diagnostic event (append-only, idempotent) → resumable
attempt → **server-derived** Assessment Spine evidence → assignment completion →
manager reasoning replay (real events, provenance-tagged) → manager validation
(domain-correct attestation) → Skills Passport/readiness impact.

## Files changed

| File | Change |
|---|---|
| `shared/workstationAnswerKey.ts` | **NEW** — event vocabulary (17 types), required-completion set, per-scenario answer key (correct hypothesis, corrective action), competency→domain map, `WorkstationSavedState` contract |
| `drizzle/0039_workstation_persistence.sql` | **NEW** — creates the 5 tables if absent; **UNIQUE(attemptId, idempotencyKey)** (makes idempotency real); hot-path indexes; guarded admin-role flag seed |
| `server/workstation.ts` | resume-or-create `startAttempt`; status-guarded + double-layer-idempotent `recordEvent` (enum vocabulary); deterministic `getEvents` ordering (occurredAt, id); **fail-closed, server-derived, idempotent, race-guarded `completeAttempt` (input = attemptId only)**; status-guarded `abandonAttempt`; `validate` domain mapping + 8-competency enum; dead EVENT_TO_EVIDENCE removed |
| `client/src/lib/useWorkstationPersistence.ts` | **NEW** — attempt bootstrap, serial event queue (client UUID per event, bounded retry/backoff, honest failure state), debounced autosave, drain-then-complete |
| `client/src/pages/MotorControlWorkstation.tsx` | Wrapper now bootstraps/resumes the attempt, reads `?scenario=&assignment=`, blocks gameplay if no persisted attempt exists, injects persistence |
| `client/src/pages/WorkstationPrototype.tsx` | Optional persistence props; every meaningful handler records an event; saved-state restore; repair-verification transition event; autosave; completion UI with requirement checklist + honest save/error states; save-status header chip; scenario selector locked for assignment launches |
| `client/src/components/MyAssignments.tsx` | CTA carries `?assignment=<id>&scenario=<id>` |
| `client/src/pages/TechnicianDetail.tsx` | Replay renders the event `detail` (learner's actual words/readings) with **provenance tags** (learner / sim reading / system / action); elapsed time from `attempt.startedAt`; validation errors surfaced; competency typed to the 8-item enum |
| `client/src/App.tsx` | Dead `WorkstationPrototype` import removed |
| `server/workstation.behavior.test.ts` | **NEW** — 21 behavioral tests invoking the real router (see below) |

## Gameplay → event mapping

| Interaction | Event type | Key payload fields |
|---|---|---|
| Scenario launch (server-side) | `scenario_observed` | scenarioId, faultId, scenarioVersion |
| Machine-view component click | `component_selected` | componentId, source:"machine_view", addresses; componentRef |
| Schematic element click | `schematic_item_selected` | componentId, source:"schematic", addresses |
| Meter lead placement | `test_points_selected` | probe, component, terminals |
| Meter mode change | `meter_function_selected` | mode |
| Take Reading (safe) | `measurement_performed` | testId, probe, component, terminals, mode, reading, expected, unit, energizedState{contactorPulled,motorCoilEnergized,beltRunning,overloadTripped}, faultCleared |
| Take Reading (unsafe) | `unsafe_action_attempted` + `unsafe_action_blocked` | attemptedAction, probe, mode, energizedState, reason / reasonBlocked, remediation |
| Add hypothesis | `hypothesis_created` | hypothesisId (uuid), text, zone |
| Cycle hypothesis status | `hypothesis_status_changed` | hypothesisId, text, from, to (append-only — history preserved) |
| Record interpretation | `measurement_interpreted` | testId, interpretation, probe, reading, hypothesesSnapshot[{id,status}] |
| Corrective action | `corrective_action_selected` | actionLabel, faultId |
| Fault clears after corrective action | `repair_verification_performed` | faultCleared, result, machineRunning (fires once per transition) |
| Submit & Complete | `diagnosis_submitted` {hypothesisId, hypothesisText, zone} + `closeout_submitted` {rootCause, correctiveAction, testsPerformed, machineRunning} then server `workstation_completed` |

Not persisted (cosmetic, per spec): tab changes, drawer open/close, feedback stars, cursor movement.

## Attempt lifecycle

- `startAttempt` is **resume-or-create**: an existing in_progress (user, scenario) attempt is
  returned with its saved `machineState`; refresh/double-click/rerender cannot fork attempts.
  Assignment id late-links onto a resumed attempt.
- Every event carries `idempotencyKey = "<attemptId>_<clientUUID>"`; duplicates return
  `{ok:true, duplicate:true}` via pre-check or the unique index.
- Events are pumped **serially** from a queue → server insertion order = action order →
  `getEvents` ordering (occurredAt, id) is deterministic and append-only.
- Autosave: debounced (2 s) `saveState` snapshots + flush on unmount; resume restores tests,
  hypothesis history/statuses, safety events, meter setup, corrective/diagnosis/closeout state.
  localStorage is not used as a record of anything.
- Failed writes: bounded retries with backoff; then surfaced as "N not saved — Retry" in the
  header and a blocking error at completion. Nothing is silently dropped and the UI never
  claims saved when it isn't.

## Completion gate (fail-closed)

Client side: the Submit button requires measurement ≥1, a confirmed hypothesis, corrective
action, and repair verification — then **drains the event queue** and refuses if any write
failed. Server side (authoritative): `completeAttempt(attemptId)` re-verifies that
`measurement_performed`, `diagnosis_submitted`, `corrective_action_selected`,
`repair_verification_performed`, and `closeout_submitted` are **persisted**; missing ⇒
`PRECONDITION_FAILED` (recoverable error shown, nothing completed, no evidence). Grading is
derived from the persisted diagnosis event + `shared/workstationAnswerKey.ts` — client-supplied
correctness booleans no longer exist in the API. Completion transitions status via a
conditional `UPDATE … WHERE status='in_progress'` (0 rows ⇒ lost race ⇒ idempotent
`alreadyCompleted`, no duplicate evidence); repeats return `alreadyCompleted`.

## Evidence (Assessment Spine)

Created only at successful completion, from persisted rows: `simulation_completed`
(reasoningQuality sound/weak/flawed), `diagnosis_submitted`, `safety_action` (violations),
`live_interaction` meter_usage, `live_interaction` plc_output_verification (PLC-terminal
measurements). Manager `validate` writes `manager_attestation` with the **competency's own
domain** (safety_judgment→safety, meter_usage→electrical, …).

## Tests (21 new behavioral, invoking the real router)

startAttempt: flag-denied / create+initial-event / resume-no-duplicate · recordEvent:
cross-user FORBIDDEN, completed-attempt BAD_REQUEST, unknown-type rejected, duplicate
pre-check, ER_DUP_ENTRY race, safety flagging · completeAttempt: fail-closed missing events,
server-derived correct grading + evidence set, wrong-hypothesis + safety evidence, idempotent
repeat, race-guard (affectedRows 0), assignment completion · authorization: cross-team
denial/allow, unmanaged learnerAttempts · validate: self-validation forbidden, domain
mapping, vocabulary enforcement.

## Deployment

1. Apply `drizzle/0039_workstation_persistence.sql` on the production DB (TiDB). Tables are
   `CREATE TABLE IF NOT EXISTS` (no-op where db:push already created them); the index/seed
   statements are the operative part. If any index already exists, skip that statement.
2. Deploy the branch build (`pnpm install && pnpm run check && pnpm run build`, then publish).
3. Verify: flag-enabled user opens `/labs/motor-control-workstation` → header shows
   "Saved ✓"; take readings → events in `workstation_diagnostic_events`; leave/log out/return
   → same attempt resumes; complete → attempt completed + `competency_evidence` rows; manager
   TechnicianDetail shows the replay with learner reasoning; validation writes attestation.

## Rollback

App: re-publish the previous build (the old client never called these procedures; the old
`completeAttempt` signature is gone, but no old client depends on it). DB: migration 0039 is
additive (tables/indexes/one seed row) — safe to leave in place; to fully revert, drop the
three `ws_*` indexes and the seed row (do not drop tables if any attempts exist).

## Known limitations

- Custom (learner-written) hypotheses can never auto-grade "correct" — correctness matches the
  answer key's hypothesis id; custom root causes route to manager review via the replay.
- Per-event Assessment Spine evidence (the old dead map's ambition) remains out of scope —
  evidence is completion-scoped by design.
- `measurement_predicted` is in the vocabulary but the UI has no prediction input yet.
- No DB transactions (driver setup unchanged); the conditional-update guard covers the
  completion race, and event writes are individually idempotent.
- Feature-flag revocation mid-attempt does not block an already-started attempt's events
  (ownership still enforced); flag is enforced at start.
- Behavioral tests use a scripted fake DB (no real MySQL in CI sandbox); live-DB smoke remains
  a deploy-time step.
