/**
 * Client-side PowerFlex lab session persistence (A8.1) — localStorage only.
 */
import type {
  DiagnosticEvent,
  DiagnosticStep,
  FaultId,
  LabMode,
  LabScore,
  MobilePanel,
} from "./types";
import type { PowerFlexLabAttribution, PowerFlexFaultId } from "@shared/powerflexLabAttribution";
import { buildPowerFlexAttributionFingerprint } from "@shared/powerflexLabAttribution";

const STORAGE_KEY = "eas-powerflex-lab-session-v1";
const MAX_AGE_MS = 4 * 60 * 60 * 1000;

export interface PowerFlexLabSession {
  version: 1;
  savedAt: number;
  fingerprint: string;
  attribution: PowerFlexLabAttribution;
  faultScope?: PowerFlexFaultId[];
  mode: LabMode;
  activeFault: FaultId;
  elapsedSec: number;
  guidedStep: number;
  hintsUsed: number;
  rootCauseGuess: string;
  events: DiagnosticEvent[];
  discoveredEvidence: string[];
  recordedFirstStep: DiagnosticStep | null;
  mobilePanel: MobilePanel;
  debriefOpen: boolean;
  submittedScore: LabScore | null;
  showHint: boolean;
  driveRunning: boolean;
  referenceOpen: boolean;
}

export function loadPowerFlexLabSession(): PowerFlexLabSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PowerFlexLabSession;
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

export function savePowerFlexLabSession(
  session: Omit<PowerFlexLabSession, "version" | "savedAt" | "fingerprint"> & {
    attribution: PowerFlexLabAttribution;
  }
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PowerFlexLabSession = {
      version: 1,
      savedAt: Date.now(),
      fingerprint: buildPowerFlexAttributionFingerprint(session.attribution),
      ...session,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or private mode — ignore
  }
}
