/**
 * Instruction Description Data — RSLogix 500/Studio 5000 element explanations.
 *
 * Each entry provides plant-floor context for a specific PLC instruction
 * as used in the Packaging Line 4 conveyor program. Clicking an element
 * in the ladder display opens a side panel showing this information.
 */

export interface InstructionDescription {
  /** PLC instruction type */
  instructionType: "XIC" | "XIO" | "OTE" | "TON";
  /** Allen-Bradley address */
  address: string;
  /** Short label shown on the element */
  label: string;
  /** Full field device name */
  deviceName: string;
  /** Physical device description */
  deviceDescription: string;
  /** Wiring type: NC (normally closed) or NO (normally open) — contacts only */
  wiringType?: "NC" | "NO";
  /** Why this instruction is used in this rung */
  whyUsed: string;
  /** What happens when the instruction passes power / output is energized */
  whenPasses: string;
  /** What happens when the instruction does NOT pass / output is de-energized */
  whenFails: string;
  /** Common failure mode on the plant floor */
  commonFailure: string;
  /** Relevant course lesson slug for "Learn More" link */
  lessonSlug: string;
  /** Lesson title for display */
  lessonTitle: string;
}

/**
 * Descriptions keyed by address. Some addresses appear in multiple rungs
 * but the explanation is the same — the panel shows the same info regardless
 * of which rung the user clicked.
 */
