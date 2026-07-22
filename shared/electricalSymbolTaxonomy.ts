/**
 * EASLearn electrical symbol TAXONOMY — the source of truth for the PUBLIC library.
 *
 * Governs `docs/ELECTRICAL_SYMBOL_SOURCE_OF_TRUTH.md`. Every public symbol belongs to
 * exactly one context. Only symbols whose *geometry* is independently source-confirmed
 * (PLC ladder instructions per Rockwell; functional blocks per vendor docs) are PUBLISHED
 * with a glyph. Hardwired NEMA/JIC symbols whose exact glyph is pending licensed
 * NEMA ICS 19 review are kept as RECORDS only (see PENDING_LIBRARY) and are NOT drawn.
 */

export type SymbolContext =
  | "PHYSICAL_DEVICE"
  | "HARDWIRED_CONTROL_SCHEMATIC"
  | "POWER_CIRCUIT"
  | "ONE_LINE_DIAGRAM"
  | "PLC_LADDER_INSTRUCTION"
  | "FUNCTIONAL_BLOCK"
  | "TRAINING_ILLUSTRATION";

export const CONTEXT_LABEL: Record<SymbolContext, string> = {
  PHYSICAL_DEVICE: "Physical device",
  HARDWIRED_CONTROL_SCHEMATIC: "Hardwired control schematic",
  POWER_CIRCUIT: "Power circuit",
  ONE_LINE_DIAGRAM: "One-line diagram",
  PLC_LADDER_INSTRUCTION: "PLC ladder instruction",
  FUNCTIONAL_BLOCK: "Functional block",
  TRAINING_ILLUSTRATION: "Training illustration",
};

/** A card that is PUBLISHED (glyph shown) because its geometry is source-confirmed. */
export interface PublicSymbol {
  id: string;
  name: string;
  context: SymbolContext;
  represents: string;
  /** Renderer key used by TaxonomySymbolPreview. */
  renderKey: string;
  description: string;
  /** Source that confirms the meaning AND geometry for this published card. */
  source: string;
  designation?: string;
  exampleTag?: string;
  /** Short device/contact clarifier + cross-link text. */
  note?: string;
}

