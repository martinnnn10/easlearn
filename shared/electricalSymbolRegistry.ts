/**
 * EASLearn Electrical Standards Registry — single source of truth for symbol identity.
 * Geometry authority: server/content/electrical-schematic-symbols.mjs (lesson 90010 audit).
 * Runtime rendering: client/src/lib/electricalDiagramPrimitives.tsx
 *
 * SYMBOL GOVERNANCE: No new symbol geometry without a registry entry.
 */

export type StandardsCategory =
  | "electrical_symbols"
  | "plc_symbols"
  | "motor_controls"
  | "safety_circuits"
  | "vfd_wiring"
  | "instrumentation"
  | "wire_numbering"
  | "terminal_numbering"
  | "plc_io_numbering"
  | "print_reading";

export type SymbolPrimitiveId =
  | "disconnect"
  | "fuse"
  | "breaker"
  | "motor"
  | "transformer"
  | "coil"
  | "contact_no"
  | "contact_nc"
  | "overload_heater"
  | "overload_nc"
  | "pb_no"
  | "pb_nc"
  | "contactor_power"
  | "contactor_aux"
  | "terminal"
  | "limit_switch"
  | "selector_switch"
  | "guard_switch"
  | "estop"
  | "safety_relay"
  | "plc_input"
  | "plc_output"
  | "vfd"
  | "timer_contact"
  | "photoeye";

export interface ElectricalSymbolEntry {
  id: SymbolPrimitiveId;
  name: string;
  description: string;
  function: string;
  iecReference: string;
  nemaJicReference: string;
  typicalUse: string;
  /** One-line learner-facing clarifier for confusable pairs (power vs control,
   *  device vs contact). Shown as a highlighted note on the card and detail. */
  contextNote?: string;
  category: StandardsCategory;
  /** Maps to Diagram* component in electricalDiagramPrimitives */
  primitive: string;
  aliases: string[];
  /** Field applications — shown on standards detail when present */
  industrialApplications?: string[];
  /** Wiring and PLC I/O notes — shown on standards detail when present */
  wiringNotes?: string;
  relatedLessonSlugs: string[];
  relatedSimulatorIds: string[];
  relatedLabIds: string[];
}

export const CATEGORY_META: Record<
  StandardsCategory,
  { title: string; description: string; order: number }
> = {
  electrical_symbols: {
    title: "Electrical Symbols",
    description: "NEMA / JIC power and control device symbols",
    order: 1,
  },
  motor_controls: {
    title: "Motor Controls",
    description: "Starters, contacts, coils, overloads, seal-in",
    order: 2,
  },
  safety_circuits: {
    title: "Safety Circuits",
    description: "E-stop, safety relays, guarded contacts",
    order: 3,
  },
  plc_symbols: {
    title: "PLC Symbols",
    description: "I/O modules, ladder elements, scan-cycle notation",
    order: 4,
  },
  vfd_wiring: {
    title: "VFD Wiring",
    description: "Drive power, STO, enable, and control terminals",
    order: 5,
  },
  instrumentation: {
    title: "Instrumentation",
    description: "Sensors, loops, and field devices",
    order: 6,
  },
  wire_numbering: {
    title: "Wire Numbering",
    description: "NFPA 79 / plant-standard wire identification",
    order: 7,
  },
  terminal_numbering: {
    title: "Terminal Numbering",
    description: "Device terminals, TB labels, and cross-references",
    order: 8,
  },
  plc_io_numbering: {
    title: "PLC I/O Numbering",
    description: "Allen-Bradley rack/slot addressing on prints",
    order: 9,
  },
  print_reading: {
    title: "Print Reading Standards",
    description: "One-line, three-line, ladder, and wiring diagram conventions",
    order: 10,
  },
};

