/**
 * V3 Scenario: Blown Control Fuse — Conveyor Sortation System
 * 
 * A 24V DC control circuit fuse has blown, killing the PLC's I/O module power.
 * The conveyor appears dead but the main power is still live.
 * Teaches: fuse testing workflow, understanding control vs power circuits,
 * checking fuse with meter (continuity + voltage across fuse)
 */
import {
  ScenarioV3,
  SystemState,
  ScenarioPhase,
  DEFAULT_TOOLS_V3,
} from "./scenariosV3";

const systemStates: Record<string, SystemState> = {
  "fuse-blown": {
    id: "fuse-blown",
    label: "Control Fuse Blown — I/O Dead",
    description: "The 24V DC control fuse FU3 has blown. PLC CPU is running but the I/O module has no field power. All outputs are de-energized, inputs show no status.",
    componentStates: {
      "main-disconnect": { state: "closed", terminals: [
        { id: "disc-L1", label: "L1 Input", position: "L1", voltage: "480V", state: "live" },
        { id: "disc-L2", label: "L2 Input", position: "L2", voltage: "480V", state: "live" },
        { id: "disc-L3", label: "L3 Input", position: "L3", voltage: "480V", state: "live" },
      ]},
      "transformer": { state: "energized", terminals: [
        { id: "xfmr-h1", label: "H1 Primary", position: "T1", voltage: "480V", state: "live" },
        { id: "xfmr-h2", label: "H2 Primary", position: "T2", voltage: "480V", state: "live" },
        { id: "xfmr-x1", label: "X1 Secondary", position: "T3", voltage: "120V", state: "live" },
        { id: "xfmr-x2", label: "X2 Secondary", position: "T4", voltage: "0V", state: "live" },
      ]},
      "24v-supply": { state: "energized", terminals: [
        { id: "ps-in-l", label: "AC Input L", position: "L1", voltage: "120V", state: "live" },
        { id: "ps-in-n", label: "AC Input N", position: "N", voltage: "0V", state: "live" },
        { id: "ps-out-pos", label: "24V DC+", position: "T1", voltage: "24.2V", state: "live" },
        { id: "ps-out-neg", label: "24V DC−", position: "T2", voltage: "0V", state: "live" },
      ]},
      "fuse-fu3": { state: "faulted", terminals: [
        { id: "fu3-in", label: "FU3 Line Side", position: "T1", voltage: "24.2V", state: "live" },
        { id: "fu3-out", label: "FU3 Load Side", position: "T2", voltage: "0V", state: "dead" },
      ], appearance: { color: "red", pulse: true }},
      "plc-cpu": { state: "energized", terminals: [
        { id: "plc-24v", label: "PLC CPU Power", position: "T1", voltage: "24V", state: "live" },
      ], appearance: { glow: true }},
      "plc-io": { state: "de-energized", terminals: [
        { id: "io-vdc", label: "I/O Field Power", position: "T1", voltage: "0V", state: "dead" },
        { id: "io-com", label: "I/O Common", position: "COM", voltage: "0V", state: "dead" },
      ], appearance: { opacity: 0.5 }},
      "conveyor-motor": { state: "de-energized" },
      "contactor-m1": { state: "de-energized" },
    },
    activeAnimations: [
      { type: "led_blink", targetId: "plc-cpu", duration: 1000, loop: true, intensity: 0.8, color: "green" },
      { type: "indicator_flash", targetId: "fuse-fu3", duration: 800, loop: true, intensity: 1.0, color: "red" },
    ],
    availableActions: [
      {
        id: "replace-fuse",
        label: "Replace Fuse FU3",
        description: "Remove blown fuse and install new 5A fuse",
        category: "replace",
        targetComponentId: "fuse-fu3",
        resultStateId: "fuse-replaced",
        isCorrect: true,
        consequence: "New fuse installed. 24V DC restored to I/O module. Conveyor resumes operation.",
        scoreImpact: 25,
        animation: { type: "relay_click", targetId: "fuse-fu3", duration: 300 },
        safetyWarning: "Verify source of overcurrent before replacing fuse. If root cause not addressed, new fuse may blow immediately.",
      },
      {
        id: "reset-plc",
        label: "Reset PLC CPU",
        description: "Power cycle the PLC processor",
        category: "reset",
        targetComponentId: "plc-cpu",
        resultStateId: "fuse-blown",
        isCorrect: false,
        consequence: "PLC restarts but I/O module still has no field power. Problem persists — the fuse is still blown.",
        scoreImpact: -10,
      },
      {
        id: "check-main-breaker",
        label: "Check Main Breaker",
        description: "Inspect the main disconnect switch",
        category: "test",
        targetComponentId: "main-disconnect",
        resultStateId: "fuse-blown",
        isCorrect: false,
        consequence: "Main breaker is closed and functioning normally. The issue is downstream in the control circuit.",
        scoreImpact: -5,
      },
      {
        id: "replace-io-module",
        label: "Replace I/O Module",
        description: "Swap the PLC I/O module with a spare",
        category: "replace",
        targetComponentId: "plc-io",
        resultStateId: "fuse-blown",
        isCorrect: false,
        consequence: "New module installed but still shows no power. The problem is the fuse feeding field power, not the module itself.",
        scoreImpact: -15,
        safetyWarning: "Replacing modules with power applied can damage equipment.",
      },
    ],
    visibleFaults: [
      { timestamp: "06:42:15", source: "PLC", code: "I/O FAULT", description: "Slot 2 — No field power detected", severity: "critical", plcModule: "Slot 2" },
      { timestamp: "06:42:15", source: "PLC", code: "COMM LOSS", description: "I/O module communication timeout", severity: "warning" },
      { timestamp: "06:42:14", source: "SCADA", code: "CONV-STOP", description: "Conveyor sortation stopped — no run output", severity: "critical" },
    ],
  },
  "fuse-replaced": {
    id: "fuse-replaced",
    label: "Fuse Replaced — System Restored",
    description: "New 5A fuse installed. 24V DC field power restored to I/O module. PLC outputs re-energized, conveyor running normally.",
    componentStates: {
      "main-disconnect": { state: "closed" },
      "transformer": { state: "energized" },
      "24v-supply": { state: "energized" },
      "fuse-fu3": { state: "closed", terminals: [
        { id: "fu3-in", label: "FU3 Line Side", position: "T1", voltage: "24.2V", state: "live" },
        { id: "fu3-out", label: "FU3 Load Side", position: "T2", voltage: "24.1V", state: "live" },
      ], appearance: { color: "green", glow: true }},
      "plc-cpu": { state: "energized", appearance: { glow: true } },
      "plc-io": { state: "energized", appearance: { glow: true } },
      "conveyor-motor": { state: "running" },
      "contactor-m1": { state: "energized" },
    },
    activeAnimations: [
      { type: "led_blink", targetId: "plc-cpu", duration: 1000, loop: true, intensity: 0.8, color: "green" },
      { type: "led_blink", targetId: "plc-io", duration: 1000, loop: true, intensity: 0.8, color: "green" },
      { type: "motor_spin", targetId: "conveyor-motor", duration: 2000, loop: true, intensity: 0.7 },
    ],
    availableActions: [],
    visibleFaults: [],
  },
};

