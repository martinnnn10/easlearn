/**
 * Maps course module slugs to diagnostic skill domains for team reporting.
 */

export type SkillDomain =
  | "vfd"
  | "plc"
  | "motors"
  | "safety"
  | "electrical"
  | "networking"
  | "sensors"
  | "integration";

export const SKILL_DOMAIN_LABELS: Record<SkillDomain, string> = {
  vfd: "VFD Diagnostics",
  plc: "PLC Diagnostics",
  motors: "Motor Control",
  safety: "Safety Circuits",
  electrical: "Electrical Power",
  networking: "Industrial Networking",
  sensors: "Sensors & Instrumentation",
  integration: "System Integration",
};

/** Module slug → primary skill domain */
export const MODULE_SKILL_DOMAIN: Record<string, SkillDomain> = {
  "powerflex-vfd": "vfd",
  "plc-fundamentals": "plc",
  "plc-connection-fundamentals": "plc",
  "studio-5000-safe-access": "plc",
  "motors-controls": "motors",
  "safety-systems": "safety",
  "electrical-fundamentals": "electrical",
  "power-distribution": "electrical",
  "print-reading": "electrical",
  "digital-fundamentals": "electrical",
  "industrial-networking": "networking",
  "rslinx-communication-setup": "networking",
  "drives-servo-communication": "networking",
  "sensor-fundamentals": "sensors",
  "photoelectric-sensors": "sensors",
  "sensors-instrumentation": "sensors",
  "instrumentation-basics": "sensors",
  "measurement-devices": "sensors",
  "industrial-troubleshooting": "integration",
  "real-troubleshooting-workflow": "integration",
  "real-world-fault-scenarios": "integration",
  "calibration-troubleshooting": "sensors",
  "fluid-power": "motors",
  "process-control": "sensors",
  "preventative-maintenance": "integration",
};

export function skillDomainForModule(slug: string): SkillDomain {
  return MODULE_SKILL_DOMAIN[slug] ?? "integration";
}
