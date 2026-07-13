/**
 * EAS Simulator V3 — VFD Overcurrent Trip Scenario
 * 
 * "PowerFlex 525 Overcurrent During Ramp-Up — Bottling Line 3"
 * 
 * Single fault: VFD acceleration time too fast after parameter reset during weekend maintenance.
 * Motor coupling was replaced, parameters were reset to factory defaults, accel time went from 5s to 0.5s.
 * 
 * Features:
 * - Single-fault focused scenario (good for learning VFD parameters)
 * - Parameter investigation via HIM/laptop
 * - Realistic PowerFlex fault code F012 (Overcurrent)
 * - Communication with weekend maintenance tech
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
    id: "accel-too-fast",
    order: 1,
    name: "Acceleration Time Reset to Factory Default",
    description: "Weekend maintenance replaced coupling and reset VFD parameters. Accel time went from 5.0s to 0.5s (factory default).",
    componentId: "vfd-1",
    revealedBy: ["vfd-params-check"],
    correctFixId: "set-accel-time",
    rootCause: "During weekend coupling replacement, the maintenance tech performed a factory reset on the PowerFlex 525 to clear a nuisance fault. This reset ALL parameters to defaults, including acceleration time (P041) which went from the application-tuned 5.0 seconds to the factory default of 0.5 seconds. The motor cannot accelerate a loaded conveyor from 0 to 45Hz in 0.5s without exceeding the current limit.",
    technicalDetail: "At 0.5s accel time, the VFD attempts to ramp voltage/frequency at 90Hz/s. The motor's rotor cannot accelerate the mechanical load (conveyor + product) fast enough, causing slip to increase dramatically. High slip = high rotor current = high stator current. The VFD's instantaneous overcurrent trip (200% for >0.1s) activates at approximately 42Hz during the ramp.",
    preventionSteps: [
      "Document all application-specific parameters before any factory reset",
      "Use PowerFlex 525 'Upload to Device' feature to save/restore parameter sets",
      "Add parameter backup to PM procedure checklist",
      "Post critical parameter values on panel door label",
      "Require parameter verification after any VFD reset or replacement",
    ],
  },
];

const faultLog: FaultLogEntry[] = [
  { timestamp: "06:02:15.332", source: "VFD-03", code: "F012", description: "OVERCURRENT — instantaneous current limit exceeded during acceleration", severity: "critical" },
  { timestamp: "06:02:15.334", source: "VFD-03", code: "A081", description: "Output current at trip: 28.4A (limit: 25A = 200% FLA)", severity: "critical" },
  { timestamp: "06:02:15.200", source: "VFD-03", code: "A004", description: "Motor current rising rapidly: 15A → 22A → 28A in 0.4s", severity: "warning" },
  { timestamp: "06:02:14.800", source: "PLC", code: "O:3/0", description: "Run command issued — VFD starting", severity: "info" },
  { timestamp: "06:01:00.000", source: "PLC", code: "I:3/2", description: "Start pushbutton pressed — initiating startup sequence", severity: "info" },
  { timestamp: "05:58:22.100", source: "VFD-03", code: "F012", description: "OVERCURRENT — same fault (2nd attempt)", severity: "critical" },
  { timestamp: "05:55:08.445", source: "VFD-03", code: "F012", description: "OVERCURRENT — first occurrence this shift", severity: "critical" },
];

const plantContext = {
  plantName: "Valley Beverages — Building A",
  lineName: "Bottling Line 3 — Infeed Conveyor",
  lineNumber: "BL-03-CONV-01",
  shift: "1st Shift (Monday morning)",
  shiftTime: "06:00 – 14:00",
  downstreamImpact: "Filler starved, labeler idle, case packer waiting",
  waitingOn: "Line 3 crew (6 operators) standing by, production scheduler needs ETA",
  productionRate: "200 bottles/min ($0.85/bottle)",
  costPerMinute: "$170/min lost production",
  downSince: "06:02 (first start attempt failed)",
  temperature: "68°F (climate-controlled bottling hall)",
  humidity: "45%",
  lastPMDate: "Saturday (2 days ago — coupling replacement)",
  machineAge: "4 years (installed 2022)",
};

const glossary: GlossaryTerm[] = [
  {
    term: "F012",
    abbreviation: "Overcurrent Fault",
    definition: "PowerFlex 525 fault code indicating output current exceeded 200% of motor FLA instantaneously. Unlike an overload (time-based), overcurrent is an instantaneous trip to protect the IGBTs.",
    stateDiagram: {
      normalState: "Current: <100% FLA\nAcceleration: Smooth ramp\nDrive: Running",
      faultState: "Current: >200% FLA\nAcceleration: Too aggressive\nDrive: TRIPPED",
      normalLabel: "Normal operation",
      faultLabel: "Overcurrent trip",
    },
  },
  {
    term: "acceleration time",
    abbreviation: "P041",
    definition: "VFD parameter that sets how many seconds the drive takes to ramp from 0Hz to maximum frequency. Shorter time = more aggressive acceleration = higher inrush current. Must be tuned to the mechanical load.",
  },
  {
    term: "factory reset",
    definition: "Restores ALL VFD parameters to manufacturer defaults. This erases application-specific tuning including accel/decel times, motor data, I/O configuration, and protection settings. Should only be done with a parameter backup available.",
  },
  {
    term: "slip",
    definition: "The difference between synchronous speed and actual rotor speed. Higher slip = higher rotor current. During aggressive acceleration, slip increases because the rotor can't keep up with the rapidly increasing stator field frequency.",
  },
  {
    term: "IGBT",
    abbreviation: "Insulated Gate Bipolar Transistor",
    definition: "The power switching devices in the VFD inverter section. Overcurrent protection exists primarily to protect these expensive components from thermal damage. Rated for 200% current for very short durations only.",
  },
];

const diagram: CircuitDiagram = {
  title: "BL-03 Infeed Conveyor — VFD Motor Control",
  type: "vfd_power",
  rails: { left: "L1 (480V)", right: "L3 (480V)" },
  rungs: [
    {
      id: "rung-1",
      label: "VFD Power Circuit",
      components: [
        { id: "disconnect", type: "disconnect", label: "Main Disconnect QF1", position: { col: 0, row: 0 }, state: "closed", tapInfo: { function: "480V 3-phase disconnect for VFD", currentState: "CLOSED — power available", normalState: "Closed during operation" } },
        { id: "vfd-1", type: "vfd", label: "PowerFlex 525 (5HP)", position: { col: 1, row: 0, span: 2 }, state: "faulted", tapInfo: { function: "5HP VFD — controls infeed conveyor speed (50Hz)", currentState: "FAULTED — F012 Overcurrent", normalState: "Running at 50Hz, 8.2A" }, isFaultSource: true },
        { id: "motor-1", type: "motor", label: "Motor M1 (5HP)", position: { col: 3, row: 0 }, state: "stalled", tapInfo: { function: "3-phase induction motor — drives infeed belt via new coupling", currentState: "STOPPED — drive faulted", normalState: "Running at 1750 RPM" } },
      ],
      connections: [
        { from: "disconnect", to: "vfd-1", style: "normal" },
        { from: "vfd-1", to: "motor-1", style: "highlighted" },
      ],
    },
    {
      id: "rung-2",
      label: "Control Circuit",
      components: [
        { id: "plc-run", type: "plc_output", label: "O:3/0 Run CMD", position: { col: 0, row: 1 }, state: "energized", tapInfo: { function: "PLC run command to VFD", currentState: "ON — commanding run", normalState: "ON when line is running" } },
        { id: "plc-fault", type: "plc_input", label: "I:3/1 VFD Fault", position: { col: 2, row: 1 }, state: "energized", tapInfo: { function: "VFD fault relay output to PLC", currentState: "TRUE — fault active", normalState: "FALSE — no fault" } },
        { id: "plc-speed", type: "plc_output", label: "AO:1 Speed Ref", position: { col: 4, row: 1 }, state: "energized", tapInfo: { function: "Analog output 4-20mA speed reference", currentState: "16.7mA (= 50Hz command)", normalState: "Varies with recipe" } },
      ],
      connections: [
        { from: "plc-run", to: "plc-fault", style: "normal" },
        { from: "plc-fault", to: "plc-speed", style: "normal" },
      ],
    },
  ],
};

const systemStates: Record<string, SystemState> = {
  "overcurrent-faulted": {
    id: "overcurrent-faulted",
    label: "VFD Faulted — F012 Overcurrent",
    description: "Drive tripped on overcurrent during acceleration. Motor stopped. PLC holding run command.",
    componentStates: {
      "vfd-1": { state: "faulted", appearance: { glow: true, color: "red", pulse: true } },
      "motor-1": { state: "stalled" },
      "plc-run": { state: "energized" },
      "plc-fault": { state: "energized", appearance: { color: "red" } },
    },
    activeAnimations: [
      { type: "led_blink", targetId: "vfd-1", duration: 99999, loop: true, color: "red" },
    ],
    availableActions: [
      {
        id: "set-accel-time",
        label: "Set P041 Accel Time to 5.0 seconds",
        description: "Restore acceleration time to the application-tuned value",
        category: "adjust",
        targetComponentId: "vfd-1",
        resultStateId: "fixed-running",
        isCorrect: true,
        consequence: "Acceleration time restored to 5.0s. VFD reset. Motor starts smoothly — current peaks at 14A during ramp then settles to 8.2A. Conveyor running at rated speed.",
        scoreImpact: 30,
        animation: { type: "motor_spin", targetId: "motor-1", duration: 5000 },
      },
      {
        id: "reset-only",
        label: "Reset VFD fault and try again",
        description: "Press STOP/RESET on VFD keypad without changing parameters",
        category: "reset",
        targetComponentId: "vfd-1",
        resultStateId: "overcurrent-faulted",
        isCorrect: false,
        consequence: "VFD resets, attempts to start... current spikes to 28A at 42Hz... F012 OVERCURRENT again. Same fault — parameters haven't been corrected.",
        scoreImpact: -5,
        animation: { type: "breaker_trip", targetId: "vfd-1", duration: 1000 },
      },
      {
        id: "increase-current-limit",
        label: "Increase motor overload/current limit settings",
        description: "Raise the overcurrent threshold so the drive doesn't trip",
        category: "adjust",
        targetComponentId: "vfd-1",
        resultStateId: "overcurrent-faulted",
        isCorrect: false,
        consequence: "Cannot override instantaneous overcurrent protection (F012) — it's hardware-level IGBT protection. The drive still trips. The correct approach is to reduce the current demand by slowing the acceleration.",
        scoreImpact: -10,
        safetyWarning: "Attempting to override IGBT protection can result in drive destruction ($3,500 replacement).",
      },
      {
        id: "replace-motor",
        label: "Suspect motor fault — replace motor",
        description: "Swap the motor with a spare from the storeroom",
        category: "replace",
        targetComponentId: "motor-1",
        resultStateId: "overcurrent-faulted",
        isCorrect: false,
        consequence: "New motor installed. Same fault on startup — F012 at 42Hz. The motor was never the problem. You've wasted 2 hours on an unnecessary motor swap.",
        scoreImpact: -20,
      },
    ],
    visibleFaults: faultLog,
  },
  "fixed-running": {
    id: "fixed-running",
    label: "System Running — Parameters Corrected",
    description: "Acceleration time restored. Motor running smoothly at rated speed and current.",
    componentStates: {
      "vfd-1": { state: "energized", appearance: { color: "green" } },
      "motor-1": { state: "running", appearance: { color: "green" } },
      "plc-fault": { state: "de-energized" },
    },
    activeAnimations: [
      { type: "motor_spin", targetId: "motor-1", duration: 99999, loop: true },
      { type: "current_flow", targetId: "vfd-1", duration: 99999, loop: true, intensity: 0.3 },
    ],
    availableActions: [],
    visibleFaults: [
      { timestamp: "06:18:00.000", source: "SYSTEM", code: "OK", description: "VFD running — 50Hz, 8.2A, no faults", severity: "info" },
    ],
  },
};

const timePressure: TimePressureEvent[] = [
  {
    triggerMinutes: 3,
    from: "Carlos",
    role: "Line 3 Lead Operator",
    message: "What's the deal? We've got 6 people standing around. The filler is empty and we're burning daylight here.",
    urgency: "medium",
  },
  {
    triggerMinutes: 7,
    from: "Janet Williams",
    role: "Production Scheduler",
    message: "Line 3 was supposed to start at 6:00. We have 40,000 bottles to run today. Every minute costs us $170. What's your timeline?",
    urgency: "high",
  },
  {
    triggerMinutes: 12,
    from: "Regional VP (via Janet)",
    role: "Operations",
    message: "Janet escalated. We have a customer shipment at risk. I need this line running in the next 10 minutes or we're calling in the drive vendor.",
    urgency: "critical",
  },
];

const communications: CommunicationChannel[] = [
  {
    id: "call-weekend-tech",
    type: "phone",
    label: "Call Weekend Maintenance Tech",
    icon: "Phone",
    contact: "Rick (Weekend Tech)",
    response: "Yeah, I replaced the coupling Saturday. The drive was showing a nuisance fault so I did a factory reset to clear it. Everything ran fine after that... well, I only jogged it briefly to check rotation. Didn't run it under full load.",
    isUseful: true,
    clueId: "weekend-tech-info",
  },
  {
    id: "check-maintenance-log",
    type: "maintenance_log",
    label: "Check Weekend Work Order",
    icon: "BookOpen",
    contact: "CMMS System",
    response: "WO-2024-4102 (Closed): 'BL-03 infeed coupling replacement. Coupling worn, replaced with new Lovejoy L-150. Factory reset performed to clear F033 (Auto Tune Fault). Jogged motor — rotation correct. Signed: Rick M.'",
    isUseful: true,
    clueId: "work-order-info",
  },
  {
    id: "radio-operator",
    type: "radio",
    label: "Radio Line 3 Operator",
    icon: "Radio",
    contact: "Carlos (Lead Operator)",
    response: "It was running fine Friday. Weekend maintenance was here Saturday doing something with the coupling. First time we tried to start it this morning, it faulted immediately. Three tries, same thing every time.",
    isUseful: true,
    clueId: "operator-info",
  },
];

const phases: ScenarioPhase[] = [
  {
    id: "phase-1-overcurrent",
    title: "Phase 1: VFD Overcurrent Investigation",
    narrative: "Monday morning startup. The {VFD} on Bottling Line 3 infeed conveyor trips on {F012} (overcurrent) every time you try to start it. It gets to about 42Hz during {acceleration time} then faults. The drive was working fine last Friday. Weekend maintenance replaced the coupling on Saturday. You need to figure out why the drive can't start the motor anymore.",
    activeFaultId: "accel-too-fast",
    initialStateId: "overcurrent-faulted",
    locations: [
      {
        id: "vfd-keypad",
        label: "VFD Keypad & Display",
        description: "PowerFlex 525 HIM — fault codes, parameters, and diagnostics",
        compatibleTools: ["flashlight", "plc_terminal"],
        simpleReadings: {
          flashlight: {
            value: "Display: 'F012 OVERCURRENT'. Fault data: Current at trip = 28.4A, Freq at trip = 42Hz, DC Bus = 651V. Status LED: Solid RED.",
            unit: "",
            interpretation: "Overcurrent at 42Hz during ramp — not at full speed. Suggests acceleration is too aggressive for the load.",
            isKeyClue: true,
            visualEffect: "critical",
          },
          plc_terminal: {
            value: "Parameter review: P041 (Accel Time) = 0.5s ⚠️, P042 (Decel Time) = 0.5s, P043 (Motor NP Volts) = 460V, P044 (Motor NP Freq) = 60Hz, P045 (Motor OL Current) = 12.5A. NOTE: P041 factory default is 0.5s — application value should be 5.0s!",
            unit: "",
            interpretation: "FOUND IT — Accel time is 0.5s (factory default) instead of application-tuned 5.0s. This is why current spikes during ramp.",
            isKeyClue: true,
            visualEffect: "critical",
          },
        },
      },
      {
        id: "motor-check",
        label: "Motor & New Coupling",
        description: "Motor frame, new coupling, shaft alignment",
        compatibleTools: ["multimeter", "flashlight", "vibration_pen"],
        terminalMeasurements: [
          {
            fromTerminal: "T1",
            toTerminal: "T2",
            requiredSetting: "ohms",
            reading: "3.1",
            unit: "Ω",
            isKeyClue: false,
            interpretation: "Winding resistance normal for 5HP motor (3.0-3.3Ω expected)",
          },
          {
            fromTerminal: "T1",
            toTerminal: "GND",
            requiredSetting: "ohms",
            reading: ">500",
            unit: "MΩ",
            isKeyClue: false,
            interpretation: "Insulation resistance excellent — no winding damage",
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "New Lovejoy L-150 coupling installed, alignment looks good. Motor nameplate: 5HP, 460V, 3PH, 8.2A FLA, 1750 RPM. No signs of damage or overheating.",
            unit: "",
            interpretation: "Motor and coupling appear fine — problem is not mechanical",
            isKeyClue: false,
          },
        },
      },
      {
        id: "input-power",
        label: "VFD Input Power",
        description: "480V 3-phase supply at VFD input terminals",
        compatibleTools: ["multimeter"],
        terminalMeasurements: [
          {
            fromTerminal: "L1",
            toTerminal: "L2",
            requiredSetting: "vac",
            reading: "482",
            unit: "VAC",
            isKeyClue: false,
            interpretation: "Input voltage normal — power supply is not the issue",
          },
          {
            fromTerminal: "L2",
            toTerminal: "L3",
            requiredSetting: "vac",
            reading: "479",
            unit: "VAC",
            isKeyClue: false,
            interpretation: "Phase-to-phase voltage balanced — no phase loss",
          },
        ],
      },
    ],
    communications,
    advanceConditions: [
      {
        requiredClues: ["vfd-keypad"],
        requiredAction: "set-accel-time",
        nextPhaseId: "complete",
        transitionText: "Acceleration time P041 restored to 5.0 seconds. VFD reset. Motor starts smoothly — current ramps gradually to 12A during acceleration then settles to 8.2A at 50Hz. Conveyor running perfectly. Line 3 is back in production.",
        transitionAnimation: { type: "motor_spin", targetId: "motor-1", duration: 5000 },
      },
    ],
    hints: {
      new: "The fault happens during acceleration (ramp-up), not at full speed. That means the motor can't speed up fast enough. Look at the VFD's acceleration time parameter — how fast is it trying to ramp?",
      experienced: "F012 at 42Hz during ramp. Weekend maintenance did a factory reset. What parameters would a factory reset change that affect startup current?",
      senior: "Factory reset + F012 during accel = P041 reverted to 0.5s default. Verify and restore.",
    },
    seniorCheckpoint: {
      question: "The weekend tech says he did a factory reset to clear a nuisance fault. What's the FIRST parameter group you should check?",
      options: [
        {
          id: "a",
          text: "Acceleration/Deceleration times (P041/P042) — factory defaults are often too aggressive for loaded applications",
          isCorrect: true,
          feedback: "Correct. Factory reset sets accel time to 0.5s which is far too fast for a loaded conveyor. The motor can't accelerate the mechanical load that quickly without exceeding current limits.",
          scoreImpact: 15,
        },
        {
          id: "b",
          text: "Motor nameplate data (P043-P045) — maybe motor parameters are wrong",
          isCorrect: false,
          feedback: "Motor nameplate data (voltage, frequency, FLA) would cause different symptoms if wrong. The fault is specifically during acceleration, pointing to ramp-rate parameters, not motor configuration.",
          scoreImpact: -5,
        },
        {
          id: "c",
          text: "I/O configuration — maybe the speed reference is misconfigured",
          isCorrect: false,
          feedback: "If speed reference were wrong, the drive would run at the wrong speed but wouldn't necessarily overcurrent during ramp. The analog input is reading correctly (16.7mA = 50Hz). The issue is HOW FAST it tries to get there.",
          scoreImpact: -5,
        },
        {
          id: "d",
          text: "Protection settings — overcurrent limit might be set too low",
          isCorrect: false,
          feedback: "The overcurrent limit (200% FLA) is correct and should not be raised. The drive is correctly protecting itself. The fix is to reduce current demand by slowing the acceleration, not to raise protection limits.",
          scoreImpact: -10,
        },
      ],
    },
  },
];

const ambientAnimations: AnimationTrigger[] = [
  { type: "led_blink", targetId: "vfd-1", duration: 99999, loop: true, color: "red" },
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
    { underMinutes: 5, bonus: 25 },
    { underMinutes: 8, bonus: 15 },
    { underMinutes: 12, bonus: 5 },
  ],
  maxScore: 150,
  passingScore: 90,
};

export const scenarioVFDOvercurrent: ScenarioV3 = {
  id: "vfd-overcurrent-ramp-v3",
  title: "VFD Overcurrent During Ramp-Up",
  type: "VFD Parameter Troubleshooting",
  version: 3,
  estimatedMinutes: { new: 15, experienced: 8, senior: 5 },
  description: "Bottling Line 3 infeed conveyor won't start Monday morning. VFD trips on F012 (overcurrent) at 42Hz every attempt. Weekend maintenance replaced the coupling and did a factory reset. Find the parameter error and restore production.",
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
      "Check the VFD keypad for the specific fault code and operating conditions at the time of the trip.",
      "Review the fault log to see if this is a recurring issue or a new problem.",
      "Talk to the operators and maintenance team to find out what changed recently, especially over the weekend."
    ],
    prints: [
      "Review the VFD parameter list, specifically focusing on acceleration and deceleration times.",
      "Check the motor nameplate data to ensure the VFD is configured correctly for the connected load.",
      "Look at the control circuit diagram to understand how the PLC commands the VFD."
    ],
    measure: [
      "Use the PLC terminal to check the current value of parameter P041 (Acceleration Time).",
      "Verify the input voltage to the VFD to rule out power supply issues.",
      "Check the motor and coupling for any mechanical binding or damage."
    ],
    analyze: [
      "Consider the relationship between acceleration time and current draw. A shorter acceleration time requires more current.",
      "Evaluate the impact of a factory reset on application-specific parameters like acceleration time."
    ],
    action: [
      "Adjust parameter P041 (Acceleration Time) back to the application-tuned value of 5.0 seconds.",
      "Test the system by starting the conveyor and monitoring the current draw during acceleration."
    ],
    coachingOverrides: {
      gather: "Start by gathering information from the VFD keypad and the maintenance team. What changed over the weekend?",
      analyze: "Think about why the VFD is tripping on overcurrent during acceleration. What parameter controls how fast the motor speeds up?"
    }
  },
};