export interface PublishedSection {
  id: string;
  title: string;
  context: SymbolContext;
  description: string;
  symbols: PublicSymbol[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLISHED — geometry independently source-confirmed
// ─────────────────────────────────────────────────────────────────────────────

export const PUBLISHED_SECTIONS: PublishedSection[] = [
  {
    id: "plc-ladder-instructions",
    title: "PLC Ladder Instructions",
    context: "PLC_LADDER_INSTRUCTION",
    description:
      "Rockwell ladder instructions. These EVALUATE or ACT ON a bit in PLC memory — they are not physical NO/NC contacts, coils, or switches. Geometry per Rockwell instruction documentation.",
    symbols: [
      {
        id: "plc_xic",
        name: "XIC — Examine If Closed",
        context: "PLC_LADDER_INSTRUCTION",
        represents: "Bit-evaluation instruction",
        renderKey: "xic",
        description:
          "Evaluates a bit: TRUE (passes rung power) when the referenced bit is 1 / ON. Despite the shape, it is not a physical normally-open contact — it reads a bit.",
        source: "Rockwell Automation — Bit Instructions (XIC)",
        designation: "XIC",
        exampleTag: "B3:0/0",
        note: "PLC instruction, not a hardwired NO contact.",
      },
      {
        id: "plc_xio",
        name: "XIO — Examine If Open",
        context: "PLC_LADDER_INSTRUCTION",
        represents: "Bit-evaluation instruction",
        renderKey: "xio",
        description:
          "Evaluates a bit: TRUE when the referenced bit is 0 / OFF. It is not a physical normally-closed contact — it reads a bit.",
        source: "Rockwell Automation — Bit Instructions (XIO)",
        designation: "XIO",
        exampleTag: "B3:0/1",
        note: "PLC instruction, not a hardwired NC contact.",
      },
      {
        id: "plc_ote",
        name: "OTE — Output Energize",
        context: "PLC_LADDER_INSTRUCTION",
        represents: "Output bit instruction",
        renderKey: "ote",
        description: "Sets its bit ON while the rung is true and OFF when the rung is false.",
        source: "Rockwell Automation — Bit Instructions (OTE)",
        designation: "OTE",
        exampleTag: "O:2/0",
      },
      {
        id: "plc_otl",
        name: "OTL — Output Latch",
        context: "PLC_LADDER_INSTRUCTION",
        represents: "Latch output instruction",
        renderKey: "otl",
        description: "Latches its bit ON when the rung is true; the bit stays ON until unlatched (OTU).",
        source: "Rockwell Automation — Bit Instructions (OTL)",
        designation: "OTL",
        exampleTag: "B3:0/2",
      },
      {
        id: "plc_otu",
        name: "OTU — Output Unlatch",
        context: "PLC_LADDER_INSTRUCTION",
        represents: "Unlatch output instruction",
        renderKey: "otu",
        description: "Resets (unlatches) a latched bit to OFF when the rung is true.",
        source: "Rockwell Automation — Bit Instructions (OTU)",
        designation: "OTU",
        exampleTag: "B3:0/2",
      },
      {
        id: "plc_ton",
        name: "TON — Timer On-Delay",
        context: "PLC_LADDER_INSTRUCTION",
        represents: "Timer instruction (not an electromechanical timer-relay contact)",
        renderKey: "ton",
        description:
          "Accumulates time while the rung is true; the DN bit sets when the accumulator reaches the preset. A PLC instruction, distinct from a hardwired timer-relay contact.",
        source: "Rockwell Automation — Timer Instructions (TON)",
        designation: "TON",
        exampleTag: "T4:0",
      },
      {
        id: "plc_tof",
        name: "TOF — Timer Off-Delay",
        context: "PLC_LADDER_INSTRUCTION",
        represents: "Timer instruction",
        renderKey: "tof",
        description: "Begins timing when the rung goes false; the DN bit resets after the preset elapses.",
        source: "Rockwell Automation — Timer Instructions (TOF)",
        designation: "TOF",
        exampleTag: "T4:1",
      },
      {
        id: "plc_rto",
        name: "RTO — Retentive Timer On",
        context: "PLC_LADDER_INSTRUCTION",
        represents: "Retentive timer instruction",
        renderKey: "rto",
        description: "On-delay timer that RETAINS its accumulated time across rung transitions; cleared only by a RES.",
        source: "Rockwell Automation — Timer Instructions (RTO)",
        designation: "RTO",
        exampleTag: "T4:2",
      },
      {
        id: "plc_res",
        name: "RES — Reset",
        context: "PLC_LADDER_INSTRUCTION",
        represents: "Reset instruction",
        renderKey: "res",
        description: "Resets a timer/counter accumulator (or a retentive timer) to zero.",
        source: "Rockwell Automation — Reset (RES)",
        designation: "RES",
        exampleTag: "T4:2",
      },
    ],
  },
  {
    id: "functional-blocks",
    title: "Functional Blocks & PLC Hardware",
    context: "FUNCTIONAL_BLOCK",
    description:
      "Multi-terminal functional equipment blocks — a safety monitoring module, PLC I/O hardware, a configurable drive relay output, and field sensors. These are REPRESENTATIVE depictions that teach functional architecture; the exact terminals and labels vary by manufacturer and model — confirm against the device datasheet.",
    symbols: [
      {
        id: "safety_module",
        name: "Representative Safety Relay / Monitoring Module",
        context: "FUNCTIONAL_BLOCK",
        represents: "Functional safety module (representative)",
        renderKey: "safety_module",
        description:
          "A REPRESENTATIVE functional safety module — teaching its architecture: monitored dual-channel inputs, a reset/monitoring input, force-guided safety outputs, and an auxiliary signaling output. It is NOT a simple relay coil. The inputs, outputs, and terminal names shown are illustrative — they VARY by manufacturer and model — and this is not a universal physical symbol or a universal terminal assignment.",
        source: "Representative of the safety-relay class (e.g. Siemens SIRIUS 3SK, Rockwell Guardmaster 440R). Not a specific model; confirm terminals against your device datasheet.",
        designation: "SR",
        exampleTag: "SR1",
        note: "Representative architecture — terminal names/assignments vary by make and model. Replaces the old 'Safety Relay Coil' card.",
      },
      {
        id: "plc_input_module",
        name: "PLC Digital Input Module",
        context: "FUNCTIONAL_BLOCK",
        represents: "PLC input hardware",
        renderKey: "plc_input_module",
        description:
          "A physical input module. Field devices (sensors, pushbuttons) land on its channels; the PLC reads their state into memory. It is hardware — not the XIC/XIO instructions that examine those bits.",
        source: "Rockwell Automation — I/O module documentation",
        designation: "I",
        exampleTag: "I:1",
      },
      {
        id: "plc_output_module",
        name: "PLC Digital Output Module",
        context: "FUNCTIONAL_BLOCK",
        represents: "PLC output hardware",
        renderKey: "plc_output_module",
        description:
          "A physical output module. Its channels drive field loads (contactor coils, lamps, solenoids) from the PLC's logic result. Hardware — not the OTE/OTL/OTU instructions.",
        source: "Rockwell Automation — I/O module documentation",
        designation: "O",
        exampleTag: "O:2",
      },
      {
        id: "vfd_relay_output",
        name: "VFD Relay Output — Configurable",
        context: "FUNCTIONAL_BLOCK",
        represents: "Configurable drive relay output",
        renderKey: "vfd_relay_output",
        description:
          "A variable-frequency-drive relay output whose function is ASSIGNED IN CONFIGURATION (e.g. Fault, Ready, Running, At-Frequency, Alarm). The physical relay may provide NO and/or NC terminals depending on the model. There is no universal 'VFD fault contact' — a real diagram must state the drive model, output assignment, NO/NC, normal state, fault behavior, power-loss behavior, and terminal numbers.",
        source: "Drive user documentation (model-specific relay output)",
        designation: "VFD",
        exampleTag: "VFD1",
        note: "Replaces the old generic 'VFD Fault Contact' card.",
      },
      {
        id: "photoeye",
        name: "Photoelectric Sensor",
        context: "FUNCTIONAL_BLOCK",
        represents: "Field sensor device block",
        renderKey: "photoeye",
        description:
          "A photoelectric sensor as a field device block. Its output (typically PNP/NPN to a PLC input) switches when the beam is blocked or a reflector returns signal. Wire per the print.",
        source: "Sensor vendor documentation",
        designation: "PE",
        exampleTag: "PE1",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PENDING — records only; glyphs WITHHELD until sourced + SME-reviewed
// ─────────────────────────────────────────────────────────────────────────────

export type PendingStatus =
  | "GEOMETRY_PENDING_LICENSED_STANDARD"
  | "REDRAW"
  | "REMOVE"
  | "SPLIT";

export interface PendingRecord {
  name: string;
  targetContext: SymbolContext;
  represents: string;
  noNc?: "NO" | "NC";
  status: PendingStatus;
  reason: string;
}

export interface PendingGroup {
  id: string;
  title: string;
  note: string;
  records: PendingRecord[];
}

export const PENDING_LIBRARY: PendingGroup[] = [
  {
    id: "hardwired-contacts",
    title: "Hardwired Control Schematic — contacts & coil",
    note: "Meaning & context are source-confirmed; exact NEMA/JIC glyph geometry is pending licensed ICS 19 review. Not drawn until then.",
    records: [
      { name: "Normally Open (NO) Contact", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "Relay/control NO contact", noNc: "NO", status: "GEOMETRY_PENDING_LICENSED_STANDARD", reason: "Exact NEMA glyph vs IEC diagonal-blade unresolved without ICS 19." },
      { name: "Normally Closed (NC) Contact", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "Relay/control NC contact", noNc: "NC", status: "GEOMETRY_PENDING_LICENSED_STANDARD", reason: "Same as NO." },
      { name: "Relay / Contactor Coil", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "Relay/starter coil", status: "GEOMETRY_PENDING_LICENSED_STANDARD", reason: "ICS 19 coil form + designation." },
      { name: "Contactor Auxiliary Contact", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "Aux NO contact (seal-in/status)", noNc: "NO", status: "GEOMETRY_PENDING_LICENSED_STANDARD", reason: "ICS 19 geometry." },
      { name: "Overload Trip Contact (NC)", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "OL trip contact in control circuit", noNc: "NC", status: "GEOMETRY_PENDING_LICENSED_STANDARD", reason: "Confirm designation (95-96 is IEC) + geometry." },
      { name: "Pushbutton NO Contact", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "PB NO contact", noNc: "NO", status: "SPLIT", reason: "Split from the operator; geometry pending ICS 19." },
      { name: "Pushbutton NC Contact", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "PB NC contact", noNc: "NC", status: "SPLIT", reason: "Split from the operator; geometry pending." },
      { name: "Selector Switch Contact", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "Selector contact (position-specific)", status: "SPLIT", reason: "Split from the operator; geometry pending." },
      { name: "Limit Switch NO Contact", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "LS NO contact", noNc: "NO", status: "SPLIT", reason: "Split from the physical device; geometry pending." },
      { name: "Limit Switch NC Contact", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "LS NC contact", noNc: "NC", status: "SPLIT", reason: "Split from the physical device; geometry pending." },
      { name: "Emergency-Stop NC Safety Contact", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "E-stop NC contact in the safety string", noNc: "NC", status: "SPLIT", reason: "Split from the mushroom operator; geometry pending." },
      { name: "Guard-Interlock NC Monitoring Contact", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "Guard NC monitoring contact", noNc: "NC", status: "SPLIT", reason: "Split from the guard device; geometry pending." },
      { name: "Timer-Relay Coil + Timed-Contact Family", targetContext: "HARDWIRED_CONTROL_SCHEMATIC", represents: "Electromechanical timer-relay coil and NO/NC timed-closed/open contacts", status: "REMOVE", reason: "Prior custom glyph removed. Full ICS 19 timer family deferred until sourced + SME-reviewed." },
    ],
  },
  {
    id: "power-circuit",
    title: "Power Circuit",
    note: "Meaning & context confirmed; exact NEMA glyph geometry pending ICS 19.",
    records: [
      { name: "Contactor Power Pole(s)", targetContext: "POWER_CIRCUIT", represents: "Main contactor power contact(s)", status: "REDRAW", reason: "Show three mechanically-linked poles or clearly label one pole; ICS 19 geometry." },
      { name: "Overload Thermal Element", targetContext: "POWER_CIRCUIT", represents: "OL heater/thermal element in the motor power path", status: "REDRAW", reason: "Confirm exact ICS 19 thermal-element form (resistor zigzag likely wrong)." },
      { name: "Motor", targetContext: "POWER_CIRCUIT", represents: "Motor / load", status: "GEOMETRY_PENDING_LICENSED_STANDARD", reason: "Confirm ICS 19 motor form / 3-phase notation." },
      { name: "Fuse", targetContext: "POWER_CIRCUIT", represents: "Overcurrent fuse", status: "GEOMETRY_PENDING_LICENSED_STANDARD", reason: "Confirm NEMA vs IEC rectangle." },
      { name: "Disconnect Blade", targetContext: "POWER_CIRCUIT", represents: "Manual disconnect/isolator", status: "GEOMETRY_PENDING_LICENSED_STANDARD", reason: "Confirm power vs one-line form." },
      { name: "Control Transformer", targetContext: "POWER_CIRCUIT", represents: "Control power transformer", status: "GEOMETRY_PENDING_LICENSED_STANDARD", reason: "ICS 19 geometry." },
    ],
  },
  {
    id: "one-line",
    title: "One-Line Diagram",
    note: "Distinct from power-schematic forms; geometry pending ICS 19 / IEEE 315 confirmation.",
    records: [
      { name: "One-Line Circuit Breaker", targetContext: "ONE_LINE_DIAGRAM", represents: "Drawout/one-line breaker", status: "SPLIT", reason: "Separate from the power-schematic breaker/poles; the box-with-X is one-line only." },
      { name: "One-Line Disconnect / Fuse / Transformer", targetContext: "ONE_LINE_DIAGRAM", represents: "One-line distribution symbols", status: "GEOMETRY_PENDING_LICENSED_STANDARD", reason: "Confirm one-line forms." },
      { name: "Terminal Point · Connected Junction · Crossing (Not Connected)", targetContext: "ONE_LINE_DIAGRAM", represents: "Three distinct wiring conventions", status: "SPLIT", reason: "A dot on a conductor is not automatically a terminal; split into three." },
    ],
  },
  {
    id: "physical-devices",
    title: "Physical Devices (operators)",
    note: "The physical operator/device, separate from its electrical contact. Device illustrations are not published until reviewed so they are never mistaken for the schematic contact.",
    records: [
      { name: "Roller-Lever Limit Switch — Physical Device", targetContext: "PHYSICAL_DEVICE", represents: "The physical limit switch with separate NO and NC contacts", status: "REDRAW", reason: "Device illustration pending; must not be used as the contact symbol." },
      { name: "Emergency-Stop Mushroom Operator", targetContext: "PHYSICAL_DEVICE", represents: "The physical maintained mushroom operator", status: "REDRAW", reason: "Operator illustration pending; separate from its NC contact." },
      { name: "Pushbutton Operator", targetContext: "PHYSICAL_DEVICE", represents: "The physical pushbutton operator", status: "REDRAW", reason: "Separate from its NO/NC contact." },
      { name: "Selector Switch Operator", targetContext: "PHYSICAL_DEVICE", represents: "The physical selector operator", status: "REDRAW", reason: "Separate from its contact(s)." },
      { name: "Guard-Interlock Device", targetContext: "PHYSICAL_DEVICE", represents: "The physical guard interlock switch", status: "REDRAW", reason: "Separate from its NC monitoring contact." },
    ],
  },
];

export function getPublicSymbolById(id: string): PublicSymbol | undefined {
  for (const section of PUBLISHED_SECTIONS) {
    const found = section.symbols.find((s) => s.id === id);
    if (found) return found;
  }
  return undefined;
}

export function getAllPublicSymbols(): PublicSymbol[] {
  return PUBLISHED_SECTIONS.flatMap((s) => s.symbols);
}

/** Count of records intentionally withheld from the public library pending source/SME. */
export function pendingRecordCount(): number {
  return PENDING_LIBRARY.reduce((n, g) => n + g.records.length, 0);
}
