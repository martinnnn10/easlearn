import {
  ScenarioV3,
  SystemState,
  ScenarioPhase,
  DEFAULT_TOOLS_V3,
} from "./scenariosV3";

const systemStates: Record<string, SystemState> = {
  "sensor-faulted": {
    id: "sensor-faulted",
    label: "Proximity Sensor Input Missing",
    description: "The proximity sensor is triggered but the PLC input is not registering. The fault is a broken wire in the conduit between the field sensor and the PLC input terminal.",
    componentStates: {
      "main-disconnect": { state: "closed", terminals: [
        { id: "disc-L1", label: "L1 Input", position: "L1", voltage: "480V", state: "live" },
        { id: "disc-L2", label: "L2 Input", position: "L2", voltage: "480V", state: "live" },
        { id: "disc-L3", label: "L3 Input", position: "L3", voltage: "480V", state: "live" },
      ]},
      "24v-supply": { state: "energized", terminals: [
        { id: "ps-out-pos", label: "24V DC+", position: "T1", voltage: "24.1V", state: "live" },
        { id: "ps-out-neg", label: "24V DC−", position: "T2", voltage: "0V", state: "live" },
      ]},
      "plc-cpu": { state: "energized", appearance: { glow: true } },
      "plc-io": { state: "energized", terminals: [
        { id: "io-in-0", label: "Input 0 (Sensor)", position: "T1", voltage: "0V", state: "dead" },
        { id: "io-com", label: "I/O Common", position: "COM", voltage: "0V", state: "live" },
      ], appearance: { glow: true }},
      "prox-sensor": { state: "energized", terminals: [
        { id: "prox-pwr", label: "Sensor Power (+24V)", position: "T1", voltage: "24.1V", state: "live" },
        { id: "prox-com", label: "Sensor Common (0V)", position: "T2", voltage: "0V", state: "live" },
        { id: "prox-sig", label: "Sensor Signal Out", position: "T3", voltage: "24.1V", state: "live" },
      ], appearance: { glow: true }},
      "junction-box": { state: "energized", terminals: [
        { id: "jb-sig-in", label: "JB Signal In", position: "T1", voltage: "24.1V", state: "live" },
        { id: "jb-sig-out", label: "JB Signal Out", position: "T2", voltage: "24.1V", state: "live" },
      ]},
      "conduit-wire": { state: "faulted", terminals: [
        { id: "wire-jb-side", label: "Wire at JB", position: "T1", voltage: "24.1V", state: "live" },
        { id: "wire-plc-side", label: "Wire at PLC", position: "T2", voltage: "0V", state: "dead" },
      ]},
    },
    activeAnimations: [
      { type: "led_blink", targetId: "plc-cpu", duration: 1000, loop: true, intensity: 0.8, color: "green" },
      { type: "indicator_flash", targetId: "prox-sensor", duration: 500, loop: true, intensity: 1.0, color: "yellow" },
    ],
    availableActions: [
      {
        id: "replace-wire",
        label: "Pull New Wire in Conduit",
        description: "Replace the broken signal wire between the junction box and the PLC panel.",
        category: "replace",
        targetComponentId: "conduit-wire",
        resultStateId: "sensor-fixed",
        isCorrect: true,
        consequence: "New wire pulled and terminated. Signal reaches PLC input. Press resumes operation.",
        scoreImpact: 25,
        animation: { type: "relay_click", targetId: "plc-io", duration: 300 },
      },
      {
        id: "replace-sensor",
        label: "Replace Proximity Sensor",
        description: "Install a new Turck 3-wire proximity sensor.",
        category: "replace",
        targetComponentId: "prox-sensor",
        resultStateId: "sensor-faulted",
        isCorrect: false,
        consequence: "New sensor installed, but PLC still doesn't see the input. The sensor was already sending 24V.",
        scoreImpact: -10,
      },
      {
        id: "replace-io-module",
        label: "Replace PLC Input Module",
        description: "Swap the Slot 3 discrete input module.",
        category: "replace",
        targetComponentId: "plc-io",
        resultStateId: "sensor-faulted",
        isCorrect: false,
        consequence: "New module installed, but input 0 is still off. The module isn't receiving 24V from the field.",
        scoreImpact: -15,
        safetyWarning: "Replacing modules with power applied can damage equipment.",
      },
      {
        id: "reset-plc",
        label: "Reset PLC CPU",
        description: "Power cycle the PLC processor.",
        category: "reset",
        targetComponentId: "plc-cpu",
        resultStateId: "sensor-faulted",
        isCorrect: false,
        consequence: "PLC restarts but input is still missing. Problem persists.",
        scoreImpact: -5,
      },
    ],
    visibleFaults: [
      { timestamp: "14:22:10", source: "PLC", code: "SEQ-TIMEOUT", description: "Press sequence timeout - waiting on part present sensor", severity: "critical" },
    ],
  },
  "sensor-fixed": {
    id: "sensor-fixed",
    label: "Wire Replaced — System Restored",
    description: "New signal wire installed. PLC receives 24V input from the proximity sensor. Press sequence resumes.",
    componentStates: {
      "main-disconnect": { state: "closed" },
      "24v-supply": { state: "energized" },
      "plc-cpu": { state: "energized", appearance: { glow: true } },
      "plc-io": { state: "energized", terminals: [
        { id: "io-in-0", label: "Input 0 (Sensor)", position: "T1", voltage: "24.1V", state: "live" },
        { id: "io-com", label: "I/O Common", position: "COM", voltage: "0V", state: "live" },
      ], appearance: { glow: true }},
      "prox-sensor": { state: "energized", terminals: [
        { id: "prox-pwr", label: "Sensor Power (+24V)", position: "T1", voltage: "24.1V", state: "live" },
        { id: "prox-com", label: "Sensor Common (0V)", position: "T2", voltage: "0V", state: "live" },
        { id: "prox-sig", label: "Sensor Signal Out", position: "T3", voltage: "24.1V", state: "live" },
      ], appearance: { glow: true }},
      "junction-box": { state: "energized", terminals: [
        { id: "jb-sig-in", label: "JB Signal In", position: "T1", voltage: "24.1V", state: "live" },
        { id: "jb-sig-out", label: "JB Signal Out", position: "T2", voltage: "24.1V", state: "live" },
      ]},
      "conduit-wire": { state: "closed", terminals: [
        { id: "wire-jb-side", label: "Wire at JB", position: "T1", voltage: "24.1V", state: "live" },
        { id: "wire-plc-side", label: "Wire at PLC", position: "T2", voltage: "24.1V", state: "live" },
      ]},
    },
    activeAnimations: [
      { type: "led_blink", targetId: "plc-cpu", duration: 1000, loop: true, intensity: 0.8, color: "green" },
      { type: "led_blink", targetId: "plc-io", duration: 1000, loop: true, intensity: 0.8, color: "green" },
    ],
    availableActions: [],
    visibleFaults: [],
  },
};

