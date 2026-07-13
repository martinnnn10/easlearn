import type { FaultId } from "./types";

const STORAGE_KEY = "eas_conveyor_lab_personal_bests";

export interface PersonalBestRecord {
  faultId: FaultId;
  bestTimeSeconds: number;
  bestScore: number;
  attempts: number;
  consecutiveCorrect: number;
  lastAttemptDate: string; // ISO string
}

export interface PersonalBestStore {
  records: Record<string, PersonalBestRecord>;
  totalAttempts: number;
  longestStreak: number;
  currentStreak: number;
}

function getStore(): PersonalBestStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore parse errors
  }
  return { records: {}, totalAttempts: 0, longestStreak: 0, currentStreak: 0 };
}

function saveStore(store: PersonalBestStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Record a completed attempt and return whether it's a new personal best.
 */
export function recordAttempt(
  faultId: FaultId,
  timeSeconds: number,
  scorePercent: number,
  rootCauseCorrect: boolean
): { isNewBestTime: boolean; isNewBestScore: boolean; previousBestTime: number | null } {
  const store = getStore();
  const existing = store.records[faultId];

  const previousBestTime = existing?.bestTimeSeconds ?? null;
  let isNewBestTime = false;
  let isNewBestScore = false;

  if (!existing) {
    store.records[faultId] = {
      faultId,
      bestTimeSeconds: timeSeconds,
      bestScore: scorePercent,
      attempts: 1,
      consecutiveCorrect: rootCauseCorrect ? 1 : 0,
      lastAttemptDate: new Date().toISOString(),
    };
    isNewBestTime = true;
    isNewBestScore = true;
  } else {
    existing.attempts += 1;
    existing.lastAttemptDate = new Date().toISOString();

    if (rootCauseCorrect && timeSeconds < existing.bestTimeSeconds) {
      existing.bestTimeSeconds = timeSeconds;
      isNewBestTime = true;
    }
    if (scorePercent > existing.bestScore) {
      existing.bestScore = scorePercent;
      isNewBestScore = true;
    }
    if (rootCauseCorrect) {
      existing.consecutiveCorrect += 1;
    } else {
      existing.consecutiveCorrect = 0;
    }
  }

  // Update global stats
  store.totalAttempts += 1;
  if (rootCauseCorrect) {
    store.currentStreak += 1;
    if (store.currentStreak > store.longestStreak) {
      store.longestStreak = store.currentStreak;
    }
  } else {
    store.currentStreak = 0;
  }

  saveStore(store);
  return { isNewBestTime, isNewBestScore, previousBestTime };
}

/**
 * Get all personal best records for display.
 */
export function getPersonalBests(): PersonalBestStore {
  return getStore();
}

/**
 * Get a single fault's personal best.
 */
export function getFaultPersonalBest(faultId: FaultId): PersonalBestRecord | null {
  const store = getStore();
  return store.records[faultId] ?? null;
}

/**
 * Reset all personal bests (for testing).
 */
export function resetPersonalBests(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
