# Workstation Commercial Usability Validation — Results Framework

**Document version:** 1.0  
**Date:** 2026-07-23  
**Status:** FRAMEWORK READY — Awaiting live technician sessions  
**Prototype URL:** https://easlearn.org/prototype/workstation

---

## Executive Summary

This document defines the structured usability validation framework for the Unified Technician Workstation prior to production integration. The workstation must demonstrate that working technicians can complete realistic fault-isolation tasks without coaching, that the diagnostic workflow feels natural, and that the recorded evidence has commercial value for managers.

---

## Participant Requirements

| Slot | Role | Experience Level | Purpose |
|------|------|-----------------|---------|
| P1 | Experienced industrial maintenance technician | 10+ years motor-control troubleshooting | Validates realism and workflow accuracy |
| P2 | Developing maintenance technician | 2–5 years, still building diagnostic confidence | Validates learnability and progressive disclosure |
| P3 | Controls / industrial electrical technician | PLC-focused, strong on logic but less mechanical | Validates PLC-state-vs-field-voltage teaching |
| P4 (optional) | Maintenance manager | Supervises technicians, evaluates readiness | Validates manager evidence value |

Each participant must complete **both** scenarios uncoached:

1. `overload_tripped` — Protection circuit isolation
2. `output_on_motor_dead` — PLC state vs. physical voltage distinction

---

## Observation Protocol

### Session Structure

Each session follows this structure:

1. **Pre-briefing** (2 min): Read the standard briefing script. Do not explain the interface.
2. **Scenario A** (target: 5 min): Observe and record. No coaching.
3. **Scenario B** (target: 8 min): Observe and record. No coaching.
4. **Post-test interview** (10 min): Semi-structured questions.
5. **Feedback form** (2 min): Participant completes the in-app feedback form.

### Recording Checklist

For each participant and each scenario, record:

| Observation | Scenario A | Scenario B |
|-------------|-----------|-----------|
| First action taken | | |
| Was the symptom immediately clear? | | |
| Did they understand machine ↔ schematic relationship? | | |
| Did meter lead placement feel natural? | | |
| Did they understand PLC state vs. field voltage? | | |
| Unnecessary measurements (list) | | |
| Incorrect assumptions (list) | | |
| Panel or tab confusion (describe) | | |
| Was test history useful to them? | | |
| Was reasoning replay useful to them? | | |
| Did the workflow feel realistic? (1–10) | | |
| What they expected but could not do | | |
| Time to first measurement (seconds) | | |
| Time to root cause confirmation (seconds) | | |
| Time to fault cleared (seconds) | | |
| Total measurements taken | | |
| Safety violations (count) | | |

---

## Issue Classification

After all sessions, classify every observed issue:

| Priority | Definition | Action |
|----------|-----------|--------|
| **P0** | Blocks diagnosis — participant cannot complete the scenario | Must fix before production |
| **P1** | Repeated confusion — 2+ participants hit the same friction point | Must fix before production |
| **P2** | Polish — single participant noted, does not block completion | Fix if low-effort |
| **P3** | Personal preference — one person's opinion, not repeated | Document only, do not implement |

### Classification Rules

- A single participant's frustration is **not** a P0 unless it literally prevents completion.
- "I would prefer X" from one person is always P3 unless corroborated.
- If 3+ participants independently struggle with the same element, it is automatically P1.
- Any issue that causes a participant to give up or request help is P0.

---

## Results Template

### Participant Summary

| ID | Role | Experience | Scenario A Time | Scenario B Time | Realism Score | Key Finding |
|----|------|-----------|----------------|----------------|---------------|-------------|
| P1 | | | | | /10 | |
| P2 | | | | | /10 | |
| P3 | | | | | /10 | |
| P4 | | | | | /10 | |

### Issue Register

| # | Priority | Description | Participants Affected | Proposed Fix | Effort |
|---|----------|-------------|----------------------|--------------|--------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

### Positive Findings

Document what worked well — these are commercial proof points:

| Finding | Participants Who Demonstrated | Commercial Value |
|---------|------------------------------|-----------------|
| | | |

---

## Gate 1 Verdict Criteria

After completing all sessions, issue exactly one verdict:

### PROCEED

All of the following must be true:

- At least 3/4 participants complete both scenarios without coaching
- At least 3/4 participants correctly distinguish PLC software state from measured field voltage
- Zero P0 issues remain open
- No more than 2 P1 issues remain (and fixes are scoped)
- Average realism score is 6/10 or higher
- At least 2/4 participants spontaneously say the workstation is better than their current training

### REVISE

- Architecture fundamentally works (participants understand the three-panel layout)
- But 3+ P1 issues exist that cause repeated confusion
- Fix P0/P1 issues, re-test with 2 new participants, then re-evaluate

### REJECT

- Participants require coaching to complete scenarios
- The workstation slows diagnosis compared to working without it
- Fundamental layout or interaction model is wrong
- Requires architectural redesign, not polish

---

## Post-Verdict Actions

| Verdict | Next Step |
|---------|-----------|
| PROCEED | Begin Phase 2 — Production Integration |
| REVISE | Fix P0/P1, schedule Round 2 with fresh participants |
| REJECT | Conduct root-cause analysis on architectural failure, redesign before retry |

---

## Appendix: Facilitator Anti-Patterns

Do NOT:

- Explain the interface before the participant starts
- Point to buttons or panels when the participant is stuck
- Say "try clicking there" or "that's the meter tab"
- Interpret silence as confusion (give them 30 seconds before noting hesitation)
- Add features based on one person's suggestion during the session
- Promise changes during the session ("we'll fix that")

DO:

- Ask "what are you looking for?" when they seem stuck (after 30s)
- Note the exact moment and context of any confusion
- Record verbatim quotes when participants express frustration or delight
- Time every significant action with a stopwatch
- Let them fail — failure data is more valuable than coached success
