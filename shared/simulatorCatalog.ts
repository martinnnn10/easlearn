/**
 * EASLearn Simulator Catalog — single source of truth for public simulator UX.
 * Constitution: only production-quality experiences are visible; V1 hidden from browse.
 */

export type SimulatorCategory =
  | "featured"
  | "plc_ladder"
  | "vfd_drives"
  | "motor_controls"
  | "sensors"
  | "safety"
  | "print_reading"
  | "networking"
  | "capstones"
  | "foundations";

export type SimulatorStatus = "production" | "beta" | "coming_soon" | "hidden";
export type SimulatorEngine = "v1" | "v2" | "v3" | "lab";

/** Hub associations for flagship / domain simulators (A2). */
export type SimulatorHubId =
  | "plc"
  | "vfd"
  | "motor_controls"
  | "sensors"
  | "safety"
  | "print_reading";

export interface SimulatorCatalogEntry {
  id: string;
  title: string;
  category: SimulatorCategory;
  status: SimulatorStatus;
  /** Show in Featured Diagnostic Challenges row */
  featured: boolean;
  engine: SimulatorEngine;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Adaptive";
  duration: string;
  skills: string[];
  equipmentType: string;
  tools: string[];
  scenarioType: string;
  /** Route for labs; scenarios use /simulator?scenario=id */
  route?: string;
  faults: string[];
  clickable: boolean;
  /** Domain hubs that reference this simulator in lessonPracticeMap */
  hubIds?: SimulatorHubId[];
}

export const CATEGORY_META: Record<
  Exclude<SimulatorCategory, "featured">,
  { title: string; description: string; order: number }
> = {
  plc_ladder: {
    title: "PLC & Ladder Logic",
    description: "Scan cycle, I/O, ladder logic, and PLC troubleshooting",
    order: 1,
  },
  vfd_drives: {
    title: "VFD & Drives",
    description: "PowerFlex diagnostics, parameters, faults, and drive troubleshooting",
    order: 2,
  },
  motor_controls: {
    title: "Motor Controls",
    description: "Starters, seal-in, overload, fuses, and control voltage",
    order: 3,
  },
  sensors: {
    title: "Sensors & Instrumentation",
    description: "Photoeyes, proximity, limits, analog loops — production sims coming",
    order: 4,
  },
  safety: {
    title: "Safety Circuits",
    description: "E-stop chains, safety relays, gates, and STO logic",
    order: 5,
  },
  print_reading: {
    title: "Print Reading & Wiring",
    description: "Schematics, ladder traces, wiring diagrams, symbol ID",
    order: 6,
  },
  networking: {
    title: "Industrial Networking",
    description: "EtherNet/IP and industrial comm fault diagnosis",
    order: 7,
  },
  capstones: {
    title: "Troubleshooting Capstones",
    description: "Multi-system plant failures and integration faults",
    order: 8,
  },
  foundations: {
    title: "Foundations & Tools",
    description: "Meter skills and fundamental tool practice",
    order: 9,
  },
};

