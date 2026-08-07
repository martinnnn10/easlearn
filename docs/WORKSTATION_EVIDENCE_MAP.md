# Workstation Assessment Spine Evidence Map

**Document version:** 1.0  
**Date:** 2026-07-23  
**Status:** DESIGN — Maps workstation actions to existing Assessment Spine evidence types  
**Prerequisite:** Phase 2 production integration complete

---

## Principle

The workstation does not create a new scoring model. It generates evidence records using the existing Assessment Spine evidence types. Each workstation action maps to one or more evidence types that already exist in the platform's competency framework.

---

## Core Rules

1. **Completion does not equal mastery.** Finishing a scenario generates evidence but does not automatically award competency.
2. **One lucky diagnosis does not create readiness.** Multiple consistent demonstrations are required.
3. **Unsafe behavior overrides positive signals.** A single safety violation can negate an otherwise systematic diagnosis.
4. **Evidence is additive.** Each attempt adds to the learner's evidence portfolio; it never erases previous evidence.
5. **Manager validation is required for readiness.** The system recommends readiness; the manager confirms it.

---

## Evidence Type Mapping

### From Measurement Actions

| Workstation Action | Evidence Type | Signal Logic | Weight |
|-------------------|--------------|--------------|--------|
| Meter reading with correct interpretation | `live_interaction` | Positive if interpretation correctly links reading to hypothesis | 0.7 |
| Meter reading without interpretation | `live_interaction` | Neutral — measurement taken but no reasoning recorded | 0.3 |
| Unnecessary measurement (does not advance diagnosis) | `live_interaction` | Negative — indicates guessing rather than systematic isolation | 0.4 |
| PLC output terminal measurement (distinguishes software from field) | `live_interaction` | Strong positive — demonstrates critical conceptual understanding | 0.9 |

### From Hypothesis Management

| Workstation Action | Evidence Type | Signal Logic | Weight |
|-------------------|--------------|--------------|--------|
| Hypothesis correctly eliminated based on evidence | `prediction` | Positive — demonstrates evidence-based reasoning | 0.8 |
| Hypothesis correctly confirmed as root cause | `diagnosis_submitted` | Positive — correct root cause identification | 0.9 |
| Hypothesis confirmed but incorrect | `diagnosis_submitted` | Negative — false confidence in wrong conclusion | 0.8 |
| Hypothesis updated after each measurement | `reasoned_answer` | Positive — demonstrates iterative reasoning | 0.6 |
| Hypotheses never updated despite evidence | `reasoned_answer` | Negative — ignoring evidence | 0.7 |

### From Safety Actions

| Workstation Action | Evidence Type | Signal Logic | Weight |
|-------------------|--------------|--------------|--------|
| No safety violations throughout scenario | `safety_action` | Positive — safe work practices maintained | 0.8 |
| Safety violation attempted (blocked by system) | `safety_action` | Negative — attempted unsafe measurement | 1.0 |
| Multiple safety violations in one attempt | `safety_action` | Strong negative — pattern of unsafe behavior | 1.0 |

### From Corrective Action

| Workstation Action | Evidence Type | Signal Logic | Weight |
|-------------------|--------------|--------------|--------|
| Corrective action applied after confirmed hypothesis | `action_choice` | Positive — repair follows confirmed diagnosis | 0.8 |
| Corrective action applied without confirming hypothesis | `action_choice` | Negative — repair without diagnosis (parts-swapping) | 0.7 |
| Repair verification (belt running confirmed) | `simulation_completed` | Positive — verified repair success | 0.6 |

### From Communication (Future — Phase 3+)

| Workstation Action | Evidence Type | Signal Logic | Weight |
|-------------------|--------------|--------------|--------|
| Operator explanation of fault and repair | `ai_operator_communication` | Scored by LLM for clarity and accuracy | 0.7 |
| Work-order documentation quality | `ai_work_order_documentation` | Scored by LLM for completeness | 0.7 |
| Shift handoff communication | `ai_shift_handoff` | Scored by LLM for safety and context transfer | 0.7 |
| Root-cause explanation (written) | `ai_root_cause_explanation` | Scored by LLM for technical accuracy | 0.8 |
| Reflection on diagnostic process | `ai_reflection` | Scored by LLM for self-awareness and learning | 0.5 |

