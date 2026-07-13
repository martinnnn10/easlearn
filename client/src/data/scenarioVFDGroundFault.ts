/**
 * EAS Simulator V3 — VFD Ground Fault Scenario
 * 
 * "Ground Fault on VFD Output — CNC Coolant Pump"
 * 
 * Single fault: Damaged motor cable insulation from conduit chafing.
 * Wire insulation worn through where cable enters motor junction box.
 */

import type {
  ScenarioV3,
  SystemState,
  ScenarioPhase,
  CommunicationChannel,
  TimePressureEvent,
  Fault,
  FaultLogEntry,
  GlossaryTerm,
  CircuitDiagram,
  AnimationTrigger,
} from "./scenariosV3";
import { DEFAULT_TOOLS_V3 } from "./scenariosV3";

const faults: Fault[] = [
  {
    id: "cable-ground-fault",
    order: 1,
    name: "Output Cable Insulation Failure",
    description: "VFD output cable T2 has chafed through conduit fitting, creating intermittent ground fault.",
    componentId: "cable-t2",
    revealedBy: ["megger-test-cable", "visual-conduit"],
    correctFixId: "replace-cable",
    rootCause: "The VFD output cable (3-conductor #10 THHN in 3/4\" EMT) has been chafing against a sharp edge on the conduit connector at the motor junction box entry. Over 5 years of motor vibration, the T2 conductor insulation has worn through, exposing bare copper that intermittently contacts the grounded conduit. The ground fault is load-dependent — under vibration and thermal expansion during operation, contact is made.",
    technicalDetail: "Ground fault current path: VFD T2 output → cable conductor → exposed copper → EMT conduit → equipment ground → VFD ground bus. The VFD's ground fault detection (measuring current imbalance between output phases) detects >5A leakage and trips on F007. At rest, insulation resistance measures 0.8MΩ (marginal). Under vibration, it drops to near zero as the bare conductor touches the conduit.",
    preventionSteps: [
      "Use proper strain relief and bushings at all conduit entries",
      "Inspect cable entry points during annual PM for chafing signs",
      "Use liquid-tight flexible conduit for last 12 inches to motor (absorbs vibration)",
      "Apply anti-chafe wrap at conduit entry points",
      "Megger test VFD output cables annually — trend the results",
    ],
  },
];

const faultLog: FaultLogEntry[] = [
  { timestamp: "14:22:08.556", source: "VFD-05", code: "F007", description: "GROUND FAULT — output phase current imbalance >5A detected", severity: "critical" },
  { timestamp: "14:22:08.500", source: "VFD-05", code: "A012", description: "Phase currents: T1=6.2A, T2=1.1A, T3=6.4A — T2 LOW", severity: "critical" },
  { timestamp: "14:22:08.450", source: "VFD-05", code: "A015", description: "Ground current detected: 5.3A on equipment ground", severity: "critical" },
  { timestamp: "13:45:22.100", source: "VFD-05", code: "F007", description: "GROUND FAULT — 2nd occurrence (reset at 13:50)", severity: "critical" },
  { timestamp: "11:15:33.445", source: "VFD-05", code: "F007", description: "GROUND FAULT — 1st occurrence today (reset at 11:20)", severity: "critical" },
  { timestamp: "11:15:33.400", source: "VFD-05", code: "A015", description: "Ground current: 4.8A — approaching trip threshold", severity: "warning" },
];

const plantContext = {
  plantName: "Precision Machining Inc. — Shop Floor",
  lineName: "CNC Cell 4 — Coolant Recirculation Pump",
  lineNumber: "CNC-04-PUMP-01",
  shift: "2nd Shift",
  shiftTime: "14:00 – 22:00",
  downstreamImpact: "CNC lathe cannot run without coolant — $180/hr machine idle",
  waitingOn: "CNC operator waiting, 3 parts behind schedule on rush order",
  productionRate: "6 parts/hr ($320/part)",
  costPerMinute: "$32/min machine downtime",
  downSince: "14:22 (3rd trip today, getting more frequent)",
  temperature: "75°F (shop floor)",
  humidity: "50%",
  lastPMDate: "3 months ago (motor greased, no cable inspection)",
  machineAge: "5 years (VFD and motor installed together)",
};

