import { describe, expect, it } from "vitest";
import { CONVEYOR_WIRING_DIAGRAM } from "./conveyorWiringDiagram";
import { ELECTRICAL_SYMBOL_REGISTRY } from "./electricalSymbolRegistry";
import {
  layoutWiringDiagram,
  WIRING_MIN_FONT_PX,
  WIRING_GRID_PX,
  getLayoutBounds,
} from "./wiringDiagramLayout";
import {
  validateWiringDiagramSpec,
  type WiringDiagramSpec,
} from "./wiringDiagramSpec";
import { buildConveyorPrintPackage, buildWiringSummary } from "./conveyorPrintPackage";

describe("wiringDiagramSpec — conveyor", () => {
  it("validates CONVEYOR_WIRING_DIAGRAM without errors", () => {
    const result = validateWiringDiagramSpec(CONVEYOR_WIRING_DIAGRAM);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("uses only registry-governed symbol IDs", () => {
    const registryIds = new Set(ELECTRICAL_SYMBOL_REGISTRY.map((e) => e.id));
    for (const node of CONVEYOR_WIRING_DIAGRAM.nodes) {
      expect(registryIds.has(node.symbolId)).toBe(true);
    }
  });

  it("includes required conveyor devices", () => {
    const labels = CONVEYOR_WIRING_DIAGRAM.nodes.map((n) => n.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        "F1 +24VDC",
        "ES1",
        "GS1",
        "PB1 STOP",
        "PB2 START",
        "PE1",
        "I:1/3",
        "I:1/5",
        "OL1 NC",
        "CB1 480V",
        "M1",
        "Belt MTR",
        "O:2/0",
      ])
    );
  });

  it("aligns wiring summary with 24 VDC PLC-supervised control", () => {
    const summary = buildWiringSummary();
    expect(summary).toContain("24 VDC");
    expect(summary).toContain("GS1");
    expect(summary).not.toMatch(/120 VAC via E-stop/);
  });

  it("includes wire numbers on edges", () => {
    const numbered = CONVEYOR_WIRING_DIAGRAM.edges.filter((e) => e.label);
    expect(numbered.length).toBeGreaterThanOrEqual(10);
    expect(numbered.some((e) => e.label === "204 PE→IN")).toBe(true);
  });

  it("has no orphan edges", () => {
    const nodeIds = new Set(CONVEYOR_WIRING_DIAGRAM.nodes.map((n) => n.id));
    for (const edge of CONVEYOR_WIRING_DIAGRAM.edges) {
      expect(nodeIds.has(edge.from.nodeId)).toBe(true);
      expect(nodeIds.has(edge.to.nodeId)).toBe(true);
    }
  });
});

describe("wiringDiagramLayout", () => {
  it("produces a bounded viewBox for conveyor sheet", () => {
    const layout = layoutWiringDiagram(CONVEYOR_WIRING_DIAGRAM);
    expect(layout.viewBox).toMatch(/^0 0 \d+ \d+$/);
    expect(layout.nodes.length).toBe(CONVEYOR_WIRING_DIAGRAM.nodes.length);
    expect(layout.wires.length).toBe(CONVEYOR_WIRING_DIAGRAM.edges.length);
    const bounds = getLayoutBounds(layout);
    expect(bounds.maxX).toBeGreaterThan(800);
    expect(bounds.maxY).toBeGreaterThan(500);
  });

  it("uses grid spacing suitable for mobile legibility", () => {
    expect(WIRING_GRID_PX).toBeGreaterThanOrEqual(48);
    expect(WIRING_MIN_FONT_PX).toBeGreaterThanOrEqual(10);
  });

  it("positions all nodes within layout bounds", () => {
    const layout = layoutWiringDiagram(CONVEYOR_WIRING_DIAGRAM);
    for (const node of layout.nodes) {
      expect(node.cx).toBeGreaterThan(0);
      expect(node.cy).toBeGreaterThan(0);
      expect(node.cx).toBeLessThanOrEqual(layout.width);
      expect(node.cy).toBeLessThanOrEqual(layout.height);
    }
  });
});

describe("conveyorPrintPackage", () => {
  it("includes wiring diagram in print package definition", () => {
    const pkg = buildConveyorPrintPackage();
    expect(pkg.wiringDiagram).toBeDefined();
    expect(pkg.wiringDiagram?.sheetId).toBe("conv-wiring-001");
    expect(pkg.version).toBe("1.3");
  });
});

describe("wiringDiagramSpec validation", () => {
  it("rejects unknown symbol IDs", () => {
    const bad: WiringDiagramSpec = {
      ...CONVEYOR_WIRING_DIAGRAM,
      nodes: [
        {
          id: "bad",
          symbolId: "nonexistent" as WiringDiagramSpec["nodes"][0]["symbolId"],
          label: "X",
          x: 1,
          y: 1,
        },
      ],
      edges: [],
    };
    const result = validateWiringDiagramSpec(bad);
    expect(result.valid).toBe(false);
  });
});
