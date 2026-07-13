/**
 * EAS Simulator V2 — Immersive Tool-Driven Scenario Data Model
 * 
 * Key differences from V1:
 * - No multiple choice for New/Experienced techs — tool-driven interaction
 * - Progressive information release — observations unlocked by actions
 * - Tiered difficulty adapts hints, complexity, and available tools
 * - Real plant context with stakes
 * - Interactive electrical prints with component states
 */

// === TYPES ===

export type TechRole = "new" | "experienced" | "senior";

export interface PlantContext {
  lineName: string;
  lineNumber: string;
  shift: string;
  shiftTime: string;
  downstreamImpact: string;
  waitingOn: string;
  productionRate: string;
  costPerMinute: string;
  downSince: string;
}

export interface FaultLogEntry {
  timestamp: string;
  source: string;
  code: string;
  description: string;
  severity: "critical" | "warning" | "info";
}

export interface GlossaryTerm {
  term: string;
  abbreviation?: string;
  definition: string;
  /** For New Techs: visual state diagram description */
  stateDiagram?: {
    normalState: string;
    faultState: string;
    normalLabel: string;
    faultLabel: string;
  };
}

// === TOOLS & ACTIONS ===

export type ToolId = "multimeter" | "prints" | "flashlight" | "plc_terminal" | "megger" | "thermal_camera" | "vibration_pen";

export interface Tool {
  id: ToolId;
  name: string;
  icon: string;
  description: string;
  /** Only available at certain tech levels */
  availableFor: TechRole[];
}

export interface MeasurementLocation {
  id: string;
  label: string;
  description: string;
  /** Which tools can be used here */
  compatibleTools: ToolId[];
  /** What you find when you use each tool here */
  readings: Record<ToolId, ToolReading>;
}

export interface ToolReading {
  value: string;
  unit: string;
  interpretation: string;
  /** Is this a key clue toward the root cause? */
  isKeyClue: boolean;
  /** For New Techs: explain what this reading means */
  newTechExplanation?: string;
  /** Animation/visual effect when taking reading */
  visualEffect?: "normal" | "warning" | "critical" | "good";
}

// === CIRCUIT DIAGRAM ===

export interface CircuitComponent {
  id: string;
  type: "contact_no" | "contact_nc" | "coil" | "fuse" | "motor" | "relay" | "estop" | "switch" | "terminal" | "power_supply" | "plc_input" | "plc_output" | "overload" | "contactor";
  label: string;
  /** Position in SVG grid (col, row) */
  position: { col: number; row: number; span?: number };
  /** Current state in this scenario */
  state: "energized" | "de-energized" | "faulted" | "open" | "closed" | "tripped";
  /** What tapping this component reveals */
  tapInfo: {
    function: string;
    currentState: string;
    normalState: string;
    /** For New Techs */
    explanation?: string;
  };
  /** Is this the faulted component? */
  isFaultSource?: boolean;
}

export interface CircuitDiagram {
  title: string;
  type: "ladder" | "safety_circuit" | "power_distribution" | "control_circuit";
  /** Grid-based layout */
  rails: { left: string; right: string };
  rungs: CircuitRung[];
}

export interface CircuitRung {
  id: string;
  label?: string;
  components: CircuitComponent[];
  /** Wire connections between components */
  connections: { from: string; to: string; style?: "normal" | "broken" | "highlighted" }[];
}

// === SCENARIO PHASES ===

export interface ScenarioPhase {
  id: string;
  title: string;
  /** What the learner sees/knows at this point */
  narrative: string;
  /** Measurement locations available in this phase */
  locations: MeasurementLocation[];
  /** Actions that advance to next phase */
  advanceConditions: AdvanceCondition[];
  /** Hints by tech level */
  hints: Record<TechRole, string | null>;
  /** For Senior Tech: reasoning checkpoint (multiple choice) */
  seniorCheckpoint?: SeniorCheckpoint;
  /** Phase-specific diagram state changes */
  diagramUpdates?: Record<string, Partial<CircuitComponent>>;
}

export interface AdvanceCondition {
  /** Which key clues must be discovered */
  requiredClues: string[];
  /** What phase to advance to */
  nextPhaseId: string;
  /** Narrative transition text */
  transitionText: string;
}

export interface SeniorCheckpoint {
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
    scoreImpact: number;
  }[];
}

// === SCORING ===

export interface ScoringRules {
  /** Points for discovering key clues */
  clueDiscovery: number;
  /** Points for efficient tool usage (fewer unnecessary measurements) */
  efficiencyBonus: number;
  /** Points deducted per unnecessary measurement */
  unnecessaryMeasurementPenalty: number;
  /** Points for correct senior checkpoint answers */
  seniorCheckpointCorrect: number;
  /** Points deducted for hints used */
  hintPenalty: number;
  /** Time bonus thresholds */
  timeBonuses: { underMinutes: number; bonus: number }[];
  /** Max possible score */
  maxScore: number;
  /** Passing threshold */
  passingScore: number;
}

// === FULL SCENARIO ===

export interface ScenarioV2 {
  id: string;
  title: string;
  type: string;
  estimatedMinutes: Record<TechRole, number>;
  description: string;
  
  /** Plant context — makes it feel real */
  plantContext: PlantContext;
  
  /** PLC fault log shown at start */
  faultLog: FaultLogEntry[];
  
  /** Glossary terms that appear in this scenario */
  glossary: GlossaryTerm[];
  
  /** Available tools */
  tools: Tool[];
  
  /** Circuit diagram */
  diagram: CircuitDiagram;
  
  /** Scenario phases (progressive) */
  phases: ScenarioPhase[];
  
  /** Scoring rules */
  scoring: ScoringRules;
  
  /** Root cause explanation shown at end */
  rootCause: {
    summary: string;
    technicalDetail: string;
    preventionSteps: string[];
  };
}

// === DEFAULT TOOLS ===

export const DEFAULT_TOOLS: Tool[] = [
  {
    id: "multimeter",
    name: "Digital Multimeter",
    icon: "Gauge",
    description: "Fluke 87V — Measure voltage, current, resistance, continuity",
    availableFor: ["new", "experienced", "senior"],
  },
  {
    id: "prints",
    name: "Electrical Prints",
    icon: "FileText",
    description: "Panel drawings, ladder logic, safety circuit schematics",
    availableFor: ["new", "experienced", "senior"],
  },
  {
    id: "flashlight",
    name: "Flashlight",
    icon: "Flashlight",
    description: "Inspect wiring, connections, physical damage, labels",
    availableFor: ["new", "experienced", "senior"],
  },
  {
    id: "plc_terminal",
    name: "PLC Terminal",
    icon: "Monitor",
    description: "View PLC status, I/O states, fault history, program logic",
    availableFor: ["experienced", "senior"],
  },
  {
    id: "megger",
    name: "Megger (Insulation Tester)",
    icon: "Zap",
    description: "Test insulation resistance on motors and cables",
    availableFor: ["experienced", "senior"],
  },
  {
    id: "thermal_camera",
    name: "Thermal Camera",
    icon: "Activity",
    description: "FLIR — Detect hot spots, loose connections, overloaded components",
    availableFor: ["senior"],
  },
  {
    id: "vibration_pen",
    name: "Vibration Pen",
    icon: "Activity",
    description: "Check bearing condition, motor vibration, mechanical looseness",
    availableFor: ["senior"],
  },
];
