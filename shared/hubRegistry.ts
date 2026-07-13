/**
 * EASLearn Hub Registry — shared ILU / hub definitions (A1).
 * Track A: legacy lesson → practice → troubleshoot → assess
 * Track B: cards → knowledge checks → lesson quiz (80%) → practice → troubleshoot → assess
 *
 * @see EASLEARN_LEARNING_EXPERIENCE_CONSTITUTION_v2.md
 */

import { getCatalogEntry } from "./simulatorCatalog";
import { SIMULATOR_SCENARIO_IDS } from "./scenarioLinking";

// ── Constitution-aligned thresholds (ILU design — Track B) ─────────────────

/** Lesson quiz pass threshold per Constitution v2.0 (gates Practice unlock). */
export const ILU_LESSON_QUIZ_PASS_PERCENT = 80;

/** Knowledge checks are formative — never gate progress. */
export const ILU_KNOWLEDGE_CHECK_GATES_PROGRESS = false as const;

/** Recommended card count per lesson (Track B). */
export const ILU_CARDS_MIN = 5;
export const ILU_CARDS_MAX = 15;

/** Knowledge check rhythm: every N cards. */
export const ILU_KNOWLEDGE_CHECK_CARD_INTERVAL = 3;

/** Lesson quiz question pool sizing (Track B metadata). */
export const ILU_LESSON_QUIZ_MIN_QUESTIONS = 5;
export const ILU_LESSON_QUIZ_MAX_QUESTIONS = 15;

// ── Identifiers ─────────────────────────────────────────────────────────────

export const HUB_IDS = ["plc", "vfd", "motor_controls", "sensors", "safety", "print_reading"] as const;
export type HubId = (typeof HUB_IDS)[number];

export const ILU_TRACKS = ["A", "B"] as const;
export type IluTrack = (typeof ILU_TRACKS)[number];

/** All ILU stages (Track B full chain). */
export const ILU_STAGES = [
  "lesson",
  "cards",
  "knowledge_check",
  "lesson_quiz",
  "practice",
  "troubleshoot",
  "assess",
] as const;
export type IluStage = (typeof ILU_STAGES)[number];

/** Track A legacy active stages (maps long-scroll lesson as `lesson`). */
export const TRACK_A_ILU_STAGES: readonly IluStage[] = [
  "lesson",
  "practice",
  "troubleshoot",
  "assess",
];

/** Track B full active stages. */
export const TRACK_B_ILU_STAGES: readonly IluStage[] = [
  "cards",
  "knowledge_check",
  "lesson_quiz",
  "practice",
  "troubleshoot",
  "assess",
];

export const LESSON_FORMATS = ["legacy_article", "cards"] as const;
export type LessonFormat = (typeof LESSON_FORMATS)[number];

export const ILU_TARGET_TYPES = [
  "lesson",
  "cards",
  "knowledge_check",
  "lesson_quiz",
  "lab",
  "simulator",
  "quiz",
  "assessment",
  "print_package",
] as const;
export type IluTargetType = (typeof ILU_TARGET_TYPES)[number];

export const SIMULATOR_BENCHMARK_STATUSES = ["active", "scaffold", "v3_fallback"] as const;
export type SimulatorBenchmarkStatus = (typeof SIMULATOR_BENCHMARK_STATUSES)[number];

/** Simulators planned but not yet built — valid in map, flagged in validation. */
export const FUTURE_SIMULATOR_IDS = ["powerflex-diagnostic-lab"] as const;
export type FutureSimulatorId = (typeof FUTURE_SIMULATOR_IDS)[number];

// ── Track B schema (metadata — player not built in A1) ──────────────────────

/** Feedback required on every knowledge check and quiz answer (Constitution v2.0). */
export interface IluFeedbackBlock {
  headline: string;
  whyChosen?: string;
  whyCorrect: string;
  industrialContext: string;
}

