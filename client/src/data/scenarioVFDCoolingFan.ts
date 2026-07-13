/**
 * EAS Simulator V3 — VFD Cooling Fan Failure Scenario
 * 
 * "VFD Overtemperature — Cooling Fan Seized on Paint Booth Exhaust"
 * 
 * Single fault: VFD internal cooling fan bearing has seized. Drive overheats under load.
 * Intermittent at first (thermal shutdown, cools down, restarts) but now persistent.
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
    id: "fan-seized",
    order: 1,
    name: "VFD Internal Cooling Fan Seized",
    description: "Cooling fan bearing has seized from paint overspray contamination. Heatsink temperature exceeds 85°C.",
    componentId: "vfd-fan",
    revealedBy: ["fan-inspection", "heatsink-temp"],
    correctFixId: "replace-fan",
    rootCause: "The VFD's internal cooling fan (24VDC, 80mm) has accumulated paint overspray on its blades and bearing over 3 years in the paint booth environment. The overspray created an imbalance that accelerated bearing wear. The bearing has now seized completely, stopping all airflow over the heatsink. Without forced air cooling, the IGBT heatsink reaches 85°C within 8 minutes of operation at >50% load.",
    technicalDetail: "The PowerFlex 525 uses a single 80mm DC fan to cool the IGBT heatsink. Thermal protection trips at 85°C (F006 - Heatsink OT). At ambient 78°F (25.5°C) with no fan, the heatsink temperature rises at approximately 7.5°C/minute under 75% load. The drive can run at <30% load indefinitely without the fan (natural convection sufficient), but any significant load causes rapid overheating.",
    preventionSteps: [
      "Install VFD in NEMA 4X enclosure with filtered air intake in paint environments",
      "Clean VFD cooling fan quarterly in contaminated environments",
      "Add external temperature monitoring with alarm at 70°C",
      "Keep spare cooling fan in stock (part number: 25B-FAN-01)",
      "Consider relocating VFD away from paint overspray zone",
    ],
  },
];

const faultLog: FaultLogEntry[] = [
  { timestamp: "10:38:44.221", source: "VFD-08", code: "F006", description: "HEATSINK OVERTEMPERATURE — 85°C exceeded", severity: "critical" },
  { timestamp: "10:38:44.100", source: "VFD-08", code: "A006", description: "Heatsink temperature: 87°C (trip threshold: 85°C)", severity: "critical" },
  { timestamp: "10:30:22.445", source: "VFD-08", code: "A006", description: "Heatsink temperature WARNING: 75°C (rising rapidly)", severity: "warning" },
  { timestamp: "10:22:00.000", source: "VFD-08", code: "S001", description: "Drive started — exhaust fan ON", severity: "info" },
  { timestamp: "09:15:33.112", source: "VFD-08", code: "F006", description: "HEATSINK OT — 2nd trip today (cooled and restarted)", severity: "critical" },
  { timestamp: "07:45:08.556", source: "VFD-08", code: "F006", description: "HEATSINK OT — 1st trip today (ambient was cooler, ran 25 min)", severity: "critical" },
];

const plantContext = {
  plantName: "AutoFinish Coatings — Paint Line 1",
  lineName: "Paint Booth 2 — Exhaust Fan System",
  lineNumber: "PB-02-EXH-01",
  shift: "1st Shift",
  shiftTime: "06:00 – 14:00",
  downstreamImpact: "Paint booth CANNOT operate without exhaust — explosive vapor accumulation risk",
  waitingOn: "Paint booth shut down, 4 painters idle, 12 vehicles waiting for paint",
  productionRate: "3 vehicles/hr ($850 paint job average)",
  costPerMinute: "$42.50/min + safety shutdown",
  downSince: "10:38 (3rd thermal trip today — won't cool down fast enough now)",
  temperature: "78°F (booth area), VFD enclosure: 95°F (poor ventilation)",
  humidity: "40%",
  lastPMDate: "Never cleaned fan (not in PM checklist)",
  machineAge: "3 years (installed 2023)",
};

const glossary: GlossaryTerm[] = [
  {
    term: "F006",
    abbreviation: "Heatsink Overtemperature",
    definition: "PowerFlex fault code indicating the IGBT heatsink has exceeded its maximum safe operating temperature (85°C). The drive shuts down to prevent permanent damage to the power semiconductors. Common causes: blocked airflow, fan failure, high ambient temperature, or overloading.",
    stateDiagram: {
      normalState: "Heatsink: 40-55°C\nFan: Running (2800 RPM)\nAirflow: Normal",
      faultState: "Heatsink: >85°C\nFan: STOPPED (seized)\nAirflow: NONE",
      normalLabel: "Normal cooling",
      faultLabel: "Overtemperature — no cooling",
    },
  },
  {
    term: "heatsink",
    definition: "An aluminum finned structure that absorbs heat from the IGBTs and dissipates it to the air. The cooling fan forces air through the fins. Without airflow, the heatsink cannot dissipate heat fast enough and temperature rises rapidly under load.",
  },
  {
    term: "derating",
    definition: "Reducing the output capacity of a VFD due to adverse conditions (high altitude, high ambient temperature, or reduced cooling). A drive with no cooling fan must be derated to approximately 30% of rated output to avoid overheating.",
  },
];

const diagram: CircuitDiagram = {
  title: "PB-02 Exhaust Fan — VFD Thermal System",
  type: "vfd_power",
  rails: { left: "L1 (480V)", right: "L3 (480V)" },
  rungs: [
    {
      id: "rung-1",
      label: "VFD Power & Cooling",
      components: [
        { id: "disconnect", type: "disconnect", label: "Disconnect QF1", position: { col: 0, row: 0 }, state: "closed", tapInfo: { function: "480V disconnect for exhaust VFD", currentState: "CLOSED", normalState: "Closed during operation" } },
        { id: "vfd-1", type: "vfd", label: "PowerFlex 525 (15HP)", position: { col: 1, row: 0, span: 2 }, state: "faulted", tapInfo: { function: "15HP VFD — controls exhaust fan speed", currentState: "FAULTED — F006 Heatsink OT (87°C)", normalState: "Running at 55Hz, heatsink 48°C" } },
        { id: "vfd-fan", type: "terminal", label: "Cooling Fan", position: { col: 3, row: 0 }, state: "faulted", isFaultSource: true, tapInfo: { function: "80mm DC cooling fan — forces air over heatsink", currentState: "SEIZED — bearing locked, no rotation", normalState: "Running at 2800 RPM" } },
        { id: "motor-1", type: "motor", label: "Exhaust Fan Motor (15HP)", position: { col: 4, row: 0 }, state: "stalled", tapInfo: { function: "15HP motor — drives paint booth exhaust fan", currentState: "STOPPED — VFD thermal trip", normalState: "Running at 1650 RPM" } },
      ],
      connections: [
        { from: "disconnect", to: "vfd-1", style: "normal" },
        { from: "vfd-1", to: "vfd-fan", style: "broken" },
        { from: "vfd-1", to: "motor-1", style: "normal" },
      ],
    },
  ],
};

const systemStates: Record<string, SystemState> = {
  "overtemp-faulted": {
    id: "overtemp-faulted",
    label: "VFD Faulted — F006 Heatsink Overtemperature",
    description: "Cooling fan seized. Heatsink at 87°C. Drive tripped to protect IGBTs. Must cool before restart.",
    componentStates: {
      "vfd-1": { state: "faulted", appearance: { glow: true, color: "red" } },
      "vfd-fan": { state: "faulted", appearance: { pulse: true, color: "amber" } },
      "motor-1": { state: "stalled" },
    },
    activeAnimations: [
      { type: "led_blink", targetId: "vfd-1", duration: 99999, loop: true, color: "red" },
      { type: "thermal_gradient", targetId: "vfd-1", duration: 99999, loop: true },
    ],
    availableActions: [
      {
        id: "replace-fan",
        label: "Replace seized cooling fan with new unit",
        description: "Remove old fan, install new 80mm DC fan (part: 25B-FAN-01)",
        category: "replace",
        targetComponentId: "vfd-fan",
        resultStateId: "fixed-running",
        isCorrect: true,
        consequence: "New cooling fan installed. Heatsink temperature dropping: 87°C → 72°C → 58°C → 45°C. VFD reset and started. Exhaust fan running at full speed. Heatsink stable at 48°C. Paint booth cleared for operation.",
        scoreImpact: 30,
        animation: { type: "current_flow", targetId: "vfd-1", duration: 3000, intensity: 0.4 },
      },
      {
        id: "wait-and-restart",
        label: "Wait for cooldown then restart",
        description: "Let the VFD cool naturally, then reset and run",
        category: "reset",
        targetComponentId: "vfd-1",
        resultStateId: "overtemp-faulted",
        isCorrect: false,
        consequence: "After 20 minutes, heatsink cools to 60°C. VFD resets and starts. Runs for 8 minutes then trips again at 85°C. Without the cooling fan, it will ALWAYS overheat under load. This is not a solution.",
        scoreImpact: -10,
      },
      {
        id: "external-fan",
        label: "Point a portable fan at the VFD enclosure",
        description: "Use a shop fan to blow air into the VFD cabinet",
        category: "adjust",
        targetComponentId: "vfd-1",
        resultStateId: "overtemp-faulted",
        isCorrect: false,
        consequence: "External fan provides some cooling but can't match the directed airflow of the internal fan over the heatsink fins. Temperature stabilizes at 78°C — just below trip but not sustainable. Also introduces unfiltered air (paint dust) into the drive. Temporary band-aid only.",
        scoreImpact: -5,
        safetyWarning: "Unfiltered air from a shop fan will introduce paint overspray into the VFD, accelerating contamination damage.",
      },
      {
        id: "reduce-load",
        label: "Run exhaust fan at 50% speed to reduce heat generation",
        description: "Lower the speed reference to reduce VFD power dissipation",
        category: "adjust",
        targetComponentId: "vfd-1",
        resultStateId: "overtemp-faulted",
        isCorrect: false,
        consequence: "At 50% speed, the VFD generates less heat and might not trip. But the exhaust fan at 50% speed provides insufficient airflow for safe paint booth operation. Explosive vapor concentration will exceed LEL limits. BOOTH CANNOT OPERATE SAFELY.",
        scoreImpact: -20,
        safetyWarning: "Paint booth exhaust below design airflow creates explosive atmosphere risk. OSHA 1910.94 and NFPA 33 require minimum exhaust velocity.",
      },
    ],
    visibleFaults: faultLog,
  },
  "fixed-running": {
    id: "fixed-running",
    label: "System Running — Fan Replaced",
    description: "New cooling fan installed. Heatsink temperature normal. Exhaust fan running at full speed.",
    componentStates: {
      "vfd-1": { state: "energized", appearance: { color: "green" } },
      "vfd-fan": { state: "energized", appearance: { color: "green" } },
      "motor-1": { state: "running", appearance: { color: "green" } },
    },
    activeAnimations: [
      { type: "motor_spin", targetId: "motor-1", duration: 99999, loop: true },
      { type: "current_flow", targetId: "vfd-1", duration: 99999, loop: true, intensity: 0.3 },
    ],
    availableActions: [],
    visibleFaults: [
      { timestamp: "11:15:00.000", source: "SYSTEM", code: "OK", description: "Fan replaced — heatsink 48°C, exhaust running at full speed", severity: "info" },
    ],
  },
};

const timePressure: TimePressureEvent[] = [
  {
    triggerMinutes: 2,
    from: "Paint Booth Supervisor",
    role: "Production",
    message: "The booth is shut down — we can't spray without exhaust. That's 4 painters standing around and 12 vehicles in queue. What's wrong with the fan?",
    urgency: "medium",
  },
  {
    triggerMinutes: 5,
    from: "Safety Manager",
    role: "EHS",
    message: "I've been notified the paint booth exhaust is down. Reminder: NO painting operations are permitted without exhaust running. If anyone tries to spray without it, shut them down immediately. What's the ETA on repair?",
    urgency: "high",
  },
  {
    triggerMinutes: 9,
    from: "Plant Manager",
    role: "Operations",
    message: "12 vehicles waiting for paint. We're losing $42/min in throughput. The body shop is backing up. I need this fixed NOW or we're outsourcing today's paint work at 3x cost.",
    urgency: "critical",
  },
];

const communications: CommunicationChannel[] = [
  {
    id: "ask-painters",
    type: "radio",
    label: "Ask Paint Booth Operators",
    icon: "Radio",
    contact: "Tony (Lead Painter)",
    response: "It's been acting up for about a week. It would run for a while then shut off. We'd wait 15-20 minutes and it would start again. Today it won't stay running more than 10 minutes. Also — I noticed the VFD cabinet feels really hot when I walk past it.",
    isUseful: true,
    clueId: "operator-info",
  },
  {
    id: "check-pm",
    type: "maintenance_log",
    label: "Check PM Records",
    icon: "BookOpen",
    contact: "CMMS System",
    response: "PM history for PB-02-EXH-01: Belt tension checked quarterly, motor greased semi-annually, VFD filter replaced annually. NOTE: No line item for internal VFD fan inspection or cleaning. Environment classification: 'Contaminated — paint overspray present.'",
    isUseful: true,
    clueId: "pm-info",
  },
  {
    id: "check-parts",
    type: "phone",
    label: "Check Spare Parts Inventory",
    icon: "Phone",
    contact: "Storeroom",
    response: "Cooling fan for PowerFlex 525 (25B-FAN-01)? Let me check... Yes, we have 2 in stock. Shelf B-14. I can have it at the paint booth in 5 minutes.",
    isUseful: true,
    clueId: "parts-info",
  },
];

const phases: ScenarioPhase[] = [
  {
    id: "phase-1-overtemp",
    title: "Phase 1: VFD Overtemperature Investigation",
    narrative: "The paint booth exhaust VFD keeps tripping on {F006} ({heatsink} overtemperature). It's been getting worse all week — running shorter each time before tripping. The paint booth CANNOT operate without exhaust (explosive vapor risk). The VFD cabinet feels extremely hot to the touch. You need to determine why the drive is overheating and fix it quickly — 4 painters are idle and the safety manager is watching.",
    activeFaultId: "fan-seized",
    initialStateId: "overtemp-faulted",
    locations: [
      {
        id: "vfd-cabinet",
        label: "VFD Cabinet — External Inspection",
        description: "NEMA 1 enclosure with ventilation slots, mounted on booth wall",
        compatibleTools: ["flashlight", "thermal_camera"],
        simpleReadings: {
          flashlight: {
            value: "Cabinet ventilation slots partially clogged with paint overspray. Cabinet door warm to touch. Through the vent slots: NO FAN ROTATION VISIBLE. Fan blades coated in dried paint overspray.",
            unit: "",
            interpretation: "Cooling fan is NOT spinning — this is why the drive is overheating",
            isKeyClue: true,
            visualEffect: "critical",
          },
          thermal_camera: {
            value: "VFD heatsink: 82°C (cooling down slowly). Cabinet interior: 65°C. Ambient outside cabinet: 32°C. Fan motor: 45°C (not running, just absorbing heat). Normal heatsink temp with fan: 45-55°C.",
            unit: "",
            interpretation: "Heatsink 30°C above normal confirms inadequate cooling. Fan not running = root cause.",
            isKeyClue: true,
            visualEffect: "critical",
            animation: { type: "thermal_gradient", targetId: "vfd-1", duration: 3000 },
          },
        },
      },
      {
        id: "vfd-fan-check",
        label: "VFD Internal Fan — Direct Inspection",
        description: "80mm DC cooling fan mounted on bottom of heatsink (LOTO required to open cabinet)",
        compatibleTools: ["flashlight", "multimeter"],
        simpleReadings: {
          flashlight: {
            value: "Fan blades HEAVILY coated in paint overspray. Attempted to spin by hand — SEIZED. Bearing is locked. Paint buildup visible on shaft. Fan model: 80mm, 24VDC, 2800 RPM. Part number on label: 25B-FAN-01.",
            unit: "",
            interpretation: "CONFIRMED — fan bearing is seized from paint contamination. Must be replaced.",
            isKeyClue: true,
            visualEffect: "critical",
          },
        },
        terminalMeasurements: [
          {
            fromTerminal: "FAN+",
            toTerminal: "FAN-",
            requiredSetting: "vdc",
            reading: "24.1",
            unit: "VDC",
            isKeyClue: true,
            interpretation: "24V present at fan terminals — the VFD is trying to run the fan. Fan has power but can't spin = mechanical seizure (not electrical).",
            newTechExplanation: "The VFD provides 24VDC to the fan whenever the drive is powered. 24V at the terminals means the wiring and fan circuit are fine — the fan itself is mechanically stuck.",
          },
        ],
      },
      {
        id: "vfd-display",
        label: "VFD Display & Diagnostics",
        description: "PowerFlex 525 HIM — temperature data and fault history",
        compatibleTools: ["flashlight", "plc_terminal"],
        simpleReadings: {
          flashlight: {
            value: "Display: 'F006 HEATSINK OT'. Temperature: 82°C (dropping slowly). Fault history: F006 x3 today, x12 this week. First occurrence: 5 days ago.",
            unit: "",
            interpretation: "Increasing frequency of thermal trips over the past week — progressive fan degradation until full seizure",
            isKeyClue: false,
          },
          plc_terminal: {
            value: "Thermal data: Current heatsink = 82°C, Trip threshold = 85°C, Warning threshold = 75°C. Fan status: No fan RPM feedback on this model. Load at trip: 78% (normal for exhaust fan operation).",
            unit: "",
            interpretation: "Load is normal — the drive isn't being overworked. The cooling system has failed.",
            isKeyClue: false,
          },
        },
      },
    ],
    communications,
    advanceConditions: [
      {
        requiredClues: ["vfd-cabinet", "vfd-fan-check"],
        requiredAction: "replace-fan",
        nextPhaseId: "complete",
        transitionText: "New cooling fan installed (25B-FAN-01). Fan spinning at 2800 RPM — strong airflow through heatsink fins. Temperature dropping rapidly: 82°C → 65°C → 52°C → 48°C (stable). VFD reset. Exhaust fan starts and runs at full speed. Paint booth cleared for operation. Added 'VFD fan inspection and cleaning' to quarterly PM checklist.",
        transitionAnimation: { type: "motor_spin", targetId: "motor-1", duration: 5000 },
      },
    ],
    hints: {
      new: "The VFD is overheating (F006). What cools a VFD? An internal fan blows air over the heatsink. If the fan isn't working, the drive will overheat. Look at the fan — is it spinning?",
      experienced: "Thermal trip in a contaminated environment. The drive load is normal (78%). Check the cooling system — fan operation and airflow path.",
      senior: "Paint booth environment + progressive thermal trips + 3 years without fan cleaning = seized fan bearing from overspray contamination.",
    },
    seniorCheckpoint: {
      question: "You've confirmed the fan is seized and the heatsink is overheating. Before replacing the fan, what should you recommend to prevent recurrence?",
      options: [
        {
          id: "a",
          text: "Add VFD fan inspection/cleaning to the quarterly PM checklist and install a filtered enclosure",
          isCorrect: true,
          feedback: "Correct. The root cause isn't just a failed fan — it's operating in a contaminated environment without proper protection or maintenance. A NEMA 4X enclosure with filtered intake would protect the drive, and quarterly fan cleaning catches degradation before seizure.",
          scoreImpact: 15,
        },
        {
          id: "b",
          text: "Relocate the VFD to a clean room away from the paint booth",
          isCorrect: false,
          feedback: "While relocating would solve the contamination issue, it's often impractical due to cable length limitations (VFD output cables should be <100 feet to avoid capacitive coupling issues) and the cost of rerouting conduit. A filtered enclosure is more practical.",
          scoreImpact: -5,
        },
        {
          id: "c",
          text: "Install a larger fan for more cooling capacity",
          isCorrect: false,
          feedback: "A larger fan won't fit the mounting and would still seize from paint contamination. The issue isn't cooling capacity — it's contamination protection. The standard fan works perfectly when clean.",
          scoreImpact: -5,
        },
        {
          id: "d",
          text: "Derate the VFD to 50% so it generates less heat",
          isCorrect: false,
          feedback: "Derating means the exhaust fan can't run at full speed, which means insufficient booth ventilation. You'd be creating a safety hazard to compensate for a maintenance issue. Fix the root cause (contamination protection), don't mask it.",
          scoreImpact: -10,
        },
      ],
    },
  },
];

const ambientAnimations: AnimationTrigger[] = [
  { type: "thermal_gradient", targetId: "vfd-1", duration: 99999, loop: true },
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

export const scenarioVFDCoolingFan: ScenarioV3 = {
  id: "vfd-cooling-fan-seized-v3",
  title: "VFD Overtemperature — Cooling Fan Failure",
  type: "VFD Thermal Troubleshooting",
  version: 3,
  estimatedMinutes: { new: 12, experienced: 7, senior: 4 },
  description: "Paint booth exhaust VFD trips on F006 (Heatsink Overtemperature) repeatedly. Getting worse each day. The paint booth is shut down — explosive vapor risk. Find out why the drive is overheating and restore exhaust ventilation before the safety manager shuts down the entire shop.",
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
      "Review the fault log to see the history of F006 trips.",
      "Check the VFD display for current temperature and fault codes.",
      "Ask the paint booth operators about the recent behavior of the exhaust fan."
    ],
    prints: [
      "Locate the VFD and cooling fan in the circuit diagram.",
      "Identify the power source for the cooling fan (internal 24VDC).",
      "Check the PM records for any history of fan maintenance."
    ],
    measure: [
      "Use a flashlight to visually inspect the VFD cooling fan for rotation and contamination.",
      "Use a thermal camera to check the heatsink temperature.",
      "Measure the voltage at the fan terminals to confirm it's receiving 24VDC."
    ],
    analyze: [
      "If the fan has 24VDC but isn't spinning, the issue is mechanical (seized bearing).",
      "Consider the environment: paint overspray can easily contaminate and seize a cooling fan."
    ],
    action: [
      "Replace the seized cooling fan with a new unit (part 25B-FAN-01).",
      "Recommend adding fan inspection and cleaning to the PM checklist."
    ],
    coachingOverrides: {
      gather: "Start by gathering information from the fault log, VFD display, and operators to understand the overheating issue.",
      measure: "Focus on inspecting the cooling fan and measuring its power supply to determine why it's not running."
    }
  },
};
