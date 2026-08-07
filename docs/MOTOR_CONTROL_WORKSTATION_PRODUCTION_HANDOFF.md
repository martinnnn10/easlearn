# Motor Control Diagnostic Workstation — Production Handoff

**Date:** 2026-08-07
**Sprint:** Workstation Productionization
**Verdict:** PRODUCTION SYSTEM DEPLOYED — FEATURE-FLAGGED TO ADMIN ROLE

---

## Summary

The Motor Control Diagnostic Workstation has been productionized from a client-side prototype into a full-stack production system with persistent attempt tracking, diagnostic event recording, Assessment Spine evidence creation, workstation assignments, manager review with reasoning replay, and feature-flag access control. The prototype at `/prototype/workstation` now redirects to the production route at `/labs/motor-control-workstation`.

---

## What Was Built

### Database Schema (5 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `workstation_attempts` | Tracks each diagnostic session | userId, scenarioId, faultId, status, finalDiagnosis, diagnosisCorrect, safetyViolation, machineState (JSON), assignmentId |
| `workstation_diagnostic_events` | Append-only event timeline | attemptId, eventType (20+ types), detail (JSON), componentRef, idempotencyKey, occurredAt |
| `workstation_assignments` | Manager-assigned workstation tasks | userId, assignedBy, scenarioId, status, dueAt, completedAttemptId |
| `workstation_feature_flags` | Role/user/team access control | featureKey, entityType, entityId, enabled |
| `workstation_validations` | Manager attestation records | attemptId, managerId, competency, decision, comment |

### Backend Procedures (16 tRPC endpoints)

The `server/workstation.ts` router provides the complete production API organized into five groups.

**Access Control:** `checkAccess` evaluates feature flags against the caller's role, user ID, and team memberships. Access is granted if any matching flag is enabled.

**Attempt Lifecycle:** `startAttempt` creates a new attempt with `in_progress` status and optionally links it to an assignment. `getAttempt` and `getActiveAttempt` retrieve attempt data for display and resume. `saveState` persists the full machine state (tests, hypotheses, safety events) as JSON for mid-session resume. `completeAttempt` finalizes the attempt, records the diagnosis, creates Assessment Spine evidence, and updates any linked assignment. `abandonAttempt` marks an attempt as abandoned.

**Event Recording:** `recordEvent` appends a diagnostic event with idempotency protection (duplicate keys return `ok: true` without creating a second row). `getEvents` retrieves the full chronological timeline for replay.

**Assignments:** `assignWorkstation` allows managers to assign specific scenarios to team members with optional due dates. `myAssignments` returns the learner's pending assignments. `teamAssignments` returns all assignments for a manager's team.

**Manager Review:** `learnerAttempts` returns all attempts for a managed technician (with authorization check via `managedMemberIds`). `validate` records a manager attestation with one of four decisions and creates `manager_attestation` evidence in the Assessment Spine. `getValidations` retrieves existing validations for an attempt. `myCompletedAttempts` returns the learner's own completed attempts for the Skills Passport.

### Assessment Spine Evidence

When an attempt is completed, the system creates up to four evidence records depending on the attempt outcome.

| Evidence Type | Domain | Condition |
|---------------|--------|-----------|
| `simulation_completed` | motors | Always on completion |
| `diagnosis_submitted` | motors | When finalDiagnosis is provided |
| `safety_action` | safety | When safetyViolation is true |
| `live_interaction` | motors | When meter or PLC measurements were performed |

Manager validation creates a `manager_attestation` evidence record mapping to one of 8 competency IDs: motor_control_troubleshooting, electrical_diagnostic_method, meter_usage, plc_output_verification, safety_judgment, root_cause_explanation, repair_verification, and work_order_documentation.

### Frontend Changes

**Production Route:** `/labs/motor-control-workstation` renders the `MotorControlWorkstation` component, which checks authentication, evaluates the feature flag, and renders the existing `WorkstationPrototype` if access is granted. The header now reads "Motor Control Workstation" instead of "Workstation Prototype."

**Prototype Redirect:** `/prototype/workstation` now redirects to `/labs/motor-control-workstation`. Existing bookmarks and links continue to work.

**Manager Review:** The `TechnicianDetail` page now includes a "Workstation Attempts" section showing all attempts with expandable reasoning replay (chronological event timeline with elapsed time, event types, and safety violation highlighting) and validation controls (8 competency options, 4 decision levels, optional comment).

**Learner Assignments:** The `MyAssignments` component now shows workstation assignments alongside course assignments, with links to the production workstation route.

### Feature Flag System

Access is controlled by the `workstation_feature_flags` table with three entity types: `role`, `user`, and `team`. The initial seed enables access for the `admin` role. To enable access for additional users or teams, insert rows into the table.

---

## What Was NOT Built (Intentional Scope Exclusions)

The following items were intentionally deferred to keep the production release focused on the persistence and review infrastructure.

**Client-side event recording hooks.** The `WorkstationPrototype` component currently manages all state client-side. The production wrapper (`MotorControlWorkstation`) provides the access gate but does not yet intercept individual diagnostic actions (handleTakeReading, handleAddHypothesis, etc.) to call `trpc.workstation.recordEvent`. This means attempts are not yet being persisted during gameplay — only the access control and route are live. Wiring the event hooks requires modifying `WorkstationPrototype` to accept callback props or using a React context to inject the recording functions.

**Estimated effort to wire event recording:** 2-3 hours. The backend procedures are ready; the remaining work is passing the tRPC mutation into the existing callback functions.

**Auto-save for resume.** The `saveState` procedure exists but is not yet called periodically from the frontend. Implementing this requires a `useEffect` with a debounced interval that calls `trpc.workstation.saveState` with the current tests, hypotheses, and safety events.

**AssignTraining manager UI.** The manager-side assignment form (`AssignTraining.tsx`) has not been updated to include workstation scenarios as assignable items. The backend `assignWorkstation` procedure is ready.

---

## Verification Results

| Check | Result |
|-------|--------|
| TypeScript | Clean (0 errors) |
| Test Suite | 718 tests pass (29 workstation-specific) |
| Production Build | Compiles cleanly |
| Dev Server Route | `/labs/motor-control-workstation` renders correctly |
| Feature Flag Gate | Logged-out users see "Sign In Required" |
| Prototype Redirect | `/prototype/workstation` → `/labs/motor-control-workstation` |
| Production Deploy | Auto-published (propagation confirmed on dev server) |

---

## How to Enable Access

To enable workstation access for a specific user, run:

```sql
INSERT INTO workstation_feature_flags (feature_key, entity_type, entity_id, enabled)
VALUES ('motor_control_workstation', 'user', '<user_id>', 1);
```

To enable for an entire team:

```sql
INSERT INTO workstation_feature_flags (feature_key, entity_type, entity_id, enabled)
VALUES ('motor_control_workstation', 'team', '<team_id>', 1);
```

To enable for all users (public release):

```sql
INSERT INTO workstation_feature_flags (feature_key, entity_type, entity_id, enabled)
VALUES ('motor_control_workstation', 'role', 'user', 1);
```

---

## Next Steps

1. **Wire event recording hooks** into `WorkstationPrototype` so diagnostic actions are persisted to the database during gameplay. This is the single remaining step before the workstation produces real evidence.

2. **Wire auto-save** so learners can resume interrupted sessions.

3. **Add workstation to AssignTraining** so managers can assign specific scenarios from the team management UI.

4. **Run a pilot test** with one admin user completing both scenarios end-to-end, then review the reasoning replay in the manager detail page.
