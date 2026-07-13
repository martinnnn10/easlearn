/**
 * Lesson → Practice → Troubleshoot → Assess mappings (A1).
 * Includes Track B schema on every unit; legacy lessons use Track A `lesson` stage.
 */

import {
  type HubId,
  type IluLink,
  type LearningPathUnit,
  type LessonFormat,
  type LessonTrackBConfig,
  type LessonUnit,
  type SimulatorBenchmarkStatus,
  ILU_CARDS_MAX,
  ILU_CARDS_MIN,
  ILU_KNOWLEDGE_CHECK_CARD_INTERVAL,
  ILU_LESSON_QUIZ_MAX_QUESTIONS,
  ILU_LESSON_QUIZ_MIN_QUESTIONS,
  ILU_LESSON_QUIZ_PASS_PERCENT,
  assertHubIluRegistryValid,
  courseLessonRoute,
  getHubForModule,
  getIluLinksForTrack,
  getOrderedStagesForTrack,
  lessonAssessRoute,
  lessonKnowledgeCheckRoute,
  lessonQuizRoute,
  moduleQuizRoute,
  validateLessonPracticeMap,
} from "./hubRegistry";

// ── Builders ────────────────────────────────────────────────────────────────

interface PracticeInput {
  targetSlug: string;
  title: string;
  route?: string;
  required?: boolean;
}

interface TroubleshootInput {
  targetSlug: string;
  title: string;
  route?: string;
  required?: boolean;
  isBenchmark?: boolean;
  labMode?: "learn" | "practice" | "guided";
  faultScope?: string[];
  simulatorStatus?: SimulatorBenchmarkStatus;
  queryParams?: Record<string, string>;
}

interface AssessInput {
  title?: string;
  route?: string;
  required?: boolean;
  useModuleQuiz?: boolean;
}

interface LessonMapInput {
  moduleSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  orderIndex: number;
  cardCount?: number;
  lessonFormat?: LessonFormat;
  practice?: PracticeInput | null;
  troubleshoot?: TroubleshootInput | null;
  assess?: AssessInput;
}

function clampCardCount(n: number): number {
  return Math.min(ILU_CARDS_MAX, Math.max(ILU_CARDS_MIN, n));
}

function buildTrackBConfig(
  moduleSlug: string,
  lessonSlug: string,
  cardCount: number
): LessonTrackBConfig {
  const count = clampCardCount(cardCount);
  const route = courseLessonRoute(moduleSlug, lessonSlug);
  const blockCount = Math.max(1, Math.ceil(count / ILU_KNOWLEDGE_CHECK_CARD_INTERVAL));

  return {
    cards: {
      estimatedCount: count,
      route,
      visualRequired: true,
    },
    knowledgeChecks: {
      idPrefix: `${lessonSlug}-kc`,
      blockCount,
      intervalCards: ILU_KNOWLEDGE_CHECK_CARD_INTERVAL,
      gatesProgress: false,
      questionTypes: ["multiple_choice", "image_identify"],
      feedbackRequired: true,
    },
    lessonQuiz: {
      slug: `${lessonSlug}-quiz`,
      passThreshold: ILU_LESSON_QUIZ_PASS_PERCENT,
      drawCount: Math.min(
        ILU_LESSON_QUIZ_MAX_QUESTIONS,
        Math.max(ILU_LESSON_QUIZ_MIN_QUESTIONS, Math.ceil(count / 2))
      ),
      shuffleQuestions: true,
      shuffleChoices: true,
      retakesAllowed: true,
      gatesProgress: true,
      unlocksStage: "practice",
      questionTypes: ["multiple_choice", "image_identify"],
      feedbackRequired: true,
    },
  };
}

