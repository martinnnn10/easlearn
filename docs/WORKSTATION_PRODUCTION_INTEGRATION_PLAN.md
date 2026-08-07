# Workstation Production Integration Plan

**Document version:** 1.0  
**Date:** 2026-07-23  
**Status:** PENDING — Requires Gate 1 PROCEED verdict  
**Prerequisite:** `docs/WORKSTATION_COMMERCIAL_USABILITY_RESULTS.md` verdict = PROCEED

---

## Objective

Integrate the validated workstation prototype into one flagship production lab (Motor Control Troubleshooting) as EASLearn's first commercially-scored diagnostic simulation. The production version must record real learner identity, real attempt data, real meter readings, and real reasoning sequences — with zero demo data, zero fake measurements, and zero prototype controls visible to paying users.

---

## Flagship Lab Selection

| Criterion | Decision |
|-----------|----------|
| Lab name | Motor Control Troubleshooting |
| Initial scenario | `output_on_motor_dead` (strongest diagnostic teaching value) |
| Second scenario (post-validation) | `overload_tripped` |
| Reason | These two scenarios together demonstrate the core commercial distinction: PLC software state vs. physical field voltage |

---

## Production Architecture

### Layout (Desktop)

| Panel | Position | Content |
|-------|----------|---------|
| Machine Twin | LEFT (280px) | Animated conveyor system with clickable components, fault indicators, corrective action button |
| Print / Schematic | CENTER (flex) | Interactive ladder logic with cross-highlighting, rung state indicators |
| Diagnostic Bench | RIGHT (320px) | Meter probe selection, test history, hypothesis management, PLC I/O status |
| Bottom Drawer | BOTTOM (expandable) | Closeout, communication, handoff, evidence summary |

### Layout (Mobile)

Tabbed interface with progressive disclosure. Tabs: Machine, Print, Meter, Diagnosis, Closeout.

---

## Production vs. Prototype Differences

| Aspect | Prototype (`/prototype/workstation`) | Production (`/labs/motor-control-workstation`) |
|--------|--------------------------------------|-----------------------------------------------|
| Identity | Anonymous / no login required | Authenticated learner (ctx.user) |
| Attempt record | None (local state only) | Database-persisted attempt with timestamps |
| Scenario state | Local React state, resets on refresh | Server-managed, resumable within session window |
| Meter readings | Computed locally, not stored | Recorded to database with probe, mode, reading, interpretation, timestamp |
| Safety actions | Local counter only | Persisted as evidence events |
| Reasoning sequence | Local test history array | Persisted timeline with hypothesis state changes |
| Closeout | Visual only | Generates evidence records for Assessment Spine |
| Feedback form | Present (prototype testing) | Removed in production mode |
| Scenario selector | Dropdown visible | Hidden — scenario assigned by lab routing |
| Demo badge | "PROTOTYPE" badge visible | No badge — clean production UI |

---

## Database Schema Additions

### Table: `workstation_attempts`

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, auto) | Attempt identifier |
| user_id | INT (FK → users) | Learner who performed the attempt |
| scenario_id | VARCHAR(64) | Fault scenario identifier |
| lab_id | VARCHAR(64) | Lab context (e.g., "motor-control-troubleshooting") |
| started_at | BIGINT | UTC timestamp (ms) — attempt start |
| completed_at | BIGINT | UTC timestamp (ms) — attempt completion (null if abandoned) |
| fault_cleared | BOOLEAN | Whether corrective action succeeded |
| root_cause_confirmed | BOOLEAN | Whether a hypothesis was marked "confirmed" |
| total_measurements | INT | Count of meter readings taken |
| safety_violations | INT | Count of unsafe measurement attempts |
| methodology_tier | VARCHAR(32) | Computed tier: systematic / guided / exploratory / random |
| diagnosis_correct | BOOLEAN | Whether confirmed hypothesis matches scenario root cause |
| created_at | BIGINT | Record creation timestamp |

### Table: `workstation_events`

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, auto) | Event identifier |
| attempt_id | INT (FK → workstation_attempts) | Parent attempt |
| event_type | ENUM | measurement, hypothesis_change, corrective_action, safety_violation, component_select, closeout |
| timestamp | BIGINT | UTC timestamp (ms) |
| payload | JSON | Event-specific data (probe, mode, reading, interpretation, hypothesis_id, status, etc.) |

