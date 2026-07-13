import type { DiagnosticStep, FaultId, PowerFlexFault } from "./types";

export const FAULT_CATALOG: PowerFlexFault[] = [
  {
    id: "overcurrent",
    label: "Overcurrent at Ramp",
    faultCode: "F012",
    symptom: "Drive trips during acceleration — F012 OVERCURRENT on display. Output current exceeds 200% FLA.",
    operatorReport:
      "Line won't start — drive faults out every time we hit START. Shows F012 on the keypad. Maintenance reset parameters Saturday.",
    rootCause:
      "Acceleration time too aggressive after parameter reset (P041 dropped from 5.0s to 0.5s). Motor cannot ramp loaded conveyor without exceeding current limit.",
    correctFirstStep: "check_parameters",
    evidence: ["fault_f012", "high_output_current", "accel_time_low", "fault_history_oc"],
    incorrectPaths: ["Replacing motor", "Bypassing STO", "Increasing motor FLA without cause"],
    v3ScenarioId: "vfd-overcurrent-ramp-v3",
    faultLog: [
      { timestamp: "06:02:15", code: "F012", description: "OVERCURRENT — instantaneous limit exceeded", severity: "critical" },
      { timestamp: "06:02:15", code: "A081", description: "Output current at trip: 28.4A (limit 25A)", severity: "critical" },
      { timestamp: "06:02:14", code: "A004", description: "Motor current rising: 15A → 28A in 0.4s", severity: "warning" },
      { timestamp: "05:55:08", code: "F012", description: "OVERCURRENT — first occurrence this shift", severity: "critical" },
    ],
  },
  {
    id: "dc_bus_undervoltage",
    label: "DC Bus Undervoltage",
    faultCode: "F004",
    symptom: "Intermittent F004 DC BUS UNDERVOLTAGE under load — bus voltage sags below 400V during high-torque demand.",
    operatorReport:
      "Drive trips randomly when the mixer hits thick product. F004 on display. Gets worse as the shift goes on.",
    rootCause:
      "Degraded DC bus capacitors cannot hold bus voltage under load (capacitance loss / high ESR). Bus sags to ~387V during acceleration or high-viscosity cycles.",
    correctFirstStep: "check_status_monitor",
    evidence: ["fault_f004", "dc_bus_low", "load_spike_history", "fault_history_uv"],
    incorrectPaths: ["Raising accel time only", "Replacing motor", "Ignoring intermittent trips"],
    v3ScenarioId: "vfd-dc-bus-undervoltage-v3",
    faultLog: [
      { timestamp: "09:47:22", code: "F004", description: "DC BUS UNDERVOLTAGE — below 400V threshold", severity: "critical" },
      { timestamp: "09:47:22", code: "A003", description: "DC bus voltage: 387V (min 400V)", severity: "warning" },
      { timestamp: "08:22:15", code: "F004", description: "Undervoltage during batch acceleration", severity: "critical" },
      { timestamp: "07:15:33", code: "A003", description: "DC bus dip to 415V — recovered", severity: "warning" },
    ],
  },
  {
    id: "cooling_fan_seized",
    label: "Cooling Fan Seized",
    faultCode: "F006",
    symptom: "F006 HEATSINK OVERTEMPERATURE — internal fan seized, heatsink exceeds 85°C under load.",
    operatorReport:
      "Drive ran about 8 minutes then faulted F006. Fan doesn't spin when I listen at the vent. Tripped twice earlier after cooling down.",
    rootCause:
      "Internal 80mm cooling fan bearing seized (contamination/wear). No forced airflow — IGBT heatsink exceeds 85°C trip threshold under >50% load.",
    correctFirstStep: "check_status_monitor",
    evidence: ["fault_f006", "fan_rpm_zero", "heatsink_high", "fault_history_ot"],
    incorrectPaths: ["Lowering accel only", "Replacing motor", "Forcing run without cooling"],
    v3ScenarioId: "vfd-cooling-fan-seized-v3",
    faultLog: [
      { timestamp: "10:38:44", code: "F006", description: "HEATSINK OVERTEMPERATURE — 85°C exceeded", severity: "critical" },
      { timestamp: "10:38:44", code: "A006", description: "Heatsink temp: 87°C (trip 85°C)", severity: "critical" },
      { timestamp: "10:30:22", code: "A006", description: "Heatsink WARNING: 75°C rising", severity: "warning" },
      { timestamp: "09:15:33", code: "F006", description: "HEATSINK OT — 2nd trip today", severity: "critical" },
    ],
  },
];

export const GUIDED_STEPS: {
  step: number;
  title: string;
  instruction: string;
  hint: string;
  check: DiagnosticStep;
}[] = [
  {
    step: 1,
    title: "Read the fault display",
    instruction: "Check the HIM fault code and operator report. What fault is active?",
    hint: "F012 = overcurrent, F004 = DC bus undervoltage, F006 = heatsink overtemperature.",
    check: "check_fault_display",
  },
  {
    step: 2,
    title: "Review fault history",
    instruction: "Open fault history — note recurrence pattern and auxiliary alarm codes.",
    hint: "Repeated F012 at ramp suggests accel/current. F004 under load suggests bus sag. F006 with fan at 0 RPM suggests cooling.",
    check: "check_fault_history",
  },
  {
    step: 3,
    title: "Check status monitor",
    instruction: "Compare output frequency, motor current, DC bus, and load % to expected running values.",
    hint: "Overcurrent: high current at partial freq. Undervoltage: low DC bus under load. Fan seized: high heatsink, 0 fan RPM.",
    check: "check_status_monitor",
  },
  {
    step: 4,
    title: "Browse parameters",
    instruction: "Inspect P041 accel time, motor data, and thermal-related parameters for mismatches.",
    hint: "P041 at 0.5s on a loaded conveyor is a common post-reset overcurrent cause.",
    check: "check_parameters",
  },
  {
    step: 5,
    title: "Submit root cause",
    instruction: "Match evidence to one of the three benchmark faults and submit diagnosis.",
    hint: "Use fault code + status values + parameter clues — not guesswork.",
    check: "check_fault_display",
  },
];

export const ROOT_CAUSE_OPTIONS = FAULT_CATALOG.map((f) => ({ id: f.id, label: f.label }));

export function getFaultById(id: FaultId): PowerFlexFault | undefined {
  if (id === "normal") return undefined;
  return FAULT_CATALOG.find((f) => f.id === id);
}
