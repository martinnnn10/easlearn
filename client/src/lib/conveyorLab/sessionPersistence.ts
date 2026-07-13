/**
 * Client-side Conveyor lab session persistence (A6) — localStorage only.
 */
import type {
  DiagnosticEvent,
  FaultId,
  FlagshipLabScore,
  LabMode,
  MeterMode,
  MeterProbeId,
  MobilePanel,
} from "./types";
import type { ConveyorLabAttribution, ConveyorFaultId } from "@shared/conveyorLabAttribution";
import { buildAttributionFingerprint } from "@shared/conveyorLabAttribution";

const STORAGE_KEY = "eas-conveyor-lab-session-v1";
const MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

export interface ConveyorLabSession {
  version: 1;
  savedAt: number;
  fingerprint: string;
  attribution: ConveyorLabAttribution;
  faultScope?: ConveyorFaultId[];
  mode: LabMode;
  activeFault: FaultId;
  elapsedSec: number;
  guidedStep: number;
  hintsUsed: number;
  rootCauseGuess: string;
  events: DiagnosticEvent[];
  discoveredEvidence: string[];
  safetyViolations: string[];
  selectedProbe: MeterProbeId;
  meterMode: MeterMode;
  meterReading: string | null;
  mobilePanel: MobilePanel;
  debriefOpen: boolean;
  submittedScore: FlagshipLabScore | null;
  operatorInputs: Record<string, boolean>;
  showHint: boolean;
  isRunning: boolean;
}

export function loadConveyorLabSession(): ConveyorLabSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConveyorLabSession;
    if (parsed.version !== 1) return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveConveyorLabSession(session: Omit<ConveyorLabSession, "version" | "savedAt" | "fingerprint"> & {
  attribution: ConveyorLabAttribution;
}): void {
  if (typeof window === "undefined") return;
  try {
    const payload: ConveyorLabSession = {
      version: 1,
      savedAt: Date.now(),
      fingerprint: buildAttributionFingerprint(session.attribution),
      ...session,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or private mode — ignore
  }
}

export function clearConveyorLabSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
