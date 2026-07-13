/**
 * PowerFlex benchmark fault-code one-pager (A8.1) — printable reference content.
 */

export interface PowerFlexFaultOnePagerEntry {
  code: string;
  faultId: string;
  name: string;
  meaning: string;
  symptoms: string[];
  likelyCauses: string[];
  keyMeasurements: string[];
  relatedParameters: string[];
  v3ScenarioId: string;
}

export const POWERFLEX_FAULT_ONE_PAGER: PowerFlexFaultOnePagerEntry[] = [
  {
    code: "F012",
    faultId: "overcurrent",
    name: "Overcurrent",
    meaning: "Instantaneous or sustained output current exceeded the drive limit (typically 200% FLA).",
    symptoms: [
      "Trip during acceleration or sudden load",
      "F012 on HIM; output current spikes before freq reaches setpoint",
      "May repeat on every START attempt after parameter change",
    ],
    likelyCauses: [
      "Acceleration time too fast (P041) after factory reset",
      "Mechanical binding or heavy load during ramp",
      "Motor FLA / overload settings mismatched to application",
    ],
    keyMeasurements: [
      "Output current during ramp (A133) — compare to motor FLA",
      "Output frequency at trip — partial ramp indicates accel issue",
      "Load % at trip — >100% indicates mechanical or param issue",
    ],
    relatedParameters: ["P041 Accel Time 1", "P043 Motor NP FLA", "P133 Output Current"],
    v3ScenarioId: "vfd-overcurrent-ramp-v3",
  },
  {
    code: "F004",
    faultId: "dc_bus_undervoltage",
    name: "DC Bus Undervoltage",
    meaning: "DC bus voltage dropped below the undervoltage threshold (~400V on 480V class drives).",
    symptoms: [
      "Intermittent trips under high-torque or acceleration",
      "F004 on HIM; bus voltage sags during load events",
      "Worsens through shift as capacitors heat and ESR rises",
    ],
    likelyCauses: [
      "Degraded DC bus capacitors (age, thermal cycling)",
      "Input phase loss or loose line terminals",
      "Excessive load demand during accel without adequate bus support",
    ],
    keyMeasurements: [
      "DC bus voltage (P132) under load — below 400V is fault zone",
      "Bus ripple during accel — high ripple indicates weak capacitors",
      "Input voltage at L1/L2/L3 — rule out supply before caps",
    ],
    relatedParameters: ["P132 DC Bus Voltage", "P041 Accel Time 1", "P133 Output Current"],
    v3ScenarioId: "vfd-dc-bus-undervoltage-v3",
  },
  {
    code: "F006",
    faultId: "cooling_fan_seized",
    name: "Heatsink Overtemperature",
    meaning: "IGBT heatsink exceeded maximum safe temperature (85°C trip on PowerFlex 525).",
    symptoms: [
      "Trip after several minutes at moderate/high load",
      "F006 on HIM; heatsink temp climbs with fan at 0 RPM",
      "May cool and restart intermittently before fan fully seizes",
    ],
    likelyCauses: [
      "Internal cooling fan bearing seized (contamination, wear)",
      "Blocked airflow / dirty heatsink fins",
      "High ambient or poor enclosure ventilation",
    ],
    keyMeasurements: [
      "Heatsink temperature (P130) — >85°C trips",
      "Fan speed (P131) — 0 RPM confirms fan failure",
      "Load % and run time — OT follows sustained load without cooling",
    ],
    relatedParameters: ["P130 Heatsink Temp", "P131 Fan Speed", "P133 Output Current"],
    v3ScenarioId: "vfd-cooling-fan-seized-v3",
  },
];

export function buildPowerFlexOnePagerPrintText(): string {
  const lines: string[] = [
    "PowerFlex 525 — Benchmark Fault Code One-Pager (Beta v1)",
    "Packaging / manufacturing drive diagnostics — EASLearn",
    "",
  ];
  for (const entry of POWERFLEX_FAULT_ONE_PAGER) {
    lines.push(`${entry.code} — ${entry.name}`);
    lines.push(`Meaning: ${entry.meaning}`);
    lines.push("Symptoms:");
    entry.symptoms.forEach((s) => lines.push(`  • ${s}`));
    lines.push("Likely causes:");
    entry.likelyCauses.forEach((c) => lines.push(`  • ${c}`));
    lines.push("Key measurements:");
    entry.keyMeasurements.forEach((m) => lines.push(`  • ${m}`));
    lines.push(`Related parameters: ${entry.relatedParameters.join(", ")}`);
    lines.push(`V3 scenario: ${entry.v3ScenarioId}`);
    lines.push("");
  }
  return lines.join("\n");
}