export const ELECTRICAL_SYMBOL_REGISTRY: ElectricalSymbolEntry[] = [
  {
    id: "contact_no",
    name: "Normally Open (NO) Contact",
    description: "Two vertical bars with an open gap between them.",
    function: "Opens or closes a circuit when actuated. NO = open when de-energized.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA ICS 1 / JIC EGP-1 — | |",
    typicalUse: "Start pushbuttons, seal-in auxiliaries, permissive inputs",
    category: "motor_controls",
    primitive: "DiagramNOContact",
    aliases: ["NO", "XIC", "| |", "normally open"],
    relatedLessonSlugs: ["electrical-schematic-basics", "motor-controls-basics"],
    relatedSimulatorIds: ["plc-io-fault-v3", "failed-safety-relay"],
    relatedLabIds: ["motor-starter", "relay", "component-id", "ladder-logic"],
  },
  {
    id: "contact_nc",
    name: "Normally Closed (NC) Contact",
    description: "Two vertical bars with a diagonal slash indicating NC state.",
    function: "Closed when de-energized; opens when actuated.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA ICS 1 / JIC EGP-1 — |/|",
    typicalUse: "Stop buttons, overload NC, E-stop chains, safety gates",
    category: "motor_controls",
    primitive: "DiagramNCContact",
    aliases: ["NC", "XIO", "|/|", "normally closed"],
    relatedLessonSlugs: ["electrical-schematic-basics", "motor-controls-basics"],
    relatedSimulatorIds: ["conveyor-estop-v2", "motor-overload-v3"],
    relatedLabIds: ["motor-starter", "relay", "component-id", "ladder-logic"],
  },
  {
    id: "coil",
    name: "Relay / Contactor Coil",
    description: "Circle between line conductors — NEMA ladder coil symbol.",
    function: "Electromagnet that changes contact state when energized.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA ICS 1 — ( ) with device tag M, CR, K",
    typicalUse: "Motor starter coils, control relays, interposing relays",
    contextNote: "Energizes the contactor.",
    category: "motor_controls",
    primitive: "DiagramCoil",
    aliases: ["coil", "CR", "K", "M coil", "( )"],
    relatedLessonSlugs: ["electrical-schematic-basics", "motor-controls-basics"],
    relatedSimulatorIds: ["blown-fuse-v3", "starter-chatter"],
    relatedLabIds: ["motor-starter", "relay", "component-id"],
  },
  {
    id: "overload_heater",
    name: "Overload Heater Element",
    description: "Zigzag heater symbol — no OL text inside geometry.",
    function: "Thermal overload protection; trips on sustained overcurrent.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA ICS 2 — overload relay heater in series with coil path",
    typicalUse: "Motor branch overload, starter trip diagnostics",
    contextNote: "Used in the power circuit.",
    category: "motor_controls",
    primitive: "DiagramOverloadHeater",
    aliases: ["OL", "overload", "heater", "thermal overload", "95-96"],
    relatedLessonSlugs: ["electrical-schematic-basics", "motor-overload-troubleshooting"],
    relatedSimulatorIds: ["motor-overload-v3"],
    relatedLabIds: ["motor-starter", "wiring-diagram"],
  },
  {
    id: "overload_nc",
    name: "Overload NC Monitoring Contact",
    description: "Normally-closed overload contact (95–96) for the control circuit — opens on trip.",
    function: "Drops the starter coil when the thermal overload trips. Control-circuit form, distinct from the power-circuit heater element.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA ICS 2 — OL contact 95-96 in the control string",
    typicalUse: "Motor-starter control rung, overload trip logic",
    contextNote: "Used in the control circuit. Opens when the overload trips.",
    category: "motor_controls",
    primitive: "DiagramNCContact",
    aliases: ["OL contact", "95-96", "overload NC", "overload monitoring contact"],
    relatedLessonSlugs: ["motor-overload-troubleshooting", "electrical-schematic-basics"],
    relatedSimulatorIds: ["motor-overload-v3"],
    relatedLabIds: ["motor-starter", "conveyor-troubleshoot"],
  },
  {
    id: "contactor_aux",
    name: "Contactor Auxiliary Contact",
    description: "Auxiliary NO contact mechanically linked to the contactor coil (M aux / seal-in).",
    function: "Follows the contactor state — used for seal-in, run feedback, and interlocking.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA ICS 2 — M aux (13-14 NO)",
    typicalUse: "Start/stop seal-in, run confirmation, interlocks",
    contextNote: "Used for seal-in / status logic.",
    category: "motor_controls",
    primitive: "DiagramContactorAux",
    aliases: ["M aux", "seal-in contact", "aux contact", "13-14"],
    relatedLessonSlugs: ["motor-controls-basics"],
    relatedSimulatorIds: [],
    relatedLabIds: ["motor-starter"],
  },
  {
    id: "guard_switch",
    name: "Guard Interlock Switch",
    description: "Guard-door safety interlock — a plain XIO (NC) contact in the ladder/safety string, tagged GS.",
    function: "Guard closed = contact closed / circuit healthy; guard open = contact opens and drops the machine.",
    iecReference: "IEC 60617-07 / ISO 14119",
    nemaJicReference: "NFPA 79 — guard interlock in the safety circuit",
    typicalUse: "Machine guarding, gate/door interlocks, safety string",
    category: "safety_circuits",
    primitive: "DiagramNCContact",
    aliases: ["guard switch", "interlock", "gate switch", "GS"],
    relatedLessonSlugs: ["guarding-lockout", "electrical-schematic-basics"],
    relatedSimulatorIds: [],
    relatedLabIds: ["conveyor-troubleshoot"],
  },
  {
    id: "selector_switch",
    name: "Selector Switch",
    description: "Maintained rotary selector — contact with a knob/detent actuator.",
    function: "Selects a mode/position (e.g., HAND-OFF-AUTO); maintains state until turned.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA ICS 1 — selector (SS)",
    typicalUse: "HAND-OFF-AUTO, local/remote, mode selection",
    category: "motor_controls",
    primitive: "DiagramSelectorSwitch",
    aliases: ["selector", "HOA", "SS", "hand-off-auto"],
    relatedLessonSlugs: ["motor-controls-basics"],
    relatedSimulatorIds: [],
    relatedLabIds: ["component-id"],
  },
  {
    id: "safety_relay",
    name: "Safety Relay",
    description: "Dual-channel safety monitoring relay — boxed coil with two input channels.",
    function: "Monitors E-stop/guard channels and directly de-energizes the machine contactor — not a standard PLC.",
    iecReference: "IEC 61508 / ISO 13849",
    nemaJicReference: "NFPA 79 — safety relay / safety controller",
    typicalUse: "E-stop and guard monitoring, PLd–e safety functions",
    category: "safety_circuits",
    primitive: "DiagramSafetyRelay",
    aliases: ["safety relay", "SR", "guardmaster", "safety monitor"],
    relatedLessonSlugs: ["guarding-lockout"],
    relatedSimulatorIds: [],
    relatedLabIds: [],
  },
  {
    id: "timer_contact",
    name: "Timer Contact (On-Delay)",
    description: "Time-delay contact — NO contact with a timing arc/arrow (TON).",
    function: "Closes a set time after its rung is energized (on-delay); paired with a TON timer/instruction.",
    iecReference: "IEC 61131-3",
    nemaJicReference: "NEMA ICS 1 — TR / timed contact (TON)",
    typicalUse: "Start delays, sequencing, anti-cycle timing",
    category: "plc_symbols",
    primitive: "DiagramTimerContact",
    aliases: ["timer", "TON", "TR", "on-delay", "timed contact"],
    relatedLessonSlugs: ["plc-fundamentals"],
    relatedSimulatorIds: [],
    relatedLabIds: ["ladder-logic"],
  },
  {
    id: "fuse",
    name: "Fuse",
    description: "Rounded rectangle with fusible element line.",
    function: "Overcurrent protection — melts to interrupt fault current.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA Fuses / NFPA 79 control circuit protection",
    typicalUse: "Control circuit F1, branch short-circuit protection",
    category: "electrical_symbols",
    primitive: "DiagramFuse",
    aliases: ["fuse", "F1", "fusible"],
    relatedLessonSlugs: ["electrical-schematic-basics"],
    relatedSimulatorIds: ["blown-fuse-v3"],
    relatedLabIds: ["motor-starter", "wiring-diagram", "component-id"],
  },
  {
    id: "breaker",
    name: "Circuit Breaker",
    description: "Rectangle with internal X — distinct from contactor.",
    function: "Switching and overcurrent protection for feeders and branches.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA AB / NFPA 70 — CB designator on one-lines",
    typicalUse: "MCC branch feeders, disconnecting means upstream of contactor",
    category: "electrical_symbols",
    primitive: "DiagramBreaker",
    aliases: ["CB", "circuit breaker", "breaker"],
    relatedLessonSlugs: ["electrical-schematic-basics", "three-phase-power"],
    relatedSimulatorIds: ["vfd-conveyor-multifault-v3"],
    relatedLabIds: ["wiring-diagram"],
  },
  {
    id: "contactor_power",
    name: "Contactor Power Pole",
    description: "Single pole with moving contact blade — not an X breaker.",
    function: "Switches motor power when coil energizes.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA ICS 2 — contactor poles on three-line diagrams",
    typicalUse: "Three-line MCC diagrams, power switching",
    contextNote: "Carries motor / load current.",
    category: "motor_controls",
    primitive: "DiagramContactorPole",
    aliases: ["contactor", "K", "M power pole"],
    relatedLessonSlugs: ["motor-controls-basics"],
    relatedSimulatorIds: [],
    relatedLabIds: ["wiring-diagram"],
  },
  {
    id: "disconnect",
    name: "Disconnect Switch",
    description: "Pivoted blade between fixed contacts.",
    function: "Manual isolation for LOTO; visible open point.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NFPA 79 — disconnect at point of control",
    typicalUse: "Motor disconnect, VFD isolation, feeder lockout",
    category: "electrical_symbols",
    primitive: "DiagramDisconnect",
    aliases: ["disconnect", "DS", "isolator"],
    relatedLessonSlugs: ["electrical-schematic-basics"],
    relatedSimulatorIds: [],
    relatedLabIds: ["wiring-diagram"],
  },
  {
    id: "motor",
    name: "Three-Phase Motor",
    description: "Circle with M designation — NEMA / JIC motor symbol.",
    function: "Converts electrical power to mechanical rotation.",
    iecReference: "IEC 60617-06",
    nemaJicReference: "NEMA MG 1 / JIC — M inside circle",
    typicalUse: "One-line and three-line load identification",
    contextNote: "Represents the load / motor, not a contact.",
    category: "motor_controls",
    primitive: "DiagramMotor",
    aliases: ["motor", "M", "induction motor"],
    relatedLessonSlugs: ["electrical-schematic-basics", "three-phase-power"],
    relatedSimulatorIds: ["motor-overload-v3"],
    relatedLabIds: ["wiring-diagram", "component-id"],
  },
  {
    id: "pb_no",
    name: "Pushbutton — Normally Open",
    description: "NO contact with momentary actuator head.",
    function: "Momentary make contact — returns open when released.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA ICS 1 — START pushbutton",
    typicalUse: "Start PB in 3-wire control",
    category: "motor_controls",
    primitive: "DiagramPushbuttonNO",
    aliases: ["start", "PB NO", "start button"],
    relatedLessonSlugs: ["motor-controls-basics"],
    relatedSimulatorIds: [],
    relatedLabIds: ["motor-starter"],
  },
  {
    id: "pb_nc",
    name: "Pushbutton — Normally Closed",
    description: "NC contact with momentary actuator head.",
    function: "Momentary break contact — stop circuit in series.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA ICS 1 — STOP pushbutton",
    typicalUse: "Stop PB in 3-wire control, E-stop when combined with safety chain",
    category: "motor_controls",
    primitive: "DiagramPushbuttonNC",
    aliases: ["stop", "PB NC", "stop button"],
    relatedLessonSlugs: ["motor-controls-basics"],
    relatedSimulatorIds: ["conveyor-estop-v2"],
    relatedLabIds: ["motor-starter"],
  },
  {
    id: "transformer",
    name: "Control Transformer",
    description: "Coupled inductor pair with center separation.",
    function: "Steps voltage for control circuits (e.g. 480→120VAC).",
    iecReference: "IEC 60617-06",
    nemaJicReference: "NEMA ST / NFPA 79 control power",
    typicalUse: "120VAC control supply for starters",
    category: "electrical_symbols",
    primitive: "DiagramTransformer",
    aliases: ["transformer", "CPT", "control transformer"],
    relatedLessonSlugs: ["electrical-schematic-basics"],
    relatedSimulatorIds: ["blown-fuse-v3"],
    relatedLabIds: [],
  },
  {
    id: "terminal",
    name: "Terminal / Junction",
    description: "Filled junction dot on conductor.",
    function: "Wire splice or terminal point on print.",
    iecReference: "IEC 60617",
    nemaJicReference: "NFPA 79 — wire junction notation",
    typicalUse: "Ladder junctions, TB cross-reference points",
    category: "terminal_numbering",
    primitive: "DiagramTerminal",
    aliases: ["terminal", "junction", "TB"],
    relatedLessonSlugs: ["electrical-schematic-basics"],
    relatedSimulatorIds: ["plc-io-fault-v3"],
    relatedLabIds: ["motor-starter"],
  },
  {
    id: "limit_switch",
    name: "Limit Switch (Roller Lever)",
    description: "NC/NO contact with mechanical roller actuator.",
    function: "Position sensing via physical contact with machine.",
    iecReference: "IEC 60617-07",
    nemaJicReference: "NEMA ICS 1 — LS designator",
    typicalUse: "End-of-travel, gate position, conveyor limits",
    category: "instrumentation",
    primitive: "DiagramLimitSwitch",
    aliases: ["limit switch", "LS", "roller lever"],
    relatedLessonSlugs: ["electrical-schematic-basics"],
    relatedSimulatorIds: [],
    relatedLabIds: ["component-id"],
  },
  {
    id: "estop",
    name: "Emergency Stop",
    description: "NC contact in series safety chain with mushroom head notation.",
    function: "Fail-safe stop — removes motive power via safety circuit.",
    iecReference: "IEC 60617 / ISO 13850",
    nemaJicReference: "NFPA 79 — Category 0/1 stop, E-stop chain",
    typicalUse: "Machine e-stop strings, safety relay inputs",
    category: "safety_circuits",
    primitive: "DiagramEStop",
    aliases: ["e-stop", "emergency stop", "ES"],
    relatedLessonSlugs: ["safety-circuits", "nfpa-79-basics"],
    relatedSimulatorIds: ["conveyor-estop-v2", "failed-safety-relay"],
    relatedLabIds: [],
  },
  {
    id: "plc_input",
    name: "PLC Digital Input",
    description: "Field input module representation on ladder.",
    function: "PLC reads field device state into scan memory.",
    iecReference: "IEC 61131",
    nemaJicReference: "Allen-Bradley I: addressing on prints",
    category: "plc_io_numbering",
    primitive: "DiagramPLCInput",
    aliases: ["PLC input", "I:", "XIC field"],
    relatedLessonSlugs: ["plc-basics", "plc-io-wiring"],
    relatedSimulatorIds: ["plc-io-fault-v3"],
    relatedLabIds: ["ladder-logic", "conveyor-plc-lab"],
    typicalUse: "Sensor and pushbutton inputs to PLC",
  },
  {
    id: "plc_output",
    name: "PLC Digital Output",
    description: "Output module representation on ladder.",
    function: "PLC drives field loads from scan logic result.",
    iecReference: "IEC 61131",
    nemaJicReference: "Allen-Bradley O: addressing on prints",
    category: "plc_io_numbering",
    primitive: "DiagramPLCOutput",
    aliases: ["PLC output", "O:", "coil output"],
    relatedLessonSlugs: ["plc-basics"],
    relatedSimulatorIds: ["plc-io-fault-v3"],
    relatedLabIds: ["ladder-logic", "conveyor-plc-lab"],
    typicalUse: "Contactor coils, indicator lights, solenoids",
  },
  {
    id: "photoeye",
    name: "Photoelectric Sensor",
    description:
      "Diffuse, retroreflective, and through-beam photoelectric sensors detect objects via modulated light. On conveyors, PE outputs drive PLC digital inputs for presence, jam, and counting logic.",
    function:
      "Emits a modulated light beam; output switches when a target blocks the beam (diffuse/through-beam) or a reflector returns signal (retroreflective). Typical field output: PNP NO to a 24 VDC PLC digital input per print.",
    iecReference: "IEC 60947-5-2 — proximity switches (presence sensing by extension)",
    nemaJicReference:
      "NEMA ICS 1 — sensor mounting practice; EAS SYM-PE-001: brown (+24V), blue (0V), black (signal) for DC PNP",
    typicalUse: "Conveyor product detection, jam detection, clear-path interlocks, part counting",
    category: "instrumentation",
    primitive: "DiagramPhotoeye",
    aliases: [
      "photoeye",
      "photoelectric sensor",
      "PE",
      "retroreflective",
      "diffuse",
      "through-beam",
      "sensor input",
    ],
    industrialApplications: [
      "Conveyor detection — product at station or merge point",
      "Jam detection — accumulate zone blocked beyond timer",
      "Product presence — permissive for downstream equipment",
      "Part counting — pulse on leading edge at reject or tally station",
    ],
    wiringNotes:
      "24 VDC PNP NO typical: brown (+24V), blue (0V/common), black (signal to PLC input). NPN sinks signal to common — match module type (sinking/sourcing) per print. Conveyor PE1 at I:1/5: TRUE when beam blocked; ladder Rung 4 uses NC contact (PE CLEAR) for clear-path interlock — NC passes when input is FALSE (path clear). Verify supply voltage, polarity, and input bit state at the PLC before replacing the sensor.",
    relatedLessonSlugs: ["proximity-photoelectric", "io-troubleshooting"],
    relatedSimulatorIds: ["conveyor-plc-lab"],
    relatedLabIds: ["conveyor-plc-lab"],
  },
  {
    id: "vfd",
    name: "VFD Fault Contact",
    description: "Drive fault output — a contact/signal that changes state when the VFD trips (shown here as the drive's FAULT relay), not the whole drive.",
    function: "Signals a drive fault to the control circuit or PLC so the machine can stop and annunciate. Wired from the VFD's fault relay output.",
    iecReference: "IEC 61800",
    nemaJicReference: "NEMA ICS 61800 / PowerFlex fault relay (e.g. RDY/FLT) conventions",
    typicalUse: "Drive fault interlock to PLC input, fault annunciation, motor speed/fault diagnostics",
    contextNote: "Represents a drive fault output / contact, not the entire drive.",
    category: "vfd_wiring",
    primitive: "DiagramVFD",
    aliases: ["VFD", "drive", "inverter"],
    relatedLessonSlugs: ["vfd-basics", "vfd-troubleshooting"],
    relatedSimulatorIds: ["vfd-overcurrent-v3", "vfd-ground-fault-v3"],
    relatedLabIds: ["vfd-parameters"],
  },
];