const glossary: GlossaryTerm[] = [
  {
    term: "ground fault",
    definition: "An unintended current path from a conductor to ground (earth). In a VFD system, ground faults are detected by measuring the imbalance between output phase currents — if current is 'leaking' to ground through damaged insulation, one phase will show lower current than the others.",
    stateDiagram: {
      normalState: "Phase currents: Balanced (±0.5A)\nGround current: <0.5A\nInsulation: >100MΩ",
      faultState: "Phase currents: IMBALANCED\nGround current: >5A\nInsulation: <1MΩ (damaged)",
      normalLabel: "Healthy insulation",
      faultLabel: "Ground fault — current leaking",
    },
  },
  {
    term: "F007",
    abbreviation: "Ground Fault",
    definition: "PowerFlex fault code indicating output current imbalance exceeding the ground fault threshold. The drive measures all three output currents — if they don't sum to zero, current is leaking to ground somewhere between the VFD output and the motor.",
  },
  {
    term: "megger",
    definition: "An insulation resistance tester that applies 500V or 1000V DC to measure resistance between conductors and ground. Good cable insulation reads >100MΩ. Below 2MΩ indicates degradation. Below 1MΩ requires immediate replacement.",
  },
  {
    term: "insulation resistance",
    definition: "The resistance between a current-carrying conductor and ground. Measured in megohms (MΩ). Decreases with moisture, heat damage, mechanical damage, or aging. Industry minimum for motor circuits: 2MΩ (IEEE 43). Below 1MΩ is a failure.",
  },
];

const diagram: CircuitDiagram = {
  title: "CNC-04 Coolant Pump — VFD Output Circuit",
  type: "vfd_power",
  rails: { left: "L1 (480V)", right: "L3 (480V)" },
  rungs: [
    {
      id: "rung-1",
      label: "VFD Output to Motor",
      components: [
        { id: "vfd-1", type: "vfd", label: "PowerFlex 525 (3HP)", position: { col: 0, row: 0 }, state: "faulted", tapInfo: { function: "3HP VFD — coolant pump speed control", currentState: "FAULTED — F007 Ground Fault", normalState: "Running at 55Hz" } },
        { id: "cable-t1", type: "terminal", label: "Cable T1", position: { col: 1, row: 0 }, state: "energized", tapInfo: { function: "Output conductor T1 in EMT conduit", currentState: "OK — insulation intact", normalState: "Carrying 6.2A" } },
        { id: "cable-t2", type: "terminal", label: "Cable T2", position: { col: 2, row: 0 }, state: "faulted", isFaultSource: true, tapInfo: { function: "Output conductor T2 — DAMAGED at conduit entry", currentState: "GROUND FAULT — insulation chafed through", normalState: "Carrying 6.2A" } },
        { id: "cable-t3", type: "terminal", label: "Cable T3", position: { col: 3, row: 0 }, state: "energized", tapInfo: { function: "Output conductor T3 in EMT conduit", currentState: "OK — insulation intact", normalState: "Carrying 6.2A" } },
        { id: "motor-1", type: "motor", label: "Pump Motor (3HP)", position: { col: 4, row: 0 }, state: "stalled", tapInfo: { function: "3HP motor — drives coolant pump impeller", currentState: "STOPPED — drive faulted", normalState: "Running at 3300 RPM" } },
      ],
      connections: [
        { from: "vfd-1", to: "cable-t1", style: "normal" },
        { from: "cable-t1", to: "cable-t2", style: "normal" },
        { from: "cable-t2", to: "cable-t3", style: "broken" },
        { from: "cable-t3", to: "motor-1", style: "normal" },
      ],
    },
  ],
};

