/**
 * Beginner Meter Exercise configurations for Basic Meter Usage module.
 * Each exercise reuses the VirtualMultimeterLab architecture.
 */
import type { MeterExerciseConfig } from "@/components/interactive/BeginnerMeterExercise";

// ─── Exercise 1: Meter Setup ────────────────────────────────────────────────
export const exercise1_meterSetup: MeterExerciseConfig = {
  id: "meter-setup",
  title: "Meter Setup",
  objective: "Configure the meter correctly: select the COM terminal, V/Ω terminal, and AC voltage function before measuring a 120V control circuit.",
  circuitState: "energized",
  testPoints: [
    { id: "COM", label: "COM Terminal", description: "Black lead connects here", color: "oklch(0.50 0.008 250)" },
    { id: "V_OHM", label: "V/Ω Terminal", description: "Red lead for voltage/resistance", color: "oklch(0.65 0.15 30)" },
    { id: "A_TERM", label: "A Terminal", description: "Current measurement only", color: "oklch(0.55 0.12 250)" },
    { id: "CTRL_HOT", label: "Control Hot (120V)", description: "Energized control wire", color: "oklch(0.65 0.12 50)" },
    { id: "CTRL_NEUT", label: "Control Neutral", description: "Return path", color: "oklch(0.50 0.008 250)" },
  ],
  correctFunction: "vac",
  correctProbe1: "CTRL_HOT",
  correctProbe2: "CTRL_NEUT",
  expectedReading: {
    reading: "120",
    unit: "V AC",
    explanation: "120V AC is the standard US industrial control circuit voltage. This confirms the control transformer is working and power is available.",
    isCorrectSetting: true,
    isSafe: true,
  },
  unsafeMessage: "You selected resistance/continuity on an ENERGIZED circuit. This can destroy the meter and cause an arc flash. The circuit is live — use a voltage function.",
  verifies: "Control voltage is present (120V AC at the control transformer secondary)",
  remainsUnverified: "Whether downstream devices (contactors, relays) are receiving this voltage",
};

// ─── Exercise 2: Measure AC Control Voltage ─────────────────────────────────
export const exercise2_measureACVoltage: MeterExerciseConfig = {
  id: "measure-ac-voltage",
  title: "Measure AC Control Voltage",
  objective: "A contactor coil should have 120V AC when the PLC commands it ON. Measure across the coil to verify voltage is present.",
  circuitState: "energized",
  testPoints: [
    { id: "COIL_A1", label: "Coil Terminal A1", description: "Power input to coil", color: "oklch(0.65 0.12 50)" },
    { id: "COIL_A2", label: "Coil Terminal A2", description: "Return side of coil", color: "oklch(0.50 0.008 250)" },
    { id: "OL_LINE", label: "OL Line Side", description: "Before overload contact", color: "oklch(0.55 0.12 250)" },
    { id: "OL_LOAD", label: "OL Load Side", description: "After overload contact", color: "oklch(0.55 0.12 250)" },
    { id: "FUSE_LINE", label: "Fuse Line Side", description: "Power input to fuse", color: "oklch(0.65 0.15 30)" },
    { id: "FUSE_LOAD", label: "Fuse Load Side", description: "Output of fuse", color: "oklch(0.65 0.15 30)" },
  ],
  correctFunction: "vac",
  correctProbe1: "COIL_A1",
  correctProbe2: "COIL_A2",
  expectedReading: {
    reading: "0.0",
    unit: "V AC",
    explanation: "0V across the coil means voltage is NOT reaching the coil, even though the PLC is commanding ON. The fault is upstream — in the wire, fuse, overload contact, or output card.",
    isCorrectSetting: true,
    isSafe: true,
  },
  plcState: { output: "O:2/0", status: "ON" },
  unsafeMessage: "You selected resistance/continuity on an ENERGIZED circuit. The control circuit is live. Use V AC to measure voltage safely.",
  verifies: "Voltage is NOT present at the contactor coil (0V despite PLC commanding ON)",
  remainsUnverified: "Where the break is: output card, fuse, overload contact, or wire",
};

