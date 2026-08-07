# Motor Control Workstation — Pre-Integration Repository Audit

**Date:** 2026-08-08 · **Auditor:** production-integration session (6 parallel subsystem audits + firsthand reads)
**Base:** branch `claude/workstation-persistence` @ import commit `fdb559a` = `easplatform_17.zip` snapshot of the deployed Manus workspace.

## Repository state

| # | Item | Finding |
|---|------|---------|
| 1 | Current branch | `claude/workstation-persistence` (created for this integration) |
| 2 | Current commit | `fdb559a` — verbatim import of `easplatform_17.zip` (secrets `.project-config.json` and `.manus/` excluded) |
| 3 | Working tree | Clean at audit time |
| 4 | Routes | `/labs/motor-control-workstation` → `MotorControlWorkstation` (App.tsx:153); `/prototype/workstation` → Redirect (App.tsx:154-155). ✔ matches handoff. App.tsx:51 dead-imports `WorkstationPrototype` (unused). |
| 5 | Gameplay component | `client/src/pages/WorkstationPrototype.tsx` (1,354 lines, zero props, zero tRPC, zero localStorage) |
| 6 | DB tables | All 5 exist **as drizzle schema only** (schema.ts:1010-1122). **No SQL migration creates them**; no meta-journal entry; deploy relies on `db:push`. No secondary indexes, no unique constraints, no FKs. |
| 7 | tRPC procedures | Exactly **16** in `server/workstation.ts`, registered at routers.ts:69. ✔ count matches handoff (file-header comment lists only 12 — stale). |
| 8 | Feature flags | `hasWorkstationAccess` (role/user/team) enforced in `checkAccess` + `startAttempt` only. **No admin-role seed exists in the repo** (handoff claims one), and the handoff's SQL runbook uses **wrong column names** (`feature_key/entity_type/entity_id` vs actual `feature/entityType/entityId`) — it would fail if executed. |
| 9 | Attempt creation | `startAttempt` **always inserts** — no resume-or-create; refresh/double-click ⇒ duplicate in_progress attempts. |
| 10 | Event persistence | `recordEvent` exists but **idempotency is broken**: no unique index on `idempotencyKey`, so the `ER_DUP_ENTRY` catch is dead code — duplicates insert freely. `eventType` is free-form; ordering relies on second-precision `occurredAt` only (nondeterministic within a second). **No client code calls it.** |
| 11 | Completion | `completeAttempt` **trusts client-supplied `diagnosisCorrect`/`correctiveActiveCorrect` booleans** and never verifies persisted events — fail-open, not fail-closed. Not idempotent (repeat ⇒ BAD_REQUEST). No transaction: double-complete race double-writes evidence. **No client code calls it.** |
| 12 | Assessment Spine mapping | Completion-time evidence (simulation_completed / diagnosis_submitted / safety_action / live_interaction ×2) writes directly to `competency_evidence`. `EVENT_TO_EVIDENCE` map (ws.ts:102-118) is **dead code**. `validate` hardcodes `domain:"motors"` for **every** competency — safety/electrical/plc attestations mis-filed. |
| 13 | Assignments | Backend works; **MyAssignments CTA is a static link** carrying no assignmentId/scenarioId, and the wrapper reads no params ⇒ assignments can never reach in_progress/completed from the UI. |
| 14 | Manager replay | TechnicianDetail calls real procedures (learnerAttempts/getEvents/getValidations/validate), real authorization, **zero sample data**. But the replay renders only eventType+componentRef+elapsed — **the `detail` JSON with the learner's actual reasoning is never displayed**, and provenance (learner vs simulator vs system) isn't distinguished. |
| 15 | Existing tests | `server/workstation.test.ts`: 29/29 pass but **all are tautological** — literal objects asserted against themselves; no production module is imported. Suite baseline here: 593 counted (555 pass; 38 env-gated failures in 14 DB/secret-dependent files defining ~125 tests ⇒ ~718 in a full env, matching the handoff's claim). tsc clean. |
| 16 | Handoff vs code | Handoff is honest about the headline gap (client wiring absent — its own §"What Was NOT Built"). Verification confirms: **no client code calls any attempt/event/completion procedure.** Additional defects found beyond the handoff: items 6, 8, 9, 10, 11, 12, 13, 14, 15 above. Wrapper's header comment overclaims persistence that isn't implemented. |

## Staleness ruling

The originally checked-out git branches were **stale** (zero workstation code on any branch; `f4d4fb99`-era production was never pushed to GitHub — confirmed again via GitHub API). The uploaded `easplatform_17.zip` **is** the deployed source of truth and was imported verbatim as the working base. All integration happens on top of that snapshot.

## Fix plan executed on this branch

1. **Server:** resume-or-create `startAttempt`; **fail-closed, idempotent, server-derived** `completeAttempt` (grades from persisted events + shared answer key; atomic status guard); deterministic event ordering (occurredAt, id); event-type vocabulary; duplicate pre-check + real unique index; status guard on recordEvent/abandon; per-competency domain mapping in `validate`.
2. **Schema/migration:** unique index on (attemptId, idempotencyKey); secondary indexes; `drizzle/0039_workstation_persistence.sql` creating tables if absent + indexes + guarded admin-role flag seed; handoff runbook SQL corrected.
3. **Client:** `useWorkstationPersistence` hook (attempt bootstrap/resume, serial event queue with client UUIDs + retry + honest failure UI, debounced autosave, completion gate that drains the queue first); gameplay hooks for every meaningful interaction; diagnosis/closeout submission + completion UI; assignment param plumbing; replay detail rendering with provenance tags.
4. **Tests:** behavioral tests that invoke the real router via `createCaller` with a scripted fake DB (resume, idempotency, fail-closed gate, ordering, authorization, evidence derivation, repeat-completion).