const systemStates: Record<string, SystemState> = {
  "ground-fault-active": {
    id: "ground-fault-active",
    label: "VFD Faulted — F007 Ground Fault",
    description: "Output cable T2 has ground fault. Current leaking to conduit. Drive tripped on phase imbalance.",
    componentStates: {
      "vfd-1": { state: "faulted", appearance: { glow: true, color: "red" } },
      "cable-t2": { state: "faulted", appearance: { pulse: true, color: "amber" } },
      "motor-1": { state: "stalled" },
    },
    activeAnimations: [
      { type: "led_blink", targetId: "vfd-1", duration: 99999, loop: true, color: "red" },
      { type: "spark", targetId: "cable-t2", duration: 99999, loop: true, intensity: 0.3 },
    ],
    availableActions: [
      {
        id: "replace-cable",
        label: "Replace damaged cable section with new pull + liquid-tight connector",
        description: "Pull new cable, install proper strain relief and liquid-tight fitting at motor entry",
        category: "replace",
        targetComponentId: "cable-t2",
        resultStateId: "fixed-running",
        isCorrect: true,
        consequence: "New cable pulled with liquid-tight flexible conduit at motor entry. Megger test: >500MΩ all phases to ground. VFD starts — currents balanced at 6.2A/6.3A/6.2A. Pump running smoothly.",
        scoreImpact: 30,
        animation: { type: "current_flow", targetId: "vfd-1", duration: 3000, intensity: 0.4 },
      },
      {
        id: "reset-and-run",
        label: "Reset fault and restart pump",
        description: "Clear F007 and attempt to run — maybe it was a fluke",
        category: "reset",
        targetComponentId: "vfd-1",
        resultStateId: "ground-fault-active",
        isCorrect: false,
        consequence: "Drive resets and starts. Runs for 2 minutes then trips again on F007. The ground fault is intermittent but getting worse with each thermal cycle. Repeated resets risk VFD damage from ground fault current.",
        scoreImpact: -10,
        safetyWarning: "Running with a known ground fault risks electric shock, VFD damage, and potential fire from arcing at the fault point.",
      },
      {
        id: "replace-motor",
        label: "Replace motor — suspect winding ground fault",
        description: "Swap motor with spare from storeroom",
        category: "replace",
        targetComponentId: "motor-1",
        resultStateId: "ground-fault-active",
        isCorrect: false,
        consequence: "New motor installed. Same F007 fault on startup. The ground fault is in the CABLE between the VFD and motor, not in the motor itself. Megger testing the cable separately would have identified this.",
        scoreImpact: -15,
      },
      {
        id: "tape-repair",
        label: "Tape the damaged insulation and reinstall",
        description: "Wrap electrical tape around the damaged section",
        category: "replace",
        targetComponentId: "cable-t2",
        resultStateId: "ground-fault-active",
        isCorrect: false,
        consequence: "Tape applied but the sharp conduit edge is still there. Within a week, vibration will wear through the tape and the fault will return. Plus, tape is not rated for the voltage and temperature inside the conduit. This is a code violation.",
        scoreImpact: -10,
        safetyWarning: "Electrical tape is not an acceptable repair for conductor insulation in a conduit. NEC requires proper cable replacement.",
      },
    ],
    visibleFaults: faultLog,
  },
  "fixed-running": {
    id: "fixed-running",
    label: "System Running — Cable Replaced",
    description: "New cable installed with proper strain relief. All phases balanced. Pump running normally.",
    componentStates: {
      "vfd-1": { state: "energized", appearance: { color: "green" } },
      "cable-t2": { state: "energized", appearance: { color: "green" } },
      "motor-1": { state: "running", appearance: { color: "green" } },
    },
    activeAnimations: [
      { type: "motor_spin", targetId: "motor-1", duration: 99999, loop: true },
      { type: "current_flow", targetId: "vfd-1", duration: 99999, loop: true, intensity: 0.3 },
    ],
    availableActions: [],
    visibleFaults: [
      { timestamp: "15:10:00.000", source: "SYSTEM", code: "OK", description: "Cable replaced — all phases balanced, insulation >500MΩ", severity: "info" },
    ],
  },
};

