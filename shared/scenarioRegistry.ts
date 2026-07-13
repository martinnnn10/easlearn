/**
 * Unified scenario registry (Q-05 / Q-06).
 *
 * Single source of truth for assessment-eligible simulator scenarios across
 * V1, V2, and V3 engines. Scenario *logic* lives in client data modules;
 * this file holds stable IDs, metadata, and legacy alias resolution only.
 */

export type ScenarioEngineVersion = "v1" | "v2" | "v3";

export interface ScenarioRegistryEntry {
  /** Canonical simulator scenario id (stored in assessments.scenarioIds) */
  id: string;
  engineVersion: ScenarioEngineVersion;
  title: string;
  category: string;
  difficultyLabel: string;
  estimatedMinutes: string;
  /** When true, admins may assign this scenario to candidate assessments */
  assessmentEligible: boolean;
}

/** Wrong or retired ids still present in historical assessment rows */
export const ASSESSMENT_SCENARIO_LEGACY_ALIASES: Record<string, string> = {
  "24vdc-control-loss": "24vdc-loss",
  "vfd-ramp-up": "vfd-ramp",
  "motor-starter-chatter": "starter-chatter",
};

/**
 * Canonical registry — keep ids aligned with client scenario `id` fields.
 * Do not duplicate scenario decision trees here.
 */
export const SCENARIO_REGISTRY: ScenarioRegistryEntry[] = [
  // ── V1 (decision-tree engine) ─────────────────────────────────────────────
  {
    id: "conveyor-estop",
    engineVersion: "v1",
    title: "Conveyor E-Stop Chain Open",
    category: "Safety Circuit",
    difficultyLabel: "Beginner",
    estimatedMinutes: "5–8",
    assessmentEligible: true,
  },
  {
    id: "24vdc-loss",
    engineVersion: "v1",
    title: "24VDC Control Power Loss",
    category: "Control Circuit",
    difficultyLabel: "Beginner",
    estimatedMinutes: "5–8",
    assessmentEligible: true,
  },
  {
    id: "vfd-ramp",
    engineVersion: "v1",
    title: "VFD Ramp / Overcurrent",
    category: "VFD",
    difficultyLabel: "Intermediate",
    estimatedMinutes: "6–10",
    assessmentEligible: true,
  },
  {
    id: "starter-chatter",
    engineVersion: "v1",
    title: "Motor Starter Chatter",
    category: "Motor Control",
    difficultyLabel: "Intermediate",
    estimatedMinutes: "6–10",
    assessmentEligible: true,
  },
  {
    id: "case-packer-jam",
    engineVersion: "v1",
    title: "Case Packer Jam Interlock",
    category: "Machine Interlock",
    difficultyLabel: "Intermediate",
    estimatedMinutes: "6–10",
    assessmentEligible: true,
  },
  {
    id: "palletizer-safety-gate",
    engineVersion: "v1",
    title: "Palletizer Safety Gate",
    category: "Safety Circuit",
    difficultyLabel: "Advanced",
    estimatedMinutes: "8–12",
    assessmentEligible: true,
  },
  {
    id: "photoeye-false-trigger",
    engineVersion: "v1",
    title: "Photoeye False Trigger",
    category: "Sensors",
    difficultyLabel: "Advanced",
    estimatedMinutes: "8–12",
    assessmentEligible: true,
  },

  // ── V2 (immersive tool-driven engine) ─────────────────────────────────────
  {
    id: "conveyor-estop-v2",
    engineVersion: "v2",
    title: "Conveyor E-Stop Chain Open — Packaging Line 4",
    category: "Safety Circuit",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "5–12",
    assessmentEligible: true,
  },

  // ── V3 (advanced modular engine) ──────────────────────────────────────────
  {
    id: "vfd-conveyor-multifault-v3",
    engineVersion: "v3",
    title: "VFD Conveyor Multi-Fault",
    category: "VFD",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "10–25",
    assessmentEligible: true,
  },
  {
    id: "vfd-overcurrent-ramp-v3",
    engineVersion: "v3",
    title: "VFD Overcurrent at Ramp",
    category: "VFD",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "5–15",
    assessmentEligible: true,
  },
  {
    id: "vfd-dc-bus-undervoltage-v3",
    engineVersion: "v3",
    title: "VFD DC Bus Undervoltage",
    category: "VFD",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "6–18",
    assessmentEligible: true,
  },
  {
    id: "vfd-ground-fault-cable-v3",
    engineVersion: "v3",
    title: "VFD Ground Fault — Damaged Cable",
    category: "VFD",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "6–18",
    assessmentEligible: true,
  },
  {
    id: "vfd-cooling-fan-seized-v3",
    engineVersion: "v3",
    title: "VFD Cooling Fan Seized",
    category: "VFD",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "4–12",
    assessmentEligible: true,
  },
  {
    id: "vfd-input-phase-loss-v3",
    engineVersion: "v3",
    title: "VFD Input Phase Loss",
    category: "VFD",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "5–15",
    assessmentEligible: true,
  },
  {
    id: "blown-control-fuse",
    engineVersion: "v3",
    title: "Blown Control Fuse — MCC",
    category: "Power Distribution",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "6–20",
    assessmentEligible: true,
  },
  {
    id: "failed-safety-relay",
    engineVersion: "v3",
    title: "Failed Safety Relay",
    category: "Safety Circuit",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "7–25",
    assessmentEligible: true,
  },
  {
    id: "plc-io-fault-v3",
    engineVersion: "v3",
    title: "PLC I/O Signal Wire Fault",
    category: "PLC",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "8–20",
    assessmentEligible: true,
  },
  {
    id: "motor-overload-trip-v3",
    engineVersion: "v3",
    title: "Motor Overload Trip",
    category: "Motor Control",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "8–22",
    assessmentEligible: true,
  },
  {
    id: "comm-loss-v3",
    engineVersion: "v3",
    title: "EtherNet/IP Communication Loss",
    category: "Networking",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "6–18",
    assessmentEligible: true,
  },
  {
    id: "intermittent-ground-fault-v3",
    engineVersion: "v3",
    title: "Intermittent Ground Fault",
    category: "Power Distribution",
    difficultyLabel: "Adaptive",
    estimatedMinutes: "10–30",
    assessmentEligible: true,
  },
];