/** Print-reading standards entries (no SVG primitive — reference content) */
export const PRINT_READING_STANDARDS = [
  {
    id: "one-line-diagram",
    name: "One-Line Diagram",
    description: "Single-line representation of three-phase power distribution.",
    category: "print_reading" as StandardsCategory,
    iecReference: "IEC 61082",
    nemaJicReference: "NEMA / IEEE 315 simplified one-line",
    typicalUse: "MCC feeder identification, breaker sizing verification",
  },
  {
    id: "three-line-diagram",
    name: "Three-Line Diagram",
    description: "Per-phase detail showing each conductor path.",
    category: "print_reading" as StandardsCategory,
    iecReference: "IEC 61082",
    nemaJicReference: "NFPA 79 motor feeder documentation",
    typicalUse: "Motor starter wiring, phase-loss diagnosis",
  },
  {
    id: "ladder-diagram",
    name: "Ladder Diagram",
    description: "Left-to-right logic with rails and rungs.",
    category: "print_reading" as StandardsCategory,
    iecReference: "IEC 61131-3",
    nemaJicReference: "NEMA ICS 1 / JIC EGP-1",
    typicalUse: "Control circuit troubleshooting, seal-in tracing",
  },
];

export function getSymbolById(id: string): ElectricalSymbolEntry | undefined {
  return ELECTRICAL_SYMBOL_REGISTRY.find((e) => e.id === id);
}

