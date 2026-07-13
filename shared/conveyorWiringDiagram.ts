/**
 * Conveyor PLC Diagnostic Lab — simplified wiring diagram spec.
 * Packaging Line 4 — 24VDC field inputs + 480VAC motor branch.
 */

import type { WiringDiagramSpec } from "./wiringDiagramSpec";
import { assertWiringDiagramValid } from "./wiringDiagramSpec";

export const CONVEYOR_WIRING_DIAGRAM: WiringDiagramSpec = {
  sheetId: "conv-wiring-001",
  title: "Packaging Line 4 — Conveyor Wiring",
  subtitle: "24 VDC field inputs · 480 VAC motor branch · PLC I/O",
  pageSize: "letter",
  orientation: "landscape",
  gridCols: 18,
  gridRows: 12,
  nodes: [
    // ── 24 VDC power ──────────────────────────────────────────────────────
    { id: "f1", symbolId: "fuse", label: "F1 +24VDC", x: 2, y: 1 },
    { id: "tb1", symbolId: "terminal", label: "TB1", x: 5, y: 1, metadata: { note: "Term 1–8" } },

    // ── Field devices ─────────────────────────────────────────────────────
    { id: "es1", symbolId: "estop", label: "ES1", x: 2, y: 4 },
    { id: "gs1", symbolId: "guard_switch", label: "GS1", x: 4, y: 4 },
    { id: "pb1", symbolId: "pb_nc", label: "PB1 STOP", x: 6, y: 4 },
    { id: "pb2", symbolId: "pb_no", label: "PB2 START", x: 9, y: 4 },
    { id: "pe1", symbolId: "photoeye", label: "PE1", x: 12, y: 4 },
    { id: "ol1", symbolId: "overload_nc", label: "OL1 NC", x: 15, y: 4 },

    // ── PLC digital I/O ───────────────────────────────────────────────────
    { id: "plc_i12", symbolId: "plc_input", label: "I:1/2", x: 2, y: 7, metadata: { device: "ES1" } },
    { id: "plc_i13", symbolId: "plc_input", label: "I:1/3", x: 4, y: 7, metadata: { device: "GS1" } },
    { id: "plc_i10", symbolId: "plc_input", label: "I:1/0", x: 6, y: 7, metadata: { device: "PB1" } },
    { id: "plc_i11", symbolId: "plc_input", label: "I:1/1", x: 9, y: 7, metadata: { device: "PB2" } },
    { id: "plc_i15", symbolId: "plc_input", label: "I:1/5", x: 12, y: 7, metadata: { device: "PE1" } },
    { id: "plc_i14", symbolId: "plc_input", label: "I:1/4", x: 15, y: 7, metadata: { device: "OL1" } },

    // ── Motor branch (480 VAC) ────────────────────────────────────────────
    { id: "cb1", symbolId: "breaker", label: "CB1 480V", x: 2, y: 10 },
    { id: "m1_pole", symbolId: "contactor_power", label: "M1", x: 6, y: 10 },
    { id: "ol_heat", symbolId: "overload_heater", label: "OL HEAT", x: 10, y: 10 },
    { id: "motor", symbolId: "motor", label: "Belt MTR", x: 14, y: 10 },
    { id: "m1_coil", symbolId: "coil", label: "M1 Coil", x: 6, y: 11 },
    { id: "plc_o20", symbolId: "plc_output", label: "O:2/0", x: 10, y: 11 },
  ],
  edges: [
    // 24VDC power distribution
    { id: "w101", from: { nodeId: "f1", anchor: "right" }, to: { nodeId: "tb1", anchor: "left" }, wireType: "power", label: "101" },
    { id: "w102", from: { nodeId: "tb1", anchor: "bottom" }, to: { nodeId: "es1", anchor: "top" }, wireType: "power", label: "102 +24V" },
    { id: "w103", from: { nodeId: "es1", anchor: "right" }, to: { nodeId: "gs1", anchor: "left" }, wireType: "power", label: "103" },
    { id: "w104", from: { nodeId: "gs1", anchor: "right" }, to: { nodeId: "pb1", anchor: "left" }, wireType: "power", label: "104" },
    { id: "w105", from: { nodeId: "pb1", anchor: "right" }, to: { nodeId: "pb2", anchor: "left" }, wireType: "power", label: "105" },
    { id: "w106", from: { nodeId: "pb2", anchor: "right" }, to: { nodeId: "pe1", anchor: "left" }, wireType: "power", label: "106" },
    { id: "w107", from: { nodeId: "pe1", anchor: "right" }, to: { nodeId: "ol1", anchor: "left" }, wireType: "power", label: "107" },

    // Field → PLC signal wires
    { id: "w201", from: { nodeId: "es1", terminalId: "Sig", anchor: "bottom" }, to: { nodeId: "plc_i12", anchor: "top" }, wireType: "signal", label: "201" },
    { id: "w206", from: { nodeId: "gs1", anchor: "bottom" }, to: { nodeId: "plc_i13", anchor: "top" }, wireType: "signal", label: "206 GS1→IN" },
    { id: "w202", from: { nodeId: "pb1", anchor: "bottom" }, to: { nodeId: "plc_i10", anchor: "top" }, wireType: "signal", label: "202" },
    { id: "w203", from: { nodeId: "pb2", anchor: "bottom" }, to: { nodeId: "plc_i11", anchor: "top" }, wireType: "signal", label: "203" },
    { id: "w204", from: { nodeId: "pe1", terminalId: "Sig", anchor: "bottom" }, to: { nodeId: "plc_i15", anchor: "top" }, wireType: "signal", label: "204 PE→IN" },
    { id: "w205", from: { nodeId: "ol1", anchor: "bottom" }, to: { nodeId: "plc_i14", anchor: "top" }, wireType: "signal", label: "205" },

    // 480VAC motor branch
    { id: "w301", from: { nodeId: "cb1", anchor: "right" }, to: { nodeId: "m1_pole", anchor: "left" }, wireType: "motor", label: "301 L1" },
    { id: "w302", from: { nodeId: "m1_pole", anchor: "right" }, to: { nodeId: "ol_heat", anchor: "left" }, wireType: "motor", label: "302 T1" },
    { id: "w303", from: { nodeId: "ol_heat", anchor: "right" }, to: { nodeId: "motor", anchor: "left" }, wireType: "motor", label: "303 T2" },

    // PLC output → contactor coil
    { id: "w401", from: { nodeId: "plc_o20", anchor: "left" }, to: { nodeId: "m1_coil", anchor: "right" }, wireType: "control", label: "401 O:2/0" },
  ],
  annotations: [
    { text: "24 VDC FIELD POWER — brown (+24V) · blue (0V) · black (signal)", x: 1, y: 0.3, className: "diag-text-xs" },
    { text: "480 VAC MOTOR BRANCH — see CB1 feeder", x: 1, y: 9.2, className: "diag-text-xs" },
    { text: "TB1-1/2 E-Stop · TB1-3/4 Guard · TB1-5/6 OL · TB1-7/8 PE · TB1-9/10 M1 coil", x: 1, y: 11.2, className: "diag-text-xs" },
    { text: "PE1 PNP NO — I:1/5 TRUE when blocked · Rung 4 NC interlock", x: 9, y: 0.3, className: "diag-text-xs" },
  ],
};

// Self-validate at import
assertWiringDiagramValid(CONVEYOR_WIRING_DIAGRAM);
