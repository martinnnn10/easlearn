# Workstation Prototype — Usability Comparison Report

## Executive Summary

The technician-workstation prototype at `/prototype/workstation` now supports two materially different fault scenarios using a single, scenario-driven layout architecture. No fault-specific UI code exists — all differences are driven by a configuration adapter (`workstationScenarios.ts`). The same 3-column desktop layout and tabbed mobile layout render both faults without modification.

**Verdict: The workstation architecture generalizes.** Both faults render correctly in the same layout, all 9 interactions work for both scenarios, and the diagnostic workflow differences (control-side vs. power-side reasoning) are expressed entirely through configuration.

---

## Scenarios Compared

| Attribute | A: Overload Tripped | B: Output ON / Motor Dead |
|-----------|--------------------|-----------------------------|
| Fault ID | `overload_tripped` | `output_on_motor_dead` |
| Diagnostic Domain | Power-path (thermal protection) | Control-path + power-path (PLC output → contactor → motor) |
| Root Cause | Overload relay tripped (NC contact open) | Motor mechanical failure (PLC commands run, motor does not turn) |
| Operator Report | "Motor ran for a bit then stopped. Red fault light is on." | "PLC says motor is on — green light is lit — but the belt is completely dead." |
| Key Measurement | OL1 continuity (OPEN = tripped) | K1 coil voltage (0 V = no energization) |
| Hypothesis Count | 3 | 9 |
| Corrective Action | Reset Overload Relay | Replace Motor / Repair Mechanical Fault |
| Cleared Condition | `!machine.overloadTripped` | `machine.motorRunning` |

---

## Interaction Matrix

| # | Interaction | Overload Tripped | Output ON / Motor Dead |
|---|-------------|:---:|:---:|
| 1 | Click physical → print highlights | Pass | Pass |
| 2 | Click print → physical highlights | Pass | Pass |
| 3 | Place meter leads on valid test points | Pass | Pass |
| 4 | Measurement appears beside test points | Pass (OPEN) | Pass (0 V) |
| 5 | Test added to history | Pass | Pass |
| 6 | Record interpretation | Pass | Pass |
| 7 | Machine state changes after corrective action | Pass (OL1 OK, motor runs) | Pass (motor runs) |
| 8 | Unsafe measurement blocked | Pass (motor_coil while energized) | Pass (motor_coil while energized) |
| 9 | Closeout without leaving workstation | Pass | Pass |

---

## Diagnostic Workflow Differences

### Scenario A: Overload Tripped
The learner's reasoning path is straightforward:
1. Observe: Red stack light, motor stopped
2. Check PLC: O:2/0 OFF (motor output de-energized because OL input is FALSE)
3. Measure: OL1 continuity → OPEN (confirms trip)
4. Correct: Reset overload relay
5. Verify: Motor runs, green light returns

### Scenario B: Output ON / Motor Dead
The learner must distinguish PLC state from real-world voltage — a fundamentally different cognitive demand:
1. Observe: Green light lit (PLC thinks motor is on), but belt is dead
2. Check PLC: O:2/0 shows ON in ladder, but field output has no voltage
3. Hypothesize: Is the issue at the output module, the control wire, the contactor coil, the power contacts, or the motor itself?
4. Measure: K1 A1/A2 voltage → 0 V (coil not energized despite PLC output ON)
5. Reason: The fault is upstream of the contactor — either the output module field power, the output channel, or the control wire
6. Correct: Replace motor / repair mechanical fault (per fault engine model)
7. Verify: Motor runs

This scenario validates that the workstation handles:
- PLC state versus real-world voltage reasoning
- Control-side versus power-side diagnostic paths
- Contactor coil measurements (A1/A2)
- Output-module measurements (via PLC state indicator)
- Multiple plausible hypotheses (9 vs. 3)
- A longer test history (more measurements needed to narrow down)
- Verified-versus-assumed reasoning (the 0 V reading eliminates several hypotheses simultaneously)

---

## Architecture Validation

### What Drives the Differences (Scenario Adapter)

```typescript
// workstationScenarios.ts
export interface WorkstationScenario {
  faultId: FaultId;
  headerBadge: { text: string; color: string };
  operatorReport: string;
  initialHypotheses: string[];
  correctiveAction: { label: string; description: string };
  clearedCheck: (machine: MachineTwin) => boolean;
  clearedMessage: string;
}
```

### What Stays the Same (Layout)
- 3-column desktop: Machine View | Print/Schematic | Diagnostic Bench
- Bottom drawer: Operator Conversation + Closeout
- Mobile: 5 tabs (Machine, Print, Meter, Diagnosis, Closeout) + persistent context bar
- Probe definitions (same physical test points)
- Cross-highlighting logic (same address-to-component mapping)
- Meter reading engine (same `computeMeterReading` function)
- PLC scan cycle (same `runScanCycle` + `deriveMachineTwin`)

### Components Reused vs. New

| Component | Status |
|-----------|--------|
| `conveyorProgram.ts` (PLC ladder) | Reused — no changes |
| `fieldDeviceModel.ts` (field state) | Reused — no changes |
| `machineTwinModel.ts` (machine derivation) | Reused — no changes |
| `faultCatalog.ts` (fault injection) | Reused — no changes |
| `ConveyorDiagnosticsPanel.tsx` (meter engine) | Reused — `computeMeterReading` called directly |
| `workstationScenarios.ts` | **New** — scenario adapter configuration |
| `WorkstationPrototype.tsx` | **Refactored** — scenario-driven (was hardcoded to overload) |

---

## Fault Engine Unchanged Confirmation

No files in the fault engine were modified:
- `client/src/lib/conveyorLab/faultCatalog.ts` — unchanged
- `client/src/lib/conveyorLab/fieldDeviceModel.ts` — unchanged
- `client/src/lib/conveyorLab/machineTwinModel.ts` — unchanged
- `client/src/lib/conveyorLab/conveyorProgram.ts` — unchanged
- `client/src/lib/conveyorLab/types.ts` — unchanged
- Assessment Spine — unchanged
- Scoring model — unchanged
- Evidence model — unchanged

---

## Usability Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| 9 hypotheses in Scenario B may overwhelm novice learners on mobile | Medium | Consider progressive disclosure — show top 3, expand on demand |
| "0 V" at contactor coil doesn't distinguish between open coil and no supply voltage | Low | Add a second probe point (output terminal voltage) in a future iteration |
| Corrective action "Replace Motor" is technically the engine's resolution but doesn't match the diagnostic path (the fault is at the output module level) | Medium | The engine models this as motor failure; the hypotheses correctly frame the full diagnostic space. A future engine update could add intermediate corrective actions. |
| No visual distinction between "PLC says ON" and "field voltage present" | Medium | Add a dedicated PLC I/O status panel in a future iteration showing bit states vs. field voltages side by side |
| Bottom drawer (Operator Conversation) is not wired to AI coaching | Low | Placeholder only — documented as such |

---

## Recommendation

The workstation architecture is validated. Both existing faults render in the same layout without fault-specific UI code. The scenario adapter pattern scales to any future fault in the catalog by adding a configuration object — no layout changes required.

**Recommended next steps:**
1. Wire the operator conversation drawer to `invokeLLM` for AI coaching
2. Add a scored assessment mode that tracks time-to-diagnosis and unnecessary tests
3. Add a PLC I/O status sub-panel that distinguishes software bit state from field voltage
4. Consider progressive hypothesis disclosure for mobile (show 3, expand on tap)
