/**
 * Verify lesson 90010 symbol section against audited production geometry.
 * Run: node server/verify-schematic-symbols.mjs
 */
import {
  ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION,
  SYMBOL_REGISTRY,
} from "./content/electrical-schematic-symbols.mjs";

const PRODUCTION_MARKERS = [
  // Power — lesson 90010 db-query-1779217129538.json
  { id: "disconnect", needle: 'x2="34" y2="4"', label: "Disconnect angled arm" },
  { id: "fuse", needle: 'rx="5" ry="5"', label: "Fuse rounded rectangle" },
  { id: "breaker", needle: 'x2="34" y2="19"', label: "Breaker internal X" },
  { id: "motor", needle: 'r="10"', label: "Motor circle" },
  { id: "transformer", needle: "M12,8 C16,8", label: "Transformer coupled inductors" },
  // Control
  { id: "coil", needle: 'r="8"', label: "NEMA coil circle" },
  { id: "noContact", needle: 'x1="32" y1="4" x2="32" y2="20"', label: "NO vertical bars" },
  { id: "ncContact", needle: 'x1="18" y1="4" x2="30" y2="20"', label: "NC diagonal slash" },
  { id: "timerContact", needle: 'font-size="8" fill="currentColor">T</text>', label: "Timer T annotation" },
  { id: "overload", needle: "14,6 18,18 22,6", label: "Overload IEC zigzag" },
];

const INPUT_MARKERS = [
  { id: "pbNo", needle: 'x2="130" y2="40"', label: "PB NO open arm (y=40)" },
  { id: "pbNc", needle: 'x1="90" y1="48" x2="110" y2="48"', label: "PB NC contact bar" },
  { id: "selector", needle: 'cy="26" r="7"', label: "Selector rotary knob" },
  { id: "limitSwitch", needle: 'cy="16" r="5"', label: "Limit switch roller actuator" },
];

const FORBIDDEN = [
  { needle: "symbol-card-grid", label: "Card grid layout (rejected)" },
  { needle: "─○/○─", label: "ASCII pushbutton (replaced)" },
  { needle: "─(OL)─", label: "ASCII overload (replaced)" },
];

let failed = 0;

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  failed += 1;
}

console.log("Schematic symbol verification (lesson 90010)\n");
console.log(`Registry entries: ${Object.keys(SYMBOL_REGISTRY).length}`);

for (const m of PRODUCTION_MARKERS) {
  if (ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION.includes(m.needle)) {
    pass(`${m.label} [${m.id}]`);
  } else {
    fail(`Missing ${m.label} [${m.id}]`);
  }
}

for (const m of INPUT_MARKERS) {
  if (ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION.includes(m.needle)) {
    pass(`${m.label} [${m.id}]`);
  } else {
    fail(`Missing ${m.label} [${m.id}]`);
  }
}

for (const m of FORBIDDEN) {
  if (!ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION.includes(m.needle)) {
    pass(`Absent: ${m.label}`);
  } else {
    fail(`Forbidden pattern present: ${m.label}`);
  }
}

const svgCount = (ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION.match(/<svg /g) || []).length;
if (svgCount >= 16) {
  pass(`${svgCount} inline SVGs in section`);
} else {
  fail(`Expected ≥16 SVGs, found ${svgCount}`);
}

if (ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION.includes("### Power Components")) {
  pass("Markdown table layout (Power Components)");
} else {
  fail("Missing markdown table sections");
}

if (ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION.includes("| Pressure switch |")) {
  pass("Pressure switch row (PS tag convention)");
} else {
  fail("Missing pressure switch row");
}

if (ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION.includes("| Temperature switch |")) {
  pass("Temperature switch row (TS tag convention)");
} else {
  fail("Missing temperature switch row");
}

console.log("");
if (failed === 0) {
  console.log("PASS — all symbol checks OK");
  process.exit(0);
} else {
  console.error(`FAIL — ${failed} check(s) failed`);
  process.exit(1);
}