---

## Competency Targets

Each evidence record targets a specific competency. The workstation generates evidence for these competencies:

| Competency ID | Competency Name | Primary Evidence Sources |
|---------------|----------------|--------------------------|
| `motor-control-troubleshooting` | Motor Control Troubleshooting | Diagnosis result, methodology tier, measurement sequence |
| `electrical-diagnostic-method` | Electrical Diagnostic Method | Hypothesis management, measurement efficiency, isolation logic |
| `plc-output-verification` | PLC Output Verification | Output terminal measurement, PLC state vs. field voltage distinction |
| `meter-usage` | Meter Usage | Probe selection, mode selection, reading accuracy |
| `safety-judgment` | Safety Judgment | Safety violations (or absence thereof) |
| `root-cause-explanation` | Root-Cause Explanation | Written explanation quality (LLM-scored) |
| `work-order-documentation` | Work-Order Documentation | Written work-order quality (LLM-scored) |
| `shift-handoff-communication` | Shift Handoff Communication | Written handoff quality (LLM-scored) |

---

## Evidence Generation Flow

```
Learner completes workstation scenario
         │
         ▼
┌─────────────────────────────────┐
│  Attempt record finalized       │
│  (workstation_attempts table)   │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Event timeline analyzed        │
│  (workstation_events table)     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Methodology tier computed      │
│  (systematic / guided /         │
│   exploratory / random)         │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Evidence records generated     │
│  (workstation_evidence table)   │
│  One per competency per signal  │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Assessment Spine updated       │
│  (existing competency model)    │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Readiness status evaluated     │
│  (needs more evidence /         │
│   needs manager validation /    │
│   demonstrated)                 │
└─────────────────────────────────┘
```

---

## Methodology Tier → Evidence Weight Modifier

The computed methodology tier modifies the weight of all evidence from that attempt:

| Methodology Tier | Weight Modifier | Rationale |
|-----------------|----------------|-----------|
| Systematic | 1.0× | Full evidence weight — demonstrated structured reasoning |
| Guided | 0.8× | Slight reduction — mostly logical but with gaps |
| Exploratory | 0.5× | Significant reduction — some reasoning but inconsistent |
| Random | 0.2× | Minimal evidence value — guessing does not demonstrate competency |

Example: A correct diagnosis (`weight: 0.9`) from a "random" methodology attempt produces effective evidence weight of `0.9 × 0.2 = 0.18` — nearly negligible. The same correct diagnosis from a "systematic" attempt produces `0.9 × 1.0 = 0.9`.

This ensures that lucky guesses do not create false readiness signals.

---

## Safety Override Logic

Safety violations trigger an override that caps the maximum positive evidence from an attempt:

| Safety Status | Override Effect |
|---------------|----------------|
| Zero violations | No override — full evidence generated |
| 1 violation | All positive evidence from this attempt capped at 0.5 weight |
| 2+ violations | All positive evidence from this attempt nullified (weight → 0) |
| Pattern (3+ attempts with violations) | Triggers "needs safety review" status on all related competencies |

This ensures that unsafe behavior cannot be compensated by correct diagnosis.

---

## Readiness Evaluation Rules

A competency moves through these states:

| State | Criteria |
|-------|----------|
| **Needs more evidence** | Fewer than 3 positive evidence records, or most recent attempt was "random" tier |
| **Needs manager validation** | 3+ positive evidence records from "systematic" or "guided" attempts, zero unresolved safety concerns |
| **Demonstrated** | Manager has validated the competency based on evidence review |
| **Needs safety review** | Safety violations detected in recent attempts — manager must review before any positive status |

---

## What This Map Does NOT Do

- Does not introduce new evidence types (uses existing Assessment Spine types only)
- Does not create time-based penalties or efficiency scores
- Does not compare learners to each other (evidence is individual)
- Does not auto-award mastery from a single attempt
- Does not store AI-generated scores without human review opportunity
- Does not create evidence from the prototype — only from production workstation attempts