export const INSTRUCTION_DESCRIPTIONS: Record<string, InstructionDescription> = {
  "I:1/0": {
    instructionType: "XIC",
    address: "I:1/0",
    label: "STOP",
    deviceName: "STOP Pushbutton (PB1)",
    deviceDescription:
      "Red mushroom-head momentary pushbutton mounted on the operator station. Normally closed (NC) contact wired in series with the start/stop circuit.",
    wiringType: "NC",
    whyUsed:
      "XIC examines this input because the field device is wired energize-to-run (fail-safe). The NC contact keeps the PLC input energized (TRUE) when the button is NOT pressed. Pressing the button opens the contact, de-energizes the input (FALSE), and the XIC drops out — stopping the motor immediately.",
    whenPasses:
      "Bit is TRUE → the STOP button is released (NC contact closed) → power flows through this element → circuit can seal in or remain sealed.",
    whenFails:
      "Bit is FALSE → the STOP button is pressed (NC contact opened) → power is broken at this point → RUN_CMD coil de-energizes → motor stops.",
    commonFailure:
      "Worn contact block: intermittent FALSE readings even when button is released. Check terminal TB1-1/2 continuity with the button released — should read < 1Ω.",
    lessonSlug: "plc-fundamentals/ladder-logic-basics",
    lessonTitle: "Ladder Logic: Contacts, Coils, and Basic Instructions",
  },

  "I:1/1": {
    instructionType: "XIC",
    address: "I:1/1",
    label: "START",
    deviceName: "START Pushbutton (PB2)",
    deviceDescription:
      "Green flush-head momentary pushbutton mounted on the operator station. Normally open (NO) contact — only closes while the operator holds it.",
    wiringType: "NO",
    whyUsed:
      "XIC examines this input because the NO contact only energizes the input (TRUE) while pressed. A momentary TRUE pulse seals in the RUN_CMD coil through the parallel seal-in branch (Rung 1A). Once sealed, releasing START (FALSE) does not matter.",
    whenPasses:
      "Bit is TRUE → operator is pressing START → power flows through this element → RUN_CMD coil energizes (first scan) → seal-in branch takes over.",
    whenFails:
      "Bit is FALSE → START is released (normal after seal-in) or has never been pressed → this element blocks power in Rung 1, but Rung 1A maintains the seal if RUN_CMD is already latched.",
    commonFailure:
      "Broken spring return: button stays mechanically depressed. Verify with meter at TB1-7/8 — should read open (OL) when released.",
    lessonSlug: "plc-fundamentals/ladder-logic-basics",
    lessonTitle: "Ladder Logic: Contacts, Coils, and Basic Instructions",
  },

  "I:1/2": {
    instructionType: "XIC",
    address: "I:1/2",
    label: "E-STOP",
    deviceName: "Emergency Stop (ES1)",
    deviceDescription:
      "Red twist-to-release mushroom-head E-Stop per NFPA 79 / ISO 13850. Dual-channel NC contacts — one channel to the safety relay, one to PLC input I:1/2 for monitoring.",
    wiringType: "NC",
    whyUsed:
      "XIC examines this input because the E-Stop is wired energize-to-run. The NC contact keeps the input TRUE when the E-Stop is NOT actuated. Pressing the E-Stop opens the contact → input goes FALSE → XIC drops out → motor stops. This is the PLC monitoring path; the hardwired safety relay independently drops the M1 contactor.",
    whenPasses:
      "Bit is TRUE → E-Stop is in the released (reset) position → NC contact is closed → power flows through → circuit can continue.",
    whenFails:
      "Bit is FALSE → E-Stop is actuated (pressed/latched) → NC contact opened → power is broken → all downstream rungs lose permissive → motor stops.",
    commonFailure:
      "Corroded terminal or broken wire at TB1-5/6: input reads FALSE even with E-Stop reset. Twist the head fully clockwise, then check 24VDC at the input terminal with a meter.",
    lessonSlug: "plc-fundamentals/io-troubleshooting",
    lessonTitle: "I/O Module Troubleshooting & Wiring",
  },

  "I:1/3": {
    instructionType: "XIC",
    address: "I:1/3",
    label: "GUARD",
    deviceName: "Guard Interlock Switch (GS1)",
    deviceDescription:
      "Tongue-style guard interlock switch (Allen-Bradley 440K) mounted on the conveyor access door. NC contact opens when the guard is removed or the door is opened.",
    wiringType: "NC",
    whyUsed:
      "XIC examines this input because the guard switch is wired energize-to-run. The NC contact keeps the input TRUE when the guard is in place (door closed). Opening the door removes the tongue → contact opens → input goes FALSE → XIC drops out → motor stops. Per OSHA 1910.212, the guard must prevent access to moving parts.",
    whenPasses:
      "Bit is TRUE → guard door is closed, tongue engaged → NC contact closed → power flows through → machine can run.",
    whenFails:
      "Bit is FALSE → guard door is open or tongue disengaged → NC contact opened → power broken → SAFE_RUN drops → motor stops.",
    commonFailure:
      "Misaligned tongue: vibration shifts the door frame so the tongue doesn't fully engage. Check mechanical alignment and verify continuity at TB1-5/6 with door closed.",
    lessonSlug: "plc-fundamentals/io-troubleshooting",
    lessonTitle: "I/O Module Troubleshooting & Wiring",
  },

  "I:1/4": {
    instructionType: "XIC",
    address: "I:1/4",
    label: "OL",
    deviceName: "Thermal Overload Relay (OL1)",
    deviceDescription:
      "Allen-Bradley 193-series bimetallic overload relay. NC auxiliary contact (95-96) wired to PLC input I:1/4. Trips on sustained overcurrent to protect the motor windings.",
    wiringType: "NC",
    whyUsed:
      "XIC examines this input because the overload relay NC contact keeps the input TRUE when the relay is NOT tripped. When overcurrent causes the bimetallic element to deflect, the NC contact opens → input goes FALSE → XIC drops out → motor output de-energizes. The overload must be manually reset before the motor can restart.",
    whenPasses:
      "Bit is TRUE → overload relay is reset (healthy) → NC contact closed → power flows through → motor output can energize.",
    whenFails:
      "Bit is FALSE → overload relay has tripped → NC contact opened → power broken at Rung 4 → M1 STARTER de-energizes → motor stops. Also triggers Rung 6 (XIO passes when FALSE → RED LT energizes).",
    commonFailure:
      "Nuisance trips from ambient heat or undersized heater elements. Check motor FLA vs. heater table. Also check for loose connections at terminals 95/96 that cause intermittent FALSE.",
    lessonSlug: "plc-fundamentals/io-troubleshooting",
    lessonTitle: "I/O Module Troubleshooting & Wiring",
  },

  "I:1/5": {
    instructionType: "XIO",
    address: "I:1/5",
    label: "PE CLEAR",
    deviceName: "Photoelectric Sensor (PE1)",
    deviceDescription:
      "Allen-Bradley 42EF retroreflective photoeye mounted at the conveyor discharge. Dark-operate: output energizes (TRUE) when the beam is blocked by product. Used as a jam detection interlock.",
    wiringType: "NO",
    whyUsed:
      "XIO (Examine If Open) examines this input because the photoeye is dark-operate — the input goes TRUE when the beam is blocked (product present). XIO passes when the bit is FALSE (beam clear, no jam). If product blocks the beam too long (TRUE), XIO drops out → motor stops to prevent pile-up damage.",
    whenPasses:
      "Bit is FALSE → beam is clear (no product blocking) → XIO passes → power flows through → motor can run.",
    whenFails:
      "Bit is TRUE → beam is blocked (product jam or sensor fault) → XIO does NOT pass → power broken → M1 STARTER de-energizes → conveyor stops.",
    commonFailure:
      "Dirty lens or misaligned reflector: sensor reads blocked (TRUE) even with no product. Clean the lens with a lint-free cloth. Check alignment with the built-in LED indicator. Also check for conveyor belt sag that enters the beam path.",
    lessonSlug: "plc-fundamentals/io-troubleshooting",
    lessonTitle: "I/O Module Troubleshooting & Wiring",
  },

  "B3:0/0": {
    instructionType: "XIC",
    address: "B3:0/0",
    label: "RUN_CMD",
    deviceName: "Run Command (Internal Bit B3:0/0)",
    deviceDescription:
      "Internal PLC bit — no physical field device. Set by the start/stop seal-in logic (Rung 1/1A). Used as a permissive in downstream rungs.",
    wiringType: "NO",
    whyUsed:
      "XIC examines this internal bit to verify the start/stop logic has sealed in. RUN_CMD is TRUE only when START was pressed and no STOP/E-STOP/GUARD has broken the seal. Downstream rungs (Safety Interlock, etc.) use this as their first permissive.",
    whenPasses:
      "Bit is TRUE → start/stop seal-in is active → operator has started the machine and no stop condition exists → downstream logic can proceed.",
    whenFails:
      "Bit is FALSE → seal-in is broken or never established → machine is in stopped state → no downstream outputs will energize.",
    commonFailure:
      "Not a field device — if this bit won't set, trace back to Rung 1: check STOP (I:1/0), E-STOP (I:1/2), GUARD (I:1/3), and START (I:1/1) inputs.",
    lessonSlug: "plc-fundamentals/ladder-logic-basics",
    lessonTitle: "Ladder Logic: Contacts, Coils, and Basic Instructions",
  },

  "B3:0/1": {
    instructionType: "XIC",
    address: "B3:0/1",
    label: "SAFE_RUN",
    deviceName: "Safe Run Permissive (Internal Bit B3:0/1)",
    deviceDescription:
      "Internal PLC bit — no physical field device. Set by the Safety Interlock rung (Rung 2). Confirms RUN_CMD is active AND E-STOP + Guard are healthy.",
    wiringType: "NO",
    whyUsed:
      "XIC examines this internal bit to confirm all safety permissives are met before starting the timer. SAFE_RUN is TRUE only when RUN_CMD is sealed AND both E-STOP and GUARD inputs are TRUE (healthy). This provides a single consolidated safety permissive for the start delay timer.",
    whenPasses:
      "Bit is TRUE → all safety conditions met → timer can begin counting → motor will start after 3-second delay.",
    whenFails:
      "Bit is FALSE → either RUN_CMD is not sealed or a safety device (E-STOP/GUARD) is faulted → timer resets → motor cannot start.",
    commonFailure:
      "Not a field device — if this bit won't set, check Rung 2 inputs: RUN_CMD (B3:0/0), E-STOP (I:1/2), GUARD (I:1/3).",
    lessonSlug: "plc-fundamentals/ladder-logic-basics",
    lessonTitle: "Ladder Logic: Contacts, Coils, and Basic Instructions",
  },

  "T4:0/DN": {
    instructionType: "XIC",
    address: "T4:0/DN",
    label: "TMR DONE",
    deviceName: "Start Delay Timer Done Bit (T4:0/DN)",
    deviceDescription:
      "Timer T4:0 done bit — set TRUE when the TON (Timer On-Delay) accumulator reaches the 3-second preset. No physical field device.",
    wiringType: "NO",
    whyUsed:
      "XIC examines the timer done bit to verify the 3-second pre-start warning period has elapsed. This gives personnel time to clear the area after the start sequence initiates. The motor output cannot energize until this bit is TRUE.",
    whenPasses:
      "Bit is TRUE → 3-second delay has elapsed → power flows through → motor output can energize (if OL and PE also pass).",
    whenFails:
      "Bit is FALSE → timer is still counting or has been reset (SAFE_RUN dropped) → motor cannot start yet.",
    commonFailure:
      "Not a field device — if the timer never reaches DN, check that SAFE_RUN (B3:0/1) stays TRUE for the full 3 seconds. Intermittent E-STOP or GUARD will reset the timer.",
    lessonSlug: "plc-fundamentals/timers-counters",
    lessonTitle: "Timers, Counters, and Comparison Instructions",
  },

  "O:2/0": {
    instructionType: "XIC",
    address: "O:2/0",
    label: "M1 STARTER",
    deviceName: "Motor Starter Output (O:2/0)",
    deviceDescription:
      "PLC output driving the M1 contactor coil via an interposing relay. When energized, the contactor pulls in and connects 3-phase power to the motor.",
    wiringType: "NO",
    whyUsed:
      "XIC examines this output bit in Rung 5 to drive the green run indicator light. When the motor starter output is ON (TRUE), the green light energizes to show the operator that the motor is running.",
    whenPasses:
      "Bit is TRUE → motor starter is energized → M1 contactor is pulled in → motor is running → green light can energize.",
    whenFails:
      "Bit is FALSE → motor starter is de-energized → motor is stopped → green light stays off.",
    commonFailure:
      "Output module fuse blown or relay contact welded. If the PLC shows O:2/0 ON but the motor doesn't run, check voltage at the output terminal and the contactor coil.",
    lessonSlug: "plc-fundamentals/program-troubleshooting",
    lessonTitle: "Online Troubleshooting & Forcing I/O",
  },

  "I:1/4_XIO": {
    instructionType: "XIO",
    address: "I:1/4",
    label: "OL",
    deviceName: "Thermal Overload Relay (OL1) — Fault Indicator",
    deviceDescription:
      "Same overload relay as Rung 4, but examined with XIO in Rung 6 for the fault indicator logic.",
    wiringType: "NC",
    whyUsed:
      "XIO examines this input in Rung 6 because we want the RED fault light to energize when the overload HAS tripped. The OL NC contact opens on trip → input goes FALSE → XIO passes when FALSE → RED LT coil energizes. This is the inverse logic of Rung 4's XIC.",
    whenPasses:
      "Bit is FALSE → overload relay has tripped (NC contact open) → XIO passes → RED LT energizes → operator sees fault indication.",
    whenFails:
      "Bit is TRUE → overload relay is healthy (NC contact closed) → XIO does NOT pass → RED LT stays off → no fault indication (normal operation).",
    commonFailure:
      "Same physical device as Rung 4. If RED LT is always on, the overload is tripped — check motor current draw and heater sizing.",
    lessonSlug: "plc-fundamentals/io-troubleshooting",
    lessonTitle: "I/O Module Troubleshooting & Wiring",
  },
};

