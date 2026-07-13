import type { DiagnosticStep } from "./types";

/**
 * Contextual "Explain Why" knowledge base.
 * Maps each diagnostic step to an explanation of the electrical reasoning,
 * a relevant lesson link, and a NEMA/NEC reference where applicable.
 */
export interface ExplainWhyEntry {
  /** Short explanation of why this step matters */
  explanation: string;
  /** Key electrical principle being applied */
  principle: string;
  /** Deep-link to the relevant course lesson */
  lessonLink: string;
  /** Human-readable lesson title */
  lessonTitle: string;
  /** Optional NEMA/NEC standard reference */
  standardRef?: string;
}

export const EXPLAIN_WHY_MAP: Record<DiagnosticStep, ExplainWhyEntry> = {
  check_estop: {
    explanation:
      "E-Stop circuits use normally-closed (NC) contacts wired in series. When the mushroom head is pressed, the NC contact opens, de-energizing the safety relay. This fail-safe design ensures any wire break also stops the machine.",
    principle: "Fail-safe NC wiring — loss of signal = loss of motion",
    lessonLink: "/courses/safety-systems/estop-circuits",
    lessonTitle: "E-Stop Circuits & Safety Relays",
    standardRef: "NFPA 79 §9.2.5.4 — Emergency Stop Devices",
  },
  check_guard: {
    explanation:
      "Guard interlock switches are NC contacts that open when the guard door is removed. The PLC sees I:1/3 drop from 1→0, which breaks the safety string in Rung 2. The motor cannot run with an open guard.",
    principle: "Interlocked guarding — physical barrier tied to control circuit",
    lessonLink: "/courses/safety-systems/guarding-lockout",
    lessonTitle: "Machine Guarding & Lockout/Tagout",
    standardRef: "OSHA 29 CFR 1910.217 — Mechanical Power Presses",
  },
  check_io_panel: {
    explanation:
      "The I/O panel shows real-time bit states of every PLC input and output. Comparing actual states to expected states (based on field conditions) immediately narrows the fault to a specific device or circuit.",
    principle: "Systematic elimination — compare expected vs. actual I/O states",
    lessonLink: "/courses/plc-fundamentals/plc-architecture",
    lessonTitle: "PLC Architecture & I/O Systems",
  },
  check_ladder_rung_2: {
    explanation:
      "Rung 2 is the safety interlock rung. It ANDs all NC safety contacts (E-Stop, Guard, Overload) in series. If ANY one opens, the entire rung de-energizes SAFE_RUN, which cascades to stop the motor. Tracing this rung identifies which safety device tripped.",
    principle: "Series safety string — one open contact breaks the entire chain",
    lessonLink: "/courses/plc-fundamentals/ladder-logic-basics",
    lessonTitle: "Ladder Logic Basics — Series & Parallel Circuits",
    standardRef: "NEMA ICS 1-2000 — Industrial Control Systems",
  },
  check_overload: {
    explanation:
      "Thermal overload relays protect motors from sustained overcurrent. When tripped, the NC auxiliary contact (I:1/4) opens, removing the overload permissive from the ladder. The red indicator on the relay confirms the trip. Reset is manual.",
    principle: "Thermal protection — bimetallic strip opens on sustained heat",
    lessonLink: "/courses/motors-controls/overload-protection",
    lessonTitle: "Motor Overload Protection",
    standardRef: "NEC Article 430.32 — Continuous-Duty Motors",
  },
  check_photoeye: {
    explanation:
      "The photoeye is a dark-operate sensor: beam clear = 0, beam blocked = 1. In the ladder it's examined XIO (Examine If Open) — the rung passes when the bit is 0 (beam clear). A stuck-on photoeye (always 1) blocks Rung 4 even with no product present.",
    principle: "XIO logic — passes power when the addressed bit is FALSE (0)",
    lessonLink: "/courses/sensors-instrumentation/proximity-photoelectric",
    lessonTitle: "Proximity & Photoelectric Sensors",
  },
  check_motor_output_vs_motion: {
    explanation:
      "When the PLC output O:2/0 is energized (1) but the belt doesn't move, the fault is downstream of the PLC — contactor coil, aux contacts, motor winding, or mechanical binding. This separates control-plane faults from power-plane faults.",
    principle: "Control vs. power plane — PLC output ≠ motor rotation",
    lessonLink: "/courses/motors-controls/starter-troubleshooting",
    lessonTitle: "Motor Starter Troubleshooting",
  },
  check_start_stop: {
    explanation:
      "The START/STOP circuit uses a seal-in (latch) pattern. START is momentary NO — pressing it energizes RUN_CMD which seals through its own contact. STOP is NC in series — opening it breaks the seal. A stuck STOP button keeps the NC contact open permanently.",
    principle: "Seal-in circuit — momentary start, maintained run, series stop",
    lessonLink: "/courses/plc-fundamentals/ladder-logic-basics",
    lessonTitle: "Ladder Logic Basics — Seal-In Circuits",
    standardRef: "NEMA ICS 2-2000 — Motor Starters",
  },
  review_prints: {
    explanation:
      "Electrical prints (ladder diagrams) are the technician's roadmap. Reading wire numbers, device designations, and cross-references lets you trace circuits without physically following wires. Always start at the prints before opening panels.",
    principle: "Print-first troubleshooting — trace on paper before touching wire",
    lessonLink: "/courses/print-reading/ladder-diagram-conventions",
    lessonTitle: "Ladder Diagram Conventions & Symbols",
    standardRef: "NEMA ICS 1 — General Standards for Industrial Control",
  },
  meter_measurement: {
    explanation:
      "A multimeter confirms what the PLC reports. Continuity mode verifies NC contacts are closed (< 1Ω). Voltage mode confirms 24VDC at sensor outputs. Always verify with a meter — PLC inputs can fail or be forced.",
    principle: "Trust but verify — meter readings confirm PLC I/O status",
    lessonLink: "/courses/plc-fundamentals/io-troubleshooting",
    lessonTitle: "I/O Troubleshooting with Meters",
  },
};

/**
 * Get the explain-why entry for a diagnostic step.
 */
export function getExplainWhy(step: DiagnosticStep): ExplainWhyEntry {
  return EXPLAIN_WHY_MAP[step];
}
