/**
 * EAS Modular Scenario Architecture
 * 
 * Increases replayability and realism without requiring massive standalone content production.
 * 
 * For each existing V3 scenario:
 * - Multiple fault combinations (2-3 fault variants)
 * - Randomized failure conditions (which fault activates on each play)
 * - Difficulty modifiers (component count, fault complexity, available tools)
 * - Timed mode (countdown timer with par time)
 * - Guided learning mode (step-by-step hints, methodology coaching)
 * - Advanced "minimal hints" mode (no hints, no coaching, pure methodology)
 */

import type {
  ScenarioV3,
  TechRole,
  Fault,
  FaultLogEntry,
  SystemState,
  SystemStateId,
  ScenarioPhase,
  TimePressureEvent,
  ScoringRules,
} from "@/data/scenariosV3";

// === PLAY MODES ===

export type PlayMode = "standard" | "timed" | "guided" | "minimal_hints";

export interface PlayModeConfig {
  id: PlayMode;
  label: string;
  description: string;
  icon: string;
  /** Whether hints are available */
  hintsEnabled: boolean;
  /** Whether guided coaching overlay is available */
  guidedCoachingEnabled: boolean;
  /** Whether there's a countdown timer */
  timedCountdown: boolean;
  /** Time limit multiplier (1.0 = par time, 0.75 = 75% of par) */
  timeLimitMultiplier?: number;
  /** Scoring adjustments */
  scoringModifier: "standard" | "lenient" | "strict";
  /** Badge/label shown on results */
  resultBadge: string;
}

export const PLAY_MODES: Record<PlayMode, PlayModeConfig> = {
  standard: {
    id: "standard",
    label: "Standard",
    description: "Normal troubleshooting with hints available on request. Balanced scoring.",
    icon: "Play",
    hintsEnabled: true,
    guidedCoachingEnabled: false,
    timedCountdown: false,
    scoringModifier: "standard",
    resultBadge: "Standard Mode",
  },
  timed: {
    id: "timed",
    label: "Timed Challenge",
    description: "Race against the clock. Par time based on your role. Time efficiency score doubled.",
    icon: "Timer",
    hintsEnabled: true,
    guidedCoachingEnabled: false,
    timedCountdown: true,
    timeLimitMultiplier: 1.5,
    scoringModifier: "standard",
    resultBadge: "Timed Challenge",
  },
  guided: {
    id: "guided",
    label: "Guided Learning",
    description: "Step-by-step methodology coaching. Hints are part of the learning process — reduced hint penalty.",
    icon: "BookOpen",
    hintsEnabled: true,
    guidedCoachingEnabled: true,
    timedCountdown: false,
    scoringModifier: "lenient",
    resultBadge: "Guided Learning",
  },
  minimal_hints: {
    id: "minimal_hints",
    label: "Expert Mode",
    description: "No hints, no coaching. Pure diagnostic methodology. Double hint penalty if you break down and ask.",
    icon: "Shield",
    hintsEnabled: false,
    guidedCoachingEnabled: false,
    timedCountdown: false,
    scoringModifier: "strict",
    resultBadge: "Expert Mode",
  },
};

// === DIFFICULTY MODIFIERS ===

export type DifficultyModifier = "standard" | "reduced_tools" | "time_pressure" | "cascading_faults" | "no_prints" | "degraded_readings";

export interface DifficultyModifierConfig {
  id: DifficultyModifier;
  label: string;
  description: string;
  /** Applied to the scenario before play */
  apply: (scenario: ScenarioV3) => ScenarioV3;
  /** Score multiplier for completing with this modifier */
  scoreMultiplier: number;
}