function labRoute(slug: string, fallbackRoute: string): string {
  const routes: Record<string, string> = {
    "ladder-logic-lab": "/labs#ladder",
    "vfd-parameter-lab": "/labs#vfd",
    "multimeter-lab": "/labs#multimeter",
    "relay-simulator": "/labs#relay",
    "circuit-flow-lab": "/labs#circuit",
    "motor-starter-lab": "/labs#motor-starter",
    "wiring-diagram-lab": "/labs#wiring-diagram",
    "component-id-lab": "/labs#component-id",
    "conveyor-plc-lab": "/labs#conveyor-troubleshoot",
    "powerflex-diagnostic-lab": "/labs#powerflex-diagnostic",
  };
  return routes[slug] ?? fallbackRoute;
}

function simRoute(slug: string): string {
  if (slug === "conveyor-plc-lab") return "/labs#conveyor-troubleshoot";
  if (slug === "powerflex-diagnostic-lab") return "/labs#powerflex-diagnostic";
  return `/simulator?scenario=${encodeURIComponent(slug)}`;
}

function appendQuery(route: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return route;
  const qs = new URLSearchParams(params).toString();
  const hashIdx = route.indexOf("#");
  if (hashIdx >= 0) {
    return `${route.slice(0, hashIdx)}?${qs}${route.slice(hashIdx)}`;
  }
  return `${route}?${qs}`;
}

function buildLessonUnit(input: LessonMapInput): LessonUnit {
  const {
    moduleSlug,
    lessonSlug,
    lessonTitle,
    orderIndex,
    cardCount = 8,
    lessonFormat = "legacy_article",
    practice = null,
    troubleshoot = null,
    assess = {},
  } = input;

  const lessonRoute = courseLessonRoute(moduleSlug, lessonSlug);
  const trackB = buildTrackBConfig(moduleSlug, lessonSlug, cardCount);

  const iluLinks: IluLink[] = [
    {
      stage: "lesson",
      tracks: ["A"],
      targetSlug: lessonSlug,
      targetType: "lesson",
      route: lessonRoute,
      title: lessonTitle,
      required: true,
      gatesProgress: false,
    },
    {
      stage: "cards",
      tracks: ["B"],
      targetSlug: lessonSlug,
      targetType: "cards",
      route: lessonRoute,
      title: "Learning Cards",
      required: true,
      gatesProgress: false,
    },
    {
      stage: "knowledge_check",
      tracks: ["B"],
      targetSlug: trackB.knowledgeChecks.idPrefix,
      targetType: "knowledge_check",
      route: lessonKnowledgeCheckRoute(moduleSlug, lessonSlug),
      title: "Knowledge Checks",
      required: true,
      gatesProgress: false,
    },
    {
      stage: "lesson_quiz",
      tracks: ["B"],
      targetSlug: trackB.lessonQuiz.slug,
      targetType: "lesson_quiz",
      route: lessonQuizRoute(moduleSlug, lessonSlug),
      title: "Lesson Quiz",
      required: true,
      gatesProgress: true,
      passThreshold: ILU_LESSON_QUIZ_PASS_PERCENT,
      prerequisiteStages: ["cards", "knowledge_check"],
    },
  ];

  if (practice) {
    const pRoute = practice.route ?? labRoute(practice.targetSlug, `/labs#${practice.targetSlug}`);
    iluLinks.push({
      stage: "practice",
      tracks: ["A", "B"],
      targetSlug: practice.targetSlug,
      targetType: "lab",
      route: pRoute,
      title: practice.title,
      required: practice.required ?? false,
      gatesProgress: false,
      prerequisiteStages: ["lesson", "lesson_quiz"],
    });
  }

  if (troubleshoot) {
    const tRoute =
      troubleshoot.route ??
      (troubleshoot.isBenchmark
        ? appendQuery(labRoute(troubleshoot.targetSlug, simRoute(troubleshoot.targetSlug)), {
            ...troubleshoot.queryParams,
            ...(troubleshoot.labMode ? { mode: troubleshoot.labMode } : {}),
          })
        : appendQuery(simRoute(troubleshoot.targetSlug), troubleshoot.queryParams));

    iluLinks.push({
      stage: "troubleshoot",
      tracks: ["A", "B"],
      targetSlug: troubleshoot.targetSlug,
      targetType: troubleshoot.isBenchmark ? "simulator" : "simulator",
      route: tRoute,
      title: troubleshoot.title,
      required: troubleshoot.required ?? false,
      gatesProgress: false,
      prerequisiteStages: practice ? ["practice"] : ["lesson", "lesson_quiz"],
      labMode: troubleshoot.labMode,
      faultScope: troubleshoot.faultScope,
      simulatorStatus: troubleshoot.simulatorStatus,
      isBenchmark: troubleshoot.isBenchmark,
    });
  }

  const assessRoute = assess.useModuleQuiz
    ? moduleQuizRoute(moduleSlug)
    : assess.route ?? lessonAssessRoute(moduleSlug, lessonSlug);

  iluLinks.push({
    stage: "assess",
    tracks: ["A", "B"],
    targetSlug: assess.useModuleQuiz ? `${moduleSlug}-module-quiz` : `${lessonSlug}-assess`,
    targetType: assess.useModuleQuiz ? "quiz" : "assessment",
    route: assessRoute,
    title: assess.title ?? (assess.useModuleQuiz ? "Module Assessment" : "Competency Assessment"),
    required: assess.required ?? true,
    gatesProgress: true,
    prerequisiteStages: troubleshoot ? ["troubleshoot"] : ["lesson_quiz"],
  });

  return {
    lessonSlug,
    lessonTitle,
    orderIndex,
    lessonFormat,
    trackB,
    iluLinks,
  };
}

