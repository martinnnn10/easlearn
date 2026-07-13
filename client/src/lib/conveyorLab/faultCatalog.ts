import type { ConveyorFault, DiagnosticStep, FaultId } from "./types";

/** Phase 1 MVP — four faults only */
export const FAULT_CATALOG: ConveyorFault[] = [
  {
    id: "estop_open",
    label: "E-Stop Open",
    symptom: "Conveyor will not start. START does nothing — RUN_CMD can't seal in because the E-STOP input is de-energized (I:1/2 = 0).",
    operatorReport: "I pressed START but nothing happens. The green RUN light never comes on.",
    rootCause: "E-stop mushroom head is pressed or the NC contact/conductor is open, so I:1/2 reads 0 (de-energized). Pull out and reset the E-stop before restarting.",
    correctFirstStep: "check_estop",
    acceptableRootCauses: ["estop", "e-stop", "emergency stop", "i:1/2"],
    evidence: ["io_estop_true", "rung2_blocked", "motor_off"],
    incorrectPaths: ["Replacing motor starter", "Adjusting timer preset", "Bypassing photoeye"],
  },
  {
    id: "stop_stuck",
    label: "STOP Button Stuck",
    symptom: "Conveyor will not start. START does nothing — the STOP input is de-energized (I:1/0 = 0), meaning the STOP button NC contact is held open or the conductor is broken.",
    operatorReport: "I pressed START but nothing happens. I don't think anyone hit E-stop or opened the guard. The STOP button feels weird — like it's stuck down.",
    rootCause: "STOP pushbutton NC contact is stuck open (mechanically jammed, broken spring, or severed conductor), so I:1/0 reads 0 (de-energized). The safety string on Rung 2 cannot pass power. Free the stuck button or replace the pushbutton assembly.",
    correctFirstStep: "check_start_stop",
    acceptableRootCauses: ["stop", "stop button", "stop stuck", "pushbutton", "i:1/0", "nc contact", "stop pb"],
    evidence: ["io_stop_open", "rung2_blocked", "motor_off"],
    incorrectPaths: ["Resetting overload", "Replacing photoeye", "Forcing MOTOR output", "Resetting E-stop"],
  },
  {
    id: "guard_open",
    label: "Guard Open",
    symptom: "Conveyor will not start. START does nothing — the GUARD interlock input is de-energized (I:1/3 = 0), blocking the safety string on Rung 2.",
    operatorReport: "I pressed START but nothing happens. I think someone left the guard door open after maintenance.",
    rootCause: "Guard door is open or the interlock switch is misaligned/failed, so I:1/3 reads 0 (de-energized). Close the guard door and verify the interlock switch engages.",
    correctFirstStep: "check_guard",
    acceptableRootCauses: ["guard", "guard door", "interlock", "guard open", "i:1/3", "safety gate"],
    evidence: ["io_guard_open", "rung2_blocked", "motor_off"],
    incorrectPaths: ["Resetting overload", "Replacing photoeye", "Forcing MOTOR output"],
  },
  {
    id: "photoeye_stuck_on",
    label: "Photoeye Stuck ON",
    symptom: "Conveyor will not start — I:1/5 stuck TRUE holds Rung 4 NC PE CLEAR open, blocking MOTOR output.",
    operatorReport: "The sensor light is on even when the belt is empty. START does nothing — looks like a jam interlock.",
    rootCause: "Photoeye output stuck TRUE (I:1/5) with no product present. NC PE CLEAR on Rung 4 blocks the motor. Clean lens or replace sensor.",
    correctFirstStep: "check_photoeye",
    acceptableRootCauses: ["photoeye", "photo eye", "sensor stuck", "i:1/5"],
    evidence: ["io_pe_true", "pe_blocked_no_product", "rung4_pe_blocked", "motor_off"],
    incorrectPaths: ["Resetting overload", "Replacing contactor coil", "Changing PLC program"],
  },
  {
    id: "photoeye_jam",
    label: "Photoeye Jam",
    symptom: "Motor was running then stopped. Photoeye beam is blocked (I:1/5 = TRUE) — the XIO instruction on Rung 4 drops power to the MOTOR output.",
    operatorReport: "Belt was running fine, then it just stopped. I see something blocking the sensor area. Motor won't restart.",
    rootCause: "Product or debris is physically blocking the photoeye beam, energizing I:1/5. The XIO PE CLEAR instruction on Rung 4 sees a TRUE bit and opens — dropping the motor. Clear the obstruction from the beam path.",
    correctFirstStep: "check_photoeye",
    acceptableRootCauses: ["photoeye", "jam", "blocked", "beam blocked", "product jam", "i:1/5", "xio"],
    evidence: ["io_pe_true", "pe_beam_blocked", "rung4_xio_open", "motor_off"],
    incorrectPaths: ["Resetting overload", "Resetting E-stop", "Replacing photoeye sensor"],
  },
  {
    id: "overload_tripped",
    label: "Overload Tripped",
    symptom: "Motor stops or won't start. RED stack light is on.",
    operatorReport: "Motor ran for a bit then stopped. Red fault light is on. RESET OL didn't help until I found the trip.",
    rootCause: "Motor overload NC contact open, so I:1/4 reads 0 (de-energized). Allow OL to cool, verify amp draw, then reset.",
    correctFirstStep: "check_overload",
    acceptableRootCauses: ["overload", "ol trip", "thermal", "i:1/4", "red light"],
    evidence: ["io_overload_true", "rung4_blocked", "red_light"],
    incorrectPaths: ["Bypassing E-stop", "Forcing MOTOR output", "Replacing photoeye"],
  },
  {
    id: "output_on_motor_dead",
    label: "Output ON, Motor Dead",
    symptom: "PLC shows MOTOR output energized but belt does not move.",
    operatorReport: "PLC says motor is on — green light is lit — but the belt is completely dead.",
    rootCause: "Contactor coil OK at PLC but mechanical failure (worn contacts, belt, or coupling). Verify field power path.",
    correctFirstStep: "check_motor_output_vs_motion",
    acceptableRootCauses: ["mechanical", "contactor", "belt", "coupling", "motor dead", "output on"],
    evidence: ["motor_output_on", "belt_stopped", "contactor_pulled"],
    incorrectPaths: ["Changing timer preset", "Resetting E-stop", "Replacing photoeye"],
  },
];

