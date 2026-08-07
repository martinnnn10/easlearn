# Skills Passport — Workstation Competency Mapping

**Document version:** 1.0  
**Date:** 2026-07-23  
**Status:** DESIGN — Defines how workstation evidence flows into the learner's Skills Passport  
**Prerequisite:** Phase 3 evidence generation active

---

## Purpose

The Skills Passport is the learner-facing view of their demonstrated competencies. It shows what they have proven through actual diagnostic performance — not what courses they completed or what videos they watched. The workstation is the primary source of high-weight competency evidence because it captures real diagnostic reasoning under realistic conditions.

---

## Competencies Demonstrated by the Workstation

| Competency | Description | Evidence Sources from Workstation |
|-----------|-------------|-----------------------------------|
| **Motor Control Troubleshooting** | Ability to systematically isolate faults in motor-control circuits using prints, meters, and PLC status | Diagnosis result, methodology tier, measurement sequence, corrective action |
| **Electrical Diagnostic Method** | Structured approach to fault isolation: observe → hypothesize → test → interpret → confirm | Hypothesis management quality, measurement efficiency, evidence-based reasoning |
| **PLC Output Verification** | Understanding that a PLC output bit ON does not prove field voltage exists; ability to verify through measurement | Output terminal probe usage, distinction between software state and measured value |
| **Meter Usage** | Correct selection of probe points, measurement modes, and interpretation of readings | Probe selection accuracy, mode appropriateness, reading interpretation |
| **Safety Judgment** | Maintaining safe work practices during energized troubleshooting | Safety violation count, mode selection appropriateness, lockout awareness |
| **Root-Cause Explanation** | Ability to clearly explain the fault mechanism and repair rationale to others | Written explanation quality (LLM-scored when implemented) |
| **Work-Order Documentation** | Ability to document the fault, diagnosis, and repair in a format useful to others | Written work-order quality (LLM-scored when implemented) |
| **Shift Handoff Communication** | Ability to transfer critical safety and status information to the next shift | Written handoff quality (LLM-scored when implemented) |

---

## Passport Status States

Each competency in the Skills Passport shows one of four states:

| State | Visual | Meaning | Criteria |
|-------|--------|---------|----------|
| **Demonstrated** | Solid emerald badge | Competency verified by evidence and manager | 3+ positive evidence records from systematic/guided attempts + manager validation |
| **Needs More Evidence** | Outline amber badge | Some positive signals but insufficient consistency | Fewer than 3 positive records, or most recent attempt was exploratory/random |
| **Needs Manager Validation** | Solid sky badge | Evidence supports readiness but manager has not confirmed | 3+ positive records from systematic/guided attempts, zero safety concerns |
| **Needs Safety Review** | Solid red badge | Safety concerns must be addressed before positive status | Safety violations in recent attempts; manager must review |

---

## Evidence Accumulation Rules

### Positive Evidence Requirements

A competency requires evidence from **multiple independent attempts** to reach "Needs Manager Validation" status:

| Competency | Minimum Positive Records | Minimum Systematic/Guided Attempts | Additional Requirement |
|-----------|--------------------------|-------------------------------------|----------------------|
| Motor Control Troubleshooting | 3 | 2 | At least 1 correct diagnosis |
| Electrical Diagnostic Method | 3 | 2 | Hypothesis updates in all attempts |
| PLC Output Verification | 2 | 1 | Must have measured output terminal at least once |
| Meter Usage | 3 | 2 | Correct mode selection in all attempts |
| Safety Judgment | 3 | 2 | Zero violations across all counted attempts |
| Root-Cause Explanation | 2 | 1 | LLM score ≥ "adequate" |
| Work-Order Documentation | 2 | 1 | LLM score ≥ "adequate" |
| Shift Handoff Communication | 2 | 1 | LLM score ≥ "adequate" |

### Negative Evidence Effects

