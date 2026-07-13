/**
 * EAS Simulator V3 — Advanced Market-Leading Scenario Data Model
 * 
 * Key advances over V2:
 * - Multi-fault scenarios with sequential fault discovery
 * - Dynamic system state that changes in real-time based on actions
 * - Wiring-level terminal interaction (specific terminals + meter settings)
 * - Time pressure with escalating management involvement
 * - Communication layer (radio operator, call electrician, maintenance log)
 * - Consequence branching (bad decisions have downstream effects)
 * - Rich animation triggers (sparks, current flow, motor rotation, etc.)
 */

// === TYPES ===

export type TechRole = "new" | "experienced" | "senior";

export type MeterSetting = "vac" | "vdc" | "ohms" | "continuity" | "amps_ac" | "amps_dc" | "diode" | "capacitance";

export type AnimationType =
  | "current_flow"       // Animated particles along wires
  | "spark"             // Arc/spark effect at a point
  | "motor_spin"        // Motor rotation animation
  | "motor_vibrate"     // Motor vibration (bad bearing)
  | "relay_click"       // Relay armature movement
  | "breaker_trip"      // Mechanical snap animation
  | "wire_heat"         // Wire glowing red/orange
  | "smoke"             // Smoke/heat shimmer
  | "led_blink"         // PLC LED pattern
  | "meter_sweep"       // Analog needle sweep to reading
  | "contactor_pull"    // Contactor pulling in
  | "fuse_blow"         // Fuse element melting
  | "arc_flash"         // Dangerous arc flash warning
  | "indicator_flash"   // Panel indicator flashing
  | "cable_sag"         // Damaged cable visual
  | "thermal_gradient"; // Heat map overlay

export interface AnimationTrigger {
  type: AnimationType;
  /** Where on the diagram (component ID or coordinates) */
  targetId: string;
  /** Duration in ms */
  duration: number;
  /** Delay before starting */
  delay?: number;
  /** Whether it loops */
  loop?: boolean;
  /** Intensity 0-1 */
  intensity?: number;
  /** Color override */
  color?: string;
  /** Sound effect ID */
  soundEffect?: string;
}

// === PLANT CONTEXT ===

export interface PlantContext {
  plantName: string;
  lineName: string;
  lineNumber: string;
  shift: string;
  shiftTime: string;
  downstreamImpact: string;
  waitingOn: string;
  productionRate: string;
  costPerMinute: string;
  downSince: string;
  /** Additional environmental details */
  temperature?: string;
  humidity?: string;
  lastPMDate?: string;
  machineAge?: string;
}

// === TIME PRESSURE ===

export interface TimePressureEvent {
  /** Minutes into the scenario this triggers */
  triggerMinutes: number;
  /** Who's contacting you */
  from: string;
  /** Their role/title */
  role: string;
  /** What they say */
  message: string;
  /** Urgency level affects UI intensity */
  urgency: "low" | "medium" | "high" | "critical";
  /** Optional response options */
  responses?: {
    text: string;
    effect: string; // description of what happens
    scoreImpact: number;
  }[];
}

// === COMMUNICATION ===

export interface CommunicationChannel {
  id: string;
  type: "radio" | "phone" | "in_person" | "maintenance_log" | "scada_history";
  label: string;
  icon: string;
  /** Who you're contacting */
  contact: string;
  /** What they tell you */
  response: string;
  /** Is this information useful? */
  isUseful: boolean;
  /** Does this count as a clue? */
  clueId?: string;
  /** Only available after certain conditions */
  availableAfter?: string[];
  /** Animation when activated */
  animation?: AnimationTrigger;
}

// === WIRING-LEVEL TERMINALS ===