// ── PLC Fundamentals ────────────────────────────────────────────────────────

const PLC_FUNDAMENTALS_UNITS: LessonUnit[] = [
  buildLessonUnit({
    moduleSlug: "plc-fundamentals",
    lessonSlug: "plc-architecture",
    lessonTitle: "PLC Architecture & Hardware Components",
    orderIndex: 1,
    cardCount: 12,
    lessonFormat: "cards",
    troubleshoot: {
      targetSlug: "plc-io-fault-v3",
      title: "PLC I/O Overview Scenario",
      required: false,
      simulatorStatus: "v3_fallback",
    },
  }),
  buildLessonUnit({
    moduleSlug: "plc-fundamentals",
    lessonSlug: "ladder-logic-basics",
    lessonTitle: "Ladder Logic: Contacts, Coils, and Basic Instructions",
    orderIndex: 2,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "ladder-logic-lab",
      title: "Ladder Logic Lab",
      required: true,
    },
    troubleshoot: {
      targetSlug: "conveyor-plc-lab",
      title: "Conveyor PLC Lab — Learn Mode",
      required: false,
      isBenchmark: true,
      labMode: "learn",
      simulatorStatus: "active",
    },
  }),
  buildLessonUnit({
    moduleSlug: "plc-fundamentals",
    lessonSlug: "io-troubleshooting",
    lessonTitle: "I/O Module Troubleshooting & Wiring",
    orderIndex: 3,
    cardCount: 12,
    lessonFormat: "cards",
    practice: {
      targetSlug: "multimeter-lab",
      title: "Multimeter Lab",
      required: false,
    },
    troubleshoot: {
      targetSlug: "conveyor-plc-lab",
      title: "Conveyor PLC Lab — I/O Faults",
      required: true,
      isBenchmark: true,
      labMode: "practice",
      faultScope: ["photoeye_stuck_on", "estop_open"],
      simulatorStatus: "active",
    },
  }),
  buildLessonUnit({
    moduleSlug: "plc-fundamentals",
    lessonSlug: "timers-counters",
    lessonTitle: "Timers, Counters, and Comparison Instructions",
    orderIndex: 4,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "ladder-logic-lab",
      title: "Ladder Logic Lab — Timers",
      required: true,
    },
    troubleshoot: {
      targetSlug: "conveyor-plc-lab",
      title: "Conveyor PLC Lab — Timer Rungs",
      required: false,
      isBenchmark: true,
      labMode: "learn",
      simulatorStatus: "active",
    },
  }),
  buildLessonUnit({
    moduleSlug: "plc-fundamentals",
    lessonSlug: "communication-faults",
    lessonTitle: "Communication Faults: EtherNet/IP & DeviceNet",
    orderIndex: 5,
    cardCount: 13,
    lessonFormat: "cards",
  }),
  buildLessonUnit({
    moduleSlug: "plc-fundamentals",
    lessonSlug: "program-troubleshooting",
    lessonTitle: "Online Troubleshooting & Forcing I/O",
    orderIndex: 6,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "ladder-logic-lab",
      title: "Ladder Logic Lab",
      required: true,
    },
    troubleshoot: {
      targetSlug: "conveyor-plc-lab",
      title: "Conveyor PLC Lab — Guided Troubleshooting",
      required: true,
      isBenchmark: true,
      labMode: "guided",
      faultScope: ["estop_open", "photoeye_stuck_on", "overload_tripped", "output_on_motor_dead"],
      simulatorStatus: "active",
    },
    assess: { useModuleQuiz: true, title: "PLC Fundamentals Certification", required: true },
  }),
];

