/**
 * V3 Scenario: Failed Safety Relay — Welded Contactor on Hydraulic Press
 * 
 * A safety relay's NC contact has welded closed, preventing the safety circuit
 * from de-energizing the hydraulic press when E-stop is pressed.
 * The press won't stop via E-stop but does stop via normal cycle stop.
 * Teaches: relay contact testing, understanding safety circuits, NC vs NO logic,
 * welded contact diagnosis, and safety relay replacement procedures.
 */
import {
  ScenarioV3,
  SystemState,
  ScenarioPhase,
  DEFAULT_TOOLS_V3,
} from "./scenariosV3";

const systemStates: Record<string, SystemState> = {
  "relay-welded": {
    id: "relay-welded",
    label: "Safety Relay K1 — NC Contact Welded",
    description: "Safety relay K1's NC contact (pins 11-12) has welded closed. The E-stop circuit cannot break the safety chain because K1 remains energized even when its coil is de-energized. The press continues to operate normally via PLC cycle control, masking the safety failure.",
    componentStates: {
      "estop-1": { state: "open", terminals: [
        { id: "estop-11", label: "E-Stop NC In", position: "13", voltage: "24V", state: "live" },
        { id: "estop-12", label: "E-Stop NC Out", position: "14", voltage: "0V", state: "dead" },
      ]},
      "safety-relay-k1": { state: "faulted", terminals: [
        { id: "k1-a1", label: "K1 Coil +", position: "A1", voltage: "0V", state: "dead" },
        { id: "k1-a2", label: "K1 Coil −", position: "A2", voltage: "0V", state: "dead" },
        { id: "k1-13", label: "K1 NC In (13)", position: "13", voltage: "24V", state: "live" },
        { id: "k1-14", label: "K1 NC Out (14)", position: "14", voltage: "24V", state: "live" },
        { id: "k1-23", label: "K1 NO In (23)", position: "23", voltage: "24V", state: "live" },
        { id: "k1-24", label: "K1 NO Out (24)", position: "24", voltage: "0V", state: "dead" },
      ], appearance: { color: "orange", pulse: true, shake: true }},
      "hydraulic-valve": { state: "energized" },
      "press-cylinder": { state: "running" },
      "plc-safety-input": { state: "energized", terminals: [
        { id: "plc-si-1", label: "Safety OK Input", position: "T1", voltage: "24V", state: "live" },
      ]},
    },
    activeAnimations: [
      { type: "indicator_flash", targetId: "safety-relay-k1", duration: 600, loop: true, intensity: 1.0, color: "orange" },
    ],
    availableActions: [
      {
        id: "replace-relay-k1",
        label: "Replace Safety Relay K1",
        description: "Remove welded relay and install new safety relay. Verify operation before returning to service.",
        category: "replace",
        targetComponentId: "safety-relay-k1",
        resultStateId: "relay-replaced",
        isCorrect: true,
        consequence: "New safety relay installed. E-stop test successful — press stops immediately when E-stop is pressed. Safety circuit integrity restored.",
        scoreImpact: 25,
        animation: { type: "relay_click", targetId: "safety-relay-k1", duration: 400 },
        safetyWarning: "LOCKOUT/TAGOUT REQUIRED before replacing safety relay. Verify all energy sources isolated.",
      },
      {
        id: "reset-estop",
        label: "Reset E-Stop Button",
        description: "Pull and twist the E-stop mushroom head to reset",
        category: "reset",
        targetComponentId: "estop-1",
        resultStateId: "relay-welded",
        isCorrect: false,
        consequence: "E-stop resets mechanically but the safety relay contact remains welded. The underlying fault is not in the E-stop button itself.",
        scoreImpact: -5,
      },
      {
        id: "bypass-safety",
        label: "Bypass Safety Circuit",
        description: "Jumper around the safety relay to keep production running",
        category: "bypass",
        targetComponentId: "safety-relay-k1",
        resultStateId: "relay-welded",
        isCorrect: false,
        consequence: "DANGEROUS: Bypassing a safety circuit is a serious OSHA violation and puts operators at risk of injury. This is never acceptable.",
        scoreImpact: -50,
        safetyWarning: "⚠️ CRITICAL SAFETY VIOLATION: Never bypass safety circuits. This can result in serious injury or death.",
      },
      {
        id: "replace-estop",
        label: "Replace E-Stop Button",
        description: "Swap the E-stop button assembly",
        category: "replace",
        targetComponentId: "estop-1",
        resultStateId: "relay-welded",
        isCorrect: false,
        consequence: "New E-stop installed but the problem persists. The E-stop button was functioning correctly — the issue is the downstream safety relay.",
        scoreImpact: -10,
      },
    ],
    visibleFaults: [
      { timestamp: "14:22:08", source: "Operator", code: "SAFETY", description: "E-stop pressed but press did not stop. Used cycle stop instead.", severity: "critical" },
      { timestamp: "14:22:30", source: "Supervisor", code: "LOCKOUT", description: "Press locked out pending electrical investigation", severity: "critical" },
    ],
  },
  "relay-replaced": {
    id: "relay-replaced",
    label: "Safety Relay Replaced — System Safe",
    description: "New safety relay K1 installed. E-stop test verified — press stops within 50ms of E-stop activation. Safety circuit integrity confirmed. Machine returned to service.",
    componentStates: {
      "estop-1": { state: "closed", terminals: [
        { id: "estop-11", label: "E-Stop NC In", position: "13", voltage: "24V", state: "live" },
        { id: "estop-12", label: "E-Stop NC Out", position: "14", voltage: "24V", state: "live" },
      ]},
      "safety-relay-k1": { state: "energized", terminals: [
        { id: "k1-a1", label: "K1 Coil +", position: "A1", voltage: "24V", state: "live" },
        { id: "k1-a2", label: "K1 Coil −", position: "A2", voltage: "0V", state: "live" },
        { id: "k1-13", label: "K1 NC In (13)", position: "13", voltage: "24V", state: "live" },
        { id: "k1-14", label: "K1 NC Out (14)", position: "14", voltage: "0V", state: "dead" },
        { id: "k1-23", label: "K1 NO In (23)", position: "23", voltage: "24V", state: "live" },
        { id: "k1-24", label: "K1 NO Out (24)", position: "24", voltage: "24V", state: "live" },
      ], appearance: { color: "green", glow: true }},
      "hydraulic-valve": { state: "energized" },
      "press-cylinder": { state: "running" },
      "plc-safety-input": { state: "energized" },
    },
    activeAnimations: [
      { type: "led_blink", targetId: "safety-relay-k1", duration: 1000, loop: true, intensity: 0.6, color: "green" },
    ],
    availableActions: [],
    visibleFaults: [],
  },
};