export interface Terminal {
  id: string;
  label: string;
  /** Physical position on component (top, bottom, left, right, numbered) */
  position: "T1" | "T2" | "T3" | "T4" | "L1" | "L2" | "L3" | "N" | "GND" | "COM" | "NO" | "NC" | "A1" | "A2" | "13" | "14" | "23" | "24" | "S1" | "S2";
  /** What voltage/signal is present */
  voltage?: string;
  /** Connection state */
  state: "live" | "dead" | "floating" | "grounded" | "intermittent";
}

export interface TerminalMeasurement {
  /** From terminal ID */
  fromTerminal: string;
  /** To terminal ID (for voltage measurements between two points) */
  toTerminal: string;
  /** Required meter setting to get a valid reading */
  requiredSetting: MeterSetting;
  /** What you read */
  reading: string;
  unit: string;
  /** What happens if you use the wrong setting */
  wrongSettingResult?: string;
  /** Is this a key clue? */
  isKeyClue: boolean;
  /** Interpretation */
  interpretation: string;
  /** Animation triggered by this measurement */
  animation?: AnimationTrigger;
  /** For new techs */
  newTechExplanation?: string;
}

// === DYNAMIC SYSTEM STATE ===

export type SystemStateId = string;

export interface SystemState {
  id: SystemStateId;
  label: string;
  description: string;
  /** Which components are in what state */
  componentStates: Record<string, ComponentDynamicState>;
  /** Active animations in this state */
  activeAnimations: AnimationTrigger[];
  /** Available actions the learner can take */
  availableActions: SystemAction[];
  /** Fault log entries visible in this state */
  visibleFaults: FaultLogEntry[];
}

export interface ComponentDynamicState {
  state: "energized" | "de-energized" | "faulted" | "open" | "closed" | "tripped" | "running" | "stalled" | "overheating" | "intermittent";
  /** Terminal states */
  terminals?: Terminal[];
  /** Visual appearance override */
  appearance?: {
    color?: string;
    glow?: boolean;
    pulse?: boolean;
    shake?: boolean;
    opacity?: number;
  };
}

export interface SystemAction {
  id: string;
  label: string;
  description: string;
  /** Category of action */
  category: "reset" | "bypass" | "replace" | "adjust" | "lockout" | "test" | "disconnect" | "reconnect";
  /** Which component this acts on */
  targetComponentId: string;
  /** What state does the system transition to? */
  resultStateId: SystemStateId;
  /** Is this the correct action? */
  isCorrect: boolean;
  /** Consequence description */
  consequence: string;
  /** Score impact */
  scoreImpact: number;
  /** Animation triggered */
  animation?: AnimationTrigger;
  /** Does this reveal a new fault? (multi-fault) */
  revealsNextFault?: boolean;
  /** Warning shown before action (safety concern) */
  safetyWarning?: string;
  /** Only available at certain roles */
  availableFor?: TechRole[];
}

// === FAULT SYSTEM ===

export interface Fault {
  id: string;
  order: number; // 1 = primary, 2 = secondary (revealed after fixing first), etc.
  name: string;
  description: string;
  /** Component that's faulted */
  componentId: string;
  /** What terminal measurement reveals this */
  revealedBy: string[]; // terminal measurement IDs
  /** Correct fix action */
  correctFixId: string;
  /** Root cause explanation */
  rootCause: string;
  technicalDetail: string;
  preventionSteps: string[];
}

export interface FaultLogEntry {
  timestamp: string;
  source: string;
  code: string;
  description: string;
  severity: "critical" | "warning" | "info";
  /** Blinking animation on PLC */
  plcModule?: string;
}

// === GLOSSARY ===

export interface GlossaryTerm {
  term: string;
  abbreviation?: string;
  definition: string;
  stateDiagram?: {
    normalState: string;
    faultState: string;
    normalLabel: string;
    faultLabel: string;
  };
}

// === TOOLS (ENHANCED) ===

export type ToolId = "multimeter" | "prints" | "flashlight" | "plc_terminal" | "megger" | "thermal_camera" | "vibration_pen" | "screwdriver" | "wire_tracer";

