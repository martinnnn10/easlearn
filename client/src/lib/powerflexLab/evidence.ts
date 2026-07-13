import type { DriveParameter, DriveTelemetry, FaultId } from "./types";
import { getFaultById } from "./faultCatalog";

export function discoverEvidence(
  faultId: FaultId,
  telemetry: DriveTelemetry,
  parameters: DriveParameter[],
  discovered: string[]
): string[] {
  if (faultId === "normal") return discovered;

  const fault = getFaultById(faultId);
  if (!fault) return discovered;

  const next = new Set(discovered);

  if (telemetry.faultActive && fault.faultCode) {
    next.add(`fault_${fault.faultCode.toLowerCase()}`);
  }
  if (telemetry.outputCurrentA > 20) next.add("high_output_current");
  if (telemetry.dcBusVolts < 400) next.add("dc_bus_low");
  if (telemetry.fanRpm === 0 && faultId === "cooling_fan_seized") next.add("fan_rpm_zero");
  if (telemetry.heatsinkTempC >= 80) next.add("heatsink_high");

  const accel = parameters.find((p) => p.number === "P041");
  if (accel && parseFloat(accel.value) < 2) next.add("accel_time_low");

  if (faultId === "overcurrent") next.add("fault_history_oc");
  if (faultId === "dc_bus_undervoltage") {
    next.add("fault_history_uv");
    next.add("load_spike_history");
  }
  if (faultId === "cooling_fan_seized") next.add("fault_history_ot");

  return fault.evidence.filter((e) => next.has(e) || discovered.includes(e));
}