| Negative Signal | Effect on Passport |
|----------------|-------------------|
| Incorrect diagnosis (random tier) | Resets positive count for Motor Control Troubleshooting to 0 |
| Safety violation (any) | Triggers "Needs Safety Review" on Safety Judgment |
| 2+ safety violations in one attempt | Triggers "Needs Safety Review" on ALL competencies |
| 3 consecutive exploratory/random attempts | Adds "pattern concern" flag visible to manager |

### Decay Rules

Evidence does not expire on a fixed timeline, but recency matters:

- Evidence older than 90 days is weighted at 0.7× for readiness evaluation
- Evidence older than 180 days is weighted at 0.5×
- Manager can override decay by re-validating based on observed field performance

---

## Learner Passport View

The learner sees their Skills Passport as a clean summary:

### Example Passport Display

```
┌─────────────────────────────────────────────────────────────┐
│  SKILLS PASSPORT — Motor Control Troubleshooting            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ● Motor Control Troubleshooting      [DEMONSTRATED]        │
│    Last demonstrated: Jul 20, 2026 · 4 attempts             │
│                                                             │
│  ● Electrical Diagnostic Method       [DEMONSTRATED]        │
│    Last demonstrated: Jul 20, 2026 · 4 attempts             │
│                                                             │
│  ● PLC Output Verification            [NEEDS VALIDATION]    │
│    Evidence ready · Awaiting manager review                  │
│                                                             │
│  ○ Meter Usage                        [NEEDS MORE EVIDENCE] │
│    2/3 positive records · 1 more systematic attempt needed   │
│                                                             │
│  ● Safety Judgment                    [DEMONSTRATED]        │
│    Last demonstrated: Jul 20, 2026 · Zero violations        │
│                                                             │
│  ○ Root-Cause Explanation             [NEEDS MORE EVIDENCE] │
│    1/2 positive records · Complete 1 more scenario           │
│                                                             │
│  ○ Work-Order Documentation           [NEEDS MORE EVIDENCE] │
│    0/2 positive records · Not yet attempted                  │
│                                                             │
│  ○ Shift Handoff Communication        [NEEDS MORE EVIDENCE] │
│    0/2 positive records · Not yet attempted                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What the Learner Can See

- Their current status for each competency
- How many positive evidence records they have
- What they need to do next to advance
- Their most recent attempt summary (methodology tier, diagnosis result)
- A link to review their reasoning replay for any past attempt

### What the Learner Cannot See

- Raw evidence weights or scoring formulas
- Comparison to other learners
- Manager notes or flags
- Detailed scoring breakdowns (these are for the manager)

---

## Passport → Manager Connection

When a competency reaches "Needs Manager Validation," the manager receives a notification:

> "[Technician Name] has demonstrated sufficient evidence for [Competency Name]. Review their attempts and validate or request additional evidence."

The manager can then:

1. Review the attempt details (see Manager Attempt-Detail View)
2. Validate the competency → moves to "Demonstrated"
3. Request more evidence → remains at "Needs More Evidence" with manager note
4. Flag for safety review → moves to "Needs Safety Review"

---

## Cross-Lab Competency Sharing

Some competencies are demonstrated across multiple labs (when additional workstation scenarios are added):

| Competency | Applicable Labs |
|-----------|-----------------|
| Electrical Diagnostic Method | All workstation labs |
| Meter Usage | All workstation labs |
| Safety Judgment | All workstation labs |
| Motor Control Troubleshooting | Motor Control Workstation only |
| PLC Output Verification | Motor Control Workstation, VFD Workstation (future) |

Evidence from any applicable lab contributes to the competency's evidence portfolio.

---

## What the Skills Passport Does NOT Do

- Does not award competencies from course completion alone
- Does not show numeric scores or percentages
- Does not rank learners against each other
- Does not auto-expire competencies without manager awareness
- Does not create "badges" or gamification elements
- Does not allow self-assessment to count as evidence
- Does not display evidence from prototype-mode attempts (only production)