export interface KnowledgeCheckMeta {
  /** Stable id prefix, e.g. io-troubleshooting-kc */
  idPrefix: string;
  /** Number of KC blocks (typically ceil(cardCount / interval)). */
  blockCount: number;
  /** Every 3–5 cards per constitution. */
  intervalCards: number;
  gatesProgress: false;
  questionTypes: ("multiple_choice" | "image_identify")[];
  feedbackRequired: true;
}

export interface LessonQuizMeta {
  slug: string;
  passThreshold: typeof ILU_LESSON_QUIZ_PASS_PERCENT;
  drawCount: number;
  shuffleQuestions: true;
  shuffleChoices: true;
  retakesAllowed: true;
  gatesProgress: true;
  /** Unlocks practice when passed. */
  unlocksStage: "practice";
  questionTypes: ("multiple_choice" | "image_identify")[];
  feedbackRequired: true;
}

export interface CardsMeta {
  estimatedCount: number;
  route: string;
  visualRequired: true;
}

export interface LessonTrackBConfig {
  cards: CardsMeta;
  knowledgeChecks: KnowledgeCheckMeta;
  lessonQuiz: LessonQuizMeta;
}

// ── ILU links ───────────────────────────────────────────────────────────────

export interface IluLink {
  stage: IluStage;
  /** Which tracks consume this link (A = legacy, B = card system). */
  tracks: IluTrack[];
  targetSlug: string;
  targetType: IluTargetType;
  route: string;
  title: string;
  required: boolean;
  /** When true, learner must satisfy stage before prerequisiteStages unlock. */
  gatesProgress: boolean;
  passThreshold?: number;
  prerequisiteStages?: IluStage[];
  /** Deep-link query string params (without leading ?). */
  queryParams?: Record<string, string>;
  /** Conveyor / lab mode hints */
  labMode?: "learn" | "practice" | "guided";
  /** Subset of fault IDs for troubleshoot links */
  faultScope?: string[];
  /** Benchmark simulator lifecycle */
  simulatorStatus?: SimulatorBenchmarkStatus;
  isBenchmark?: boolean;
}

// ── Hub + path units ────────────────────────────────────────────────────────

export interface HubDefinition {
  id: HubId;
  title: string;
  description: string;
  route: string;
  benchmarkSimulatorId: string;
  benchmarkStatus: SimulatorBenchmarkStatus;
  primaryModuleSlugs: string[];
  /** Hub dashboard default lesson order (may differ from course canonical order). */
  hubLessonOrder?: string[];
}

export interface LessonUnit {
  lessonSlug: string;
  lessonTitle: string;
  orderIndex: number;
  lessonFormat: LessonFormat;
  /** Track B card/KC/quiz schema — present even for legacy lessons. */
  trackB: LessonTrackBConfig;
  /** All ILU links; filter by track via `tracks` field. */
  iluLinks: IluLink[];
}

export interface LearningPathUnit {
  pathSlug: string;
  pathTitle: string;
  hubId?: HubId;
  units: LessonUnit[];
}

// ── Practice labs not yet in simulatorCatalog ───────────────────────────────

export interface PracticeLabAsset {
  id: string;
  title: string;
  route: string;
}

export const PRACTICE_LAB_ASSETS: Record<string, PracticeLabAsset> = {
  "relay-simulator": {
    id: "relay-simulator",
    title: "Relay Simulator",
    route: "/labs#relay",
  },
  "circuit-flow-lab": {
    id: "circuit-flow-lab",
    title: "Circuit Flow Lab",
    route: "/labs#circuit",
  },
  "plc-logic-visualizer": {
    id: "plc-logic-visualizer",
    title: "PLC Logic Visualizer",
    route: "/labs#plc",
  },
};

// ── Hub registry ────────────────────────────────────────────────────────────

