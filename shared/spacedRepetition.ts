/**
 * Spaced Repetition — the retention keystone of the Mission learning model.
 *
 * SM-2-lite: an SuperMemo-2 variant tuned for binary "did they get it right"
 * grading (a knowledge check is correct or not), with an optional speed bonus.
 * Concepts that are missed resurface tomorrow; concepts answered correctly
 * stretch out (1d → 6d → ×ease) until they're durably mastered.
 *
 * Pure + deterministic so it's unit-testable and identical on client and server.
 */

export interface ReviewState {
  /** Easiness factor (SM-2), floor 1.3. Higher = stretches faster. */
  ease: number;
  /** Current interval in days. */
  intervalDays: number;
  /** Consecutive correct reviews. */
  reps: number;
  /** Times the concept was forgotten (reset reps). */
  lapses: number;
}

export const INITIAL_REVIEW_STATE: ReviewState = {
  ease: 2.5,
  intervalDays: 0,
  reps: 0,
  lapses: 0,
};

/** A learner is "mastered" on a concept once it survives to a long interval. */
export const MASTERY_INTERVAL_DAYS = 21;

export interface ReviewOutcome {
  correct: boolean;
  /** Optional: answered quickly + correctly → quality 5; else 4. */
  fast?: boolean;
}

/**
 * Advance a concept's schedule after a review.
 * Returns the next state + the next due timestamp (ms epoch).
 */
export function scheduleNext(
  state: ReviewState,
  outcome: ReviewOutcome,
  now: number = Date.now(),
): { state: ReviewState; dueAt: number; mastered: boolean } {
  // Map binary correctness to an SM-2 quality score.
  const q = outcome.correct ? (outcome.fast ? 5 : 4) : 2;

  let { ease, intervalDays, reps, lapses } = state;

  if (q < 3) {
    // Lapse: forgot it. Reset reps, see it again tomorrow, nudge ease down.
    reps = 0;
    lapses += 1;
    intervalDays = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    if (reps === 1) intervalDays = 1;
    else if (reps === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * ease);
    // SM-2 ease update.
    ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  }

  const dueAt = now + intervalDays * 24 * 60 * 60 * 1000;
  const mastered = intervalDays >= MASTERY_INTERVAL_DAYS;
  return { state: { ease, intervalDays, reps, lapses }, dueAt, mastered };
}

/** Convenience: is this concept due for review at `now`? */
export function isDue(dueAt: number | null | undefined, now: number = Date.now()): boolean {
  return dueAt == null || dueAt <= now;
}