const phases: ScenarioPhase[] = [
  {
    id: "phase-1-safety-diagnosis",
    title: "Diagnose E-Stop Failure",
    narrative: "CRITICAL SAFETY ISSUE: An operator pressed the E-stop on the hydraulic press but it did NOT stop. They used the normal cycle stop button to halt the machine. The press is now locked out. Your job: determine why the E-stop failed to stop the press and restore the safety circuit. This is a Priority 1 safety call — the machine cannot return to service until the safety circuit is verified.",
    activeFaultId: "welded-k1-nc",
    initialStateId: "relay-welded",
    locations: [
      {
        id: "safety-panel",
        label: "Safety Circuit Panel",
        description: "Dedicated safety enclosure with E-stop chain, safety relays, and monitoring contacts",
        compatibleTools: ["multimeter", "prints", "flashlight"],
        terminalMeasurements: [
          {
            fromTerminal: "k1-a1",
            toTerminal: "k1-a2",
            requiredSetting: "vdc",
            reading: "0.0",
            unit: "V DC",
            isKeyClue: true,
            interpretation: "0V across the K1 coil means the coil is DE-ENERGIZED (E-stop has broken the coil circuit). Yet the NC contact is still passing power — this means the contact is WELDED closed.",
            newTechExplanation: "The coil creates the magnetic field that moves the relay armature. If the coil has no voltage, the relay should be in its 'rest' position. For an NC contact, rest = closed. But if the contact welded during a previous high-current event, it stays closed permanently regardless of coil state.",
            animation: { type: "meter_sweep", targetId: "safety-relay-k1", duration: 800 },
          },
          {
            fromTerminal: "k1-13",
            toTerminal: "k1-14",
            requiredSetting: "vdc",
            reading: "0.0",
            unit: "V DC",
            isKeyClue: true,
            interpretation: "0V across the NC contact (pins 13-14) means current IS flowing through it — the contact is closed. But the coil is de-energized, so the NC contact SHOULD be closed. The real test: energize the coil and check if the NC contact opens.",
            wrongSettingResult: "AC voltage reads 0V — this is a DC circuit. Switch to V DC.",
          },
          {
            fromTerminal: "k1-13",
            toTerminal: "k1-14",
            requiredSetting: "ohms",
            reading: "0.1",
            unit: "Ω",
            isKeyClue: true,
            interpretation: "Near-zero resistance across the NC contact WITH the coil de-energized is expected (NC = closed at rest). The critical test is resistance with coil energized — a welded contact will still show 0Ω when it should show OL (open).",
            newTechExplanation: "To properly test: you need to energize the coil (apply 24V to A1-A2) and THEN check if pins 13-14 go open (OL on ohms). If they stay at 0Ω with coil energized, the contact is welded.",
          },
          {
            fromTerminal: "estop-11",
            toTerminal: "estop-12",
            requiredSetting: "continuity",
            reading: "NO TONE",
            unit: "",
            isKeyClue: true,
            interpretation: "No continuity through E-stop confirms the button IS pressed and working correctly. The E-stop NC contact is open as expected. The problem is downstream.",
            newTechExplanation: "The E-stop button works fine — when pressed, it opens its NC contact and breaks the circuit. The issue is that the safety relay downstream doesn't respond to this break.",
          },
          {
            fromTerminal: "plc-si-1",
            toTerminal: "io-com",
            requiredSetting: "vdc",
            reading: "24.0",
            unit: "V DC",
            isKeyClue: true,
            interpretation: "PLC safety input still shows 24V even with E-stop pressed. This confirms the safety relay's output contact (which feeds this input) is stuck closed — the relay is not dropping out when it should.",
            newTechExplanation: "The PLC reads this input to know if the safety circuit is healthy. It should go to 0V when E-stop is pressed. The fact that it stays at 24V means something in the safety relay is keeping the circuit made.",
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "Safety relay K1 (Pilz PNOZ): Yellow 'CH1' and 'CH2' LEDs are ON (indicating contacts are closed). The relay housing shows slight discoloration near the contact block. E-stop mushroom head is in the pressed/locked position.",
            unit: "",
            interpretation: "Contact status LEDs confirm K1 outputs are energized/closed even though the safety input (E-stop) should have de-energized them. Discoloration suggests thermal event from welding.",
            isKeyClue: true,
            visualEffect: "warning",
          },
          prints: {
            value: "Drawing HP-SAF-001: E-Stop chain → K1 coil (A1-A2) → K1 NC contact (13-14) feeds safety monitoring relay K2 → K2 enables hydraulic valve solenoid. K1 NC should OPEN when coil is de-energized (E-stop pressed), breaking the safety chain.",
            unit: "",
            interpretation: "The prints show K1's NC contact is in series with the hydraulic enable path. When E-stop is pressed, K1 coil loses power, NC contact should open, breaking the enable signal. If the NC contact is welded, the enable signal stays active regardless of E-stop state.",
            isKeyClue: true,
          },
        },
      },
      {
        id: "estop-station",
        label: "E-Stop Station",
        description: "Operator E-stop mushroom button on press frame",
        compatibleTools: ["multimeter", "flashlight"],
        simpleReadings: {
          flashlight: {
            value: "E-stop mushroom head is in the pressed/locked position (red button extended, yellow collar visible). Contact block appears clean and undamaged. Wiring connections are tight.",
            unit: "",
            interpretation: "E-stop button is mechanically functioning correctly. It's in the pressed state as expected after the operator activated it.",
            isKeyClue: false,
          },
        },
      },
    ],
    advanceConditions: [
      {
        requiredClues: ["k1-a1:k1-a2:vdc", "plc-si-1:io-com:vdc"],
        requiredAction: "replace-relay-k1",
        nextPhaseId: "complete",
        transitionText: "Safety relay K1 replaced. E-stop test performed — press stops within 50ms. Safety circuit integrity verified. Machine cleared for return to service. Excellent diagnosis of a critical safety failure.",
        transitionAnimation: { type: "relay_click", targetId: "safety-relay-k1", duration: 400 },
      },
      {
        requiredClues: ["estop-11:estop-12:continuity", "k1-a1:k1-a2:vdc"],
        requiredAction: "replace-relay-k1",
        nextPhaseId: "complete",
        transitionText: "Safety relay replaced and verified. You correctly identified that the E-stop was working but the relay contact had welded. Critical safety issue resolved.",
        transitionAnimation: { type: "relay_click", targetId: "safety-relay-k1", duration: 400 },
      },
    ],
    hints: {
      new: "Start by verifying the E-stop button itself works (check continuity across its contacts). Then trace downstream: what does the E-stop connect to? Check the safety relay coil voltage and contact state.",
      experienced: "E-stop works but press doesn't stop = safety relay issue. Check K1 coil voltage (should be 0V with E-stop pressed) vs K1 NC contact state (should be open but might be welded).",
      senior: null,
    },
    seniorCheckpoint: {
      question: "You've confirmed K1's coil is de-energized but its NC contact remains closed. What is the most likely failure mode?",
      options: [
        { id: "welded", text: "Contact welding — the NC contact has fused closed due to arcing during a previous high-current switching event", isCorrect: true, feedback: "Correct. Contact welding is the most common failure mode for safety relay contacts, especially when switching inductive loads like solenoid valves. The arc during opening can melt contact surfaces together.", scoreImpact: 15 },
        { id: "mechanical", text: "Mechanical jam — the relay armature is physically stuck", isCorrect: false, feedback: "Possible but less likely. Mechanical jams usually affect all contacts on the relay, and you'd typically hear/feel the relay not clicking. Welding is more common for single-contact failures.", scoreImpact: -5 },
        { id: "wiring", text: "Wiring error — someone jumpered around the contact", isCorrect: false, feedback: "Always worth checking, but the discoloration on the relay housing and the fact that this is a sealed safety relay make an unauthorized jumper unlikely. The physical evidence points to welding.", scoreImpact: -5 },
        { id: "wrong-relay", text: "Wrong relay type installed — NO contact used instead of NC", isCorrect: false, feedback: "The prints specify NC (pins 13-14) and the relay is the correct Pilz PNOZ model. The contact is correctly identified as NC — it's just welded closed.", scoreImpact: -5 },
      ],
    },
  },
];

