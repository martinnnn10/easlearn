/**
 * SCENARIO: Conveyor E-Stop Chain Open (Redesigned V2)
 * 
 * Full immersive scenario with:
 * - Real plant context (Packaging Line 4, 2nd shift)
 * - PLC fault log that looks like an actual controller log
 * - Tool-driven progressive investigation
 * - Interactive ladder logic diagram
 * - Glossary terms with state diagrams for New Techs
 * - Tiered hints and Senior reasoning checkpoints
 */

import type { ScenarioV2 } from "./scenariosV2";
import { DEFAULT_TOOLS } from "./scenariosV2";

export const conveyorEstopV2: ScenarioV2 = {
  id: "conveyor-estop-v2",
  title: "Conveyor E-Stop Chain Open — Packaging Line 4",
  type: "Safety Circuit",
  estimatedMinutes: { new: 12, experienced: 8, senior: 5 },
  description: "Packaging Line 4 conveyor stopped unexpectedly mid-run. Operator reports system won't restart. HMI shows 'Safety Circuit Open'. No one claims to have pressed an E-stop.",

  plantContext: {
    lineName: "Packaging Line 4",
    lineNumber: "PL-04",
    shift: "2nd Shift",
    shiftTime: "14:00–22:00",
    downstreamImpact: "Palletizer starved — cases backing up on accumulation table. 8 minutes until table full and Line 3 auto-stops.",
    waitingOn: "Shift supervisor Mike Torres, 3 operators, and the forklift driver are all standing by. Production manager called from office asking for ETA.",
    productionRate: "42 cases/minute ($2.10/case)",
    costPerMinute: "$88.20/min lost production",
    downSince: "14:47 (currently 14:59 — 12 minutes down)",
  },

  faultLog: [
    { timestamp: "14:47:03.221", source: "SAFETY", code: "SF-001", description: "Safety relay K1 de-energized — circuit open detected", severity: "critical" },
    { timestamp: "14:47:03.225", source: "PLC", code: "I:1/4", description: "Safety OK input OFF — conveyor interlock tripped", severity: "critical" },
    { timestamp: "14:47:03.228", source: "DRIVE", code: "VFD-04", description: "Run permissive lost — drive disabled", severity: "warning" },
    { timestamp: "14:47:03.450", source: "HMI", code: "ALM-112", description: "Safety Circuit Open — operator notification displayed", severity: "info" },
    { timestamp: "14:47:15.102", source: "PLC", code: "T4:0", description: "Auto-restart timer expired — manual reset required", severity: "info" },
  ],

  glossary: [
    {
      term: "Normally Closed",
      abbreviation: "NC",
      definition: "A contact that is CLOSED (conducting) in its normal/resting state and OPENS when actuated. In an E-stop circuit, NC contacts are wired in series — if any one opens, the entire safety chain breaks.",
      stateDiagram: {
        normalState: "──┤├── CLOSED\nCurrent flows through",
        faultState: "──┤ ├── OPEN\nCircuit broken",
        normalLabel: "Button NOT pressed (normal)",
        faultLabel: "Button PRESSED (tripped)",
      },
    },
    {
      term: "Normally Open",
      abbreviation: "NO",
      definition: "A contact that is OPEN (not conducting) in its normal/resting state and CLOSES when actuated. Safety relay outputs use NO contacts — they only close when the relay is energized (safety circuit healthy).",
      stateDiagram: {
        normalState: "──┤ ├── OPEN\nNo current flows",
        faultState: "──┤├── CLOSED\nCurrent flows through",
        normalLabel: "Relay de-energized (fault)",
        faultLabel: "Relay energized (safe)",
      },
    },
    {
      term: "Safety Relay",
      abbreviation: "K1",
      definition: "A dedicated relay that monitors the E-stop chain. When all NC contacts in the chain are closed, the safety relay energizes and its NO output contacts close, providing a 'Safety OK' signal to the PLC and enabling the main contactor.",
      stateDiagram: {
        normalState: "Coil: ENERGIZED ⚡\nOutputs: CLOSED\nPLC sees: SAFE",
        faultState: "Coil: DE-ENERGIZED\nOutputs: OPEN\nPLC sees: FAULT",
        normalLabel: "All E-stops OK",
        faultLabel: "Chain broken",
      },
    },
    {
      term: "E-Stop Chain",
      definition: "A series-wired circuit of all emergency stop buttons. Because they use NC contacts wired in series, ANY single button being pressed (opened) breaks the entire chain and de-energizes the safety relay. This is a fail-safe design — a broken wire also stops the machine.",
    },
    {
      term: "Contactor",
      definition: "A heavy-duty relay that switches main power to the motor/drive. The contactor is enabled by the safety relay output — if safety is lost, the contactor drops out and removes power from the drive.",
    },
    {
      term: "Watchdog Timeout",
      definition: "A timer that expects periodic 'I'm alive' signals. If the signal stops (because of a fault), the watchdog expires and triggers a protective action. The PLC auto-restart timer (T4:0) is a watchdog — it waited 12 seconds for safety to restore before requiring manual intervention.",
    },
  ],

  tools: DEFAULT_TOOLS,

  diagram: {
    title: "SAFETY CIRCUIT — E-STOP CHAIN (PANEL DWG PL04-E-003)",
    type: "safety_circuit",
    rails: { left: "L1 (120VAC)", right: "N" },
    rungs: [
      {
        id: "rung-1",
        label: "R1",
        components: [
          {
            id: "fuse-1",
            type: "fuse",
            label: "FU-3 (3A)",
            position: { col: 1, row: 0 },
            state: "closed",
            tapInfo: {
              function: "Overcurrent protection for safety circuit",
              currentState: "Intact — continuity confirmed",
              normalState: "Closed (conducting)",
              explanation: "This fuse protects the safety circuit wiring. If too much current flows, it blows open to prevent fire. It's good here.",
            },
          },
          {
            id: "estop-1",
            type: "estop",
            label: "E-STOP 1 (NC)",
            position: { col: 2, row: 0 },
            state: "closed",
            tapInfo: {
              function: "Emergency stop — Station 1 (infeed end)",
              currentState: "CLOSED — not pressed, contacts conducting",
              normalState: "Closed (NC contact)",
              explanation: "This E-stop button uses an NC contact. When nobody presses it, the contact stays closed and current flows through. If someone presses it, the contact opens and breaks the circuit.",
            },
          },
          {
            id: "estop-2",
            type: "estop",
            label: "E-STOP 2 (NC)",
            position: { col: 3, row: 0 },
            state: "closed",
            tapInfo: {
              function: "Emergency stop — Station 2 (mid-line)",
              currentState: "CLOSED — not pressed, contacts conducting",
              normalState: "Closed (NC contact)",
              explanation: "Same as E-stop 1 — NC contact, currently closed and conducting. No problem here.",
            },
          },
        ],
        connections: [
          { from: "fuse-1", to: "estop-1", style: "normal" },
          { from: "estop-1", to: "estop-2", style: "normal" },
        ],
      },
      {
        id: "rung-2",
        label: "R2",
        components: [
          {
            id: "estop-3",
            type: "estop",
            label: "E-STOP 3 (NC)",
            position: { col: 1, row: 1 },
            state: "open",
            isFaultSource: true,
            tapInfo: {
              function: "Emergency stop — Station 3 (discharge end)",
              currentState: "OPEN — button is in TRIPPED position (extended out)",
              normalState: "Closed (NC contact)",
              explanation: "⚠️ THIS IS THE PROBLEM. This E-stop's NC contact is OPEN, meaning the button has been pressed or has come out of its seat. Since it's in series with all the others, this single open contact breaks the entire safety chain.",
            },
          },
          {
            id: "estop-4",
            type: "estop",
            label: "E-STOP 4 (NC)",
            position: { col: 2, row: 1 },
            state: "closed",
            tapInfo: {
              function: "Emergency stop — Station 4 (panel door)",
              currentState: "CLOSED — not pressed",
              normalState: "Closed (NC contact)",
            },
          },
          {
            id: "gate-sw",
            type: "switch",
            label: "GATE SW (NC)",
            position: { col: 3, row: 1 },
            state: "closed",
            tapInfo: {
              function: "Guard gate interlock — opens if access gate is opened",
              currentState: "CLOSED — gate is shut",
              normalState: "Closed (gate shut)",
              explanation: "This switch monitors the safety guard gate. If someone opens the gate to access the machine, this contact opens and stops the conveyor. It's fine right now.",
            },
          },
        ],
        connections: [
          { from: "estop-3", to: "estop-4", style: "broken" },
          { from: "estop-4", to: "gate-sw", style: "normal" },
        ],
      },
      {
        id: "rung-3",
        label: "R3",
        components: [
          {
            id: "relay-k1",
            type: "relay",
            label: "K1 COIL",
            position: { col: 2, row: 2, span: 2 },
            state: "de-energized",
            tapInfo: {
              function: "Safety relay coil — energizes when entire E-stop chain is closed",
              currentState: "DE-ENERGIZED — chain is broken upstream",
              normalState: "Energized (all E-stops OK)",
              explanation: "This relay coil needs current flowing through the entire E-stop chain above to energize. Since E-stop 3 is open, no current reaches this coil, so it stays de-energized and its output contacts stay open.",
            },
          },
        ],
        connections: [],
      },
      {
        id: "rung-4",
        label: "R4",
        components: [
          {
            id: "k1-no-1",
            type: "contact_no",
            label: "K1-1 (NO)",
            position: { col: 1, row: 3 },
            state: "open",
            tapInfo: {
              function: "Safety relay output — provides 'Safety OK' to PLC input I:1/4",
              currentState: "OPEN — relay K1 is de-energized so NO contact stays open",
              normalState: "Closed (when K1 energized)",
              explanation: "This is a Normally Open contact of relay K1. It only closes when K1 is energized. Since K1 is de-energized (because E-stop 3 broke the chain), this contact is open and the PLC sees 'Safety NOT OK'.",
            },
          },
          {
            id: "plc-input",
            type: "plc_input",
            label: "PLC I:1/4",
            position: { col: 3, row: 3 },
            state: "de-energized",
            tapInfo: {
              function: "PLC discrete input — reads safety relay status",
              currentState: "OFF (0) — no voltage present",
              normalState: "ON (1) — 24VDC present when safe",
            },
          },
        ],
        connections: [
          { from: "k1-no-1", to: "plc-input", style: "broken" },
        ],
      },
    ],
  },

  phases: [
    // PHASE 1: Initial arrival — no info given, must investigate
    {
      id: "phase-1",
      title: "Arrival at Packaging Line 4",
      narrative: "You arrive at the conveyor. The HMI displays 'Safety Circuit Open' in red. The conveyor belt is completely still. The safety relay indicator on the panel door is dark (OFF). The main disconnect handle is in the ON position. You can hear the adjacent stamping press running. Three operators are standing around waiting.",
      locations: [
        {
          id: "panel-voltage",
          label: "Control Panel — Incoming Voltage",
          description: "Check if the panel has power",
          compatibleTools: ["multimeter"],
          readings: {
            multimeter: {
              value: "120.3",
              unit: "VAC",
              interpretation: "Control voltage is present and normal",
              isKeyClue: false,
              newTechExplanation: "120V is the expected control voltage. The panel has power — the problem isn't a power loss.",
              visualEffect: "good",
            },
            prints: { value: "", unit: "", interpretation: "", isKeyClue: false },
            flashlight: { value: "", unit: "", interpretation: "", isKeyClue: false },
            plc_terminal: { value: "", unit: "", interpretation: "", isKeyClue: false },
            megger: { value: "", unit: "", interpretation: "", isKeyClue: false },
            thermal_camera: { value: "", unit: "", interpretation: "", isKeyClue: false },
            vibration_pen: { value: "", unit: "", interpretation: "", isKeyClue: false },
          },
        },
        {
          id: "safety-relay-indicator",
          label: "Safety Relay K1 — Status Indicator",
          description: "Visual check of the safety relay LED",
          compatibleTools: ["flashlight"],
          readings: {
            flashlight: {
              value: "LED OFF",
              unit: "",
              interpretation: "Safety relay is de-energized — the E-stop chain is broken somewhere",
              isKeyClue: true,
              newTechExplanation: "The green LED on the safety relay is OFF. This means the relay coil has no power, which means something in the E-stop chain is open (broken).",
              visualEffect: "critical",
            },
            multimeter: { value: "0.0", unit: "VDC", interpretation: "No voltage at relay coil", isKeyClue: true, visualEffect: "critical" },
            prints: { value: "", unit: "", interpretation: "", isKeyClue: false },
            plc_terminal: { value: "", unit: "", interpretation: "", isKeyClue: false },
            megger: { value: "", unit: "", interpretation: "", isKeyClue: false },
            thermal_camera: { value: "", unit: "", interpretation: "", isKeyClue: false },
            vibration_pen: { value: "", unit: "", interpretation: "", isKeyClue: false },
          },
        },
        {
          id: "estop-station-1",
          label: "E-Stop Station 1 — Infeed End",
          description: "Walk to Station 1 and inspect the E-stop button",
          compatibleTools: ["flashlight", "multimeter"],
          readings: {
            flashlight: {
              value: "Button IN (not pressed)",
              unit: "",
              interpretation: "E-stop 1 is in normal position — not the problem",
              isKeyClue: false,
              newTechExplanation: "The mushroom button is pushed in (normal position). If it were pressed/tripped, it would be sticking out.",
              visualEffect: "good",
            },
            multimeter: {
              value: "0.1",
              unit: "Ω",
              interpretation: "Continuity confirmed — contacts closed",
              isKeyClue: false,
              visualEffect: "good",
            },
            prints: { value: "", unit: "", interpretation: "", isKeyClue: false },
            plc_terminal: { value: "", unit: "", interpretation: "", isKeyClue: false },
            megger: { value: "", unit: "", interpretation: "", isKeyClue: false },
            thermal_camera: { value: "", unit: "", interpretation: "", isKeyClue: false },
            vibration_pen: { value: "", unit: "", interpretation: "", isKeyClue: false },
          },
        },
        {
          id: "estop-station-2",
          label: "E-Stop Station 2 — Mid-Line",
          description: "Walk to Station 2 and inspect the E-stop button",
          compatibleTools: ["flashlight", "multimeter"],
          readings: {
            flashlight: {
              value: "Button IN (not pressed)",
              unit: "",
              interpretation: "E-stop 2 is in normal position",
              isKeyClue: false,
              visualEffect: "good",
            },
            multimeter: {
              value: "0.1",
              unit: "Ω",
              interpretation: "Continuity confirmed",
              isKeyClue: false,
              visualEffect: "good",
            },
            prints: { value: "", unit: "", interpretation: "", isKeyClue: false },
            plc_terminal: { value: "", unit: "", interpretation: "", isKeyClue: false },
            megger: { value: "", unit: "", interpretation: "", isKeyClue: false },
            thermal_camera: { value: "", unit: "", interpretation: "", isKeyClue: false },
            vibration_pen: { value: "", unit: "", interpretation: "", isKeyClue: false },
          },
        },
        {
          id: "estop-station-3",
          label: "E-Stop Station 3 — Discharge End",
          description: "Walk to Station 3 and inspect the E-stop button",
          compatibleTools: ["flashlight", "multimeter"],
          readings: {
            flashlight: {
              value: "Button OUT (TRIPPED)",
              unit: "",
              interpretation: "⚠️ E-stop 3 is in the tripped position! The mushroom button is extended out. Operator at this station says they didn't press it.",
              isKeyClue: true,
              newTechExplanation: "The button is sticking OUT — this means it's been pressed or has popped out on its own. This is breaking the safety chain! Notice the mounting bracket is vibrating from the adjacent press.",
              visualEffect: "critical",
            },
            multimeter: {
              value: "OL",
              unit: "Ω",
              interpretation: "⚠️ OPEN CIRCUIT — no continuity across E-stop 3 contacts",
              isKeyClue: true,
              newTechExplanation: "OL means 'Over Limit' or infinite resistance — there's no electrical path through this button. The NC contacts are open because the button is tripped.",
              visualEffect: "critical",
            },
            prints: { value: "", unit: "", interpretation: "", isKeyClue: false },
            plc_terminal: { value: "", unit: "", interpretation: "", isKeyClue: false },
            megger: { value: "", unit: "", interpretation: "", isKeyClue: false },
            thermal_camera: { value: "", unit: "", interpretation: "", isKeyClue: false },
            vibration_pen: { value: "", unit: "", interpretation: "", isKeyClue: false },
          },
        },
        {
          id: "estop-station-4",
          label: "E-Stop Station 4 — Panel Door",
          description: "Check the panel-mounted E-stop",
          compatibleTools: ["flashlight", "multimeter"],
          readings: {
            flashlight: {
              value: "Button IN (not pressed)",
              unit: "",
              interpretation: "E-stop 4 is in normal position",
              isKeyClue: false,
              visualEffect: "good",
            },
            multimeter: {
              value: "0.1",
              unit: "Ω",
              interpretation: "Continuity confirmed",
              isKeyClue: false,
              visualEffect: "good",
            },
            prints: { value: "", unit: "", interpretation: "", isKeyClue: false },
            plc_terminal: { value: "", unit: "", interpretation: "", isKeyClue: false },
            megger: { value: "", unit: "", interpretation: "", isKeyClue: false },
            thermal_camera: { value: "", unit: "", interpretation: "", isKeyClue: false },
            vibration_pen: { value: "", unit: "", interpretation: "", isKeyClue: false },
          },
        },
      ],
      advanceConditions: [
        {
          requiredClues: ["estop-station-3", "safety-relay-indicator"],
          nextPhaseId: "phase-2",
          transitionText: "You've identified that E-stop Station 3 is tripped and the safety relay is de-energized because of it. The operator at Station 3 insists they didn't press it. Time to investigate WHY it tripped.",
        },
      ],
      hints: {
        new: "The safety circuit uses NC (Normally Closed) contacts wired in series. If ANY one opens, the whole chain breaks. Start by checking each E-stop button physically — look for one that's in the 'out' (tripped) position. Use your flashlight to visually inspect each station.",
        experienced: "Walk the E-stop chain. One of the stations is tripped — the operator denies pressing it. Check physical state of each button.",
        senior: null,
      },
      seniorCheckpoint: {
        question: "Based on the fault log timing (safety relay dropped at 14:47:03.221), what does the 3ms response time between safety relay drop and PLC input change tell you about the circuit design?",
        options: [
          {
            id: "sr-1a",
            text: "The safety circuit is hardwired — the PLC is only monitoring, not controlling the safety function",
            isCorrect: true,
            feedback: "Correct. The near-instantaneous response (3ms) confirms this is a hardwired safety circuit with the PLC as a passive monitor. The safety relay directly controls the contactor — no PLC scan time in the safety path. This is proper SIL-rated design.",
            scoreImpact: 15,
          },
          {
            id: "sr-1b",
            text: "The PLC is processing the safety logic and commanding the relay",
            isCorrect: false,
            feedback: "Incorrect. If the PLC were in the safety loop, you'd see scan-time delay (typically 10-50ms). The 3ms response indicates direct hardwired monitoring — the PLC input simply reads the relay state.",
            scoreImpact: -5,
          },
          {
            id: "sr-1c",
            text: "There's a communication delay suggesting a network-based safety system",
            isCorrect: false,
            feedback: "Incorrect. Network-based safety (CIP Safety, PROFIsafe) would show 20-100ms+ latency. The 3ms is characteristic of hardwired discrete I/O.",
            scoreImpact: -5,
          },
        ],
      },
    },

    // PHASE 2: Root cause investigation — why did it trip?
    {
      id: "phase-2",
      title: "Investigating the Root Cause",
      narrative: "E-Stop Station 3 is tripped but the operator swears nobody pressed it. You twist-reset the button and it clicks back in. But before you walk away — you notice the mounting bracket is vibrating noticeably. The adjacent stamping press is running at full speed about 3 feet away. You see one of two mounting bolts is missing from the E-stop bracket.",
      locations: [
        {
          id: "mounting-bracket",
          label: "E-Stop 3 Mounting Bracket",
          description: "Inspect the physical mounting of the E-stop button",
          compatibleTools: ["flashlight"],
          readings: {
            flashlight: {
              value: "1 of 2 bolts MISSING",
              unit: "",
              interpretation: "⚠️ Mounting bracket is loose — only 1 bolt holding it. Significant vibration from adjacent press is causing the button to work itself out of its seat.",
              isKeyClue: true,
              newTechExplanation: "The E-stop button is mounted with a bracket that should have 2 bolts. One is missing, so the bracket is loose and vibrating. The vibration from the press next door is literally shaking the button until it pops out (trips). This is the ROOT CAUSE.",
              visualEffect: "critical",
            },
            multimeter: { value: "", unit: "", interpretation: "", isKeyClue: false },
            prints: { value: "", unit: "", interpretation: "", isKeyClue: false },
            plc_terminal: { value: "", unit: "", interpretation: "", isKeyClue: false },
            megger: { value: "", unit: "", interpretation: "", isKeyClue: false },
            thermal_camera: { value: "", unit: "", interpretation: "", isKeyClue: false },
            vibration_pen: { value: "", unit: "", interpretation: "", isKeyClue: false },
          },
        },
        {
          id: "vibration-check",
          label: "Adjacent Stamping Press Vibration",
          description: "Measure vibration at the E-stop mounting point",
          compatibleTools: ["vibration_pen", "flashlight"],
          readings: {
            vibration_pen: {
              value: "4.2",
              unit: "mm/s RMS",
              interpretation: "Excessive vibration at mounting point — well above the 1.0 mm/s threshold for sensitive equipment",
              isKeyClue: true,
              visualEffect: "warning",
            },
            flashlight: {
              value: "Visible shaking",
              unit: "",
              interpretation: "You can see the bracket visibly vibrating when the press cycles",
              isKeyClue: true,
              visualEffect: "warning",
            },
            multimeter: { value: "", unit: "", interpretation: "", isKeyClue: false },
            prints: { value: "", unit: "", interpretation: "", isKeyClue: false },
            plc_terminal: { value: "", unit: "", interpretation: "", isKeyClue: false },
            megger: { value: "", unit: "", interpretation: "", isKeyClue: false },
            thermal_camera: { value: "", unit: "", interpretation: "", isKeyClue: false },
          },
        },
        {
          id: "estop-3-reset-test",
          label: "E-Stop 3 — After Reset",
          description: "Test the E-stop after twist-resetting it",
          compatibleTools: ["multimeter"],
          readings: {
            multimeter: {
              value: "0.1",
              unit: "Ω",
              interpretation: "Continuity restored after reset — contacts are good, button mechanism is functional",
              isKeyClue: false,
              newTechExplanation: "After resetting the button, the contacts close again and show continuity. The button itself isn't broken — it was just tripped by vibration.",
              visualEffect: "good",
            },
            flashlight: { value: "", unit: "", interpretation: "", isKeyClue: false },
            prints: { value: "", unit: "", interpretation: "", isKeyClue: false },
            plc_terminal: { value: "", unit: "", interpretation: "", isKeyClue: false },
            megger: { value: "", unit: "", interpretation: "", isKeyClue: false },
            thermal_camera: { value: "", unit: "", interpretation: "", isKeyClue: false },
            vibration_pen: { value: "", unit: "", interpretation: "", isKeyClue: false },
          },
        },
        {
          id: "safety-relay-after-reset",
          label: "Safety Relay K1 — After E-Stop Reset",
          description: "Check if safety relay re-energized after resetting E-stop 3",
          compatibleTools: ["flashlight", "multimeter"],
          readings: {
            flashlight: {
              value: "LED ON (green)",
              unit: "",
              interpretation: "Safety relay has re-energized — chain is complete again",
              isKeyClue: false,
              visualEffect: "good",
            },
            multimeter: {
              value: "120.1",
              unit: "VAC",
              interpretation: "Full voltage across relay coil — energized",
              isKeyClue: false,
              visualEffect: "good",
            },
            prints: { value: "", unit: "", interpretation: "", isKeyClue: false },
            plc_terminal: { value: "", unit: "", interpretation: "", isKeyClue: false },
            megger: { value: "", unit: "", interpretation: "", isKeyClue: false },
            thermal_camera: { value: "", unit: "", interpretation: "", isKeyClue: false },
            vibration_pen: { value: "", unit: "", interpretation: "", isKeyClue: false },
          },
        },
      ],
      advanceConditions: [
        {
          requiredClues: ["mounting-bracket", "vibration-check"],
          nextPhaseId: "complete",
          transitionText: "Root cause identified: Loose mounting bracket (missing bolt) combined with vibration from the adjacent stamping press caused E-stop 3 to vibrate out of its seat. Fix: Replace missing bolt, add lock washer, and submit a work order for vibration isolation pad.",
        },
      ],
      hints: {
        new: "You reset the E-stop and it works again — but WHY did it trip if nobody pressed it? Look at the physical mounting. Is it secure? What's nearby that could cause vibration? Use your flashlight to inspect the bracket closely.",
        experienced: "Don't just reset and walk away. Investigate the mechanism — check mounting hardware and environmental factors.",
        senior: null,
      },
      seniorCheckpoint: {
        question: "What is the correct permanent fix for this vibration-induced E-stop trip?",
        options: [
          {
            id: "sr-2a",
            text: "Replace the missing bolt, add lock washers to both bolts, and submit a work order for a vibration isolation mounting pad",
            isCorrect: true,
            feedback: "Correct. The immediate fix is the bolt + lock washers. The permanent fix addresses the root cause (vibration transmission) with an isolation pad. This prevents recurrence without modifying the safety circuit design.",
            scoreImpact: 15,
          },
          {
            id: "sr-2b",
            text: "Replace the E-stop with a guarded/shrouded model that can't vibrate out",
            isCorrect: false,
            feedback: "Partially correct thinking, but a shrouded E-stop doesn't address the loose mounting. The button mechanism isn't the issue — the bracket hardware is. Also, OSHA requires E-stops to be easily accessible without guards that impede activation.",
            scoreImpact: 0,
          },
          {
            id: "sr-2c",
            text: "Add a time delay to the safety relay to filter out momentary trips",
            isCorrect: false,
            feedback: "Incorrect and dangerous. Adding delays to safety circuits defeats their purpose. A legitimate E-stop press must result in immediate shutdown. This would violate NFPA 79 and ISO 13849 requirements.",
            scoreImpact: -10,
          },
          {
            id: "sr-2d",
            text: "Move the E-stop to a different location away from the press",
            isCorrect: false,
            feedback: "Not ideal. E-stop locations are determined by risk assessment and operator access requirements. Moving it may leave a gap in emergency coverage. The correct approach is to isolate the vibration at the mounting point.",
            scoreImpact: -5,
          },
        ],
      },
      diagramUpdates: {
        "estop-3": { state: "closed" as const },
        "relay-k1": { state: "energized" as const },
        "k1-no-1": { state: "closed" as const },
        "plc-input": { state: "energized" as const },
      },
    },
  ],

  scoring: {
    clueDiscovery: 15,
    efficiencyBonus: 20,
    unnecessaryMeasurementPenalty: 3,
    seniorCheckpointCorrect: 15,
    hintPenalty: 10,
    timeBonuses: [
      { underMinutes: 4, bonus: 20 },
      { underMinutes: 6, bonus: 10 },
      { underMinutes: 10, bonus: 5 },
    ],
    maxScore: 150,
    passingScore: 75,
  },

  rootCause: {
    summary: "Vibration-induced E-stop trip caused by loose mounting bracket (missing bolt) and proximity to stamping press.",
    technicalDetail: "E-Stop Station 3's mounting bracket was secured with only 1 of 2 required bolts. The adjacent stamping press (3 feet away) generates 4.2 mm/s RMS vibration at the mounting point. This exceeded the E-stop button's mechanical retention force, causing the mushroom button to gradually work out of its seat and trip the NC contacts. The series-wired safety chain then de-energized relay K1, opening the PLC safety input and disabling the conveyor drive.",
    preventionSteps: [
      "Replace missing mounting bolt immediately — use Grade 8 hardware with lock washer",
      "Add Nordlock washers or thread-locking compound to both mounting bolts",
      "Submit PM work order to install vibration isolation pad between bracket and frame",
      "Add this E-stop station to the weekly PM inspection checklist",
      "Consider relocating the E-stop 12+ inches from the press frame if vibration persists",
    ],
  },
};