// ─── Exercise 3: Software State vs Physical Voltage ─────────────────────────
export const exercise3_softwareVsPhysical: MeterExerciseConfig = {
  id: "software-vs-physical",
  title: "Software State vs. Physical Voltage",
  objective: "The PLC shows output ON and the indicator light is illuminated. Verify whether physical voltage is actually present at the output terminal.",
  circuitState: "energized",
  plcState: { output: "O:2/0", status: "ON" },
  testPoints: [
    { id: "OUTPUT_TERM", label: "PLC Output Terminal", description: "Physical output connection", color: "oklch(0.55 0.12 155)" },
    { id: "OUTPUT_COM", label: "Output Common", description: "DC common for output card", color: "oklch(0.50 0.008 250)" },
    { id: "INPUT_0", label: "PLC Input I:1/0", description: "Sensor input terminal", color: "oklch(0.55 0.12 250)" },
    { id: "INDICATOR", label: "Indicator Light", description: "Panel-mounted LED (illuminated)", color: "oklch(0.65 0.12 50)" },
  ],
  correctFunction: "vdc",
  correctProbe1: "OUTPUT_TERM",
  correctProbe2: "OUTPUT_COM",
  expectedReading: {
    reading: "0.0",
    unit: "V DC",
    explanation: "0V DC at the physical output terminal despite the PLC software showing ON. This proves the output card has failed — the PLC is commanding the output, but no physical voltage is being produced. The indicator light was powered by a separate circuit and does NOT prove output voltage.",
    isCorrectSetting: true,
    isSafe: true,
  },
  unsafeMessage: "You selected resistance/continuity on an ENERGIZED PLC output card. The card is powered. Use V DC to safely measure the output voltage.",
  verifies: "Physical voltage is NOT present at the output terminal (output card failure confirmed)",
  remainsUnverified: "Whether the output card fuse is blown, or the card itself has failed internally",
};

// ─── Exercise 4: Safe Continuity Decision ───────────────────────────────────
export const exercise4_safeContinuity: MeterExerciseConfig = {
  id: "safe-continuity",
  title: "Safe Continuity Decision",
  objective: "A wire is suspected broken between the junction box and the motor. The circuit has been de-energized and LOTO applied. Verify zero energy, then test continuity.",
  circuitState: "de-energized",
  testPoints: [
    { id: "JB_TERM_1", label: "JB Terminal 1", description: "Junction box wire landing", color: "oklch(0.55 0.12 155)" },
    { id: "MOTOR_T1", label: "Motor Terminal T1", description: "Motor connection point", color: "oklch(0.55 0.12 155)" },
    { id: "JB_TERM_2", label: "JB Terminal 2", description: "Adjacent wire (different circuit)", color: "oklch(0.55 0.12 250)" },
    { id: "GND", label: "Ground Bus", description: "Equipment ground", color: "oklch(0.55 0.15 90)" },
  ],
  correctFunction: "continuity",
  correctProbe1: "JB_TERM_1",
  correctProbe2: "MOTOR_T1",
  expectedReading: {
    reading: "OL",
    unit: "(no beep)",
    explanation: "No continuity between the junction box terminal and the motor terminal. The wire is open (broken) somewhere between these two points. This confirms your hypothesis that the wire is damaged.",
    isCorrectSetting: true,
    isSafe: true,
  },
  verifies: "The wire between JB Terminal 1 and Motor T1 is open (broken)",
  remainsUnverified: "Exact location of the break along the wire run",
};

// ─── Exercise 5: Interpret and Document ─────────────────────────────────────
export const exercise5_interpretAndDocument: MeterExerciseConfig = {
  id: "interpret-and-document",
  title: "Interpret and Document",
  objective: "Measure voltage across a fuse in a 480V motor circuit, then document your finding using the 6-field framework.",
  circuitState: "energized",
  testPoints: [
    { id: "FUSE_LINE", label: "Fuse Line Side", description: "Power input (from source)", color: "oklch(0.65 0.15 30)" },
    { id: "FUSE_LOAD", label: "Fuse Load Side", description: "Power output (to load)", color: "oklch(0.65 0.15 30)" },
    { id: "L1", label: "L1 Bus", description: "480V Phase A", color: "oklch(0.65 0.15 30)" },
    { id: "L2", label: "L2 Bus", description: "480V Phase B", color: "oklch(0.65 0.15 30)" },
    { id: "MOTOR_T1", label: "Motor T1", description: "Motor terminal", color: "oklch(0.55 0.12 155)" },
  ],
  correctFunction: "vac",
  correctProbe1: "FUSE_LINE",
  correctProbe2: "FUSE_LOAD",
  expectedReading: {
    reading: "480",
    unit: "V AC",
    explanation: "480V across the fuse means all source voltage is dropping across this component. A good fuse would show 0V (no voltage drop across a closed path). 480V across the fuse proves it is OPEN (blown).",
    isCorrectSetting: true,
    isSafe: true,
  },
  unsafeMessage: "You selected resistance/continuity on an ENERGIZED 480V circuit. This is extremely dangerous and can cause arc flash. Use V AC.",
  requiresDocumentation: true,
  verifies: "Fuse is blown (open) — all 480V drops across the open fuse",
  remainsUnverified: "Why the fuse blew (overcurrent cause: short circuit, overload, or ground fault downstream)",
};

/** All exercises in order */
export const ALL_METER_EXERCISES = [
  exercise1_meterSetup,
  exercise2_measureACVoltage,
  exercise3_softwareVsPhysical,
  exercise4_safeContinuity,
  exercise5_interpretAndDocument,
];
