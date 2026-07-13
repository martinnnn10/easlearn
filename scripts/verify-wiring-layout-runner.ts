/**
 * Verify wiring diagram specs — registry symbols, layout bounds, orphan edges.
 */
import { CONVEYOR_WIRING_DIAGRAM } from "../shared/conveyorWiringDiagram";
import { ELECTRICAL_SYMBOL_REGISTRY } from "../shared/electricalSymbolRegistry";
import { layoutWiringDiagram, WIRING_MIN_FONT_PX } from "../shared/wiringDiagramLayout";
import { validateWiringDiagramSpec } from "../shared/wiringDiagramSpec";

let failed = 0;

function pass(msg: string) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg: string) {
  console.error(`  ✗ ${msg}`);
  failed += 1;
}

console.log("Wiring diagram verification\n");

const registryIds = new Set(ELECTRICAL_SYMBOL_REGISTRY.map((e) => e.id));
const validation = validateWiringDiagramSpec(CONVEYOR_WIRING_DIAGRAM);

if (validation.valid) {
  pass("CONVEYOR_WIRING_DIAGRAM validates");
} else {
  for (const e of validation.errors) fail(`${e.path}: ${e.message}`);
}

for (const node of CONVEYOR_WIRING_DIAGRAM.nodes) {
  if (registryIds.has(node.symbolId)) {
    pass(`Registry symbol [${node.symbolId}] — ${node.label}`);
  } else {
    fail(`Missing registry symbol: ${node.symbolId} (${node.label})`);
  }
}

const layout = layoutWiringDiagram(CONVEYOR_WIRING_DIAGRAM);
if (layout.nodes.length === CONVEYOR_WIRING_DIAGRAM.nodes.length) {
  pass(`${layout.nodes.length} layout nodes`);
} else {
  fail(`Node count mismatch: ${layout.nodes.length}`);
}

if (layout.wires.length === CONVEYOR_WIRING_DIAGRAM.edges.length) {
  pass(`${layout.wires.length} routed wires`);
} else {
  fail(`Wire count mismatch: ${layout.wires.length}`);
}

const nodeIds = new Set(CONVEYOR_WIRING_DIAGRAM.nodes.map((n) => n.id));
let orphanEdges = 0;
for (const edge of CONVEYOR_WIRING_DIAGRAM.edges) {
  if (!nodeIds.has(edge.from.nodeId) || !nodeIds.has(edge.to.nodeId)) orphanEdges += 1;
}
if (orphanEdges === 0) {
  pass("No orphan edges");
} else {
  fail(`${orphanEdges} orphan edge(s)`);
}

if (WIRING_MIN_FONT_PX >= 10) {
  pass(`Minimum font token ≥ ${WIRING_MIN_FONT_PX}px`);
} else {
  fail(`Font minimum ${WIRING_MIN_FONT_PX}px below 10px constitution`);
}

const requiredLabels = ["PE1", "I:1/5", "ES1", "PB1 STOP", "PB2 START", "F1 +24VDC", "O:2/0"];
for (const label of requiredLabels) {
  if (CONVEYOR_WIRING_DIAGRAM.nodes.some((n) => n.label === label)) {
    pass(`Device present: ${label}`);
  } else {
    fail(`Missing device label: ${label}`);
  }
}

console.log("");
if (failed === 0) {
  console.log("PASS — all wiring diagram checks OK");
  process.exit(0);
} else {
  console.error(`FAIL — ${failed} check(s) failed`);
  process.exit(1);
}
