import { describe, it, expect } from "vitest";
import { scheduleNext, INITIAL_REVIEW_STATE, MASTERY_INTERVAL_DAYS, isDue } from "./spacedRepetition";

const DAY = 24 * 60 * 60 * 1000;

describe("spacedRepetition SM-2-lite", () => {
  it("first correct review schedules 1 day out", () => {
    const r = scheduleNext(INITIAL_REVIEW_STATE, { correct: true }, 0);
    expect(r.state.reps).toBe(1);
    expect(r.state.intervalDays).toBe(1);
    expect(r.dueAt).toBe(1 * DAY);
    expect(r.mastered).toBe(false);
  });

  it("second correct review schedules 6 days out", () => {
    const r1 = scheduleNext(INITIAL_REVIEW_STATE, { correct: true }, 0);
    const r2 = scheduleNext(r1.state, { correct: true }, 0);
    expect(r2.state.reps).toBe(2);
    expect(r2.state.intervalDays).toBe(6);
  });

  it("intervals grow by ease after the second rep", () => {
    let s = INITIAL_REVIEW_STATE;
    s = scheduleNext(s, { correct: true }, 0).state; // 1
    s = scheduleNext(s, { correct: true }, 0).state; // 6
    const r3 = scheduleNext(s, { correct: true }, 0);
    expect(r3.state.intervalDays).toBeGreaterThan(6); // ~6 * ease
  });

  it("a wrong answer resets reps, schedules tomorrow, and records a lapse", () => {
    let s = INITIAL_REVIEW_STATE;
    s = scheduleNext(s, { correct: true }, 0).state;
    s = scheduleNext(s, { correct: true }, 0).state;
    const lapse = scheduleNext(s, { correct: false }, 0);
    expect(lapse.state.reps).toBe(0);
    expect(lapse.state.intervalDays).toBe(1);
    expect(lapse.state.lapses).toBe(1);
    expect(lapse.state.ease).toBeLessThan(s.ease);
  });

  it("ease never drops below 1.3", () => {
    let s = INITIAL_REVIEW_STATE;
    for (let i = 0; i < 20; i++) s = scheduleNext(s, { correct: false }, 0).state;
    expect(s.ease).toBeGreaterThanOrEqual(1.3);
  });

  it("reaches mastery after enough successful reps", () => {
    let s = INITIAL_REVIEW_STATE;
    let mastered = false;
    for (let i = 0; i < 8 && !mastered; i++) {
      const r = scheduleNext(s, { correct: true, fast: true }, 0);
      s = r.state;
      mastered = r.mastered;
    }
    expect(mastered).toBe(true);
    expect(s.intervalDays).toBeGreaterThanOrEqual(MASTERY_INTERVAL_DAYS);
  });

  it("isDue treats null/past as due and future as not due", () => {
    expect(isDue(null, 1000)).toBe(true);
    expect(isDue(500, 1000)).toBe(true);
    expect(isDue(2000, 1000)).toBe(false);
  });
});