export const HUB_REGISTRY: HubDefinition[] = [
  {
    id: "plc",
    title: "PLC Hub",
    description: "Allen-Bradley PLC fundamentals, I/O troubleshooting, and ladder logic — anchored on the Conveyor benchmark.",
    route: "/hubs/plc",
    benchmarkSimulatorId: "conveyor-plc-lab",
    benchmarkStatus: "active",
    primaryModuleSlugs: ["plc-fundamentals"],
  },
  {
    id: "vfd",
    title: "PowerFlex VFD Hub",
    description: "Drive diagnostics and parameter practice — troubleshooting-first path with future VFD benchmark lab.",
    route: "/hubs/vfd",
    benchmarkSimulatorId: "powerflex-diagnostic-lab",
    benchmarkStatus: "active",
    primaryModuleSlugs: ["powerflex-vfd"],
    hubLessonOrder: [
      "fault-codes-diagnostics",
      "common-failures",
      "vfd-fundamentals",
      "powerflex-parameter-groups",
      "basic-programming",
      "advanced-features",
    ],
  },
  {
    id: "motor_controls",
    title: "Motor Controls",
    description: "Motor starter circuits, overload protection, and seal-in logic — prerequisite for PLC and VFD hubs.",
    route: "/hubs/motor-controls",
    benchmarkSimulatorId: "conveyor-plc-lab",
    benchmarkStatus: "active",
    primaryModuleSlugs: ["motors-controls"],
  },
  {
    id: "sensors",
    title: "Sensors & Instrumentation",
    description: "Photoelectric, proximity, and loop checkout — PE troubleshooting via Conveyor benchmark.",
    route: "/hubs/sensors",
    benchmarkSimulatorId: "conveyor-plc-lab",
    benchmarkStatus: "active",
    primaryModuleSlugs: ["sensors-instrumentation"],
  },
  {
    id: "safety",
    title: "Safety Systems",
    description: "E-stop chains and risk assessment — E-stop fault via Conveyor benchmark.",
    route: "/hubs/safety",
    benchmarkSimulatorId: "conveyor-plc-lab",
    benchmarkStatus: "active",
    primaryModuleSlugs: ["safety-systems"],
  },
  {
    id: "print_reading",
    title: "Print Reading",
    description: "Ladder conventions and wiring diagrams — ladder panel and print package via Conveyor.",
    route: "/hubs/print-reading",
    benchmarkSimulatorId: "conveyor-plc-lab",
    benchmarkStatus: "active",
    primaryModuleSlugs: ["print-reading"],
  },
];

// ── Accessors ───────────────────────────────────────────────────────────────

export function getHubById(id: HubId): HubDefinition | undefined {
  return HUB_REGISTRY.find((h) => h.id === id);
}

export function getHubByRoute(route: string): HubDefinition | undefined {
  return HUB_REGISTRY.find((h) => h.route === route);
}

export function getAllHubs(): HubDefinition[] {
  return [...HUB_REGISTRY];
}

export function getHubForModule(moduleSlug: string): HubDefinition | undefined {
  return HUB_REGISTRY.find((h) => h.primaryModuleSlugs.includes(moduleSlug));
}

export function courseLessonRoute(moduleSlug: string, lessonSlug: string): string {
  return `/courses/${moduleSlug}/${lessonSlug}`;
}

export function lessonQuizRoute(moduleSlug: string, lessonSlug: string): string {
  return `${courseLessonRoute(moduleSlug, lessonSlug)}#quiz`;
}

export function lessonKnowledgeCheckRoute(moduleSlug: string, lessonSlug: string): string {
  return `${courseLessonRoute(moduleSlug, lessonSlug)}#knowledge-check`;
}

export function lessonAssessRoute(moduleSlug: string, lessonSlug: string): string {
  return `${courseLessonRoute(moduleSlug, lessonSlug)}#assess`;
}

export function moduleQuizRoute(moduleSlug: string): string {
  return `/courses/${moduleSlug}/quiz`;
}

/** Filter ILU links active for a track. */
export function getIluLinksForTrack(links: IluLink[], track: IluTrack): IluLink[] {
  return links.filter((l) => l.tracks.includes(track));
}