export const DIFFICULTY_MODIFIERS: Record<DifficultyModifier, DifficultyModifierConfig> = {
  standard: {
    id: "standard",
    label: "Standard",
    description: "No modifications — play the scenario as designed.",
    apply: (s) => s,
    scoreMultiplier: 1.0,
  },
  reduced_tools: {
    id: "reduced_tools",
    label: "Limited Toolkit",
    description: "Only basic tools available (multimeter, flashlight, prints). No PLC terminal, megger, or thermal camera.",
    apply: (scenario) => ({
      ...scenario,
      tools: scenario.tools.filter(t => 
        ["multimeter", "prints", "flashlight", "screwdriver"].includes(t.id)
      ),
    }),
    scoreMultiplier: 1.15,
  },
  time_pressure: {
    id: "time_pressure",
    label: "High Pressure",
    description: "Management contacts start 50% earlier. Production losses are higher.",
    apply: (scenario) => ({
      ...scenario,
      timePressure: scenario.timePressure.map(tp => ({
        ...tp,
        triggerMinutes: Math.max(1, Math.round(tp.triggerMinutes * 0.5)),
      })),
      plantContext: {
        ...scenario.plantContext,
        costPerMinute: `${parseInt(scenario.plantContext.costPerMinute.replace(/[^0-9]/g, "")) * 2}/min lost production`,
      },
    }),
    scoreMultiplier: 1.1,
  },
  cascading_faults: {
    id: "cascading_faults",
    label: "Cascading Faults",
    description: "Incorrect actions may trigger additional faults. Be careful with your repairs.",
    apply: (s) => s, // Handled at runtime by the engine
    scoreMultiplier: 1.2,
  },
  no_prints: {
    id: "no_prints",
    label: "No Prints Available",
    description: "Electrical prints are missing from the panel. Diagnose from memory and measurements only.",
    apply: (scenario) => ({
      ...scenario,
      tools: scenario.tools.filter(t => t.id !== "prints"),
    }),
    scoreMultiplier: 1.25,
  },
  degraded_readings: {
    id: "degraded_readings",
    label: "Noisy Readings",
    description: "Meter readings have slight variations — simulating real-world measurement noise.",
    apply: (s) => s, // Handled at runtime by adding noise to readings
    scoreMultiplier: 1.1,
  },
};

// === FAULT VARIANT SYSTEM ===

/**
 * A fault variant defines an alternative fault configuration for a scenario.
 * Instead of always having the same fault, the scenario can randomly select
 * from multiple possible fault combinations.
 */
export interface FaultVariant {
  id: string;
  label: string;
  description: string;
  /** Which faults are active in this variant */
  faultIds: string[];
  /** Difficulty rating for this variant */
  difficulty: "beginner" | "intermediate" | "advanced";
  /** How many times this variant has been played (for rotation) */
  playCount?: number;
}

/**
 * Scenario variant configuration — extends a base scenario with
 * multiple fault combinations and modifiers.
 */
export interface ScenarioVariantConfig {
  /** Base scenario ID */
  baseScenarioId: string;
  /** Available fault variants */
  faultVariants: FaultVariant[];
  /** Available difficulty modifiers */
  availableModifiers: DifficultyModifier[];
  /** Available play modes */
  availableModes: PlayMode[];
  /** Par times by role (in minutes) — can override base scenario */
  parTimes?: Partial<Record<TechRole, number>>;
}

// === VARIANT REGISTRY ===

/**
 * Registry of modular variants for each V3 scenario.
 * Each scenario gets 2-3 fault variants that can be randomly selected.
 */