const timePressure: TimePressureEvent[] = [
  {
    triggerMinutes: 3,
    from: "Jim",
    role: "CNC Operator",
    message: "I can't run without coolant. The tool will burn up in seconds. I've got 3 parts to finish on this rush order — customer needs them by 6 PM.",
    urgency: "medium",
  },
  {
    triggerMinutes: 7,
    from: "Shop Foreman",
    role: "Production",
    message: "Jim says his machine is down because of the coolant pump. That's a $180/hr machine sitting idle. What do you need to fix this?",
    urgency: "high",
  },
  {
    triggerMinutes: 11,
    from: "Shop Owner",
    role: "Management",
    message: "We're going to miss the 6 PM deadline on the Aerospace order if that CNC stays down. That's a $15,000 order and our reputation with that customer. Get it fixed or tell me what you need.",
    urgency: "critical",
  },
];

const communications: CommunicationChannel[] = [
  {
    id: "ask-operator",
    type: "radio",
    label: "Ask CNC Operator",
    icon: "Radio",
    contact: "Jim (CNC Operator)",
    response: "It's been tripping on and off all day. First time was around 11 AM. I reset it twice and it ran for a while. Now it won't stay running more than a couple minutes. Seems worse when the pump is running at full speed.",
    isUseful: true,
    clueId: "operator-info",
  },
  {
    id: "check-pm-log",
    type: "maintenance_log",
    label: "Check PM Records",
    icon: "BookOpen",
    contact: "CMMS System",
    response: "Last PM (3 months ago): Motor greased, pump impeller inspected, VFD filter cleaned. No cable inspection performed. No megger testing. Note from installer (5 years ago): 'Used existing EMT conduit run — tight bend at motor entry.'",
    isUseful: true,
    clueId: "pm-info",
  },
];

