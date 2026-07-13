/**
 * EAS Simulator V3 — DC Bus Undervoltage Fault Scenario
 * 
 * "PowerFlex 525 DC Bus Undervoltage — Mixing Line 2"
 * 
 * Single fault: Aging DC bus capacitors causing undervoltage trips under load.
 * Intermittent fault that gets worse as the shift progresses and load increases.
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
    id: "capacitor-aging",
    order: 1,
    name: "DC Bus Capacitor Degradation",
    description: "Electrolytic capacitors have lost 45% of rated capacitance after 9 years. Bus voltage sags under load.",
    componentId: "dc-bus-caps",
    revealedBy: ["dc-bus-measurement", "capacitance-test"],
    correctFixId: "replace-capacitors",
    rootCause: "The VFD's DC bus capacitor bank (3x 2200µF, 400V rated) has degraded from 9 years of thermal cycling. Electrolyte has partially evaporated, reducing effective capacitance to approximately 1200µF total. Under light load, the bus voltage holds. Under full load (acceleration or high-torque mixing), the capacitors cannot supply sufficient energy and bus voltage drops below the 400V undervoltage threshold.",
    technicalDetail: "Normal DC bus from 480V input: 678V DC. With degraded capacitors, ripple increases from <10V to >80V under load. During acceleration or high-torque demand, the bus sags to 380-395V, triggering F004 (DC Bus Undervoltage). The fault is intermittent because it only occurs during high-current demand events. ESR (Equivalent Series Resistance) has increased from 0.02Ω to 0.15Ω, causing additional voltage drop under current draw.",
    preventionSteps: [
      "Replace DC bus capacitors at 7-year intervals (manufacturer recommendation)",
      "Monitor DC bus voltage ripple during PM — >20V ripple indicates degradation",
      "Check capacitor tops for bulging during annual inspection",
      "Measure capacitance with LCR meter during scheduled downtime",
      "Track undervoltage fault frequency — increasing trips = capacitor degradation",
    ],
  },
];

const faultLog: FaultLogEntry[] = [
  { timestamp: "09:47:22.118", source: "VFD-02", code: "F004", description: "DC BUS UNDERVOLTAGE — bus dropped below 400V threshold", severity: "critical" },
  { timestamp: "09:47:22.050", source: "VFD-02", code: "A003", description: "DC bus voltage: 387V (min threshold: 400V)", severity: "warning" },
  { timestamp: "09:47:21.800", source: "VFD-02", code: "A004", description: "Motor current: 14.8A during high-viscosity mix cycle", severity: "info" },
  { timestamp: "08:22:15.445", source: "VFD-02", code: "F004", description: "DC BUS UNDERVOLTAGE — trip during batch 3 acceleration", severity: "critical" },
  { timestamp: "07:15:33.221", source: "VFD-02", code: "A003", description: "DC bus dip to 415V during startup — recovered", severity: "warning" },
  { timestamp: "06:45:00.000", source: "VFD-02", code: "S001", description: "Drive started — first batch of shift", severity: "info" },
];

const plantContext = {
  plantName: "ChemPro Industries — Plant 2",
  lineName: "Mixing Line 2 — High-Viscosity Mixer",
  lineNumber: "ML-02-MIX-01",
  shift: "1st Shift",
  shiftTime: "06:00 – 14:00",
  downstreamImpact: "Filling line waiting on batch, 2 batches behind schedule",
  waitingOn: "Quality hold on current batch — mixer must restart within 15 min or batch is scrapped ($4,200)",
  productionRate: "1 batch/45 min ($4,200/batch)",
  costPerMinute: "$93/min + batch scrap risk",
  downSince: "09:47 (3rd trip today)",
  temperature: "82°F (process heat from reactor)",
  humidity: "55%",
  lastPMDate: "6 months ago (no capacitor check performed)",
  machineAge: "9 years (installed 2017)",
};

const glossary: GlossaryTerm[] = [
  {
    term: "DC Bus",
    definition: "The internal DC voltage rail in a VFD, created by rectifying the AC input. For 480V input, nominal DC bus is approximately 678V (480 × 1.414). Energy is stored in electrolytic capacitors.",
    stateDiagram: {
      normalState: "Bus voltage: 650-680V DC\nRipple: <10V\nCapacitors: Healthy",
      faultState: "Bus voltage: <400V under load\nRipple: >80V\nCapacitors: DEGRADED",
      normalLabel: "Normal — stable DC bus",
      faultLabel: "Undervoltage — caps failing",
    },
  },
  {
    term: "F004",
    abbreviation: "DC Bus Undervoltage",
    definition: "PowerFlex fault code indicating DC bus voltage dropped below the minimum threshold (typically 400V for a 480V class drive). Common causes: input power loss, capacitor aging, or excessive regenerative braking.",
  },
  {
    term: "ESR",
    abbreviation: "Equivalent Series Resistance",
    definition: "Internal resistance of a capacitor that increases with age. High ESR means the capacitor cannot deliver current quickly, causing voltage sag under load. Measured with an LCR meter or ESR meter.",
  },
  {
    term: "electrolytic capacitor",
    definition: "A polarized capacitor using an electrolyte-soaked paper separator. Common in VFD DC bus sections for energy storage. Lifespan is 7-10 years under normal conditions, less in high-temperature environments. Failure mode: gradual capacitance loss and ESR increase.",
  },
];

const diagram: CircuitDiagram = {
  title: "ML-02 Mixer — VFD DC Bus Detail",
  type: "power_distribution",
  rails: { left: "L1 (480V)", right: "L3 (480V)" },
  rungs: [
    {
      id: "rung-1",
      label: "Rectifier & DC Bus",
      components: [
        { id: "disconnect", type: "disconnect", label: "Disconnect QF1", position: { col: 0, row: 0 }, state: "closed", tapInfo: { function: "480V main disconnect", currentState: "CLOSED", normalState: "Closed" } },
        { id: "rectifier", type: "breaker", label: "Rectifier Bridge", position: { col: 1, row: 0 }, state: "energized", tapInfo: { function: "6-pulse diode bridge — converts AC to DC", currentState: "Operating — output 678V DC nominal", normalState: "Rectifying 480V AC to ~678V DC" } },
        { id: "dc-bus-caps", type: "terminal", label: "DC Bus Capacitors", position: { col: 2, row: 0 }, state: "faulted", isFaultSource: true, tapInfo: { function: "3x 2200µF electrolytic — energy storage", currentState: "DEGRADED — only ~1200µF effective, high ESR", normalState: "6600µF total, ESR <0.02Ω" } },
        { id: "inverter", type: "vfd", label: "Inverter (IGBTs)", position: { col: 3, row: 0 }, state: "faulted", tapInfo: { function: "6 IGBTs — creates PWM output", currentState: "DISABLED — bus undervoltage", normalState: "Switching at 4kHz carrier" } },
        { id: "motor-1", type: "motor", label: "Mixer Motor (10HP)", position: { col: 4, row: 0 }, state: "stalled", tapInfo: { function: "10HP motor — drives high-viscosity mixer paddle", currentState: "STOPPED — drive faulted", normalState: "Running at variable speed 20-60Hz" } },
      ],
      connections: [
        { from: "disconnect", to: "rectifier", style: "normal" },
        { from: "rectifier", to: "dc-bus-caps", style: "normal" },
        { from: "dc-bus-caps", to: "inverter", style: "highlighted" },
        { from: "inverter", to: "motor-1", style: "normal" },
      ],
    },
  ],
};

const systemStates: Record<string, SystemState> = {
  "undervoltage-faulted": {
    id: "undervoltage-faulted",
    label: "VFD Faulted — F004 DC Bus Undervoltage",
    description: "DC bus voltage sagged below 400V during high-torque mixing. Drive tripped to protect IGBTs.",
    componentStates: {
      "dc-bus-caps": { state: "faulted", appearance: { pulse: true, color: "amber" } },
      "inverter": { state: "faulted", appearance: { color: "red" } },
      "motor-1": { state: "stalled" },
    },
    activeAnimations: [
      { type: "led_blink", targetId: "inverter", duration: 99999, loop: true, color: "red" },
    ],
    availableActions: [
      {
        id: "replace-capacitors",
        label: "Schedule capacitor bank replacement (LOTO required)",
        description: "Replace all 3 DC bus capacitors with new matched set",
        category: "replace",
        targetComponentId: "dc-bus-caps",
        resultStateId: "fixed-running",
        isCorrect: true,
        consequence: "Capacitor bank replaced with new matched set (3x 2200µF). DC bus now holds steady at 672V under full load. Ripple reduced to 8V. Mixer running smoothly through high-viscosity cycles.",
        scoreImpact: 30,
        animation: { type: "current_flow", targetId: "inverter", duration: 3000, intensity: 0.5 },
      },
      {
        id: "reset-and-run",
        label: "Reset fault and restart mixer",
        description: "Clear F004 and attempt to resume mixing",
        category: "reset",
        targetComponentId: "inverter",
        resultStateId: "undervoltage-faulted",
        isCorrect: false,
        consequence: "Drive resets and starts. Runs OK at low speed but trips again when mixer hits thick material and current demand increases. Same F004 — capacitors can't sustain bus voltage under load.",
        scoreImpact: -5,
      },
      {
        id: "reduce-speed",
        label: "Reduce mixer speed to lower current demand",
        description: "Drop speed reference from 45Hz to 30Hz to reduce load",
        category: "adjust",
        targetComponentId: "inverter",
        resultStateId: "undervoltage-faulted",
        isCorrect: false,
        consequence: "Lower speed reduces current demand temporarily, but the batch requires full speed for proper mixing. Running slow produces an off-spec batch. And the capacitors will continue to degrade — this is a band-aid, not a fix.",
        scoreImpact: -10,
        safetyWarning: "Running below recipe speed will produce an off-spec batch ($4,200 scrap cost).",
      },
      {
        id: "check-input-power",
        label: "Call electrician to check utility power quality",
        description: "Suspect incoming voltage sag from utility",
        category: "test",
        targetComponentId: "disconnect",
        resultStateId: "undervoltage-faulted",
        isCorrect: false,
        consequence: "Input power measured: 481V L1-L2, 479V L2-L3, 480V L1-L3. Perfectly balanced and stable. The problem is internal to the VFD — the DC bus can't hold voltage because the capacitors are degraded.",
        scoreImpact: -5,
      },
    ],
    visibleFaults: faultLog,
  },
  "fixed-running": {
    id: "fixed-running",
    label: "System Running — Capacitors Replaced",
    description: "New capacitor bank installed. DC bus stable under all load conditions.",
    componentStates: {
      "dc-bus-caps": { state: "energized", appearance: { color: "green" } },
      "inverter": { state: "energized", appearance: { color: "green" } },
      "motor-1": { state: "running", appearance: { color: "green" } },
    },
    activeAnimations: [
      { type: "motor_spin", targetId: "motor-1", duration: 99999, loop: true },
      { type: "current_flow", targetId: "inverter", duration: 99999, loop: true, intensity: 0.3 },
    ],
    availableActions: [],
    visibleFaults: [
      { timestamp: "10:45:00.000", source: "SYSTEM", code: "OK", description: "Capacitors replaced — DC bus stable at 672V under full load", severity: "info" },
    ],
  },
};

const timePressure: TimePressureEvent[] = [
  {
    triggerMinutes: 3,
    from: "Process Engineer",
    role: "Quality",
    message: "The batch in the mixer has a 15-minute hold limit. If we can't restart mixing within 15 minutes, we have to scrap the batch. That's $4,200.",
    urgency: "high",
  },
  {
    triggerMinutes: 8,
    from: "Plant Manager",
    role: "Operations",
    message: "I'm hearing we might lose a $4,200 batch AND we're already 2 batches behind. What's the root cause? Is this a quick fix or do we need to plan for downtime?",
    urgency: "high",
  },
  {
    triggerMinutes: 13,
    from: "Quality Director",
    role: "Quality",
    message: "Batch timer expired. We're scrapping batch #2847. I need a corrective action plan by end of shift. What failed and what's the permanent fix?",
    urgency: "critical",
  },
];

const communications: CommunicationChannel[] = [
  {
    id: "check-pm-records",
    type: "maintenance_log",
    label: "Check PM History",
    icon: "BookOpen",
    contact: "CMMS System",
    response: "Last PM: 6 months ago — checked belt tension, lubricated bearings, cleaned filters. NO capacitor inspection performed. Note: 'VFD is 9 years old — recommend capacitor bank inspection at next shutdown.' Status: Not scheduled.",
    isUseful: true,
    clueId: "pm-history",
  },
  {
    id: "call-vendor",
    type: "phone",
    label: "Call VFD Vendor Tech Support",
    icon: "Phone",
    contact: "Rockwell Tech Support",
    response: "For a 9-year-old PowerFlex 525 with intermittent F004 that worsens under load — that's classic capacitor degradation. The electrolytic caps have a 7-10 year life depending on ambient temperature. Recommend replacing the entire capacitor bank. Part number: 25B-CAPS-KIT-01.",
    isUseful: true,
    clueId: "vendor-info",
  },
  {
    id: "check-scada",
    type: "scada_history",
    label: "Check SCADA DC Bus Trend",
    icon: "Monitor",
    contact: "SCADA System",
    response: "DC bus voltage trend (last 6 months): No-load: 678V (stable). Under load: 678V → 645V → 620V → 580V → today: 387V at trip. Ripple voltage increasing: 8V → 15V → 35V → 80V+. Clear degradation trend.",
    isUseful: true,
    clueId: "scada-trend",
  },
];

const phases: ScenarioPhase[] = [
  {
    id: "phase-1-undervoltage",
    title: "Phase 1: DC Bus Undervoltage Investigation",
    narrative: "The mixer VFD has tripped 3 times today on {F004} (DC Bus Undervoltage). Each time it happens during high-torque mixing when the motor draws peak current. The drive is 9 years old and this fault has been getting more frequent over the past month. You need to determine why the {DC Bus} voltage is dropping and whether this is an input power issue or an internal VFD problem.",
    activeFaultId: "capacitor-aging",
    initialStateId: "undervoltage-faulted",
    locations: [
      {
        id: "vfd-dc-bus",
        label: "VFD DC Bus Measurement Points",
        description: "DC bus test points (DC+ and DC-) inside VFD — LETHAL VOLTAGE",
        compatibleTools: ["multimeter"],
        terminalMeasurements: [
          {
            fromTerminal: "DC+",
            toTerminal: "DC-",
            requiredSetting: "vdc",
            reading: "648",
            unit: "VDC",
            isKeyClue: true,
            interpretation: "DC bus at 648V no-load (should be ~678V). Already 30V low — indicates capacitor degradation even without load.",
            newTechExplanation: "The DC bus should be 480V × 1.414 = 678V. Reading 648V with no load means the capacitors aren't fully charging.",
            animation: { type: "meter_sweep", targetId: "dc-bus-caps", duration: 2000 },
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "Capacitor bank visible: 3x large cylindrical caps. Top of center capacitor shows slight BULGING. Brown discoloration on PCB near cap terminals. No electrolyte leakage visible.",
            unit: "",
            interpretation: "Physical signs of capacitor aging — bulging top is a classic failure indicator",
            isKeyClue: true,
            visualEffect: "warning",
          },
        },
      },
      {
        id: "input-power",
        label: "VFD Input Terminals (L1, L2, L3)",
        description: "480V 3-phase input — verify supply is stable",
        compatibleTools: ["multimeter"],
        terminalMeasurements: [
          {
            fromTerminal: "L1",
            toTerminal: "L2",
            requiredSetting: "vac",
            reading: "481",
            unit: "VAC",
            isKeyClue: false,
            interpretation: "Input voltage normal and stable — problem is not incoming power",
          },
          {
            fromTerminal: "L2",
            toTerminal: "L3",
            requiredSetting: "vac",
            reading: "479",
            unit: "VAC",
            isKeyClue: false,
            interpretation: "All phases balanced — rules out utility power quality issue",
          },
        ],
      },
      {
        id: "vfd-display",
        label: "VFD Display & Fault History",
        description: "PowerFlex 525 HIM — fault data and parameter review",
        compatibleTools: ["flashlight", "plc_terminal"],
        simpleReadings: {
          flashlight: {
            value: "Display: 'F004 DC BUS UV'. Fault data: Bus at trip = 387V, Current at trip = 14.8A, Freq = 45Hz. Fault history: F004 x3 today, x7 this week, x15 this month. INCREASING FREQUENCY.",
            unit: "",
            interpretation: "Increasing fault frequency over time = progressive degradation, not random events",
            isKeyClue: true,
            visualEffect: "critical",
          },
          plc_terminal: {
            value: "DC bus parameter log: No-load = 648V (low, should be 678V). Light load = 610V. Full load = trips at 387V. Bus ripple visible on scope: 80V peak-to-peak (should be <10V). Capacitor health indicator: NOT AVAILABLE on this model.",
            unit: "",
            interpretation: "80V ripple and 30V no-load deficit confirm severe capacitor degradation",
            isKeyClue: true,
            visualEffect: "critical",
          },
        },
      },
    ],
    communications,
    advanceConditions: [
      {
        requiredClues: ["vfd-dc-bus", "vfd-display"],
        requiredAction: "replace-capacitors",
        nextPhaseId: "complete",
        transitionText: "Capacitor bank replaced with new matched set. DC bus now reads 675V no-load, holds at 668V under full load. Ripple reduced to 7V. Mixer running through high-viscosity cycles without any bus sag. Problem solved — schedule capacitor replacement for the other 9-year-old drives on this line.",
        transitionAnimation: { type: "current_flow", targetId: "inverter", duration: 5000, intensity: 0.5 },
      },
    ],
    hints: {
      new: "The fault says 'DC Bus Undervoltage' — the internal DC voltage is dropping too low. Check if the problem is the incoming power (480V supply) or something inside the VFD (capacitors). Measure both.",
      experienced: "F004 frequency is increasing over time. Input power is fine. Drive is 9 years old. What component inside a VFD degrades with age and affects DC bus stability?",
      senior: "9 years old, progressive F004, bus sags only under load. Classic cap degradation. Verify with DC bus measurement and visual inspection.",
    },
    seniorCheckpoint: {
      question: "You've confirmed the DC bus sags under load but input power is stable. What's the most likely root cause for a 9-year-old drive?",
      options: [
        {
          id: "a",
          text: "DC bus electrolytic capacitors have degraded — reduced capacitance and increased ESR cause voltage sag under current demand",
          isCorrect: true,
          feedback: "Correct. Electrolytic capacitors have a 7-10 year lifespan. After 9 years, they lose capacitance and develop high ESR, meaning they can't supply current fast enough during load transients. The progressive worsening over months is the signature of gradual electrolyte evaporation.",
          scoreImpact: 15,
        },
        {
          id: "b",
          text: "Rectifier diodes are failing — not converting AC to DC efficiently",
          isCorrect: false,
          feedback: "If rectifier diodes were failing, you'd see low DC bus voltage ALL the time (not just under load), and likely input fuse failures. The no-load voltage is only slightly low (648V vs 678V), and the dramatic sag under load points to energy storage (capacitors), not rectification.",
          scoreImpact: -5,
        },
        {
          id: "c",
          text: "Motor is drawing too much current — mechanical overload",
          isCorrect: false,
          feedback: "14.8A is within the motor's normal operating range for high-viscosity mixing. The motor current hasn't changed — what's changed is the DC bus's ability to sustain voltage while supplying that current. The problem is the source (capacitors), not the load (motor).",
          scoreImpact: -5,
        },
        {
          id: "d",
          text: "Pre-charge circuit failure — bus not fully charging on startup",
          isCorrect: false,
          feedback: "A pre-charge failure would prevent the bus from reaching full voltage at ALL times, not just under load. The bus reaches 648V no-load (close to normal), then sags under load. This is a capacitance/ESR issue, not a charging issue.",
          scoreImpact: -5,
        },
      ],
    },
  },
];

const ambientAnimations: AnimationTrigger[] = [
  { type: "led_blink", targetId: "inverter", duration: 99999, loop: true, color: "red" },
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

export const scenarioVFDUndervoltage: ScenarioV3 = {
  id: "vfd-dc-bus-undervoltage-v3",
  title: "DC Bus Undervoltage — Capacitor Aging",
  type: "VFD Power Section Troubleshooting",
  version: 3,
  estimatedMinutes: { new: 18, experienced: 10, senior: 6 },
  description: "Mixing Line 2 VFD trips on F004 (DC Bus Undervoltage) intermittently under load. Getting worse each week. The 9-year-old drive's capacitors are the prime suspect. Confirm the diagnosis and plan the repair before you lose another $4,200 batch.",
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
      "Check the VFD display for the exact fault code and operating conditions at the time of the trip.",
      "Review the fault history to see if this is an isolated incident or a recurring issue.",
      "Check the SCADA system or PM records for any historical data on the DC bus voltage."
    ],
    prints: [
      "Locate the DC bus capacitors on the VFD circuit diagram.",
      "Identify the input power terminals (L1, L2, L3) to verify the incoming supply.",
      "Understand the relationship between the rectifier, DC bus, and inverter sections."
    ],
    measure: [
      "Measure the incoming 3-phase power (L1-L2, L2-L3, L1-L3) to rule out utility voltage sags.",
      "Measure the DC bus voltage at the test points (DC+, DC-) with no load.",
      "Use a flashlight to visually inspect the DC bus capacitors for signs of bulging or leakage."
    ],
    analyze: [
      "Compare the no-load DC bus voltage to the expected value (approx. 678V for a 480V supply).",
      "Consider the age of the VFD (9 years) and the typical lifespan of electrolytic capacitors."
    ],
    action: [
      "Since the capacitors are degraded, the entire capacitor bank needs to be replaced.",
      "Do not attempt to just reset the fault or reduce the speed, as this does not fix the root cause."
    ],
    coachingOverrides: {
      gather: "Start by gathering information from the VFD display and fault history to understand the nature of the F004 fault.",
      measure: "Focus on measuring both the incoming AC power and the internal DC bus voltage to isolate the issue."
    }
  },
};
