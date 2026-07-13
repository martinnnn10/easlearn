import { describe, expect, it } from "vitest";
import {
  dbScenarioSlug,
  parseDbScenarioSlug,
  resolveLessonScenarioSlug,
  resolveSimulatorScenarioId,
} from "./scenarioLinking";

describe("scenarioLinking", () => {
  it("uses db- prefix for DB scenario row ids", () => {
    expect(dbScenarioSlug(30005)).toBe("db-30005");
    expect(parseDbScenarioSlug("db-30005")).toBe(30005);
    expect(parseDbScenarioSlug("30005")).toBeNull();
  });

  it("maps db slug to simulator id without colliding with module id", () => {
    expect(resolveSimulatorScenarioId("db-30005")).toBe("plc-io-fault-v3");
    expect(resolveSimulatorScenarioId("db-30002")).toBe("motor-overload-trip-v3");
  });

  it("resolves legacy numeric id via db slug", () => {
    expect(resolveSimulatorScenarioId(null, 6)).toBe("vfd-dc-bus-undervoltage-v3");
  });

  it("returns null for unmapped db scenarios", () => {
    expect(resolveSimulatorScenarioId("db-30003")).toBeNull();
    expect(resolveSimulatorScenarioId("db-10")).toBeNull();
  });

  it("accepts direct simulator ids and aliases", () => {
    expect(resolveSimulatorScenarioId("motor-overload-trip-v3")).toBe("motor-overload-trip-v3");
    expect(resolveSimulatorScenarioId("motor-overload")).toBe("motor-overload-trip-v3");
  });

  it("builds lesson slug from legacy id when slug column empty", () => {
    expect(resolveLessonScenarioSlug(null, 5)).toBe("db-5");
    expect(resolveLessonScenarioSlug("motor-overload-trip-v3", null)).toBe("motor-overload-trip-v3");
  });
});