// ── PowerFlex VFD ─────────────────────────────────────────────────────────────

const POWERFLEX_VFD_UNITS: LessonUnit[] = [
  buildLessonUnit({
    moduleSlug: "powerflex-vfd",
    lessonSlug: "vfd-fundamentals",
    lessonTitle: "VFD Fundamentals & Operating Principles",
    orderIndex: 1,
    cardCount: 12,
    lessonFormat: "cards",
    practice: {
      targetSlug: "circuit-flow-lab",
      title: "Circuit Flow Lab",
      required: false,
    },
    troubleshoot: {
      targetSlug: "vfd-ramp",
      title: "VFD Intro Scenario",
      required: false,
      simulatorStatus: "v3_fallback",
    },
  }),
  buildLessonUnit({
    moduleSlug: "powerflex-vfd",
    lessonSlug: "powerflex-parameter-groups",
    lessonTitle: "PowerFlex Parameter Groups & Navigation",
    orderIndex: 2,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "vfd-parameter-lab",
      title: "VFD Parameter Lab",
      required: true,
    },
    troubleshoot: {
      targetSlug: "vfd-dc-bus-undervoltage-v3",
      title: "VFD Parameter Fault Scenario",
      required: false,
      simulatorStatus: "v3_fallback",
    },
  }),
  buildLessonUnit({
    moduleSlug: "powerflex-vfd",
    lessonSlug: "basic-programming",
    lessonTitle: "Basic Programming: Speed Reference, Accel/Decel, Motor Data",
    orderIndex: 3,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "vfd-parameter-lab",
      title: "VFD Parameter Lab",
      required: true,
    },
    troubleshoot: {
      targetSlug: "vfd-overcurrent-ramp-v3",
      title: "Speed Reference Scenario",
      required: false,
      simulatorStatus: "v3_fallback",
    },
  }),
  buildLessonUnit({
    moduleSlug: "powerflex-vfd",
    lessonSlug: "fault-codes-diagnostics",
    lessonTitle: "Fault Codes & Diagnostic Procedures",
    orderIndex: 4,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "multimeter-lab",
      title: "Multimeter Lab",
      required: false,
    },
    troubleshoot: {
      targetSlug: "powerflex-diagnostic-lab",
      title: "PowerFlex Diagnostic Lab",
      required: true,
      isBenchmark: true,
      labMode: "practice",
      faultScope: ["overcurrent", "dc_bus_undervoltage", "cooling_fan_seized"],
      simulatorStatus: "active",
    },
  }),
  buildLessonUnit({
    moduleSlug: "powerflex-vfd",
    lessonSlug: "common-failures",
    lessonTitle: "Common Failure Modes in Manufacturing",
    orderIndex: 5,
    cardCount: 13,
    lessonFormat: "cards",
    troubleshoot: {
      targetSlug: "powerflex-diagnostic-lab",
      title: "PowerFlex Diagnostic Lab — Guided",
      required: true,
      isBenchmark: true,
      labMode: "guided",
      faultScope: ["dc_bus_undervoltage", "cooling_fan_seized", "overcurrent"],
      simulatorStatus: "active",
    },
  }),
  buildLessonUnit({
    moduleSlug: "powerflex-vfd",
    lessonSlug: "advanced-features",
    lessonTitle: "Advanced Features: PID, Multi-Speed, Communication",
    orderIndex: 6,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "vfd-parameter-lab",
      title: "VFD Parameter Lab — PID",
      required: true,
    },
    assess: { useModuleQuiz: true, title: "PowerFlex VFD Certification", required: true },
  }),
];

