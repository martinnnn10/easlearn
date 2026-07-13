/**
 * V3 Scenario: Motor Overload Trip — Conveyor System
 * 
 * A conveyor motor keeps tripping on overload intermittently. The root cause is a seized idler roller
 * creating excessive mechanical load, but it only happens when product is on the belt.
 * Teaches: differentiating between electrical causes (loose connections, phase imbalance) and mechanical causes (bearing failure, alignment, load).
 */
import {
  ScenarioV3,
  SystemState,
  ScenarioPhase,
  DEFAULT_TOOLS_V3,
} from "./scenariosV3";

const systemStates: Record<string, SystemState> = {
  "overload-tripped": {
    id: "overload-tripped",
    label: "Motor Overload Tripped",
    description: "The 5HP 3-phase conveyor motor has tripped its overload relay. The motor is stopped, and the overload relay needs to be reset.",
    componentStates: {
      "main-disconnect": { state: "closed", terminals: [
        { id: "disc-L1", label: "L1 Input", position: "L1", voltage: "480V", state: "live" },
        { id: "disc-L2", label: "L2 Input", position: "L2", voltage: "480V", state: "live" },
        { id: "disc-L3", label: "L3 Input", position: "L3", voltage: "480V", state: "live" },
      ]},
      "contactor-m1": { state: "de-energized", terminals: [
        { id: "m1-L1", label: "L1 Line", position: "L1", voltage: "480V", state: "live" },
        { id: "m1-L2", label: "L2 Line", position: "L2", voltage: "480V", state: "live" },
        { id: "m1-L3", label: "L3 Line", position: "L3", voltage: "480V", state: "live" },
        { id: "m1-T1", label: "T1 Load", position: "T1", voltage: "0V", state: "dead" },
        { id: "m1-T2", label: "T2 Load", position: "T2", voltage: "0V", state: "dead" },
        { id: "m1-T3", label: "T3 Load", position: "T3", voltage: "0V", state: "dead" },
      ]},
      "overload-ol1": { state: "tripped", terminals: [
        { id: "ol1-95", label: "NC Contact 95", position: "NC", voltage: "120V", state: "live" },
        { id: "ol1-96", label: "NC Contact 96", position: "NC", voltage: "0V", state: "dead" },
      ], appearance: { color: "red", pulse: true }},
      "conveyor-motor": { state: "de-energized", terminals: [
        { id: "mot-T1", label: "Motor T1", position: "T1", voltage: "0V", state: "dead" },
        { id: "mot-T2", label: "Motor T2", position: "T2", voltage: "0V", state: "dead" },
        { id: "mot-T3", label: "Motor T3", position: "T3", voltage: "0V", state: "dead" },
      ]},
      "idler-roller": { state: "faulted", appearance: { color: "orange" } },
    },
    activeAnimations: [
      { type: "indicator_flash", targetId: "overload-ol1", duration: 800, loop: true, intensity: 1.0, color: "red" },
    ],
    availableActions: [
      {
        id: "reset-overload",
        label: "Reset Overload Relay",
        description: "Press the reset button on the overload relay",
        category: "reset",
        targetComponentId: "overload-ol1",
        resultStateId: "motor-running-loaded",
        isCorrect: false,
        consequence: "Overload resets and motor starts, but it will trip again soon because the root cause (mechanical overload) hasn't been fixed.",
        scoreImpact: -5,
        animation: { type: "relay_click", targetId: "overload-ol1", duration: 300 },
        safetyWarning: "Resetting an overload without finding the cause can damage the motor.",
      },
      {
        id: "replace-motor",
        label: "Replace Motor",
        description: "Replace the 5HP motor with a new one",
        category: "replace",
        targetComponentId: "conveyor-motor",
        resultStateId: "overload-tripped",
        isCorrect: false,
        consequence: "New motor installed, but it still trips on overload when loaded. The motor wasn't the problem.",
        scoreImpact: -20,
      },
      {
        id: "replace-overload",
        label: "Replace Overload Relay",
        description: "Install a new overload relay",
        category: "replace",
        targetComponentId: "overload-ol1",
        resultStateId: "overload-tripped",
        isCorrect: false,
        consequence: "New overload relay installed, but it still trips. The relay was doing its job correctly.",
        scoreImpact: -15,
      },
      {
        id: "fix-idler-roller",
        label: "Replace Seized Idler Roller",
        description: "Replace the seized mechanical idler roller on the conveyor",
        category: "replace",
        targetComponentId: "idler-roller",
        resultStateId: "system-fixed",
        isCorrect: true,
        consequence: "Seized roller replaced. Mechanical load is back to normal. Motor runs smoothly without tripping.",
        scoreImpact: 30,
      },
    ],
    visibleFaults: [
      { timestamp: "14:22:10", source: "SCADA", code: "MTR-OVL", description: "Conveyor Motor Overload Trip", severity: "critical" },
    ],
  },
  "motor-running-loaded": {
    id: "motor-running-loaded",
    label: "Motor Running (High Load)",
    description: "The motor is running but drawing excessive current due to the seized idler roller.",
    componentStates: {
      "main-disconnect": { state: "closed" },
      "contactor-m1": { state: "energized", terminals: [
        { id: "m1-T1", label: "T1 Load", position: "T1", voltage: "480V", state: "live" },
        { id: "m1-T2", label: "T2 Load", position: "T2", voltage: "480V", state: "live" },
        { id: "m1-T3", label: "T3 Load", position: "T3", voltage: "480V", state: "live" },
      ]},
      "overload-ol1": { state: "closed", terminals: [
        { id: "ol1-95", label: "NC Contact 95", position: "NC", voltage: "120V", state: "live" },
        { id: "ol1-96", label: "NC Contact 96", position: "NC", voltage: "120V", state: "live" },
      ]},
      "conveyor-motor": { state: "running", terminals: [
        { id: "mot-T1", label: "Motor T1", position: "T1", voltage: "480V", state: "live" },
        { id: "mot-T2", label: "Motor T2", position: "T2", voltage: "480V", state: "live" },
        { id: "mot-T3", label: "Motor T3", position: "T3", voltage: "480V", state: "live" },
      ], appearance: { color: "orange", shake: true }},
      "idler-roller": { state: "faulted", appearance: { color: "red" } },
    },
    activeAnimations: [
      { type: "motor_spin", targetId: "conveyor-motor", duration: 1000, loop: true, intensity: 0.9 },
      { type: "motor_vibrate", targetId: "conveyor-motor", duration: 100, loop: true, intensity: 0.8 },
    ],
    availableActions: [
      {
        id: "fix-idler-roller",
        label: "Replace Seized Idler Roller",
        description: "Replace the seized mechanical idler roller on the conveyor",
        category: "replace",
        targetComponentId: "idler-roller",
        resultStateId: "system-fixed",
        isCorrect: true,
        consequence: "Seized roller replaced. Mechanical load is back to normal. Motor runs smoothly without tripping.",
        scoreImpact: 30,
      },
    ],
    visibleFaults: [],
  },
  "system-fixed": {
    id: "system-fixed",
    label: "System Fixed — Running Normally",
    description: "The seized idler roller has been replaced. The motor is running smoothly with normal current draw.",
    componentStates: {
      "main-disconnect": { state: "closed" },
      "contactor-m1": { state: "energized" },
      "overload-ol1": { state: "closed" },
      "conveyor-motor": { state: "running", appearance: { color: "green" } },
      "idler-roller": { state: "closed", appearance: { color: "green" } },
    },
    activeAnimations: [
      { type: "motor_spin", targetId: "conveyor-motor", duration: 2000, loop: true, intensity: 0.5 },
    ],
    availableActions: [],
    visibleFaults: [],
  },
};