export interface Tool {
  id: ToolId;
  name: string;
  icon: string;
  description: string;
  availableFor: TechRole[];
  /** Meter settings available (only for multimeter/megger) */
  meterSettings?: MeterSetting[];
}

// === CIRCUIT DIAGRAM (ENHANCED) ===

export interface CircuitComponent {
  id: string;
  type: "contact_no" | "contact_nc" | "coil" | "fuse" | "motor" | "relay" | "estop" | "switch" | "terminal" | "power_supply" | "plc_input" | "plc_output" | "overload" | "contactor" | "vfd" | "transformer" | "disconnect" | "breaker";
  label: string;
  position: { col: number; row: number; span?: number };
  state: "energized" | "de-energized" | "faulted" | "open" | "closed" | "tripped" | "running" | "stalled" | "overheating";
  tapInfo: {
    function: string;
    currentState: string;
    normalState: string;
    explanation?: string;
  };
  isFaultSource?: boolean;
  /** Terminals on this component */
  terminals?: Terminal[];
  /** Active animation on this component */
  animation?: AnimationTrigger;
}

export interface CircuitDiagram {
  title: string;
  type: "ladder" | "safety_circuit" | "power_distribution" | "control_circuit" | "vfd_power" | "motor_starter";
  rails: { left: string; right: string };
  rungs: CircuitRung[];
}

export interface CircuitRung {
  id: string;
  label?: string;
  components: CircuitComponent[];
  connections: { from: string; to: string; style?: "normal" | "broken" | "highlighted" | "heated" }[];
}

// === MEASUREMENT LOCATIONS (ENHANCED) ===

export interface MeasurementLocation {
  id: string;
  label: string;
  description: string;
  compatibleTools: ToolId[];
  /** Terminal-level measurements available here */
  terminalMeasurements?: TerminalMeasurement[];
  /** Simple readings (for non-terminal tools like flashlight) */
  simpleReadings?: Partial<Record<ToolId, SimpleReading>>;
  /** Animation when investigating this location */
  investigateAnimation?: AnimationTrigger;
}

export interface SimpleReading {
  value: string;
  unit: string;
  interpretation: string;
  isKeyClue: boolean;
  newTechExplanation?: string;
  visualEffect?: "normal" | "warning" | "critical" | "good";
  animation?: AnimationTrigger;
}

// === SCENARIO PHASES (ENHANCED) ===

export interface ScenarioPhase {
  id: string;
  title: string;
  narrative: string;
  /** Which fault is active in this phase */
  activeFaultId: string;
  /** Initial system state for this phase */
  initialStateId: SystemStateId;
  /** Measurement locations */
  locations: MeasurementLocation[];
  /** Communication channels available */
  communications?: CommunicationChannel[];
  /** Advance conditions */
  advanceConditions: AdvanceCondition[];
  /** Hints by role */
  hints: Record<TechRole, string | null>;
  /** Senior checkpoint */
  seniorCheckpoint?: SeniorCheckpoint;
  /** Diagram updates for this phase */
  diagramUpdates?: Record<string, Partial<CircuitComponent>>;
  /** Time pressure events specific to this phase */
  timePressureEvents?: TimePressureEvent[];
}

export interface AdvanceCondition {
  requiredClues: string[];
  /** Must also perform the correct fix action */
  requiredAction?: string;
  nextPhaseId: string | "complete";
  transitionText: string;
  /** Animation on transition */
  transitionAnimation?: AnimationTrigger;
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

// === SCORING (ENHANCED) ===

export interface ScoringRules {
  clueDiscovery: number;
  efficiencyBonus: number;
  unnecessaryMeasurementPenalty: number;
  seniorCheckpointCorrect: number;
  hintPenalty: number;
  /** Penalty for wrong meter setting */
  wrongSettingPenalty: number;
  /** Penalty for unsafe action */
  unsafeActionPenalty: number;
  /** Bonus for using communication effectively */
  communicationBonus: number;
  /** Bonus for fixing faults in optimal order */
  optimalOrderBonus: number;
  timeBonuses: { underMinutes: number; bonus: number }[];
  maxScore: number;
  passingScore: number;
}

// === FULL SCENARIO V3 ===

export interface ScenarioV3 {
  id: string;
  title: string;
  type: string;
  version: 3;
  estimatedMinutes: Record<TechRole, number>;
  description: string;
  