/** Full catalog — visibility controlled by status + clickable */
export const SIMULATOR_CATALOG: SimulatorCatalogEntry[] = [
  // ── Featured / flagship ───────────────────────────────────────────────────
  {
    id: "conveyor-plc-lab",
    title: "Conveyor PLC Diagnostic Lab",
    category: "plc_ladder",
    status: "production",
    featured: true,
    engine: "lab",
    difficulty: "Adaptive",
    duration: "15–30 min",
    skills: ["PLC scan", "I/O diagnosis", "Ladder trace", "Process scoring", "Print package"],
    equipmentType: "Packaging conveyor + ControlLogix I/O",
    tools: ["Machine twin", "Ladder logic", "Multimeter", "Print package"],
    scenarioType: "PLC Troubleshooting Lab",
    route: "/labs#conveyor-troubleshoot",
    faults: ["E-stop open", "Photoeye stuck", "Overload trip", "Output on / motor dead"],
    clickable: true,
    hubIds: ["plc", "motor_controls", "sensors", "safety", "print_reading"],
  },
  {
    id: "vfd-conveyor-multifault-v3",
    title: "VFD Conveyor Multi-Fault",
    category: "capstones",
    status: "production",
    featured: true,
    engine: "v3",
    difficulty: "Adaptive",
    duration: "10–25 min",
    skills: ["Multi-fault RCA", "E-stop", "Overload", "VFD diagnostics"],
    equipmentType: "VFD-driven conveyor line",
    tools: ["Multimeter", "Prints", "VFD display"],
    scenarioType: "Capstone",
    faults: ["E-stop chain", "Motor overload", "STO"],
    clickable: true,
  },
  {
    id: "plc-io-fault-v3",
    title: "PLC I/O Signal Wire Fault",
    category: "plc_ladder",
    status: "production",
    featured: true,
    engine: "v3",
    difficulty: "Adaptive",
    duration: "8–20 min",
    skills: ["Half-split tracing", "PNP sensor path", "I/O wiring"],
    equipmentType: "PLC digital input module + proximity sensor",
    tools: ["Multimeter", "Prints"],
    scenarioType: "PLC",
    faults: ["Broken signal wire", "Open circuit"],
    clickable: true,
  },
  {
    id: "failed-safety-relay",
    title: "Failed Safety Relay — Hydraulic Press",
    category: "safety",
    status: "production",
    featured: true,
    engine: "v3",
    difficulty: "Adaptive",
    duration: "7–25 min",
    skills: ["Safety relay", "Welded NC contact", "Coil vs contact state"],
    equipmentType: "Safety relay + hydraulic press interlock",
    tools: ["Multimeter", "Prints"],
    scenarioType: "Safety Circuit",
    faults: ["Welded NC contact", "Safety chain"],
    clickable: true,
  },
  {
    id: "conveyor-estop-v2",
    title: "E-Stop Chain Open — Packaging Line 4",
    category: "safety",
    status: "production",
    featured: true,
    engine: "v2",
    difficulty: "Adaptive",
    duration: "5–12 min",
    skills: ["E-stop chain", "Vibration root cause", "Safety relay reset"],
    equipmentType: "Packaging conveyor safety circuit",
    tools: ["Multimeter", "Prints", "Ladder diagram"],
    scenarioType: "Safety Circuit",
    faults: ["E-stop chain open", "Vibration-induced trip"],
    clickable: true,
  },
  {
    id: "blown-control-fuse",
    title: "Blown Control Fuse — Conveyor Sortation",
    category: "motor_controls",
    status: "production",
    featured: true,
    engine: "v3",
    difficulty: "Adaptive",
    duration: "6–20 min",
    skills: ["Voltage-across-fuse", "Control power", "Field vs CPU"],
    equipmentType: "MCC control circuit",
    tools: ["Multimeter", "Prints"],
    scenarioType: "Motor Control",
    faults: ["Blown fuse", "Control voltage loss"],
    clickable: true,
  },

  // ── V3 scenarios (visible) ────────────────────────────────────────────────
  {
    id: "vfd-overcurrent-ramp-v3",
    title: "VFD Overcurrent at Ramp",
    category: "vfd_drives",
    status: "production",
    featured: false,
    engine: "v3",
    difficulty: "Adaptive",
    duration: "5–15 min",
    skills: ["Accel/decel params", "Overcurrent", "Meter settings"],
    equipmentType: "PowerFlex 525 + conveyor load",
    tools: ["Multimeter", "VFD keypad", "Prints"],
    scenarioType: "VFD",
    faults: ["Accel time too fast", "Overcurrent trip"],
    clickable: true,
    hubIds: ["vfd"],
  },
  {
    id: "vfd-dc-bus-undervoltage-v3",
    title: "VFD DC Bus Undervoltage",
    category: "vfd_drives",
    status: "production",
    featured: false,
    engine: "v3",
    difficulty: "Adaptive",
    duration: "6–18 min",
    skills: ["DC bus", "Capacitor aging", "Undervoltage fault"],
    equipmentType: "PowerFlex 525",
    tools: ["Multimeter", "VFD display"],
    scenarioType: "VFD",
    faults: ["DC bus undervoltage", "Capacitor degradation"],
    clickable: true,
    hubIds: ["vfd"],
  },
  {
    id: "vfd-ground-fault-cable-v3",
    title: "Ground Fault — Damaged Cable",
    category: "vfd_drives",
    status: "production",
    featured: false,
    engine: "v3",
    difficulty: "Adaptive",
    duration: "6–18 min",
    skills: ["Megger", "Cable vs motor isolation", "Ground fault"],
    equipmentType: "VFD + motor cable run",
    tools: ["Megger", "Multimeter"],
    scenarioType: "VFD",
    faults: ["Cable insulation failure"],
    clickable: true,
    hubIds: ["vfd"],
  },
  {
    id: "vfd-cooling-fan-seized-v3",
    title: "VFD Cooling Fan Seized",
    category: "vfd_drives",
    status: "production",
    featured: false,
    engine: "v3",
    difficulty: "Adaptive",
    duration: "4–12 min",
    skills: ["Thermal fault", "Heatsink", "F006 overtemp"],
    equipmentType: "PowerFlex 525 in enclosure",
    tools: ["Multimeter", "Thermal check"],
    scenarioType: "VFD",
    faults: ["Fan seized", "Overtemperature"],
    clickable: true,
    hubIds: ["vfd"],
  },
  {
    id: "vfd-input-phase-loss-v3",
    title: "VFD Input Phase Loss",
    category: "vfd_drives",
    status: "production",
    featured: false,
    engine: "v3",
    difficulty: "Adaptive",
    duration: "5–15 min",
    skills: ["Phase loss", "Input terminals", "Load-side symptoms"],
    equipmentType: "Three-phase VFD feed",
    tools: ["Multimeter"],
    scenarioType: "VFD",
    faults: ["Loose input terminal", "Phase loss"],
    clickable: true,
    hubIds: ["vfd"],
  },
  {
    id: "motor-overload-trip-v3",
    title: "Motor Overload Trip",
    category: "motor_controls",
    status: "production",
    featured: false,
    engine: "v3",
    difficulty: "Adaptive",
    duration: "8–22 min",
    skills: ["Overload relay", "Mechanical vs electrical", "OL contact"],
    equipmentType: "Motor starter + conveyor",
    tools: ["Multimeter", "Prints"],
    scenarioType: "Motor Control",
    faults: ["Seized idler", "Thermal overload"],
    clickable: true,
  },
  {
    id: "intermittent-ground-fault-v3",
    title: "Intermittent Ground Fault",
    category: "capstones",
    status: "production",
    featured: false,
    engine: "v3",
    difficulty: "Adaptive",
    duration: "10–30 min",
    skills: ["Intermittent faults", "Load-heated insulation", "Megger"],
    equipmentType: "Water treatment pump circuit",
    tools: ["Megger", "Multimeter"],
    scenarioType: "Power Distribution",
    faults: ["Intermittent ground", "Insulation breakdown"],
    clickable: true,
  },
  {
    id: "comm-loss-v3",
    title: "EtherNet/IP Communication Loss",
    category: "networking",
    status: "production",
    featured: false,
    engine: "v3",
    difficulty: "Adaptive",
    duration: "6–18 min",
    skills: ["Physical layer", "RJ45", "Switch port"],
    equipmentType: "VFD on EtherNet/IP",
    tools: ["Laptop", "Cable tester", "Multimeter"],
    scenarioType: "Networking",
    faults: ["Crushed cable", "Link down"],
    clickable: true,
  },

  // ── Labs (linked from simulator browse) ───────────────────────────────────
  {
    id: "ladder-logic-lab",
    title: "Ladder Logic Simulator",
    category: "plc_ladder",
    status: "production",
    featured: false,
    engine: "lab",
    difficulty: "Intermediate",
    duration: "20–40 min",
    skills: ["Seal-in", "TON timer", "Safety interlock"],
    equipmentType: "Allen-Bradley style ladder program",
    tools: ["Ladder editor", "Live rung eval"],
    scenarioType: "PLC Lab",
    route: "/labs#ladder",
    faults: [],
    clickable: true,
  },
  {
    id: "vfd-parameter-lab",
    title: "VFD Parameter Lab",
    category: "vfd_drives",
    status: "production",
    featured: false,
    engine: "lab",
    difficulty: "Beginner",
    duration: "15–25 min",
    skills: ["Parameter groups", "Accel/decel", "Motor nameplate"],
    equipmentType: "PowerFlex 525",
    tools: ["Keypad navigation", "Work order"],
    scenarioType: "VFD Lab",
    route: "/labs#vfd",
    faults: [],
    clickable: true,
    hubIds: ["vfd"],
  },
  {
    id: "motor-starter-lab",
    title: "Motor Starter Troubleshooting",
    category: "motor_controls",
    status: "beta",
    featured: false,
    engine: "lab",
    difficulty: "Intermediate",
    duration: "15–25 min",
    skills: ["3-wire control", "Virtual meter", "Starter faults"],
    equipmentType: "120VAC motor starter",
    tools: ["Multimeter", "Ladder diagram"],
    scenarioType: "Motor Control Lab",
    route: "/labs#motor-starter",
    faults: ["OL trip", "Open coil", "Blown fuse"],
    clickable: true,
  },
  {
    id: "wiring-diagram-lab",
    title: "Wiring Diagram Tracing",
    category: "print_reading",
    status: "production",
    featured: false,
    engine: "lab",
    difficulty: "Beginner",
    duration: "10–20 min",
    skills: ["One-line", "Three-line", "Wire numbers"],
    equipmentType: "MCC bucket wiring",
    tools: ["Diagram pan/zoom"],
    scenarioType: "Print Reading",
    route: "/labs#wiring-diagram",
    faults: [],
    clickable: true,
  },
  {
    id: "component-id-lab",
    title: "NEMA / JIC Symbol Identification",
    category: "print_reading",
    status: "production",
    featured: false,
    engine: "lab",
    difficulty: "Beginner",
    duration: "10–15 min",
    skills: ["Symbol ID", "Terminals", "Part numbers"],
    equipmentType: "NEMA / JIC symbol set",
    tools: ["Symbol challenge"],
    scenarioType: "Print Reading",
    route: "/labs#component-id",
    faults: [],
    clickable: true,
  },
  {
    id: "multimeter-lab",
    title: "Virtual Multimeter Lab",
    category: "foundations",
    status: "production",
    featured: false,
    engine: "lab",
    difficulty: "Beginner",
    duration: "10–20 min",
    skills: ["Meter modes", "Probe technique", "Test points"],
    equipmentType: "Motor starter schematic",
    tools: ["Multimeter"],
    scenarioType: "Foundations",
    route: "/labs#multimeter",
    faults: [],
    clickable: true,
  },

  // ── Coming soon (visible, not clickable) ────────────────────────────────────
  {
    id: "powerflex-diagnostic-lab",
    title: "PowerFlex Diagnostic Lab",
    category: "vfd_drives",
    status: "beta",
    featured: false,
    engine: "lab",
    difficulty: "Adaptive",
    duration: "20–35 min",
    skills: ["Fault codes", "Keypad navigation", "Parameter trace", "Drive diagnostics"],
    equipmentType: "PowerFlex 525 + conveyor load",
    tools: ["VFD display", "Multimeter", "Parameter groups"],
    scenarioType: "VFD Troubleshooting Lab",
    route: "/labs#powerflex-diagnostic",
    faults: ["Overcurrent", "DC bus undervoltage", "Cooling fan seized"],
    clickable: true,
    hubIds: ["vfd"],
  },
  {
    id: "photoeye-sim-soon",
    title: "Photoeye False Trigger",
    category: "sensors",
    status: "coming_soon",
    featured: false,
    engine: "v3",
    difficulty: "Advanced",
    duration: "10–15 min",
    skills: ["Photoeye alignment", "Environmental interference"],
    equipmentType: "Retroreflective photoeye",
    tools: ["Multimeter", "Alignment"],
    scenarioType: "Sensors",
    faults: ["Sunlight interference", "Misalignment"],
    clickable: false,
  },
  {
    id: "prox-sim-soon",
    title: "Proximity Sensor Wiring Fault",
    category: "sensors",
    status: "coming_soon",
    featured: false,
    engine: "v3",
    difficulty: "Intermediate",
    duration: "10–15 min",
    skills: ["PNP vs NPN", "Broken wire", "Stuck output"],
    equipmentType: "Inductive proximity + PLC input",
    tools: ["Multimeter"],
    scenarioType: "Sensors",
    faults: ["Wrong polarity", "Open wire"],
    clickable: false,
  },

  // ── Hidden (V1 — assessment/HireReady only) ─────────────────────────────────
  { id: "conveyor-estop", title: "Conveyor E-Stop (V1)", category: "safety", status: "hidden", featured: false, engine: "v1", difficulty: "Beginner", duration: "5–8 min", skills: [], equipmentType: "", tools: [], scenarioType: "Safety", faults: [], clickable: false },
  { id: "24vdc-loss", title: "24VDC Control Loss (V1)", category: "motor_controls", status: "hidden", featured: false, engine: "v1", difficulty: "Beginner", duration: "5–8 min", skills: [], equipmentType: "", tools: [], scenarioType: "Control", faults: [], clickable: false },
  { id: "vfd-ramp", title: "VFD Ramp (V1)", category: "vfd_drives", status: "hidden", featured: false, engine: "v1", difficulty: "Intermediate", duration: "6–10 min", skills: [], equipmentType: "", tools: [], scenarioType: "VFD", faults: [], clickable: false },
  { id: "starter-chatter", title: "Starter Chatter (V1)", category: "motor_controls", status: "hidden", featured: false, engine: "v1", difficulty: "Intermediate", duration: "6–10 min", skills: [], equipmentType: "", tools: [], scenarioType: "Motor", faults: [], clickable: false },
  { id: "case-packer-jam", title: "Case Packer Jam (V1)", category: "plc_ladder", status: "hidden", featured: false, engine: "v1", difficulty: "Intermediate", duration: "6–10 min", skills: [], equipmentType: "", tools: [], scenarioType: "PLC", faults: [], clickable: false },
  { id: "palletizer-safety-gate", title: "Palletizer Safety Gate (V1)", category: "safety", status: "hidden", featured: false, engine: "v1", difficulty: "Advanced", duration: "8–12 min", skills: [], equipmentType: "", tools: [], scenarioType: "Safety", faults: [], clickable: false },
  { id: "photoeye-false-trigger", title: "Photoeye False Trigger (V1)", category: "sensors", status: "hidden", featured: false, engine: "v1", difficulty: "Advanced", duration: "8–12 min", skills: [], equipmentType: "", tools: [], scenarioType: "Sensors", faults: [], clickable: false },
];