const phases: ScenarioPhase[] = [
  {
    id: "phase-1-ground-fault",
    title: "Phase 1: Ground Fault Isolation",
    narrative: "The coolant pump VFD keeps tripping on {ground fault} ({F007}). It's intermittent — runs for a while then trips. Getting worse throughout the day. The fault data shows T2 current is low while T1 and T3 are normal, meaning current is leaking from T2 to ground somewhere. You need to isolate whether the fault is in the motor windings or the cable between the VFD and motor.",
    activeFaultId: "cable-ground-fault",
    initialStateId: "ground-fault-active",
    locations: [
      {
        id: "vfd-output",
        label: "VFD Output Terminals",
        description: "T1, T2, T3 output terminals and ground bus",
        compatibleTools: ["multimeter", "megger"],
        terminalMeasurements: [
          {
            fromTerminal: "T1-out",
            toTerminal: "GND",
            requiredSetting: "ohms",
            reading: ">200",
            unit: "MΩ",
            isKeyClue: false,
            interpretation: "T1 to ground: excellent insulation at VFD output. Cable T1 is good.",
          },
          {
            fromTerminal: "T2-out",
            toTerminal: "GND",
            requiredSetting: "ohms",
            reading: "0.8",
            unit: "MΩ",
            isKeyClue: true,
            interpretation: "T2 to ground: 0.8MΩ — BELOW MINIMUM (2MΩ). Ground fault confirmed on T2 circuit!",
            newTechExplanation: "Normal insulation reads >100MΩ. 0.8MΩ means the insulation is severely compromised. Current is leaking from T2 to ground.",
            animation: { type: "spark", targetId: "cable-t2", duration: 2000, intensity: 0.6 },
          },
          {
            fromTerminal: "T3-out",
            toTerminal: "GND",
            requiredSetting: "ohms",
            reading: ">200",
            unit: "MΩ",
            isKeyClue: false,
            interpretation: "T3 to ground: excellent insulation. Cable T3 is good.",
          },
        ],
      },
      {
        id: "motor-junction-box",
        label: "Motor Junction Box",
        description: "Motor terminal connections and cable entry point",
        compatibleTools: ["multimeter", "megger", "flashlight"],
        terminalMeasurements: [
          {
            fromTerminal: "M-T2",
            toTerminal: "M-GND",
            requiredSetting: "ohms",
            reading: ">200",
            unit: "MΩ",
            isKeyClue: true,
            interpretation: "Motor winding T2 to ground: >200MΩ — motor is GOOD. The ground fault is in the CABLE, not the motor!",
            newTechExplanation: "By testing at the motor end, you've isolated the fault. Motor windings are fine. The problem is between the VFD and the motor — in the cable run.",
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "Cable entry: EMT conduit connector has sharp edge where locknut was over-tightened. T2 conductor shows VISIBLE DAMAGE — copper visible through worn insulation at the conduit entry point. Scuff marks from vibration chafing.",
            unit: "",
            interpretation: "FOUND IT — cable insulation worn through at conduit entry. Sharp edge + motor vibration = progressive chafing.",
            isKeyClue: true,
            visualEffect: "critical",
          },
        },
      },
      {
        id: "conduit-run",
        label: "Conduit Run (VFD to Motor)",
        description: "3/4\" EMT conduit run — approximately 15 feet with 2 bends",
        compatibleTools: ["flashlight"],
        simpleReadings: {
          flashlight: {
            value: "Conduit run: 15 feet, 2x 90° bends. Conduit is rigid EMT, securely mounted. No visible external damage. Entry at motor end: connector locknut appears over-tightened — slight deformation of conduit end.",
            unit: "",
            interpretation: "Over-tightened locknut created a sharp edge inside the connector — this is where the cable is chafing",
            isKeyClue: true,
            visualEffect: "warning",
          },
        },
      },
    ],
    communications,
    advanceConditions: [
      {
        requiredClues: ["vfd-output", "motor-junction-box"],
        requiredAction: "replace-cable",
        nextPhaseId: "complete",
        transitionText: "Cable replaced with new pull. Liquid-tight flexible conduit installed at motor entry to absorb vibration. Proper strain relief installed. Megger test: all phases >500MΩ to ground. VFD starts — T1=6.2A, T2=6.3A, T3=6.2A. Perfectly balanced. Pump running at full speed with no ground fault.",
        transitionAnimation: { type: "motor_spin", targetId: "motor-1", duration: 5000 },
      },
    ],
    hints: {
      new: "The VFD says T2 has low current — that means current from T2 is going somewhere other than the motor. Use your megger to test each output conductor to ground. Then isolate: is the fault in the motor or the cable?",
      experienced: "F007 with T2 low. Test insulation at VFD output (includes cable + motor) then at motor terminals (motor only). The difference tells you where the fault is.",
      senior: "Intermittent ground fault getting worse with temperature/vibration. 5-year-old install with EMT. Check cable entry points for chafing — classic failure mode.",
    },
    seniorCheckpoint: {
      question: "You've confirmed T2 has 0.8MΩ to ground at the VFD output, but >200MΩ at the motor terminals. What does this tell you?",
      options: [
        {
          id: "a",
          text: "The ground fault is in the cable between the VFD and motor — not in the motor windings",
          isCorrect: true,
          feedback: "Correct. By testing at both ends, you've isolated the fault to the cable run. The motor windings are fine (>200MΩ). The cable has damaged insulation somewhere along its length — most likely at a stress point like a conduit entry or tight bend.",
          scoreImpact: 15,
        },
        {
          id: "b",
          text: "Both readings indicate a motor problem — the motor test was inaccurate",
          isCorrect: false,
          feedback: "The motor test at >200MΩ is a definitive PASS. If the motor had a ground fault, it would show low resistance regardless of where you test. The discrepancy between VFD-end (0.8MΩ) and motor-end (>200MΩ) conclusively isolates the fault to the cable.",
          scoreImpact: -5,
        },
        {
          id: "c",
          text: "The VFD's output section has an internal ground fault",
          isCorrect: false,
          feedback: "If the VFD had an internal ground fault, you'd see it even with the output cables disconnected. The 0.8MΩ reading includes the cable. Since the motor tests good, the fault must be in the cable between the two test points.",
          scoreImpact: -5,
        },
        {
          id: "d",
          text: "Moisture in the conduit is causing the low reading — let it dry out",
          isCorrect: false,
          feedback: "While moisture can lower insulation resistance, it would typically affect all three conductors equally, not just T2. The single-phase fault and the progressive worsening with vibration point to mechanical damage, not moisture.",
          scoreImpact: -5,
        },
      ],
    },
  },
];