### Table: `workstation_evidence`

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, auto) | Evidence identifier |
| attempt_id | INT (FK → workstation_attempts) | Source attempt |
| user_id | INT (FK → users) | Learner |
| evidence_type | VARCHAR(64) | Assessment Spine evidence type |
| competency_id | VARCHAR(64) | Target competency |
| signal | ENUM | positive, negative, neutral |
| weight | DECIMAL(3,2) | Evidence weight (0.00–1.00) |
| metadata | JSON | Supporting context |
| created_at | BIGINT | Record creation timestamp |

---

## Implementation Phases

### Phase 2A: Server-Side Attempt Management (3–4 days)

1. Add `workstation_attempts` and `workstation_events` tables to `drizzle/schema.ts`
2. Create tRPC procedures:
   - `workstation.startAttempt` — creates attempt record, returns attempt_id
   - `workstation.recordEvent` — appends event to attempt timeline
   - `workstation.completeAttempt` — finalizes attempt, computes methodology tier
   - `workstation.getAttempt` — retrieves full attempt for replay
   - `workstation.listAttempts` — user's attempt history for a lab
3. Push migrations: `pnpm db:push`
4. Write vitest tests for each procedure

### Phase 2B: Production UI Shell (2–3 days)

1. Create `/labs/motor-control-workstation` route
2. Fork `WorkstationPrototype.tsx` → `WorkstationProduction.tsx`
3. Remove: scenario selector, prototype badge, feedback form, local-only state
4. Add: attempt lifecycle (start → events → complete), server sync on each measurement
5. Add: loading state while attempt initializes
6. Add: attempt-complete summary screen with evidence preview

### Phase 2C: Methodology Tier Computation (1–2 days)

Compute methodology tier from the event timeline:

| Tier | Criteria |
|------|----------|
| **Systematic** | Measurements follow logical isolation sequence; hypotheses updated after each reading; no unnecessary measurements; root cause confirmed before corrective action |
| **Guided** | Generally logical but with 1–2 unnecessary measurements or delayed hypothesis updates |
| **Exploratory** | Some logical structure but measurements taken without clear hypothesis; eventual correct diagnosis |
| **Random** | No discernible pattern; many unnecessary measurements; guessing |

Algorithm: Score each dimension (sequence logic, hypothesis discipline, measurement efficiency, safety) on 0–3 scale. Sum determines tier.

### Phase 2D: Integration Testing (1–2 days)

1. Complete scenario A and B as test user
2. Verify attempt records persist correctly
3. Verify event timeline matches local replay
4. Verify methodology tier computation matches manual assessment
5. Verify no prototype controls are visible
6. Test attempt resumption within session window
7. Test mobile flow end-to-end

---

## Migration Strategy

| Step | Action | Risk |
|------|--------|------|
| 1 | Deploy schema changes (additive only) | None — new tables, no existing table modifications |
| 2 | Deploy production workstation route behind feature flag | None — prototype remains at `/prototype/workstation` |
| 3 | Internal testing with team accounts | Low — isolated from learners |
| 4 | Enable for pilot cohort (10–25 technicians) | Medium — first real data |
| 5 | Monitor for 1 week, fix issues | Low |
| 6 | Remove feature flag, make available to all paid users | Low — validated by pilot |

---

## What Does NOT Change

- The prototype at `/prototype/workstation` remains unchanged and accessible for continued testing
- The fault engine (`conveyorLab/`) is reused without modification
- The meter system, cross-highlighting, and hypothesis management are identical
- The PLC I/O panel behavior is identical
- No new scoring formulas are introduced
- No time penalties or efficiency scores are added
- The Assessment Spine is not modified — only new evidence records are created (Phase 3)

---

## Success Criteria for Production Integration

1. A real learner can complete both scenarios with their identity recorded
2. The full event timeline is persisted and retrievable
3. Methodology tier is computed automatically and matches manual assessment
4. No demo data or fake measurements exist in the database
5. The production UI is indistinguishable from the prototype in terms of diagnostic workflow
6. Mobile and desktop both work without degradation
7. Attempt data is available for Phase 3 (evidence) and Phase 4 (manager view)
