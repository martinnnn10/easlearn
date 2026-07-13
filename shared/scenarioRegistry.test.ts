import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_SCENARIO_LEGACY_ALIASES,
  listAssessmentScenarios,
  listAssessmentScenariosByVersion,
  normalizeAssessmentScenarioId,
  validateAssessmentScenarioIds,
} from "./scenarioRegistry";

describe("scenarioRegistry", () => {
  it("resolves legacy assessment aliases to canonical V1 ids", () => {
    expect(normalizeAssessmentScenarioId("24vdc-control-loss")).toBe("24vdc-loss");
    expect(normalizeAssessmentScenarioId("vfd-ramp-up")).toBe("vfd-ramp");
    expect(normalizeAssessmentScenarioId("motor-starter-chatter")).toBe("starter-chatter");
  });

  it("keeps canonical conveyor-estop id for backward compatibility", () => {
    expect(normalizeAssessmentScenarioId("conveyor-estop")).toBe("conveyor-estop");
    expect(
      validateAssessmentScenarioIds(["conveyor-estop"]).valid
    ).toBe(true);
  });

  it("includes V1, V2, and V3 assessment-eligible scenarios", () => {
    const v1 = listAssessmentScenariosByVersion("v1");
    const v2 = listAssessmentScenariosByVersion("v2");
    const v3 = listAssessmentScenariosByVersion("v3");
    expect(v1.length).toBe(7);
    expect(v2.length).toBe(1);
    expect(v3.length).toBe(12);
    expect(listAssessmentScenarios().length).toBe(20);
  });

  it("rejects unknown scenario ids on validation", () => {
    const result = validateAssessmentScenarioIds([
      "conveyor-estop",
      "not-a-real-scenario",
    ]);
    expect(result.valid).toBe(false);
    expect(result.invalid).toEqual(["not-a-real-scenario"]);
    expect(result.normalized).toEqual(["conveyor-estop"]);
  });

  it("maps legacy aliases during validation", () => {
    const legacyKeys = Object.keys(ASSESSMENT_SCENARIO_LEGACY_ALIASES);
    const result = validateAssessmentScenarioIds(legacyKeys);
    expect(result.valid).toBe(true);
    expect(result.normalized).toEqual(
      legacyKeys.map((k) => ASSESSMENT_SCENARIO_LEGACY_ALIASES[k])
    );
  });
});
