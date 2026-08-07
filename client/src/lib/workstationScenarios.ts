/**
 * Workstation Scenario Adapter
 *
 * Drives the workstation prototype from existing fault engine data
 * without altering the fault engine, Assessment Spine, scoring, or evidence model.
 *
 * Each scenario configuration maps an existing FaultId to:
 * - symptom badge text (header + mobile context bar)
 * - initial hypotheses grouped by diagnostic zone
 * - PLC I/O status panel configuration
 * - default meter probe selection
 * - corrective action label and logic
 * - fault-cleared detection
 * - safety-blocked probes
 */
import type { FaultId, MeterMode, MeterProbeId, PlcState, MachineState } from "./conveyorLab/types";

// ─── Hypothesis Status Model ────────────────────────────────────────────────
export type HypothesisStatus = "untested" | "supported" | "weakened" | "eliminated" | "confirmed";

export interface Hypothesis {
  id: string;
  text: string;
  status: HypothesisStatus;
  zone: string;
}

// ─── Diagnostic Zone ────────────────────────────────────────────────────────
export interface DiagnosticZone {
  id: string;
  label: string;
  /** Short description of what this zone covers */
  description: string;
  /** Hypothesis IDs belonging to this zone */
  hypothesisIds: string[];
}

// ─── PLC I/O Status Configuration ───────────────────────────────────────────
export interface PlcIoConfig {
  /** Output address being monitored (e.g., "O:2/0") */
  outputAddress: string;
  /** Human-readable output label */
  outputLabel: string;
  /** Associated wire number from output terminal to load */
  wireNumber: string;
  /** Associated terminal designation */
  terminal: string;
  /** Expected field voltage when output is ON */
  expectedVoltage: string;
  /** Probe ID that measures the output terminal voltage */
  outputProbe: MeterProbeId;
  /** Teaching message displayed in the panel */
  teachingMessage: string;
  /** Precise fault model description for this scenario */
  faultModelDescription: string;
}

// ─── Scenario Interface ─────────────────────────────────────────────────────
export interface WorkstationScenario {
  faultId: FaultId;
  /** Short badge text for header and mobile context bar */
  badgeText: string;
  /** Badge color class (bg + text) */
  badgeColor: string;
  /** Default meter probe to start with */
  defaultProbe: MeterProbeId;
  /** Default meter mode */
  defaultMode: MeterMode;
  /** Diagnostic zones for this scenario */
  zones: DiagnosticZone[];
  /** Initial hypotheses — technically plausible for this fault, grouped by zone */
  initialHypotheses: { id: string; text: string; zone: string }[];
  /** Top 3 hypothesis IDs to show initially on mobile (one per zone ideally) */
  mobileInitialHypotheses: string[];
  /** PLC I/O status panel configuration */
  plcIoConfig: PlcIoConfig;
  /** Corrective action button label (active state) */
  correctiveActionLabel: string;
  /** Corrective action button label (resolved state) */
  resolvedLabel: string;
  /** Function to determine if the fault is cleared based on machine state */
  isFaultCleared: (machine: MachineState) => boolean;
  /** Function to determine if corrective action button should be disabled */
  isCorrectiveDisabled: (machine: MachineState) => boolean;
  /** Probes that are unsafe when energized — blocks measurement with safety violation */
  unsafeWhenEnergized: { probe: MeterProbeId; condition: (machine: MachineState) => boolean; message: string }[];
  /** Closeout corrective action text when resolved */
  closeoutResolvedText: string;
  /** Closeout corrective action text when pending */
  closeoutPendingText: string;
  /** Derive PLC I/O panel live values from current state */
  derivePlcIoState: (plc: PlcState, machine: MachineState, measuredOutputVoltage: string | null) => PlcIoLiveState;
}

// ─── PLC I/O Live State (derived per scan) ──────────────────────────────────
export interface PlcIoLiveState {
  /** PLC program output instruction state */
  logicCommand: "ON" | "OFF";
  /** Output instruction evaluated state */
  outputInstructionState: "TRUE" | "FALSE";
  /** Output channel indicator (LED on module) */
  outputChannelIndicator: "ON" | "OFF";
  /** Field power present at output module */
  fieldPowerPresent: "YES" | "NO" | "NOT VERIFIED";
  /** Measured voltage at output terminal */
  measuredOutputVoltage: string;
  /** Status source for each value */
  statusSources: {
    logicCommand: "software state";
    outputInstruction: "software state";
    outputChannel: "visual indicator";
    fieldPower: "measured value" | "not verified";
    outputVoltage: "measured value" | "not verified";
  };
}