const phases: ScenarioPhase[] = [
  {
    id: "phase-1-diagnose",
    title: "Diagnose Dead Conveyor",
    narrative: "The sortation conveyor on Pack Line 4 stopped mid-shift. The operator reports it just 'went dead' — no alarm horn, no warning. The PLC faceplate shows the CPU is running (green RUN LED) but the I/O module LEDs are all dark. Your job: find out why the I/O has no power and restore the system.",
    activeFaultId: "blown-fu3",
    initialStateId: "fuse-blown",
    locations: [
      {
        id: "control-panel",
        label: "Control Panel",
        description: "Main control enclosure with PLC, power supply, fuses, and terminal blocks",
        compatibleTools: ["multimeter", "prints", "flashlight"],
        terminalMeasurements: [
          {
            fromTerminal: "fu3-in",
            toTerminal: "fu3-out",
            requiredSetting: "vdc",
            reading: "24.2",
            unit: "V DC",
            isKeyClue: true,
            interpretation: "Full supply voltage across the fuse means the fuse is OPEN (blown). A good fuse would show 0V across it.",
            newTechExplanation: "Think of it like a garden hose: if you measure pressure difference across a section and get full pressure, that section is blocked. A good fuse passes current freely — no voltage drop.",
            animation: { type: "meter_sweep", targetId: "fuse-fu3", duration: 800 },
          },
          {
            fromTerminal: "fu3-in",
            toTerminal: "fu3-out",
            requiredSetting: "ohms",
            reading: "OL",
            unit: "Ω",
            isKeyClue: true,
            interpretation: "Infinite resistance (OL) confirms the fuse element is open. A good fuse reads near 0Ω.",
            newTechExplanation: "OL means 'Over Limit' — the meter can't measure any continuity through the fuse. It's completely broken inside.",
          },
          {
            fromTerminal: "fu3-in",
            toTerminal: "fu3-out",
            requiredSetting: "continuity",
            reading: "NO TONE",
            unit: "",
            isKeyClue: true,
            interpretation: "No continuity beep confirms the fuse is blown. Quick way to check without reading numbers.",
            newTechExplanation: "The beep means 'electricity can flow through.' No beep = broken path = blown fuse.",
          },
          {
            fromTerminal: "ps-out-pos",
            toTerminal: "ps-out-neg",
            requiredSetting: "vdc",
            reading: "24.2",
            unit: "V DC",
            isKeyClue: false,
            interpretation: "Power supply output is healthy at 24.2V DC. The supply itself is not the problem.",
            newTechExplanation: "The 24V power supply is working fine. The problem is somewhere between here and the I/O module.",
          },
          {
            fromTerminal: "io-vdc",
            toTerminal: "io-com",
            requiredSetting: "vdc",
            reading: "0.0",
            unit: "V DC",
            isKeyClue: true,
            interpretation: "0V at the I/O module field power terminals confirms no power is reaching it. Something between the supply and here is open.",
            newTechExplanation: "The I/O module needs 24V to power its inputs and outputs. It's getting nothing — that's why everything is dead.",
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "Visual inspection shows FU3 fuse element appears darkened/discolored. The glass tube has a slight brown tint compared to adjacent fuses.",
            unit: "",
            interpretation: "Discolored fuse body is a visual indicator of a blown fuse, though not always reliable — always confirm with meter.",
            isKeyClue: false,
            visualEffect: "warning",
          },
          prints: {
            value: "Drawing 4-CP-003 shows: 24V PS → FU3 (5A) → TB-4 terminal 7 → PLC I/O field power. FU3 protects the I/O field power circuit only. PLC CPU has separate fuse FU2.",
            unit: "",
            interpretation: "The prints confirm FU3 is the dedicated fuse for I/O field power. This explains why CPU runs but I/O is dead — they have separate fuse protection.",
            isKeyClue: true,
          },
        },
      },
      {
        id: "plc-rack",
        label: "PLC Rack",
        description: "Allen-Bradley CompactLogix rack with CPU and I/O modules",
        compatibleTools: ["multimeter", "flashlight"],
        simpleReadings: {
          flashlight: {
            value: "CPU module: solid green RUN LED, no fault indicators. I/O module (Slot 2): all LEDs dark — no power indicator, no channel status LEDs. Adjacent modules in Slots 1 and 3 show normal green status.",
            unit: "",
            interpretation: "CPU running confirms processor power is good. I/O module completely dark (not even power LED) points to a field power issue, not a module failure.",
            isKeyClue: true,
            visualEffect: "warning",
          },
        },
      },
      {
        id: "motor-starter",
        label: "Motor Starter Bucket",
        description: "Conveyor motor contactor and overload relay",
        compatibleTools: ["multimeter", "flashlight"],
        simpleReadings: {
          flashlight: {
            value: "Contactor M1 is dropped out (de-energized). Overload relay OL1 is not tripped — reset button is flush. Aux contact block appears normal.",
            unit: "",
            interpretation: "Contactor is de-energized because PLC output can't energize it (no I/O field power). Overload is fine — this isn't a motor overload issue.",
            isKeyClue: false,
          },
        },
      },
    ],
    advanceConditions: [
      {
        requiredClues: ["fu3-in:fu3-out:vdc", "fu3-in:fu3-out:ohms"],
        requiredAction: "replace-fuse",
        nextPhaseId: "complete",
        transitionText: "Fuse replaced. 24V DC restored to I/O module. PLC outputs re-energize, contactor pulls in, conveyor resumes sorting. Good diagnosis — you identified the blown control fuse efficiently.",
        transitionAnimation: { type: "contactor_pull", targetId: "contactor-m1", duration: 500 },
      },
      {
        requiredClues: ["fu3-in:fu3-out:continuity", "io-vdc:io-com:vdc"],
        requiredAction: "replace-fuse",
        nextPhaseId: "complete",
        transitionText: "Fuse replaced. System restored. You used continuity and voltage verification at the I/O module to confirm the blown fuse — solid troubleshooting approach.",
        transitionAnimation: { type: "contactor_pull", targetId: "contactor-m1", duration: 500 },
      },
    ],
    hints: {
      new: "Start by checking if the PLC has power. Look at the LEDs on the CPU vs the I/O module. If the CPU is running but I/O is dark, what could cause only the I/O to lose power? Check the electrical prints for the power distribution.",
      experienced: "I/O module dark but CPU running = separate power feeds. Check the fuse protecting I/O field power. Measure voltage across it or check continuity.",
      senior: null,
    },
  },
];