// ── Motor Controls ────────────────────────────────────────────────────────────

const MOTORS_CONTROLS_UNITS: LessonUnit[] = [
  buildLessonUnit({
    moduleSlug: "motors-controls",
    lessonSlug: "motor-theory",
    lessonTitle: "AC & DC Motor Theory",
    orderIndex: 1,
    cardCount: 13,
    lessonFormat: "cards",
  }),
  buildLessonUnit({
    moduleSlug: "motors-controls",
    lessonSlug: "motor-control-circuits",
    lessonTitle: "Motor Control Circuits & Schematics",
    orderIndex: 2,
    cardCount: 12,
    lessonFormat: "cards",
    practice: {
      targetSlug: "relay-simulator",
      title: "Relay Simulator — Seal-In Circuit",
      required: true,
    },
    troubleshoot: {
      targetSlug: "blown-control-fuse",
      title: "Motor Control Circuit Scenario",
      required: false,
      simulatorStatus: "v3_fallback",
    },
  }),
  buildLessonUnit({
    moduleSlug: "motors-controls",
    lessonSlug: "starter-troubleshooting",
    lessonTitle: "Motor Starter Troubleshooting",
    orderIndex: 3,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "relay-simulator",
      title: "Relay Simulator",
      required: true,
    },
    troubleshoot: {
      targetSlug: "motor-overload-trip-v3",
      title: "Motor Overload Trip Scenario",
      required: true,
      simulatorStatus: "v3_fallback",
    },
  }),
  buildLessonUnit({
    moduleSlug: "motors-controls",
    lessonSlug: "overload-protection",
    lessonTitle: "Overload Protection & Sizing",
    orderIndex: 4,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "relay-simulator",
      title: "Relay Simulator",
      required: false,
    },
    troubleshoot: {
      targetSlug: "conveyor-plc-lab",
      title: "Conveyor PLC Lab — Overload Fault",
      required: true,
      isBenchmark: true,
      labMode: "practice",
      faultScope: ["overload_tripped"],
      simulatorStatus: "active",
    },
  }),
  buildLessonUnit({
    moduleSlug: "motors-controls",
    lessonSlug: "single-three-phase",
    lessonTitle: "Single-Phase vs Three-Phase Diagnostics",
    orderIndex: 5,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "multimeter-lab",
      title: "Multimeter Lab",
      required: false,
    },
    troubleshoot: {
      targetSlug: "vfd-input-phase-loss-v3",
      title: "Phase Diagnostic Scenario",
      required: false,
      simulatorStatus: "v3_fallback",
    },
  }),
  buildLessonUnit({
    moduleSlug: "motors-controls",
    lessonSlug: "motor-testing",
    lessonTitle: "Motor Testing: Megger, Winding Resistance, Vibration",
    orderIndex: 6,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "multimeter-lab",
      title: "Multimeter Lab",
      required: false,
    },
    assess: { useModuleQuiz: true, title: "Motor Controls Certification", required: true },
  }),
];

// ── Sensors & Instrumentation ─────────────────────────────────────────────────

