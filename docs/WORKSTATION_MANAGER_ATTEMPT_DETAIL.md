# Manager Attempt-Detail View — Design Specification

**Document version:** 1.0  
**Date:** 2026-07-23  
**Status:** DESIGN — Requires Phase 2 production data before implementation  
**Purpose:** Define the manager-facing view that answers: "Can this technician troubleshoot systematically?"

---

## Design Philosophy

The Manager Dashboard does not show vanity scores or meaningless completion percentages. It shows **what the technician actually did** — what they tested, what they assumed, whether they worked safely, and whether they can explain the repair. The manager should be able to answer six questions from this view:

1. Can this technician troubleshoot systematically?
2. Are they guessing?
3. Do they understand PLC state versus physical voltage?
4. Do they work safely?
5. Can they document and explain the repair?
6. Are they ready for independent work?

---

## Dashboard List View

The manager sees a table of all workstation attempts across their team:

| Column | Content | Sort/Filter |
|--------|---------|-------------|
| Technician | Name + avatar | Filter by individual |
| Scenario | Fault scenario name | Filter by scenario |
| Attempt Date | Formatted date/time | Sort (newest first) |
| Diagnosis | Correct / Incorrect / Incomplete | Filter |
| Methodology | Systematic / Guided / Exploratory / Random | Filter |
| Safety | Clean / 1 violation / 2+ violations | Filter |
| Reasoning | Strong / Adequate / Weak | Derived from evidence |
| Tests | Count of measurements taken | Sort |
| Time | Duration from start to completion | Sort |
| Readiness | Ready / Needs more / Needs review | Filter |

### Row Styling

| Methodology Tier | Row Accent |
|-----------------|------------|
| Systematic | Left border: emerald |
| Guided | Left border: sky |
| Exploratory | Left border: amber |
| Random | Left border: red |

Safety violations override: any row with 2+ violations gets a red background tint regardless of methodology tier.

---

## Attempt Detail View — "What the Technician Did"

When the manager clicks a row, they see the full attempt detail. This is the core commercial value of the workstation — it shows the technician's actual diagnostic reasoning, not just a pass/fail result.

### Header Section

| Field | Content |
|-------|---------|
| Technician | Name, role, experience level |
| Scenario | Fault name + brief description |
| Date/Time | When the attempt occurred |
| Duration | Total time from start to completion |
| Result | Diagnosis correct/incorrect + fault cleared yes/no |
| Methodology Tier | Badge with color coding |
| Safety Status | Clean or violation count with details |

### Timeline Section

The timeline shows every significant action in chronological order, with elapsed time from attempt start:

| Time | Event Type | Detail |
|------|-----------|--------|
| +0s | **Observation** | Learner viewed machine state — identified symptom |
| +12s | **Component Selected** | Clicked contactor K1 on machine view |
| +18s | **Cross-Highlight** | Noticed ladder logic rung 6 highlighted |
| +35s | **Meter Test** | Probe: K1 A1–A2, Mode: VDC |
| +35s | **Reading** | ~24 VDC (coil energized) |
| +42s | **Interpretation** | "Control power reaches coil — coil is energized" |
| +48s | **Hypothesis Change** | "Open control circuit" → eliminated |
| +55s | **Meter Test** | Probe: K1 Aux 13–14, Mode: Continuity |
| +55s | **Reading** | OPEN |
| +62s | **Interpretation** | "Contactor did not pull in mechanically" |
| +68s | **Hypothesis Change** | "Contactor mechanical failure" → confirmed |
| +75s | **Corrective Action** | Replace contactor — applied |
| +76s | **Repair Verified** | Belt running — fault cleared |
| +90s | **Closeout** | Completed |

### Timeline Event Styling

| Event Type | Icon | Color |
|-----------|------|-------|
| Observation | Eye | zinc-400 |
| Component Selected | MousePointer | zinc-400 |
| Cross-Highlight | Link | sky-400 |
| Meter Test | Zap | amber-400 |
| Reading | Gauge | amber-400 |
| Interpretation | Brain | emerald-400 |
| Hypothesis Change | GitBranch | sky-400 |
| Corrective Action | Wrench | emerald-400 |
| Repair Verified | CheckCircle | emerald-500 |
| Safety Violation | AlertTriangle | red-500 |
| Closeout | FileCheck | zinc-300 |

### Evidence Summary Section

Below the timeline, show the evidence records generated from this attempt:

| Competency | Evidence Type | Signal | Weight | Note |
|-----------|--------------|--------|--------|------|
| Motor Control Troubleshooting | diagnosis_submitted | Positive | 0.9 | Correct root cause identified |
| Electrical Diagnostic Method | reasoned_answer | Positive | 0.8 | Hypotheses updated after each measurement |
| PLC Output Verification | live_interaction | Positive | 0.9 | Distinguished software state from field voltage |
| Meter Usage | live_interaction | Positive | 0.7 | Correct probe and mode selection |
| Safety Judgment | safety_action | Positive | 0.8 | Zero violations |

### Manager Actions

The manager can take these actions from the attempt detail view:

| Action | Effect |
|--------|--------|
| **Validate Readiness** | Marks the technician as "manager-validated" for the relevant competencies |
| **Flag for Review** | Marks the attempt as needing discussion with the technician |
| **Add Note** | Manager can add a private annotation to the attempt |
| **Request Safety Review** | Triggers a safety review requirement before the technician can attempt again |

---

## Methodology Tier Computation (Visible to Manager)

The manager can expand a "How was this tier determined?" section that shows:

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Sequence Logic | 3/3 | Measurements followed logical isolation: coil → aux → corrective |
| Hypothesis Discipline | 3/3 | Updated hypotheses after each reading; confirmed before repair |
| Measurement Efficiency | 2/3 | 2 measurements to confirm (optimal for this scenario is 2) |
| Safety | 3/3 | Zero violations; correct mode selection |
| **Total** | **11/12** | **Tier: Systematic** |

Tier thresholds:

| Score Range | Tier |
|-------------|------|
| 10–12 | Systematic |
| 7–9 | Guided |
| 4–6 | Exploratory |
| 0–3 | Random |

---

## Communication Quality (Future — Phase 3+)

When operator communication, work-order documentation, and shift handoff are implemented, the attempt detail will also show:

| Communication Element | Quality Rating | Key Excerpt |
|----------------------|---------------|-------------|
| Operator Explanation | Strong | "The contactor coil was energized but the mechanical linkage failed..." |
| Work Order | Adequate | Included fault description and repair action; missing part number |
| Shift Handoff | Strong | "Motor is back online. Replaced K1 contactor due to mechanical failure..." |

These are LLM-scored with the full text available for manager review.

---

## What the Manager Should NOT See

- Arbitrary numeric scores (no "87/100")
- Comparison to other technicians
- Time penalties or speed rankings
- AI-generated personality assessments
- Predicted failure rates
- Gamification elements (badges, streaks, leaderboards)

The view is purely factual: here is what happened, here is the evidence, here is the methodology assessment, here is whether safety was maintained.

---

## Aggregate Team View

In addition to individual attempt details, the manager sees a team summary:

| Technician | Attempts | Systematic % | Safety Clean % | Readiness Status |
|-----------|----------|-------------|---------------|-----------------|
| Ray D. | 4 | 75% (3/4) | 100% | Ready — needs validation |
| Nina A. | 3 | 67% (2/3) | 100% | Needs more evidence |
| Owen P. | 2 | 0% (0/2) | 50% | Needs safety review |

This answers the manager's primary question: "Who is ready for independent troubleshooting, and who needs more practice?"
