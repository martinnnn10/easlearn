/**
 * Fault Mastery Map — progression logic.
 */

export type FaultDomain =
  | "power"
  | "motor"
  | "safety"
  | "sensor"
  | "plc"
  | "vfd"
  | "network"
  | "integration";

export const FAULT_DOMAIN_LABELS: Record<FaultDomain, string> = {
  power: "Control Power & Distribution",
  motor: "Motor Control",
  safety: "Safety Circuits",
  sensor: "Sensors & Instrumentation",
  plc: "PLC Diagnostics",
  vfd: "VFD Diagnostics",
  network: "Industrial Networking",
  integration: "Multi-System Integration",
};

export type FaultTileState = "locked" | "available" | "attempted" | "failed" | "mastered";

export interface FaultTypeSummary {
  slug: string;
  title: string;
  domain: FaultDomain;
  difficulty: string;
  scenarioSlug: string | null;
  state: FaultTileState;
  bestMethodology: number | null;
  attempts: number;
}

export function tileState(
  passed: boolean,
  attempts: number,
  unlocked: boolean,
): FaultTileState {
  if (!unlocked) return "locked";
  if (passed) return "mastered";
  if (attempts === 0) return "available";
  return "failed";
}

export function domainMasteryPercent(mastered: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((mastered / total) * 100);
}

export type CareerLevelId =
  | "foundation"
  | "maintenance"
  | "electrical"
  | "controls"
  | "advanced_controls"
  | "master";

export const CAREER_LEVELS: Array<{
  id: CareerLevelId;
  title: string;
  minFcusMastered: number;
  minDomainsWithMastery: number;
}> = [
  { id: "foundation", title: "Foundation Technician", minFcusMastered: 3, minDomainsWithMastery: 2 },
  { id: "maintenance", title: "Maintenance Technician", minFcusMastered: 8, minDomainsWithMastery: 4 },
  { id: "electrical", title: "Electrical Technician", minFcusMastered: 15, minDomainsWithMastery: 5 },
  { id: "controls", title: "Controls Technician", minFcusMastered: 22, minDomainsWithMastery: 6 },
  { id: "advanced_controls", title: "Advanced Controls Technician", minFcusMastered: 30, minDomainsWithMastery: 7 },
  { id: "master", title: "Master Diagnostic Technician", minFcusMastered: 40, minDomainsWithMastery: 8 },
];

export function resolveCareerLevel(
  fcusMastered: number,
  domainsWithAnyMastery: number,
): (typeof CAREER_LEVELS)[number] {
  let current = CAREER_LEVELS[0];
  for (const level of CAREER_LEVELS) {
    if (
      fcusMastered >= level.minFcusMastered &&
      domainsWithAnyMastery >= level.minDomainsWithMastery
    ) {
      current = level;
    }
  }
  return current;
}
