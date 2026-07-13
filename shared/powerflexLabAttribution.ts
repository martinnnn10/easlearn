/**
 * PowerFlex Diagnostic Lab URL attribution (A8).
 */

import { getHubById, type HubId } from "./hubRegistry";

export type PowerFlexLabMode = "learn" | "practice" | "guided";

export type PowerFlexFaultId =
  | "normal"
  | "overcurrent"
  | "dc_bus_undervoltage"
  | "cooling_fan_seized";

const VALID_MODES: PowerFlexLabMode[] = ["learn", "practice", "guided"];

const VALID_FAULT_IDS: PowerFlexFaultId[] = [
  "normal",
  "overcurrent",
  "dc_bus_undervoltage",
  "cooling_fan_seized",
];

export interface PowerFlexLabAttribution {
  hub?: string;
  module?: string;
  lesson?: string;
  ilu?: string;
  mode?: PowerFlexLabMode;
  faultScope?: PowerFlexFaultId[];
}

export function isValidPowerFlexLabMode(value: string | null | undefined): PowerFlexLabMode | undefined {
  if (!value) return undefined;
  return VALID_MODES.includes(value as PowerFlexLabMode) ? (value as PowerFlexLabMode) : undefined;
}

export function parsePowerFlexFaultScope(value: string | null | undefined): PowerFlexFaultId[] | undefined {
  if (!value?.trim()) return undefined;
  const ids = value
    .split(",")
    .map((s) => s.trim())
    .filter((id): id is PowerFlexFaultId =>
      VALID_FAULT_IDS.includes(id as PowerFlexFaultId) && id !== "normal"
    );
  return ids.length > 0 ? ids : undefined;
}

export function parsePowerFlexLabSearchParams(search: string): PowerFlexLabAttribution {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    hub: params.get("hub") ?? undefined,
    module: params.get("module") ?? undefined,
    lesson: params.get("lesson") ?? undefined,
    ilu: params.get("ilu") ?? undefined,
    mode: isValidPowerFlexLabMode(params.get("mode")),
    faultScope: parsePowerFlexFaultScope(params.get("faultScope")),
  };
}

export function buildPowerFlexAttributionFingerprint(attr: PowerFlexLabAttribution): string {
  return [attr.hub ?? "", attr.module ?? "", attr.lesson ?? "", attr.ilu ?? ""].join("|");
}

export function getHubBackHref(hubId: string): string | null {
  const hub = getHubById(hubId as HubId);
  return hub?.route ?? null;
}

export function getLessonBackHref(moduleSlug: string, lessonSlug?: string): string {
  return lessonSlug
    ? `/courses/${moduleSlug}/${lessonSlug}`
    : `/courses/${moduleSlug}`;
}

const ALL_FAULTS: PowerFlexFaultId[] = [
  "overcurrent",
  "dc_bus_undervoltage",
  "cooling_fan_seized",
];

export function pickInitialPowerFlexFault(
  mode: PowerFlexLabMode,
  faultScope?: PowerFlexFaultId[]
): PowerFlexFaultId {
  const scoped = faultScope?.filter((id) => id !== "normal") ?? [];
  if (mode === "practice" || mode === "guided") {
    const pool = scoped.length > 0 ? scoped : ALL_FAULTS;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (scoped.length === 1) return scoped[0];
  return "normal";
}

export function pickRandomPowerFlexFromScope(faultScope?: PowerFlexFaultId[]): PowerFlexFaultId {
  const scoped = faultScope?.filter((id) => id !== "normal") ?? [];
  const pool = scoped.length > 0 ? scoped : ALL_FAULTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function isPowerFlexFaultInScope(
  faultId: PowerFlexFaultId,
  faultScope?: PowerFlexFaultId[]
): boolean {
  if (faultId === "normal") return true;
  if (!faultScope?.length) return true;
  return faultScope.includes(faultId);
}

export function getScopedPowerFlexFaultCatalog(faultScope?: PowerFlexFaultId[]): PowerFlexFaultId[] {
  if (!faultScope?.length) return ALL_FAULTS;
  return ALL_FAULTS.filter((id) => faultScope.includes(id));
}
