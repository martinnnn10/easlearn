/**
 * Conveyor lab URL attribution — hub / lesson / ILU deep links (A6).
 */

import { getHubById, type HubId } from "./hubRegistry";

export type ConveyorLabMode = "learn" | "practice" | "guided";

export type ConveyorFaultId =
  | "normal"
  | "estop_open"
  | "guard_open"
  | "stop_stuck"
  | "photoeye_stuck_on"
  | "photoeye_jam"
  | "overload_tripped"
  | "output_on_motor_dead";

const VALID_MODES: ConveyorLabMode[] = ["learn", "practice", "guided"];

const VALID_FAULT_IDS: ConveyorFaultId[] = [
  "normal",
  "estop_open",
  "guard_open",
  "stop_stuck",
  "photoeye_stuck_on",
  "photoeye_jam",
  "overload_tripped",
  "output_on_motor_dead",
];

export interface ConveyorLabAttribution {
  hub?: string;
  module?: string;
  lesson?: string;
  ilu?: string;
  mode?: ConveyorLabMode;
  faultScope?: ConveyorFaultId[];
  /** Homepage CTA — practice breakdown call with mission briefing */
  entry?: "home";
}

export function isValidLabMode(value: string | null | undefined): ConveyorLabMode | undefined {
  if (!value) return undefined;
  return VALID_MODES.includes(value as ConveyorLabMode) ? (value as ConveyorLabMode) : undefined;
}

export function parseFaultScope(value: string | null | undefined): ConveyorFaultId[] | undefined {
  if (!value?.trim()) return undefined;
  const ids = value
    .split(",")
    .map((s) => s.trim())
    .filter((id): id is ConveyorFaultId =>
      VALID_FAULT_IDS.includes(id as ConveyorFaultId) && id !== "normal"
    );
  return ids.length > 0 ? ids : undefined;
}

export function parseConveyorLabSearchParams(search: string): ConveyorLabAttribution {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const mode = isValidLabMode(params.get("mode"));
  const faultScope = parseFaultScope(params.get("faultScope"));

  return {
    hub: params.get("hub") ?? undefined,
    module: params.get("module") ?? undefined,
    lesson: params.get("lesson") ?? undefined,
    ilu: params.get("ilu") ?? undefined,
    mode,
    faultScope,
    entry: params.get("entry") === "home" ? "home" : undefined,
  };
}

export function buildAttributionFingerprint(attr: ConveyorLabAttribution): string {
  return [attr.hub ?? "", attr.module ?? "", attr.lesson ?? "", attr.ilu ?? ""].join("|");
}

export function hasAttributionParams(attr: ConveyorLabAttribution): boolean {
  return Boolean(attr.hub || attr.module || attr.lesson || attr.ilu || attr.mode || attr.faultScope?.length);
}

/** Anonymous homepage entry — practice breakdown, briefing first */
export function isHomepageLabEntry(attr: ConveyorLabAttribution): boolean {
  return attr.entry === "home" && !attr.hub && !attr.module && !attr.lesson;
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

export function pickInitialFault(
  mode: ConveyorLabMode,
  faultScope?: ConveyorFaultId[]
): ConveyorFaultId {
  const scoped = faultScope?.filter((id) => id !== "normal") ?? [];
  if (mode === "practice" || mode === "guided") {
    if (scoped.length === 0) return pickRandomFromCatalog();
    return scoped[Math.floor(Math.random() * scoped.length)];
  }
  if (scoped.length === 1) return scoped[0];
  return "normal";
}

export function pickRandomFromScope(faultScope?: ConveyorFaultId[]): ConveyorFaultId {
  const scoped = faultScope?.filter((id) => id !== "normal") ?? [];
  if (scoped.length === 0) return pickRandomFromCatalog();
  return scoped[Math.floor(Math.random() * scoped.length)];
}

export function pickRandomFromCatalog(): ConveyorFaultId {
  const faults: ConveyorFaultId[] = [
    "estop_open",
    "guard_open",
    "stop_stuck",
    "photoeye_stuck_on",
    "photoeye_jam",
    "overload_tripped",
    "output_on_motor_dead",
  ];
  return faults[Math.floor(Math.random() * faults.length)];
}

export function isFaultInScope(faultId: ConveyorFaultId, faultScope?: ConveyorFaultId[]): boolean {
  if (faultId === "normal") return true;
  if (!faultScope?.length) return true;
  return faultScope.includes(faultId);
}

export function getScopedFaultCatalog(faultScope?: ConveyorFaultId[]): ConveyorFaultId[] {
  const all: ConveyorFaultId[] = [
    "estop_open",
    "guard_open",
    "stop_stuck",
    "photoeye_stuck_on",
    "photoeye_jam",
    "overload_tripped",
    "output_on_motor_dead",
  ];
  if (!faultScope?.length) return all;
  return all.filter((id) => faultScope.includes(id));
}