const phases: ScenarioPhase[] = [
  {
    id: "phase-1-diagnose",
    title: "Diagnose Motor Overload",
    narrative: "The food processing packaging line conveyor keeps stopping. The operator says it runs fine empty, but trips out a few minutes after product is loaded onto the belt. You need to figure out if this is an electrical issue (bad motor, loose connection) or a mechanical issue.",
    activeFaultId: "seized-idler",
    initialStateId: "overload-tripped",
    locations: [
      {
        id: "motor-starter",
        label: "Motor Starter Bucket",
        description: "Contains the Size 1 contactor and Allen-Bradley 193-T overload relay",
        compatibleTools: ["multimeter", "flashlight", "thermal_camera"],
        terminalMeasurements: [
          {
            fromTerminal: "ol1-95",
            toTerminal: "ol1-96",
            requiredSetting: "vac",
            reading: "120",
            unit: "V AC",
            isKeyClue: true,
            interpretation: "120V across the NC contacts means the overload has tripped (contacts opened).",
            newTechExplanation: "When the overload trips, its normally closed (NC) contacts open to break the control circuit and stop the motor.",
          },
          {
            fromTerminal: "m1-T1",
            toTerminal: "m1-T2",
            requiredSetting: "amps_ac",
            reading: "0.0",
            unit: "A",
            isKeyClue: false,
            interpretation: "Motor is currently stopped, so no current is flowing.",
            newTechExplanation: "You can't measure running current when the motor is tripped off.",
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "Overload relay indicator shows TRIPPED. Dial is set to 6.8A (correct for this 5HP motor).",
            unit: "",
            interpretation: "The overload is correctly set and has tripped, indicating a genuine overcurrent condition.",
            isKeyClue: true,
          },
        },
      },
      {
        id: "conveyor-motor-loc",
        label: "Conveyor Motor",
        description: "5HP 3-phase induction motor driving the conveyor belt",
        compatibleTools: ["multimeter", "megger", "thermal_camera"],
        terminalMeasurements: [
          {
            fromTerminal: "mot-T1",
            toTerminal: "mot-T2",
            requiredSetting: "ohms",
            reading: "2.4",
            unit: "Ω",
            isKeyClue: false,
            interpretation: "Winding resistance is balanced.",
            newTechExplanation: "Checking phase-to-phase resistance helps rule out a shorted motor winding.",
          },
        ],
        simpleReadings: {
          megger: {
            value: ">500 MΩ to ground on all phases",
            unit: "",
            interpretation: "Motor insulation is good. No ground fault.",
            isKeyClue: false,
          },
          thermal_camera: {
            value: "Motor casing is warm (140°F) but uniform. No localized hot spots.",
            unit: "",
            interpretation: "Motor is running warm due to overload, but doesn't show signs of internal failure.",
            isKeyClue: false,
          },
        },
      },
      {
        id: "conveyor-belt",
        label: "Conveyor Belt & Rollers",
        description: "The mechanical conveyor system",
        compatibleTools: ["flashlight", "thermal_camera"],
        simpleReadings: {
          flashlight: {
            value: "Belt tension looks normal. One idler roller near the middle section looks slightly misaligned and has black rubber dust around it.",
            unit: "",
            interpretation: "Rubber dust indicates excessive friction. The roller might be seized.",
            isKeyClue: true,
            visualEffect: "warning",
          },
          thermal_camera: {
            value: "Idler roller #14 is glowing bright red on the thermal camera (190°F). Other rollers are at ambient temperature (75°F).",
            unit: "",
            interpretation: "The bearing in roller #14 has failed and seized, creating massive friction and mechanical load.",
            isKeyClue: true,
            visualEffect: "critical",
          },
        },
      },
    ],
    advanceConditions: [
      {
        requiredClues: ["ol1-95:ol1-96:vac"],
        requiredAction: "fix-idler-roller",
        nextPhaseId: "complete",
        transitionText: "You correctly identified the mechanical root cause. Replacing the seized idler roller removed the excess load, and the motor now runs normally without tripping.",
        transitionAnimation: { type: "motor_spin", targetId: "conveyor-motor", duration: 1000 },
      },
    ],
    hints: {
      new: "The overload relay tripped, which means the motor was pulling too much current. Check the motor electrically first, but don't forget to inspect the mechanical system it's driving.",
      experienced: "If the motor megger tests fine and winding resistance is balanced, the issue is likely mechanical load. Inspect the conveyor.",
      senior: null,
    },
    seniorCheckpoint: {
      question: "The motor draws 8.5A when loaded, but the nameplate FLA is 6.8A. The voltage is balanced at 478V across all phases. What is the most likely cause?",
      options: [
        { id: "opt1", text: "Single-phasing condition", isCorrect: false, feedback: "Incorrect. Voltage is balanced across all phases.", scoreImpact: -5 },
        { id: "opt2", text: "Mechanical overload", isCorrect: true, feedback: "Correct. Balanced high current with good voltage indicates the motor is simply working too hard against a mechanical load.", scoreImpact: 15 },
        { id: "opt3", text: "Shorted motor winding", isCorrect: false, feedback: "Incorrect. A shorted winding would cause unbalanced current and likely trip a breaker, not just an overload.", scoreImpact: -5 },
      ],
    },
  },
];

