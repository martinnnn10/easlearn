/**
 * useAnalytics — typed wrapper around Umami's window.umami.track() API.
 *
 * The Umami script is already loaded globally via client/index.html.
 * This hook provides a type-safe `track` function for custom events
 * and a set of pre-defined event helpers for key user actions.
 *
 * Usage:
 *   const { track, trackCourseStarted, trackLessonCompleted, ... } = useAnalytics();
 *   track("custom_event", { key: "value" });
 *   trackLessonCompleted({ moduleSlug: "plc-basics", lessonSlug: "intro" });
 */
import { useCallback, useMemo } from "react";

// ─── Event Name Constants ────────────────────────────────────────────────────

export const ANALYTICS_EVENTS = {
  SIGNUP_COMPLETED: "signup_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  COURSE_STARTED: "course_started",
  LESSON_COMPLETED: "lesson_completed",
  QUIZ_COMPLETED: "quiz_completed",
  SIMULATOR_LAUNCHED: "simulator_launched",
  SIMULATOR_COMPLETED: "simulator_completed",
  CERTIFICATE_EARNED: "certificate_earned",
  LAB_COMPLETED: "lab_completed",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// ─── Event Payload Types ─────────────────────────────────────────────────────

export interface SignupCompletedPayload {
  method: "email" | "oauth";
}

export interface OnboardingCompletedPayload {
  experienceLevel: string;
  goalCount: number;
  equipmentCount: number;
  skipped?: boolean;
}

export interface CourseStartedPayload {
  moduleSlug: string;
  moduleTitle: string;
}

export interface LessonCompletedPayload {
  moduleSlug: string;
  lessonSlug: string;
}

export interface QuizCompletedPayload {
  moduleSlug: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
}

export interface SimulatorLaunchedPayload {
  scenarioId: string;
  scenarioTitle: string;
  playMode: string;
  difficulty: string;
}

export interface SimulatorCompletedPayload {
  scenarioId: string;
  scenarioTitle: string;
  score: number;
  maxScore: number;
  timeSeconds: number;
}

export interface CertificateEarnedPayload {
  moduleSlug: string;
  quizScore: number;
}

export interface LabCompletedPayload {
  labId: string;
  labTitle: string;
}

// ─── Umami Global Type ───────────────────────────────────────────────────────

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
    };
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Safely call window.umami.track(). No-ops if Umami is not loaded
 * (e.g. ad-blocker, dev environment without analytics env vars).
 */
type EventData = Record<string, string | number | boolean>;

function safeTrack(eventName: string, eventData?: EventData): void {
  try {
    if (typeof window !== "undefined" && window.umami?.track) {
      window.umami.track(eventName, eventData);
    }
  } catch {
    // Silently ignore — analytics must never break the app
  }
}

export function useAnalytics() {
  const track = useCallback(
    (eventName: string, eventData?: Record<string, string | number | boolean>) => {
      safeTrack(eventName, eventData);
    },
    []
  );

  const trackSignupCompleted = useCallback(
    (payload: SignupCompletedPayload) => {
      safeTrack(ANALYTICS_EVENTS.SIGNUP_COMPLETED, { ...payload } as EventData);
    },
    []
  );

  const trackOnboardingCompleted = useCallback(
    (payload: OnboardingCompletedPayload) => {
      safeTrack(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
        experienceLevel: payload.experienceLevel,
        goalCount: payload.goalCount,
        equipmentCount: payload.equipmentCount,
        skipped: payload.skipped ?? false,
      });
    },
    []
  );

  const trackCourseStarted = useCallback(
    (payload: CourseStartedPayload) => {
      safeTrack(ANALYTICS_EVENTS.COURSE_STARTED, { ...payload } as EventData);
    },
    []
  );

  const trackLessonCompleted = useCallback(
    (payload: LessonCompletedPayload) => {
      safeTrack(ANALYTICS_EVENTS.LESSON_COMPLETED, { ...payload } as EventData);
    },
    []
  );

  const trackQuizCompleted = useCallback(
    (payload: QuizCompletedPayload) => {
      safeTrack(ANALYTICS_EVENTS.QUIZ_COMPLETED, {
        moduleSlug: payload.moduleSlug,
        score: payload.score,
        totalQuestions: payload.totalQuestions,
        passed: payload.passed,
      });
    },
    []
  );

  const trackSimulatorLaunched = useCallback(
    (payload: SimulatorLaunchedPayload) => {
      safeTrack(ANALYTICS_EVENTS.SIMULATOR_LAUNCHED, { ...payload } as EventData);
    },
    []
  );

  const trackSimulatorCompleted = useCallback(
    (payload: SimulatorCompletedPayload) => {
      safeTrack(ANALYTICS_EVENTS.SIMULATOR_COMPLETED, {
        scenarioId: payload.scenarioId,
        scenarioTitle: payload.scenarioTitle,
        score: payload.score,
        maxScore: payload.maxScore,
        timeSeconds: payload.timeSeconds,
      });
    },
    []
  );

  const trackCertificateEarned = useCallback(
    (payload: CertificateEarnedPayload) => {
      safeTrack(ANALYTICS_EVENTS.CERTIFICATE_EARNED, { ...payload } as EventData);
    },
    []
  );

  const trackLabCompleted = useCallback(
    (payload: LabCompletedPayload) => {
      safeTrack(ANALYTICS_EVENTS.LAB_COMPLETED, { ...payload } as EventData);
    },
    []
  );

  return useMemo(
    () => ({
      track,
      trackSignupCompleted,
      trackOnboardingCompleted,
      trackCourseStarted,
      trackLessonCompleted,
      trackQuizCompleted,
      trackSimulatorLaunched,
      trackSimulatorCompleted,
      trackCertificateEarned,
      trackLabCompleted,
    }),
    [
      track,
      trackSignupCompleted,
      trackOnboardingCompleted,
      trackCourseStarted,
      trackLessonCompleted,
      trackQuizCompleted,
      trackSimulatorLaunched,
      trackSimulatorCompleted,
      trackCertificateEarned,
      trackLabCompleted,
    ]
  );
}
