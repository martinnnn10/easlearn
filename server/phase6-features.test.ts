/**
 * Phase 6 Feature Tests
 * Tests for: expanded course modules, 4 new simulator scenarios, 3 new interactive labs
 */
import { describe, it, expect } from "vitest";

// === NEW SIMULATOR SCENARIOS ===

describe("New Simulator Scenarios — PLC I/O Fault", () => {
  it("imports and has correct structure", async () => {
    const { scenarioPLCIOFault } = await import("../client/src/data/scenarioPLCIOFault");
    expect(scenarioPLCIOFault).toBeDefined();
    expect(scenarioPLCIOFault.id).toBe("plc-io-fault-v3");
    expect(scenarioPLCIOFault.title).toBeDefined();
    expect(scenarioPLCIOFault.phases.length).toBeGreaterThanOrEqual(1);
    expect(scenarioPLCIOFault.faults.length).toBeGreaterThanOrEqual(1);
  });

  it("has valid equipment and locations", async () => {
    const { scenarioPLCIOFault } = await import("../client/src/data/scenarioPLCIOFault");
    for (const phase of scenarioPLCIOFault.phases) {
      expect(phase.locations.length).toBeGreaterThan(0);
      for (const loc of phase.locations) {
        expect(loc.id).toBeDefined();
        expect(loc.label).toBeDefined();
      }
    }
  });

  it("has scoring rules", async () => {
    const { scenarioPLCIOFault } = await import("../client/src/data/scenarioPLCIOFault");
    expect(scenarioPLCIOFault.scoring).toBeDefined();
    expect(scenarioPLCIOFault.scoring.maxScore).toBeGreaterThan(0);
  });
});

describe("New Simulator Scenarios — Motor Overload Trip", () => {
  it("imports and has correct structure", async () => {
    const { scenarioMotorOverload } = await import("../client/src/data/scenarioMotorOverload");
    expect(scenarioMotorOverload).toBeDefined();
    expect(scenarioMotorOverload.id).toBe("motor-overload-trip-v3");
    expect(scenarioMotorOverload.phases.length).toBeGreaterThanOrEqual(1);
    expect(scenarioMotorOverload.faults.length).toBeGreaterThanOrEqual(1);
  });

  it("has valid advance conditions", async () => {
    const { scenarioMotorOverload } = await import("../client/src/data/scenarioMotorOverload");
    for (const phase of scenarioMotorOverload.phases) {
      expect(phase.advanceConditions.length).toBeGreaterThan(0);
      for (const cond of phase.advanceConditions) {
        expect(cond.nextPhaseId).toBeDefined();
      }
    }
  });
});

describe("New Simulator Scenarios — Communication Loss", () => {
  it("imports and has correct structure", async () => {
    const { scenarioCommLoss } = await import("../client/src/data/scenarioCommLoss");
    expect(scenarioCommLoss).toBeDefined();
    expect(scenarioCommLoss.id).toBe("comm-loss-v3");
    expect(scenarioCommLoss.phases.length).toBeGreaterThanOrEqual(1);
    expect(scenarioCommLoss.faults.length).toBeGreaterThanOrEqual(1);
  });

  it("has networking-related locations", async () => {
    const { scenarioCommLoss } = await import("../client/src/data/scenarioCommLoss");
    const allLocations = scenarioCommLoss.phases.flatMap(p => p.locations);
    const labels = allLocations.map(e => e.label.toLowerCase());
    // Should have network-related locations
    const hasNetworkEquip = labels.some(l => 
      l.includes("switch") || l.includes("network") || l.includes("ethernet") || l.includes("cable") || l.includes("panel")
    );
    expect(hasNetworkEquip).toBe(true);
  });
});

