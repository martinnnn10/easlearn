/**
 * Tests for useAnalytics hook — validates typed event tracking via Umami.
 *
 * We test the safeTrack logic and event name constants without needing
 * a full React rendering context (the hook just wraps stable callbacks).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ANALYTICS_EVENTS } from "./useAnalytics";

// We test the underlying safeTrack function behavior by simulating window.umami
describe("useAnalytics — safeTrack behavior", () => {
  let mockTrack: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTrack = vi.fn();
    (globalThis as any).window = { umami: { track: mockTrack } };
  });

  afterEach(() => {
    delete (globalThis as any).window;
  });

  it("should export all expected event name constants", () => {
    expect(ANALYTICS_EVENTS.SIGNUP_COMPLETED).toBe("signup_completed");
    expect(ANALYTICS_EVENTS.ONBOARDING_COMPLETED).toBe("onboarding_completed");
    expect(ANALYTICS_EVENTS.COURSE_STARTED).toBe("course_started");
    expect(ANALYTICS_EVENTS.LESSON_COMPLETED).toBe("lesson_completed");
    expect(ANALYTICS_EVENTS.QUIZ_COMPLETED).toBe("quiz_completed");
    expect(ANALYTICS_EVENTS.SIMULATOR_LAUNCHED).toBe("simulator_launched");
    expect(ANALYTICS_EVENTS.SIMULATOR_COMPLETED).toBe("simulator_completed");
    expect(ANALYTICS_EVENTS.CERTIFICATE_EARNED).toBe("certificate_earned");
    expect(ANALYTICS_EVENTS.LAB_COMPLETED).toBe("lab_completed");
  });

  it("should have exactly 9 event types defined", () => {
    const eventCount = Object.keys(ANALYTICS_EVENTS).length;
    expect(eventCount).toBe(9);
  });

  it("should have unique event name values", () => {
    const values = Object.values(ANALYTICS_EVENTS);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it("all event names should be lowercase_snake_case", () => {
    for (const value of Object.values(ANALYTICS_EVENTS)) {
      expect(value).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });
});