export function getBrowsableCatalog(): SimulatorCatalogEntry[] {
  return SIMULATOR_CATALOG.filter((e) => e.status !== "hidden");
}

export function getFeaturedCatalog(): SimulatorCatalogEntry[] {
  return getBrowsableCatalog().filter((e) => e.featured && e.clickable);
}

export function getCatalogByCategory(
  category: Exclude<SimulatorCategory, "featured">
): SimulatorCatalogEntry[] {
  return getBrowsableCatalog().filter((e) => e.category === category);
}

export function getCatalogEntry(id: string): SimulatorCatalogEntry | undefined {
  return SIMULATOR_CATALOG.find((e) => e.id === id);
}

export function getCatalogByHubId(hubId: SimulatorHubId): SimulatorCatalogEntry[] {
  return SIMULATOR_CATALOG.filter((e) => e.hubIds?.includes(hubId));
}

export function getOrderedCategories(): Exclude<SimulatorCategory, "featured">[] {
  return (Object.keys(CATEGORY_META) as Exclude<SimulatorCategory, "featured">[]).sort(
    (a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order
  );
}

/** Scenario IDs that remain launchable (includes hidden V1 for assessments) */
export const ALL_SCENARIO_IDS = SIMULATOR_CATALOG.filter((e) => e.engine !== "lab").map((e) => e.id);
