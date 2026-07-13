import type { DriveParameter, DriveTelemetry, FaultId } from "./types";
import { getFaultById } from "./faultCatalog";

export function buildDriveTelemetry(faultId: FaultId, running: boolean): DriveTelemetry {
  if (faultId === "normal") {
    return {
      statusWord: running ? "RUNNING" : "READY",
      outputFreqHz: running ? 45.0 : 0,
      outputCurrentA: running ? 12.4 : 0.2,
      dcBusVolts: 678,
      loadPercent: running ? 62 : 0,
      heatsinkTempC: 48,
      fanRpm: 2800,
      displayLine1: running ? "RUNNING  45.0 Hz" : "READY",
      displayLine2: running ? "OUT 12.4A  BUS 678V" : "NO FAULTS",
      faultActive: false,
    };
  }

  const fault = getFaultById(faultId);
  const code = fault?.faultCode ?? "Fxxx";

  switch (faultId) {
    case "overcurrent":
      return {
        statusWord: "FAULTED",
        outputFreqHz: 0,
        outputCurrentA: 0,
        dcBusVolts: 652,
        loadPercent: 114,
        heatsinkTempC: 56,
        fanRpm: 2750,
        displayLine1: `FAULT  ${code}`,
        displayLine2: "OVERCURRENT TRIP",
        faultActive: true,
      };
    case "dc_bus_undervoltage":
      return {
        statusWord: "FAULTED",
        outputFreqHz: 0,
        outputCurrentA: 0,
        dcBusVolts: 387,
        loadPercent: 0,
        heatsinkTempC: 44,
        fanRpm: 2780,
        displayLine1: `FAULT  ${code}`,
        displayLine2: "DC BUS UNDERVOLT",
        faultActive: true,
      };
    case "cooling_fan_seized":
      return {
        statusWord: "FAULTED",
        outputFreqHz: 0,
        outputCurrentA: 0,
        dcBusVolts: 665,
        loadPercent: 0,
        heatsinkTempC: 87,
        fanRpm: 0,
        displayLine1: `FAULT  ${code}`,
        displayLine2: "HEATSINK OT",
        faultActive: true,
      };
    default:
      return buildDriveTelemetry("normal", false);
  }
}

export function buildParameters(faultId: FaultId): DriveParameter[] {
  const base: DriveParameter[] = [
    { number: "P041", name: "Accel Time 1", group: "Motion", value: "5.0", unit: "s", note: "Ramp to setpoint" },
    { number: "P042", name: "Decel Time 1", group: "Motion", value: "3.0", unit: "s" },
    { number: "P043", name: "Motor NP FLA", group: "Motor", value: "12.6", unit: "A" },
    { number: "P044", name: "Motor NP Hz", group: "Motor", value: "60", unit: "Hz" },
    { number: "P130", name: "Heatsink Temp", group: "Diagnostics", value: "48", unit: "°C", note: "Live monitor" },
    { number: "P131", name: "Fan Speed", group: "Diagnostics", value: "2800", unit: "RPM", note: "Internal fan" },
    { number: "P132", name: "DC Bus Voltage", group: "Diagnostics", value: "678", unit: "V", note: "Live monitor" },
    { number: "P133", name: "Output Current", group: "Diagnostics", value: "12.4", unit: "A", note: "Live monitor" },
  ];

  if (faultId === "overcurrent") {
    return base.map((p) => {
      if (p.number === "P041") return { ...p, value: "0.5", abnormal: true, note: "Factory default after reset" };
      if (p.number === "P130") return { ...p, value: "56" };
      if (p.number === "P132") return { ...p, value: "652" };
      if (p.number === "P133") return { ...p, value: "28.4", abnormal: true };
      return p;
    });
  }

  if (faultId === "dc_bus_undervoltage") {
    return base.map((p) => {
      if (p.number === "P132") return { ...p, value: "387", abnormal: true, note: "Sags under load" };
      if (p.number === "P133") return { ...p, value: "0.0" };
      return p;
    });
  }

  if (faultId === "cooling_fan_seized") {
    return base.map((p) => {
      if (p.number === "P130") return { ...p, value: "87", abnormal: true };
      if (p.number === "P131") return { ...p, value: "0", abnormal: true, note: "Fan seized" };
      if (p.number === "P132") return { ...p, value: "665" };
      return p;
    });
  }

  return base;
}