export const scenarioFailedRelay: ScenarioV3 = {
  id: "failed-safety-relay",
  title: "Failed Safety Relay — Hydraulic Press",
  type: "safety_circuit",
  version: 3,
  estimatedMinutes: { new: 25, experienced: 12, senior: 7 },
  description: "A safety relay's NC contact has welded closed, preventing the E-stop from stopping a hydraulic press. Diagnose the welded contact using coil voltage vs contact state analysis.",
  faults: [
    {
      id: "welded-k1-nc",
      order: 1,
      name: "Welded NC Contact on Safety Relay K1",
      description: "The NC contact (pins 13-14) on safety relay K1 has welded closed due to repeated high-current switching of the hydraulic solenoid valve. The contact cannot mechanically open even when the coil is de-energized.",
      componentId: "safety-relay-k1",
      revealedBy: ["k1-a1:k1-a2:vdc", "k1-13:k1-14:ohms", "plc-si-1:io-com:vdc"],
      correctFixId: "replace-relay-k1",
      rootCause: "The hydraulic solenoid valve draws 2.8A at 24V DC. Over thousands of switching cycles, the inductive kick during contact opening creates arcs that gradually erode and eventually weld the contact surfaces together. This is accelerated when arc suppression (snubber/diode) is missing or degraded.",
      technicalDetail: "Safety relay contacts are rated for a specific number of operations at a given load. Exceeding the rated load or operating without proper arc suppression dramatically reduces contact life. A welded NC contact is particularly dangerous because it defeats the safety function — the relay appears to operate (coil de-energizes) but the contact remains closed, maintaining the unsafe condition. This is why dual-channel safety relays with cross-monitoring are required in modern safety systems.",
      preventionSteps: [
        "Install arc suppression (RC snubber or flyback diode) across inductive loads",
        "Use safety relays rated for the actual switching current",
        "Implement forced-guided (mechanically linked) contacts for cross-monitoring",
        "Schedule preventive replacement based on switching cycle count",
        "Perform regular E-stop function tests (weekly minimum per OSHA)",
      ],
    },
  ],
  plantContext: {
    plantName: "Precision Metal Stamping",
    lineName: "Hydraulic Press #3 — Forming",
    lineNumber: "HP-3",
    shift: "Afternoon Shift",
    shiftTime: "14:00 - 22:00",
    downstreamImpact: "Press locked out. Parts backing up from upstream blanking press.",
    waitingOn: "Maintenance electrician (you) — PRIORITY 1 SAFETY",
    productionRate: "180 parts/hour",
    costPerMinute: "$120/min (includes downstream starvation)",
    downSince: "14:22",
  },
  faultLog: [
    { timestamp: "14:22:08", source: "Operator", code: "E-STOP FAIL", description: "E-stop pressed — press DID NOT STOP", severity: "critical" },
    { timestamp: "14:22:15", source: "Operator", code: "CYCLE STOP", description: "Normal cycle stop used to halt press", severity: "info" },
    { timestamp: "14:22:30", source: "Supervisor", code: "LOCKOUT", description: "Press locked out — safety investigation required", severity: "critical" },
    { timestamp: "14:22:45", source: "Safety", code: "PRIORITY 1", description: "Safety team notified — maintenance dispatched", severity: "critical" },
  ],
  glossary: [
    {
      term: "Welded Contact",
      definition: "A relay or contactor contact that has fused (melted) together due to arcing during switching. The contact can no longer open mechanically. This is the most dangerous failure mode for safety relays because it defeats the safety function while appearing normal from the coil side.",
      stateDiagram: { normalState: "Opens when coil de-energized", faultState: "Stays closed regardless of coil state", normalLabel: "NC opens on de-energize", faultLabel: "Welded — permanently closed" },
    },
    {
      term: "Safety Relay",
      definition: "A specialized relay designed for safety-critical applications. Features include forced-guided contacts (mechanically linked NO and NC contacts that cannot both be closed simultaneously), redundant channels, and cross-fault monitoring. Used in E-stop circuits, light curtains, and safety gate interlocks.",
    },
    {
      term: "Forced-Guided Contacts",
      definition: "A relay design where NO and NC contacts are mechanically linked so they cannot both be in the same state simultaneously. If an NC contact welds closed, the corresponding NO contact is physically prevented from closing, providing a detectable fault condition for monitoring circuits.",
    },
    {
      term: "Arc Suppression",
      definition: "Components (RC snubbers, flyback diodes, varistors) placed across inductive loads to absorb the voltage spike generated when current is interrupted. Reduces arcing at relay contacts, extending contact life and preventing welding.",
    },
  ],
  tools: DEFAULT_TOOLS_V3,
  diagram: {
    title: "Hydraulic Press #3 — Safety Circuit",
    type: "safety_circuit",
    rails: { left: "24V DC Safety", right: "0V DC" },
    rungs: [
      {
        id: "rung-estop-chain",
        label: "E-Stop Safety Chain",
        components: [
          { id: "estop-1", type: "estop", label: "E-Stop #1", position: { col: 1, row: 1 }, state: "open", tapInfo: { function: "Operator emergency stop", currentState: "PRESSED (open)", normalState: "Released (closed)", explanation: "NC contact opens when mushroom head is pressed" }},
          { id: "safety-relay-k1", type: "relay", label: "Safety Relay K1", position: { col: 2, row: 1 }, state: "faulted", isFaultSource: true, tapInfo: { function: "Safety monitoring relay", currentState: "COIL DE-ENERGIZED but NC CONTACT WELDED CLOSED", normalState: "Coil energized, NC open, NO closed", explanation: "NC contact (13-14) should open when coil loses power. Contact has welded — cannot open." }},
          { id: "plc-safety-input", type: "plc_input", label: "PLC Safety In", position: { col: 3, row: 1 }, state: "energized", tapInfo: { function: "Safety status feedback to PLC", currentState: "24V — sees safety OK (INCORRECT)", normalState: "0V when E-stop active", explanation: "PLC thinks safety circuit is healthy because K1 NC contact is welded closed" }},
        ],
        connections: [
          { from: "estop-1", to: "safety-relay-k1", style: "broken" },
          { from: "safety-relay-k1", to: "plc-safety-input", style: "highlighted" },
        ],
      },
      {
        id: "rung-hydraulic-enable",
        label: "Hydraulic Enable",
        components: [
          { id: "k1-nc-contact", type: "contact_nc", label: "K1 NC (13-14)", position: { col: 1, row: 2 }, state: "faulted", isFaultSource: true, tapInfo: { function: "Safety enable contact", currentState: "WELDED CLOSED — cannot open", normalState: "Opens when K1 coil de-energized" }},
          { id: "hydraulic-valve", type: "contactor", label: "Hydraulic Valve", position: { col: 2, row: 2 }, state: "energized", tapInfo: { function: "Hydraulic directional valve solenoid", currentState: "Energized (press can move)", normalState: "De-energized when safety tripped" }},
          { id: "press-cylinder", type: "motor", label: "Press Cylinder", position: { col: 3, row: 2 }, state: "running", tapInfo: { function: "Hydraulic press ram", currentState: "Locked out (manually stopped)", normalState: "Cycles on PLC command" }},
        ],
        connections: [
          { from: "k1-nc-contact", to: "hydraulic-valve", style: "heated" },
          { from: "hydraulic-valve", to: "press-cylinder", style: "normal" },
        ],
      },
    ],
  },
  systemStates,
  phases,
  timePressure: [
    { triggerMinutes: 2, from: "Safety Coordinator", role: "EHS Manager", message: "This is a Priority 1 safety call. What's your initial assessment? Do we need to evacuate the area?", urgency: "critical" },
    { triggerMinutes: 7, from: "Plant Manager", role: "Plant Manager", message: "I need a status update on the press safety issue. Is this a single-point failure or systemic? Should we check other presses?", urgency: "high" },
    { triggerMinutes: 12, from: "Production Manager", role: "Production Manager", message: "Upstream blanking press is backing up. How long until HP-3 is cleared for operation?", urgency: "medium" },
  ],
  communications: [
    { id: "operator-report", type: "in_person", label: "Talk to Operator", icon: "User", contact: "Press Operator — James", response: "I hit the E-stop because a part was feeding crooked. The press kept going! I've been running this press 8 years and the E-stop has always worked. I used the cycle stop on the pendant to halt it. Scared the hell out of me.", isUseful: true, clueId: "operator-account" },
    { id: "maintenance-log", type: "maintenance_log", label: "Check PM Records", icon: "Clipboard", contact: "CMMS System", response: "Last safety relay replacement: 4 years ago. Last E-stop function test: 3 months ago (PASSED). Estimated switching cycles on K1: ~850,000. Manufacturer recommends replacement at 1,000,000 cycles. Note: arc suppressor on hydraulic valve solenoid was found degraded 6 months ago but not replaced due to parts availability.", isUseful: true, clueId: "pm-records" },
  ],
  scoring: {
    clueDiscovery: 10,
    efficiencyBonus: 15,
    unnecessaryMeasurementPenalty: -3,
    seniorCheckpointCorrect: 15,
    hintPenalty: -5,
    wrongSettingPenalty: -5,
    unsafeActionPenalty: -50,
    communicationBonus: 5,
    optimalOrderBonus: 10,
    timeBonuses: [
      { underMinutes: 7, bonus: 20 },
      { underMinutes: 12, bonus: 10 },
      { underMinutes: 18, bonus: 5 },
    ],
    maxScore: 100,
    passingScore: 65,
  },
  ambientAnimations: [
    { type: "indicator_flash", targetId: "safety-relay-k1", duration: 800, loop: true, intensity: 0.7, color: "orange" },
  ],

  guidedHints: {
    gather: [
      "CRITICAL: The E-stop was pressed but the machine did NOT stop. This is a Priority 1 safety failure.",
      "Ask the operator exactly what happened — did the E-stop button physically move? Did the machine slow down at all?",
      "The machine was stopped using the normal cycle stop. That tells you the PLC control path works — only the safety circuit failed.",
    ],
    prints: [
      "Find the safety circuit on the prints. Trace the E-stop chain from the button through the safety relay to the machine.",
      "Look for relay K1 in the safety circuit. It should have NC (normally-closed) contacts that open to break the safety chain.",
      "The E-stop button opens the K1 coil circuit. K1's NC contacts should then open, cutting power. If K1's contacts are welded, they stay closed.",
    ],
    measure: [
      "With the E-stop pressed, measure voltage across K1's coil terminals. The coil should be de-energized (0V).",
      "Now check K1's NC contacts (pins 11-12). With the coil de-energized, NC contacts should be OPEN (high resistance).",
      "If K1's NC contacts show continuity/low resistance while the coil is de-energized, the contacts are welded closed — that's your fault.",
    ],
    analyze: [
      "A welded NC contact means the relay can never break the safety chain, regardless of the E-stop state.",
      "This is a dangerous condition — the safety system appears functional but cannot actually stop the machine in an emergency.",
    ],
    action: [
      "Replace the entire safety relay K1 — never attempt to 'fix' welded contacts.",
      "After replacement, test the E-stop multiple times and verify the safety chain breaks correctly before returning to service.",
    ],
    coachingOverrides: {
      gather: "This is a safety-critical scenario. An E-stop that doesn't stop the machine is the most dangerous fault you can encounter. Start by understanding exactly what the operator experienced.",
      measure: "Focus on the safety relay K1. You need to prove whether its NC contacts are functioning correctly. The key test: with the coil de-energized, are the NC contacts actually open?",
      action: "Safety relay replacement requires verification testing before the machine returns to service. This is not optional — it's required by OSHA and NFPA 79.",
    },
  },
};