/**
 * Output instruction descriptions — OTE coils and TON timers.
 * Keyed by output address.
 */
const OUTPUT_DESCRIPTIONS: Record<string, InstructionDescription> = {
  "B3:0/0": {
    instructionType: "OTE",
    address: "B3:0/0",
    label: "RUN_CMD",
    deviceName: "Run Command (Internal Bit)",
    deviceDescription:
      "Internal storage bit in the B3 data file. Not wired to a physical output — it's a software latch that remembers the operator pressed START. The seal-in contact (Rung 1A) holds this bit TRUE after the momentary START pushbutton is released.",
    whyUsed:
      "OTE (Output Energize) sets B3:0/0 TRUE when all conditions in the rung are met. This is the classic start/stop seal-in pattern — the coil latches via its own XIC contact in a parallel branch, and any NC safety device (STOP, E-STOP, GUARD) breaks the rung to unlatch.",
    whenPasses:
      "Bit B3:0/0 = TRUE. The seal-in holds, downstream rungs see RUN_CMD as energized, and the safety interlock rung (Rung 2) can proceed.",
    whenFails:
      "Bit B3:0/0 = FALSE. Motor permissive drops, timer resets, outputs de-energize. Operator must press START again to re-latch.",
    commonFailure:
      "If RUN_CMD won't latch: check that the seal-in XIC (B3:0/0) in Rung 1A is present and that no safety device is holding the rung open. If it latches but immediately drops, a safety input is bouncing.",
    lessonSlug: "plc-fundamentals/ladder-logic-basics",
    lessonTitle: "Ladder Logic: Contacts, Coils, and Basic Instructions",
  },
  "B3:0/1": {
    instructionType: "OTE",
    address: "B3:0/1",
    label: "SAFE_RUN",
    deviceName: "Safety Interlock Permissive (Internal Bit)",
    deviceDescription:
      "Internal permissive bit that confirms both the software RUN_CMD is latched AND the hardwired safety devices (E-STOP, GUARD) are still healthy. This is the PLC's monitoring layer — the actual safety function is performed by the hardwired safety relay circuit.",
    whyUsed:
      "OTE sets B3:0/1 TRUE only when RUN_CMD is latched and both safety inputs read TRUE. This gives downstream logic a single clean permissive bit to check instead of re-examining every safety device in every rung.",
    whenPasses:
      "Bit B3:0/1 = TRUE. The start-delay timer (Rung 3) begins counting. The motor is one step closer to running.",
    whenFails:
      "Bit B3:0/1 = FALSE. Timer resets immediately, motor output drops. The machine stops and the pre-start warning is cancelled.",
    commonFailure:
      "SAFE_RUN won't energize even though RUN_CMD is latched: one of the safety inputs (I:1/2 or I:1/3) is reading FALSE. Check E-STOP reset, guard interlock alignment, and wiring continuity to the input module.",
    lessonSlug: "plc-fundamentals/io-troubleshooting",
    lessonTitle: "I/O Module Troubleshooting & Wiring",
  },
  "T4:0": {
    instructionType: "TON",
    address: "T4:0",
    label: "START_DLY",
    deviceName: "Start Delay Timer (TON — Timer On-Delay)",
    deviceDescription:
      "Allen-Bradley Timer On-Delay instruction. When the rung goes TRUE, the timer accumulator counts up from 0 toward the preset (3 seconds). When ACC \u2265 PRE, the Done bit (T4:0/DN) energizes. If the rung goes FALSE at any time, the timer resets to 0.",
    whyUsed:
      "TON provides a 3-second pre-start warning window. OSHA 1910.147 and ANSI/NFPA 79 require an audible/visual warning before conveyor motion begins. The timer ensures the horn/strobe runs for the full preset before the motor starts.",
    whenPasses:
      "Timer accumulating. When ACC reaches 3s, T4:0/DN goes TRUE and the motor output rung (Rung 4) can energize. The green stack light and conveyor motion begin.",
    whenFails:
      "Timer resets to 0. T4:0/DN goes FALSE immediately, motor output drops. Any interruption to SAFE_RUN restarts the full 3-second countdown.",
    commonFailure:
      "Timer never reaches DN: SAFE_RUN is bouncing (intermittent safety input). Timer stuck at 0: check that B3:0/1 is TRUE. Timer preset wrong: verify T4:0.PRE = 3000 (milliseconds in SLC 500) in the data table.",
    lessonSlug: "plc-fundamentals/ladder-logic-basics",
    lessonTitle: "Ladder Logic: Contacts, Coils, and Basic Instructions",
  },
  "O:2/0": {
    instructionType: "OTE",
    address: "O:2/0",
    label: "M1 STARTER",
    deviceName: "Motor Starter Output (Physical Output)",
    deviceDescription:
      "Physical discrete output on the SLC 500 output module, slot 2, terminal 0. This output energizes the M1 contactor coil through an interposing relay or directly (depending on current rating). When energized, the 3-phase contactor closes its power poles and the conveyor motor runs.",
    whyUsed:
      "OTE drives the physical output that starts the motor. All upstream conditions (timer done, overload healthy, photoeye clear) must be TRUE for this rung to pass. This is the final control element in the start sequence.",
    whenPasses:
      "Output O:2/0 = ON. The M1 contactor energizes, power poles close, motor runs. Green stack light (O:2/1) also energizes via Rung 5.",
    whenFails:
      "Output O:2/0 = OFF. Contactor drops out, motor coasts to stop. Red stack light may energize if the cause is an overload trip.",
    commonFailure:
      "Output ON but motor won't run: check contactor coil voltage, power pole condition, and overload heater sizing. Output won't come ON: verify T4:0/DN is TRUE, I:1/4 (OL) is TRUE, and I:1/5 (PE) is FALSE. Check output module fuse.",
    lessonSlug: "plc-fundamentals/io-troubleshooting",
    lessonTitle: "I/O Module Troubleshooting & Wiring",
  },
  "O:2/1": {
    instructionType: "OTE",
    address: "O:2/1",
    label: "GREEN LT",
    deviceName: "Green Stack Light (Run Indicator)",
    deviceDescription:
      "Physical output driving the green lens on the machine's stack light (tower light). Indicates the conveyor is running normally. Wired to output module slot 2, terminal 1.",
    whyUsed:
      "OTE mirrors the motor output state. XIC examines O:2/0 — when the motor output is ON, the green light is ON. This gives operators a clear visual confirmation that the machine is in automatic run mode.",
    whenPasses:
      "Green stack light ON. Operators and maintenance can see from across the floor that Line 4 is running.",
    whenFails:
      "Green light OFF. Either the motor isn't running or the output module/bulb has failed. If motor is running but green light is off, check the output point and lamp.",
    commonFailure:
      "Green light burned out (LED stack lights rarely fail, but incandescent ones do). Output module terminal corroded. If the light flickers, check for loose wiring at the terminal block or a marginal output transistor.",
    lessonSlug: "plc-fundamentals/io-troubleshooting",
    lessonTitle: "I/O Module Troubleshooting & Wiring",
  },
  "O:2/2": {
    instructionType: "OTE",
    address: "O:2/2",
    label: "RED LT",
    deviceName: "Red Stack Light (Fault Indicator)",
    deviceDescription:
      "Physical output driving the red lens on the machine's stack light. Indicates a fault condition — specifically an overload trip. Wired to output module slot 2, terminal 2.",
    whyUsed:
      "OTE energizes when the overload contact reads FALSE (tripped). XIO examines I:1/4 — it passes when the bit is FALSE, meaning the overload relay has tripped and opened its NC monitoring contact. This is the inverse logic: red light ON = problem.",
    whenPasses:
      "Red stack light ON. Alerts operators and maintenance that the overload has tripped. The motor is stopped and requires manual reset of the OL relay before restarting.",
    whenFails:
      "Red light OFF. Normal operation — overload is healthy, no fault present.",
    commonFailure:
      "Red light always on at startup: overload relay hasn't been reset after a previous trip. Red light never comes on during a real overload: check output point O:2/2, lamp, and wiring. Verify I:1/4 actually goes FALSE when OL trips.",
    lessonSlug: "plc-fundamentals/io-troubleshooting",
    lessonTitle: "I/O Module Troubleshooting & Wiring",
  },
};

/**
 * Get the instruction description for a given element.
 * Handles contacts (XIC/XIO) and outputs (OTE/TON).
 */
export function getInstructionDescription(
  address: string,
  type: "XIC" | "XIO" | "OTE" | "TON"
): InstructionDescription | null {
  // Output types — look up in OUTPUT_DESCRIPTIONS
  if (type === "OTE" || type === "TON") {
    return OUTPUT_DESCRIPTIONS[address] ?? null;
  }
  // Special case: I:1/4 has different explanations for XIC vs XIO usage
  if (address === "I:1/4" && type === "XIO") {
    return INSTRUCTION_DESCRIPTIONS["I:1/4_XIO"] ?? null;
  }
  return INSTRUCTION_DESCRIPTIONS[address] ?? null;
}
