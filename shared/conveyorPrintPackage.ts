/**
 * Conveyor PLC Diagnostic Lab — print package (text + wiring SVG spec).
 */

import { CONVEYOR_WIRING_DIAGRAM } from "./conveyorWiringDiagram";
import type { PrintPackageDefinition } from "./wiringDiagramSpec";

export interface ConveyorDevice {
  tag: string;
  description: string;
  address: string;
  type: string;
}

export const CONVEYOR_DEVICES: ConveyorDevice[] = [
  { tag: "PB1", description: "STOP pushbutton (NC)", address: "I:1/0", type: "Input" },
  { tag: "PB2", description: "START pushbutton (NO)", address: "I:1/1", type: "Input" },
  { tag: "ES1", description: "E-Stop mushroom (NC chain)", address: "I:1/2", type: "Safety Input" },
  { tag: "GS1", description: "Guard switch (NC)", address: "I:1/3", type: "Safety Input" },
  { tag: "OL1", description: "Motor overload (NC)", address: "I:1/4", type: "Safety Input" },
  { tag: "PE1", description: "Photoeye — product detect", address: "I:1/5", type: "Input" },
  { tag: "M1", description: "Motor contactor coil", address: "O:2/0", type: "Output" },
  { tag: "HL1", description: "Green RUN stack light", address: "O:2/1", type: "Output" },
  { tag: "HL2", description: "Red FAULT stack light", address: "O:2/2", type: "Output" },
  { tag: "B3:0/0", description: "RUN_CMD internal", address: "B3:0/0", type: "Internal" },
  { tag: "B3:0/1", description: "SAFE_RUN internal", address: "B3:0/1", type: "Internal" },
  { tag: "T4:0", description: "Motor start delay (3s TON)", address: "T4:0", type: "Timer" },
];

export const CONVEYOR_INPUT_LABELS: Record<string, string> = {
  "I:1/0": "STOP PB (NC)",
  "I:1/1": "START PB (NO)",
  "I:1/2": "E-STOP NC",
  "I:1/3": "GUARD NC",
  "I:1/4": "OVERLOAD NC",
  "I:1/5": "PHOTOEYE",
};

export const CONVEYOR_WORKSHEET = [
  "What is the operator-reported symptom?",
  "Which PLC input(s) are abnormal? Record address and state.",
  "Which ladder rung is blocking motor output? Explain the interlock path.",
  "What meter reading confirms your root cause?",
  "What is the root cause and corrective action?",
  "What safety steps were taken before reset/restart?",
];

const LADDER_PRINT_LINES = [
  "Rung 1 — Start/Stop Seal-In: —|/|— I:1/0 (STOP) → —| |— I:1/1 (START) → —( B3:0/0 )— RUN_CMD",
  "Rung 1A — Seal-In: —|/|— I:1/0 (STOP) → —| |— B3:0/0 (RUN_CMD) → —( B3:0/0 )— RUN_CMD",
  "Rung 2 — Safety Interlock: RUN_CMD → —|/|— I:1/2 (E-STOP) → —|/|— I:1/3 (GUARD) → —( B3:0/1 )— SAFE_RUN",
  "Rung 3 — Start Delay: SAFE_RUN → —[TON T4:0 3s]—",
  "Rung 4 — Motor Output: T4:0/DN → —|/|— I:1/4 (OL) → —|/|— I:1/5 (PE CLEAR) → —( O:2/0 )— MOTOR",
  "Rung 5 — Green Light: MOTOR → —( O:2/1 )— GREEN",
  "Rung 6 — Red Fault: —| |— I:1/4 (OL) → —( O:2/2 )— RED",
];

export function buildLadderPrintText(): string {
  return LADDER_PRINT_LINES.join("\n");
}

export function buildDeviceListText(): string {
  return CONVEYOR_DEVICES.map((d) => `${d.tag}\t${d.address}\t${d.type}\t${d.description}`).join("\n");
}

export function buildWiringSummary(): string {
  return [
    "PACKAGING LINE 4 — CONVEYOR POWER & CONTROL",
    "",
    "Power: 480 VAC 3-phase to M1 contactor main poles (L1-L2-L3 → T1-T2-T3).",
    "Control: PLC-supervised 24 VDC field inputs on Local:1 (I:1/x).",
    "  +24 VDC daisy chain: ES1 (E-stop NC) → GS1 (guard NC) → PB1/PB2 → PE1 → OL1 NC → PLC commons.",
    "  PLC output O:2/0 (~24 VDC) energizes M1 contactor coil.",
    "Photoeye PE1: 24 VDC PNP NO — I:1/5 TRUE when beam blocked; Rung 4 NC interlock (PE CLEAR).",
    "Stack lights: O:2/1 GREEN (RUN), O:2/2 RED (FAULT/overload).",
    "",
    "Note: Wiring diagram simplifies daisy-chain return paths for training — verify as-built prints on site.",
    "",
    "TB1 Terminal assignments:",
    "  TB1-1/2 — E-Stop NC chain (I:1/2)",
    "  TB1-3/4 — Guard switch NC (I:1/3)",
    "  TB1-5/6 — Overload NC (I:1/4)",
    "  TB1-7/8 — Photoeye +/− (I:1/5)",
    "  TB1-9/10 — M1 coil (O:2/0)",
  ].join("\n");
}

export function buildFullPrintPackage(): string {
  return [
    "EASLearn — Conveyor PLC Diagnostic Lab — Print Package",
    "Packaging Line 4",
    "=".repeat(60),
    "",
    "WIRING DIAGRAM",
    "-".repeat(40),
    `Sheet: ${CONVEYOR_WIRING_DIAGRAM.sheetId} — ${CONVEYOR_WIRING_DIAGRAM.title}`,
    "(See in-app SVG wiring diagram for symbol geometry)",
    "",
    "LADDER LOGIC",
    "-".repeat(40),
    buildLadderPrintText(),
    "",
    "DEVICE LIST",
    "-".repeat(40),
    buildDeviceListText(),
    "",
    "WIRING SUMMARY",
    "-".repeat(40),
    buildWiringSummary(),
    "",
    "TROUBLESHOOTING WORKSHEET",
    "-".repeat(40),
    ...CONVEYOR_WORKSHEET.map((q, i) => `${i + 1}. ${q}`),
    "",
    "INPUT LEGEND",
    ...Object.entries(CONVEYOR_INPUT_LABELS).map(([addr, label]) => `  ${addr}: ${label}`),
  ].join("\n");
}

export const CONVEYOR_PRINT_PACKAGE: PrintPackageDefinition = {
  id: "conveyor-plc-lab-print",
  title: "Conveyor PLC Diagnostic Lab — Print Package",
  version: "1.3",
  wiringDiagram: CONVEYOR_WIRING_DIAGRAM,
};

export function buildConveyorPrintPackage(): PrintPackageDefinition {
  return CONVEYOR_PRINT_PACKAGE;
}
