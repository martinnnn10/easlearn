import {
  ScenarioV3,
  SystemState,
  ScenarioPhase,
  DEFAULT_TOOLS_V3,
} from "./scenariosV3";

const systemStates: Record<string, SystemState> = {
  "comm-loss": {
    id: "comm-loss",
    label: "Communication Loss — VFD Offline",
    description: "The PowerFlex 525 VFD has intermittently dropped off the EtherNet/IP network. The root cause is a damaged Cat6 cable with a crushed RJ45 connector.",
    componentStates: {
      "stratix-switch": { state: "energized", terminals: [
        { id: "switch-port-5", label: "Port 5 (VFD)", position: "T1", state: "intermittent" },
      ], appearance: { glow: true } },
      "vfd-pf525": { state: "energized", terminals: [
        { id: "vfd-enet", label: "EtherNet/IP Port", position: "T1", state: "intermittent" },
      ], appearance: { glow: true } },
      "cat6-cable": { state: "faulted", terminals: [
        { id: "cable-switch-end", label: "Switch End", position: "T1", state: "live" },
        { id: "cable-vfd-end", label: "VFD End", position: "T2", state: "intermittent" },
      ], appearance: { color: "red", pulse: true } },
    },
    activeAnimations: [
      { type: "led_blink", targetId: "stratix-switch", duration: 500, loop: true, intensity: 0.8, color: "red" },
      { type: "led_blink", targetId: "vfd-pf525", duration: 500, loop: true, intensity: 0.8, color: "red" },
      { type: "cable_sag", targetId: "cat6-cable", duration: 2000, loop: true },
    ],
    availableActions: [
      {
        id: "replace-cable",
        label: "Replace Cat6 Cable",
        description: "Run a new Cat6 industrial Ethernet cable from the switch to the VFD",
        category: "replace",
        targetComponentId: "cat6-cable",
        resultStateId: "comm-restored",
        isCorrect: true,
        consequence: "New cable installed. Network communication restored. VFD is back online.",
        scoreImpact: 25,
        animation: { type: "relay_click", targetId: "cat6-cable", duration: 300 },
      },
      {
        id: "reset-vfd",
        label: "Power Cycle VFD",
        description: "Turn the VFD off and back on",
        category: "reset",
        targetComponentId: "vfd-pf525",
        resultStateId: "comm-loss",
        isCorrect: false,
        consequence: "VFD restarts but communication is still intermittent. The issue is the physical connection.",
        scoreImpact: -10,
      },
      {
        id: "replace-switch",
        label: "Replace Stratix Switch",
        description: "Swap the managed switch with a spare",
        category: "replace",
        targetComponentId: "stratix-switch",
        resultStateId: "comm-loss",
        isCorrect: false,
        consequence: "New switch installed but VFD still drops off. The problem is the cable, not the switch.",
        scoreImpact: -15,
        safetyWarning: "Replacing network infrastructure can disrupt other connected devices.",
      },
      {
        id: "check-vfd-params",
        label: "Check VFD Parameters",
        description: "Review the IP address and network settings on the VFD",
        category: "test",
        targetComponentId: "vfd-pf525",
        resultStateId: "comm-loss",
        isCorrect: false,
        consequence: "Parameters are correct. The issue is physical, not configuration.",
        scoreImpact: -5,
      },
    ],
    visibleFaults: [
      { timestamp: "14:22:10", source: "PLC", code: "COMM LOSS", description: "Connection to PowerFlex 525 timed out", severity: "critical" },
      { timestamp: "14:22:10", source: "SCADA", code: "VFD-OFFLINE", description: "Beverage bottling line VFD offline", severity: "critical" },
    ],
  },
  "comm-restored": {
    id: "comm-restored",
    label: "Communication Restored — System Normal",
    description: "New Cat6 cable installed. Network communication is stable. VFD is online and operating normally.",
    componentStates: {
      "stratix-switch": { state: "energized", terminals: [
        { id: "switch-port-5", label: "Port 5 (VFD)", position: "T1", state: "live" },
      ], appearance: { glow: true } },
      "vfd-pf525": { state: "energized", terminals: [
        { id: "vfd-enet", label: "EtherNet/IP Port", position: "T1", state: "live" },
      ], appearance: { glow: true } },
      "cat6-cable": { state: "closed", terminals: [
        { id: "cable-switch-end", label: "Switch End", position: "T1", state: "live" },
        { id: "cable-vfd-end", label: "VFD End", position: "T2", state: "live" },
      ], appearance: { color: "green", glow: true } },
    },
    activeAnimations: [
      { type: "led_blink", targetId: "stratix-switch", duration: 1000, loop: true, intensity: 0.8, color: "green" },
      { type: "led_blink", targetId: "vfd-pf525", duration: 1000, loop: true, intensity: 0.8, color: "green" },
    ],
    availableActions: [],
    visibleFaults: [],
  },
};