const registryById = new Map(SCENARIO_REGISTRY.map((e) => [e.id, e]));

export function normalizeAssessmentScenarioId(rawId: string): string {
  const trimmed = rawId.trim();
  return ASSESSMENT_SCENARIO_LEGACY_ALIASES[trimmed] ?? trimmed;
}

export function getScenarioRegistryEntry(
  rawId: string
): ScenarioRegistryEntry | undefined {
  const id = normalizeAssessmentScenarioId(rawId);
  return registryById.get(id);
}

export function isAssessmentScenarioId(rawId: string): boolean {
  const entry = getScenarioRegistryEntry(rawId);
  return entry?.assessmentEligible === true;
}

/** Scenarios admins can assign to new assessments */
export function listAssessmentScenarios(): ScenarioRegistryEntry[] {
  return SCENARIO_REGISTRY.filter((e) => e.assessmentEligible);
}

export function listAssessmentScenariosByVersion(
  version: ScenarioEngineVersion
): ScenarioRegistryEntry[] {
  return listAssessmentScenarios().filter((e) => e.engineVersion === version);
}

export function validateAssessmentScenarioIds(rawIds: string[]): {
  valid: boolean;
  normalized: string[];
  invalid: string[];
} {
  const normalized: string[] = [];
  const invalid: string[] = [];
  for (const raw of rawIds) {
    const id = normalizeAssessmentScenarioId(raw);
    if (isAssessmentScenarioId(id)) {
      normalized.push(id);
    } else {
      invalid.push(raw);
    }
  }
  return { valid: invalid.length === 0, normalized, invalid };
}
