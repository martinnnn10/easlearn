/**
 * Manufacturing Competency Graph — the core IP.
 *
 * Per (technician, competency) we don't store "completed a course"; we derive a
 * living capability profile from *demonstrated* performance: confidence, attempts,
 * time-to-solve, last-demonstrated, learning velocity, and decay. "Demonstrated,
 * not declared."
 *
 * Pure types + logic here so they're testable and shared by client and server.
 */

export type CompetencyLevel = "not_demonstrated" | "developing" | "competent" | "proficient" | "expert";
export type DecayStatus = "fresh" | "stale" | "decayed";

export interface CompetencyCell {
  domain: string;
  label: string;
  /** Demonstrated confidence 0-100 (deterministic methodology — never AI-guessed). */
  confidence: number;
  /** Most recent demonstration's score (recency signal). */
  recentConfidence: number;
  level: CompetencyLevel;
  attempts: number;
  avgTimeSeconds: number | null;
  bestTimeSeconds: number | null;
  /** ISO date of last demonstration, or null. */
  lastDemonstrated: string | null;
  decay: DecayStatus;
  daysSince: number | null;
  /** Improvement trend: positive = getting better. */
  velocity: number;
  /** Human ground truth: a manager has attested this competency. */
  managerValidated: boolean;
}

/** Decay thresholds (days). Industrial competency degrades without practice. */
export const DECAY_STALE_DAYS = 180;
export const DECAY_DECAYED_DAYS = 365;

export function decayStatus(daysSince: number | null): DecayStatus {
  if (daysSince == null) return "decayed";
  if (daysSince <= DECAY_STALE_DAYS) return "fresh";
  if (daysSince <= DECAY_DECAYED_DAYS) return "stale";
  return "decayed";
}

export function competencyLevel(confidence: number, attempts: number): CompetencyLevel {
  if (attempts === 0) return "not_demonstrated";
  if (confidence >= 85 && attempts >= 3) return "expert";
  if (confidence >= 70) return "proficient";
  if (confidence >= 50) return "competent";
  return "developing";
}

export const LEVEL_LABEL: Record<CompetencyLevel, string> = {
  not_demonstrated: "Not demonstrated",
  developing: "Developing",
  competent: "Competent",
  proficient: "Proficient",
  expert: "Expert",
};

/**
 * Learning velocity: difference between the average of the most-recent half of
 * attempts and the earliest half. Positive = improving. Needs ≥2 attempts.
 */
export function learningVelocity(scoresChrono: number[]): number {
  if (scoresChrono.length < 2) return 0;
  const mid = Math.floor(scoresChrono.length / 2);
  const early = scoresChrono.slice(0, mid);
  const recent = scoresChrono.slice(mid);
  const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  return Math.round(avg(recent) - avg(early));
}

/** Is this technician promotion-ready overall? (expert/proficient breadth + freshness) */
export function isPromotionReady(cells: CompetencyCell[]): boolean {
  const strong = cells.filter(c => (c.level === "expert" || c.level === "proficient") && c.decay !== "decayed");
  const anyExpert = cells.some(c => c.level === "expert");
  return anyExpert && strong.length >= 3;
}
