/**
 * Credibility audit batch 2 — fluid power, networking, process control,
 * remaining motors/safety/print reading.
 */
import type { CuratedLessonAssessment } from "./curatedLessonAssessmentTypes";
import { expertMcq } from "./curatedMcqHelpers";

export const CURATED_LESSON_ASSESSMENTS_BATCH2: Record<string, CuratedLessonAssessment> = {
  "fluid-power/hydraulic-fundamentals": {
    moduleSlug: "fluid-power",
    lessonSlug: "hydraulic-fundamentals",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Hydraulic systems transmit force using:",
        [
          "Pressurized incompressible fluid (typically oil) in a closed circuit",
          "Compressed air at 120 PSI only",
          "480 VAC through solenoid coils without fluid",
          "Open atmospheric water columns only",
        ],
        0,
        "Hydraulics use pumped oil at high pressure — Pascal's law multiplies force through area.",
        [
          "That describes pneumatics, not hydraulics — air is compressible and lower force density.",
          "Electrical power energizes valves/pumps but force transmission is hydraulic fluid pressure.",
          "Open columns are not industrial hydraulic power circuits.",
        ]
      ),
      expertMcq(
        "A hydraulic pressure gauge reads 2,000 PSI on a cylinder line. The pump is off and the valve blocks the line. This indicates:",
        [
          "Trapped volume holding static pressure — verify before loosening fittings",
          "Zero risk — oil is always safe to open immediately",
          "The gauge must be reading 24 VDC",
          "Air pressure identical to shop air",
        ],
        0,
        "Hydraulic systems can store significant energy in pressurized volumes — bleed per procedure before service.",
        [
          "Pressurized hydraulic oil can cause injection injury and sudden motion — never assume safe.",
          "PSI is pressure, not voltage — do not confuse domains.",
          "Shop air is pneumatic; this is hydraulic oil pressure.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Relief valve purpose in a hydraulic circuit:",
        [
          "Limit maximum system pressure by dumping flow to tank at setpoint",
          "Increase pressure above pump rating for faster cycles",
          "Replace the directional control valve",
          "Filter particles from the reservoir only",
        ],
        0,
        "Relief protects pump, hoses, and actuators from overpressure.",
        [
          "Forcing higher pressure without relief risks hose rupture and catastrophic failure.",
          "Directional valves route flow; relief limits pressure.",
          "Filtration is a separate component (filter/strainer).",
        ]
      ),
      expertMcq(
        "Cavitation in a hydraulic pump often sounds like:",
        [
          "Marbles or gravel — low inlet pressure or restricted suction line",
          "Silent operation with rising oil temperature only",
          "480 Hz electrical hum from motor windings only",
          "Normal at all speeds",
        ],
        0,
        "Cavitation is inlet starvation — check suction strainer, oil level, and line restrictions.",
        [
          "Cavitation is audible and damages the pump — not silent normal operation.",
          "Electrical hum is a different diagnostic domain than hydraulic suction.",
          "Gravel noise indicates damage risk — not acceptable baseline.",
        ]
      ),
      expertMcq(
        "Hydraulic cylinder drifts down with valve centered (A-B blocked) suggests:",
        [
          "Internal leakage past spool or piston seals — not holding trapped oil",
          "Correct holding — always normal drift",
          "Electrical 24 VDC ground fault only",
          "Need higher pneumatic pressure",
        ],
        0,
        "Drift under blocked valve indicates seal or valve leakage — mechanical/hydraulic fault.",
        [
          "Loaded cylinders should hold position if valve blocks and seals are tight.",
          "Ground faults do not explain mechanical drift.",
          "Pneumatic pressure does not apply to hydraulic oil circuits.",
        ]
      ),
      expertMcq(
        "Return filter high differential indicator tripped — first step:",
        [
          "Check filter element condition and oil cleanliness — replace if clogged",
          "Bypass filter permanently to restore flow",
          "Increase relief valve setting",
          "Switch hydraulic oil to compressed air",
        ],
        0,
        "Clogged return filters restrict flow and heat the system — service filter per PM.",
        [
          "Bypassing filters sends contamination downstream and destroys pumps/valves.",
          "Relief setting does not fix filter clog.",
          "Hydraulic and pneumatic media are not interchangeable.",
        ]
      ),
    ],
  },

  "fluid-power/pneumatic-fundamentals": {
    moduleSlug: "fluid-power",
    lessonSlug: "pneumatic-fundamentals",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Plant shop air is typically regulated to:",
        [
          "80–120 PSI at the FRL — higher at compressor, lower at point of use",
          "480 VAC three-phase",
          "24 VDC only with no pressure",
          "2,000 PSI like hydraulics",
        ],
        0,
        "Compressors produce higher pressure; FRL units regulate and condition air for valves/cylinders.",
        [
          "480 VAC is electrical distribution — not pneumatic supply pressure.",
          "Pneumatic circuits use compressed air pressure, not 24 VDC as the motive force.",
          "2,000 PSI is hydraulic class — pneumatics are much lower pressure.",
        ]
      ),
      expertMcq(
        "FRL stands for:",
        [
          "Filter, Regulator, Lubricator — conditions air before valves and actuators",
          "Fuse, Relay, Ladder — PLC panel only",
          "Flow, Resistance, Load — Ohm's law only",
          "Field, Remote, Local — Ethernet only",
        ],
        0,
        "FRL removes moisture/particulates, sets pressure, and optionally adds tool oil mist.",
        [
          "Those are electrical/control terms, not pneumatic air prep.",
          "Ohm's law is electrical — related to conductors, not air prep.",
          "Ethernet topology is unrelated to air conditioning at the FRL.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "A double-acting pneumatic cylinder needs:",
        [
          "Five-port/four-way directional valve to extend and retract with exhaust",
          "Only a single check valve — no directional control",
          "A hydraulic relief valve on the air line",
          "480 VAC across the cylinder ports",
        ],
        0,
        "Double-acting cylinders require pressurized air on both sides alternately — 5/2 or 4/2 valves.",
        [
          "Check valves alone cannot reverse cylinder motion.",
          "Relief valves on air are not the primary directional control element.",
          "Cylinder ports receive air pressure, not line voltage.",
        ]
      ),
      expertMcq(
        "Slow or weak cylinder stroke with correct valve shifting often indicates:",
        [
          "Insufficient pressure/flow — undersized regulator, leak, or undersized supply line",
          "Cylinder always runs at hydraulic 2,000 PSI",
          "PLC scan too fast",
          "Motor overload on VFD only",
        ],
        0,
        "Pneumatic actuators need adequate CFM and pressure — measure at the valve inlet during stroke.",
        [
          "Pneumatics do not operate at hydraulic pressures.",
          "PLC scan rate does not directly limit air flow.",
          "VFD overload is electrical rotation — different from air cylinder force.",
        ]
      ),
      expertMcq(
        "Water in pneumatic lines causes:",
        [
          "Valve spool sticking, rust in air tools, and inconsistent actuator speed",
          "Higher electrical power factor",
          "Automatic increase in cylinder force",
          "No effect in humid plants",
        ],
        0,
        "Moisture is the primary pneumatic contaminant — dryers and drain traps are required.",
        [
          "Power factor is electrical — not caused by water in air lines.",
          "Water reduces reliable force and damages components — does not increase force.",
          "Humid plants suffer more water issues, not fewer.",
        ]
      ),
      expertMcq(
        "Single-acting cylinder with spring return exhausts one port to:",
        [
          "Atmosphere through a muffler — spring returns the rod",
          "Hydraulic reservoir at 2,000 PSI",
          "480 VAC bus",
          "Closed volume with no exhaust path",
        ],
        0,
        "Single-acting cylinders pressurize one side; spring or gravity returns with exhaust to air.",
        [
          "Hydraulic reservoirs are not pneumatic exhaust paths.",
          "Electrical buses do not vent cylinder air.",
          "Air must exhaust — blocking exhaust prevents return motion.",
        ]
      ),
    ],
  },

  "fluid-power/valve-troubleshooting": {
    moduleSlug: "fluid-power",
    lessonSlug: "valve-troubleshooting",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "A solenoid valve clicks but cylinder does not move. First checks:",
        [
          "Air/hydraulic pressure at valve inlet, manual override, and downstream line blockage",
          "Increase PLC scan rate",
          "Replace motor bearings",
          "Megger the PLC rack",
        ],
        0,
        "Coil click proves electrical solenoid — fluid must reach the actuator with valve ported correctly.",
        [
          "Scan rate does not create fluid flow.",
          "Motor bearings are unrelated to valve/actuator fluid routing.",
          "Meggering PLC does not diagnose valve supply pressure.",
        ]
      ),
      expertMcq(
        "Stuck open directional valve spool can cause:",
        [
          "Uncontrolled actuator motion or failure to hold position — safety hazard",
          "Guaranteed safer operation than designed",
          "Higher PLC input resolution",
          "Automatic LOTO",
        ],
        0,
        "Failed valves can move loads unexpectedly — isolate energy before hands-on service.",
        [
          "Stuck valves are hazards, not safety improvements.",
          "PLC resolution is unrelated to valve spool position.",
          "LOTO is a human procedure — valves do not auto-lockout.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Center position “A-B blocked, T open” on a hydraulic directional valve means:",
        [
          "Work ports hold pressure (locked) and tank port vents — typical for holding a load",
          "All ports open to tank at once always",
          "480 VAC energizes the spool",
          "Cylinder must drift — blocked ports cannot hold",
        ],
        0,
        "Blocked A-B traps oil to prevent drift; configuration varies by spool type (check print).",
        [
          "All-ports-open center unloads differently — know your spool symbol.",
          "Spools are shifted by solenoid/pilot pressure, not line voltage on ports.",
          "Proper blocked center should minimize drift if seals are sound.",
        ]
      ),
      expertMcq(
        "Solenoid coil burns out repeatedly — likely causes:",
        [
          "Continuous energization beyond duty rating, wrong voltage, or contaminated sticky spool",
          "Correct sizing — coils never fail",
          "Too much pneumatic lubricator oil on Ethernet cables",
          "Lower relief valve setting only",
        ],
        0,
        "Coils have duty cycle limits; mechanical bind increases holding current and heat.",
        [
          "Coils fail from electrical/mechanical stress — not never.",
          "Lubricator oil on Ethernet is unrelated to solenoid burnout.",
          "Relief setting does not directly burn solenoid coils.",
        ]
      ),
      expertMcq(
        "Manual override on a valve is used to:",
        [
          "Shift the spool without PLC command during supervised troubleshooting",
          "Bypass all safety permanently in production",
          "Measure motor winding resistance",
          "Set PID integral time",
        ],
        0,
        "Overrides prove hydraulic/pneumatic path vs electrical command — use with safeguards.",
        [
          "Overrides are diagnostic — not a production bypass for safety devices.",
          "Winding resistance is motor electrical testing.",
          "PID tuning is process control — not valve override function.",
        ]
      ),
      expertMcq(
        "Leaking external valve body suggests:",
        [
          "Seal failure or overpressure — replace seals or check relief setting",
          "Normal operation on all valves",
          "Need to force PLC outputs ON",
          "Switch from oil to air without hardware change",
        ],
        0,
        "External leaks are mechanical seal/wear issues — environmental and slip hazard.",
        [
          "External leaks are faults requiring repair.",
          "Forcing PLC outputs does not fix mechanical leaks.",
          "Oil and air systems require different valves and ratings.",
        ]
      ),
    ],
  },

  "industrial-networking/ethernet-ip-fundamentals": {
    moduleSlug: "industrial-networking",
    lessonSlug: "ethernet-ip-fundamentals",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "EtherNet/IP implicit messaging is used primarily for:",
        [
          "Real-time cyclic I/O data between PLC and devices over UDP",
          "Email delivery on the plant floor",
          "Motor winding insulation testing",
          "Hydraulic relief valve setting",
        ],
        0,
        "Implicit connections exchange I/O at fixed intervals — loss causes drive/I/O faults.",
        [
          "Email uses different protocols — not implicit CIP I/O.",
          "Megger/winding tests are electrical maintenance — not CIP messaging.",
          "Relief valves are hydraulic — unrelated to Ethernet messaging type.",
        ]
      ),
      expertMcq(
        "Two devices on the same subnet with duplicate IP addresses will:",
        [
          "Cause intermittent comm faults — only one device wins ARP at a time",
          "Automatically share the address safely",
          "Increase motor torque",
          "Raise hydraulic pressure",
        ],
        0,
        "Duplicate IPs are a top commissioning error — scan and assign unique addresses.",
        [
          "IP addresses must be unique — sharing is not safe or intentional.",
          "Motor torque is mechanical/electrical — not set by IP conflict.",
          "Hydraulic pressure is unrelated to Ethernet addressing.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Explicit messaging (TCP) on EtherNet/IP is best for:",
        [
          "Parameter reads/writes, diagnostics, and configuration",
          "Continuous 10 ms I/O replacement for every safety input",
          "Replacing E-stop hardware",
          "Megger testing motor leads through the drive",
        ],
        0,
        "Explicit is request/response — good for setup and diagnostics, not cyclic I/O replacement.",
        [
          "Cyclic real-time I/O uses implicit UDP connections.",
          "Safety hardware cannot be replaced by messaging alone.",
          "Megger tests require isolation from drives — not TCP messaging.",
        ]
      ),
      expertMcq(
        "Link light on, ping fails — check first:",
        [
          "IP address, subnet mask, and VLAN/port assignment on the switch",
          "Motor overload heater class",
          "Hydraulic oil viscosity",
          "PLC timer PRE values",
        ],
        0,
        "Layer 1 good with Layer 3 failure points to IP config or VLAN segmentation.",
        [
          "Overload heaters protect motors — not network reachability.",
          "Oil viscosity does not block ICMP if link is up.",
          "Timer presets do not cause ping failure.",
        ]
      ),
      expertMcq(
        "CIP stands for:",
        [
          "Common Industrial Protocol — object model over TCP/UDP",
          "Compressed Industrial Pressure",
          "Control Input Power (480 VAC)",
          "Cylinder In Position only",
        ],
        0,
        "CIP defines device objects and messaging for industrial Ethernet protocols.",
        [
          "Pressure abbreviations are fluid power — not networking.",
          "480 VAC is power distribution — not CIP.",
          "Cylinder position is I/O — not the protocol name.",
        ]
      ),
      expertMcq(
        "VFD comm loss while ping succeeds may indicate:",
        [
          "Implicit I/O connection dropped — check RPI, switch errors, EMI near motor cables",
          "Successful high-speed I/O always",
          "Correct motor alignment only",
          "Hydraulic filter clogged only",
        ],
        0,
        "Ping proves IP reachability — CIP implicit connections can still fault independently.",
        [
          "Ping success does not guarantee implicit connection health.",
          "Shaft alignment is mechanical — separate from comm loss diagnosis.",
          "Hydraulic filters do not drop EtherNet/IP implicit messaging.",
        ]
      ),
    ],
  },

  "industrial-networking/managed-switches-vlans": {
    moduleSlug: "industrial-networking",
    lessonSlug: "managed-switches-vlans",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "VLANs on an industrial managed switch are used to:",
        [
          "Segment broadcast domains — isolate SCADA, PLC, and camera traffic",
          "Increase motor FLA automatically",
          "Replace safety relays",
          "Set hydraulic relief pressure",
        ],
        0,
        "Segmentation limits broadcast storms and unauthorized cross-talk between cell and office networks.",
        [
          "Motor current is nameplate electrical — not set by VLAN.",
          "Safety relays are hardware — VLANs are logical network separation.",
          "Relief pressure is hydraulic — unrelated to switching.",
        ]
      ),
      expertMcq(
        "A port assigned to the wrong VLAN presents as:",
        [
          "Link up but device unreachable from expected subnet — no ARP reply across VLANs without routing",
          "Motor phase loss",
          "Cylinder seal leak",
          "PLC timer done bit stuck",
        ],
        0,
        "VLAN mismatch is a common commissioning error — verify port PVID and allowed VLANs.",
        [
          "Phase loss is supply/motor electrical.",
          "Seal leaks are hydraulic/pneumatic mechanical.",
          "Timer done bits are logic — not VLAN configuration.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Managed switch SNMP/CLI error counters climbing on a PLC port suggest:",
        [
          "Bad cable, duplex mismatch, or EMI — replace cable and verify auto-negotiation",
          "Correct tuning of PID derivative",
          "Proper motor megger results",
          "Normal on all fiber ports always",
        ],
        0,
        "CRC/runt/giant counters indicate physical layer or speed/duplex issues.",
        [
          "PID derivative is process control tuning.",
          "Megger results are insulation tests — not switch port counters.",
          "Rising errors are faults — not normal on healthy links.",
        ]
      ),
      expertMcq(
        "Device Level Ring (DLR) on AB switches provides:",
        [
          "Sub-second recovery around a ring break for EtherNet/IP devices",
          "Automatic hydraulic pressure balance",
          "Motor overload reset without inspection",
          "Replacement for machine guarding",
        ],
        0,
        "DLR is industrial ring redundancy — know supervisor and fault indicators.",
        [
          "Hydraulic balance is fluid power — not Ethernet topology.",
          "Overload reset requires safety/process review — not switch feature.",
          "Guarding is physical safety — networks do not replace guards.",
        ]
      ),
      expertMcq(
        "Spanning tree blocking a port during loop detection:",
        [
          "Prevents broadcast storms — find unintended loops between switches",
          "Proves motor bearings are worn",
          "Means photoeye is blocked",
          "Requires forcing all PLC outputs",
        ],
        0,
        "STP blocks redundant paths — document topology to avoid accidental loops.",
        [
          "Bearings are mechanical rotating equipment.",
          "Photoeyes are field inputs — unrelated to STP.",
          "Forcing outputs does not fix network loops.",
        ]
      ),
      expertMcq(
        "Best practice for PLC and VFD on same physical switch:",
        [
          "Separate VLANs or ports with documented routing — limit broadcast traffic to drives",
          "Share one flat VLAN with all office Wi-Fi always",
          "Connect motor leads through switch ports",
          "Disable all copper ports",
        ],
        0,
        "Segmentation contains multicast/broadcast load and limits attack surface.",
        [
          "Flat office+control VLANs risk broadcast load and security issues.",
          "Motor power wiring never passes through Ethernet switch ports.",
          "Disabling all ports stops communication entirely.",
        ]
      ),
    ],
  },

  "industrial-networking/plc-network-communications": {
    moduleSlug: "industrial-networking",
    lessonSlug: "plc-network-communications",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "I/O module fault after controller download with new Ethernet module:",
        [
          "Verify module definition, IP address, and firmware in the I/O tree matches hardware",
          "Delete all safety programs",
          "Increase motor acceleration without limits",
          "Bypass guard switches to test comm",
        ],
        0,
        "Module identity and network config must match project — mismatch faults the module.",
        [
          "Safety program deletion is unsafe and unrelated to module config.",
          "Accel limits are drive parameters — not I/O module recovery.",
          "Bypassing guards is unsafe and illegal for production testing.",
        ]
      ),
      expertMcq(
        "Producer/consumer tags vs rack I/O for VFD speed:",
        [
          "Producer/consumer exchanges data over network; rack I/O is local chassis modules — know your architecture",
          "They are identical wiring",
          "Producer tags use 480 VAC",
          "Rack I/O never fails",
        ],
        0,
        "Architecture choice affects diagnostics — network path vs local module path.",
        [
          "Wiring and transport differ between network tags and local I/O.",
          "Tags are data objects — not line voltage.",
          "All I/O can fault — nothing never fails.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "RPI (Requested Packet Interval) too aggressive for network load causes:",
        [
          "Implicit connection timeouts and I/O faults — increase RPI or fix network",
          "Higher motor insulation class",
          "Automatic hydraulic cooling",
          "Slower PLC scan always improves comm",
        ],
        0,
        "RPI must match network capacity — timeouts present as device faults.",
        [
          "Insulation class is motor design — not RPI.",
          "Hydraulic cooling is unrelated to Ethernet packet timing.",
          "Scan and RPI are related but raising scan alone does not fix overloaded network.",
        ]
      ),
      expertMcq(
        "Controller shows Ethernet module ‘Connection Timed Out’ — check:",
        [
          "Cable path, switch port stats, device power, and correct slot/IP in project",
          "Motor vibration only",
          "Oil filter differential only",
          "Timer ACC on unrelated rung only",
        ],
        0,
        "Timeout is path or config — physical layer first, then configuration.",
        [
          "Vibration may cause loose connectors indirectly but start with comm path verification.",
          "Oil filter is hydraulic PM — not primary for Ethernet timeout.",
          "Unrelated timer ACC does not explain module timeout.",
        ]
      ),
      expertMcq(
        "Adding a remote I/O rack on new subnet requires:",
        [
          "Gateway/route or correct IP planning so controller can reach the subnet",
          "Only changing motor overload setting",
          "Removing all VLANs",
          "480 VAC on the I/O bus",
        ],
        0,
        "Cross-subnet I/O needs routing or move device to controller subnet.",
        [
          "Overload protects motor current — not IP routing.",
          "Removing VLANs may break segmentation without fixing reachability.",
          "I/O modules use control voltage/data — not 480 VAC on signal bus.",
        ]
      ),
      expertMcq(
        "Firmware mismatch between PLC and EtherNet/IP module often:",
        [
          "Faults module until versions meet compatibility matrix in release notes",
          "Improves speed without any check",
          "Replaces LOTO procedure",
          "Sets pneumatic FRL pressure",
        ],
        0,
        "Check Rockwell compatibility charts before field firmware changes.",
        [
          "Mismatch can fault or disable features — not auto-improve.",
          "LOTO is procedural safety — firmware does not replace it.",
          "FRL is pneumatic prep — unrelated to PLC firmware.",
        ]
      ),
    ],
  },

  "process-control/pid-control-fundamentals": {
    moduleSlug: "process-control",
    lessonSlug: "pid-control-fundamentals",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Integral action in a PID loop eliminates:",
        [
          "Steady-state offset that proportional-only control cannot remove",
          "All sensor noise instantly",
          "Need for a final control element",
          "Electrical phase imbalance",
        ],
        0,
        "Integral accumulates error over time to close residual gap to setpoint.",
        [
          "Integral can amplify noise — filtering may be required.",
          "Valves/VFDs still required to affect the process.",
          "Phase imbalance is electrical supply — not PID integral purpose.",
        ]
      ),
      expertMcq(
        "Oscillating process variable around setpoint often means:",
        [
          "Proportional gain too high — reduce P or add derivative filtering",
          "Integral should always be maximized",
          "Derivative should be infinite",
          "Sensor must be removed",
        ],
        0,
        "Aggressive P causes hunting — tune down or add damping.",
        [
          "Max integral worsens overshoot/hunting in many loops.",
          "Infinite derivative amplifies noise unrealistically.",
          "Remove sensor blinds the loop — unsafe.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Integral windup occurs when:",
        [
          "Output saturates but integral keeps accumulating error — causes overshoot when constraint clears",
          "P gain is zero",
          "Setpoint equals process variable always",
          "Motor is single-phase only",
        ],
        0,
        "Use anti-windup or limit integral when valve/drive saturates.",
        [
          "Zero P is not windup — it's a different tuning state.",
          "Zero error stops integral action — not windup condition.",
          "Phase count is motor electrical — unrelated to PID windup.",
        ]
      ),
      expertMcq(
        "Derivative action is most useful when:",
        [
          "Process responds quickly and overshoot must be limited — with filtered PV",
          "Sensor is completely failed",
          "Loop is open-loop always",
          "Hydraulic cylinder leaks",
        ],
        0,
        "D brakes approach to setpoint — noisy signals need filtering.",
        [
          "Failed sensor requires repair — D does not fix bad PV.",
          "Open-loop disables feedback control purpose.",
          "Cylinder leak is mechanical — fix hardware, not D term only.",
        ]
      ),
      expertMcq(
        "Level loop with slow tank response — typical starting tuning:",
        [
          "Lower P, moderate I, little or no D — avoid aggressive corrections",
          "Maximum P and D always",
          "Disable final control element",
          "Bypass relief valve on hydraulics",
        ],
        0,
        "Slow integrating processes need gentle integral — fast tuning causes cycling.",
        [
          "Max P/D often hunts on slow tanks.",
          "FCE must remain in service for control.",
          "Relief bypass is hydraulic safety issue — unrelated.",
        ]
      ),
      expertMcq(
        "A technician sees setpoint 150 °F, PV 148 °F steady for hours with valve ~70% open. Likely:",
        [
          "Normal proportional+integral balance — small offset may remain if integral is limited",
          "Sensor must read 150 exactly with zero valve movement always",
          "PLC scan error only",
          "EtherNet/IP cable color wrong",
        ],
        0,
        "Steady-state requires output — offset depends on tuning and saturation limits.",
        [
          "Real loops hold output to maintain balance — not always zero error instantly.",
          "Scan rate rarely causes steady 2 °F offset alone.",
          "Cable color does not set process offset.",
        ]
      ),
    ],
  },

  "process-control/process-instrumentation-loops": {
    moduleSlug: "process-control",
    lessonSlug: "process-instrumentation-loops",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "4–20 mA loop where transmitter reads 4 mA at 0 PSI and 20 mA at 100 PSI — 12 mA equals:",
        [
          "50 PSI — linear span between 4 and 20 mA",
          "12 PSI — use mA value directly",
          "100 PSI — any mid-scale mA is max",
          "0 PSI — 12 is less than 20 so zero",
        ],
        0,
        "Span = 16 mA; (12−4)/16 × 100 = 50 PSI.",
        [
          "mA must be scaled to engineering units — not read as PSI directly.",
          "20 mA is 100 PSI — 12 mA is midscale.",
          "12 mA is live signal — not zero PSI.",
        ]
      ),
      expertMcq(
        "Transmitter loop powered from PLC analog input with 24 V supply — open loop wire reads:",
        [
          "0 or fault low mA — below 4 mA indicates broken loop or failed transmitter",
          "Always 20 mA",
          "480 VAC on mA wires",
          "Hydraulic pressure directly",
        ],
        0,
        "Broken loop drops below 4 mA — many systems alarm on <3.6 mA.",
        [
          "Open circuit cannot source 20 mA.",
          "mA loops are low voltage DC — not 480 VAC.",
          "Hydraulic pressure does not appear on mA wires.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Control valve fails open on air loss with spring-return actuator configured fail-closed:",
        [
          "Configuration or actuator fault — verify fail position, supply air, and positioner",
          "Correct safe state always",
          "PLC timer PRE too low",
          "Motor single-phasing",
        ],
        0,
        "Fail position is engineered — air loss should move valve to safe state per spec.",
        [
          "Fails open on fail-closed design is a dangerous fault.",
          "Timer PRE does not set valve fail position.",
          "Single-phasing is motor supply — not valve fail action.",
        ]
      ),
      expertMcq(
        "HART digital communication on 4–20 mA loop allows:",
        [
          "Diagnostics and config over same wires without stopping the analog signal",
          "Replacement for all wiring diagrams",
          "480 VAC motor starting",
          "Elimination of calibration",
        ],
        0,
        "HART superimposes digital on analog — techs use communicator for device info.",
        [
          "Prints still required for installation and safety review.",
          "HART is low level DC — not motor line voltage.",
          "Calibration still required for accurate PV.",
        ]
      ),
      expertMcq(
        "Differential pressure transmitter on a filter — rising DP indicates:",
        [
          "Clogging filter element — schedule replacement before flow collapses",
          "Motor overload trip",
          "E-stop pressed",
          "Successful PID tuning only",
        ],
        0,
        "DP across restriction rises as element loads — common PM metric.",
        [
          "Overload is motor thermal protection.",
          "E-stop is safety input — unrelated to filter DP.",
          "PID tuning does not replace mechanical filter maintenance.",
        ]
      ),
      expertMcq(
        "Loop checkout before production includes:",
        [
          "Simulate 4, 12, 20 mA (or equivalent) and verify PV, alarms, and valve/FCE direction",
          "Skip calibration to save time",
          "Force outputs without reviewing fail positions",
          "Remove relief valves on hydraulics",
        ],
        0,
        "Three-point check proves scaling and action — document as-built.",
        [
          "Skipping calibration risks wrong PV and unsafe control.",
          "Forcing without fail-safe review is unsafe.",
          "Relief valves protect hydraulics — not removed for checkout.",
        ]
      ),
    ],
  },

  "motors-controls/motor-theory": {
    moduleSlug: "motors-controls",
    lessonSlug: "motor-theory",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Synchronous speed of a 4-pole motor at 60 Hz is approximately:",
        [
          "1,800 RPM (120×60/4) — actual rotor speed is slightly lower (slip)",
          "3,600 RPM always under load",
          "60 RPM — equals line frequency only",
          "Same as conveyor FPM without gearing",
        ],
        0,
        "Ns = 120×f/poles; slip develops torque so rotor runs below synchronous speed.",
        [
          "3,600 RPM is 2-pole synchronous — not 4-pole.",
          "60 RPM confuses frequency with shaft speed without pole formula.",
          "FPM is linear speed — requires diameter and gearing from RPM.",
        ]
      ),
      expertMcq(
        "Motor slip increases when:",
        [
          "Load increases — rotor must fall further behind synchronous speed to develop torque",
          "Voltage is perfectly balanced only",
          "Bearing grease is new",
          "PLC scan decreases",
        ],
        0,
        "Slip is normal under load — excessive slip at rated load suggests rotor bar or supply issues.",
        [
          "Balanced voltage reduces problems — does not define slip mechanism.",
          "Grease condition affects bearings — not fundamental slip definition.",
          "PLC scan does not set motor slip.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Three-phase motor rotates because:",
        [
          "Rotating magnetic field from stator windings induces torque on rotor",
          "Single DC wire on the shaft",
          "Hydraulic oil through the windings",
          "EtherNet/IP implicit messaging",
        ],
        0,
        "Phase sequence creates rotating field — reversed phases reverse direction.",
        [
          "AC induction/deployment needs polyphase field — not single DC wire.",
          "Oil in windings would destroy insulation.",
          "Network messaging does not rotate motors.",
        ]
      ),
      expertMcq(
        "Nameplate FLA is used to:",
        [
          "Size overload protection and conductors per code and manufacturer",
          "Set pneumatic regulator pressure",
          "Configure VLAN ID",
          "Set PID derivative only",
        ],
        0,
        "FLA is full-load amps at rated conditions — overload and wire sizing reference.",
        [
          "Regulator is pneumatic — not motor electrical.",
          "VLAN is network segmentation.",
          "PID D term is process tuning — not motor nameplate purpose.",
        ]
      ),
      expertMcq(
        "DC motor speed control with armature voltage varies:",
        [
          "Speed roughly proportional to applied armature voltage below base speed",
          "Torque by changing Ethernet IP only",
          "Phase sequence on three-phase stator",
          "Hydraulic relief setting",
        ],
        0,
        "Armature voltage controls speed; field weakening used above base speed on some designs.",
        [
          "IP addresses do not set motor speed.",
          "Phase sequence applies to AC polyphase motors.",
          "Relief is hydraulic — unrelated to DC armature control.",
        ]
      ),
      expertMcq(
        "High slip at no load suggests:",
        [
          "Possible rotor bar defects or incorrect voltage — investigate before load testing",
          "Perfect healthy motor always",
          "Correct single-phasing",
          "Normal for all VFD applications only",
        ],
        0,
        "No-load slip should be small — high slip indicates electrical or rotor faults.",
        [
          "Healthy motors show low no-load slip.",
          "Single-phasing causes severe imbalance and heating — not normal slip.",
          "Slip concept applies to induction motors — context matters with VFD control.",
        ]
      ),
    ],
  },

  "motors-controls/single-three-phase": {
    moduleSlug: "motors-controls",
    lessonSlug: "single-three-phase",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Missing phase on a running three-phase motor typically causes:",
        [
          "Humming, high current on remaining legs, rapid heating — stop and investigate",
          "Higher efficiency",
          "Lower PLC scan time",
          "Automatic hydraulic cooling",
        ],
        0,
        "Single-phasing is destructive — check fuses, connections, and contactor poles.",
        [
          "Single-phasing increases losses and heat — not efficiency.",
          "PLC scan is unrelated to motor phases.",
          "Hydraulic cooling does not fix electrical phase loss.",
        ]
      ),
      expertMcq(
        "Phase rotation (ABC vs ACB) matters when:",
        [
          "Multiple motors must run same direction or pumps have defined rotation — swap any two lines to reverse",
          "Only for 24 VDC inputs",
          "Never — rotation is random",
          "Only for pneumatic cylinders",
        ],
        0,
        "Swapping two phases reverses rotation — verify with rotation meter on commissioning.",
        [
          "24 VDC inputs are DC — not three-phase rotation.",
          "Rotation is deterministic from phase sequence.",
          "Cylinder direction is air/hydraulic — different domain.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Measuring 480 VAC line-to-line on all three pairs should show:",
        [
          "Similar voltages within a few percent — large imbalance damages motors and drives",
          "One pair at 24 VDC always",
          "Zero on all pairs when motor runs",
          "Hydraulic PSI on voltmeter",
        ],
        0,
        "Voltage imbalance causes current imbalance — correct supply before blaming motor.",
        [
          "Line-to-line on 480 V system is hundreds of volts AC — not 24 VDC.",
          "Running motor still has supply voltage present.",
          "Voltmeters read volts — not PSI.",
        ]
      ),
      expertMcq(
        "Single-phase fractional HP motor on shop circuit uses:",
        [
          "Start winding + capacitor (or PSC) with centrifugal switch or electronics",
          "Three-phase delta only",
          "EtherNet/IP ring",
          "Hydraulic proportional valve",
        ],
        0,
        "Split-phase/PSC designs need start assistance — different from three-phase induction.",
        [
          "Fractional single-phase is not three-phase delta.",
          "Ethernet ring is networking.",
          "Hydraulic valve is fluid power actuator.",
        ]
      ),
      expertMcq(
        "VFD input phase loss fault with balanced voltage at disconnect suggests:",
        [
          "Check fuses, input terminals, and drive input stage — measure under load",
          "Ignore and reset repeatedly",
          "Increase pneumatic pressure",
          "Remove motor overload",
        ],
        0,
        "Intermittent or load-dependent open phase — measure each leg loaded.",
        [
          "Reset without fix damages drive and motor.",
          "Pneumatic pressure does not clear phase loss.",
          "Overload protects motor — do not remove as fix.",
        ]
      ),
      expertMcq(
        "Reverse rotation on new motor installation fix:",
        [
          "Swap any two of three supply leads at motor or starter — verify rotation before coupling load",
          "Swap all three randomly until works without documentation",
          "Force PLC outputs only",
          "Increase timer PRE",
        ],
        0,
        "Standard field fix — document change on print.",
        [
          "Random swaps without method wastes time and risks error.",
          "PLC cannot reverse three-phase without wiring or VFD parameter.",
          "Timer PRE does not change motor rotation.",
        ]
      ),
    ],
  },

  "motors-controls/motor-testing": {
    moduleSlug: "motors-controls",
    lessonSlug: "motor-testing",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Before meggering a motor, you must:",
        [
          "Disconnect leads from drive/starter and short terminals for safety per procedure",
          "Megger through the VFD terminals for convenience",
          "Energize 480 VAC on windings",
          "Bypass overload to ground the shaft",
        ],
        0,
        "Insulation test applies high DC — isolate electronics and document readings.",
        [
          "Megger through VFD destroys semiconductors — never do this.",
          "Energizing windings during megger test is wrong procedure.",
          "Overload bypass does not replace proper isolation for testing.",
        ]
      ),
      expertMcq(
        "Winding resistance imbalance across three phases suggests:",
        [
          "Turn-to-turn or connection fault — investigate before energizing",
          "Perfect balance always",
          "Need higher pneumatic FRL",
          "PLC communication VLAN issue",
        ],
        0,
        "Resistance should be within a few percent — imbalance indicates damage or loose connection.",
        [
          "Significant imbalance is a fault — not normal.",
          "FRL is air prep — unrelated to winding resistance.",
          "VLAN issues do not change copper resistance.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Megger reading 0.5 MΩ on a 480 V motor (expect >100 MΩ) indicates:",
        [
          "Degraded insulation — locate moisture, contamination, or winding damage",
          "Excellent insulation",
          "Correct ground fault on PLC input only",
          "Normal for new motors",
        ],
        0,
        "Low insulation resistance predicts ground fault trip — clean/dry or rewind decision.",
        [
          "0.5 MΩ is dangerously low for 480 V class equipment.",
          "PLC input ground is separate from motor insulation test.",
          "New motors typically measure much higher IR.",
        ]
      ),
      expertMcq(
        "High vibration on motor after alignment correction still high — check:",
        [
          "Bearing condition, coupling wear, soft foot, and mechanical resonance",
          "Only PLC program version",
          "EtherNet/IP cable color",
          "Hydraulic oil brand only",
        ],
        0,
        "Electrical tests passed — mechanical root cause remains.",
        [
          "Firmware alone does not fix mechanical vibration.",
          "Cable color is not a vibration variable.",
          "Oil brand alone does not explain motor vibration if drive is direct coupled.",
        ]
      ),
      expertMcq(
        "Polarization index (PI) test uses:",
        [
          "10 min / 1 min insulation resistance ratio — trending moisture in windings",
          "Motor RPM / line frequency only",
          "PID integral time",
          "Photoeye blocked state",
        ],
        0,
        "PI >2 often indicates dry insulation — trending is predictive maintenance.",
        [
          "RPM/frequency is speed — not insulation PI.",
          "PID integral is loop tuning.",
          "Photoeye is discrete input — unrelated to megger PI.",
        ]
      ),
      expertMcq(
        "Documenting test results matters because:",
        [
          "Trending catches degradation before in-service fault — maintenance manager accountability",
          "Managers never read records",
          "Only first test ever needed",
          "Replaces LOTO",
        ],
        0,
        "Baseline and trend support reliability programs and post-incident review.",
        [
          "Records are standard PM evidence — managers use them for risk decisions.",
          "Repeat tests show change over time — one point is limited.",
          "LOTO remains mandatory for service — documentation does not replace it.",
        ]
      ),
    ],
  },

  "safety-systems/risk-assessment": {
    moduleSlug: "safety-systems",
    lessonSlug: "risk-assessment",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Risk assessment before safeguarding focuses on:",
        [
          "Severity of injury × likelihood × exposure — not only machine speed",
          "Wire color in the panel only",
          "PLC brand preference",
          "Motor RPM only without hazard analysis",
        ],
        0,
        "ISO 12100 / risk matrices drive required performance level (PL) or SIL.",
        [
          "Wire color is not risk analysis.",
          "Brand does not determine required safety integrity.",
          "RPM alone misses pinch/shear/electrical hazards.",
        ]
      ),
      expertMcq(
        "Performance Level (PL) per ISO 13849 is selected based on:",
        [
          "Risk scoring — higher risk requires higher PL and more reliable architecture",
          "Panel enclosure color",
          "Number of HMI screens",
          "Pneumatic regulator setting",
        ],
        0,
        "PL ties architecture, diagnostics, and MTTFd to required risk reduction.",
        [
          "Enclosure color is cosmetic.",
          "HMI count does not set PL.",
          "Air pressure does not define functional safety level.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Category 3 architecture (dual channel) means:",
        [
          "Single fault does not lead to loss of safety function — monitored redundancy",
          "One wire only with no monitoring",
          "No E-stop required",
          "480 VAC on safety inputs",
        ],
        0,
        "Dual channel with monitoring is common for presses and robot cells.",
        [
          "Category B/1 single channel lacks dual-channel fault tolerance.",
          "E-stop may still be required by risk assessment.",
          "Safety inputs use safety-rated low voltage — not line voltage on devices.",
        ]
      ),
      expertMcq(
        "Documenting residual risk after guards installed:",
        [
          "Required for management approval — training and procedures address remaining hazards",
          "Optional — guards eliminate all risk always",
          "Only for office networks",
          "Replaces operator training",
        ],
        0,
        "Residual risk drives warnings, training, and PPE — management signs off.",
        [
          "Guards reduce risk — rarely eliminate every hazard.",
          "Office networks unrelated to machine risk register.",
          "Training complements hardware — does not get replaced by paperwork.",
        ]
      ),
      expertMcq(
        "Bypassing a light curtain during setup requires:",
        [
          "Controlled mode (setup/maintenance) with reduced speed and documented procedure",
          "Permanent jumper in production",
          "Higher motor FLA setting",
          "Removing E-stop",
        ],
        0,
        "Setup mode is engineered — not ad-hoc bypass during normal production.",
        [
          "Production bypass is unsafe and non-compliant.",
          "FLA is motor thermal — unrelated to safeguarding bypass.",
          "E-stop remains required.",
        ]
      ),
      expertMcq(
        "Training director buys-in when risk assessment shows:",
        [
          "Traceable hazard analysis linked to training and verified safeguards",
          "Marketing slogans only",
          "Undocumented bypasses",
          "No operator involvement",
        ],
        0,
        "Credibility requires method, records, and alignment with training content.",
        [
          "Slogans do not prove risk reduction.",
          "Undocumented bypasses fail audits.",
          "Operators provide exposure context — must be involved.",
        ]
      ),
    ],
  },

  "safety-systems/guarding-lockout": {
    moduleSlug: "safety-systems",
    lessonSlug: "guarding-lockout",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "LOTO differs from E-stop because:",
        [
          "LOTO isolates all energy sources for service — E-stop only stops motion during operation",
          "They are identical",
          "LOTO is only for office areas",
          "E-stop replaces tagout always",
        ],
        0,
        "Service work needs verified zero energy — E-stop does not guarantee isolation.",
        [
          "Functions differ — both are required where applicable.",
          "LOTO applies to machine service in production areas.",
          "Tags/locks document isolation — E-stop does not.",
        ]
      ),
      expertMcq(
        "Guard door interlock with guard closed should:",
        [
          "Allow motion only when closed and latched — opening drops permissive",
          "Be bypassed with tape in production",
          "Use 480 VAC on the safety switch contacts directly to PLC without safety relay",
          "Replace risk assessment",
        ],
        0,
        "Interlocks prevent access during hazard — align with Packaging Line 4 guard I:1/3 logic.",
        [
          "Tape bypass is unsafe and audit failure.",
          "Safety devices use safety-rated circuits — not line voltage on standard PLC inputs without analysis.",
          "Risk assessment still required — guards implement it.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Each authorized employee on a LOTO job must:",
        [
          "Apply their own lock on the isolation point — group lockbox for teams",
          "Share one lock among ten people",
          "Skip lock if in a hurry",
          "Only tag without lock",
        ],
        0,
        "Personal lock proves individual protection — OSHA 1910.147.",
        [
          "Shared single lock removes accountability.",
          "Skipping lock causes fatalities — never acceptable.",
          "Tags alone can be removed — locks required.",
        ]
      ),
      expertMcq(
        "Stored hydraulic/pneumatic energy after LOTO electrical:",
        [
          "Must be relieved/blocked — secondary energy causes motion during service",
          "Ignored — only electrical matters",
          "Increases automatically when locked out",
          "Visible only on HMI",
        ],
        0,
        "Zero energy includes pressure, gravity, springs — bleed per procedure.",
        [
          "All energy types must be addressed.",
          "Stored energy does not increase from LOTO — must be released.",
          "HMI does not prove mechanical isolation.",
        ]
      ),
      expertMcq(
        "Removing guard for troubleshooting without procedure:",
        [
          "Exposes personnel to hazards — use setup mode or temporary guarding per risk assessment",
          "Always acceptable for speed",
          "Improves PL rating",
          "Replaces training",
        ],
        0,
        "Guards are engineered controls — removal requires equivalent protection.",
        [
          "Speed never trumps injury prevention.",
          "Removing guards lowers protection — does not improve PL.",
          "Training does not remove pinch points.",
        ]
      ),
      expertMcq(
        "Verification step after LOTO:",
        [
          "Try start — measure voltage/pressure — confirm zero energy before hands-on work",
          "Assume isolation because breaker looks off",
          "Start machine once to test",
          "Only check Ethernet ping",
        ],
        0,
        "Verify attempt/start and measurements — zero energy confirmation is mandatory.",
        [
          "Visual off is not verification — try/test procedure required.",
          "Starting under LOTO can kill — prohibited.",
          "Ping does not prove mechanical isolation.",
        ]
      ),
    ],
  },

  "print-reading/wiring-diagrams": {
    moduleSlug: "print-reading",
    lessonSlug: "wiring-diagrams",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Wire number on a schematic ties to:",
        [
          "Same number on terminal block/panel layout — cross-reference between pages",
          "Random label with no field meaning",
          "Motor RPM only",
          "PID setpoint only",
        ],
        0,
        "Tracing prints means following wire numbers across schematic, layout, and BOM.",
        [
          "Wire numbers are intentional cross-ref keys.",
          "RPM is motor data — not wire numbering scheme.",
          "Setpoint is process — unrelated to wire label.",
        ]
      ),
      expertMcq(
        "Terminal block TB4-7 on a print means:",
        [
          "Terminal block 4, point 7 — verify against physical label before metering",
          "Tank level 4.7 feet",
          "Phase 4 of 7 only",
          "Ethernet port 7 only",
        ],
        0,
        "TB notation is standard — mismatch between print and as-built causes wrong measurements.",
        [
          "Not a level measurement without context on P&ID.",
          "Not electrical phase notation.",
          "May be control wiring — not necessarily Ethernet.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Packaging Line 4 print package ties I:1/5 photoeye to:",
        [
          "Field terminal and ladder NC interlock PE CLEAR — trace wire number to module",
          "Hydraulic pump only",
          "480 VAC motor leads without diagram",
          "HMI color theme",
        ],
        0,
        "Print-to-ladder-to-I/O alignment is core troubleshooting skill on this platform.",
        [
          "Photoeye is discrete input — not hydraulic pump circuit in same sense.",
          "Prints document connections — never guess motor leads.",
          "HMI theme is UI — not wiring.",
        ]
      ),
      expertMcq(
        "Revision cloud on a wiring print indicates:",
        [
          "Changed area since prior revision — verify you hold current sheet",
          "Decoration only",
          "Motor is unbalanced electrically",
          "PLC in program mode",
        ],
        0,
        "Work from latest revision — panel door sheet index should match.",
        [
          "Clouds are engineering change markers.",
          "Electrical imbalance is field test — not revision symbol.",
          "Program mode is online status — unrelated to revision cloud.",
        ]
      ),
      expertMcq(
        "Dashed wire on diagram often means:",
        [
          "Optional, future, or harness detail per drawing legend — read legend first",
          "480 VAC only",
          "Always unused wire",
          "Hydraulic hose",
        ],
        0,
        "Legend defines line types — assumptions cause mis-wiring.",
        [
          "Line style meaning is legend-specific — not voltage class alone.",
          "Dashed may be used or planned — not always spare.",
          "Hydraulic hoses have separate symbology.",
        ]
      ),
      expertMcq(
        "As-built redlines on site should:",
        [
          "Be back-fed to controlled prints — technicians trust field only after update",
          "Discarded after job",
          "Replace LOTO procedure",
          "Eliminate wire numbers",
        ],
        0,
        "Stale prints cause wrong terminations — document control is safety.",
        [
          "Redlines are valuable — must enter document system.",
          "LOTO still required with accurate prints.",
          "Wire numbers remain essential for tracing.",
        ]
      ),
    ],
  },

  "print-reading/pid-symbols": {
    moduleSlug: "print-reading",
    lessonSlug: "pid-symbols",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "On a P&ID, gate valve symbol with process line through it normally indicates:",
        [
          "Isolation valve — verify line-up before interpreting flow path",
          "Motor starter contactor",
          "PLC input module",
          "EtherNet/IP switch",
        ],
        0,
        "P&ID valves show process isolation/control — not electrical devices.",
        [
          "Contactors appear on electrical schematics — different drawing set.",
          "I/O modules are electrical panel devices.",
          "Network switches are not P&ID process symbols.",
        ]
      ),
      expertMcq(
        "Instrument bubble with FT-101 means:",
        [
          "Flow transmitter tag 101 — locate on loop diagram for calibration",
          "Motor full-load amps",
          "Fuse type 101",
          "Floor tile 101",
        ],
        0,
        "ISA tagging: first letter function, following letters modifier, number is loop ID.",
        [
          "FLA is motor nameplate — different tag system.",
          "Fuses have electrical designations — not FT.",
          "Not architectural flooring.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Check valve on P&ID prevents:",
        [
          "Reverse flow — important for pump protection and level maintenance",
          "All pressure measurement",
          "Ethernet broadcast storms",
          "Motor single-phasing",
        ],
        0,
        "Directional flow symbols define process behavior during upsets.",
        [
          "Instruments still measure with check valves in circuit.",
          "Broadcast storms are network — not P&ID hydraulics.",
          "Single-phasing is electrical supply.",
        ]
      ),
      expertMcq(
        "Control valve fail position on P&ID annotation FC means:",
        [
          "Fail closed on air/power loss — verify against actuator and air supply",
          "Fail open always",
          "Field calibration only",
          "Motor forward rotation",
        ],
        0,
        "FC/FO/FL are safety-critical annotations — mismatch risks runaway fill/drain.",
        [
          "Fail open would be FO — read annotation carefully.",
          "Calibration is maintenance — fail position is design intent.",
          "Motor rotation is electrical/mechanical — not valve fail annotation.",
        ]
      ),
      expertMcq(
        "P&ID is not wiring diagram because:",
        [
          "P&ID shows process equipment and piping — wiring shows electrical connections",
          "They are identical documents",
          "P&ID shows only VLANs",
          "Wiring diagrams show tank levels only",
        ],
        0,
        "Use the right print set — process vs electrical troubleshooting.",
        [
          "Drawing sets complement each other — not duplicates.",
          "VLANs are network documentation.",
          "Tank levels may appear on P&ID — wiring shows conductors.",
        ]
      ),
      expertMcq(
        "Technician uses P&ID during loop checkout to:",
        [
          "Confirm device tag, location, and process function before applying mA simulation",
          "Set motor overload heaters",
          "Configure DLR ring",
          "Bypass guard interlock",
        ],
        0,
        "Tag traceability links P&ID → loop sheet → field device.",
        [
          "Overload is motor starter component.",
          "DLR is Ethernet topology.",
          "Guard bypass is unsafe — unrelated to P&ID use.",
        ]
      ),
    ],
  },
};

export const CURATED_BATCH_2_KEYS = Object.keys(CURATED_LESSON_ASSESSMENTS_BATCH2);
