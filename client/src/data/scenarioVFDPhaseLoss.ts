/**
 * EAS Simulator V3 — VFD Input Phase Loss Scenario
 * 
 * "Input Phase Loss — HVAC Supply Fan"
 * 
 * Single fault: Loose wire on L2 input terminal from thermal cycling.
 * VFD runs on 2 phases (single-phasing) causing DC bus ripple and eventual trip.
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
    id: "loose-l2-terminal",
    order: 1,
    name: "Loose Input Terminal L2",
    description: "L2 input wire has loosened from thermal cycling. High-resistance connection causes intermittent phase loss.",
    componentId: "terminal-l2",
    revealedBy: ["input-voltage-check", "terminal-inspection"],
    correctFixId: "retorque-terminal",
    rootCause: "The L2 input terminal on the VFD has loosened over 6 years of thermal cycling. The ring terminal crimp was marginal from installation — not properly torqued to spec (35 in-lb). Over thousands of heating/cooling cycles, the connection has developed high resistance. Under load, the resistance causes voltage drop and heating, which further loosens the connection. Now the contact is intermittent — sometimes making good contact, sometimes not.",
    technicalDetail: "With L2 open or high-resistance, the VFD's 6-pulse rectifier operates as a single-phase rectifier (only L1-L3 contributing). DC bus voltage drops from 678V to approximately 580V with severe 120Hz ripple (>100V p-p). The VFD can tolerate this briefly but trips on F003 (Input Phase Loss) when it detects the voltage imbalance. Under light load, the bus capacitors smooth the ripple enough to avoid detection. Under heavy load, the ripple exceeds the threshold.",
    preventionSteps: [
      "Re-torque all VFD power terminals annually per manufacturer spec",
      "Use calibrated torque wrench (not just 'tight') — 35 in-lb for this terminal size",
      "Apply anti-oxidation compound on aluminum conductors",
      "Thermal scan VFD terminals quarterly — hot spots indicate loose connections",
      "Use proper crimp tools and verify crimp quality during installation",
    ],
  },
];

const faultLog: FaultLogEntry[] = [
  { timestamp: "15:33:18.445", source: "VFD-11", code: "F003", description: "INPUT PHASE LOSS — phase voltage imbalance detected", severity: "critical" },
  { timestamp: "15:33:18.300", source: "VFD-11", code: "A002", description: "DC bus voltage: 572V with >100V ripple (normal: 678V, <10V ripple)", severity: "critical" },
  { timestamp: "15:33:17.800", source: "VFD-11", code: "A001", description: "Input voltage imbalance: L1-L2=380V, L2-L3=395V, L1-L3=481V", severity: "warning" },
  { timestamp: "14:15:22.112", source: "VFD-11", code: "F003", description: "INPUT PHASE LOSS — 2nd trip (reset at 14:20)", severity: "critical" },
  { timestamp: "11:45:08.556", source: "VFD-11", code: "A001", description: "Input voltage imbalance WARNING — L2 low", severity: "warning" },
  { timestamp: "08:30:00.000", source: "VFD-11", code: "S001", description: "Drive started — morning startup (ran fine until 11:45)", severity: "info" },
];

const plantContext = {
  plantName: "Metro Office Complex — Building B",
  lineName: "HVAC AHU-3 — Supply Fan",
  lineNumber: "HVAC-AHU3-SF-01",
  shift: "Day Shift (Building Maintenance)",
  shiftTime: "07:00 – 15:30",
  downstreamImpact: "3rd floor has no conditioned air — 200 office workers uncomfortable, server room temp rising",
  waitingOn: "Building manager, IT director (server room at 82°F and rising), tenant complaints",
  productionRate: "N/A — tenant comfort + server room cooling",
  costPerMinute: "$0 direct but tenant satisfaction + server risk",
  downSince: "15:33 (3rd trip today — pattern: runs fine in morning, trips in afternoon)",
  temperature: "92°F outside, mechanical room: 88°F",
  humidity: "65%",
  lastPMDate: "1 year ago (filter change, belt inspection — no electrical checks)",
  machineAge: "6 years (installed 2020)",
};

const glossary: GlossaryTerm[] = [
  {
    term: "F003",
    abbreviation: "Input Phase Loss",
    definition: "PowerFlex fault code indicating one of the three input phases is missing or significantly low. The VFD detects this by monitoring DC bus voltage ripple — with a missing phase, ripple increases dramatically as the bus is only charged during 2/3 of the AC cycle.",
    stateDiagram: {
      normalState: "3-phase input: Balanced\nDC bus: 678V, <10V ripple\nRectifier: 6-pulse operation",
      faultState: "Phase missing/low: L2\nDC bus: 572V, >100V ripple\nRectifier: Operating as single-phase",
      normalLabel: "All 3 phases present",
      faultLabel: "Phase loss — single-phasing",
    },
  },
  {
    term: "thermal cycling",
    definition: "Repeated heating and cooling of electrical connections during normal operation. Each cycle causes slight expansion and contraction of the conductor and terminal. Over years, this can loosen connections that weren't properly torqued at installation.",
  },
  {
    term: "high-resistance connection",
    definition: "A connection where the contact area has decreased (loose terminal, oxidation, or corrosion), increasing resistance. Under current flow, the resistance causes localized heating (I²R losses), which further degrades the connection in a positive feedback loop.",
  },
  {
    term: "single-phasing",
    definition: "Operating a 3-phase system with only 2 of the 3 phases present. For a VFD, this means the rectifier only charges the DC bus during 2/3 of the AC cycle, causing voltage sag and excessive ripple. The VFD can tolerate brief single-phasing but will trip to protect the DC bus capacitors from ripple current stress.",
  },
];

const diagram: CircuitDiagram = {
  title: "HVAC AHU-3 Supply Fan — VFD Input Power",
  type: "power_distribution",
  rails: { left: "L1 (480V)", right: "L3 (480V)" },
  rungs: [
    {
      id: "rung-1",
      label: "Input Power to VFD",
      components: [
        { id: "breaker", type: "breaker", label: "CB-3 (50A)", position: { col: 0, row: 0 }, state: "closed", tapInfo: { function: "50A circuit breaker in MCC", currentState: "CLOSED — all 3 phases present at breaker output", normalState: "Closed" } },
        { id: "terminal-l1", type: "terminal", label: "L1 Input", position: { col: 1, row: 0 }, state: "energized", tapInfo: { function: "VFD input terminal L1", currentState: "480V — good connection (8 in-lb torque)", normalState: "Tight, carrying 18A" } },
        { id: "terminal-l2", type: "terminal", label: "L2 Input", position: { col: 2, row: 0 }, state: "faulted", isFaultSource: true, tapInfo: { function: "VFD input terminal L2 — LOOSE", currentState: "INTERMITTENT — high resistance, 380V under load", normalState: "Tight at 35 in-lb, carrying 18A" } },
        { id: "terminal-l3", type: "terminal", label: "L3 Input", position: { col: 3, row: 0 }, state: "energized", tapInfo: { function: "VFD input terminal L3", currentState: "480V — good connection", normalState: "Tight, carrying 18A" } },
        { id: "vfd-1", type: "vfd", label: "PowerFlex 525 (20HP)", position: { col: 4, row: 0 }, state: "faulted", tapInfo: { function: "20HP VFD — AHU-3 supply fan speed control", currentState: "FAULTED — F003 Input Phase Loss", normalState: "Running at 48Hz, 16A" } },
      ],
      connections: [
        { from: "breaker", to: "terminal-l1", style: "normal" },
        { from: "terminal-l1", to: "terminal-l2", style: "highlighted" },
        { from: "terminal-l2", to: "terminal-l3", style: "broken" },
        { from: "terminal-l3", to: "vfd-1", style: "normal" },
      ],
    },
    {
      id: "rung-2",
      label: "VFD Output to Motor",
      components: [
        { id: "motor-1", type: "motor", label: "Supply Fan Motor (20HP)", position: { col: 2, row: 1, span: 2 }, state: "stalled", tapInfo: { function: "20HP motor — drives AHU-3 supply fan", currentState: "STOPPED — VFD faulted", normalState: "Running at 1450 RPM" } },
      ],
      connections: [],
    },
  ],
};

const systemStates: Record<string, SystemState> = {
  "phase-loss-faulted": {
    id: "phase-loss-faulted",
    label: "VFD Faulted — F003 Input Phase Loss",
    description: "L2 input terminal loose. Intermittent phase loss causing DC bus voltage sag and ripple.",
    componentStates: {
      "terminal-l2": { state: "faulted", appearance: { pulse: true, color: "amber" } },
      "vfd-1": { state: "faulted", appearance: { glow: true, color: "red" } },
      "motor-1": { state: "stalled" },
    },
    activeAnimations: [
      { type: "led_blink", targetId: "vfd-1", duration: 99999, loop: true, color: "red" },
      { type: "spark", targetId: "terminal-l2", duration: 99999, loop: true, intensity: 0.2 },
    ],
    availableActions: [
      {
        id: "retorque-terminal",
        label: "LOTO, clean and re-torque L2 terminal to 35 in-lb",
        description: "Lock out power, remove wire, clean terminal and lug, re-torque to manufacturer spec",
        category: "reset",
        targetComponentId: "terminal-l2",
        resultStateId: "fixed-running",
        isCorrect: true,
        consequence: "Terminal cleaned (oxidation visible on ring terminal face), re-crimped, and torqued to 35 in-lb. All three input voltages now balanced: L1-L2=480V, L2-L3=481V, L1-L3=479V. VFD reset. Supply fan running smoothly. DC bus stable at 676V.",
        scoreImpact: 30,
        animation: { type: "current_flow", targetId: "vfd-1", duration: 3000, intensity: 0.4 },
      },
      {
        id: "reset-only",
        label: "Reset VFD and restart",
        description: "Clear F003 and attempt to run again",
        category: "reset",
        targetComponentId: "vfd-1",
        resultStateId: "phase-loss-faulted",
        isCorrect: false,
        consequence: "VFD resets and starts. Runs for 5-15 minutes (varies — connection is intermittent). Then trips again on F003 when the loose terminal heats up and resistance increases. Each reset cycle makes the connection worse.",
        scoreImpact: -5,
      },
      {
        id: "replace-vfd",
        label: "Replace VFD — suspect internal rectifier failure",
        description: "Swap the VFD with a spare unit",
        category: "replace",
        targetComponentId: "vfd-1",
        resultStateId: "phase-loss-faulted",
        isCorrect: false,
        consequence: "New VFD installed. Same F003 fault after 10 minutes of operation. The problem is the INPUT connection, not the VFD itself. You've wasted 3 hours on an unnecessary VFD swap. The loose terminal is still there.",
        scoreImpact: -20,
      },
      {
        id: "call-utility",
        label: "Call utility company — suspect power quality issue",
        description: "Report suspected phase loss from utility transformer",
        category: "test",
        targetComponentId: "breaker",
        resultStateId: "phase-loss-faulted",
        isCorrect: false,
        consequence: "Utility dispatches a crew (2 hour wait). They measure at the transformer: all three phases balanced at 480V ±1%. The problem is downstream of the utility connection — it's YOUR wiring, not theirs.",
        scoreImpact: -10,
      },
    ],
    visibleFaults: faultLog,
  },
  "fixed-running": {
    id: "fixed-running",
    label: "System Running — Terminal Repaired",
    description: "L2 terminal cleaned and re-torqued. All phases balanced. Supply fan running normally.",
    componentStates: {
      "terminal-l2": { state: "energized", appearance: { color: "green" } },
      "vfd-1": { state: "energized", appearance: { color: "green" } },
      "motor-1": { state: "running", appearance: { color: "green" } },
    },
    activeAnimations: [
      { type: "motor_spin", targetId: "motor-1", duration: 99999, loop: true },
      { type: "current_flow", targetId: "vfd-1", duration: 99999, loop: true, intensity: 0.3 },
    ],
    availableActions: [],
    visibleFaults: [
      { timestamp: "16:00:00.000", source: "SYSTEM", code: "OK", description: "Terminal repaired — all phases balanced, DC bus 676V stable", severity: "info" },
    ],
  },
};

const timePressure: TimePressureEvent[] = [
  {
    triggerMinutes: 3,
    from: "Building Manager",
    role: "Facilities",
    message: "3rd floor tenants are complaining — no AC for over an hour now. It's 92°F outside and climbing in there. What's the status?",
    urgency: "medium",
  },
  {
    triggerMinutes: 6,
    from: "IT Director",
    role: "IT",
    message: "Server room on 3rd floor is at 84°F and rising. Our equipment is rated to 85°F. If we hit 90°F I'm doing an emergency shutdown of all servers. That takes down email, file shares, and the phone system for 200 people. FIX THIS.",
    urgency: "high",
  },
  {
    triggerMinutes: 10,
    from: "Property Management VP",
    role: "Management",
    message: "I have angry tenants threatening to invoke their lease comfort clause. The IT director is about to shut down servers. This is now a building emergency. What do you need — more people, parts, a contractor? Tell me NOW.",
    urgency: "critical",
  },
];

const communications: CommunicationChannel[] = [
  {
    id: "check-mcc",
    type: "maintenance_log",
    label: "Check MCC Breaker Status",
    icon: "BookOpen",
    contact: "Electrical Room",
    response: "CB-3 for AHU-3: Breaker is ON, no trip indication. All three phases present at breaker output: L1=480V, L2=481V, L3=479V. Problem is downstream of the breaker.",
    isUseful: true,
    clueId: "breaker-info",
  },
  {
    id: "check-history",
    type: "maintenance_log",
    label: "Check Maintenance History",
    icon: "BookOpen",
    contact: "CMMS System",
    response: "AHU-3 VFD maintenance history: Annual filter changes, belt inspections. NO electrical torque checks performed since installation (6 years). Note from last PM: 'VFD running fine, no issues reported.' Thermal scan: Never performed.",
    isUseful: true,
    clueId: "maintenance-info",
  },
  {
    id: "ask-building-eng",
    type: "radio",
    label: "Ask Building Engineer",
    icon: "Radio",
    contact: "Steve (Building Engineer)",
    response: "It ran fine this morning — started at 8:30 no problem. First trip was around 11:45 when the load picked up (afternoon cooling demand). Reset it twice and it ran for a while. Now it won't stay running more than 5-10 minutes. Seems worse when it's under heavy load.",
    isUseful: true,
    clueId: "engineer-info",
  },
];

const phases: ScenarioPhase[] = [
  {
    id: "phase-1-phase-loss",
    title: "Phase 1: Input Phase Loss Investigation",
    narrative: "The HVAC supply fan VFD trips on {F003} (Input Phase Loss). It's intermittent — runs fine in the morning but trips repeatedly in the afternoon when cooling demand is high. The fault data shows L2 voltage is low (380V vs 480V expected). The server room is at 84°F and rising. You need to determine if this is a utility power problem or a local wiring issue, and fix it before the IT director shuts down all servers.",
    activeFaultId: "loose-l2-terminal",
    initialStateId: "phase-loss-faulted",
    locations: [
      {
        id: "vfd-input-terminals",
        label: "VFD Input Terminals (L1, L2, L3)",
        description: "Input power terminals inside VFD — LETHAL VOLTAGE, verify LOTO",
        compatibleTools: ["multimeter", "thermal_camera"],
        terminalMeasurements: [
          {
            fromTerminal: "L1",
            toTerminal: "L2",
            requiredSetting: "vac",
            reading: "412",
            unit: "VAC",
            isKeyClue: true,
            interpretation: "L1-L2 = 412V — LOW (should be 480V). L2 is the problem phase.",
            newTechExplanation: "Normal phase-to-phase voltage is 480V ±5%. 412V is way too low. Since L2 appears in this measurement AND the next one, L2 is the weak phase.",
            animation: { type: "spark", targetId: "terminal-l2", duration: 1500, intensity: 0.4 },
          },
          {
            fromTerminal: "L2",
            toTerminal: "L3",
            requiredSetting: "vac",
            reading: "408",
            unit: "VAC",
            isKeyClue: true,
            interpretation: "L2-L3 = 408V — also LOW. Confirms L2 is the problem (both measurements involving L2 are low).",
          },
          {
            fromTerminal: "L1",
            toTerminal: "L3",
            requiredSetting: "vac",
            reading: "481",
            unit: "VAC",
            isKeyClue: true,
            interpretation: "L1-L3 = 481V — NORMAL. This measurement doesn't involve L2 and it's fine. CONFIRMS: L2 has high resistance or is intermittently open.",
          },
        ],
        simpleReadings: {
          thermal_camera: {
            value: "L1 terminal: 35°C. L2 terminal: 78°C ⚠️ HOT SPOT. L3 terminal: 34°C. L2 ring terminal shows bright hot spot where lug meets terminal screw.",
            unit: "",
            interpretation: "L2 terminal is 43°C hotter than L1 and L3 — classic high-resistance connection. Loose terminal causing I²R heating.",
            isKeyClue: true,
            visualEffect: "critical",
            animation: { type: "thermal_gradient", targetId: "terminal-l2", duration: 3000 },
          },
        },
      },
      {
        id: "mcc-breaker",
        label: "MCC — Circuit Breaker CB-3",
        description: "Motor Control Center, 2nd floor electrical room",
        compatibleTools: ["multimeter"],
        terminalMeasurements: [
          {
            fromTerminal: "CB3-L1",
            toTerminal: "CB3-L2",
            requiredSetting: "vac",
            reading: "480",
            unit: "VAC",
            isKeyClue: false,
            interpretation: "Full voltage at breaker output — all 3 phases present from utility. Problem is between breaker and VFD.",
          },
          {
            fromTerminal: "CB3-L2",
            toTerminal: "CB3-L3",
            requiredSetting: "vac",
            reading: "481",
            unit: "VAC",
            isKeyClue: false,
            interpretation: "Balanced at breaker — confirms the voltage drop is occurring at the VFD terminal, not upstream.",
          },
        ],
      },
      {
        id: "vfd-display",
        label: "VFD Display & Fault Data",
        description: "PowerFlex 525 HIM — fault history and diagnostics",
        compatibleTools: ["flashlight", "plc_terminal"],
        simpleReadings: {
          flashlight: {
            value: "Display: 'F003 INPUT PHASE LOSS'. DC bus at fault: 572V (normal: 678V). Fault pattern: Trips increase with load. Morning (light load): runs fine. Afternoon (heavy load): trips every 5-15 min.",
            unit: "",
            interpretation: "Load-dependent fault — high-resistance connection gets worse under current (I²R heating expands gap)",
            isKeyClue: false,
          },
          plc_terminal: {
            value: "Input voltage log: L1-L2 varies 380-460V (unstable). L2-L3 varies 390-465V (unstable). L1-L3 stable at 480V. Pattern: L2 voltage drops as load increases and terminal heats up.",
            unit: "",
            interpretation: "L2 voltage instability under load = high-resistance connection that worsens with heating",
            isKeyClue: false,
          },
        },
      },
    ],
    communications,
    advanceConditions: [
      {
        requiredClues: ["vfd-input-terminals"],
        requiredAction: "retorque-terminal",
        nextPhaseId: "complete",
        transitionText: "Power locked out. L2 terminal removed — visible oxidation and heat discoloration on ring terminal face. Terminal cleaned with ScotchBrite, new ring terminal crimped, torqued to 35 in-lb with calibrated wrench. Power restored. All voltages balanced: L1-L2=480V, L2-L3=481V, L1-L3=479V. DC bus: 676V stable. Supply fan running at full speed. Server room temperature dropping.",
        transitionAnimation: { type: "motor_spin", targetId: "motor-1", duration: 5000 },
      },
    ],
    hints: {
      new: "The fault says 'Input Phase Loss' — one of the 3 incoming power phases is weak or missing. Measure all three phase-to-phase voltages at the VFD input. Which phase is low? Then check if it's low at the breaker too (upstream) or only at the VFD (local connection issue).",
      experienced: "F003 that's load-dependent (worse in afternoon). Measure at VFD vs. breaker to isolate. If breaker is fine but VFD input is low, you have a high-resistance connection in between. Thermal camera will confirm.",
      senior: "Intermittent F003, load-dependent, 6-year-old install with no torque checks. Classic loose terminal from thermal cycling. Thermal scan the input terminals.",
    },
    seniorCheckpoint: {
      question: "You've measured 412V L1-L2 at the VFD but 480V at the breaker. The thermal camera shows L2 terminal at 78°C while L1 and L3 are at 35°C. What's your diagnosis?",
      options: [
        {
          id: "a",
          text: "Loose/high-resistance connection at L2 terminal — thermal cycling has loosened the crimp or torque over 6 years",
          isCorrect: true,
          feedback: "Correct. The voltage drop occurs between the breaker (480V) and VFD terminal (412V), localized to L2. The 78°C hot spot confirms I²R heating from high resistance. This is a textbook loose connection from thermal cycling — the terminal was likely under-torqued at installation and has worked loose over 6 years.",
          scoreImpact: 15,
        },
        {
          id: "b",
          text: "Wire damage in the conduit between breaker and VFD",
          isCorrect: false,
          feedback: "While possible, wire damage would typically be consistent (not load-dependent) and wouldn't show a hot spot specifically at the terminal. The thermal image clearly shows the heat is at the terminal connection point, not distributed along the wire. The load-dependent behavior (worse when hot) is classic for a loose mechanical connection.",
          scoreImpact: -5,
        },
        {
          id: "c",
          text: "VFD internal rectifier diode failure on L2 phase",
          isCorrect: false,
          feedback: "A failed rectifier diode would not cause a voltage drop MEASURED AT THE INPUT TERMINAL. You're measuring upstream of the rectifier. The 412V is the actual voltage arriving at the terminal — the VFD hasn't touched it yet. The problem is the connection, not the drive internals.",
          scoreImpact: -5,
        },
        {
          id: "d",
          text: "Breaker contact degradation on L2 pole",
          isCorrect: false,
          feedback: "You already measured 480V at the breaker output on all phases. If the breaker's L2 contact were degraded, you'd see low voltage there too. The voltage is fine at the breaker and low at the VFD — the problem is between those two points, specifically at the VFD terminal where the thermal camera shows the hot spot.",
          scoreImpact: -5,
        },
      ],
    },
  },
];

const ambientAnimations: AnimationTrigger[] = [
  { type: "spark", targetId: "terminal-l2", duration: 99999, loop: true, intensity: 0.15 },
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

export const scenarioVFDPhaseLoss: ScenarioV3 = {
  id: "vfd-input-phase-loss-v3",
  title: "Input Phase Loss — Loose Terminal",
  type: "VFD Power Input Troubleshooting",
  version: 3,
  estimatedMinutes: { new: 15, experienced: 8, senior: 5 },
  description: "HVAC supply fan VFD trips on F003 (Input Phase Loss) intermittently. Worse in the afternoon under heavy cooling load. Server room temperature rising toward critical. Is it a utility problem or a local wiring issue? Find the fault before the IT director shuts down all servers.",
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
      "Check the VFD display for the specific fault code and review the fault history.",
      "Talk to the building engineer to understand when the fault occurs and if there's a pattern.",
      "Review the maintenance history to see if any recent work or PMs were performed."
    ],
    prints: [
      "Locate the VFD input power circuit on the diagram.",
      "Identify the components between the utility supply and the VFD input terminals.",
      "Note the expected voltage levels at the breaker and the VFD input."
    ],
    measure: [
      "Measure the phase-to-phase voltages at the VFD input terminals (L1-L2, L2-L3, L1-L3).",
      "Measure the phase-to-phase voltages at the MCC breaker output to isolate the issue.",
      "Use a thermal camera to check for hot spots at the VFD input terminals."
    ],
    analyze: [
      "Compare the voltage readings at the VFD input with the readings at the breaker.",
      "Correlate the thermal camera findings with the voltage drop to identify the high-resistance connection."
    ],
    action: [
      "Lock out and tag out the power before performing any physical repairs.",
      "Clean, re-crimp if necessary, and re-torque the loose terminal to the manufacturer's specifications."
    ],
    coachingOverrides: {
      measure: "Focus on isolating the voltage drop. If voltage is good at the breaker but low at the VFD, the problem is in between.",
      analyze: "A hot spot on a terminal combined with a voltage drop across that connection is a classic sign of high resistance due to a loose connection."
    }
  },
};