const SENSORS_INSTRUMENTATION_UNITS: LessonUnit[] = [
  buildLessonUnit({
    moduleSlug: "sensors-instrumentation",
    lessonSlug: "sensor-types-overview",
    lessonTitle: "Industrial Sensor Types Overview",
    orderIndex: 1,
    cardCount: 12,
    lessonFormat: "cards",
  }),
  buildLessonUnit({
    moduleSlug: "sensors-instrumentation",
    lessonSlug: "proximity-photoelectric",
    lessonTitle: "Proximity & Photoelectric Sensors",
    orderIndex: 2,
    cardCount: 12,
    lessonFormat: "cards",
    troubleshoot: {
      targetSlug: "conveyor-plc-lab",
      title: "Conveyor PLC Lab — Photoeye Fault",
      required: true,
      isBenchmark: true,
      labMode: "practice",
      faultScope: ["photoeye_stuck_on"],
      simulatorStatus: "active",
    },
  }),
  buildLessonUnit({
    moduleSlug: "sensors-instrumentation",
    lessonSlug: "temperature-pressure",
    lessonTitle: "Temperature & Pressure Instrumentation",
    orderIndex: 3,
    cardCount: 12,
    lessonFormat: "cards",
  }),
  buildLessonUnit({
    moduleSlug: "sensors-instrumentation",
    lessonSlug: "calibration-basics",
    lessonTitle: "Calibration Basics",
    orderIndex: 4,
    cardCount: 12,
    lessonFormat: "cards",
  }),
  buildLessonUnit({
    moduleSlug: "sensors-instrumentation",
    lessonSlug: "loop-checkout",
    lessonTitle: "Loop Checkout & Verification",
    orderIndex: 5,
    cardCount: 12,
    lessonFormat: "cards",
    practice: {
      targetSlug: "multimeter-lab",
      title: "Multimeter Lab",
      required: true,
    },
    troubleshoot: {
      targetSlug: "plc-io-fault-v3",
      title: "Loop Fault Scenario",
      required: false,
      simulatorStatus: "v3_fallback",
    },
    assess: { useModuleQuiz: true, title: "Sensors & Instrumentation Certification", required: true },
  }),
];

// ── Safety Systems ────────────────────────────────────────────────────────────

const SAFETY_SYSTEMS_UNITS: LessonUnit[] = [
  buildLessonUnit({
    moduleSlug: "safety-systems",
    lessonSlug: "risk-assessment",
    lessonTitle: "Risk Assessment Fundamentals",
    orderIndex: 1,
    cardCount: 13,
    lessonFormat: "cards",
  }),
  buildLessonUnit({
    moduleSlug: "safety-systems",
    lessonSlug: "estop-circuits",
    lessonTitle: "E-Stop Circuits & Safety Chains",
    orderIndex: 2,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "relay-simulator",
      title: "Relay Simulator",
      required: false,
    },
    troubleshoot: {
      targetSlug: "conveyor-plc-lab",
      title: "Conveyor PLC Lab — E-Stop Fault",
      required: true,
      isBenchmark: true,
      labMode: "practice",
      faultScope: ["estop_open"],
      simulatorStatus: "active",
    },
  }),
  buildLessonUnit({
    moduleSlug: "safety-systems",
    lessonSlug: "guarding-lockout",
    lessonTitle: "Guarding & Lockout/Tagout",
    orderIndex: 3,
    cardCount: 13,
    lessonFormat: "cards",
    assess: { useModuleQuiz: true, title: "Safety Systems Certification", required: true },
  }),
];

// ── Print Reading ─────────────────────────────────────────────────────────────