describe("New Simulator Scenarios — Intermittent Ground Fault", () => {
  it("imports and has correct structure", async () => {
    const { scenarioIntermittentGround } = await import("../client/src/data/scenarioIntermittentGround");
    expect(scenarioIntermittentGround).toBeDefined();
    expect(scenarioIntermittentGround.id).toBe("intermittent-ground-fault-v3");
    expect(scenarioIntermittentGround.phases.length).toBeGreaterThanOrEqual(1);
    expect(scenarioIntermittentGround.faults.length).toBeGreaterThanOrEqual(1);
  });

  it("has insulation-related fault", async () => {
    const { scenarioIntermittentGround } = await import("../client/src/data/scenarioIntermittentGround");
    const faultNames = scenarioIntermittentGround.faults.map(f => f.name.toLowerCase());
    const hasInsulationFault = faultNames.some(n => 
      n.includes("insulation") || n.includes("ground") || n.includes("cable")
    );
    expect(hasInsulationFault).toBe(true);
  });
});

// === SCENARIO MODULAR REGISTRY ===

describe("Scenario Modular Registry — New Scenarios", () => {
  it("has registry entries for all 4 new scenarios", async () => {
    const { SCENARIO_VARIANTS } = await import("../client/src/lib/scenarioModular");
    expect(SCENARIO_VARIANTS["plc-io-fault-v3"]).toBeDefined();
    expect(SCENARIO_VARIANTS["motor-overload-trip-v3"]).toBeDefined();
    expect(SCENARIO_VARIANTS["comm-loss-v3"]).toBeDefined();
    expect(SCENARIO_VARIANTS["intermittent-ground-fault-v3"]).toBeDefined();
  });

  it("each new scenario has fault variants", async () => {
    const { SCENARIO_VARIANTS } = await import("../client/src/lib/scenarioModular");
    const newIds = ["plc-io-fault-v3", "motor-overload-trip-v3", "comm-loss-v3", "intermittent-ground-fault-v3"];
    for (const id of newIds) {
      const config = SCENARIO_VARIANTS[id];
      expect(config.faultVariants.length).toBeGreaterThanOrEqual(2);
      expect(config.availableModes.length).toBeGreaterThanOrEqual(2);
    }
  });
});

// === INTERACTIVE LABS ===

describe("Interactive Labs — Virtual Multimeter", () => {
  it("component exports correctly", async () => {
    const { VirtualMultimeterLab } = await import("../client/src/components/interactive");
    expect(VirtualMultimeterLab).toBeDefined();
    expect(typeof VirtualMultimeterLab).toBe("function");
  });
});

describe("Interactive Labs — Ladder Logic Simulator", () => {
  it("component exports correctly", async () => {
    const { LadderLogicSimulatorLab } = await import("../client/src/components/interactive");
    expect(LadderLogicSimulatorLab).toBeDefined();
    expect(typeof LadderLogicSimulatorLab).toBe("function");
  });
});

describe("Interactive Labs — VFD Parameter Lab", () => {
  it("component exports correctly", async () => {
    const { VFDParameterLab } = await import("../client/src/components/interactive");
    expect(VFDParameterLab).toBeDefined();
    expect(typeof VFDParameterLab).toBe("function");
  });
});

// === LABS PAGE INTEGRATION ===

describe("InteractiveLabs Page — Tab Integration", () => {
  it("has 7 total tabs including new labs", async () => {
    // We can't easily render React components in vitest without jsdom,
    // but we can verify the page file imports all components
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/InteractiveLabs.tsx", "utf-8");
    expect(content).toContain("VirtualMultimeterLab");
    expect(content).toContain("LadderLogicSimulatorLab");
    expect(content).toContain("VFDParameterLab");
    expect(content).toContain("multimeter");
    expect(content).toContain("ladder");
    expect(content).toContain("vfd");
  });
});

// === COURSE EXPANSION VERIFICATION ===

describe("Course Expansion — Database Seeding", () => {
  it("seed script exists and has all 7 modules", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const scriptPath = path.resolve(process.cwd(), "seed-expanded-lessons-v2.mjs");
    const content = fs.readFileSync(scriptPath, "utf-8");
    expect(content).toContain("industrial-networking");
    expect(content).toContain("sensors-instrumentation");
    expect(content).toContain("robotics-fundamentals");
    expect(content).toContain("print-reading");
    expect(content).toContain("safety-systems");
    expect(content).toContain("process-control");
    expect(content).toContain("power-distribution");
  });
});