export const SCENARIO_VARIANTS: Record<string, ScenarioVariantConfig> = {
  // Multi-fault conveyor scenario
  "conveyor-multi-fault-v3": {
    baseScenarioId: "conveyor-multi-fault-v3",
    faultVariants: [
      {
        id: "default",
        label: "Safety Circuit + Overload",
        description: "E-stop chain fault combined with motor overload relay trip.",
        faultIds: ["estop-chain-open", "overload-tripped"],
        difficulty: "advanced",
      },
      {
        id: "variant-a",
        label: "Safety Circuit Only",
        description: "Single fault — E-stop chain open due to vibration-induced trip.",
        faultIds: ["estop-chain-open"],
        difficulty: "intermediate",
      },
      {
        id: "variant-b",
        label: "Overload + Control Wire",
        description: "Motor overload combined with a loose control wire on the starter.",
        faultIds: ["overload-tripped"],
        difficulty: "intermediate",
      },
    ],
    availableModifiers: ["standard", "reduced_tools", "time_pressure", "no_prints"],
    availableModes: ["standard", "timed", "guided", "minimal_hints"],
  },

  // VFD Overcurrent scenario
  "vfd-overcurrent-v3": {
    baseScenarioId: "vfd-overcurrent-v3",
    faultVariants: [
      {
        id: "default",
        label: "Acceleration Time Reset",
        description: "VFD accel time reset to factory default after weekend maintenance.",
        faultIds: ["accel-too-fast"],
        difficulty: "intermediate",
      },
      {
        id: "variant-a",
        label: "Motor Overload",
        description: "Mechanical overload on conveyor — product jam causing high current draw.",
        faultIds: ["accel-too-fast"],
        difficulty: "beginner",
      },
      {
        id: "variant-b",
        label: "Parameter + Wiring",
        description: "Accel time too fast AND loose output terminal causing intermittent overcurrent.",
        faultIds: ["accel-too-fast"],
        difficulty: "advanced",
      },
    ],
    availableModifiers: ["standard", "reduced_tools", "time_pressure", "degraded_readings"],
    availableModes: ["standard", "timed", "guided", "minimal_hints"],
  },

  // VFD Undervoltage scenario
  "vfd-undervoltage-v3": {
    baseScenarioId: "vfd-undervoltage-v3",
    faultVariants: [
      {
        id: "default",
        label: "DC Bus Undervoltage",
        description: "Input power sag causing DC bus undervoltage trip.",
        faultIds: [],
        difficulty: "intermediate",
      },
      {
        id: "variant-a",
        label: "Loose Input Connection",
        description: "High-resistance connection on input phase causing voltage drop under load.",
        faultIds: [],
        difficulty: "intermediate",
      },
    ],
    availableModifiers: ["standard", "time_pressure", "no_prints"],
    availableModes: ["standard", "timed", "guided", "minimal_hints"],
  },

  // VFD Ground Fault scenario
  "vfd-ground-fault-v3": {
    baseScenarioId: "vfd-ground-fault-v3",
    faultVariants: [
      {
        id: "default",
        label: "Motor Winding Ground Fault",
        description: "Insulation breakdown in motor winding causing ground fault trip.",
        faultIds: [],
        difficulty: "intermediate",
      },
      {
        id: "variant-a",
        label: "Cable Damage",
        description: "Conduit damage from forklift impact causing cable insulation failure.",
        faultIds: [],
        difficulty: "advanced",
      },
    ],
    availableModifiers: ["standard", "reduced_tools", "time_pressure"],
    availableModes: ["standard", "timed", "guided", "minimal_hints"],
  },

  // VFD Cooling Fan scenario
  "vfd-cooling-fan-v3": {
    baseScenarioId: "vfd-cooling-fan-v3",
    faultVariants: [
      {
        id: "default",
        label: "Cooling Fan Failure",
        description: "Internal cooling fan seized, causing heatsink overtemperature.",
        faultIds: [],
        difficulty: "beginner",
      },
      {
        id: "variant-a",
        label: "Blocked Ventilation",
        description: "Panel ventilation blocked by stored materials — ambient overtemp.",
        faultIds: [],
        difficulty: "beginner",
      },
    ],
    availableModifiers: ["standard", "time_pressure"],
    availableModes: ["standard", "timed", "guided", "minimal_hints"],
  },

  // VFD Phase Loss scenario
  "vfd-phase-loss-v3": {
    baseScenarioId: "vfd-phase-loss-v3",
    faultVariants: [
      {
        id: "default",
        label: "Input Phase Loss",
        description: "Lost input phase due to upstream fuse or connection failure.",
        faultIds: [],
        difficulty: "intermediate",
      },
      {
        id: "variant-a",
        label: "Output Phase Loss",
        description: "Output phase loss — motor lead disconnected at VFD terminal.",
        faultIds: [],
        difficulty: "intermediate",
      },
    ],
    availableModifiers: ["standard", "reduced_tools", "no_prints"],
    availableModes: ["standard", "timed", "guided", "minimal_hints"],
  },

  // Blown Fuse scenario
  "blown-fuse-v3": {
    baseScenarioId: "blown-fuse-v3",
    faultVariants: [
      {
        id: "default",
        label: "Control Fuse Blown",
        description: "Control circuit fuse blown due to short in contactor coil wiring.",
        faultIds: [],
        difficulty: "intermediate",
      },
      {
        id: "variant-a",
        label: "Power Fuse Blown",
        description: "Main power fuse blown — motor winding short to ground.",
        faultIds: [],
        difficulty: "advanced",
      },
    ],
    availableModifiers: ["standard", "reduced_tools", "time_pressure", "no_prints"],
    availableModes: ["standard", "timed", "guided", "minimal_hints"],
  },

  // Failed Relay scenario
  "failed-relay-v3": {
    baseScenarioId: "failed-relay-v3",
    faultVariants: [
      {
        id: "default",
        label: "Welded Relay Contact",
        description: "Control relay contacts welded closed — motor won't stop.",
        faultIds: [],
        difficulty: "intermediate",
      },
      {
        id: "variant-a",
        label: "Open Coil",
        description: "Relay coil open — motor won't start despite correct PLC output.",
        faultIds: [],
        difficulty: "intermediate",
      },
      {
        id: "variant-b",
        label: "Intermittent Contact",
        description: "Relay contact intermittent — motor starts then drops out randomly.",
        faultIds: [],
        difficulty: "advanced",
      },
    ],
    availableModifiers: ["standard", "reduced_tools", "time_pressure", "cascading_faults"],
    availableModes: ["standard", "timed", "guided", "minimal_hints"],
  },

  // PLC I/O Fault scenario
  "plc-io-fault-v3": {
    baseScenarioId: "plc-io-fault-v3",
    faultVariants: [
      {
        id: "default",
        label: "Broken Field Wire",
        description: "Proximity sensor wire broken in conduit between field device and PLC input.",
        faultIds: [],
        difficulty: "intermediate",
      },
      {
        id: "variant-a",
        label: "Failed Sensor",
        description: "Proximity sensor failed internally — no output signal despite target present.",
        faultIds: [],
        difficulty: "beginner",
      },
      {
        id: "variant-b",
        label: "Wrong Input Address",
        description: "Sensor wired to wrong terminal after maintenance — PLC reading wrong input.",
        faultIds: [],
        difficulty: "advanced",
      },
    ],
    availableModifiers: ["standard", "reduced_tools", "time_pressure", "no_prints"],
    availableModes: ["standard", "timed", "guided", "minimal_hints"],
  },

  // Motor Overload Trip scenario
  "motor-overload-trip-v3": {
    baseScenarioId: "motor-overload-trip-v3",
    faultVariants: [
      {
        id: "default",
        label: "Seized Idler Roller",
        description: "Mechanical overload from seized idler roller — only trips under product load.",
        faultIds: [],
        difficulty: "intermediate",
      },
      {
        id: "variant-a",
        label: "Phase Imbalance",
        description: "Voltage imbalance causing current imbalance and intermittent overload trips.",
        faultIds: [],
        difficulty: "advanced",
      },
      {
        id: "variant-b",
        label: "Loose Connection",
        description: "High-resistance connection at motor terminal causing localized heating and trips.",
        faultIds: [],
        difficulty: "intermediate",
      },
    ],
    availableModifiers: ["standard", "reduced_tools", "time_pressure", "degraded_readings"],
    availableModes: ["standard", "timed", "guided", "minimal_hints"],
  },

  // Communication Loss scenario
  "comm-loss-v3": {
    baseScenarioId: "comm-loss-v3",
    faultVariants: [
      {
        id: "default",
        label: "Damaged Cable",
        description: "Crushed RJ45 connector from forklift damage causing intermittent EtherNet/IP loss.",
        faultIds: [],
        difficulty: "intermediate",
      },
      {
        id: "variant-a",
        label: "Switch Port Failure",
        description: "Managed switch port intermittently dropping — port statistics show CRC errors.",
        faultIds: [],
        difficulty: "advanced",
      },
      {
        id: "variant-b",
        label: "IP Conflict",
        description: "Duplicate IP address on network after maintenance laptop left connected.",
        faultIds: [],
        difficulty: "beginner",
      },
    ],
    availableModifiers: ["standard", "time_pressure", "no_prints"],
    availableModes: ["standard", "timed", "guided", "minimal_hints"],
  },

  // Intermittent Ground Fault scenario
  "intermittent-ground-fault-v3": {
    baseScenarioId: "intermittent-ground-fault-v3",
    faultVariants: [
      {
        id: "default",
        label: "Damaged Motor Lead Insulation",
        description: "Motor lead insulation breaks down only under load current heating — hardest fault type.",
        faultIds: [],
        difficulty: "advanced",
      },
      {
        id: "variant-a",
        label: "Moisture Ingress",
        description: "Conduit seal failure allowing moisture in — ground fault appears in humid conditions.",
        faultIds: [],
        difficulty: "advanced",
      },
    ],
    availableModifiers: ["standard", "reduced_tools", "time_pressure"],
    availableModes: ["standard", "timed", "guided", "minimal_hints"],
  },
};

