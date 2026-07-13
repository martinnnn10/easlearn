/**
 * Field troubleshooting reference procedures — verified content only.
 */

export interface TroubleshootingReferenceEntry {
  id: string;
  title: string;
  summary: string;
  tools: string[];
  procedure: string[];
  safetyNotes: string[];
  relatedSymbolIds: string[];
  relatedLessonSlugs: string[];
  relatedSimulatorIds: string[];
  relatedLabIds: string[];
}

export const TROUBLESHOOTING_REFERENCES: TroubleshootingReferenceEntry[] = [
  {
    id: "test-fuse",
    title: "How to Test a Control Fuse",
    summary: "Verify fuse continuity and rated value before re-energizing a control circuit.",
    tools: ["Digital multimeter (Ω + V)", "Lockout/tagout kit"],
    procedure: [
      "LOTO upstream disconnect feeding the control circuit.",
      "Remove fuse or open fuse holder per manufacturer procedure.",
      "Meter in continuity (Ω): expect <1Ω for good fuse.",
      "If OL, fuse is open — replace with same class and amp rating.",
      "Restore power only after investigating cause of original fault.",
    ],
    safetyNotes: [
      "Never substitute a higher amp fuse.",
      "Verify zero energy with meter before touching terminals.",
    ],
    relatedSymbolIds: ["fuse"],
    relatedLessonSlugs: ["electrical-schematic-basics", "motor-controls-basics"],
    relatedSimulatorIds: ["blown-fuse-v3"],
    relatedLabIds: ["motor-starter", "virtual-multimeter"],
  },
  {
    id: "test-contactor",
    title: "How to Test a Contactor Coil and Power Poles",
    summary: "Diagnose coil open, welded contacts, or mechanical failure.",
    tools: ["Digital multimeter (Ω + V)", "Prints / ladder diagram"],
    procedure: [
      "LOTO all feeders to the starter.",
      "Measure coil resistance A1–A2 — compare to nameplate or prior reading.",
      "OL on coil = open coil; replace starter or coil assembly.",
      "Energize briefly (if safe) and verify each pole closes with audible clunk.",
      "With power off, check pole resistance — welded contacts read near 0Ω when open.",
    ],
    safetyNotes: [
      "Never manually force contactor plunger while energized.",
      "Verify coil voltage rating before replacement.",
    ],
    relatedSymbolIds: ["coil", "contactor_power", "contact_no"],
    relatedLessonSlugs: ["motor-controls-basics"],
    relatedSimulatorIds: [],
    relatedLabIds: ["motor-starter", "relay"],
  },
  {
    id: "test-overload",
    title: "How to Test an Overload Relay",
    summary: "Confirm NC aux contact state and investigate trip cause before reset.",
    tools: ["Digital multimeter", "Motor nameplate FLA data"],
    procedure: [
      "Identify OL NC contact (typically 95–96) on prints.",
      "De-energized: continuity across NC should be <1Ω.",
      "Tripped: NC reads OL — do not reset until cause found.",
      "Check motor amp draw vs heater table — verify correct heater size.",
      "Allow motor to cool; reset only after mechanical cause cleared.",
    ],
    safetyNotes: [
      "Repeated OL trips indicate mechanical or electrical fault — not nuisance.",
      "Never bypass overload to 'keep running'.",
    ],
    relatedSymbolIds: ["overload_heater", "contact_nc"],
    relatedLessonSlugs: ["motor-overload-troubleshooting"],
    relatedSimulatorIds: ["motor-overload-v3"],
    relatedLabIds: ["motor-starter"],
  },
  {
    id: "test-prox-sensor",
    title: "How to Test a Proximity Sensor",
    summary: "Verify sensor output, polarity (PNP/NPN), and wiring integrity.",
    tools: ["24VDC meter", "Target metal (ferrous for inductive)"],
    procedure: [
      "Confirm sensor type (inductive/capacitive) and PNP vs NPN from prints.",
      "Measure supply voltage at sensor — typically 24VDC.",
      "With target present: PNP switches +24 to output; NPN switches to common.",
      "Open wire reads floating or 0V regardless of target — half-split trace.",
      "Swap sensor only after wiring path verified.",
    ],
    safetyNotes: ["Do not short supply directly — use proper load or PLC input."],
    relatedSymbolIds: ["plc_input", "contact_no"],
    relatedLessonSlugs: ["plc-io-wiring", "sensors-basics"],
    relatedSimulatorIds: ["plc-io-fault-v3"],
    relatedLabIds: ["virtual-multimeter"],
  },
  {
    id: "test-photoeye",
    title: "How to Test a Photoeye",
    summary: "Align beam, verify output state, and distinguish dirty lens vs failed output.",
    tools: ["24VDC meter", "Lens cleaner", "Replacement reflector if applicable"],
    procedure: [
      "Clean emitter/receiver lenses.",
      "Verify alignment — indicator LED behavior per manufacturer.",
      "Measure output with beam made and broken — states must toggle.",
      "Stuck ON with beam blocked = failed output or wrong mode (light-on/dark-on).",
      "Check supply and return wiring before replacing sensor.",
    ],
    safetyNotes: ["Guard against bypassing photoeyes — safety interlock risk."],
    relatedSymbolIds: ["plc_input", "contact_no"],
    relatedLessonSlugs: ["sensors-basics", "safety-circuits"],
    relatedSimulatorIds: [],
    relatedLabIds: [],
  },
  {
    id: "test-4-20ma-loop",
    title: "How to Troubleshoot a 4–20 mA Loop",
    summary: "Isolate transmitter, wiring, and input module faults on analog loops.",
    tools: ["mA clamp meter or loop calibrator", "250Ω shunt resistor (for voltage mode)"],
    procedure: [
      "Measure loop current at transmitter terminals — expect 4–20 mA per scale.",
      "4 mA typically = zero scale; 20 mA = full scale (verify datasheet).",
      "Open loop reads 0 mA or fault at PLC — trace wire pair for opens.",
      "Short loop reads overrange — look for moisture or pinched cable.",
      "Simulate 12 mA with calibrator to test PLC input independent of field device.",
    ],
    safetyNotes: [
      "Intrinsically safe loops require IS barriers — do not apply standard calibrator without verification.",
    ],
    relatedSymbolIds: ["plc_input"],
    relatedLessonSlugs: ["instrumentation-basics", "plc-io-wiring"],
    relatedSimulatorIds: [],
    relatedLabIds: [],
  },
];

export function getTroubleshootingRef(id: string): TroubleshootingReferenceEntry | undefined {
  return TROUBLESHOOTING_REFERENCES.find((e) => e.id === id);
}