const phases: ScenarioPhase[] = [
  {
    id: "phase-1-diagnose",
    title: "Diagnose Communication Loss",
    narrative: "The beverage bottling line has stopped. The operator reports the main drive VFD keeps dropping offline. The SCADA system shows intermittent communication loss to the PowerFlex 525. Your job: find the root cause of the network issue and restore communication.",
    activeFaultId: "damaged-cable",
    initialStateId: "comm-loss",
    locations: [
      {
        id: "network-cabinet",
        label: "Network Cabinet",
        description: "Contains the Stratix 5700 managed switch and patch panels",
        compatibleTools: ["flashlight", "plc_terminal"],
        terminalMeasurements: [
          {
            fromTerminal: "switch-port-5",
            toTerminal: "switch-port-5",
            requiredSetting: "vdc",
            reading: "0.0",
            unit: "V",
            isKeyClue: false,
            interpretation: "Voltage measurement is not useful for Ethernet data lines.",
          }
        ],
        simpleReadings: {
          flashlight: {
            value: "Port 5 link LED is flickering intermittently. The cable at the switch end looks intact.",
            unit: "",
            interpretation: "Flickering link LED indicates an unstable physical connection or a device rebooting.",
            isKeyClue: true,
            visualEffect: "warning",
          },
          plc_terminal: {
            value: "Switch port statistics show high FCS errors and alignment errors on Port 5.",
            unit: "",
            interpretation: "High error rates on the physical layer strongly suggest a bad cable or connector.",
            isKeyClue: true,
          },
        },
      },
      {
        id: "vfd-panel",
        label: "VFD Panel",
        description: "Enclosure housing the PowerFlex 525 VFD",
        compatibleTools: ["flashlight", "multimeter"],
        terminalMeasurements: [
          {
            fromTerminal: "cable-switch-end",
            toTerminal: "cable-vfd-end",
            requiredSetting: "continuity",
            reading: "INTERMITTENT",
            unit: "",
            isKeyClue: true,
            interpretation: "Continuity test on the cable pairs shows intermittent connection when the cable is moved.",
            newTechExplanation: "The wires inside the cable are broken or the connector is loose. Moving it causes the connection to make and break.",
          },
        ],
        simpleReadings: {
          flashlight: {
            value: "The RJ45 connector at the VFD end is visibly crushed. The cable tray nearby has a dent where a forklift appears to have hit it.",
            unit: "",
            interpretation: "Physical damage to the connector and cable tray explains the intermittent connection.",
            isKeyClue: true,
            visualEffect: "critical",
          },
        },
      },
    ],
    advanceConditions: [
      {
        requiredClues: ["cable-switch-end:cable-vfd-end:continuity"],
        requiredAction: "replace-cable",
        nextPhaseId: "complete",
        transitionText: "Cable replaced. Network communication is stable. The VFD is back online and the bottling line resumes operation. Good job identifying the physical layer fault.",
        transitionAnimation: { type: "led_blink", targetId: "vfd-pf525", duration: 1000, color: "green" },
      },
    ],
    hints: {
      new: "Start by checking the physical connections at both ends. Look for any visible damage to the cables or connectors.",
      experienced: "Check the switch port statistics for physical layer errors. A high number of FCS errors usually points to a bad cable.",
      senior: null,
    },
    seniorCheckpoint: {
      question: "What is the most likely cause of high FCS (Frame Check Sequence) errors on an Ethernet port?",
      options: [
        { id: "opt1", text: "Incorrect IP address configuration", isCorrect: false, feedback: "IP address issues cause routing problems, not physical layer errors.", scoreImpact: -5 },
        { id: "opt2", text: "Physical layer issues such as a damaged cable or EMI", isCorrect: true, feedback: "Correct. FCS errors indicate frames are being corrupted in transit, typically due to bad cables or interference.", scoreImpact: 15 },
        { id: "opt3", text: "A duplicate MAC address on the network", isCorrect: false, feedback: "Duplicate MAC addresses cause switching loops or ARP issues, not FCS errors.", scoreImpact: -5 },
      ],
    },
  },
];