export function getFaultById(id: FaultId): ConveyorFault | undefined {
  if (id === "normal") return undefined;
  return FAULT_CATALOG.find((f) => f.id === id);
}

export function getMvpFaults(): ConveyorFault[] {
  return FAULT_CATALOG;
}

export function pickRandomFault(): FaultId {
  const faults = getMvpFaults();
  return faults[Math.floor(Math.random() * faults.length)].id;
}

export const GUIDED_STEPS: {
  step: number;
  title: string;
  instruction: string;
  hint: string;
  check: DiagnosticStep;
}[] = [
  {
    step: 1,
    title: "Observe the symptom",
    instruction: "Read the operator report and watch the machine twin. What is wrong?",
    hint: "Note whether the belt moves, stack lights, or START is ignored.",
    check: "check_io_panel",
  },
  {
    step: 2,
    title: "Check field inputs",
    instruction: "Open the diagnostics panel I/O monitor. Compare each input to expected field state.",
    hint: "Fail-safe NC safety inputs (E-STOP, GUARD, OL, STOP) read 1 when healthy and drop to 0 when the device opens. START reads 1 only while pressed. The photoeye reads 1 when the beam is blocked.",
    check: "check_io_panel",
  },
  {
    step: 3,
    title: "Trace the ladder",
    instruction: "Find which rung blocks. Follow RUN_CMD → SAFE_RUN → timer → MOTOR.",
    hint: "Rung 2 is the safety interlock. Rung 4 needs timer done, overload energized (I:1/4 = 1), and PE clear (I:1/5 = 0).",
    check: "check_ladder_rung_2",
  },
  {
    step: 4,
    title: "Take a measurement",
    instruction: "Use the meter on a relevant test point to confirm your hypothesis.",
    hint: "E-stop and overload are NC circuits — continuity should be closed when healthy.",
    check: "meter_measurement",
  },
  {
    step: 5,
    title: "Identify root cause",
    instruction: "Select the fault that matches your evidence and submit diagnosis.",
    hint: "Match abnormal I/O, ladder interlock, or output-vs-motion mismatch to one of the four fault types.",
    check: "check_io_panel",
  },
];