const phases: ScenarioPhase[] = [
  {
    id: "phase-1-diagnose",
    title: "Diagnose Missing Input",
    narrative: "The automotive stamping press line has stopped mid-cycle. The HMI shows a sequence timeout waiting for the 'Part Present' proximity sensor. The operator says the part is definitely in position and the sensor's yellow LED is on, but the press won't cycle. Your job: trace the signal and find out why the PLC isn't seeing it.",
    activeFaultId: "broken-wire",
    initialStateId: "sensor-faulted",
    locations: [
      {
        id: "field-sensor",
        label: "Press Bed - Proximity Sensor",
        description: "Turck 3-wire PNP proximity sensor mounted on the press bed.",
        compatibleTools: ["multimeter", "flashlight"],
        terminalMeasurements: [
          {
            fromTerminal: "prox-sig",
            toTerminal: "prox-com",
            requiredSetting: "vdc",
            reading: "24.1",
            unit: "V DC",
            isKeyClue: true,
            interpretation: "The sensor is outputting 24V on its signal wire. The sensor is working correctly.",
            newTechExplanation: "A PNP sensor sends 24V out on the signal wire when it detects a target. Since we measure 24V here, the sensor is doing its job.",
          },
          {
            fromTerminal: "prox-pwr",
            toTerminal: "prox-com",
            requiredSetting: "vdc",
            reading: "24.1",
            unit: "V DC",
            isKeyClue: false,
            interpretation: "The sensor has good 24V power.",
            newTechExplanation: "The sensor needs power to work. 24V is present.",
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "Sensor is securely mounted. Yellow target LED is ON. Cable to junction box looks intact.",
            unit: "",
            interpretation: "Physical inspection shows no obvious damage to the sensor or its immediate cable.",
            isKeyClue: false,
          },
        },
      },
      {
        id: "junction-box",
        label: "Machine Junction Box",
        description: "Terminal box where field sensor cables transition to individual wires in conduit.",
        compatibleTools: ["multimeter", "flashlight"],
        terminalMeasurements: [
          {
            fromTerminal: "jb-sig-out",
            toTerminal: "prox-com",
            requiredSetting: "vdc",
            reading: "24.1",
            unit: "V DC",
            isKeyClue: true,
            interpretation: "The 24V signal makes it to the junction box terminal block and onto the wire heading to the PLC.",
            newTechExplanation: "The signal is good here. The break must be further down the line, between this box and the PLC.",
          },
        ],
      },
      {
        id: "plc-panel",
        label: "Main PLC Panel",
        description: "Allen-Bradley CompactLogix PLC with Slot 3 discrete input module.",
        compatibleTools: ["multimeter", "prints", "flashlight"],
        terminalMeasurements: [
          {
            fromTerminal: "io-in-0",
            toTerminal: "io-com",
            requiredSetting: "vdc",
            reading: "0.0",
            unit: "V DC",
            isKeyClue: true,
            interpretation: "0V at the PLC input terminal. The signal is lost between the junction box and here.",
            newTechExplanation: "The PLC needs 24V on this terminal to turn on the input. It's getting 0V, so the wire from the junction box must be broken.",
          },
          {
            fromTerminal: "wire-jb-side",
            toTerminal: "wire-plc-side",
            requiredSetting: "ohms",
            reading: "OL",
            unit: "Ω",
            isKeyClue: true,
            interpretation: "Infinite resistance on the signal wire confirms it is broken inside the conduit.",
            newTechExplanation: "OL means the wire is completely broken. Electricity cannot flow through it.",
          },
        ],
        simpleReadings: {
          prints: {
            value: "Drawing shows: Prox Sensor Signal (Black wire) -> JB Terminal 12 -> Wire 1012 in Conduit C-4 -> PLC Slot 3 Input 0.",
            unit: "",
            interpretation: "Prints confirm the signal path. The wire in conduit C-4 is the suspect.",
            isKeyClue: true,
          },
          flashlight: {
            value: "PLC CPU is running. Slot 3 Input 0 LED is OFF.",
            unit: "",
            interpretation: "Confirms the PLC is not seeing the input.",
            isKeyClue: false,
          },
        },
      },
    ],
    advanceConditions: [
      {
        requiredClues: ["prox-sig:prox-com:vdc", "io-in-0:io-com:vdc"],
        requiredAction: "replace-wire",
        nextPhaseId: "complete",
        transitionText: "Wire replaced. Signal restored to PLC. Press resumes operation. Good job tracing the signal!",
        transitionAnimation: { type: "relay_click", targetId: "plc-io", duration: 500 },
      },
    ],
    hints: {
      new: "Start at the sensor. Is it sending a signal? Measure voltage from the signal wire to common. If it is, check if the signal reaches the PLC input terminal.",
      experienced: "Verify the sensor output at the field device, then check the PLC input terminal. If you have voltage at the sensor but not the PLC, the wire is broken.",
      senior: null,
    },
    seniorCheckpoint: {
      question: "You measure 24V at the sensor output but 0V at the PLC input. What is the most efficient next step?",
      options: [
        { id: "opt1", text: "Replace the sensor.", isCorrect: false, feedback: "The sensor is already outputting 24V. Replacing it won't fix a broken wire.", scoreImpact: -5 },
        { id: "opt2", text: "Check the signal at the intermediate junction box.", isCorrect: true, feedback: "Correct. Halving the circuit helps isolate whether the break is in the sensor cable or the conduit.", scoreImpact: 15 },
        { id: "opt3", text: "Replace the PLC input module.", isCorrect: false, feedback: "The module isn't receiving voltage. Replacing it won't help.", scoreImpact: -5 },
      ],
    },
  },
];