const PRINT_READING_UNITS: LessonUnit[] = [
  buildLessonUnit({
    moduleSlug: "print-reading",
    lessonSlug: "ladder-diagram-conventions",
    lessonTitle: "Ladder Diagram Conventions",
    orderIndex: 1,
    cardCount: 13,
    lessonFormat: "cards",
    troubleshoot: {
      targetSlug: "conveyor-plc-lab",
      title: "Conveyor PLC Lab — Ladder Panel",
      required: false,
      isBenchmark: true,
      labMode: "learn",
      simulatorStatus: "active",
    },
  }),
  buildLessonUnit({
    moduleSlug: "print-reading",
    lessonSlug: "wiring-diagrams",
    lessonTitle: "Wiring Diagrams & Print Packages",
    orderIndex: 2,
    cardCount: 13,
    lessonFormat: "cards",
    troubleshoot: {
      targetSlug: "conveyor-plc-lab",
      title: "Conveyor Print Package Review",
      required: false,
      isBenchmark: true,
      labMode: "learn",
      simulatorStatus: "active",
      queryParams: { panel: "print" },
    },
  }),
  buildLessonUnit({
    moduleSlug: "print-reading",
    lessonSlug: "pid-symbols",
    lessonTitle: "P&ID Symbols & Conventions",
    orderIndex: 3,
    cardCount: 13,
    lessonFormat: "cards",
    practice: {
      targetSlug: "component-id-lab",
      title: "NEMA / JIC Symbol Identification Lab",
      required: false,
    },
    assess: { useModuleQuiz: true, title: "Print Reading Certification", required: true },
  }),
];

// ── Electrical Fundamentals (foundational track) ─────────────────────────────

const ELECTRICAL_FUNDAMENTALS_UNITS: LessonUnit[] = [
  buildLessonUnit({
    moduleSlug: "electrical-fundamentals",
    lessonSlug: "electrical-safety-lockout",
    lessonTitle: "Electrical Safety & Lockout/Tagout",
    orderIndex: 1,
    cardCount: 12,
    lessonFormat: "cards",
    assess: { useModuleQuiz: true, title: "Electrical Fundamentals Certification", required: true },
  }),
  buildLessonUnit({
    moduleSlug: "electrical-fundamentals",
    lessonSlug: "ac-dc-theory",
    lessonTitle: "AC & DC Theory",
    orderIndex: 2,
    cardCount: 12,
    lessonFormat: "cards",
    assess: { useModuleQuiz: true, title: "Electrical Fundamentals Certification", required: true },
  }),
  buildLessonUnit({
    moduleSlug: "electrical-fundamentals",
    lessonSlug: "ohms-law-power",
    lessonTitle: "Ohm's Law & Power",
    orderIndex: 3,
    cardCount: 12,
    lessonFormat: "cards",
    assess: { useModuleQuiz: true, title: "Electrical Fundamentals Certification", required: true },
  }),
  buildLessonUnit({
    moduleSlug: "electrical-fundamentals",
    lessonSlug: "series-parallel-circuits",
    lessonTitle: "Series & Parallel Circuits",
    orderIndex: 4,
    cardCount: 12,
    lessonFormat: "cards",
    assess: { useModuleQuiz: true, title: "Electrical Fundamentals Certification", required: true },
  }),
  buildLessonUnit({
    moduleSlug: "electrical-fundamentals",
    lessonSlug: "kirchhoffs-laws",
    lessonTitle: "Kirchhoff's Laws",
    orderIndex: 5,
    cardCount: 12,
    lessonFormat: "cards",
    assess: { useModuleQuiz: true, title: "Electrical Fundamentals Certification", required: true },
  }),
  buildLessonUnit({
    moduleSlug: "electrical-fundamentals",
    lessonSlug: "meters-measurements",
    lessonTitle: "Meters & Measurements",
    orderIndex: 6,
    cardCount: 12,
    lessonFormat: "cards",
    assess: { useModuleQuiz: true, title: "Electrical Fundamentals Certification", required: true },
  }),
];

// ── HVAC Fundamentals (foundational track) ───────────────────────────────────

const HVAC_FUNDAMENTALS_UNITS: LessonUnit[] = [
  buildLessonUnit({
    moduleSlug: "hvac-fundamentals",
    lessonSlug: "refrigeration-cycle",
    lessonTitle: "The Refrigeration Cycle",
    orderIndex: 1,
    cardCount: 12,
    lessonFormat: "cards",
    assess: { useModuleQuiz: true, title: "HVAC Fundamentals Certification", required: true },
  }),
];