/**
 * Fault-specific guided walkthrough steps.
 * When a fault has an entry here, the guided panel uses these steps
 * instead of the generic GUIDED_STEPS. Each step walks the learner
 * through the exact diagnostic path a senior tech would follow.
 */
export type GuidedStepDef = {
  step: number;
  title: string;
  instruction: string;
  hint: string;
  check: DiagnosticStep;
};

export const FAULT_GUIDED_STEPS: Partial<Record<FaultId, GuidedStepDef[]>> = {
  guard_open: [
    {
      step: 1,
      title: "Observe the symptom",
      instruction:
        "Read the operator report. The conveyor won't start — START has no effect. Watch the machine twin: is the guard door open?",
      hint: "Look at the guard door icon on the machine twin. An open guard breaks the safety string.",
      check: "check_io_panel",
    },
    {
      step: 2,
      title: "Check the I/O panel",
      instruction:
        "Open the I/O monitor. Find I:1/3 (GUARD). Is it energized (1) or de-energized (0)?",
      hint: "Fail-safe wiring: I:1/3 = 1 means the guard interlock switch is closed (healthy). I:1/3 = 0 means the guard is open or the switch has failed.",
      check: "check_io_panel",
    },
    {
      step: 3,
      title: "Trace the ladder — Rung 2",
      instruction:
        "Look at Rung 2 in the ladder panel. The XIC GUARD contact (I:1/3) should pass power when the bit is TRUE. Is it passing or blocking?",
      hint: "With I:1/3 = 0, the XIC GUARD instruction is FALSE — it blocks power flow on the safety string. SAFE_RUN (B3:0/1) cannot energize.",
      check: "check_ladder_rung_2",
    },
    {
      step: 4,
      title: "Probe the guard interlock switch",
      instruction:
        "Select the 'Guard Interlock NC' meter probe and take a continuity reading. What does the meter show?",
      hint: "If the guard door is open, the interlock switch NC contact opens — meter reads OPEN (no continuity). This confirms the field device state.",
      check: "check_guard",
    },
    {
      step: 5,
      title: "Verify the physical device",
      instruction:
        "Look at the guard door on the machine twin. Is it physically open? The fix is to close the guard door and verify the interlock switch re-engages.",
      hint: "On a real machine you would physically close the guard, then verify I:1/3 returns to 1 on the I/O monitor before restarting.",
      check: "check_guard",
    },
    {
      step: 6,
      title: "Submit your diagnosis",
      instruction:
        "You've confirmed: guard door open → interlock switch open → I:1/3 = 0 → Rung 2 safety string broken → motor cannot start. Select the root cause and submit.",
      hint: "The root cause is 'Guard Open' — the guard door interlock is the faulted device.",
      check: "check_guard",
    },
  ],
  stop_stuck: [
    {
      step: 1,
      title: "Observe the symptom",
      instruction:
        "Read the operator report. The conveyor won't start. The operator mentions the STOP button feels stuck.",
      hint: "A stuck STOP button holds its NC contact open, breaking the safety string just like an E-stop or open guard.",
      check: "check_io_panel",
    },
    {
      step: 2,
      title: "Check the I/O panel",
      instruction:
        "Open the I/O monitor. Find I:1/0 (STOP). Is it energized (1) or de-energized (0)?",
      hint: "Fail-safe wiring: I:1/0 = 1 means the STOP NC contact is closed (healthy). I:1/0 = 0 means the button is held open or the conductor is broken.",
      check: "check_io_panel",
    },
    {
      step: 3,
      title: "Trace the ladder — Rung 2",
      instruction:
        "Look at Rung 2. The XIC STOP contact (I:1/0) should pass power when TRUE. With I:1/0 = 0, what happens to the safety string?",
      hint: "The XIC STOP instruction is FALSE — it blocks power flow. SAFE_RUN cannot energize, so the motor cannot start.",
      check: "check_ladder_rung_2",
    },
    {
      step: 4,
      title: "Probe the STOP pushbutton",
      instruction:
        "Select the 'STOP PB NC' meter probe and take a continuity reading.",
      hint: "If the STOP button is stuck, the NC contact is open — meter reads OPEN (no continuity). This confirms the mechanical failure.",
      check: "check_start_stop",
    },
    {
      step: 5,
      title: "Submit your diagnosis",
      instruction:
        "You've confirmed: STOP NC contact stuck open → I:1/0 = 0 → Rung 2 blocked → motor cannot start. Select the root cause and submit.",
      hint: "The root cause is 'STOP Button Stuck' — free the jammed button or replace the pushbutton assembly.",
      check: "check_start_stop",
    },
  ],
  estop_open: [
    {
      step: 1,
      title: "Observe the symptom",
      instruction:
        "Read the operator report. The conveyor won't start — START has no effect.",
      hint: "Check the E-stop mushroom head on the machine twin. Is it pressed in?",
      check: "check_io_panel",
    },
    {
      step: 2,
      title: "Check the I/O panel",
      instruction:
        "Open the I/O monitor. Find I:1/2 (E-STOP). Is it energized (1) or de-energized (0)?",
      hint: "Fail-safe wiring: I:1/2 = 1 means E-stop is reset (healthy). I:1/2 = 0 means the E-stop NC contact is open.",
      check: "check_io_panel",
    },
    {
      step: 3,
      title: "Trace the ladder — Rung 2",
      instruction:
        "Look at Rung 2. The XIC E-STOP contact (I:1/2) blocks when FALSE. Is the safety string broken here?",
      hint: "With I:1/2 = 0, the XIC E-STOP instruction is FALSE — power cannot flow through the safety string.",
      check: "check_ladder_rung_2",
    },
    {
      step: 4,
      title: "Probe the E-stop circuit",
      instruction:
        "Select the 'E-Stop NC' meter probe and take a continuity reading.",
      hint: "If the E-stop is pressed, the NC contact is open — meter reads OPEN (no continuity).",
      check: "check_estop",
    },
    {
      step: 5,
      title: "Submit your diagnosis",
      instruction:
        "You've confirmed: E-stop pressed → NC contact open → I:1/2 = 0 → Rung 2 blocked. Select the root cause and submit.",
      hint: "The root cause is 'E-Stop Open' — pull out and reset the E-stop mushroom head.",
      check: "check_estop",
    },
  ],
  overload_tripped: [
    {
      step: 1,
      title: "Observe the symptom",
      instruction:
        "Read the operator report. The motor stopped or won't start. Check the machine twin — is the RED stack light on?",
      hint: "A red stack light typically indicates an overload or fault condition. The motor was running then stopped.",
      check: "check_io_panel",
    },
    {
      step: 2,
      title: "Check the I/O panel",
      instruction:
        "Open the I/O monitor. Find I:1/4 (OVERLOAD). Is it energized (1) or de-energized (0)?",
      hint: "Fail-safe wiring: I:1/4 = 1 means the overload NC contact is closed (healthy). I:1/4 = 0 means the thermal overload relay has tripped.",
      check: "check_io_panel",
    },
    {
      step: 3,
      title: "Trace the ladder — Rung 4",
      instruction:
        "Look at Rung 4 in the ladder panel. The XIC OL contact (I:1/4) must pass power for the MOTOR output. Is it blocking?",
      hint: "With I:1/4 = 0, the XIC OL instruction is FALSE — it blocks power to the MOTOR output coil on Rung 4.",
      check: "check_overload",
    },
    {
      step: 4,
      title: "Probe the overload relay",
      instruction:
        "Select the 'Overload NC' meter probe and take a continuity reading.",
      hint: "If the overload has tripped, the NC contact (95–96) is open — meter reads OPEN. Allow the OL to cool, verify motor amp draw is within FLA, then reset.",
      check: "check_overload",
    },
    {
      step: 5,
      title: "Verify the physical device",
      instruction:
        "Check the overload relay on the machine twin. Is the trip indicator showing? The fix is to let the OL cool, check amp draw, then press the reset button.",
      hint: "On a real machine: check motor nameplate FLA vs. measured amps. If amps are high, find the mechanical cause (binding, misalignment) before resetting.",
      check: "check_overload",
    },
    {
      step: 6,
      title: "Submit your diagnosis",
      instruction:
        "You've confirmed: overload tripped → NC contact open → I:1/4 = 0 → Rung 4 blocked → MOTOR output de-energized. Select the root cause and submit.",
      hint: "The root cause is 'Overload Tripped' — the thermal overload relay opened due to excessive current.",
      check: "check_overload",
    },
  ],
  photoeye_stuck_on: [
    {
      step: 1,
      title: "Observe the symptom",
      instruction:
        "Read the operator report. The conveyor won't start. The sensor light is on even though the belt is empty — no product is present.",
      hint: "A photoeye reading TRUE with no product means the sensor output is stuck or the lens is dirty/misaligned.",
      check: "check_io_panel",
    },
    {
      step: 2,
      title: "Check the I/O panel",
      instruction:
        "Open the I/O monitor. Find I:1/5 (PHOTOEYE). Is it TRUE (1) or FALSE (0)?",
      hint: "I:1/5 = 1 means the photoeye beam is blocked (or sensor output stuck). I:1/5 = 0 means the beam path is clear.",
      check: "check_io_panel",
    },
    {
      step: 3,
      title: "Verify no physical obstruction",
      instruction:
        "Look at the machine twin beam path. Is there any product or debris blocking the photoeye? The belt should be empty.",
      hint: "No product on the belt — the sensor is reporting blocked with nothing there. This points to a sensor malfunction, not a jam.",
      check: "check_photoeye",
    },
    {
      step: 4,
      title: "Trace the ladder — Rung 4 XIO",
      instruction:
        "Look at Rung 4. The XIO PE CLEAR instruction (I:1/5) passes power only when the bit is FALSE. With I:1/5 = TRUE, what happens?",
      hint: "XIO sees TRUE → instruction opens → power cannot reach the MOTOR output. This is the jam interlock doing its job, but the sensor is lying.",
      check: "check_photoeye",
    },
    {
      step: 5,
      title: "Probe the photoeye",
      instruction:
        "Select the 'Photoeye (+/−)' meter probe and take a voltage reading.",
      hint: "Reading ~24 VDC with no product confirms the sensor output is stuck TRUE. Clean the lens or replace the sensor.",
      check: "check_photoeye",
    },
    {
      step: 6,
      title: "Submit your diagnosis",
      instruction:
        "You've confirmed: photoeye stuck TRUE with no product → XIO opens on Rung 4 → MOTOR blocked. Select the root cause and submit.",
      hint: "The root cause is 'Photoeye Stuck ON' — clean the lens, check alignment, or replace the sensor.",
      check: "check_photoeye",
    },
  ],
  photoeye_jam: [
    {
      step: 1,
      title: "Observe the symptom",
      instruction:
        "Read the operator report. The belt was running then stopped. The operator sees something blocking the sensor area.",
      hint: "Look at the machine twin — is there debris or product visible in the photoeye beam path?",
      check: "check_io_panel",
    },
    {
      step: 2,
      title: "Check the I/O panel",
      instruction:
        "Open the I/O monitor. Find I:1/5 (PHOTOEYE). Is it TRUE (1)?",
      hint: "I:1/5 = 1 means the beam is physically blocked. Unlike 'stuck on', here there IS an actual obstruction.",
      check: "check_io_panel",
    },
    {
      step: 3,
      title: "Verify the physical obstruction",
      instruction:
        "Look at the machine twin. Can you see the JAM debris indicator in the photoeye beam path?",
      hint: "The debris/product is physically blocking the beam. This is a real jam — the sensor is working correctly, reporting what it sees.",
      check: "check_photoeye",
    },
    {
      step: 4,
      title: "Trace the ladder — Rung 4 XIO",
      instruction:
        "Look at Rung 4. The XIO PE CLEAR instruction (I:1/5) sees TRUE (beam blocked) and opens — dropping the MOTOR output. This is the interlock working as designed.",
      hint: "The XIO instruction is doing its job: it detected a blocked beam and stopped the motor to prevent damage. The fix is to clear the obstruction, not bypass the sensor.",
      check: "check_photoeye",
    },
    {
      step: 5,
      title: "Determine the fix",
      instruction:
        "The root cause is physical: product or debris is blocking the beam. The fix is to clear the obstruction from the beam path, then verify I:1/5 returns to 0.",
      hint: "On a real machine: LOTO, clear the jam, verify beam path is clear, then restart. Never bypass the photoeye interlock.",
      check: "check_photoeye",
    },
    {
      step: 6,
      title: "Submit your diagnosis",
      instruction:
        "You've confirmed: physical obstruction → beam blocked → I:1/5 = TRUE → XIO opens on Rung 4 → motor stopped. Select the root cause and submit.",
      hint: "The root cause is 'Photoeye Jam' — clear the physical obstruction from the beam path.",
      check: "check_photoeye",
    },
  ],
  output_on_motor_dead: [
    {
      step: 1,
      title: "Observe the symptom",
      instruction:
        "Read the operator report. The PLC says the motor is on (green light lit) but the belt is completely dead — no motion at all.",
      hint: "This is unusual: the PLC output is energized but the motor isn't turning. The problem is downstream of the PLC.",
      check: "check_io_panel",
    },
    {
      step: 2,
      title: "Check the I/O panel",
      instruction:
        "Open the I/O monitor. Verify O:2/0 (MOTOR) is TRUE. All inputs should look normal — the PLC logic is working correctly.",
      hint: "O:2/0 = TRUE confirms the PLC is commanding the motor ON. The safety string passed, timer done, all interlocks satisfied. Problem is in the field power path.",
      check: "check_io_panel",
    },
    {
      step: 3,
      title: "Probe the motor contactor coil",
      instruction:
        "Select the 'M1 Contactor Coil' meter probe and take a voltage reading. Is the coil getting power?",
      hint: "If coil shows ~24 VDC, the PLC output transistor is driving the coil. The contactor should be pulling in.",
      check: "check_motor_output_vs_motion",
    },
    {
      step: 4,
      title: "Check the contactor auxiliary contact",
      instruction:
        "Select the 'M1 Aux NO (1-2)' meter probe and take a continuity reading. Is the contactor mechanically pulled in?",
      hint: "If aux reads OPEN despite coil being energized, the contactor is mechanically failed (worn contacts, stuck armature). If aux reads CLOSED, look further downstream (belt, coupling).",
      check: "check_motor_output_vs_motion",
    },
    {
      step: 5,
      title: "Identify the mechanical failure",
      instruction:
        "The PLC output is ON, the coil is energized, but the motor doesn't turn. This is a mechanical failure: worn contactor contacts, broken belt, or failed coupling between motor and conveyor.",
      hint: "On a real machine: check contactor main contacts for pitting/welding, verify belt tension, inspect motor coupling. This is a field-power-path problem, not a control problem.",
      check: "check_motor_output_vs_motion",
    },
    {
      step: 6,
      title: "Submit your diagnosis",
      instruction:
        "You've confirmed: PLC output ON → coil energized → but belt dead. The fault is mechanical (contactor, belt, or coupling). Select the root cause and submit.",
      hint: "The root cause is 'Output ON, Motor Dead' — the control circuit is working but the mechanical power path has failed.",
      check: "check_motor_output_vs_motion",
    },
  ],
};