const ambientAnimations: AnimationTrigger[] = [
  { type: "spark", targetId: "cable-t2", duration: 99999, loop: true, intensity: 0.2 },
];

const scoring = {
  clueDiscovery: 10,
  efficiencyBonus: 20,
  unnecessaryMeasurementPenalty: 3,
  seniorCheckpointCorrect: 15,
  hintPenalty: 8,
  wrongSettingPenalty: 5,
  unsafeActionPenalty: 30,
  communicationBonus: 10,
  optimalOrderBonus: 15,
  timeBonuses: [
    { underMinutes: 6, bonus: 25 },
    { underMinutes: 10, bonus: 15 },
    { underMinutes: 15, bonus: 5 },
  ],
  maxScore: 150,
  passingScore: 90,
};

export const scenarioVFDGroundFault: ScenarioV3 = {
  id: "vfd-ground-fault-cable-v3",
  title: "Ground Fault — Cable Insulation Failure",
  type: "VFD Output Troubleshooting",
  version: 3,
  estimatedMinutes: { new: 18, experienced: 10, senior: 6 },
  description: "CNC coolant pump VFD trips on F007 (Ground Fault) intermittently. Getting worse throughout the day. Phase T2 shows low current — something is leaking to ground. Is it the motor or the cable? Isolate the fault and fix it before the CNC misses its deadline.",
  faults,
  plantContext,
  faultLog,
  glossary,
  tools: DEFAULT_TOOLS_V3,
  diagram,
  systemStates,
  phases,
  timePressure,
  communications,
  scoring,
  ambientAnimations,
  guidedHints: {
    gather: [
      "Check the VFD fault log to see the exact fault code and phase current readings.",
      "Talk to the CNC operator to understand when the fault occurs and how often.",
      "Review the PM records to see if any recent work was done on the motor or cable."
    ],
    prints: [
      "Look at the circuit diagram to trace the path from the VFD output to the motor.",
      "Identify the components in the T2 circuit path where a ground fault could occur.",
      "Note the conduit type and length, as this is the path to ground for the fault."
    ],
    measure: [
      "Use a megger to test insulation resistance from each VFD output terminal (T1, T2, T3) to ground.",
      "If you find a low reading at the VFD, disconnect the motor and test at the motor junction box to isolate the fault.",
      "Use a flashlight to visually inspect the cable entry points for signs of chafing or damage."
    ],
    analyze: [
      "Compare the megger readings at the VFD output versus the motor junction box.",
      "A low reading at the VFD but a good reading at the motor means the fault is in the cable run."
    ],
    action: [
      "Replace the damaged cable section with a new pull.",
      "Install proper strain relief and liquid-tight flexible conduit at the motor entry to prevent future chafing."
    ],
    coachingOverrides: {
      measure: "Remember to use the megger, not just a standard multimeter, to properly test insulation resistance at both ends of the circuit.",
      analyze: "The key to finding this fault is isolating the cable from the motor. Don't assume the motor is bad just because the VFD tripped."
    }
  },
};
