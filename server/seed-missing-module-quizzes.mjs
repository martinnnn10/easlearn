/**
 * Q-01: Seed 10 quiz questions each for modules missing assessments.
 * Modules: 30005, 60001–60007
 * Run: node server/seed-missing-module-quizzes.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const MODULE_IDS = {
  industrialTroubleshooting: 30005,
  industrialNetworking: 60001,
  sensorsInstrumentation: 60002,
  roboticsFundamentals: 60003,
  printReading: 60004,
  safetySystems: 60005,
  processControl: 60006,
  powerDistribution: 60007,
};

// ─── 30005 Industrial Troubleshooting Academy (ITA lesson content) ───────────
const troubleshootingQuestions = [
  {
    question:
      "What is the FIRST step in the 7-step systematic troubleshooting framework when you arrive at a faulted machine?",
    options: [
      "Immediately measure motor current with a clamp meter",
      "Gather information: symptom, timing, recent changes, and history",
      "Reset the fault and observe whether it returns",
      "Replace the component most likely to have failed",
    ],
    correctIndex: 1,
    explanation:
      "Step 1 is Gather Information—understand what happened before touching equipment. The ITA lesson stresses operator interviews, fault logs, and identifying what changed.",
  },
  {
    question:
      'An operator reports "the motor won\'t start." Before choosing a diagnostic path, what must you do per Step 2?',
    options: [
      "Replace the motor starter contactor as a precaution",
      "Verify the exact symptom yourself—start failure can mean no click, hum, VFD trip, or overload trip",
      "Assume the report is accurate and check windings first",
      "Skip verification if production is down",
    ],
    correctIndex: 1,
    explanation:
      "Step 2 is Verify the Problem. The same vague symptom can be electrical, mechanical, drive, or overload—each path differs.",
  },
  {
    question:
      "Using the half-split method on a series path with 8 components, how many targeted measurements isolate the fault in the worst case?",
    options: ["8 measurements", "4 measurements", "3 measurements", "1 measurement"],
    correctIndex: 2,
    explanation:
      "Each half-split measurement eliminates half the remaining suspects: 8→4→2→1, so three measurements maximum.",
  },
  {
    question:
      "A 3-phase motor draws 15 A on phases A and B but 0 A on phase C while running. What is the most likely condition?",
    options: [
      "Normal balanced load",
      "Single-phasing—open fuse, open contactor pole, or open conductor on phase C",
      "VFD output frequency too low",
      "Correct operation at reduced load",
    ],
    correctIndex: 1,
    explanation:
      "Two phases carrying current with one at zero is classic single-phasing. The ITA verification section lists this pattern when distinguishing motor symptoms.",
  },
  {
    question:
      "Per the 80/20 rule of troubleshooting, which checks should come first?",
    options: [
      "Replace the PLC CPU",
      "Loose connections, dirty sensors, blown fuses, and tripped overloads",
      "Rewrite the control program",
      "Order a new VFD before any measurements",
    ],
    correctIndex: 1,
    explanation:
      "Most plant faults are simple, high-frequency causes. The ITA lesson tells you to check those before exotic failures.",
  },
  {
    question:
      "A VFD displays F004 (undervoltage). What is the logical first electrical measurement?",
    options: [
      "Motor insulation resistance to ground",
      "Input line voltage at the drive line terminals",
      "Output current while the motor is coupled",
      "Encoder feedback signal",
    ],
    correctIndex: 1,
    explanation:
      "Undervoltage faults start upstream: confirm nominal input voltage at the drive before blaming the motor or parameters.",
  },
  {
    question:
      "A PLC output LED is ON but the field solenoid does not energize. Where is the fault most likely?",
    options: [
      "PLC ladder logic always fails when the LED is on",
      "Between the output terminal and the field device—fuse, wiring, or solenoid",
      "The input module scanning rate",
      "The HMI graphics page",
    ],
    correctIndex: 1,
    explanation:
      "An ON output LED proves the processor commanded the output. The problem is downstream of the module terminal.",
  },
  {
    question:
      "Relay CR-5 on a print shows cross-references 15-3, 15-8, and 22-1. What do these mean?",
    options: [
      "CR-5 needs three different supply voltages",
      "CR-5 contacts appear on sheet 15 rungs 3 and 8 and sheet 22 rung 1",
      "CR-5 was replaced three times",
      "CR-5 has three coils",
    ],
    correctIndex: 1,
    explanation:
      "Cross-references list every rung where that relay's contacts appear—essential for tracing control paths under pressure.",
  },
  {
    question:
      "An intermittent fault appears every afternoon and clears overnight. What trigger fits the ITA thermal pattern?",
    options: [
      "Random software corruption",
      "Heat-related expansion opening a high-resistance connection",
      "Scheduled PLC download",
      "Normal daily production variance only",
    ],
    correctIndex: 1,
    explanation:
      "Afternoon heat plus overnight recovery points to thermal expansion affecting a marginal connection.",
  },
  {
    question:
      "What separates systematic troubleshooting from parts swapping?",
    options: [
      "Using more expensive tools",
      "Form a hypothesis, then take one decisive measurement to confirm or deny it",
      "Always replace the largest component first",
      "Skipping verification to save time",
    ],
    correctIndex: 1,
    explanation:
      "Experts test hypotheses with targeted measurements instead of shotgun replacements.",
  },
];

// ─── 60001 Industrial Networking (seed-new-tracks.mjs) ───────────────────────
const networkingQuestions = [
  {
    question: "EtherNet/IP uses CIP on top of standard Ethernet. What does the name stand for?",
    options: [
      "Ethernet Internet Protocol",
      "Ethernet Industrial Protocol",
      "Enhanced Internet Packet",
      "Electrical Instrumentation Protocol",
    ],
    correctIndex: 1,
    explanation:
      "EtherNet/IP is Ethernet Industrial Protocol—CIP carried over TCP/IP and UDP/IP, not office HTTP traffic.",
  },
  {
    question:
      "A remote I/O rack shows no switch link light. What is the most likely failure layer?",
    options: [
      "Duplicate IP only",
      "Physical layer—cable, connector, or switch port",
      "RPI set too slow",
      "PLC program scan time",
    ],
    correctIndex: 1,
    explanation:
      "No link light means Layer 1 is down before IP or CIP can work.",
  },
  {
    question: "What does RPI (Requested Packet Interval) set in an implicit I/O connection?",
    options: [
      "Motor full-load amps",
      "How often cyclic I/O data is exchanged",
      "Subnet mask length",
      "Cable category rating",
    ],
    correctIndex: 1,
    explanation:
      "RPI defines the cyclic update rate; connection timeout is typically 4× RPI before a comm-loss fault.",
  },
  {
    question:
      "Which topology gives sub-millisecond failover for a single cable break on Rockwell networks?",
    options: ["Flat unmanaged star", "Device Level Ring (DLR)", "RS-232 daisy chain", "USB hub"],
    correctIndex: 1,
    explanation: "DLR is the fault-tolerant ring topology listed in the networking track glossary.",
  },
  {
    question:
      "Implicit messaging on EtherNet/IP is lost intermittently. Which cause is highlighted in the lesson?",
    options: [
      "Using Cat6 instead of Cat5e",
      "Bad crimp, half-duplex, or EMI on the cable path",
      "PLC rack size",
      "Motor overload setting",
    ],
    correctIndex: 1,
    explanation:
      "The lesson ties implicit comm loss to physical-layer issues including half-duplex and EMI near drives.",
  },
  {
    question: "What is the purpose of IGMP snooping on a managed industrial switch?",
    options: [
      "Assign static IP addresses",
      "Forward multicast only to ports that joined the group",
      "Increase copper segment length beyond 100 m",
      "Convert 480 V to 120 V",
    ],
    correctIndex: 1,
    explanation:
      "IGMP snooping prevents multicast floods from overwhelming every port on the switch.",
  },
  {
    question:
      "Explicit messaging in EtherNet/IP is best described as:",
    options: [
      "Cyclic UDP I/O at fixed RPI",
      "On-demand TCP request/response for configuration and diagnostics",
      "Proprietary serial at 9600 baud",
      "Wireless only",
    ],
    correctIndex: 1,
    explanation:
      "Explicit = TCP configuration/diagnostics; implicit = UDP real-time I/O.",
  },
  {
    question:
      "Two devices on 192.168.1.0/24 are assigned the same host address. What symptom appears?",
    options: [
      "Both always work normally",
      "Intermittent or total loss of communication to one or both devices",
      "Automatic VLAN creation",
      "Higher motor torque",
    ],
    correctIndex: 1,
    explanation:
      "Duplicate IPs are a top commissioning mistake called out in the IP addressing section.",
  },
  {
    question:
      "A PLC at 192.168.1.10/24 cannot reach a drive at 192.168.2.20/24 without a router. Why?",
    options: [
      "Different subnets require a gateway to route between networks",
      "CIP forbids drives",
      "RPI is illegal across subnets",
      "Implicit messaging uses only 127.0.0.1",
    ],
    correctIndex: 0,
    explanation:
      "Devices on different network portions need a configured gateway to communicate.",
  },
  {
    question:
      "How should office IT traffic be kept from disrupting machine control traffic?",
    options: [
      "Use longer patch cords",
      "VLANs or physically separate networks with controlled routing/firewall",
      "Disable all E-stops",
      "Run everything on one unmanaged switch",
    ],
    correctIndex: 1,
    explanation:
      "Segmentation via VLANs or physical separation is the recommended plant practice in the lesson.",
  },
];

// ─── 60002 Sensors & Instrumentation ─────────────────────────────────────────
const sensorsQuestions = [
  {
    question:
      "A 4–20 mA transmitter (0–100 PSI) reads 12.0 mA. What is the pressure?",
    options: ["12 PSI", "50 PSI", "65 PSI", "75 PSI"],
    correctIndex: 1,
    explanation: "Span = 16 mA. (12 − 4) / 16 × 100 = 50 PSI per the scaling table in the analog signals lesson.",
  },
  {
    question: "Why is 4 mA used as the live zero instead of 0 mA?",
    options: [
      "0 mA uses less power",
      "0 mA clearly indicates a broken wire, not a zero process value",
      "4 mA is required by NPN sensors",
      "PLC cards only read 4 mA",
    ],
    correctIndex: 1,
    explanation:
      "Live zero distinguishes a broken loop from a true zero reading—a safety-critical distinction on level and pressure loops.",
  },
  {
    question:
      "Per common sensor wire colors, the black conductor on a 3-wire DC sensor is:",
    options: ["+24 V supply", "0 V return", "Signal output to the PLC", "Shield drain only"],
    correctIndex: 2,
    explanation: "Brown = +V, blue = 0 V, black = output in the wiring table.",
  },
  {
    question:
      "A Type J thermocouple is extended with Type K extension wire. What error occurs?",
    options: [
      "No error",
      "Measurement error of roughly 5–15 °C from mismatched metals",
      "Sensor outputs 4 mA always",
      "PLC forces a major fault",
    ],
    correctIndex: 1,
    explanation:
      "Extension wire must match thermocouple type—called out as a common installation mistake.",
  },
  {
    question: "A 4–20 mA loop reads 0 mA on a powered transmitter. What does that indicate?",
    options: [
      "Process at exactly zero",
      "Open loop or broken wire",
      "Transmitter at full scale",
      "Perfect calibration",
    ],
    correctIndex: 1,
    explanation: "0 mA is the wire-break signature, not a valid process zero.",
  },
  {
    question: "A Pt100 RTD measures 138.5 Ω. Approximately what temperature is that?",
    options: ["38.5 °C", "100 °C", "138.5 °C", "385 °C"],
    correctIndex: 1,
    explanation: "Pt100: 100 Ω at 0 °C, +0.385 Ω/°C → (138.5 − 100) / 0.385 ≈ 100 °C.",
  },
  {
    question: "Why is a 3-wire RTD connection preferred over 2-wire for industrial runs?",
    options: [
      "Higher voltage rating",
      "Compensates for lead wire resistance error",
      "Eliminates cold-junction compensation",
      "Required for 4–20 mA output",
    ],
    correctIndex: 1,
    explanation:
      "The third wire lets the transmitter subtract lead resistance from the measurement.",
  },
  {
    question:
      "For steam or gas pressure tap piping, how should the transmitter be mounted?",
    options: [
      "Below the tap with a liquid-filled impulse leg",
      "Above the tap so condensate drains away from the diaphragm",
      "Inside the motor control center",
      "Orientation never matters",
    ],
    correctIndex: 1,
    explanation:
      "Gas/steam service uses mounting above the tap to prevent condensate damage to the sensor.",
  },
  {
    question: "Differential pressure transmitters are commonly used to infer:",
    options: [
      "Motor speed only",
      "Flow across an orifice or filter restriction",
      "Robot TCP position",
      "Ethernet switch temperature",
    ],
    correctIndex: 1,
    explanation:
      "DP measurement is the standard way to measure flow and monitor filter clogging in the pressure lesson.",
  },
  {
    question:
      "A PNP proximity sensor must drive which type of PLC digital input?",
    options: [
      "Sourcing input",
      "Sinking input",
      "Analog 0–10 V only",
      "Thermocouple input",
    ],
    correctIndex: 1,
    explanation: "PNP (sourcing) sensors wire to sinking input cards—the #1 wiring pairing in the lesson.",
  },
];

// ─── 60003 Robotics Fundamentals ─────────────────────────────────────────────
const roboticsQuestions = [
  {
    question:
      "What is the primary safety device that stops robot motion when a person enters the safeguarded space?",
    options: [
      "Production HMI screensaver",
      "Safety-rated light curtain or area scanner integrated with the safety circuit",
      "Higher acceleration time",
      "Larger payload rating",
    ],
    correctIndex: 1,
    explanation:
      "Perimeter optical guarding is listed with E-stops as safety-rated robot interfaces.",
  },
  {
    question: "Robot repeatability of ±0.02 mm means:",
    options: [
      "Maximum reach is 0.02 mm",
      "It returns to the same taught point within ±0.02 mm over repeated cycles",
      "TCP speed is 0.02 mm/s",
      "Payload is 0.02 kg",
    ],
    correctIndex: 1,
    explanation:
      "Repeatability describes consistency returning to the same position, not workspace size.",
  },
  {
    question: "A SCARA robot is best described as:",
    options: [
      "Six-axis welding arm for every application",
      "Fast pick-and-place with rigid Z and compliant XY motion",
      "Hydraulic press brake",
      "Delta spider for sub-0.5 s picking only",
    ],
    correctIndex: 1,
    explanation:
      "SCARA geometry targets horizontal assembly with vertical rigidity—stated in the robot types lesson.",
  },
  {
    question:
      "Axis 2 overcurrent occurs at the same extended reach every cycle. A likely cause is:",
    options: [
      "Teach pendant language setting",
      "Gravitational load exceeds allowable payload at that reach",
      "Ethernet IP address duplicate",
      "Wrong grease color only",
    ],
    correctIndex: 1,
    explanation:
      "Torque on the shoulder/elbow axes increases at extended reach with heavy tooling.",
  },
  {
    question: "Robot mastering (calibration) establishes:",
    options: [
      "Plant air pressure",
      "The relationship between encoder counts and true joint angles",
      "VFD carrier frequency",
      "Network VLAN IDs",
    ],
    correctIndex: 1,
    explanation:
      "Mastering aligns mechanical zero with encoder feedback after battery loss or mechanical service.",
  },
  {
    question: "Collaborative robots limit injury risk primarily by:",
    options: [
      "Removing all safety circuits",
      "Force- and speed-limited joints that stop on contact",
      "Running without any teach pendant",
      "Disabling E-stops",
    ],
    correctIndex: 1,
    explanation:
      "Cobots are defined by power/force limiting suitable for shared workspaces.",
  },
  {
    question:
      "If the Tool Center Point (TCP) is defined incorrectly, what happens during orientation moves?",
    options: [
      "Cycle time always improves",
      "The tool tip path deviates because rotations pivot about the wrong point",
      "Robot automatically re-masters",
      "Only joint 1 is affected",
    ],
    correctIndex: 1,
    explanation:
      "TCP is the reference for Cartesian motion; a wrong TCP shifts every oriented path.",
  },
  {
    question: "A singularity in robot kinematics is:",
    options: [
      "Maximum payload pose",
      "An alignment where the arm loses a degree of freedom and joint speeds can spike",
      "Teach pendant battery low",
      "Approved maintenance window",
    ],
    correctIndex: 1,
    explanation:
      "Singularities are joint alignments that make inverse kinematics ill-conditioned.",
  },
  {
    question:
      "After a collision, what must maintenance do before returning to automatic production?",
    options: [
      "Increase speed 200%",
      "Inspect damage, re-master if needed, verify TCP, then trial at reduced speed",
      "Delete all safety programs",
      "Bypass guard locks",
    ],
    correctIndex: 1,
    explanation:
      "Collision recovery calls for mechanical inspection, mastering verification, and slow prove-out.",
  },
  {
    question:
      "On Ethernet/IP robot integration, the PLC typically acts as the:",
    options: ["Adapter (slave)", "Scanner (master)", "Passive hub", "Ground reference"],
    correctIndex: 1,
    explanation:
      "The PLC scans the robot adapter for cyclic I/O and explicit diagnostics.",
  },
];

// ─── 60004 Print Reading (Electrical) ────────────────────────────────────────
const printReadingQuestions = [
  {
    question: "On a ladder diagram, a normally open contact is drawn as:",
    options: [
      "Two vertical lines with a diagonal slash",
      "Two vertical lines without a slash",
      "A circle",
      "A zigzag resistor symbol",
    ],
    correctIndex: 1,
    explanation:
      "NO contacts are parallel vertical bars; NC adds the slash per the schematic symbols table.",
  },
  {
    question: "Cross-reference 5-3, 8-7, 12-1 beside relay CR-10 means:",
    options: [
      "CR-10 is rated 5-8-12 A",
      "CR-10 contacts are used on sheet 5 rung 3, sheet 8 rung 7, and sheet 12 rung 1",
      "Three CR-10 coils exist",
      "Wire colors 5, 8, and 12",
    ],
    correctIndex: 1,
    explanation:
      "Cross-references trace every contact location for a given relay coil.",
  },
  {
    question: "On a ladder diagram, power flow convention is:",
    options: [
      "Bottom to top only",
      "Left to right from L1 toward L2",
      "Random by wire number",
      "From neutral to ground only",
    ],
    correctIndex: 1,
    explanation:
      "Rule 1 in the ladder reading lesson: power flows left to right on each rung.",
  },
  {
    question:
      "A seal-in (holding) contact on a motor starter rung allows the starter to:",
    options: [
      "Run at two speeds simultaneously",
      "Stay energized after the momentary START pushbutton releases",
      "Bypass overload protection",
      "Convert AC to DC",
    ],
    correctIndex: 1,
    explanation:
      "The M contact parallels START so the coil remains picked up after the operator releases START.",
  },
  {
    question: "On a single-line diagram, MCC-1 represents:",
    options: [
      "One horsepower motor only",
      "A motor control center section feeding multiple starters",
      "Main circuit breaker only",
      "Maintenance computer",
    ],
    correctIndex: 1,
    explanation:
      "MCC assemblies group multiple motor starters on a common bus, as shown in the one-line example.",
  },
  {
    question:
      "Overload (OL) contacts in series with a starter coil open when:",
    options: [
      "Oil level is low",
      "Motor current exceeds the overload setting",
      "Network RPI times out",
      "Room temperature is below freezing",
    ],
    correctIndex: 1,
    explanation:
      "OL contacts protect the motor from sustained overcurrent by dropping out the control circuit.",
  },
  {
    question:
      "Per the motor branch table, inverse-time breaker short-circuit protection is sized up to:",
    options: ["115% of FLA", "175% of FLA", "250% of FLA", "400% of FLA always"],
    correctIndex: 2,
    explanation:
      "The print-reading motor circuit table lists 250% of FLA for branch breaker sizing.",
  },
  {
    question: "Notation 3/14 printed under a relay coil indicates:",
    options: [
      "March 14 installation date",
      "Coil located on sheet 3, rung 14",
      "Three poles at 14 A",
      "14 mm sensing distance",
    ],
    correctIndex: 1,
    explanation:
      "Sheet/rung notation ties the schematic symbol to its physical location in the drawing set.",
  },
  {
    question:
      "When tracing wire 142 to TB-3 terminal 7 in the panel, you should:",
    options: [
      "Ignore terminal labels",
      "Locate TB-3, count to position 7, and verify ferrule 142 matches the print",
      "Only use wire color",
      "Assume all TB rows are identical",
    ],
    correctIndex: 1,
    explanation:
      "Wire tracing pairs schematic wire numbers with labeled terminal blocks in the layout lesson.",
  },
  {
    question: "In a wye (Y) three-phase system, line-to-neutral voltage equals:",
    options: [
      "Line-to-line voltage",
      "Line-to-line voltage divided by √3",
      "Line-to-line voltage × 2",
      "Zero always",
    ],
    correctIndex: 1,
    explanation:
      "Wye connection: VLN = VLL / √3, e.g., 480 V line gives 277 V to neutral.",
  },
];

// ─── 60005 Safety Systems ────────────────────────────────────────────────────
const safetyQuestions = [
  {
    question:
      "After an E-stop is pressed and released, what is required before motion can restart?",
    options: [
      "Automatic restart when the button releases",
      "Manual reset after the E-stop is released and the hazard is cleared",
      "Cycle start only—no reset needed",
      "SCADA login",
    ],
    correctIndex: 1,
    explanation:
      "NFPA 79 / IEC 60204 require latching E-stops with deliberate manual reset—no auto restart.",
  },
  {
    question:
      "Category 3 safety architecture per ISO 13849 means:",
    options: [
      "Single channel, no monitoring",
      "Dual independent channels where one fault does not lose the safety function",
      "Safety is optional",
      "Only software interlocks",
    ],
    correctIndex: 1,
    explanation:
      "Category 3 is dual-channel with cross-monitoring so a single fault cannot silently defeat safety.",
  },
  {
    question:
      "A Type 4 light curtain with 14 mm beam resolution can detect objects about:",
    options: ["7 mm wide", "14 mm wide", "140 mm wide", "Resolution is unrelated to object size"],
    correctIndex: 1,
    explanation:
      "Resolution approximates minimum object size; 14 mm beams target finger/hand detection.",
  },
  {
    question: "Cross-monitoring in a dual-channel safety circuit detects:",
    options: [
      "Motor bearing temperature",
      "Channel discrepancy indicating a fault in one path",
      "Network bandwidth",
      "Hydraulic oil level",
    ],
    correctIndex: 1,
    explanation:
      "Each channel checks the other; mismatched states prevent restart until repaired.",
  },
  {
    question:
      "In safety distance S = (K × T) + C, the variable T represents:",
    options: [
      "Ambient temperature",
      "Total system stopping time including sensor, logic, and machine coastdown",
      "Transformer turns ratio",
      "Torque",
    ],
    correctIndex: 1,
    explanation:
      "T is total response time from detection through machine stop—used to set curtain distance from the hazard.",
  },
  {
    question: "Positive-break (force-guided) safety contacts are designed so that:",
    options: [
      "Both NO and NC can weld closed together undetected",
      "Linked contacts cannot close together if one welds—making faults detectable",
      "They need no monitoring",
      "They replace grounding",
    ],
    correctIndex: 1,
    explanation:
      "Force-guided contacts mechanically prevent unsafe welded states from looking normal.",
  },
  {
    question:
      "A guard lock interlock will not release the door until:",
    options: [
      "Operator forces the latch",
      "The machine confirms a safe state (zero hazardous motion/energy)",
      "Production quota is met",
      "Shift change",
    ],
    correctIndex: 1,
    explanation:
      "Guard locking waits for confirmed safe state—never defeat the lock during coast-down.",
  },
  {
    question:
      "Lockout/tagout (LOTO) primary purpose is to:",
    options: [
      "Speed up changeovers",
      "Isolate all hazardous energy so equipment cannot re-energize during work",
      "Track maintenance KPIs only",
      "Replace risk assessment",
    ],
    correctIndex: 1,
    explanation:
      "LOTO is defined in the print/safety materials as verified de-energization before human exposure.",
  },
  {
    question:
      "A coded magnetic safety interlock is preferred over a simple roller lever because:",
    options: [
      "It is always cheaper",
      "It resists easy defeat with tools or zip ties",
      "It eliminates need for E-stops",
      "It increases robot speed",
    ],
    correctIndex: 1,
    explanation:
      "Coded actuators require the matching key—reducing casual bypass of guards.",
  },
  {
    question:
      "Safe state differs from simply stopped because safe state means:",
    options: [
      "The HMI is off",
      "Hazardous energy is controlled so unexpected release cannot injure someone",
      "Cycle counter reset",
      "Oil changed recently",
    ],
    correctIndex: 1,
    explanation:
      "Stopped motion alone is not enough if stored energy could still release unexpectedly.",
  },
];

// ─── 60006 Process Control ─────────────────────────────────────────────────────
const processControlQuestions = [
  {
    question: "The integral (I) term in a PID loop primarily eliminates:",
    options: [
      "Sensor wire length",
      "Steady-state offset after proportional action",
      "Need for a transmitter",
      "Network latency",
    ],
    correctIndex: 1,
    explanation:
      "Integral accumulates error over time to remove the offset proportional-only control leaves behind.",
  },
  {
    question:
      "A loop oscillates and increasing proportional gain makes oscillation worse. What should you do first?",
    options: [
      "Increase proportional gain again",
      "Reduce proportional gain (or increase integral time to soften response)",
      "Remove the sensor",
      "Open the control valve fully",
    ],
    correctIndex: 1,
    explanation:
      "Oscillation with too much P is listed in the tuning table—reduce aggressiveness, not add more P.",
  },
  {
    question: "Proportional-only control typically leaves:",
    options: [
      "Zero error always",
      "A steady-state offset at the setpoint",
      "Infinite gain",
      "No need for a final element",
    ],
    correctIndex: 1,
    explanation:
      "P action alone cannot eliminate remaining error without integral action.",
  },
  {
    question:
      "Derivative action is often set to zero on noisy flow or pressure loops because:",
    options: [
      "D term amplifies noise and can cause erratic output",
      "D term removes wire-break detection",
      "D term is illegal on PLCs",
      "D term only works on DC motors",
    ],
    correctIndex: 0,
    explanation:
      "The lesson notes D helps temperature but hurts noisy fast loops—PI is the common plant default.",
  },
  {
    question: "A valve positioner is used to:",
    options: [
      "Replace the PLC CPU",
      "Force the valve stem to match the control signal despite friction/hysteresis",
      "Measure ground faults",
      "Tune Ethernet RPI",
    ],
    correctIndex: 1,
    explanation:
      "Positioners close the loop locally so 50% command equals 50% stem position.",
  },
  {
    question: "In ISA-5.1 tagging, FT-310 identifies:",
    options: [
      "Flow transmitter, loop 310",
      "Temperature valve, loop 310",
      "Level controller, loop 310",
      "Pressure indicator only",
    ],
    correctIndex: 0,
    explanation:
      "First letter = measured variable (F), second letter = function (T), digits = loop number.",
  },
  {
    question:
      "Integral windup occurs when:",
    options: [
      "Derivative is zero",
      "Output saturates but integral keeps accumulating error",
      "Setpoint equals PV",
      "Valve is new",
    ],
    correctIndex: 1,
    explanation:
      "Windup happens at output limits; anti-windup stops integrating during saturation.",
  },
  {
    question:
      "A fail-closed (air-to-open) control valve loses instrument air. The valve:",
    options: [
      "Stays mid-stroke indefinitely",
      "Drives closed on spring return",
      "Opens fully",
      "Converts to manual hydraulic",
    ],
    correctIndex: 1,
    explanation:
      "Fail position is defined by process safety—air-to-open springs closed on air loss.",
  },
  {
    question: "Ziegler–Nichols open-loop tuning requires you to find:",
    options: [
      "Motor FLA only",
      "Ultimate gain Ku and oscillation period Tu at sustained cycle",
      "Transformer tap setting",
      "Robot TCP offset",
    ],
    correctIndex: 1,
    explanation:
      "Increase P until steady oscillation, record Ku and Tu, then apply the Z-N formulas.",
  },
  {
    question:
      "Split-range control with cooling 0–50% and heating 50–100% places the output at 50% when:",
    options: [
      "The loop is at setpoint with no heating or cooling demand",
      "The valve is failed",
      "The sensor wire is broken",
      "Derivative is maximum",
    ],
    correctIndex: 0,
    explanation:
      "At the split point neither valve is active—common for temperature loops with dual final elements.",
  },
];

// ─── 60007 Power Distribution ───────────────────────────────────────────────
const powerDistributionQuestions = [
  {
    question: "On a 480Y/277 V wye system, line-to-neutral voltage is approximately:",
    options: ["480 V", "277 V", "120 V only", "208 V"],
    correctIndex: 1,
    explanation: "VLN = VLL / √3 ≈ 480 / 1.732 ≈ 277 V for lighting and single-phase loads.",
  },
  {
    question: "Ground fault protection equipment (GFPE) on large feeders is intended to:",
    options: [
      "Increase motor speed",
      "Detect current leaking to ground and trip before equipment damage",
      "Replace overload heaters",
      "Measure power factor only",
    ],
    correctIndex: 1,
    explanation:
      "GFPE senses ground faults on 480 V feeders—required on large services per the grounding lesson.",
  },
  {
    question:
      "Per the motor branch protection table, maximum inverse-time breaker size is often:",
    options: ["115% FLA", "175% FLA", "250% FLA", "500% FLA minimum"],
    correctIndex: 2,
    explanation:
      "250% of motor FLA is the cited branch breaker sizing rule in the distribution/print materials.",
  },
  {
    question:
      "One fuse blown on a running three-phase motor branch most likely indicates:",
    options: [
      "Balanced load",
      "Single-phasing or ground fault on that phase",
      "Harmonic filter failure only",
      "Correct LOTO",
    ],
    correctIndex: 1,
    explanation:
      "Single open phase on a three-phase motor is a classic cause listed in blown-fuse diagnostics.",
  },
  {
    question:
      "High-resistance grounding (HRG) compared with solidly grounded systems limits:",
    options: [
      "Motor RPM",
      "First ground fault current to a low level so production can continue briefly",
      "Need for any grounds",
      "Transformer kVA rating",
    ],
    correctIndex: 1,
    explanation:
      "HRG keeps first ground-fault current low (<10 A) but requires tracking and repair before a second fault.",
  },
  {
    question: "Selective coordination means:",
    options: [
      "All breakers trip together",
      "Only the device closest to the fault should clear the fault",
      "Fuses are illegal",
      "Motors start simultaneously",
    ],
    correctIndex: 1,
    explanation:
      "Coordination ensures upstream breakers remain closed while the branch device clears the fault.",
  },
  {
    question:
      "Megger insulation resistance below 1 MΩ on a motor winding generally means:",
    options: [
      "Excellent insulation",
      "Investigate immediately—insulation is deteriorating or faulted",
      "Ignore until next year",
      "Increase tap +5%",
    ],
    correctIndex: 1,
    explanation:
      "The megger table flags <1 MΩ as poor—find and repair before energizing.",
  },
  {
    question:
      "A short circuit differs from an overload because a short circuit:",
    options: [
      "Is always slower",
      "Is a very high fault current from an unintended low-impedance path",
      "Only happens on single-phase lighting",
      "Never trips breakers",
    ],
    correctIndex: 1,
    explanation:
      "Short circuits produce extreme current instantly; overloads are moderate current over time.",
  },
  {
    question:
      "Before opening energized 480 V equipment, NFPA 70E requires you to:",
    options: [
      "Guess PPE from memory",
      "Read the arc flash label and wear PPE for the incident energy level",
      "Disable all grounds",
      "Remove the neutral",
    ],
    correctIndex: 1,
    explanation:
      "Arc flash labels define incident energy and required PPE—never work energized without them.",
  },
  {
    question:
      "Motors at an MCC read 505 V instead of 480 V nominal. A sensible first check is:",
    options: [
      "Replace every motor",
      "Verify transformer tap settings before chasing motor failures",
      "Disable HRG",
      "Increase RPI",
    ],
    correctIndex: 1,
    explanation:
      "The lesson cites high bus voltage from wrong transformer taps—adjust taps before replacing loads.",
  },
];

const ALL_MODULES = [
  { moduleId: MODULE_IDS.industrialTroubleshooting, questions: troubleshootingQuestions },
  { moduleId: MODULE_IDS.industrialNetworking, questions: networkingQuestions },
  { moduleId: MODULE_IDS.sensorsInstrumentation, questions: sensorsQuestions },
  { moduleId: MODULE_IDS.roboticsFundamentals, questions: roboticsQuestions },
  { moduleId: MODULE_IDS.printReading, questions: printReadingQuestions },
  { moduleId: MODULE_IDS.safetySystems, questions: safetyQuestions },
  { moduleId: MODULE_IDS.processControl, questions: processControlQuestions },
  { moduleId: MODULE_IDS.powerDistribution, questions: powerDistributionQuestions },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  let totalInserted = 0;

  for (const { moduleId, questions } of ALL_MODULES) {
    const [existing] = await conn.query(
      "SELECT COUNT(*) as cnt FROM quiz_questions WHERE moduleId = ?",
      [moduleId]
    );
    if (existing[0].cnt > 0) {
      console.log(`Module ${moduleId}: already has ${existing[0].cnt} questions — skipping.`);
      continue;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await conn.query(
        "INSERT INTO quiz_questions (moduleId, question, options, correctIndex, explanation, sortOrder) VALUES (?, ?, ?, ?, ?, ?)",
        [moduleId, q.question, JSON.stringify(q.options), q.correctIndex, q.explanation, i + 1]
      );
      totalInserted++;
    }
    console.log(`Module ${moduleId}: inserted ${questions.length} questions.`);
  }

  console.log(`\nDone. Inserted ${totalInserted} quiz questions.`);
  await conn.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
