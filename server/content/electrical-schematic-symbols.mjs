/**
 * Standard Electrical Symbols — lesson electrical-schematic-basics (90010).
 *
 * ABET / accreditation traceability:
 * - IEC 60617-06 (motors, transformers) — SYMBOL_STANDARDS_REPORT.md
 * - IEC 60617-07 (contacts, fuses, breakers, overload heater) — May 2026 platform audit
 * - NEMA ICS 1 / NFPA 79 — U.S. ladder diagram layout and device tags (M, CR, LS, PS, TS)
 *
 * Geometry sources (do not redraw):
 * - Power + control (9 audited SVGs): production lesson 90010 (.manus/db/db-query-1779217129538.json)
 * - Overload heater: IEC 60617-07 zigzag (audit-compliant; replaces legacy ASCII ─(OL)─)
 * - Input actuators: scripts/add-industrial-symbols.mjs (lesson 20 / 150003 audit pass)
 */

/** Table cell wrapper — scales audited viewBox to readable size */
function sym(viewBox, body, w = 120, h = 60) {
  const flat = body.replace(/\s+/g, " ").trim();
  return `<span class="schematic-symbol-cell"><svg width="${w}" height="${h}" viewBox="${viewBox}" class="schematic-symbol-inline" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${flat}</svg></span>`;
}

// ── Lesson 90010 production-audited paths (IEC 60617) ─────────────────────

const DISCONNECT = sym(
  "0 0 48 24",
  `<line x1="0" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2"/>
   <circle cx="20" cy="12" r="2" fill="currentColor"/>
   <line x1="20" y1="12" x2="34" y2="4" stroke="currentColor" stroke-width="2"/>
   <circle cx="28" cy="12" r="2" fill="currentColor"/>
   <line x1="30" y1="12" x2="48" y2="12" stroke="currentColor" stroke-width="2"/>`
);

const FUSE = sym(
  "0 0 48 24",
  `<line x1="0" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="2"/>
   <rect x="14" y="7" width="20" height="10" rx="5" ry="5" fill="none" stroke="currentColor" stroke-width="2"/>
   <line x1="14" y1="12" x2="34" y2="12" stroke="currentColor" stroke-width="1"/>
   <line x1="34" y1="12" x2="48" y2="12" stroke="currentColor" stroke-width="2"/>`
);

const BREAKER = sym(
  "0 0 48 24",
  `<line x1="0" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="2"/>
   <rect x="14" y="5" width="20" height="14" fill="none" stroke="currentColor" stroke-width="2"/>
   <line x1="14" y1="5" x2="34" y2="19" stroke="currentColor" stroke-width="1.5"/>
   <line x1="34" y1="5" x2="14" y2="19" stroke="currentColor" stroke-width="1.5"/>
   <line x1="34" y1="12" x2="48" y2="12" stroke="currentColor" stroke-width="2"/>`
);

const MOTOR = sym(
  "0 0 48 24",
  `<line x1="0" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="2"/>
   <circle cx="24" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
   <text x="24" y="16" text-anchor="middle" font-size="10" fill="currentColor">M</text>
   <line x1="34" y1="12" x2="48" y2="12" stroke="currentColor" stroke-width="2"/>`
);

const TRANSFORMER = sym(
  "0 0 48 28",
  `<line x1="0" y1="14" x2="12" y2="14" stroke="currentColor" stroke-width="2"/>
   <path d="M12,8 C16,8 16,14 12,14 C16,14 16,20 12,20" fill="none" stroke="currentColor" stroke-width="2"/>
   <line x1="24" y1="4" x2="24" y2="24" stroke="currentColor" stroke-width="2"/>
   <path d="M36,8 C32,8 32,14 36,14 C32,14 32,20 36,20" fill="none" stroke="currentColor" stroke-width="2"/>
   <line x1="36" y1="14" x2="48" y2="14" stroke="currentColor" stroke-width="2"/>`,
  120,
  70
);

const COIL = sym(
  "0 0 48 24",
  `<line x1="0" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="2"/>
   <circle cx="24" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
   <line x1="34" y1="12" x2="48" y2="12" stroke="currentColor" stroke-width="2"/>`
);

const NO_CONTACT = sym(
  "0 0 48 24",
  `<line x1="0" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/>
   <line x1="16" y1="4" x2="16" y2="20" stroke="currentColor" stroke-width="2"/>
   <line x1="32" y1="4" x2="32" y2="20" stroke="currentColor" stroke-width="2"/>
   <line x1="32" y1="12" x2="48" y2="12" stroke="currentColor" stroke-width="2"/>`
);