export function getSymbolsByCategory(category: StandardsCategory): ElectricalSymbolEntry[] {
  return ELECTRICAL_SYMBOL_REGISTRY.filter((e) => e.category === category);
}

export function searchSymbols(query: string): ElectricalSymbolEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return ELECTRICAL_SYMBOL_REGISTRY;
  return ELECTRICAL_SYMBOL_REGISTRY.filter((e) => {
    const haystack = [
      e.name,
      e.description,
      e.function,
      e.typicalUse,
      e.nemaJicReference,
      e.wiringNotes ?? "",
      ...(e.industrialApplications ?? []),
      ...e.aliases,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getOrderedCategories(): StandardsCategory[] {
  return (Object.keys(CATEGORY_META) as StandardsCategory[]).sort(
    (a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order
  );
}

/**
 * Learner-facing groupings for the Standards Library page. These are the sections a
 * technician navigates by — power vs control, operator devices, safety, and I/O —
 * independent of the finer `StandardsCategory` used for provenance/metadata.
 */
export interface LearnerSymbolGroup {
  id: string;
  title: string;
  description: string;
  symbolIds: SymbolPrimitiveId[];
}

export const LEARNER_SYMBOL_GROUPS: LearnerSymbolGroup[] = [
  {
    id: "power-devices",
    title: "Power Devices",
    description: "Devices in the power circuit that carry motor and load current.",
    symbolIds: ["disconnect", "fuse", "breaker", "transformer", "contactor_power", "overload_heater", "motor"],
  },
  {
    id: "control-contacts",
    title: "Control Contacts",
    description: "Control-circuit contacts and coils that build the ladder logic.",
    symbolIds: ["contact_no", "contact_nc", "coil", "contactor_aux", "overload_nc", "timer_contact"],
  },
  {
    id: "pushbuttons-switches",
    title: "Pushbuttons and Switches",
    description: "Operator- and machine-actuated input devices.",
    symbolIds: ["pb_no", "pb_nc", "selector_switch", "limit_switch"],
  },
  {
    id: "safety-devices",
    title: "Safety Devices",
    description: "Emergency-stop, guarding, and safety-monitoring devices.",
    symbolIds: ["estop", "guard_switch", "safety_relay"],
  },
  {
    id: "plc-sensors-drives",
    title: "PLC, Sensors, and Drives",
    description: "Field I/O, sensors, and variable-frequency drives.",
    symbolIds: ["plc_input", "plc_output", "photoeye", "vfd"],
  },
  {
    id: "wiring-connection-points",
    title: "Wiring and Connection Points",
    description: "Terminals and junctions where conductors land and cross-reference.",
    symbolIds: ["terminal"],
  },
];

/**
 * Representative print reference designators — the kind of tag a learner sees next to
 * the symbol on a real drawing (e.g. F1, CB1, M1). Examples, not fixed identities.
 */
export const SYMBOL_PRINT_TAGS: Record<SymbolPrimitiveId, string> = {
  disconnect: "DISC",
  fuse: "F1",
  breaker: "CB1",
  transformer: "CPT",
  contactor_power: "M1",
  overload_heater: "OL1",
  motor: "MTR",
  contact_no: "CR1",
  contact_nc: "CR2",
  coil: "CR",
  contactor_aux: "M-aux",
  overload_nc: "95-96",
  timer_contact: "TR1",
  pb_no: "PB1",
  pb_nc: "PB2",
  selector_switch: "SS1",
  limit_switch: "LS1",
  estop: "ES1",
  guard_switch: "GS1",
  safety_relay: "SR1",
  plc_input: "I:1/0",
  plc_output: "O:2/0",
  photoeye: "PE1",
  vfd: "VFD",
  terminal: "TB1",
};

/** Resolves the learner groups to their full symbol entries, skipping any unknown ids. */
export function getLearnerGroups(): Array<
  Omit<LearnerSymbolGroup, "symbolIds"> & { symbols: ElectricalSymbolEntry[] }
> {
  return LEARNER_SYMBOL_GROUPS.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    symbols: g.symbolIds
      .map((id) => getSymbolById(id))
      .filter((e): e is ElectricalSymbolEntry => e !== undefined),
  }));
}
