import { describe, expect, it } from "vitest";
import { buildDriveTelemetry, buildParameters } from "./driveState";

describe("driveState fault telemetry", () => {
  it("normal ready state", () => {
    const t = buildDriveTelemetry("normal", false);
    expect(t.faultActive).toBe(false);
    expect(t.statusWord).toBe("READY");
    expect(t.outputFreqHz).toBe(0);
    expect(t.outputCurrentA).toBeCloseTo(0.2);
    expect(t.dcBusVolts).toBe(678);
    expect(t.fanRpm).toBe(2800);
    expect(t.displayLine2).toContain("NO FAULTS");
  });

  it("normal running state", () => {
    const t = buildDriveTelemetry("normal", true);
    expect(t.faultActive).toBe(false);
    expect(t.statusWord).toBe("RUNNING");
    expect(t.outputFreqHz).toBe(45);
    expect(t.outputCurrentA).toBeCloseTo(12.4);
    expect(t.loadPercent).toBe(62);
  });

  it("overcurrent telemetry", () => {
    const t = buildDriveTelemetry("overcurrent", false);
    expect(t.faultActive).toBe(true);
    expect(t.displayLine1).toContain("F012");
    expect(t.outputCurrentA).toBe(0);
    expect(t.outputFreqHz).toBe(0);
    expect(t.loadPercent).toBeGreaterThan(100);
    const params = buildParameters("overcurrent");
    const accel = params.find((p) => p.number === "P041");
    expect(accel?.value).toBe("0.5");
    expect(accel?.abnormal).toBe(true);
  });

  it("dc bus undervoltage telemetry", () => {
    const t = buildDriveTelemetry("dc_bus_undervoltage", false);
    expect(t.faultActive).toBe(true);
    expect(t.displayLine1).toContain("F004");
    expect(t.dcBusVolts).toBe(387);
    expect(t.outputFreqHz).toBe(0);
    const params = buildParameters("dc_bus_undervoltage");
    const bus = params.find((p) => p.number === "P132");
    expect(bus?.value).toBe("387");
    expect(bus?.abnormal).toBe(true);
  });

  it("cooling fan seized telemetry", () => {
    const t = buildDriveTelemetry("cooling_fan_seized", false);
    expect(t.faultActive).toBe(true);
    expect(t.displayLine1).toContain("F006");
    expect(t.heatsinkTempC).toBe(87);
    expect(t.fanRpm).toBe(0);
    const params = buildParameters("cooling_fan_seized");
    const fan = params.find((p) => p.number === "P131");
    expect(fan?.value).toBe("0");
    expect(fan?.abnormal).toBe(true);
  });
});