const NC_CONTACT = sym(
  "0 0 48 24",
  `<line x1="0" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/>
   <line x1="16" y1="4" x2="16" y2="20" stroke="currentColor" stroke-width="2"/>
   <line x1="18" y1="4" x2="30" y2="20" stroke="currentColor" stroke-width="2"/>
   <line x1="32" y1="4" x2="32" y2="20" stroke="currentColor" stroke-width="2"/>
   <line x1="32" y1="12" x2="48" y2="12" stroke="currentColor" stroke-width="2"/>`
);

const TIMER_CONTACT = sym(
  "0 0 48 24",
  `<line x1="0" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/>
   <line x1="16" y1="4" x2="16" y2="20" stroke="currentColor" stroke-width="2"/>
   <line x1="32" y1="4" x2="32" y2="20" stroke="currentColor" stroke-width="2"/>
   <text x="24" y="22" text-anchor="middle" font-size="8" fill="currentColor">T</text>
   <line x1="32" y1="12" x2="48" y2="12" stroke="currentColor" stroke-width="2"/>`
);

/** IEC 60617-07 thermal heater element (audit-compliant overload) */
const OVERLOAD = sym(
  "0 0 48 24",
  `<line x1="0" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2"/>
   <polyline points="10,12 14,6 18,18 22,6 26,18 30,6 34,12" fill="none" stroke="currentColor" stroke-width="2"/>
   <line x1="34" y1="12" x2="48" y2="12" stroke="currentColor" stroke-width="2"/>`
);

// ── Input devices — add-industrial-symbols.mjs (IEC 60617-07 + actuator) ──

const PB_NO = sym(
  "0 0 200 100",
  `<line x1="20" y1="60" x2="70" y2="60" stroke="currentColor" stroke-width="2.5"/>
   <line x1="130" y1="60" x2="180" y2="60" stroke="currentColor" stroke-width="2.5"/>
   <circle cx="70" cy="60" r="3" fill="currentColor"/>
   <line x1="70" y1="60" x2="130" y2="40" stroke="currentColor" stroke-width="2.5"/>
   <circle cx="130" cy="60" r="3" fill="currentColor"/>
   <line x1="100" y1="25" x2="100" y2="40" stroke="currentColor" stroke-width="2"/>
   <line x1="88" y1="25" x2="112" y2="25" stroke="currentColor" stroke-width="2.5"/>`,
  140,
  70
);

const PB_NC = sym(
  "0 0 200 100",
  `<line x1="20" y1="60" x2="70" y2="60" stroke="currentColor" stroke-width="2.5"/>
   <line x1="130" y1="60" x2="180" y2="60" stroke="currentColor" stroke-width="2.5"/>
   <circle cx="70" cy="60" r="3" fill="currentColor"/>
   <line x1="70" y1="60" x2="130" y2="60" stroke="currentColor" stroke-width="2.5"/>
   <circle cx="130" cy="60" r="3" fill="currentColor"/>
   <line x1="90" y1="48" x2="110" y2="48" stroke="currentColor" stroke-width="2"/>
   <line x1="100" y1="35" x2="100" y2="48" stroke="currentColor" stroke-width="2"/>
   <line x1="88" y1="35" x2="112" y2="35" stroke="currentColor" stroke-width="2.5"/>`,
  140,
  70
);

/** Maintained selector: closed contact + rotary lever (IEC 60617-07 switch, latched) */
const SELECTOR = sym(
  "0 0 200 100",
  `<line x1="20" y1="60" x2="70" y2="60" stroke="currentColor" stroke-width="2.5"/>
   <line x1="130" y1="60" x2="180" y2="60" stroke="currentColor" stroke-width="2.5"/>
   <circle cx="70" cy="60" r="3" fill="currentColor"/>
   <line x1="70" y1="60" x2="130" y2="60" stroke="currentColor" stroke-width="2.5"/>
   <circle cx="130" cy="60" r="3" fill="currentColor"/>
   <circle cx="100" cy="26" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
   <line x1="100" y1="26" x2="118" y2="52" stroke="currentColor" stroke-width="2"/>`,
  140,
  70
);