// === VARIANT KEY RESOLUTION (scenario id → SCENARIO_VARIANTS registry key) ===

export const SCENARIO_ID_TO_VARIANT_KEY: Record<string, string> = {
  "vfd-conveyor-multifault-v3": "conveyor-multi-fault-v3",
  "vfd-overcurrent-ramp-v3": "vfd-overcurrent-v3",
  "vfd-dc-bus-undervoltage-v3": "vfd-undervoltage-v3",
  "vfd-ground-fault-cable-v3": "vfd-ground-fault-v3",
  "vfd-cooling-fan-seized-v3": "vfd-cooling-fan-v3",
  "vfd-input-phase-loss-v3": "vfd-phase-loss-v3",
  "blown-control-fuse": "blown-fuse-v3",
  "failed-safety-relay": "failed-relay-v3",
  "plc-io-fault-v3": "plc-io-fault-v3",
  "motor-overload-trip-v3": "motor-overload-trip-v3",
  "comm-loss-v3": "comm-loss-v3",
  "intermittent-ground-fault-v3": "intermittent-ground-fault-v3",
};

export function getScenarioVariantConfig(scenarioId: string): ScenarioVariantConfig | null {
  const key = SCENARIO_ID_TO_VARIANT_KEY[scenarioId] ?? scenarioId;
  return SCENARIO_VARIANTS[key] || null;
}