// ─── Scenario Definitions ───────────────────────────────────────────────────

export const WORKSTATION_SCENARIOS: Record<string, WorkstationScenario> = {
  overload_tripped: {
    faultId: "overload_tripped",
    badgeText: "OVERLOAD TRIP",
    badgeColor: "bg-red-900/40 text-red-400",
    defaultProbe: "overload_nc",
    defaultMode: "continuity",
    zones: [
      {
        id: "protection",
        label: "ZONE 1 — Protection Circuit",
        description: "Overload relay, thermal element, and trip mechanism",
        hypothesisIds: ["h1"],
      },
      {
        id: "power_path",
        label: "ZONE 2 — Power Path / Motor",
        description: "Motor windings, connections, and mechanical load",
        hypothesisIds: ["h2", "h3"],
      },
    ],
    initialHypotheses: [
      { id: "h1", text: "Overload relay tripped due to excessive current draw", zone: "protection" },
      { id: "h2", text: "Loose connection at motor terminals causing high resistance", zone: "power_path" },
      { id: "h3", text: "Motor winding failure (short or ground fault)", zone: "power_path" },
    ],
    mobileInitialHypotheses: ["h1", "h2", "h3"],
    plcIoConfig: {
      outputAddress: "O:2/0",
      outputLabel: "Motor Output (O:2/0)",
      wireNumber: "W1",
      terminal: "TB2-1",
      expectedVoltage: "24 VDC",
      outputProbe: "output_terminal",
      teachingMessage: "A software bit being ON does not prove field voltage exists. Place meter leads at the PLC output terminal to verify.",
      faultModelDescription: "Overload relay NC contact opened (thermal trip). PLC output O:2/0 is FALSE because the overload input I:1/4 breaks the logic chain in Rung 4. No motor command is issued.",
    },
    correctiveActionLabel: "Reset Overload Relay (Corrective Action)",
    resolvedLabel: "Fault Cleared — Motor Running",
    isFaultCleared: (m) => !m.overloadTripped,
    isCorrectiveDisabled: (m) => !m.overloadTripped,
    unsafeWhenEnergized: [
      {
        probe: "motor_coil",
        condition: (m) => m.motorCoilEnergized,
        message: "Attempted continuity/resistance on energized contactor coil without de-energizing",
      },
    ],
    closeoutResolvedText: "Overload relay reset — motor returned to service",
    closeoutPendingText: "Pending — overload fault not yet resolved",
    derivePlcIoState: (plc, _machine, measuredVoltage) => {
      const outputOn = plc.outputs["O:2/0"] ?? false;
      return {
        logicCommand: outputOn ? "ON" : "OFF",
        outputInstructionState: outputOn ? "TRUE" : "FALSE",
        outputChannelIndicator: outputOn ? "ON" : "OFF",
        fieldPowerPresent: measuredVoltage ? "YES" : "NOT VERIFIED",
        measuredOutputVoltage: measuredVoltage ?? "NOT VERIFIED",
        statusSources: {
          logicCommand: "software state",
          outputInstruction: "software state",
          outputChannel: "visual indicator",
          fieldPower: measuredVoltage ? "measured value" : "not verified",
          outputVoltage: measuredVoltage ? "measured value" : "not verified",
        },
      };
    },
  },

  output_on_motor_dead: {
    faultId: "output_on_motor_dead",
    badgeText: "OUTPUT ON / MOTOR DEAD",
    badgeColor: "bg-amber-900/40 text-amber-400",
    defaultProbe: "motor_coil",
    defaultMode: "voltage",
    zones: [
      {
        id: "plc_output",
        label: "ZONE 1 — PLC / Output Stage",
        description: "PLC output instruction, output module channel, field power supply",
        hypothesisIds: ["h1", "h2", "h3"],
      },
      {
        id: "control_circuit",
        label: "ZONE 2 — Control Circuit / Contactor",
        description: "Control wiring from output terminal to contactor coil, coil integrity, mechanical linkage",
        hypothesisIds: ["h4", "h5", "h6", "h7"],
      },
      {
        id: "power_motor",
        label: "ZONE 3 — Power Circuit / Motor",
        description: "Contactor power contacts, overload, motor terminals, motor condition",
        hypothesisIds: ["h8", "h9"],
      },
    ],
    initialHypotheses: [
      { id: "h1", text: "PLC output bit ON but no field voltage at output terminal", zone: "plc_output" },
      { id: "h2", text: "Missing output-module field power (24 VDC supply)", zone: "plc_output" },
      { id: "h3", text: "Failed PLC output channel (transistor/triac open)", zone: "plc_output" },
      { id: "h4", text: "Open control wire between output terminal and contactor coil A1", zone: "control_circuit" },
      { id: "h5", text: "Open contactor coil (A1–A2 infinite resistance)", zone: "control_circuit" },
      { id: "h6", text: "Open control common/return path (A2 to 0V)", zone: "control_circuit" },
      { id: "h7", text: "Contactor coil energizes but power contacts fail to close (mechanical)", zone: "control_circuit" },
      { id: "h8", text: "Overload or downstream power path remains open", zone: "power_motor" },
      { id: "h9", text: "Three-phase voltage reaches motor but motor has failed (winding open/seized)", zone: "power_motor" },
    ],
    mobileInitialHypotheses: ["h1", "h4", "h7"],
    plcIoConfig: {
      outputAddress: "O:2/0",
      outputLabel: "Motor Output (O:2/0)",
      wireNumber: "W1",
      terminal: "TB2-1",
      expectedVoltage: "24 VDC",
      outputProbe: "output_terminal",
      teachingMessage: "A software bit being ON does not prove field voltage exists. Place meter leads at the PLC output terminal to verify.",
      faultModelDescription: "PLC output O:2/0 is TRUE. Field power is present. Output channel is functional. Control voltage reaches contactor coil A1–A2 (~24 VDC measured). Contactor coil energizes but mechanical linkage has failed — power contacts do not close. Motor receives no three-phase power. Root cause: contactor mechanical failure (power contacts fail to close despite coil energization).",
    },
    correctiveActionLabel: "Replace Contactor / Repair Mechanical Fault",
    resolvedLabel: "Fault Cleared — Motor Running",
    isFaultCleared: (m) => m.beltRunning,
    isCorrectiveDisabled: (m) => m.beltRunning,
    unsafeWhenEnergized: [
      {
        probe: "motor_coil",
        condition: (m) => m.motorCoilEnergized,
        message: "Attempted resistance measurement on energized contactor coil A1–A2 without isolating power",
      },
    ],
    closeoutResolvedText: "Contactor replaced — mechanical fault repaired — motor returned to service",
    closeoutPendingText: "Pending — contactor mechanical fault not yet resolved",
    derivePlcIoState: (plc, _machine, measuredVoltage) => {
      const outputOn = plc.outputs["O:2/0"] ?? false;
      return {
        logicCommand: outputOn ? "ON" : "OFF",
        outputInstructionState: outputOn ? "TRUE" : "FALSE",
        outputChannelIndicator: outputOn ? "ON" : "OFF",
        fieldPowerPresent: measuredVoltage ? "YES" : "NOT VERIFIED",
        measuredOutputVoltage: measuredVoltage ?? "NOT VERIFIED",
        statusSources: {
          logicCommand: "software state",
          outputInstruction: "software state",
          outputChannel: "visual indicator",
          fieldPower: measuredVoltage ? "measured value" : "not verified",
          outputVoltage: measuredVoltage ? "measured value" : "not verified",
        },
      };
    },
  },
};

export const SCENARIO_IDS = Object.keys(WORKSTATION_SCENARIOS) as (keyof typeof WORKSTATION_SCENARIOS)[];

export function getScenario(id: string): WorkstationScenario {
  return WORKSTATION_SCENARIOS[id] ?? WORKSTATION_SCENARIOS["overload_tripped"];
}