// ── Aggregated map ────────────────────────────────────────────────────────────

export const LESSON_PRACTICE_MAP: LearningPathUnit[] = [
  {
    pathSlug: "plc-fundamentals",
    pathTitle: "PLC Fundamentals & Troubleshooting",
    hubId: "plc",
    units: PLC_FUNDAMENTALS_UNITS,
  },
  {
    pathSlug: "powerflex-vfd",
    pathTitle: "PowerFlex VFD Programming & Troubleshooting",
    hubId: "vfd",
    units: POWERFLEX_VFD_UNITS,
  },
  {
    pathSlug: "motors-controls",
    pathTitle: "Motors & Motor Controls",
    hubId: "motor_controls",
    units: MOTORS_CONTROLS_UNITS,
  },
  {
    pathSlug: "sensors-instrumentation",
    pathTitle: "Sensors & Instrumentation",
    hubId: "sensors",
    units: SENSORS_INSTRUMENTATION_UNITS,
  },
  {
    pathSlug: "safety-systems",
    pathTitle: "Safety Systems",
    hubId: "safety",
    units: SAFETY_SYSTEMS_UNITS,
  },
  {
    pathSlug: "print-reading",
    pathTitle: "Print Reading & Schematics",
    hubId: "print_reading",
    units: PRINT_READING_UNITS,
  },
  {
    pathSlug: "electrical-fundamentals",
    pathTitle: "Electrical Fundamentals",
    units: ELECTRICAL_FUNDAMENTALS_UNITS,
  },
  {
    pathSlug: "hvac-fundamentals",
    pathTitle: "HVAC Fundamentals",
    units: HVAC_FUNDAMENTALS_UNITS,
  },
];

// Validate at module load (dev/build typecheck path)
assertHubIluRegistryValid(LESSON_PRACTICE_MAP);

// ── Accessors ───────────────────────────────────────────────────────────────

export function getLearningPathBySlug(pathSlug: string): LearningPathUnit | undefined {
  return LESSON_PRACTICE_MAP.find((p) => p.pathSlug === pathSlug);
}

export function getLessonUnit(
  pathSlug: string,
  lessonSlug: string
): LessonUnit | undefined {
  const path = getLearningPathBySlug(pathSlug);
  return path?.units.find((u) => u.lessonSlug === lessonSlug);
}

export function getLessonsForHub(hubId: HubId): LessonUnit[] {
  const paths = LESSON_PRACTICE_MAP.filter((p) => p.hubId === hubId);
  return paths.flatMap((p) => p.units);
}

export function getPathsForHub(hubId: HubId): LearningPathUnit[] {
  return LESSON_PRACTICE_MAP.filter((p) => p.hubId === hubId);
}

export function getLessonIluLinks(
  pathSlug: string,
  lessonSlug: string,
  track: "A" | "B" = "A"
) {
  const unit = getLessonUnit(pathSlug, lessonSlug);
  if (!unit) return [];
  return getIluLinksForTrack(unit.iluLinks, track);
}

export function getNextIluStage(
  pathSlug: string,
  lessonSlug: string,
  track: "A" | "B",
  completedStages: string[]
): IluLink | undefined {
  const ordered = getOrderedStagesForTrack(track);
  const links = getLessonIluLinks(pathSlug, lessonSlug, track);
  for (const stage of ordered) {
    if (completedStages.includes(stage)) continue;
    const link = links.find((l) => l.stage === stage);
    if (link) return link;
  }
  return undefined;
}

export function getHubDashboardPaths(hubId: HubId): LearningPathUnit[] {
  return getPathsForHub(hubId);
}

export function getModuleHubId(moduleSlug: string): HubId | undefined {
  return getHubForModule(moduleSlug)?.id;
}

export { validateLessonPracticeMap };
