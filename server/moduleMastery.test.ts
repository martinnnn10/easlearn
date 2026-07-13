/**
 * Module Mastery & Scenario Progression Procedures Tests
 * Tests the certification.getModuleMastery and scenarioProgression router procedures
 */
import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Module Mastery (certification router)", () => {
  it("should define certification.getModuleMastery procedure", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("certification.getModuleMastery");
  });

  it("should define certification.getAllModuleMastery procedure", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("certification.getAllModuleMastery");
  });

  it("should define certification.getMyProgress procedure", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("certification.getMyProgress");
  });

  it("should define certification.claimLevel procedure", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("certification.claimLevel");
  });

  it("should define certification.verify procedure", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("certification.verify");
  });
});

describe("Scenario Progression Router", () => {
  it("should define scenarioProgression.recordCompletion procedure", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("scenarioProgression.recordCompletion");
  });

  it("should define scenarioProgression.getHistory procedure", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("scenarioProgression.getHistory");
  });

  it("should define scenarioProgression.getCareerStats procedure", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("scenarioProgression.getCareerStats");
  });

  it("should define scenarioProgression.getRecommendation procedure", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("scenarioProgression.getRecommendation");
  });

  it("should define scenarioProgression.getMethodologyProgress procedure", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("scenarioProgression.getMethodologyProgress");
  });
});