export const scenarioCommLoss: ScenarioV3 = {
  id: "comm-loss-v3",
  title: "Communication Loss — VFD Offline",
  type: "network",
  version: 3,
  estimatedMinutes: { new: 25, experienced: 15, senior: 10 },
  description: "An EtherNet/IP device (PowerFlex 525 VFD) intermittently drops off the network. Diagnose the physical layer fault caused by a damaged cable.",
  faults: [
    {
      id: "damaged-cable",
      order: 1,
      name: "Damaged Cat6 Cable",
      description: "The Cat6 cable connecting the VFD to the switch has a crushed RJ45 connector due to forklift damage.",
      componentId: "cat6-cable",
      revealedBy: ["cable-switch-end:cable-vfd-end:continuity"],
      correctFixId: "replace-cable",
      rootCause: "A forklift ran over the cable tray, crushing the RJ45 connector at the VFD end and causing intermittent contact.",
      technicalDetail: "Ethernet communication relies on twisted pairs for differential signaling. Physical damage to the cable or connector disrupts the signal, causing packet loss and FCS errors. The switch and VFD will drop the connection if too many errors occur.",
      preventionSteps: [
        "Route cables in protected conduits or elevated trays away from forklift traffic",
        "Use industrial-grade M12 connectors instead of RJ45 in harsh environments",
        "Regularly inspect cable runs for physical damage",
      ],
    },
  ],
  plantContext: {
    plantName: "Beverage Bottling Plant",
    lineName: "Main Bottling Line",
    lineNumber: "BL-01",
    shift: "Swing Shift",
    shiftTime: "14:00 - 22:00",
    downstreamImpact: "Bottles backing up at the filler. Entire line halted.",
    waitingOn: "Network Technician (you)",
    productionRate: "500 bottles/minute",
    costPerMinute: "$120/min",
    downSince: "14:22",
  },
  faultLog: [
    { timestamp: "14:22:10", source: "PLC", code: "COMM LOSS", description: "Connection to PowerFlex 525 timed out", severity: "critical" },
    { timestamp: "14:22:10", source: "SCADA", code: "VFD-OFFLINE", description: "Beverage bottling line VFD offline", severity: "critical" },
  ],
  glossary: [
    {
      term: "EtherNet/IP",
      definition: "An industrial Ethernet network that combines standard Ethernet technologies with the Common Industrial Protocol (CIP). Used for real-time control and data exchange.",
    },
    {
      term: "FCS Error",
      abbreviation: "FCS",
      definition: "Frame Check Sequence error. Indicates that an Ethernet frame was corrupted during transmission, usually due to physical layer issues like a bad cable or electromagnetic interference (EMI).",
    },
    {
      term: "RJ45",
      definition: "A standard connector used for Ethernet networking. In industrial environments, it can be fragile and prone to damage if not properly protected.",
    },
    {
      term: "Managed Switch",
      definition: "A network switch that allows for configuration, management, and monitoring of the network. Provides features like port mirroring, VLANs, and detailed port statistics.",
    },
    {
      term: "VFD",
      definition: "Variable Frequency Drive. A device used to control the speed and torque of an AC motor by varying the motor input frequency and voltage.",
    },
  ],
  tools: DEFAULT_TOOLS_V3,
  diagram: {
    title: "Bottling Line Network Topology",
    type: "control_circuit",
    rails: { left: "Network", right: "Devices" },
    rungs: [
      {
        id: "rung-network",
        label: "EtherNet/IP Network",
        components: [
          { id: "stratix-switch", type: "switch", label: "Stratix 5700", position: { col: 1, row: 1 }, state: "energized", tapInfo: { function: "Managed Switch", currentState: "Running", normalState: "Running" } },
          { id: "cat6-cable", type: "terminal", label: "Cat6 Cable", position: { col: 2, row: 1 }, state: "faulted", isFaultSource: true, tapInfo: { function: "Network Connection", currentState: "Intermittent", normalState: "Connected" } },
          { id: "vfd-pf525", type: "vfd", label: "PowerFlex 525", position: { col: 3, row: 1 }, state: "energized", tapInfo: { function: "Main Drive VFD", currentState: "Offline", normalState: "Online" } },
        ],
        connections: [
          { from: "stratix-switch", to: "cat6-cable", style: "normal" },
          { from: "cat6-cable", to: "vfd-pf525", style: "broken" },
        ],
      },
      {
        id: "rung-motor",
        label: "Drive Motor",
        components: [
          { id: "vfd-pf525-out", type: "vfd", label: "VFD Output", position: { col: 1, row: 2 }, state: "energized", tapInfo: { function: "Motor Power", currentState: "Stopped", normalState: "Running" } },
          { id: "drive-motor", type: "motor", label: "Main Drive Motor", position: { col: 2, row: 2 }, state: "de-energized", tapInfo: { function: "Bottling Line Drive", currentState: "Stopped", normalState: "Running" } },
        ],
        connections: [
          { from: "vfd-pf525-out", to: "drive-motor", style: "normal" },
        ],
      },
    ],
  },
  systemStates,
  phases,
  timePressure: [
    { triggerMinutes: 5, from: "Line Operator", role: "Operator", message: "The line is still down. The bottles are backing up.", urgency: "medium" },
    { triggerMinutes: 10, from: "Production Supervisor", role: "Supervisor", message: "We are losing production time. Have you found the issue yet?", urgency: "high" },
    { triggerMinutes: 20, from: "Plant Manager", role: "Manager", message: "This downtime is costing us thousands. I need an ETA on the fix immediately.", urgency: "critical" },
  ],
  communications: [
    { id: "operator-report", type: "in_person", label: "Talk to Operator", icon: "User", contact: "Line Operator", response: "The VFD just dropped offline. I saw a forklift working near the cable tray right before it happened.", isUseful: true, clueId: "forklift-clue" },
    { id: "maintenance-log", type: "maintenance_log", label: "Check Maintenance Log", icon: "Clipboard", contact: "CMMS", response: "No recent work orders for the VFD or switch.", isUseful: false },
    { id: "scada-history", type: "scada_history", label: "Check SCADA Trends", icon: "Monitor", contact: "SCADA", response: "Communication to the VFD has been dropping intermittently for the last hour before failing completely.", isUseful: true, clueId: "intermittent-clue" },
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
    { type: "led_blink", targetId: "stratix-switch", duration: 1000, loop: true, intensity: 0.6, color: "green" },
  ],
  guidedHints: {
    gather: [
      "Talk to the operator to see if anything unusual happened right before the failure.",
      "Check the SCADA history to see if the failure was sudden or intermittent.",
    ],
    prints: [
      "Review the network topology diagram to understand how the VFD is connected to the switch.",
    ],
    measure: [
      "Inspect the physical cable and connectors for any visible damage.",
      "Check the switch port statistics for physical layer errors like FCS errors.",
    ],
    analyze: [
      "Intermittent communication and high FCS errors point to a physical layer issue.",
      "Visible damage to the cable or connector confirms the root cause.",
    ],
    action: [
      "Replace the damaged Cat6 cable with a new one.",
      "Verify that communication is restored and the VFD is back online.",
    ],
    coachingOverrides: {
      gather: "Start by gathering information from the operator and SCADA system to understand the nature of the failure.",
      measure: "Focus on the physical layer. Inspect the cables and check switch port statistics.",
    },
  },
};