export const scenarioBlownFuse: ScenarioV3 = {
  id: "blown-control-fuse",
  title: "Blown Control Fuse — Conveyor Sortation",
  type: "control_circuit",
  version: 3,
  estimatedMinutes: { new: 20, experienced: 10, senior: 6 },
  description: "A 24V DC control fuse has blown, killing PLC I/O field power. The conveyor is dead but main power is live. Diagnose using voltage-across-fuse and continuity testing techniques.",
  faults: [
    {
      id: "blown-fu3",
      order: 1,
      name: "Blown Fuse FU3",
      description: "5A control fuse FU3 protecting PLC I/O field power has blown due to a momentary short on an output device.",
      componentId: "fuse-fu3",
      revealedBy: ["fu3-in:fu3-out:vdc", "fu3-in:fu3-out:ohms", "fu3-in:fu3-out:continuity"],
      correctFixId: "replace-fuse",
      rootCause: "A proximity sensor on the sortation diverter developed an internal short, drawing excessive current through the I/O field power circuit. The fuse did its job — it protected the wiring and PLC module from damage.",
      technicalDetail: "Control circuit fuses protect sensitive electronics and small-gauge wiring. When a field device shorts, the fuse blows before the PLC output transistor is damaged. The 5A rating is sized for the total I/O field current draw plus margin. Testing technique: voltage across a good fuse = 0V (it's a conductor). Voltage across a blown fuse = full supply voltage (it's an open circuit, so the meter sees source voltage through the load).",
      preventionSteps: [
        "Inspect proximity sensors during PM for damage, loose connections, or contamination",
        "Monitor PLC I/O current draw trends via SCADA",
        "Keep spare fuses of correct rating in panel — never upsize",
        "Label fuse holders clearly with circuit and rating",
      ],
    },
  ],
  plantContext: {
    plantName: "Midwest Distribution Center",
    lineName: "Pack Line 4 — Sortation",
    lineNumber: "PL4-SORT",
    shift: "Day Shift",
    shiftTime: "06:00 - 18:00",
    downstreamImpact: "Packages backing up on infeed conveyor. Manual sorting required.",
    waitingOn: "Maintenance electrician (you)",
    productionRate: "2,400 packages/hour",
    costPerMinute: "$85/min (labor + missed SLA penalties)",
    downSince: "06:42",
  },
  faultLog: [
    { timestamp: "06:42:15", source: "PLC", code: "I/O FAULT", description: "Slot 2 — No field power detected", severity: "critical", plcModule: "Slot 2" },
    { timestamp: "06:42:15", source: "PLC", code: "COMM LOSS", description: "I/O module communication timeout", severity: "warning" },
    { timestamp: "06:42:14", source: "SCADA", code: "CONV-STOP", description: "Conveyor sortation stopped — no run output", severity: "critical" },
    { timestamp: "06:42:14", source: "PLC", code: "OUTPUT OFF", description: "All Slot 2 outputs forced OFF — no field power", severity: "info" },
  ],
  glossary: [
    {
      term: "Control Fuse",
      definition: "A fuse protecting low-voltage control circuits (typically 24V DC or 120V AC). Sized for the total expected current draw of the protected circuit plus a safety margin. Unlike power fuses, control fuses protect sensitive electronics like PLC I/O modules.",
      stateDiagram: { normalState: "Closed (conducting)", faultState: "Open (blown)", normalLabel: "0V across fuse", faultLabel: "Full voltage across fuse" },
    },
    {
      term: "Field Power",
      abbreviation: "FP",
      definition: "The DC voltage (usually 24V) supplied to PLC I/O modules to power field devices (sensors, solenoids, indicators). Separate from the PLC CPU power supply. If field power is lost, the CPU continues running but cannot read inputs or drive outputs.",
    },
    {
      term: "Voltage Across Method",
      definition: "Fuse testing technique: measure voltage from line side to load side of the fuse. A good fuse shows 0V (it conducts freely). A blown fuse shows full supply voltage (the open fuse creates a voltage divider with the load, and the meter reads source voltage through the high-impedance load path).",
    },
    {
      term: "I/O Module",
      abbreviation: "I/O",
      definition: "PLC Input/Output module that interfaces between the processor and field devices. Requires separate field power to operate sensors and actuators. A module with no field power will show no LED activity even if the backplane communication is functional.",
    },
  ],
  tools: DEFAULT_TOOLS_V3,
  diagram: {
    title: "Pack Line 4 — Control Power Distribution",
    type: "control_circuit",
    rails: { left: "24V DC+", right: "24V DC−" },
    rungs: [
      {
        id: "rung-power-dist",
        label: "Control Power Distribution",
        components: [
          { id: "24v-supply", type: "power_supply", label: "24V DC PS", position: { col: 1, row: 1 }, state: "energized", tapInfo: { function: "24V DC power supply", currentState: "Output: 24.2V DC", normalState: "24.0-24.5V DC", explanation: "Converts 120V AC to 24V DC for control circuits" }},
          { id: "fuse-fu3", type: "fuse", label: "FU3 (5A)", position: { col: 2, row: 1 }, state: "faulted", isFaultSource: true, tapInfo: { function: "I/O field power protection", currentState: "BLOWN — open circuit", normalState: "Closed — conducting", explanation: "Protects PLC I/O module field power from overcurrent" }},
          { id: "plc-io", type: "plc_output", label: "PLC I/O Slot 2", position: { col: 3, row: 1 }, state: "de-energized", tapInfo: { function: "PLC I/O module field power", currentState: "0V — no field power", normalState: "24V DC — all channels active", explanation: "Requires field power to drive outputs and read inputs" }},
        ],
        connections: [
          { from: "24v-supply", to: "fuse-fu3", style: "normal" },
          { from: "fuse-fu3", to: "plc-io", style: "broken" },
        ],
      },
      {
        id: "rung-motor",
        label: "Conveyor Motor Control",
        components: [
          { id: "plc-run-output", type: "plc_output", label: "O:2/0 RUN", position: { col: 1, row: 2 }, state: "de-energized", tapInfo: { function: "PLC run command output", currentState: "OFF — no field power", normalState: "ON when run commanded" }},
          { id: "contactor-m1", type: "contactor", label: "M1 Contactor", position: { col: 2, row: 2 }, state: "de-energized", tapInfo: { function: "Conveyor motor contactor", currentState: "Dropped out — no coil voltage", normalState: "Energized when PLC output ON" }},
          { id: "conveyor-motor", type: "motor", label: "Conveyor Motor", position: { col: 3, row: 2 }, state: "de-energized", tapInfo: { function: "1HP sortation conveyor drive", currentState: "Stopped", normalState: "Running at 60Hz" }},
        ],
        connections: [
          { from: "plc-run-output", to: "contactor-m1", style: "normal" },
          { from: "contactor-m1", to: "conveyor-motor", style: "normal" },
        ],
      },
    ],
  },
  systemStates,
  phases,
  timePressure: [
    { triggerMinutes: 3, from: "Pack Line Supervisor", role: "Production Supervisor", message: "Packages are backing up on the infeed. How long until we're running again?", urgency: "medium" },
    { triggerMinutes: 8, from: "Shift Manager", role: "Operations Manager", message: "We're missing SLA targets. The customer is asking for an ETA. What's the status?", urgency: "high" },
    { triggerMinutes: 15, from: "Plant Manager", role: "Plant Manager", message: "I'm hearing we've been down 15 minutes on sortation. Do we need to call in additional help?", urgency: "critical" },
  ],
  communications: [
    { id: "operator-report", type: "in_person", label: "Talk to Operator", icon: "User", contact: "Line Operator — Maria", response: "It just stopped. No noise, no alarm horn. One second it was running, next second everything was dead. I didn't touch anything. The screen on the HMI went to a fault page saying 'I/O Communication Loss'.", isUseful: true, clueId: "operator-info" },
    { id: "maintenance-log", type: "maintenance_log", label: "Check Maintenance Log", icon: "Clipboard", contact: "CMMS System", response: "Last PM on PL4-SORT: 45 days ago. Note from night shift 2 weeks ago: 'Replaced proximity sensor on diverter 3 — was intermittent.' No other recent work orders.", isUseful: true, clueId: "pm-history" },
    { id: "scada-history", type: "scada_history", label: "Check SCADA Trends", icon: "Monitor", contact: "SCADA Historian", response: "I/O field current trend shows a brief spike to 8.2A at 06:42:14 (normal is 2.8A) immediately before the fault. This coincides with diverter 3 proximity sensor circuit.", isUseful: true, clueId: "current-spike" },
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
      { underMinutes: 5, bonus: 20 },
      { underMinutes: 10, bonus: 10 },
      { underMinutes: 15, bonus: 5 },
    ],
    maxScore: 100,
    passingScore: 60,
  },
  ambientAnimations: [
    { type: "led_blink", targetId: "plc-cpu", duration: 1000, loop: true, intensity: 0.6, color: "green" },
  ],

  guidedHints: {
    gather: [
      "The operator said it 'just went dead' — no alarm, no warning. That rules out a PLC fault or safety trip.",
      "Ask the operator: Was there a pop, a smell, or any unusual event right before it stopped?",
      "Check the PLC faceplate — CPU is running (green LED), but I/O LEDs are dark. What powers the I/O separately from the CPU?",
    ],
    prints: [
      "Look at the power distribution section of the prints — trace where 24VDC field power comes from.",
      "Find the fuse that protects the 24VDC I/O power bus. It's separate from the PLC CPU power.",
      "FU3 is the 5A fuse feeding the I/O module field power. If it's blown, all I/O goes dark while the CPU keeps running.",
    ],
    measure: [
      "Set your meter to V DC and measure across the 24VDC power supply output terminals.",
      "If the supply shows 24V output but the I/O module has 0V, the fault is between them — check the fuse.",
      "Measure across FU3 with V DC. A good fuse reads 0V (short circuit). A blown fuse reads full source voltage.",
    ],
    analyze: [
      "You should see 24V at the power supply output but 0V at the I/O module input. The break is at FU3.",
      "A blown fuse with no obvious overload suggests either an intermittent short or the fuse was undersized/fatigued.",
    ],
    action: [
      "Replace FU3 with a new 5A fuse of the same type and rating.",
      "After replacing, verify 24VDC is present at the I/O module and all I/O LEDs return to normal status.",
    ],
    coachingOverrides: {
      gather: "This conveyor 'just went dead' with no alarm. The PLC CPU is running but I/O is dark. Start by finding out exactly what the operator saw — and what they didn't see (no alarm is a big clue).",
      measure: "The key measurement here is DC voltage. You need to trace where 24VDC is present and where it's missing. The break point is your fault location.",
    },
  },
};