// === HELPER FUNCTIONS ===

/**
 * Get a random fault variant for a scenario, weighted by play history
 * to avoid repeating the same variant.
 */
export function selectRandomVariant(
  scenarioId: string,
  playHistory?: Record<string, number>
): FaultVariant | null {
  const config = getScenarioVariantConfig(scenarioId);
  if (!config || config.faultVariants.length === 0) return null;

  if (!playHistory) {
    // Pure random
    const idx = Math.floor(Math.random() * config.faultVariants.length);
    return config.faultVariants[idx];
  }

  // Weight toward least-played variants
  const variants = config.faultVariants.map(v => ({
    ...v,
    playCount: playHistory[v.id] || 0,
  }));

  const minPlays = Math.min(...variants.map(v => v.playCount));
  const leastPlayed = variants.filter(v => v.playCount === minPlays);
  const idx = Math.floor(Math.random() * leastPlayed.length);
  return leastPlayed[idx];
}

/**
 * Apply a difficulty modifier to a scenario.
 */
export function applyDifficultyModifier(
  scenario: ScenarioV3,
  modifier: DifficultyModifier
): ScenarioV3 {
  return DIFFICULTY_MODIFIERS[modifier].apply(scenario);
}

/**
 * Get the time limit for a timed mode scenario.
 */
export function getTimeLimit(
  scenario: ScenarioV3,
  role: TechRole,
  mode: PlayMode
): number | null {
  if (mode !== "timed") return null;
  const config = PLAY_MODES[mode];
  const parMinutes = scenario.estimatedMinutes[role];
  const multiplier = config.timeLimitMultiplier || 1.5;
  return Math.round(parMinutes * multiplier * 60); // Return seconds
}

/**
 * Get all available configurations for a scenario.
 */
export function getScenarioConfig(scenarioId: string): ScenarioVariantConfig | null {
  return getScenarioVariantConfig(scenarioId);
}

/**
 * Calculate adjusted scoring rules based on play mode and difficulty modifier.
 */
export function getAdjustedScoringRules(
  baseScoringRules: ScoringRules,
  mode: PlayMode,
  modifier: DifficultyModifier
): ScoringRules {
  const modeConfig = PLAY_MODES[mode];
  const modConfig = DIFFICULTY_MODIFIERS[modifier];
  
  let rules = { ...baseScoringRules };

  // Apply mode adjustments
  if (modeConfig.scoringModifier === "lenient") {
    rules.hintPenalty = Math.round(rules.hintPenalty * 0.5);
    rules.unnecessaryMeasurementPenalty = Math.round(rules.unnecessaryMeasurementPenalty * 0.7);
  } else if (modeConfig.scoringModifier === "strict") {
    rules.hintPenalty = Math.round(rules.hintPenalty * 2);
    rules.wrongSettingPenalty = Math.round(rules.wrongSettingPenalty * 1.5);
    rules.unsafeActionPenalty = Math.round(rules.unsafeActionPenalty * 1.5);
  }

  // Apply difficulty multiplier to max score
  rules.maxScore = Math.round(rules.maxScore * modConfig.scoreMultiplier);

  return rules;
}

/**
 * Get a summary label for the current configuration.
 */
export function getConfigLabel(
  variant: FaultVariant | null,
  mode: PlayMode,
  modifier: DifficultyModifier
): string {
  const parts: string[] = [];
  if (variant && variant.id !== "default") parts.push(variant.label);
  if (mode !== "standard") parts.push(PLAY_MODES[mode].label);
  if (modifier !== "standard") parts.push(DIFFICULTY_MODIFIERS[modifier].label);
  return parts.length > 0 ? parts.join(" + ") : "Standard";
}
