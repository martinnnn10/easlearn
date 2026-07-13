/**
 * Lesson ↔ simulator scenario linking (S-01 / S-02).
 *
 * DB `scenarios.id` and `course_modules.id` share numeric ranges (e.g. 30005).
 * Use stable string slugs (`db-30005`) for lesson links; map to in-app simulator IDs separately.
 */

/** Prefix for database-backed scenario rows — never collides with module IDs when used as strings. */
export const DB_SCENARIO_SLUG_PREFIX = "db-";

export function dbScenarioSlug(scenarioRowId: number): string {
  return `${DB_SCENARIO_SLUG_PREFIX}${scenarioRowId}`;
}

export function parseDbScenarioSlug(slug: string): number | null {
  const match = /^db-(\d+)$/.exec(slug.trim());
  if (!match) return null;
  const id = Number.parseInt(match[1], 10);
  return Number.isFinite(id) ? id : null;
}

/** Short URL aliases → simulator engine scenario id */
export const SCENARIO_URL_ALIASES: Record<string, string> = {
  "blown-fuse": "blown-control-fuse",
  "failed-relay": "failed-safety-relay",
  "vfd-overcurrent": "vfd-overcurrent-ramp-v3",
  "vfd-undervoltage": "vfd-dc-bus-undervoltage-v3",
  "vfd-ground-fault": "vfd-ground-fault-cable-v3",
  "multi-fault": "vfd-conveyor-multifault-v3",
  "vfd-cooling-fan": "vfd-cooling-fan-seized-v3",
  "vfd-phase-loss": "vfd-input-phase-loss-v3",
  "plc-io-fault": "plc-io-fault-v3",
  "motor-overload": "motor-overload-trip-v3",
  "comm-loss": "comm-loss-v3",
  "intermittent-ground": "intermittent-ground-fault-v3",
  "conveyor-estop": "conveyor-estop",
  "conveyor-estop-v2": "conveyor-estop-v2",
};

/**
 * Maps published DB scenario row IDs to playable in-app simulator scenario IDs.
 * Only includes scenarios that exist in Simulator.tsx (V1/V2/V3 bundles).
 */
export const DB_SCENARIO_ID_TO_SIMULATOR_ID: Record<number, string> = {
  1: "vfd-ramp",
  2: "plc-io-fault-v3",
  3: "vfd-conveyor-multifault-v3",
  4: "failed-safety-relay",
  5: "vfd-overcurrent-ramp-v3",
  6: "vfd-dc-bus-undervoltage-v3",
  7: "vfd-ramp",
  8: "vfd-cooling-fan-seized-v3",
  9: "comm-loss-v3",
  11: "vfd-overcurrent-ramp-v3",
  12: "blown-control-fuse",
  30002: "motor-overload-trip-v3",
  30005: "plc-io-fault-v3",
  30008: "comm-loss-v3",
};

/** All scenario ids loaded by the Simulator page (V3 + V2 + V1). */
export const SIMULATOR_SCENARIO_IDS = new Set<string>([
  "vfd-conveyor-multifault-v3",
  "vfd-overcurrent-ramp-v3",
  "vfd-dc-bus-undervoltage-v3",
  "vfd-ground-fault-cable-v3",
  "vfd-cooling-fan-seized-v3",
  "vfd-input-phase-loss-v3",
  "blown-control-fuse",
  "failed-safety-relay",
  "plc-io-fault-v3",
  "motor-overload-trip-v3",
  "comm-loss-v3",
  "intermittent-ground-fault-v3",
  "conveyor-estop-v2",
  "conveyor-estop",
  "24vdc-loss",
  "vfd-ramp",
  "starter-chatter",
  "case-packer-jam",
  "palletizer-safety-gate",
  "photoeye-false-trigger",
]);

/**
 * Resolve a lesson link or URL ?scenario= value to a simulator engine scenario id.
 * Returns null when there is no playable mapping (caller should use generic /simulator).
 */
export function resolveSimulatorScenarioId(
  slugOrLegacyId?: string | null,
  legacyNumericId?: number | null
): string | null {
  const candidates: string[] = [];
  if (slugOrLegacyId?.trim()) {
    candidates.push(slugOrLegacyId.trim());
  }
  if (legacyNumericId != null && Number.isFinite(legacyNumericId)) {
    candidates.push(dbScenarioSlug(legacyNumericId));
  }

  for (const raw of candidates) {
    if (SIMULATOR_SCENARIO_IDS.has(raw)) {
      return raw;
    }

    const alias = SCENARIO_URL_ALIASES[raw];
    if (alias && SIMULATOR_SCENARIO_IDS.has(alias)) {
      return alias;
    }

    const dbId = parseDbScenarioSlug(raw);
    if (dbId != null) {
      const mapped = DB_SCENARIO_ID_TO_SIMULATOR_ID[dbId];
      if (mapped && SIMULATOR_SCENARIO_IDS.has(mapped)) {
        return mapped;
      }
    }
  }

  return null;
}

/** Stable slug stored on course_lessons / scenarios for a DB row id. */
export function resolveLessonScenarioSlug(
  linkedScenarioSlug: string | null | undefined,
  linkedScenarioId: number | null | undefined
): string | null {
  if (linkedScenarioSlug?.trim()) {
    return linkedScenarioSlug.trim();
  }
  if (linkedScenarioId != null && Number.isFinite(linkedScenarioId)) {
    return dbScenarioSlug(linkedScenarioId);
  }
  return null;
}