/** Ordered stages for display on a track. */
export function getOrderedStagesForTrack(track: IluTrack): readonly IluStage[] {
  return track === "A" ? TRACK_A_ILU_STAGES : TRACK_B_ILU_STAGES;
}

/** Resolve practice/simulator route from catalog or practice lab assets. */
export function resolvePracticeOrSimulatorRoute(targetSlug: string): string | undefined {
  const catalog = getCatalogEntry(targetSlug);
  if (catalog?.route) return catalog.route;
  const practice = PRACTICE_LAB_ASSETS[targetSlug];
  if (practice) return practice.route;
  if (targetSlug === "conveyor-plc-lab") return "/labs#conveyor-troubleshoot";
  if (targetSlug === "powerflex-diagnostic-lab") return "/labs#powerflex-diagnostic";
  const v3Route = `/simulator?scenario=${encodeURIComponent(targetSlug)}`;
  if (SIMULATOR_SCENARIO_IDS.has(targetSlug)) return v3Route;
  return undefined;
}

export function isKnownSimulatorId(id: string): boolean {
  if (FUTURE_SIMULATOR_IDS.includes(id as FutureSimulatorId)) return true;
  if (getCatalogEntry(id)) return true;
  if (SIMULATOR_SCENARIO_IDS.has(id)) return true;
  return false;
}

// ── Validation ──────────────────────────────────────────────────────────────

export interface HubIluValidationIssue {
  path: string;
  message: string;
}

export interface HubIluValidationResult {
  valid: boolean;
  errors: HubIluValidationIssue[];
  warnings: HubIluValidationIssue[];
}