export const scenarioMotorOverload: ScenarioV3 = {
  id: "motor-overload-trip-v3",
  title: "Motor Overload Trip — Conveyor System",
  type: "motor_control",
  version: 3,
  estimatedMinutes: { new: 25, experienced: 15, senior: 10 },
  description: "A conveyor motor keeps tripping on overload intermittently. Differentiate between electrical and mechanical causes to find the root cause.",
  faults: [
    {
      id: "seized-idler",
      order: 1,
      name: "Seized Idler Roller",
      description: "A mechanical idler roller on the conveyor has a failed bearing and is seized, causing excessive mechanical load on the motor.",
      componentId: "idler-roller",
      revealedBy: ["ol1-95:ol1-96:vac"],
      correctFixId: "fix-idler-roller",
      rootCause: "Lack of lubrication caused the bearing in idler roller #14 to fail and seize. This created drag on the belt, forcing the motor to work harder and draw more current, eventually tripping the overload relay.",
      technicalDetail: "When a motor is mechanically overloaded, it requires more torque to turn the load. This increased torque requirement causes the motor to draw more current from the supply. If the current exceeds the overload relay setting for a sufficient time, the relay trips to protect the motor windings from thermal damage.",
      preventionSteps: [
        "Implement a regular lubrication schedule for all conveyor bearings.",
        "Perform periodic thermal inspections of rollers to catch failing bearings early.",
        "Monitor motor current trends in SCADA to detect gradual increases in mechanical load.",
      ],
    },
  ],
  plantContext: {
    plantName: "Fresh Foods Processing",
    lineName: "Packaging Line 1",
    lineNumber: "PKG-01",
    shift: "Swing Shift",
    shiftTime: "14:00 - 22:00",
    downstreamImpact: "Product backing up at the filler. Potential for product spoilage if not resolved quickly.",
    waitingOn: "Maintenance Technician",
    productionRate: "120 units/minute",
    costPerMinute: "$150/min",
    downSince: "14:22",
  },
  faultLog: [
    { timestamp: "14:22:10", source: "SCADA", code: "MTR-OVL", description: "Conveyor Motor Overload Trip", severity: "critical" },
  ],
  glossary: [
    {
      term: "Overload Relay",
      definition: "A device designed to protect a motor from overheating due to excessive current draw over time. It monitors the current in the motor leads and opens a control contact if the current exceeds a set threshold for too long.",
    },
    {
      term: "FLA (Full Load Amps)",
      definition: "The current a motor will draw when operating at its rated voltage and producing its rated horsepower. Overload relays are typically set based on this value.",
    },
    {
      term: "Megger (Insulation Resistance Tester)",
      definition: "A tool used to measure the resistance of electrical insulation. It applies a high voltage (e.g., 500V or 1000V) and measures the tiny leakage current to ensure the insulation is intact and not shorted to ground.",
    },
    {
      term: "Thermal Camera",
      definition: "A device that creates an image based on infrared radiation (heat) rather than visible light. Useful for finding hot spots in electrical panels or overheating mechanical components like bearings.",
    },
  ],
  tools: DEFAULT_TOOLS_V3,
  diagram: {
    title: "Conveyor Motor Control",
    type: "motor_starter",
    rails: { left: "L1", right: "N" },
    rungs: [
      {
        id: "rung-control",
        label: "Control Circuit",
        components: [
          { id: "start-stop", type: "switch", label: "Start/Stop", position: { col: 1, row: 1 }, state: "closed", tapInfo: { function: "Operator control", currentState: "ON", normalState: "ON" } },
          { id: "overload-ol1-contact", type: "contact_nc", label: "OL1 (95-96)", position: { col: 2, row: 1 }, state: "open", isFaultSource: true, tapInfo: { function: "Overload protection", currentState: "OPEN (Tripped)", normalState: "CLOSED" } },
          { id: "contactor-coil", type: "coil", label: "M1 Coil", position: { col: 3, row: 1 }, state: "de-energized", tapInfo: { function: "Motor contactor coil", currentState: "OFF", normalState: "ON" } },
        ],
        connections: [
          { from: "start-stop", to: "overload-ol1-contact", style: "normal" },
          { from: "overload-ol1-contact", to: "contactor-coil", style: "broken" },
        ],
      },
      {
        id: "rung-power",
        label: "Power Circuit",
        components: [
          { id: "main-disconnect", type: "disconnect", label: "Disconnect", position: { col: 1, row: 2 }, state: "closed", tapInfo: { function: "Main power", currentState: "ON", normalState: "ON" } },
          { id: "contactor-m1", type: "contactor", label: "M1 Contacts", position: { col: 2, row: 2 }, state: "open", tapInfo: { function: "Motor power switching", currentState: "OPEN", normalState: "CLOSED" } },
          { id: "conveyor-motor", type: "motor", label: "5HP Motor", position: { col: 3, row: 2 }, state: "de-energized", tapInfo: { function: "Conveyor drive", currentState: "STOPPED", normalState: "RUNNING" } },
        ],
        connections: [
          { from: "main-disconnect", to: "contactor-m1", style: "normal" },
          { from: "contactor-m1", to: "conveyor-motor", style: "normal" },
        ],
      },
    ],
  },
  systemStates,
  phases,
  timePressure: [
    { triggerMinutes: 5, from: "Line Operator", role: "Operator", message: "Hey, the line is still down. Product is starting to pile up.", urgency: "medium" },
    { triggerMinutes: 10, from: "Production Supervisor", role: "Supervisor", message: "We are going to have to start dumping product if this isn't fixed soon. What's the hold up?", urgency: "high" },
    { triggerMinutes: 15, from: "Plant Manager", role: "Manager", message: "This downtime is costing us thousands. I need this conveyor running NOW.", urgency: "critical" },
  ],
  communications: [
    { id: "operator-chat", type: "in_person", label: "Talk to Operator", icon: "User", contact: "Line Operator", response: "It runs fine when the belt is empty, but a few minutes after we start loading product, it just stops. I have to wait a bit before I can reset it.", isUseful: true, clueId: "operator-clue" },
    { id: "maint-log", type: "maintenance_log", label: "Check Log", icon: "Clipboard", contact: "CMMS", response: "Last week: Replaced belt lacing. 3 months ago: Replaced motor bearings.", isUseful: true },
    { id: "scada-check", type: "scada_history", label: "Check SCADA", icon: "Monitor", contact: "SCADA System", response: "Motor current trend shows a steady increase over the last 4 hours, peaking at 8.5A before tripping.", isUseful: true, clueId: "scada-clue" },
  ],
  scoring: {
    clueDiscovery: 10,
    efficiencyBonus: 15,
    unnecessaryMeasurementPenalty: -2,
    seniorCheckpointCorrect: 15,
    hintPenalty: -5,
    wrongSettingPenalty: -5,
    unsafeActionPenalty: -20,
    communicationBonus: 5,
    optimalOrderBonus: 10,
    timeBonuses: [
      { underMinutes: 5, bonus: 20 },
      { underMinutes: 10, bonus: 10 },
      { underMinutes: 15, bonus: 5 },
    ],
    maxScore: 100,
    passingScore: 70,
  },
  ambientAnimations: [],
  guidedHints: {
    gather: [
      "Talk to the operator. The fact that it runs empty but trips when loaded is a huge clue.",
      "Check the SCADA history to see what the motor current was doing before it tripped.",
    ],
    prints: [
      "Review the motor starter circuit. The overload relay (OL1) is in series with the contactor coil.",
    ],
    measure: [
      "Verify the overload is actually tripped by measuring voltage across its NC contacts (95-96).",
      "Use the thermal camera on the conveyor belt to look for mechanical friction.",
    ],
    analyze: [
      "If the motor tests fine electrically (good megger, balanced resistance) but draws high current, the load is too heavy.",
      "The thermal camera shows a glowing red idler roller. That's your mechanical overload.",
    ],
    action: [
      "Replace the seized idler roller to remove the excess mechanical load.",
    ],
    coachingOverrides: {
      gather: "Don't just look at the electrical panel. Mechanical problems often cause electrical symptoms (like an overload trip).",
    },
  },
};
