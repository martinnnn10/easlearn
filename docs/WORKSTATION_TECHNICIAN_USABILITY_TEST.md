# Workstation Prototype — Technician Usability Test Protocol

**Document version:** 1.0  
**Date:** 2026-07-23  
**Prototype URL:** `/prototype/workstation`

---

## Purpose

Validate whether the workstation layout supports real-world motor-control troubleshooting by observing working technicians perform fault isolation tasks. The prototype must generalize across fault types without requiring fault-specific UI modifications.

---

## Test Scenarios

| # | Scenario | Fault ID | Primary Diagnostic Challenge |
|---|----------|----------|------------------------------|
| A | Overload Trip | `overload_tripped` | Protection circuit isolation — verify OL NC contact state before resetting |
| B | Output ON / Motor Dead | `output_on_motor_dead` | PLC state vs. real-world voltage — distinguish software command from field power |

---

## Participant Criteria

| Attribute | Requirement |
|-----------|-------------|
| Role | Industrial electrician, controls technician, or maintenance technician |
| Experience | Minimum 2 years troubleshooting motor-control circuits |
| Familiarity | Comfortable reading PLC ladder logic and using a multimeter |
| Exclusion | No prior exposure to this prototype |

---

## Pre-Test Briefing (Read to Participant)

> "You are a maintenance technician called to a conveyor that has stopped running. The operator has reported the symptom shown in the header badge. Your job is to isolate the fault, take measurements to confirm your hypothesis, and perform the corrective action. Use the workstation tools as you would in the field. Think aloud as you work."

---

## Task Script

### Scenario A — Overload Trip

1. Identify the reported symptom from the header badge.
2. Inspect the Machine View to identify which device shows a fault state.
3. Use the Print panel to identify which PLC rungs are affected.
4. Take at least one meter measurement to confirm the overload NC contact state.
5. Record your interpretation of the measurement.
6. Update your hypothesis status (supported/eliminated/confirmed).
7. Perform the corrective action.
8. Verify the machine state changed (belt running).
9. Complete the closeout.

### Scenario B — Output ON / Motor Dead

1. Identify the reported symptom from the header badge.
2. Inspect the PLC I/O Status panel — note the distinction between software state and measured values.
3. Identify that the PLC output bit is ON but the motor is not running.
4. Form an initial hypothesis about where the break exists (PLC output stage, control circuit, or power/motor).
5. Take measurements in the following conceptual sequence:
   - Contactor coil A1–A2 voltage (verify control power reaches the coil)
   - Contactor auxiliary contacts (verify mechanical state)
   - Overload NC contacts (verify power path continuity)
6. Record interpretations for each measurement.
7. Update hypothesis statuses as evidence accumulates.
8. Confirm the root cause (contactor mechanical failure — coil energizes but contacts do not close).
9. Perform the corrective action.
10. Verify the machine state changed.
11. Complete the closeout.

---

## Observation Metrics

### Primary Metrics (Timed)

| Metric | Description | Target |
|--------|-------------|--------|
| Time to first hypothesis | Seconds from page load to first hypothesis status change | < 60s |
| Time to first measurement | Seconds from page load to first meter reading | < 90s |
| Time to root cause confirmation | Seconds from page load to hypothesis marked "confirmed" | < 300s |
| Time to fault cleared | Seconds from page load to corrective action success | < 360s |
| Total measurements taken | Count of meter readings before confirmation | ≤ 5 (Scenario A), ≤ 8 (Scenario B) |

### Secondary Metrics (Observed)

| Metric | Description |
|--------|-------------|
| Cross-highlight discovery | Did participant click a physical device and notice the print highlight? (Y/N) |
| Print-to-physical discovery | Did participant click a ladder element and notice the device highlight? (Y/N) |
| PLC I/O panel comprehension | Did participant distinguish "software state" from "measured value" badges? (Y/N) |
| Zone navigation | Did participant use zone grouping to narrow hypotheses? (Y/N) |
| Safety violation | Did participant attempt an unsafe measurement? (Y/N, count) |
| Interpretation quality | Did interpretations correctly link measurements to hypothesis elimination? (1-5 scale) |
| Closeout completeness | Did participant fill all closeout fields? (Y/N) |

---

## Post-Test Questions (Semi-Structured)

1. **Layout comprehension:** "Walk me through how you used each panel. Was anything unclear about where to find information?"

2. **Cross-highlighting:** "Did you notice that clicking a device highlighted something in the ladder logic? Was that helpful or distracting?"

3. **PLC I/O panel:** "The PLC I/O panel shows both software state and measured values. Did you find the distinction clear? Did it change how you approached the diagnosis?"

4. **Hypothesis management:** "How did you decide when to mark a hypothesis as eliminated vs. weakened? Was the zone grouping helpful for organizing your thinking?"

5. **Measurement workflow:** "Was the meter lead placement intuitive? Would you have wanted to measure anything that wasn't available?"

6. **Mobile (if tested):** "On the phone version, did the progressive hypothesis disclosure (Show all 9) feel natural? Was the context bar sufficient to maintain situational awareness?"

7. **Missing tools:** "What tools or information would you normally have in the field that were missing here?"

8. **Realism:** "On a scale of 1–10, how realistic was this compared to actual troubleshooting? What would make it more realistic?"