/** Get fault-specific guided steps, falling back to generic GUIDED_STEPS */
export function getGuidedStepsForFault(faultId: FaultId): GuidedStepDef[] {
  return FAULT_GUIDED_STEPS[faultId] ?? GUIDED_STEPS;
}

export const ROOT_CAUSE_OPTIONS: { id: FaultId; label: string }[] = FAULT_CATALOG.map((f) => ({
  id: f.id,
  label: f.label,
}));

export const METER_PROBES: {
  id: import("./types").MeterProbeId;
  label: string;
  hint: string;
}[] = [
  { id: "estop_nc", label: "E-Stop NC (TB1-1/2)", hint: "NC chain — should have continuity when reset" },
  { id: "guard_nc", label: "Guard Interlock NC (TB1-5/6)", hint: "NC interlock — closed when guard door is shut" },
  { id: "stop_nc", label: "STOP PB NC (TB1-7/8)", hint: "NC contact — should have continuity when button is released" },
  { id: "overload_nc", label: "Overload NC (TB1-3/4)", hint: "Thermal OL NC — open when tripped" },
  { id: "photoeye_signal", label: "Photoeye (+/−)", hint: "24 VDC when blocked, 0 V when clear" },
  { id: "motor_coil", label: "M1 Contactor Coil", hint: "~24 VDC when O:2/0 energized" },
  { id: "contactor_aux", label: "M1 Aux NO (1-2)", hint: "Closed when contactor pulled in" },
];