export function validateHubRegistry(): HubIluValidationResult {
  const errors: HubIluValidationIssue[] = [];
  const warnings: HubIluValidationIssue[] = [];
  const ids = new Set<string>();

  for (const hub of HUB_REGISTRY) {
    if (ids.has(hub.id)) {
      errors.push({ path: `hub.${hub.id}`, message: "Duplicate hub id" });
    }
    ids.add(hub.id);

    if (!hub.route.startsWith("/hubs/")) {
      errors.push({ path: `hub.${hub.id}.route`, message: "Hub route must start with /hubs/" });
    }

    if (!isKnownSimulatorId(hub.benchmarkSimulatorId)) {
      errors.push({
        path: `hub.${hub.id}.benchmarkSimulatorId`,
        message: `Unknown benchmark simulator: ${hub.benchmarkSimulatorId}`,
      });
    }

    if (
      hub.benchmarkStatus === "scaffold" &&
      !FUTURE_SIMULATOR_IDS.includes(hub.benchmarkSimulatorId as FutureSimulatorId)
    ) {
      warnings.push({
        path: `hub.${hub.id}.benchmarkStatus`,
        message: `Scaffold status on non-future simulator ${hub.benchmarkSimulatorId}`,
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateLessonUnit(
  pathSlug: string,
  unit: LessonUnit,
  pathIndex: number
): { errors: HubIluValidationIssue[]; warnings: HubIluValidationIssue[] } {
  const errors: HubIluValidationIssue[] = [];
  const warnings: HubIluValidationIssue[] = [];
  const base = `paths.${pathSlug}.units[${pathIndex}].${unit.lessonSlug}`;

  if (unit.trackB.lessonQuiz.passThreshold !== ILU_LESSON_QUIZ_PASS_PERCENT) {
    errors.push({
      path: `${base}.trackB.lessonQuiz.passThreshold`,
      message: `Lesson quiz must use ${ILU_LESSON_QUIZ_PASS_PERCENT}% pass threshold`,
    });
  }

  if (unit.trackB.knowledgeChecks.gatesProgress !== false) {
    errors.push({
      path: `${base}.trackB.knowledgeChecks.gatesProgress`,
      message: "Knowledge checks must not gate progress",
    });
  }

  if (
    unit.trackB.cards.estimatedCount < ILU_CARDS_MIN ||
    unit.trackB.cards.estimatedCount > ILU_CARDS_MAX
  ) {
    warnings.push({
      path: `${base}.trackB.cards.estimatedCount`,
      message: `Card count ${unit.trackB.cards.estimatedCount} outside recommended ${ILU_CARDS_MIN}–${ILU_CARDS_MAX}`,
    });
  }

  const trackALinks = getIluLinksForTrack(unit.iluLinks, "A");
  const trackBLinks = getIluLinksForTrack(unit.iluLinks, "B");

  if (unit.lessonFormat === "legacy_article" && !trackALinks.some((l) => l.stage === "lesson")) {
    errors.push({ path: base, message: "Legacy lesson must have Track A `lesson` stage link" });
  }

  if (!trackBLinks.some((l) => l.stage === "lesson_quiz" && l.gatesProgress)) {
    errors.push({ path: base, message: "Track B must include gating lesson_quiz link" });
  }

  for (const link of unit.iluLinks) {
    if (link.stage === "knowledge_check" && link.gatesProgress) {
      errors.push({
        path: `${base}.iluLinks.${link.stage}`,
        message: "Knowledge check must not gate progress",
      });
    }

    if (link.targetType === "simulator" && !isKnownSimulatorId(link.targetSlug)) {
      errors.push({
        path: `${base}.iluLinks.${link.targetSlug}`,
        message: `Unknown simulator id: ${link.targetSlug}`,
      });
    }

    if (link.targetType === "lab") {
      const route = resolvePracticeOrSimulatorRoute(link.targetSlug);
      if (!route && link.required) {
        warnings.push({
          path: `${base}.iluLinks.${link.targetSlug}`,
          message: `Practice lab route not resolved for required lab: ${link.targetSlug}`,
        });
      }
    }

    if (link.passThreshold != null && link.stage === "lesson_quiz" && link.passThreshold !== ILU_LESSON_QUIZ_PASS_PERCENT) {
      errors.push({
        path: `${base}.iluLinks.${link.stage}`,
        message: `lesson_quiz passThreshold must be ${ILU_LESSON_QUIZ_PASS_PERCENT}`,
      });
    }
  }

  return { errors, warnings };
}

export function validateLessonPracticeMap(paths: LearningPathUnit[]): HubIluValidationResult {
  const errors: HubIluValidationIssue[] = [];
  const warnings: HubIluValidationIssue[] = [];
  const pathSlugs = new Set<string>();

  for (const path of paths) {
    if (pathSlugs.has(path.pathSlug)) {
      errors.push({ path: `paths.${path.pathSlug}`, message: "Duplicate path slug" });
    }
    pathSlugs.add(path.pathSlug);

    if (path.hubId && !getHubById(path.hubId)) {
      errors.push({ path: `paths.${path.pathSlug}.hubId`, message: `Unknown hub: ${path.hubId}` });
    }

    const lessonSlugs = new Set<string>();
    path.units.forEach((unit, idx) => {
      if (lessonSlugs.has(unit.lessonSlug)) {
        errors.push({
          path: `paths.${path.pathSlug}.units`,
          message: `Duplicate lesson slug: ${unit.lessonSlug}`,
        });
      }
      lessonSlugs.add(unit.lessonSlug);

      const { errors: unitErrors, warnings: unitWarnings } = validateLessonUnit(
        path.pathSlug,
        unit,
        idx
      );
      errors.push(...unitErrors);
      warnings.push(...unitWarnings);
    });
  }

  const hubValidation = validateHubRegistry();
  errors.push(...hubValidation.errors);
  warnings.push(...hubValidation.warnings);

  return { valid: errors.length === 0, errors, warnings };
}

export function assertHubIluRegistryValid(paths: LearningPathUnit[]): void {
  const result = validateLessonPracticeMap(paths);
  if (!result.valid) {
    const detail = result.errors.map((e) => `${e.path}: ${e.message}`).join("\n");
    throw new Error(`Hub ILU registry validation failed:\n${detail}`);
  }
}