---

## Facilitator Notes

### What to Watch For

- **Confusion about PLC state vs. field state:** If the participant assumes the PLC output ON means voltage exists at the terminal, note this as a teaching opportunity the platform should address.

- **Measurement sequence:** Does the participant follow a logical isolation sequence (half-split, upstream-to-downstream) or take random measurements?

- **Safety awareness:** Does the participant check the safety status before measuring? Do they attempt continuity on energized circuits?

- **Hypothesis discipline:** Does the participant update hypotheses based on evidence, or ignore the hypothesis panel entirely?

- **Zone comprehension:** Does the participant understand that Zone 1 (PLC/Output) must be cleared before investigating Zone 2 (Control Circuit)?

### Common Failure Modes

| Failure | Indicates |
|---------|-----------|
| Participant ignores PLC I/O panel | Panel placement or labeling needs improvement |
| Participant cannot find corrective action button | Button placement or visibility issue |
| Participant does not record interpretations | Workflow friction — too many clicks |
| Participant confused by hypothesis status cycling | Status model too complex for single-click |
| Participant cannot distinguish zones | Zone labels need clearer industrial terminology |

---

## Success Criteria

The workstation prototype passes usability validation if:

1. **≥ 4/5 participants** complete Scenario A within 5 minutes without facilitator intervention.
2. **≥ 3/5 participants** complete Scenario B within 8 minutes without facilitator intervention.
3. **≥ 4/5 participants** correctly distinguish PLC software state from measured field voltage in Scenario B.
4. **Zero participants** are confused about which panel to use for which task (machine view vs. print vs. meter).
5. **≥ 3/5 participants** use cross-highlighting without being told it exists.
6. **Post-test realism score** averages ≥ 6/10 across all participants.

---

## Iteration Plan

| Round | Participants | Focus |
|-------|-------------|-------|
| 1 | 3 technicians | Layout comprehension, critical usability blockers |
| 2 | 3 technicians | Refined UI based on Round 1 findings |
| 3 | 5 technicians | Statistical validation of success criteria |

---

## Precise Fault Model Documentation

### Scenario A: overload_tripped

**Root cause:** Thermal overload relay (OL1) has tripped due to excessive motor current draw.

**Engine behavior:**
- `field.overloadNcClosed = false` (injected by fault engine)
- PLC input `I:1/4` reads FALSE (OL NC contact open)
- Rung 4 seal-in circuit breaks → `B3:0/0` (RUN internal) drops FALSE
- Rung 6 output `O:2/0` goes FALSE → motor command OFF
- Machine twin: `overloadTripped = true`, `beltRunning = false`

**Meter readings:**
- OL1 continuity: "OPEN (tripped)" — confirms NC contact is open
- Motor coil voltage: "0 VDC" — confirms no command to motor

**Corrective action:** Reset overload relay → `field.overloadNcClosed = true` → PLC re-scans → motor runs

---

### Scenario B: output_on_motor_dead

**Root cause:** Contactor K1 mechanical failure — coil energizes but power contacts fail to close.

**Engine behavior:**
- `field.motorMechanicalOk = false` (injected by fault engine)
- PLC logic chain is complete: E-stop OK, guard OK, stop OK, OL OK, start sealed
- PLC output `O:2/0` = TRUE (motor command ON)
- Contactor coil receives ~24 VDC (field power present, output channel functional)
- Contactor mechanical linkage fails → power contacts do NOT close
- Motor receives no three-phase power → belt does NOT run
- Machine twin: `motorCoilEnergized = true`, `contactorPulled = false`, `beltRunning = false`, `mechanicalFault = true`

**Meter readings:**
- K1 A1–A2 voltage: "~24 VDC (coil energized)" — confirms control power reaches coil
- K1 Aux 13–14 continuity: "OPEN" — confirms contactor did NOT pull in mechanically
- OL1 continuity: "CLOSED (normal)" — confirms power path downstream is not the issue

**Key teaching point:** The PLC output being ON does NOT prove that the motor should be running. The diagnostic must trace from software command → output terminal voltage → control wire → coil → mechanical → power contacts → motor.

**Corrective action:** Replace contactor / repair mechanical fault → `field.motorMechanicalOk = true` → PLC re-scans → motor runs

---

## Appendix: PLC I/O Panel Design Rationale

The PLC I/O Status Sub-Panel exists to address a critical misconception common among junior technicians: **conflating a software output bit with physical voltage at the field terminal.**

The panel displays five values with explicit source attribution:

| Value | Source Type | What It Proves |
|-------|-------------|----------------|
| Logic Command | Software state | PLC program has evaluated the output instruction as TRUE |
| Output Instruction | Software state | The OTE instruction in the rung is energized |
| Output Channel | Visual indicator | The output module LED is illuminated (channel is switching) |
| Field Power | Measured value | DC power supply to the output module is present |
| Output Voltage | Measured value | Actual voltage measured at the output terminal |

The first three are **software/visual** — they tell you the PLC *intends* to energize the output. Only the last two are **measured values** that confirm physical reality. The panel makes this distinction explicit through color-coded source badges.

This directly supports the teaching message: *"A software bit being ON does not prove field voltage exists."*
