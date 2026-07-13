/**
 * EAS Simulator V3 — Advanced Multi-Fault Scenario
 * 
 * "VFD Conveyor Down — Packaging Line 7"
 * 
 * Fault 1: E-Stop chain open (Station 2 — operator bumped it during shift change)
 * Fault 2: Motor overload from failing bearing (revealed after E-stop is cleared)
 * 
 * Features demonstrated:
 * - Multi-fault sequential discovery
 * - Dynamic system state transitions (3 states)
 * - Terminal-level meter interaction (specific probes + correct setting)
 * - Time pressure (production manager, shift supervisor, plant manager)
 * - Communication layer (radio operator, call previous shift, maintenance log)
 * - Consequence branching (bypass safety = motor runs but bearing fails catastrophically)
 * - Rich animations (sparks, current flow, motor vibration, relay clicks)
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

// === FAULTS ===

const faults: Fault[] = [
  {
    id: "estop-open",
    order: 1,
    name: "E-Stop Station 2 Engaged",
    description: "Operator bumped E-stop during shift change, didn't notice",
    componentId: "estop-2",
    revealedBy: ["estop-2-continuity"],
    correctFixId: "reset-estop-2",
    rootCause: "E-Stop Station 2 (south side, near palletizer) was inadvertently pressed during 2nd→3rd shift change. The mushroom button is positioned at hip height near a narrow walkway — operators frequently brush against it.",
    technicalDetail: "Safety relay K1 (Allen-Bradley 440R-N23132) dropped out when the series NC E-stop circuit opened. The relay requires all stations in the chain to be closed (NC) before it can be manually reset. PLC input I:1/4 (Safety OK) went low, triggering a controlled stop via the VFD's Safe Torque Off (STO) input.",
    preventionSteps: [
      "Install protective collar/guard around E-stop Station 2",
      "Relocate station 6 inches higher to avoid hip-level contact",
      "Add shift-change checklist item: verify all E-stops are in released position",
      "Install E-stop indicator lights visible from operator station",
    ],
  },
  {
    id: "motor-overload",
    order: 2,
    name: "Motor Bearing Failure — Drive End",
    description: "Drive-end bearing (6205-2RS) is failing, causing excessive current draw",
    componentId: "motor-1",
    revealedBy: ["motor-amps-high"],
    correctFixId: "replace-bearing",
    rootCause: "The drive-end bearing (6205-2RS) has been deteriorating for approximately 3 weeks. Grease has broken down due to operating temperature exceeding 180°F. Metal-to-metal contact is causing increased friction, drawing 18.2A vs. the normal 12.5A FLA. The VFD's overload protection (150% for 60s) will trip within 45 seconds of restart.",
    technicalDetail: "Bearing inner race has developed spalling from fatigue. Vibration velocity at drive end: 12.4 mm/s (alarm threshold: 7.1 mm/s). Motor frame temperature: 195°F (normal: 140°F). Current draw: 18.2A on T1, 17.8A on T2, 18.5A on T3 — slight imbalance indicates rotor eccentricity from bearing wear.",
    preventionSteps: [
      "Implement quarterly vibration monitoring on all conveyor motors",
      "Add bearing temperature sensors (RTD) with PLC alarm at 170°F",
      "Switch to sealed bearing with extended grease life (SKF Explorer series)",
      "Add current monitoring trend to SCADA — alarm at 115% FLA",
      "Schedule bearing replacement at 18-month intervals per manufacturer spec",
    ],
  },
];

// === FAULT LOG ===

const faultLog: FaultLogEntry[] = [
  { timestamp: "22:47:03.112", source: "Safety", code: "SF-001", description: "Safety circuit OPEN — E-stop chain interrupted", severity: "critical", plcModule: "I:1" },
  { timestamp: "22:47:03.115", source: "VFD-07", code: "F070", description: "STO input active — Safe Torque Off engaged", severity: "critical" },
  { timestamp: "22:47:03.118", source: "PLC", code: "I:1/4", description: "Safety OK input FALSE — controlled stop initiated", severity: "critical", plcModule: "I:1" },
  { timestamp: "22:47:03.250", source: "VFD-07", code: "A081", description: "Motor deceleration — ramp-down active (2.5s)", severity: "info" },
  { timestamp: "22:47:05.750", source: "VFD-07", code: "S000", description: "Drive stopped — output disabled", severity: "info" },
  { timestamp: "22:47:06.001", source: "PLC", code: "O:2/0", description: "Conveyor RUN output OFF", severity: "info", plcModule: "O:2" },
  { timestamp: "22:32:15.445", source: "VFD-07", code: "A004", description: "Motor current 115% FLA — approaching overload threshold", severity: "warning" },
  { timestamp: "22:15:08.221", source: "VFD-07", code: "A004", description: "Motor current 110% FLA — elevated load detected", severity: "warning" },
];

// === PLANT CONTEXT ===

const plantContext = {
  plantName: "Midwest Manufacturing — Building C",
  lineName: "Packaging Line 7 — Case Conveyor",
  lineNumber: "PL-07-CONV-03",
  shift: "3rd Shift",
  shiftTime: "22:00 – 06:00",
  downstreamImpact: "Palletizer starved, 3 case packers backing up, shrink wrapper idle",
  waitingOn: "Mike (3rd shift lead), 2 packers standing idle, shipping dock has a truck waiting",
  productionRate: "45 cases/min ($2.80/case)",
  costPerMinute: "$126/min lost production",
  downSince: "22:47 (13 minutes ago)",
  temperature: "78°F (motor area: 95°F ambient)",
  humidity: "62%",
  lastPMDate: "4 months ago (PM-2024-1847)",
  machineAge: "7 years (installed 2019)",
};

// === GLOSSARY ===

const glossary: GlossaryTerm[] = [
  {
    term: "E-Stop",
    abbreviation: "Emergency Stop",
    definition: "A hardwired safety device that immediately removes power from hazardous motion. E-stops are wired in series (daisy-chain) so ANY single button press opens the entire circuit.",
    stateDiagram: {
      normalState: "Button OUT (released)\nContacts: CLOSED\nCircuit: COMPLETE\nSafety relay: ENERGIZED",
      faultState: "Button IN (pressed)\nContacts: OPEN\nCircuit: BROKEN\nSafety relay: DROPPED OUT",
      normalLabel: "Normal — Machine can run",
      faultLabel: "Tripped — All motion stopped",
    },
  },
  {
    term: "STO",
    abbreviation: "Safe Torque Off",
    definition: "A VFD safety function that removes the drive's ability to generate torque. Unlike a simple stop command, STO physically disables the output transistors — the motor CANNOT turn even if the control logic malfunctions.",
    stateDiagram: {
      normalState: "STO input: HIGH (24VDC)\nDrive output: ENABLED\nMotor: CAN RUN",
      faultState: "STO input: LOW (0VDC)\nDrive output: DISABLED\nMotor: CANNOT RUN",
      normalLabel: "STO inactive — Drive enabled",
      faultLabel: "STO active — Drive disabled",
    },
  },
  {
    term: "NC contact",
    abbreviation: "Normally Closed",
    definition: "A contact that is CLOSED (conducting) in its normal/resting state and OPENS when actuated. E-stops use NC contacts so that a broken wire also stops the machine (fail-safe design).",
    stateDiagram: {
      normalState: "Contact: CLOSED ━━━━\nCurrent: FLOWS\nCircuit: COMPLETE",
      faultState: "Contact: OPEN ━ ━ ━\nCurrent: BLOCKED\nCircuit: BROKEN",
      normalLabel: "Resting — current flows",
      faultLabel: "Actuated — current blocked",
    },
  },
  {
    term: "safety relay",
    abbreviation: "K1",
    definition: "A force-guided relay that monitors the safety circuit. When all E-stops are closed (NC), the relay energizes and its output contacts close, providing a 'Safety OK' signal to the PLC. Requires manual reset after a trip.",
    stateDiagram: {
      normalState: "Coil: ENERGIZED\nOutput contacts: CLOSED\nPLC sees: Safety OK (I:1/4 = TRUE)\nReset button: Latched",
      faultState: "Coil: DE-ENERGIZED\nOutput contacts: OPEN\nPLC sees: Safety FAULT (I:1/4 = FALSE)\nReset button: Must be pressed after chain restored",
      normalLabel: "All E-stops OK — machine can run",
      faultLabel: "Chain broken — machine stopped",
    },
  },
  {
    term: "FLA",
    abbreviation: "Full Load Amps",
    definition: "The maximum continuous current a motor draws at rated load and voltage. Exceeding FLA indicates mechanical overload, bearing failure, or voltage issues. This motor's FLA is 12.5A.",
  },
  {
    term: "overload",
    definition: "A protective device (thermal or electronic) that monitors motor current. If current exceeds the setpoint for a defined time (I²t curve), it trips to prevent motor winding damage. The VFD provides electronic overload protection set to 150% for 60 seconds.",
  },
  {
    term: "VFD",
    abbreviation: "Variable Frequency Drive",
    definition: "An electronic motor controller that varies speed by changing the frequency and voltage supplied to the motor. This line uses a PowerFlex 525 (7.5HP, 480V, 3-phase) running at 45Hz for the conveyor speed.",
  },
  {
    term: "megger",
    definition: "An insulation resistance tester that applies 500V or 1000V DC to measure the resistance between motor windings and ground. Good insulation reads >100MΩ. Values below 2MΩ indicate moisture or winding damage.",
  },
];

// === CIRCUIT DIAGRAM ===

const diagram: CircuitDiagram = {
  title: "PL-07 Conveyor Safety & Motor Control Circuit",
  type: "safety_circuit",
  rails: { left: "L1 (480V)", right: "N (Neutral)" },
  rungs: [
    {
      id: "rung-1",
      label: "Safety Circuit (24VDC)",
      components: [
        { id: "ps-24v", type: "power_supply", label: "24VDC Supply", position: { col: 0, row: 0 }, state: "energized", tapInfo: { function: "Provides 24VDC for safety circuit", currentState: "Output: 24.1VDC", normalState: "24VDC ±5%" } },
        { id: "estop-1", type: "estop", label: "E-Stop 1 (North)", position: { col: 1, row: 0 }, state: "closed", tapInfo: { function: "Emergency stop — north side of conveyor", currentState: "RELEASED — contacts closed", normalState: "Released (NC closed)" } },
        { id: "estop-2", type: "estop", label: "E-Stop 2 (South)", position: { col: 2, row: 0 }, state: "open", isFaultSource: true, tapInfo: { function: "Emergency stop — south side near palletizer walkway", currentState: "PRESSED — contacts OPEN ⚠️", normalState: "Released (NC closed)" } },
        { id: "estop-3", type: "estop", label: "E-Stop 3 (Panel)", position: { col: 3, row: 0 }, state: "closed", tapInfo: { function: "Emergency stop — main control panel", currentState: "RELEASED — contacts closed", normalState: "Released (NC closed)" } },
        { id: "safety-relay", type: "relay", label: "Safety Relay K1", position: { col: 4, row: 0 }, state: "de-energized", tapInfo: { function: "440R-N23132 safety relay — monitors E-stop chain", currentState: "DE-ENERGIZED — output contacts OPEN", normalState: "Energized when all E-stops released" } },
      ],
      connections: [
        { from: "ps-24v", to: "estop-1", style: "normal" },
        { from: "estop-1", to: "estop-2", style: "normal" },
        { from: "estop-2", to: "estop-3", style: "broken" },
        { from: "estop-3", to: "safety-relay", style: "normal" },
      ],
    },
    {
      id: "rung-2",
      label: "VFD Power & Control",
      components: [
        { id: "disconnect", type: "disconnect", label: "Disconnect QF1", position: { col: 0, row: 1 }, state: "closed", tapInfo: { function: "Main power disconnect for VFD", currentState: "CLOSED — power available", normalState: "Closed during operation" } },
        { id: "vfd-1", type: "vfd", label: "PowerFlex 525", position: { col: 1, row: 1, span: 2 }, state: "de-energized", tapInfo: { function: "7.5HP VFD — controls conveyor motor speed (45Hz)", currentState: "FAULTED — STO active, output disabled", normalState: "Running at 45Hz, 12.5A" } },
        { id: "overload", type: "overload", label: "OL (Electronic)", position: { col: 3, row: 1 }, state: "closed", tapInfo: { function: "Electronic overload in VFD — set to 150% for 60s", currentState: "Not tripped (motor not running)", normalState: "Monitoring motor current" } },
        { id: "motor-1", type: "motor", label: "Motor M1 (7.5HP)", position: { col: 4, row: 1 }, state: "stalled", tapInfo: { function: "3-phase induction motor — drives conveyor belt via gearbox", currentState: "STOPPED — no power", normalState: "Running at 1350 RPM" } },
      ],
      connections: [
        { from: "disconnect", to: "vfd-1", style: "normal" },
        { from: "vfd-1", to: "overload", style: "normal" },
        { from: "overload", to: "motor-1", style: "normal" },
      ],
    },
    {
      id: "rung-3",
      label: "PLC I/O",
      components: [
        { id: "plc-safety-in", type: "plc_input", label: "I:1/4 Safety OK", position: { col: 0, row: 2 }, state: "de-energized", tapInfo: { function: "PLC digital input — safety relay output contact", currentState: "FALSE (0VDC) — safety fault", normalState: "TRUE (24VDC) — safety OK" } },
        { id: "plc-run-out", type: "plc_output", label: "O:2/0 Run CMD", position: { col: 2, row: 2 }, state: "de-energized", tapInfo: { function: "PLC output — VFD run command", currentState: "OFF — run command removed", normalState: "ON — commanding VFD to run" } },
        { id: "plc-fault-in", type: "plc_input", label: "I:1/7 VFD Fault", position: { col: 4, row: 2 }, state: "energized", tapInfo: { function: "PLC input — VFD fault relay output", currentState: "TRUE — VFD is in fault state", normalState: "FALSE — VFD running normally" } },
      ],
      connections: [
        { from: "plc-safety-in", to: "plc-run-out", style: "normal" },
        { from: "plc-run-out", to: "plc-fault-in", style: "normal" },
      ],
    },
  ],
};

// === SYSTEM STATES ===

const systemStates: Record<string, SystemState> = {
  "initial-faulted": {
    id: "initial-faulted",
    label: "E-Stop Chain Open — VFD STO Active",
    description: "Safety circuit interrupted. VFD disabled via STO. Motor cannot run.",
    componentStates: {
      "estop-2": { state: "open" },
      "safety-relay": { state: "de-energized", appearance: { pulse: true, color: "red" } },
      "vfd-1": { state: "faulted", appearance: { glow: true, color: "red" } },
      "motor-1": { state: "stalled" },
      "plc-safety-in": { state: "de-energized" },
      "plc-run-out": { state: "de-energized" },
    },
    activeAnimations: [
      { type: "led_blink", targetId: "vfd-1", duration: 99999, loop: true, color: "red" },
      { type: "indicator_flash", targetId: "safety-relay", duration: 99999, loop: true, color: "red" },
    ],
    availableActions: [
      {
        id: "reset-estop-2",
        label: "Release & Reset E-Stop Station 2",
        description: "Twist mushroom button to release, then press safety relay reset",
        category: "reset",
        targetComponentId: "estop-2",
        resultStateId: "estop-fixed-motor-overload",
        isCorrect: true,
        consequence: "E-stop released. Safety relay reset successful. VFD STO cleared. Attempting restart...",
        scoreImpact: 25,
        animation: { type: "relay_click", targetId: "safety-relay", duration: 500 },
      },
      {
        id: "bypass-safety",
        label: "Jumper across E-Stop 2 terminals",
        description: "Place a jumper wire across the E-stop contacts to bypass it",
        category: "bypass",
        targetComponentId: "estop-2",
        resultStateId: "bypassed-dangerous",
        isCorrect: false,
        consequence: "Safety circuit restored via bypass. VFD runs — but E-stop 2 is now non-functional. OSHA violation. Motor starts but draws excessive current...",
        scoreImpact: -30,
        safetyWarning: "Bypassing a safety device violates OSHA 1910.147 and NFPA 79. If someone needs to E-stop from the south side, they cannot. Are you sure?",
        animation: { type: "spark", targetId: "estop-2", duration: 800, intensity: 0.7 },
        availableFor: ["experienced", "senior"],
      },
      {
        id: "reset-vfd-only",
        label: "Reset VFD fault from keypad",
        description: "Press the red STOP/RESET button on the VFD",
        category: "reset",
        targetComponentId: "vfd-1",
        resultStateId: "initial-faulted",
        isCorrect: false,
        consequence: "VFD displays 'STO Active — Cannot Reset'. The safety input must be restored before the drive will accept a reset command.",
        scoreImpact: -5,
        animation: { type: "led_blink", targetId: "vfd-1", duration: 2000, color: "red" },
      },
    ],
    visibleFaults: faultLog.slice(0, 6),
  },
  "estop-fixed-motor-overload": {
    id: "estop-fixed-motor-overload",
    label: "E-Stop Fixed — Motor Overload Detected",
    description: "Safety restored. VFD attempts restart but motor draws excessive current. Overload trips within 45 seconds.",
    componentStates: {
      "estop-2": { state: "closed", appearance: { color: "green" } },
      "safety-relay": { state: "energized", appearance: { glow: true, color: "green" } },
      "vfd-1": { state: "faulted", appearance: { glow: true, color: "amber" } },
      "motor-1": { state: "overheating", appearance: { shake: true, color: "orange" } },
      "overload": { state: "tripped", appearance: { pulse: true, color: "red" } },
      "plc-safety-in": { state: "energized" },
      "plc-run-out": { state: "energized" },
    },
    activeAnimations: [
      { type: "motor_vibrate", targetId: "motor-1", duration: 99999, loop: true, intensity: 0.8 },
      { type: "wire_heat", targetId: "motor-1", duration: 99999, loop: true, intensity: 0.6 },
      { type: "thermal_gradient", targetId: "motor-1", duration: 99999, loop: true },
    ],
    availableActions: [
      {
        id: "replace-bearing",
        label: "LOTO, replace drive-end bearing (6205-2RS)",
        description: "Lock out, remove motor, press out old bearing, install new one",
        category: "replace",
        targetComponentId: "motor-1",
        resultStateId: "fully-repaired",
        isCorrect: true,
        consequence: "Motor bearing replaced. Current draw returns to normal 12.5A. Conveyor running smoothly at rated speed.",
        scoreImpact: 30,
        animation: { type: "motor_spin", targetId: "motor-1", duration: 3000 },
      },
      {
        id: "increase-overload",
        label: "Increase VFD overload setpoint to 175%",
        description: "Raise the electronic overload threshold so it doesn't trip",
        category: "adjust",
        targetComponentId: "vfd-1",
        resultStateId: "overload-masked",
        isCorrect: false,
        consequence: "Overload threshold raised. Motor runs but bearing continues to deteriorate. Within 2 hours, bearing will seize completely — potential shaft damage and winding burnout ($8,000+ repair).",
        scoreImpact: -25,
        safetyWarning: "Increasing overload protection above manufacturer specs can lead to motor winding failure, fire risk, and catastrophic bearing seizure.",
        animation: { type: "wire_heat", targetId: "motor-1", duration: 5000, intensity: 0.9 },
      },
      {
        id: "reset-overload",
        label: "Reset VFD overload and restart",
        description: "Clear the overload fault and attempt to run again",
        category: "reset",
        targetComponentId: "vfd-1",
        resultStateId: "estop-fixed-motor-overload",
        isCorrect: false,
        consequence: "VFD resets and attempts to run. Motor draws 18.2A immediately. Overload trips again after 42 seconds. Same fault — the root cause hasn't been addressed.",
        scoreImpact: -10,
        animation: { type: "breaker_trip", targetId: "overload", duration: 1000 },
      },
    ],
    visibleFaults: [
      ...faultLog.slice(0, 6).map(f => ({ ...f, description: f.description + " [CLEARED]", severity: "info" as const })),
      { timestamp: "23:01:15.332", source: "VFD-07", code: "A004", description: "Motor current 145% FLA — 18.2A (FLA=12.5A)", severity: "warning" },
      { timestamp: "23:01:57.118", source: "VFD-07", code: "F001", description: "OVERLOAD TRIP — I²t protection activated", severity: "critical" },
      { timestamp: "23:01:57.200", source: "PLC", code: "I:1/7", description: "VFD fault input TRUE — overload condition", severity: "critical" },
    ],
  },
  "bypassed-dangerous": {
    id: "bypassed-dangerous",
    label: "UNSAFE — Safety Bypassed, Motor Overloading",
    description: "E-stop bypassed (OSHA violation). Motor running but drawing excessive current. Bearing will fail catastrophically.",
    componentStates: {
      "estop-2": { state: "faulted", appearance: { color: "orange", pulse: true } },
      "safety-relay": { state: "energized", appearance: { color: "orange" } },
      "vfd-1": { state: "energized", appearance: { color: "amber" } },
      "motor-1": { state: "overheating", appearance: { shake: true, color: "red", glow: true } },
    },
    activeAnimations: [
      { type: "motor_vibrate", targetId: "motor-1", duration: 99999, loop: true, intensity: 1.0 },
      { type: "smoke", targetId: "motor-1", duration: 99999, loop: true },
      { type: "wire_heat", targetId: "motor-1", duration: 99999, loop: true, intensity: 0.9 },
      { type: "spark", targetId: "estop-2", duration: 99999, loop: true, intensity: 0.3 },
    ],
    availableActions: [
      {
        id: "remove-bypass",
        label: "Remove jumper, properly release E-stop 2",
        description: "Remove the bypass wire and fix the E-stop correctly",
        category: "reset",
        targetComponentId: "estop-2",
        resultStateId: "estop-fixed-motor-overload",
        isCorrect: true,
        consequence: "Bypass removed. E-stop properly released and reset. Now investigating the overload condition...",
        scoreImpact: 5,
        animation: { type: "relay_click", targetId: "safety-relay", duration: 500 },
      },
    ],
    visibleFaults: [
      { timestamp: "23:05:00.000", source: "SAFETY", code: "BYPASS", description: "⚠️ E-STOP 2 BYPASSED — SAFETY VIOLATION", severity: "critical" },
      { timestamp: "23:05:01.112", source: "VFD-07", code: "A004", description: "Motor current 148% FLA — CRITICAL OVERLOAD", severity: "critical" },
      { timestamp: "23:05:01.500", source: "VFD-07", code: "A091", description: "Motor temperature 205°F — EXCEEDS LIMIT", severity: "critical" },
    ],
  },
  "overload-masked": {
    id: "overload-masked",
    label: "DANGEROUS — Overload Protection Disabled",
    description: "Motor running with masked overload. Bearing deteriorating rapidly. Catastrophic failure imminent.",
    componentStates: {
      "motor-1": { state: "overheating", appearance: { shake: true, color: "red", glow: true } },
      "vfd-1": { state: "energized", appearance: { color: "amber" } },
    },
    activeAnimations: [
      { type: "smoke", targetId: "motor-1", duration: 99999, loop: true },
      { type: "motor_vibrate", targetId: "motor-1", duration: 99999, loop: true, intensity: 1.0 },
      { type: "thermal_gradient", targetId: "motor-1", duration: 99999, loop: true },
    ],
    availableActions: [
      {
        id: "stop-and-investigate",
        label: "Stop drive, restore overload setting, investigate",
        description: "Return overload to 150%, stop the motor, investigate root cause",
        category: "lockout",
        targetComponentId: "vfd-1",
        resultStateId: "estop-fixed-motor-overload",
        isCorrect: true,
        consequence: "Motor stopped. Overload restored to 150%. Now investigating why current is excessive...",
        scoreImpact: 5,
        animation: { type: "breaker_trip", targetId: "vfd-1", duration: 500 },
      },
    ],
    visibleFaults: [
      { timestamp: "23:10:00.000", source: "VFD-07", code: "A004", description: "Motor current 152% FLA — PROTECTION OVERRIDDEN", severity: "critical" },
      { timestamp: "23:10:05.000", source: "THERMAL", code: "T-HI", description: "Motor frame temperature 215°F — DANGER", severity: "critical" },
    ],
  },
  "fully-repaired": {
    id: "fully-repaired",
    label: "System Fully Repaired — Running Normal",
    description: "Both faults resolved. Conveyor running at rated speed with normal current draw.",
    componentStates: {
      "estop-2": { state: "closed", appearance: { color: "green" } },
      "safety-relay": { state: "energized", appearance: { color: "green" } },
      "vfd-1": { state: "energized", appearance: { color: "green" } },
      "motor-1": { state: "running", appearance: { color: "green" } },
      "overload": { state: "closed", appearance: { color: "green" } },
    },
    activeAnimations: [
      { type: "motor_spin", targetId: "motor-1", duration: 99999, loop: true },
      { type: "current_flow", targetId: "vfd-1", duration: 99999, loop: true, intensity: 0.3 },
    ],
    availableActions: [],
    visibleFaults: [
      { timestamp: "23:45:00.000", source: "SYSTEM", code: "OK", description: "All faults cleared — system running normal", severity: "info" },
    ],
  },
};

// === TIME PRESSURE ===

const timePressure: TimePressureEvent[] = [
  {
    triggerMinutes: 2,
    from: "Mike",
    role: "3rd Shift Lead",
    message: "Hey, any idea what's going on? The packers are starting to back up. Palletizer's been idle for 15 minutes now.",
    urgency: "low",
  },
  {
    triggerMinutes: 5,
    from: "Dave Martinez",
    role: "Production Supervisor",
    message: "I need a status update. We've got a truck at dock 7 waiting on this product. What's your ETA to get this line back?",
    urgency: "medium",
  },
  {
    triggerMinutes: 8,
    from: "Dave Martinez",
    role: "Production Supervisor",
    message: "It's been 20+ minutes. I'm getting pressure from logistics. Do I need to call in the day-shift electrician? Give me something.",
    urgency: "high",
  },
  {
    triggerMinutes: 12,
    from: "Karen Chen",
    role: "Plant Manager",
    message: "Dave tells me Line 7 has been down over 25 minutes. That's $3,000+ in lost production. I need to know if this is a 10-minute fix or if we're looking at a major issue. Call me back.",
    urgency: "critical",
  },
];

// === COMMUNICATIONS ===

const communications: CommunicationChannel[] = [
  {
    id: "radio-operator",
    type: "radio",
    label: "Radio Line 7 Operator",
    icon: "Radio",
    contact: "Sarah (Operator)",
    response: "Yeah, it just stopped. I didn't see anyone hit an E-stop but 2nd shift was still cleaning up when it went down. The south-side walkway was pretty crowded during shift change.",
    isUseful: true,
    clueId: "operator-info",
  },
  {
    id: "call-2nd-shift",
    type: "phone",
    label: "Call 2nd Shift Electrician",
    icon: "Phone",
    contact: "Tony (2nd Shift)",
    response: "That motor's been running hot for a couple weeks. I put in a work order but it hasn't been scheduled yet. WO-2024-3847. Current was reading about 14 amps last time I checked — normally it's around 12.5.",
    isUseful: true,
    clueId: "previous-shift-info",
  },
  {
    id: "maintenance-log",
    type: "maintenance_log",
    label: "Check CMMS Work Orders",
    icon: "BookOpen",
    contact: "Maintenance System",
    response: "WO-2024-3847 (Open, Priority 3): 'PL-07 conveyor motor running warm. Current elevated ~14A. Recommend vibration analysis.' Created: 3 weeks ago. Status: Waiting for scheduling.",
    isUseful: true,
    clueId: "work-order-info",
  },
  {
    id: "scada-history",
    type: "scada_history",
    label: "Check SCADA Trend Data",
    icon: "Monitor",
    contact: "SCADA System",
    response: "Motor current trend (last 30 days): Gradual increase from 12.5A → 14.2A → 16.8A → 18.2A (today). Motor temp trend: 140°F → 155°F → 175°F → 195°F. Vibration: 4.2 → 6.1 → 9.8 → 12.4 mm/s.",
    isUseful: true,
    clueId: "scada-trend",
  },
];

// === SCENARIO PHASES ===

const phases: ScenarioPhase[] = [
  {
    id: "phase-1-estop",
    title: "Phase 1: Safety Circuit Fault",
    narrative: "You arrive at the PL-07 control panel. The VFD display shows 'STO Active' with a red fault LED blinking. The {safety relay} indicator on the panel door is dark — it should be lit green. The {E-Stop} chain has been interrupted somewhere. There are 3 stations in the series circuit. You need to find which one is tripped and restore the safety circuit.",
    activeFaultId: "estop-open",
    initialStateId: "initial-faulted",
    locations: [
      {
        id: "control-panel",
        label: "Control Panel — VFD & Safety Relay",
        description: "Main panel with PowerFlex 525, safety relay K1, PLC rack",
        compatibleTools: ["multimeter", "flashlight", "plc_terminal"],
        terminalMeasurements: [
          {
            fromTerminal: "K1-A1",
            toTerminal: "K1-A2",
            requiredSetting: "vdc",
            reading: "0.0",
            unit: "VDC",
            isKeyClue: false,
            interpretation: "Safety relay coil has no voltage — circuit is open upstream",
            newTechExplanation: "The safety relay needs 24VDC across its coil (A1 to A2) to energize. 0V means something upstream is open.",
          },
          {
            fromTerminal: "K1-13",
            toTerminal: "K1-14",
            requiredSetting: "continuity",
            reading: "OL",
            unit: "",
            isKeyClue: false,
            interpretation: "Safety relay output contacts are open (relay is de-energized)",
            newTechExplanation: "Terminals 13-14 are the relay's output contacts. OL (overload/open) means the relay hasn't pulled in.",
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "Safety relay K1 indicator: DARK. VFD display: 'F070 STO'. Reset button on relay has popped out.",
            unit: "",
            interpretation: "Visual confirmation that safety relay is de-energized",
            isKeyClue: false,
            newTechExplanation: "The relay's green indicator being dark confirms it's not energized. The popped-out reset button means it tripped.",
          },
          plc_terminal: {
            value: "I:1/4 = FALSE (Safety OK). O:2/0 = FALSE (Run CMD). Rung 7 condition: Safety_OK AND Start_PB AND NOT Fault = FALSE.",
            unit: "",
            interpretation: "PLC confirms safety input is false — cannot issue run command",
            isKeyClue: false,
            newTechExplanation: "The PLC logic requires Safety_OK (I:1/4) to be TRUE before it will energize the run output. Right now it's FALSE.",
          },
        },
      },
      {
        id: "estop-station-1",
        label: "E-Stop Station 1 — North Side",
        description: "Red mushroom button on north wall, near motor",
        compatibleTools: ["multimeter", "flashlight"],
        terminalMeasurements: [
          {
            fromTerminal: "ES1-NC1",
            toTerminal: "ES1-NC2",
            requiredSetting: "continuity",
            reading: "0.2",
            unit: "Ω",
            isKeyClue: false,
            interpretation: "E-Stop 1 contacts are closed (good continuity) — this station is NOT the problem",
            newTechExplanation: "0.2Ω is essentially zero resistance — the contacts are closed. This E-stop is fine.",
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "Button is in the OUT (released) position. Yellow ring visible. Contacts appear clean.",
            unit: "",
            interpretation: "Visual confirms E-Stop 1 is released and not the fault source",
            isKeyClue: false,
          },
        },
      },
      {
        id: "estop-station-2",
        label: "E-Stop Station 2 — South Side (Palletizer Walkway)",
        description: "Red mushroom button on south wall, hip-height near narrow walkway",
        compatibleTools: ["multimeter", "flashlight"],
        terminalMeasurements: [
          {
            fromTerminal: "ES2-NC1",
            toTerminal: "ES2-NC2",
            requiredSetting: "continuity",
            reading: "OL",
            unit: "",
            isKeyClue: true,
            interpretation: "OPEN CIRCUIT — E-Stop 2 contacts are open. This is the fault!",
            animation: { type: "spark", targetId: "estop-2", duration: 1500, intensity: 0.5 },
            newTechExplanation: "OL means infinite resistance — no continuity. The contacts are OPEN because the button is pressed. This is your problem!",
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "Button is IN (pressed/engaged)! Yellow ring NOT visible. Appears someone bumped it — it's at hip height in a narrow walkway.",
            unit: "",
            interpretation: "Visual confirmation: E-Stop 2 is pressed — this is the fault source",
            isKeyClue: true,
            visualEffect: "critical",
          },
        },
      },
      {
        id: "estop-station-3",
        label: "E-Stop Station 3 — Main Panel",
        description: "Red mushroom button on control panel door",
        compatibleTools: ["multimeter", "flashlight"],
        terminalMeasurements: [
          {
            fromTerminal: "ES3-NC1",
            toTerminal: "ES3-NC2",
            requiredSetting: "continuity",
            reading: "0.1",
            unit: "Ω",
            isKeyClue: false,
            interpretation: "E-Stop 3 contacts are closed — not the problem",
            newTechExplanation: "Good continuity. This E-stop is released and working fine.",
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "Button is OUT (released). Yellow ring visible. Clean installation on panel door.",
            unit: "",
            interpretation: "E-Stop 3 is released — not the fault",
            isKeyClue: false,
          },
        },
      },
    ],
    communications: communications.slice(0, 2),
    advanceConditions: [
      {
        requiredClues: ["estop-station-2"],
        requiredAction: "reset-estop-2",
        nextPhaseId: "phase-2-overload",
        transitionText: "E-Stop 2 released and safety relay reset. VFD clears STO fault and attempts to start the motor... but something's wrong. The motor starts, vibrates heavily, and the VFD shows current climbing rapidly: 14A... 16A... 18A... OVERLOAD TRIP.",
        transitionAnimation: { type: "motor_vibrate", targetId: "motor-1", duration: 3000, intensity: 0.9 },
      },
    ],
    hints: {
      new: "E-stops are wired in series using NC (normally closed) contacts. Check each station with your multimeter on continuity. A good station reads near 0Ω. The faulted one reads OL (open).",
      experienced: "Three stations in the chain. One is open. The operator mentioned shift change congestion near the south side.",
      senior: "Check the fault log timestamp vs. shift change time. Cross-reference with station locations.",
    },
    seniorCheckpoint: {
      question: "Based on the fault log timing (22:47) and the operator's report about shift change congestion, what's your most likely root cause hypothesis before you start measuring?",
      options: [
        {
          id: "a",
          text: "E-Stop 2 (south side) was bumped during shift change — it's at hip height in a narrow walkway",
          isCorrect: true,
          feedback: "Correct. The timing matches shift change (22:45-23:00), the operator mentioned south-side congestion, and Station 2's location makes it vulnerable to accidental contact.",
          scoreImpact: 15,
        },
        {
          id: "b",
          text: "Wiring fault in the E-stop chain — intermittent connection",
          isCorrect: false,
          feedback: "Unlikely. The fault log shows a clean, instantaneous trip — not the intermittent pattern you'd see with a loose connection. Also, the system was running fine before shift change.",
          scoreImpact: -5,
        },
        {
          id: "c",
          text: "Safety relay K1 has failed internally",
          isCorrect: false,
          feedback: "Possible but unlikely. The relay is designed to fail safe (drop out), but the fault log clearly shows the E-stop chain opening BEFORE the relay dropped. The relay responded correctly to the open circuit.",
          scoreImpact: -5,
        },
        {
          id: "d",
          text: "PLC input card failure — false reading on I:1/4",
          isCorrect: false,
          feedback: "The PLC input is reading correctly — it shows FALSE because the safety relay output contacts ARE open. The VFD independently confirms STO is active. Multiple systems agree on the fault state.",
          scoreImpact: -5,
        },
      ],
    },
  },
  {
    id: "phase-2-overload",
    title: "Phase 2: Motor Overload Investigation",
    narrative: "The {E-Stop} is fixed, but now you have a new problem. The motor started briefly but the {VFD} tripped on {overload} within 45 seconds. Current peaked at 18.2A — that's 145% of the motor's {FLA} (12.5A). Something is causing excessive mechanical load. The motor frame is hot to the touch and you can feel vibration through the floor near the motor. Time to investigate why this motor is drawing so much current.",
    activeFaultId: "motor-overload",
    initialStateId: "estop-fixed-motor-overload",
    locations: [
      {
        id: "motor-terminals",
        label: "Motor Junction Box — T1, T2, T3",
        description: "Motor terminal box with 3-phase connections from VFD output",
        compatibleTools: ["multimeter", "megger", "flashlight"],
        terminalMeasurements: [
          {
            fromTerminal: "T1",
            toTerminal: "T2",
            requiredSetting: "ohms",
            reading: "2.4",
            unit: "Ω",
            isKeyClue: false,
            interpretation: "Winding resistance T1-T2: 2.4Ω — within spec (2.2-2.6Ω). Windings are OK.",
            newTechExplanation: "Motor windings should have equal resistance between phases. 2.4Ω is normal for a 7.5HP motor.",
          },
          {
            fromTerminal: "T2",
            toTerminal: "T3",
            requiredSetting: "ohms",
            reading: "2.5",
            unit: "Ω",
            isKeyClue: false,
            interpretation: "Winding resistance T2-T3: 2.5Ω — within spec. Balanced with T1-T2.",
          },
          {
            fromTerminal: "T1",
            toTerminal: "GND",
            requiredSetting: "ohms",
            reading: ">200",
            unit: "MΩ",
            isKeyClue: false,
            interpretation: "Insulation resistance to ground: >200MΩ — excellent. No winding-to-ground fault.",
            newTechExplanation: "This tests if the motor winding insulation is damaged. >2MΩ is acceptable, >200MΩ is excellent.",
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "Terminal connections tight. No discoloration or burning. Cable insulation intact. Motor nameplate: 7.5HP, 460V, 3PH, 12.5 FLA, 1760 RPM, SF 1.15",
            unit: "",
            interpretation: "Electrical connections are good — problem is mechanical, not electrical",
            isKeyClue: false,
          },
        },
      },
      {
        id: "motor-body",
        label: "Motor Frame & Drive End Bearing",
        description: "Motor housing, cooling fan, drive-end bearing housing",
        compatibleTools: ["flashlight", "vibration_pen", "thermal_camera"],
        simpleReadings: {
          flashlight: {
            value: "Motor frame very hot. Grease stain visible at drive-end bearing seal — dark brown/black discoloration. Fan turning freely. Coupling alignment marks still aligned.",
            unit: "",
            interpretation: "Dark grease at bearing seal indicates bearing degradation — grease has broken down from heat",
            isKeyClue: true,
            visualEffect: "warning",
          },
          vibration_pen: {
            value: "12.4",
            unit: "mm/s RMS",
            interpretation: "ALARM — vibration 12.4 mm/s exceeds alarm threshold of 7.1 mm/s. Indicates severe bearing defect.",
            isKeyClue: true,
            visualEffect: "critical",
            animation: { type: "motor_vibrate", targetId: "motor-1", duration: 2000, intensity: 1.0 },
          },
          thermal_camera: {
            value: "Drive-end bearing: 195°F (91°C). Motor frame: 175°F. Opposite end bearing: 135°F. Ambient: 78°F.",
            unit: "",
            interpretation: "Drive-end bearing 60°F hotter than opposite end — confirms bearing failure",
            isKeyClue: true,
            visualEffect: "critical",
            animation: { type: "thermal_gradient", targetId: "motor-1", duration: 3000 },
          },
        },
      },
      {
        id: "vfd-display",
        label: "VFD Display & Parameters",
        description: "PowerFlex 525 HIM (Human Interface Module) — fault history and current readings",
        compatibleTools: ["plc_terminal", "flashlight"],
        simpleReadings: {
          flashlight: {
            value: "Display: 'F001 OVERLOAD'. Last run current: T1=18.2A, T2=17.8A, T3=18.5A. Output freq: 45Hz. DC bus: 648V. Fault history: F001 x3 in last hour.",
            unit: "",
            interpretation: "Current 145% FLA with slight phase imbalance — mechanical overload from bearing drag",
            isKeyClue: true,
            visualEffect: "critical",
          },
          plc_terminal: {
            value: "VFD parameters: Motor FLA=12.5A, OL setpoint=150%, OL time=60s. Last trip: 18.2A for 42s. Trend shows current rising over past 3 weeks: 12.5→14.2→16.8→18.2A",
            unit: "",
            interpretation: "Progressive current increase over weeks confirms gradual mechanical degradation (bearing wear)",
            isKeyClue: true,
          },
        },
      },
      {
        id: "motor-amps-live",
        label: "VFD Output — Live Current (if running)",
        description: "Clamp meter on VFD output cables during brief restart attempt",
        compatibleTools: ["multimeter"],
        terminalMeasurements: [
          {
            fromTerminal: "U-out",
            toTerminal: "CLAMP",
            requiredSetting: "amps_ac",
            reading: "18.2",
            unit: "A",
            isKeyClue: true,
            interpretation: "Motor drawing 18.2A — 145% of 12.5A FLA. Excessive mechanical load confirmed.",
            animation: { type: "wire_heat", targetId: "motor-1", duration: 2000, intensity: 0.7 },
            newTechExplanation: "The motor nameplate says 12.5A is full load. Drawing 18.2A means something is making the motor work much harder than normal — like a bad bearing creating friction.",
          },
        ],
      },
    ],
    communications: communications.slice(1),
    advanceConditions: [
      {
        requiredClues: ["motor-body", "vfd-display"],
        requiredAction: "replace-bearing",
        nextPhaseId: "complete",
        transitionText: "Bearing replaced. Motor reinstalled and aligned. VFD reset. Motor starts smoothly — current stabilizes at 12.3A. Conveyor running at rated speed. Line 7 is back in production.",
        transitionAnimation: { type: "motor_spin", targetId: "motor-1", duration: 5000 },
      },
    ],
    hints: {
      new: "The motor windings tested good (balanced resistance, high insulation). The problem is mechanical — feel the motor frame, check the bearings. A vibration pen or thermal camera can confirm bearing failure.",
      experienced: "Current is 145% FLA but windings are balanced. Check the SCADA trend — has current been rising gradually? That points to progressive mechanical degradation, not a sudden electrical fault.",
      senior: "Phase currents are slightly imbalanced (18.2/17.8/18.5) with rising trend over weeks. Classic bearing failure signature. Verify with vibration and thermal before committing to the repair.",
    },
    seniorCheckpoint: {
      question: "You've confirmed high current, high vibration, and elevated bearing temperature. Before replacing the bearing, what additional check should you perform to rule out other root causes?",
      options: [
        {
          id: "a",
          text: "Check coupling alignment and belt tension — misalignment can cause similar symptoms",
          isCorrect: true,
          feedback: "Correct. While bearing failure is the most likely cause, coupling misalignment or a seized driven component (gearbox, conveyor roller) can also cause high current and vibration. A quick visual check of the coupling and trying to rotate the shaft by hand rules these out.",
          scoreImpact: 15,
        },
        {
          id: "b",
          text: "Megger test the motor windings at 1000V",
          isCorrect: false,
          feedback: "You already tested insulation resistance and it was >200MΩ. The standard ohms test showed balanced windings. Repeating with a megger won't reveal anything new — the fault is mechanical, not electrical.",
          scoreImpact: -5,
        },
        {
          id: "c",
          text: "Replace the VFD — it might be outputting unbalanced voltage",
          isCorrect: false,
          feedback: "The slight current imbalance (18.2/17.8/18.5) is within normal variation for a loaded motor. If the VFD were faulty, you'd see voltage imbalance on the output phases. The progressive current rise over weeks points to mechanical degradation, not a VFD issue.",
          scoreImpact: -10,
        },
        {
          id: "d",
          text: "Check the incoming power quality — voltage sag could cause high current",
          isCorrect: false,
          feedback: "Voltage sag would cause ALL motors on the bus to draw high current, not just this one. The DC bus voltage (648V) is normal for 480V input. And voltage sag doesn't explain the progressive increase over 3 weeks.",
          scoreImpact: -5,
        },
      ],
    },
  },
];

// === AMBIENT ANIMATIONS ===

const ambientAnimations: AnimationTrigger[] = [
  { type: "led_blink", targetId: "plc-safety-in", duration: 99999, loop: true, color: "red" },
];

// === SCORING ===

const scoring = {
  clueDiscovery: 10,
  efficiencyBonus: 20,
  unnecessaryMeasurementPenalty: 3,
  seniorCheckpointCorrect: 15,
  hintPenalty: 8,
  wrongSettingPenalty: 5,
  unsafeActionPenalty: 30,
  communicationBonus: 10,
  optimalOrderBonus: 20,
  timeBonuses: [
    { underMinutes: 8, bonus: 25 },
    { underMinutes: 12, bonus: 15 },
    { underMinutes: 18, bonus: 5 },
  ],
  maxScore: 200,
  passingScore: 120,
};

// === FULL SCENARIO ===

export const scenarioMultiFaultV3: ScenarioV3 = {
  id: "vfd-conveyor-multifault-v3",
  title: "VFD Conveyor Down — Multi-Fault",
  type: "Multi-Fault Troubleshooting",
  version: 3,
  estimatedMinutes: { new: 25, experienced: 15, senior: 10 },
  description: "Packaging Line 7 case conveyor is down. VFD shows STO fault. But fixing the obvious problem reveals a deeper issue — a failing motor bearing that's been deteriorating for weeks. Two faults, one scenario. Find them both.",
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
      "The VFD shows an STO (Safe Torque Off) fault. This means the safety circuit interrupted the drive. Ask the operator what happened.",
      "Someone bumped the E-stop during shift change. That explains the STO fault — but is that the ONLY problem?",
      "Check the maintenance logs. Has anyone reported unusual noise or vibration from this motor recently? Multi-fault scenarios often have a hidden second issue.",
    ],
    prints: [
      "Trace the safety circuit on the prints — find the E-stop chain that feeds the VFD's STO input.",
      "Also review the motor circuit. Note the motor FLA (Full Load Amps) and the VFD's overcurrent trip settings.",
      "Understanding both the safety circuit AND the motor circuit is critical — this scenario has two separate faults.",
    ],
    measure: [
      "First, verify the E-stop status. Is it physically pressed in? Check the STO input terminals on the VFD.",
      "After clearing the E-stop fault, if the VFD trips again on overcurrent, measure motor current during startup.",
      "Use the megger to check motor winding insulation. A failing bearing causes the rotor to rub the stator, which shows up as low insulation resistance.",
      "Compare motor current to nameplate FLA. Bearing failure causes higher-than-normal current draw even at no load.",
    ],
    analyze: [
      "Fault 1 is straightforward: E-stop was bumped, causing STO fault. Reset it and clear the VFD fault.",
      "Fault 2 is the real problem: motor bearing is failing. Evidence includes high current, possible vibration, and the VFD may trip on overcurrent after you clear the STO.",
      "In real plants, the obvious fault often masks a deeper issue. Always verify the system runs correctly after fixing the first problem.",
    ],
    action: [
      "Step 1: Reset the E-stop (pull and twist the mushroom head) and clear the VFD STO fault.",
      "Step 2: Attempt to restart. If the VFD trips on overcurrent, the motor bearing fault is confirmed.",
      "Step 3: Lock out the motor and schedule bearing replacement. Do not force-run a motor with a failing bearing.",
    ],
    coachingOverrides: {
      gather: "This is a multi-fault scenario. The VFD's STO fault is obvious, but there's a second, hidden fault. Gather ALL available information before jumping to conclusions.",
      measure: "You'll need to diagnose two separate faults. The first (E-stop) is simple to verify. The second (motor bearing) requires current measurements and possibly insulation testing.",
      analyze: "Don't stop after finding the first fault. In multi-fault scenarios, fixing one problem often reveals another. The motor bearing has been deteriorating for weeks.",
    },
  },
};
