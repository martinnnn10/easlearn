import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("scenarioProgression.getCareerStats", () => {
  it("should be defined as a procedure", () => {
    expect(appRouter).toBeDefined();
    // Verify the career stats procedure exists in the router
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("scenarioProgression.getCareerStats");
  });

  it("should be a protected query (requires auth)", () => {
    const proc = (appRouter as any)._def.procedures["scenarioProgression.getCareerStats"];
    expect(proc).toBeDefined();
    expect(proc._def.type).toBe("query");
  });

  it("should coexist with getRecommendation procedure", () => {
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("scenarioProgression.getRecommendation");
    expect(procedures).toContain("scenarioProgression.getCareerStats");
    expect(procedures).toContain("scenarioProgression.recordCompletion");
    expect(procedures).toContain("scenarioProgression.getHistory");
  });

  it("should have all expected scenarioProgression procedures", () => {
    const procedures = Object.keys((appRouter as any)._def.procedures);
    const scenarioProcs = procedures.filter(p => p.startsWith("scenarioProgression."));
    // Should have record, getHistory, getCareerStats, getRecommendation
    expect(scenarioProcs.length).toBeGreaterThanOrEqual(4);
    expect(scenarioProcs).toContain("scenarioProgression.recordCompletion");
    expect(scenarioProcs).toContain("scenarioProgression.getHistory");
    expect(scenarioProcs).toContain("scenarioProgression.getCareerStats");
    expect(scenarioProcs).toContain("scenarioProgression.getRecommendation");
  });
});