const LIMIT_SWITCH = sym(
  "0 0 200 100",
  `<line x1="20" y1="60" x2="70" y2="60" stroke="currentColor" stroke-width="2.5"/>
   <line x1="130" y1="60" x2="180" y2="60" stroke="currentColor" stroke-width="2.5"/>
   <circle cx="70" cy="60" r="3" fill="currentColor"/>
   <line x1="70" y1="60" x2="130" y2="35" stroke="currentColor" stroke-width="2.5"/>
   <circle cx="130" cy="60" r="3" fill="currentColor"/>
   <line x1="100" y1="20" x2="100" y2="35" stroke="currentColor" stroke-width="1.5"/>
   <circle cx="100" cy="16" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  140,
  70
);

export const ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION = `## Standard Electrical Symbols

Symbols on this page follow **IEC 60617** geometry as used on **U.S. industrial ladder diagrams** per **NEMA ICS 1** and **NFPA 79**. Device tags (**M**, **CR**, **LS**, **PS**, **TS**, **PB**) are print labels — they are not drawn inside the symbol geometry unless noted (e.g., motor **M**, timer **T**).

| Standard | Applies to | Source |
|----------|------------|--------|
| **IEC 60617-06** | Motor (circle + M), transformer (coupled inductors) | Lesson 90010 audit |
| **IEC 60617-07** | Contacts, coils, fuses, disconnects, breakers, overload heater | Lesson 90010 audit |
| **NEMA / NFPA 79** | Ladder layout, rail labels, device designators on prints | Platform standard |

> On Allen-Bradley and similar MCC prints you will see the **coil as a circle ( )** and **contacts as vertical bars** — NEMA/JIC ladder style within IEC geometry.

### Power Components

| Symbol | Component | Function |
|--------|-----------|----------|
| ${DISCONNECT} | Disconnect switch | Main power isolation |
| ${FUSE} | Fuse | Overcurrent protection |
| ${BREAKER} | Circuit breaker | Overcurrent protection (resettable) |
| ${MOTOR} | Motor | Converts electrical to mechanical energy |
| ${TRANSFORMER} | Transformer | Changes voltage level |

### Control Components

| Symbol | Component | Function |
|--------|-----------|----------|
| ${COIL} | Relay/contactor coil | Electromagnetic actuator (NEMA circle) |
| ${NO_CONTACT} | Normally open contact | Closes when coil is energized |
| ${NC_CONTACT} | Normally closed contact | Opens when coil is energized |
| ${TIMER_CONTACT} | Timer contact | Changes state after time delay |
| ${OVERLOAD} | Overload relay | Thermal heater element (IEC zigzag) |

### Input Devices

| Symbol | Component | Function |
|--------|-----------|----------|
| ${PB_NO} | Pushbutton NO | Momentary close on press |
| ${PB_NC} | Pushbutton NC | Momentary open on press |
| ${SELECTOR} | Selector switch | Maintained position — stays selected |
| ${LIMIT_SWITCH} | Limit switch (NO) | Position detection — tagged **LS** on print |
| ${NO_CONTACT} | Pressure switch | NO contact symbol — tagged **PS** on print |
| ${NO_CONTACT} | Temperature switch | NO contact symbol — tagged **TS** on print |

`;

/** Match symbol section through next ## heading */
export const SYMBOLS_SECTION_END_MARKER = "## Reading a Ladder Diagram";

/** Registry for verify-schematic-symbols.mjs */
export const SYMBOL_REGISTRY = {
  disconnect: { standard: "IEC 60617-07", source: "lesson-90010-production" },
  fuse: { standard: "IEC 60617-07", source: "lesson-90010-production" },
  breaker: { standard: "IEC 60617-07 S00379", source: "lesson-90010-production" },
  motor: { standard: "IEC 60617-06", source: "lesson-90010-production" },
  transformer: { standard: "IEC 60617-06", source: "lesson-90010-production" },
  coil: { standard: "NEMA/JIC ladder", source: "lesson-90010-production" },
  noContact: { standard: "IEC 60617-07", source: "lesson-90010-production" },
  ncContact: { standard: "IEC 60617-07", source: "lesson-90010-production" },
  timerContact: { standard: "IEC 60617-07", source: "lesson-90010-production" },
  overload: { standard: "IEC 60617-07", source: "SYMBOL_STANDARDS_REPORT" },
  pbNo: { standard: "IEC 60617-07", source: "add-industrial-symbols.mjs" },
  pbNc: { standard: "IEC 60617-07", source: "add-industrial-symbols.mjs" },
  selector: { standard: "IEC 60617-07", source: "maintained-switch-convention" },
  limitSwitch: { standard: "IEC 60617-07", source: "add-industrial-symbols.mjs" },
  pressureSwitch: { standard: "IEC 60617-07", source: "lesson-90010-production-no-contact" },
  temperatureSwitch: { standard: "IEC 60617-07", source: "lesson-90010-production-no-contact" },
};
