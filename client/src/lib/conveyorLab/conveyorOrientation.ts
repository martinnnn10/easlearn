/**
 * Conveyor lab first-time experience — briefing, coachmarks, session metrics.
 */

export const CONVEYOR_BRIEFING_COMPLETE_KEY = "eas-conveyor-lab-briefing-complete-v1";
export const CONVEYOR_GUIDE_COMPLETE_KEY = "eas-conveyor-lab-first-time-guide-v1";
export const CONVEYOR_FTE_METRICS_KEY = "eas-conveyor-fte-metrics-v1";

export type ConveyorGuideStepId =
  | "operator-report"
  | "ladder-logic"
  | "io-panel"
  | "multimeter"
  | "submit-diagnosis";

export const CONVEYOR_GUIDE_STEPS: {
  id: ConveyorGuideStepId;
  title: string;
  body: string;
  mobilePanel?: "machine" | "ladder" | "diagnostics" | "actions";
}[] = [
  {
    id: "operator-report",
    title: "Operator report",
    body: "Start with what the operator saw on the floor — not the fault name.",
    mobilePanel: "machine",
  },
  {
    id: "ladder-logic",
    title: "Ladder logic",
    body: "Trace permissives and outputs on the live ladder before forcing anything.",
    mobilePanel: "ladder",
  },
  {
    id: "io-panel",
    title: "I/O panel",
    body: "Compare PLC input LEDs to field devices — I/O tells you what the CPU sees.",
    mobilePanel: "diagnostics",
  },
  {
    id: "multimeter",
    title: "Multimeter",
    body: "Verify field wiring with continuity and voltage at the probe points.",
    mobilePanel: "diagnostics",
  },
  {
    id: "submit-diagnosis",
    title: "Submit diagnosis",
    body: "Pick root cause only after evidence — same as closing a maintenance ticket.",
    mobilePanel: "actions",
  },
];

export interface ConveyorFteMetrics {
  entryAt: number;
  briefingDismissAt?: number;
  firstActionAt?: number;
  firstDiagnosisAt?: number;
  clicksBeforeTroubleshooting: number;
  guideCompleted: boolean;
  guideSkipped: boolean;
}

function readFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === "1";
}

function writeFlag(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, "1");
}

export function isBriefingComplete(): boolean {
  return readFlag(CONVEYOR_BRIEFING_COMPLETE_KEY);
}

export function markBriefingComplete(): void {
  writeFlag(CONVEYOR_BRIEFING_COMPLETE_KEY);
}

export function isGuideComplete(): boolean {
  return readFlag(CONVEYOR_GUIDE_COMPLETE_KEY);
}

export function markGuideComplete(): void {
  writeFlag(CONVEYOR_GUIDE_COMPLETE_KEY);
}

export function loadFteMetrics(): ConveyorFteMetrics | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CONVEYOR_FTE_METRICS_KEY);
    return raw ? (JSON.parse(raw) as ConveyorFteMetrics) : null;
  } catch {
    return null;
  }
}

export function saveFteMetrics(metrics: ConveyorFteMetrics): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CONVEYOR_FTE_METRICS_KEY, JSON.stringify(metrics));
}

export function startFteSession(): ConveyorFteMetrics {
  const existing = loadFteMetrics();
  if (existing) return existing;
  const metrics: ConveyorFteMetrics = {
    entryAt: Date.now(),
    clicksBeforeTroubleshooting: 0,
    guideCompleted: false,
    guideSkipped: false,
  };
  saveFteMetrics(metrics);
  return metrics;
}

export function patchFteMetrics(patch: Partial<ConveyorFteMetrics>): ConveyorFteMetrics {
  const base = loadFteMetrics() ?? startFteSession();
  const next = { ...base, ...patch };
  saveFteMetrics(next);
  return next;
}

export function recordPreTroubleshootingClick(): void {
  const m = loadFteMetrics();
  if (!m || m.briefingDismissAt) return;
  patchFteMetrics({ clicksBeforeTroubleshooting: m.clicksBeforeTroubleshooting + 1 });
}

export function recordBriefingDismissed(): void {
  patchFteMetrics({ briefingDismissAt: Date.now() });
}

export function recordFirstAction(): void {
  const m = loadFteMetrics();
  if (!m || m.firstActionAt) return;
  patchFteMetrics({ firstActionAt: Date.now() });
}

export function recordFirstDiagnosisAttempt(): void {
  const m = loadFteMetrics();
  if (!m || m.firstDiagnosisAt) return;
  patchFteMetrics({ firstDiagnosisAt: Date.now() });
}

export function shouldShowBriefing(options: {
  homeEntry: boolean;
  restoredSession: boolean;
  midSession: boolean;
}): boolean {
  if (isBriefingComplete()) return false;
  if (options.restoredSession || options.midSession) return false;
  return options.homeEntry || !isGuideComplete();
}

export function shouldShowGuide(options: { briefingOpen: boolean; restoredSession: boolean }): boolean {
  if (isGuideComplete()) return false;
  if (options.briefingOpen || options.restoredSession) return false;
  return true;
}