export const scenarioPLCIOFault: ScenarioV3 = {
  id: "plc-io-fault-v3",
  title: "PLC I/O Fault — Broken Signal Wire",
  type: "control_circuit",
  version: 3,
  estimatedMinutes: { new: 25, experienced: 15, senior: 10 },
  description: "A proximity sensor input is not registering on the PLC despite the sensor being triggered. Trace the signal to find a broken wire in the conduit.",
  faults: [
    {
      id: "broken-wire",
      order: 1,
      name: "Broken Signal Wire in Conduit",
      description: "The signal wire from the junction box to the PLC input module is broken inside the conduit.",
      componentId: "conduit-wire",
      revealedBy: ["prox-sig:prox-com:vdc", "io-in-0:io-com:vdc", "wire-jb-side:wire-plc-side:ohms"],
      correctFixId: "replace-wire",
      rootCause: "Vibration from the stamping press caused the wire to chafe and eventually break inside the rigid conduit.",
      technicalDetail: "A broken wire creates an open circuit. The 24V signal from the PNP sensor cannot reach the PLC input module. Tracing the voltage along the path is the standard troubleshooting method.",
      preventionSteps: [
        "Use stranded wire rated for high vibration environments.",
        "Ensure proper strain relief at junction boxes.",
        "Inspect conduit runs for secure mounting.",
      ],
    },
  ],
  plantContext: {
    plantName: "Detroit Auto Stamping",
    lineName: "Press Line 2",
    lineNumber: "PL2",
    shift: "Swing Shift",
    shiftTime: "14:00 - 22:00",
    downstreamImpact: "Assembly line starvation.",
    waitingOn: "Maintenance technician",
    productionRate: "120 parts/hour",
    costPerMinute: "$150/min",
    downSince: "14:22",
  },
  faultLog: [
    { timestamp: "14:22:10", source: "PLC", code: "SEQ-TIMEOUT", description: "Press sequence timeout - waiting on part present sensor", severity: "critical" },
  ],
  glossary: [
    {
      term: "PNP Proximity Sensor",
      definition: "A sensor that outputs a positive voltage (usually 24V DC) on its signal wire when it detects a target. Also known as a 'sourcing' sensor.",
    },
    {
      term: "Discrete Input Module",
      definition: "A PLC module that detects on/off signals from field devices like switches and proximity sensors.",
    },
    {
      term: "Conduit",
      definition: "A tube used to protect and route electrical wiring in a building or structure.",
    },
    {
      term: "Junction Box",
      definition: "An enclosure used to house electrical connections, protecting them from the environment and accidental contact.",
    },
    {
      term: "Open Circuit",
      definition: "An electrical circuit that is not complete, preventing current from flowing. Often caused by a broken wire or blown fuse.",
    },
  ],
  tools: DEFAULT_TOOLS_V3,
  diagram: {
    title: "Press Line 2 — Part Present Sensor Circuit",
    type: "control_circuit",
    rails: { left: "24V DC+", right: "24V DC−" },
    rungs: [
      {
        id: "rung-sensor",
        label: "Part Present Sensor",
        components: [
          { id: "prox-sensor", type: "switch", label: "Prox Sensor", position: { col: 1, row: 1 }, state: "closed", tapInfo: { function: "Detects part in press", currentState: "Triggered (24V out)", normalState: "Triggered when part present" }},
          { id: "junction-box", type: "terminal", label: "JB Terminal 12", position: { col: 2, row: 1 }, state: "energized", tapInfo: { function: "Connection point", currentState: "24V present", normalState: "24V when sensor triggered" }},
          { id: "conduit-wire", type: "fuse", label: "Wire 1012", position: { col: 3, row: 1 }, state: "faulted", isFaultSource: true, tapInfo: { function: "Signal wire to PLC", currentState: "BROKEN - Open circuit", normalState: "Conducting" }},
          { id: "plc-io", type: "plc_input", label: "PLC Input 0", position: { col: 4, row: 1 }, state: "de-energized", tapInfo: { function: "PLC Input", currentState: "0V - OFF", normalState: "24V - ON" }},
        ],
        connections: [
          { from: "prox-sensor", to: "junction-box", style: "normal" },
          { from: "junction-box", to: "conduit-wire", style: "normal" },
          { from: "conduit-wire", to: "plc-io", style: "broken" },
        ],
      },
    ],
  },
  systemStates,
  phases,
  timePressure: [
    { triggerMinutes: 5, from: "Line Operator", role: "Operator", message: "Hey, the press is still waiting. The part is right there, I don't know why it won't go.", urgency: "low" },
    { triggerMinutes: 10, from: "Production Supervisor", role: "Supervisor", message: "Assembly is starting to run low on parts. Have you found the issue yet?", urgency: "medium" },
    { triggerMinutes: 20, from: "Plant Manager", role: "Plant Manager", message: "We are starving the assembly line. I need this press running NOW.", urgency: "critical" },
  ],
  communications: [
    { id: "operator-report", type: "in_person", label: "Talk to Operator", icon: "User", contact: "Operator - John", response: "The press just stopped mid-cycle. The part is in there, and the little yellow light on the sensor is on, but the screen says it's waiting for the part.", isUseful: true, clueId: "operator-info" },
    { id: "maintenance-log", type: "maintenance_log", label: "Check Maintenance Log", icon: "Clipboard", contact: "CMMS", response: "Work order from last month: 'Replaced proximity sensor, old one was smashed by a part.'", isUseful: false },
    { id: "scada-history", type: "scada_history", label: "Check SCADA", icon: "Monitor", contact: "SCADA", response: "Input 0 dropped out unexpectedly during the press cycle.", isUseful: true },
  ],
  scoring: {
    clueDiscovery: 10,
    efficiencyBonus: 15,
    unnecessaryMeasurementPenalty: -3,
    seniorCheckpointCorrect: 15,
    hintPenalty: -5,
    wrongSettingPenalty: -5,
    unsafeActionPenalty: -20,
    communicationBonus: 5,
    optimalOrderBonus: 10,
    timeBonuses: [
      { underMinutes: 10, bonus: 20 },
      { underMinutes: 15, bonus: 10 },
      { underMinutes: 20, bonus: 5 },
    ],
    maxScore: 100,
    passingScore: 60,
  },
  ambientAnimations: [
    { type: "led_blink", targetId: "plc-cpu", duration: 1000, loop: true, intensity: 0.6, color: "green" },
  ],
  guidedHints: {
    gather: [
      "The operator says the sensor's yellow light is on, but the PLC is waiting for it.",
      "Check the PLC input module LEDs. Is the LED for Input 0 on?",
      "If the sensor light is on but the PLC LED is off, the signal isn't making it to the PLC.",
    ],
    prints: [
      "Look at the prints to trace the signal path from the sensor to the PLC.",
      "Identify the wire numbers and junction boxes involved.",
      "The signal goes from the sensor, through a junction box, and then through conduit to the PLC.",
    ],
    measure: [
      "Measure the voltage at the sensor output to confirm it's actually sending 24V.",
      "Measure the voltage at the PLC input terminal.",
      "If you have 24V at the sensor but 0V at the PLC, measure at the junction box to narrow down the break.",
    ],
    analyze: [
      "You have 24V at the junction box but 0V at the PLC.",
      "This means the wire inside the conduit between the junction box and the PLC is broken.",
    ],
    action: [
      "Pull a new wire through the conduit to replace the broken one.",
      "Verify the PLC input LED turns on and the press sequence resumes.",
    ],
    coachingOverrides: {
      gather: "Listen to the operator. The sensor light is on, which means it's detecting the part. The problem is getting that information to the PLC.",
      measure: "Trace the voltage. Start at the source (the sensor) and follow it towards the destination (the PLC) until you lose it.",
    },
  },
};
