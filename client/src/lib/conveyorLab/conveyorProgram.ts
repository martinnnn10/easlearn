export interface RungElement {
  type: "XIC" | "XIO";
  address: string;
  label: string;
  isCrossRef?: boolean;
}

export interface RungOutput {
  type: "coil" | "timer_on";
  address: string;
  label: string;
  timerPreset?: number;
}

export interface ConveyorRung {
  id: string;
  label: string;
  description: string;
  elements: RungElement[];
  output: RungOutput;
}

/**
 * Packaging Line 4 — conveyor start/stop with safety interlock and TON delay.
 *
 * Allen-Bradley PLC ladder logic instructions:
 *   XIC (Examine If Closed) — passes power when the addressed bit is TRUE (1).
 *   XIO (Examine If Open)   — passes power when the addressed bit is FALSE (0).
 *
 * Fail-safe (energize-to-run) wiring: STOP, E-STOP, GUARD and OVERLOAD are NC
 * field contacts that keep their PLC input energized (TRUE) when healthy, so
 * they are examined with XIC. Pressing a device or losing the conductor
 * de-energizes the input (FALSE) and the XIC drops out, stopping the motor.
 *
 * The photoeye is a dark-operate jam interlock examined with XIO: the input
 * energizes (TRUE) when the beam is blocked. XIO passes when FALSE (clear),
 * so a blocked beam drops the rung.
 */
export const CONVEYOR_RUNGS: ConveyorRung[] = [
  {
    id: "rung-1",
    label: "Rung 1 — Start/Stop Seal-In",
    description: "Press START to energize RUN_CMD. STOP/E-STOP/GUARD are NC field devices wired energize-to-run — examined XIC so de-energizing any one breaks the circuit.",
    elements: [
      { type: "XIC", address: "I:1/0", label: "STOP" },
      { type: "XIC", address: "I:1/2", label: "E-STOP" },
      { type: "XIC", address: "I:1/3", label: "GUARD" },
      { type: "XIC", address: "I:1/1", label: "START" },
    ],
    output: { type: "coil", address: "B3:0/0", label: "RUN_CMD" },
  },
  {
    id: "rung-1a",
    label: "Rung 1A — Seal-In",
    description: "RUN_CMD contact (XIC) holds the circuit after START is released.",
    elements: [
      { type: "XIC", address: "I:1/0", label: "STOP" },
      { type: "XIC", address: "I:1/2", label: "E-STOP" },
      { type: "XIC", address: "I:1/3", label: "GUARD" },
      { type: "XIC", address: "B3:0/0", label: "RUN_CMD", isCrossRef: true },
    ],
    output: { type: "coil", address: "B3:0/0", label: "RUN_CMD" },
  },
  {
    id: "rung-2",
    label: "Rung 2 — Safety Interlock",
    description: "Motor permissive: RUN_CMD sealed and E-STOP + guard energized (XIC). In the real machine, E-STOP and guard also hard-wire through a safety relay that drops the M1 contactor directly — the PLC monitors, it is not the safety function.",
    elements: [
      { type: "XIC", address: "B3:0/0", label: "RUN_CMD", isCrossRef: true },
      { type: "XIC", address: "I:1/2", label: "E-STOP" },
      { type: "XIC", address: "I:1/3", label: "GUARD" },
    ],
    output: { type: "coil", address: "B3:0/1", label: "SAFE_RUN" },
  },
  {
    id: "rung-3",
    label: "Rung 3 — Start Delay (TON)",
    description: "3-second on-delay after safety conditions are met (pre-start warning window).",
    elements: [{ type: "XIC", address: "B3:0/1", label: "SAFE_RUN", isCrossRef: true }],
    output: { type: "timer_on", address: "T4:0", label: "START_DLY", timerPreset: 3 },
  },
  {
    id: "rung-4",
    label: "Rung 4 — Motor Output",
    description: "Energize M1 starter when timer is done (XIC), overload is healthy (XIC — NC contact keeps bit TRUE), and photoeye is clear (XIO — bit is FALSE when beam is unblocked).",
    elements: [
      { type: "XIC", address: "T4:0/DN", label: "TMR DONE", isCrossRef: true },
      { type: "XIC", address: "I:1/4", label: "OL" },
      { type: "XIO", address: "I:1/5", label: "PE CLEAR" },
    ],
    output: { type: "coil", address: "O:2/0", label: "M1 STARTER" },
  },
  {
    id: "rung-5",
    label: "Rung 5 — Run Indicator",
    description: "Green stack light when the M1 starter output is on (XIC).",
    elements: [{ type: "XIC", address: "O:2/0", label: "M1 STARTER", isCrossRef: true }],
    output: { type: "coil", address: "O:2/1", label: "GREEN LT" },
  },
  {
    id: "rung-6",
    label: "Rung 6 — Fault Indicator",
    description: "Red stack light on overload trip. XIO examines OL — passes when bit is FALSE (tripped), so the red light energizes only when overload has dropped out.",
    elements: [{ type: "XIO", address: "I:1/4", label: "OL" }],
    output: { type: "coil", address: "O:2/2", label: "RED LT" },
  },
];

export const INPUT_LABELS: Record<string, string> = {
  "I:1/0": "STOP PB",
  "I:1/1": "START PB",
  "I:1/2": "E-STOP",
  "I:1/3": "GUARD SW",
  "I:1/4": "OVERLOAD",
  "I:1/5": "PHOTOEYE",
};

export const INPUT_ADDRESSES = Object.keys(INPUT_LABELS);

export const OUTPUT_STATUS_ITEMS = [
  { addr: "B3:0/0", label: "RUN_CMD" },
  { addr: "B3:0/1", label: "SAFE_RUN" },
  { addr: "T4:0/DN", label: "TMR DONE" },
  { addr: "O:2/0", label: "M1 STARTER" },
  { addr: "O:2/1", label: "GREEN LT" },
  { addr: "O:2/2", label: "RED LT" },
];

export function createInitialPlcState(): import("./types").PlcState {
  const inputs: Record<string, boolean> = {};
  INPUT_ADDRESSES.forEach((addr) => { inputs[addr] = false; });
  return {
    inputs,
    internals: {},
    outputs: {},
    timers: {
      "T4:0": { preset: 3, accumulated: 0, running: false, done: false },
    },
    scanCount: 0,
  };
}

export function createInitialMachineState(): import("./types").MachineState {
  return {
    beltRunning: false,
    motorCoilEnergized: false,
    contactorPulled: false,
    photoeyeBlocked: false,
    estopPressed: false,
    guardOpen: false,
    overloadTripped: false,
    productOnBelt: true,
    mechanicalFault: false,
    fpm: 0,
    greenLight: false,
    redLight: false,
    safeRun: false,
    runCmd: false,
    timerDone: false,
  };
}