  /** Multi-fault: ordered list of faults to discover and fix */
  faults: Fault[];
  
  /** Plant context */
  plantContext: PlantContext;
  
  /** PLC fault log */
  faultLog: FaultLogEntry[];
  
  /** Glossary */
  glossary: GlossaryTerm[];
  
  /** Available tools */
  tools: Tool[];
  
  /** Circuit diagram */
  diagram: CircuitDiagram;
  
  /** Dynamic system states */
  systemStates: Record<SystemStateId, SystemState>;
  
  /** Scenario phases */
  phases: ScenarioPhase[];
  
  /** Time pressure events (global) */
  timePressure: TimePressureEvent[];
  
  /** Communication channels */
  communications: CommunicationChannel[];
  
  /** Scoring rules */
  scoring: ScoringRules;
  
  /** Ambient animations (always running) */
  ambientAnimations: AnimationTrigger[];

  /** Optional scenario-specific guided troubleshooting hints */
  guidedHints?: {
    /** Scenario-specific gather information hints */
    gather?: string[];
    /** Scenario-specific review prints hints */
    prints?: string[];
    /** Scenario-specific measurement hints */
    measure?: string[];
    /** Scenario-specific analysis hints */
    analyze?: string[];
    /** Scenario-specific action hints */
    action?: string[];
    /** Scenario-specific coaching text overrides per step */
    coachingOverrides?: Partial<Record<"gather" | "prints" | "measure" | "analyze" | "action", string>>;
  };
}

// === DEFAULT TOOLS V3 ===

export const DEFAULT_TOOLS_V3: Tool[] = [
  {
    id: "multimeter",
    name: "Fluke 87V",
    icon: "Gauge",
    description: "Digital multimeter — select setting before measuring",
    availableFor: ["new", "experienced", "senior"],
    meterSettings: ["vac", "vdc", "ohms", "continuity", "amps_ac", "diode"],
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
    name: "Laptop (RSLogix)",
    icon: "Monitor",
    description: "View PLC status, I/O states, fault history, program logic",
    availableFor: ["experienced", "senior"],
  },
  {
    id: "megger",
    name: "Megger 500V",
    icon: "Zap",
    description: "Insulation resistance tester — motor windings, cables",
    availableFor: ["experienced", "senior"],
    meterSettings: ["ohms"],
  },
  {
    id: "thermal_camera",
    name: "FLIR E8",
    icon: "Thermometer",
    description: "Infrared thermal imaging — hot spots, loose connections",
    availableFor: ["senior"],
  },
  {
    id: "vibration_pen",
    name: "SKF Vibration Pen",
    icon: "Activity",
    description: "Bearing condition, motor vibration, mechanical looseness",
    availableFor: ["senior"],
  },
  {
    id: "screwdriver",
    name: "Insulated Screwdriver",
    icon: "Wrench",
    description: "Tighten terminals, remove covers, adjust potentiometers",
    availableFor: ["new", "experienced", "senior"],
  },
  {
    id: "wire_tracer",
    name: "Tone Generator",
    icon: "Radio",
    description: "Trace wires through conduit, identify conductors",
    availableFor: ["experienced", "senior"],
  },
];

// === METER SETTING LABELS ===

export const METER_SETTING_LABELS: Record<MeterSetting, string> = {
  vac: "V AC",
  vdc: "V DC",
  ohms: "Ω (Resistance)",
  continuity: "Continuity",
  amps_ac: "A AC",
  amps_dc: "A DC",
  diode: "Diode Test",
  capacitance: "Capacitance",
};
