import type { CuratedLessonAssessment } from "./curatedLessonAssessmentTypes";
import { expertMcq } from "./curatedMcqHelpers";

type CuratedBatch1Key = `${string}/${string}`;

export const CURATED_LESSON_ASSESSMENTS_BATCH1: Record<CuratedBatch1Key, CuratedLessonAssessment> = {
  "plc-fundamentals/plc-architecture": {
    moduleSlug: "plc-fundamentals",
    lessonSlug: "plc-architecture",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "On a ControlLogix rack, where does the processor read discrete field wiring status?",
        [
          "From the I/O modules in the chassis — each module maps to input/output image tags",
          "Directly from the HMI touchscreen over EtherNet/IP",
          "From the programming laptop only while online",
          "From the motor contactor auxiliary without an input module",
        ],
        0,
        "Discrete field devices terminate on I/O modules. The CPU scans the input image table each scan cycle — not the HMI or laptop.",
        [
          "The HMI mirrors tags from the PLC — watching a screen does not replace the input image table the CPU actually scans.",
          "Studio 5000 online mode lets you monitor bits, but field wiring still lands on I/O modules whether the laptop is connected or not.",
          "Aux contacts can feed inputs, but only after wiring to an input module terminal — the CPU never reads the contactor coil circuit directly.",
        ]
      ),
      expertMcq(
        "A technician sees SF (fault) LED solid on a 1756-IB16 input module. Best first action?",
        [
          "Check module status in Studio 5000 and verify field power/common for that card",
          "Download a new program to clear the LED",
          "Force all inputs ON to test wiring",
          "Replace the CPU before checking the module",
        ],
        0,
        "Module fault LEDs indicate hardware or configuration issues on that card. Verify field power, wiring, and module diagnostics before replacing major components.",
        [
          "A download will not clear a hardware SF on one card — you would still see the red LED and the same module fault in the I/O tree.",
          "Forcing inputs masks what the card actually sees and can energize outputs while the field fault remains.",
          "The CPU can run fine while one input module faults — swap the card only after you confirm field power and module diagnostics.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Local I/O on a CompactLogix L1 controller differs from a modular ControlLogix chassis because:",
        [
          "L1 controllers have embedded I/O points; large systems use separate I/O modules in a rack",
          "L1 controllers cannot scan inputs faster than 500 ms",
          "ControlLogix never uses discrete I/O",
          "Embedded I/O always runs at 480 VAC",
        ],
        0,
        "CompactLogix L1/L2/L3 integrate I/O on the controller. ControlLogix uses chassis-mounted I/O modules for scalability.",
        [
          "CompactLogix scan times are typically milliseconds — the 500 ms limit is not a real L1 constraint.",
          "ControlLogix racks are built from discrete and analog I/O modules — that is the standard architecture.",
          "Embedded I/O uses the same 24 VDC field circuits as rack modules — 480 VAC never lands on PLC input terminals.",
        ]
      ),
      expertMcq(
        "Which voltage class is typical for PLC discrete input field devices in North American panels?",
        [
          "24 VDC (sinking or sourcing)",
          "480 VAC directly on input terminals",
          "120 VAC on every digital input without isolation",
          "5 VDC from USB only",
        ],
        0,
        "Most industrial discrete inputs are 24 VDC field circuits. 120 VAC inputs exist but are not universal; 480 VAC never lands on PLC input terminals.",
        [
          "480 VAC is motor feeder voltage — input modules accept low-voltage field signals, not line power.",
          "Some cards accept 120 VAC inputs, but most discrete I/O in AB panels is 24 VDC — not universal 120 VAC.",
          "USB is for programming ports, not field device power — you would measure 24 VDC at the terminal block, not 5 V from a cable.",
        ]
      ),
      expertMcq(
        "The CPU scan cycle affects troubleshooting because:",
        [
          "Output coils and timers update once per scan — symptoms may lag one scan after input changes",
          "Inputs are read only at power-up",
          "Scan rate eliminates the need to check field wiring",
          "A faster scan removes overload protection",
        ],
        0,
        "Ladder logic executes cyclically. A change in field state appears on the next scan; timers accumulate per scan interval.",
        [
          "Inputs refresh every scan while in run — a pushbutton release can take one scan before the bit drops in monitor.",
          "Fast scan only changes how quickly logic reacts — a open wire at the terminal still reads FALSE regardless of scan speed.",
          "Overload relays and drive thermal limits are separate from PLC scan — faster scans do not change motor heating.",
        ]
      ),
      expertMcq(
        "Before replacing a suspected failed I/O module, a competent technician should:",
        [
          "Verify field wiring, power supply, and module configuration in the I/O configuration tree",
          "Force outputs to prove the module is bad",
          "Swap the CPU first to rule out programming errors",
          "Bypass the module in software permanently",
        ],
        0,
        "Most I/O faults are wiring, power, or configuration — not failed silicon. Documented verification prevents unnecessary parts swaps.",
        [
          "A forced ON output with a blown field fuse still proves nothing about the module — measure terminal voltage first.",
          "CPU swaps are expensive downtime — module SF LEDs and missing I/O in the tree point to the card or its field power.",
          "Software bypass hides a failed input forever and leaves the machine running without that interlock — fix the root cause.",
        ]
      ),
    ],
  },

  "plc-fundamentals/ladder-logic-basics": {
    moduleSlug: "plc-fundamentals",
    lessonSlug: "ladder-logic-basics",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "A normally open (NO) contact on an input instruction passes power when:",
        [
          "The associated input bit is TRUE (1)",
          "The associated input bit is FALSE (0)",
          "The rung is commented out",
          "The output coil is already energized",
        ],
        0,
        "NO contacts close when the bit is true. NC contacts pass when the bit is false.",
        [
          "FALSE (0) is when an NC (XIO) contact passes — an NO instruction opens when the bit is off.",
          "Comments are ignored by the processor — rung state still depends on instruction types, not comment text.",
          "Output coil state is downstream on the rung — an input NO contact does not look at whether a coil is already on.",
        ]
      ),
      expertMcq(
        "Seal-in (latching) logic requires:",
        [
          "A parallel branch with a contact of the output coil around the momentary start input",
          "Two unrelated timers in series",
          "Forcing the output ON every scan",
          "Removing the stop circuit for reliability",
        ],
        0,
        "Seal-in holds the rung true after the start pushbutton releases, until stop or an interlock opens the circuit.",
        [
          "Timers delay or count events — they do not hold a motor running after the start button springs back.",
          "Forces are diagnostic only and drop when cleared — seal-in is a parallel branch contact, not a force.",
          "Removing stop defeats fail-safe design — NC stop in series is required; seal-in wraps the start, not the stop.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "On a start/stop circuit, the STOP pushbutton is wired as NC in the field. In ladder logic it appears as:",
        [
          "NC contact — opens the rung when the stop circuit opens (pressed, wire fault, or NC device open)",
          "NO contact — always passes when stop is pressed",
          "Timer instruction only",
          "Output coil",
        ],
        0,
        "Stop buttons are NC for safety. The ladder NC instruction drops out when the field stop circuit opens — wiring style determines the exact bit state.",
        [
          "Pressed stop opens the NC field circuit — the NC ladder contact drops out; an NO contact would pass when you need the rung to open.",
          "Stop is an input condition, not a timing function — you would see an XIC or XIO contact, not a TON block.",
          "The stop pushbutton drives an input bit — coils are outputs like MTR_RUN, not the stop device itself.",
        ]
      ),
      expertMcq(
        "Which instruction type sets a bit TRUE when its rung is true for the entire scan?",
        [
          "Output coil (OTE/OTL depending on style)",
          "TON timer only",
          "XIO on an output",
          "Comment block",
        ],
        0,
        "Coils are outputs driven by rung continuity evaluated during the scan.",
        [
          "TON sets .DN after accumulated time — it does not directly latch an output bit true for the whole scan on rung true alone.",
          "XIO is an examine-off input instruction — outputs use OTE/OTL/OTU coil types.",
          "Comments never affect the output image — only coil instructions write output bits.",
        ]
      ),
      expertMcq(
        "A technician sees a rung true in online monitor but the contactor does not pull in. Most likely:",
        [
          "Output module, wiring, or contactor coil fault — logic is not the only link in the chain",
          "PLC scan is too fast to see",
          "Ladder logic cannot control contactors",
          "NC contacts cannot be used on safety devices",
        ],
        0,
        "Logic ON proves the processor commanded the output — verify output LED, terminal voltage, and contactor coil.",
        [
          "Online monitor already shows the bit state — scan speed is not why a physical coil stays de-energized.",
          "PLCs drive contactors through output modules daily — the gap is almost always field wiring or the coil, not logic capability.",
          "NC contacts on E-stops and guards are standard — they block the rung; that does not prevent contactor pull-in when permissives are met.",
        ]
      ),
      expertMcq(
        "One-shots (ONS) are used to:",
        [
          "Detect a single scan pulse on a rising input edge — useful for counting events",
          "Replace E-stop circuits",
          "Hold a motor running without seal-in",
          "Convert 480 VAC to 24 VDC",
        ],
        0,
        "ONS triggers one scan when an input transitions false-to-true, preventing repeat triggers while held.",
        [
          "E-stop is hardwired safety — ONS only shapes a single scan pulse in logic, not a safety chain.",
          "Motor hold uses seal-in aux around start — ONS pulses once and drops; it will not keep a contactor latched.",
          "Voltage conversion is power supply hardware — ONS is a logic instruction for edge detection.",
        ]
      ),
    ],
  },

  "plc-fundamentals/io-troubleshooting": {
    moduleSlug: "plc-fundamentals",
    lessonSlug: "io-troubleshooting",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Packaging Line 4: motor output O:2/0 is OFF but start is pressed. Best first check?",
        [
          "Walk input permissives on I:1 (E-stop, guard, photoeye, overload) before forcing outputs",
          "Force O:2/0 ON immediately to prove the motor works",
          "Edit ladder logic without measuring field devices",
          "Replace the VFD first",
        ],
        0,
        "Outputs depend on input chains. Forcing without checking NC safety and sensor states risks unexpected motion.",
        [
          "Forcing the output with a blocked photoeye or open E-stop can spin the conveyor while someone is in the pinch point.",
          "Logic edits without meter checks repeat the same call — online monitor shows which input bit is holding the rung false.",
          "VFD replacement is premature when O:2/0 never energizes — the output bit and contactor path fail before the drive.",
        ]
      ),
      expertMcq(
        "Input LED ON for photoeye I:1/5 while the path looks clear indicates:",
        [
          "Stuck-on input — misaligned sensor, debris, or wiring fault holding the bit TRUE",
          "Normal operation — LEDs should always be ON",
          "Output module failure",
          "Timer PRE set too low",
        ],
        0,
        "The LED reflects what the card sees. Stuck ON blocks NC interlocks even if operators believe the path is clear.",
        [
          "A clear path on a through-beam should drop the input — solid LED with an empty lane means stuck sensor or shorted input.",
          "Input module LEDs follow the input image — output module SF or fuse faults do not make an input LED stay ON.",
          "Timer preset affects delay logic downstream — it cannot hold an input terminal ON at the module LED.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "NC E-stop on I:1/2 reads TRUE in the PLC when:",
        [
          "The E-stop chain is open (pressed or wire fault) on the configured sinking/sourcing logic",
          "The motor is running at full speed",
          "The guard door is closed and latched",
          "The photoeye is clear",
        ],
        0,
        "Field NC devices map so a tripped/open condition sets the input bit and drops NC ladder contacts.",
        [
          "Motor speed does not change the E-stop input — pressed or open wire sets the bit per the configured logic.",
          "Closed guard is a separate input — E-stop TRUE means the safety chain opened, not that guards are latched.",
          "Clear photoeye affects I:1/5 — E-stop on I:1/2 reflects the mushroom or wire break, not beam status.",
        ]
      ),
      expertMcq(
        "Output LED ON but motor dead most often means:",
        [
          "Open contactor coil, blown fuse, or open overload — logic commanded ON but field path failed",
          "PLC program is in run mode incorrectly",
          "24 VDC and 480 VAC are the same circuit",
          "Input module failed",
        ],
        0,
        "Separate logic state from machine response — trace from output terminal to contactor coil.",
        [
          "Run mode is required for outputs — if the output LED is ON, the processor already passed logic in run.",
          "Control uses 24 VDC or 120 VAC coils; motor feeders are 480 VAC — measure each circuit separately at the starter.",
          "Input module failure drops permissives — here the output LED proves the command left the PLC; fault is after the output terminal.",
        ]
      ),
      expertMcq(
        "Which meter check is appropriate before forcing an input online?",
        [
          "Continuity/voltage on the field device with LOTO applied where required",
          "Megger the PLC backplane while powered",
          "Apply 480 VAC to the input terminal to wake it up",
          "Bypass guard switch to save time",
        ],
        0,
        "Measure field devices first; forcing without evidence is unsafe and hides root cause.",
        [
          "Meggering a live backplane damages modules — LOTO and measure the field device at its terminals.",
          "480 VAC on a 24 VDC input destroys the card — you should read 24 V or open circuit, never line voltage.",
          "Bypassing guards to force inputs risks motion with the door open — fix the interlock or apply LOTO first.",
        ]
      ),
      expertMcq(
        "After clearing a jam, start remains blocked with I:1/5 ON. Most likely fix:",
        [
          "Clear debris or realign photoeye so the blocked beam clears and I:1/5 drops FALSE",
          "Lower TON preset on the VFD",
          "Increase scan rate in the CPU",
          "Replace the output module because fuse is fine",
        ],
        0,
        "Stuck sensor inputs are field problems — alignment and beam path before logic changes.",
        [
          "VFD timer presets do not change a stuck input bit — the photoeye LED stays ON until the beam clears.",
          "Scan rate does not fix a sensor seeing a blocked beam — I:1/5 stays TRUE in monitor until field state changes.",
          "Output module swap does not drop an input stuck ON — wiggle the sensor bracket until the input LED goes off.",
        ]
      ),
    ],
  },

  "plc-fundamentals/timers-counters": {
    moduleSlug: "plc-fundamentals",
    lessonSlug: "timers-counters",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "A TON (Timer On Delay) .DN bit becomes TRUE when:",
        [
          "The rung has been true continuously long enough to reach the PRE preset",
          "The rung goes false for one scan",
          "The accumulator resets to zero while running",
          "The motor reaches full speed mechanically",
        ],
        0,
        "TON accumulates time while the rung is true; DN sets when ACC ≥ PRE.",
        [
          "Rung false stops accumulation — DN sets when time elapsed while the rung stayed true, not when it drops.",
          "ACC climbing toward PRE is what sets DN — resetting ACC to zero before PRE means DN stays false.",
          "Mechanical motor speed is unrelated — watch ACC and PRE in timer monitor, not RPM on the drive display.",
        ]
      ),
      expertMcq(
        "CTU (count up) typically increments when:",
        [
          "A rising edge occurs on the count input (one pulse per event)",
          "The output coil is forced ON",
          "The scan time changes",
          "480 VAC is applied to the counter terminal",
        ],
        0,
        "Counters count discrete events — often one-shotted inputs to avoid multiple counts per press.",
        [
          "Forcing an output does not pulse the counter input — CTU needs a rising edge on its count rung.",
          "Scan time changes affect loop speed, not count increments — each valid edge adds one to ACC.",
          "Counters are logic instructions — no 480 VAC lands on a CTU; field pulses come through input modules at 24 VDC.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "A 3-second TON on a conveyor start delay means the motor output energizes:",
        [
          "Three seconds after SAFE_RUN (and other interlocks) go true — not instantly on START",
          "Three seconds before any input is read",
          "Only when the operator holds START for three seconds continuously without seal-in",
          "Three milliseconds after power-up",
        ],
        0,
        "TON delays an action after permissives are met — common for staggered starts or clearance checks.",
        [
          "Inputs still scan every cycle — the delay starts after the TON rung goes true, not before inputs exist.",
          "Momentary start with seal-in releases the button — TON times from permissives true, not from holding START.",
          "Three seconds is 3000 ms preset, not 3 ms — watch ACC climb in monitor for three seconds after interlocks clear.",
        ]
      ),
      expertMcq(
        "If .ACC resets to zero every time the rung drops false, the timer is:",
        [
          "Behaving as a standard TON — non-retentive timing resets when input clears",
          "Broken — ACC should always climb",
          "A counter, not a timer",
          "Running in mechanical time, not scan time",
        ],
        0,
        "Non-retentive TON resets ACC when the rung opens. Retentive timers (RTO) retain ACC.",
        [
          "Resetting ACC when the rung opens is normal TON behavior — use RTO if you need accumulated time retained.",
          "CTU uses ACC for counts and .DN at preset — a TON still uses ACC for elapsed time, not part count.",
          "TON accumulates in scan-time increments — ACC still resets on rung false; that is not wall-clock mechanical timing.",
        ]
      ),
      expertMcq(
        "Preset (PRE) is best described as:",
        [
          "The target time or count value before the done bit sets",
          "The motor full-load amps",
          "The scan period in milliseconds only",
          "The number of rungs in the program",
        ],
        0,
        "PRE is the setpoint; ACC is elapsed time or current count.",
        [
          "Motor FLA is on the nameplate and drive parameters — timer PRE is the time/count setpoint in the instruction.",
          "Scan period is a CPU property — PRE is the timer or counter setpoint you enter in the instruction, not the scan ms.",
          "Program size does not define PRE — you set PRE in the TON or CTU block for that specific function.",
        ]
      ),
      expertMcq(
        "A counter preset of 100 with ACC at 99 increments to 100 on the next valid pulse. The .DN bit:",
        [
          "Sets when ACC reaches PRE — may trigger a batch complete or maintenance alert",
          "Never sets on CTU instructions",
          "Sets only when the PLC is in program mode",
          "Requires 480 VAC on the counter module",
        ],
        0,
        "Counter DN indicates the preset count was reached.",
        [
          "CTU .DN goes true when ACC ≥ PRE — at 100/100 you would see DN true in monitor.",
          "Counters operate in run mode during production — DN sets on the count, not when switched to program.",
          "CTU is a software instruction — counting uses input edges through I/O, not line voltage on a counter module.",
        ]
      ),
    ],
  },

  "plc-fundamentals/communication-faults": {
    moduleSlug: "plc-fundamentals",
    lessonSlug: "communication-faults",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "EtherNet/IP I/O fault LED flashing on a remote I/O adapter — first check?",
        [
          "Physical link: cable, switch port, IP configuration, and device status in network view",
          "Rewrite all ladder logic",
          "Replace the CPU before checking the cable",
          "Disable the safety PLC",
        ],
        0,
        "Comm faults are often physical layer or configuration — link lights, IP conflict, VLAN, or device faulted.",
        [
          "Logic can be perfect while comm fails — check link LED, ping, and IP in the module properties first.",
          "CPU swap is last resort — a flashing adapter fault LED usually means cable, switch, or wrong IP on that node.",
          "Safety PLC disable is never a comm fix — restore Ethernet path and module status before touching safety hardware.",
        ]
      ),
      expertMcq(
        "A PLC shows major fault on comm loss to a VFD. The motor is stopped because:",
        [
          "Interlocked logic or the drive faulted on loss of reference — control network loss is not safe to run blind",
          "EtherNet/IP automatically increases motor speed",
          "Scan rate doubled",
          "Inputs no longer exist",
        ],
        0,
        "Loss of comm to motion devices typically faults the drive or drops permissives — by design.",
        [
          "Lost comm drops speed reference or faults the drive — you would see zero speed or a comm fault code, not faster rotation.",
          "Scan rate is unrelated to Ethernet drop — the drive stops because it lost network command or permissive, not faster scans.",
          "Local I/O inputs still scan — comm loss removes network VFD control, not every input in the chassis.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Two devices with the same IP on the same VLAN will cause:",
        [
          "Intermittent comm faults and unpredictable connection drops",
          "Faster scan times",
          "Automatic IP healing without intervention",
          "Higher motor torque",
        ],
        0,
        "IP conflicts produce flapping connections — verify unique addresses and subnet mask.",
        [
          "Duplicate IPs cause ARP fights — HMI tags flicker and connections drop, not faster PLC scans.",
          "No device auto-renumbers — you must assign a unique IP in module config or on the switch DHCP scope.",
          "Motor torque comes from the drive and load — IP conflict only breaks Ethernet sessions.",
        ]
      ),
      expertMcq(
        "DeviceNet vs EtherNet/IP on legacy AB systems — technician should know:",
        [
          "DeviceNet is older fieldbus; EtherNet/IP is Ethernet-based CIP — diagnostics and tools differ",
          "They are identical wiring standards",
          "DeviceNet uses 480 VAC on the trunk",
          "EtherNet/IP cannot carry I/O data",
        ],
        0,
        "Know the network type to pick the right diagnostic tool and expected physical layer.",
        [
          "DeviceNet uses trunk/drop CAN-style cabling; EtherNet/IP uses RJ45 fiber/copper — different tools and LED patterns.",
          "DeviceNet trunk is 24 VDC fieldbus power — never 480 VAC on the blue trunk cable.",
          "Remote I/O and adapters move discrete and analog data over EtherNet/IP daily — I/O loss often traces to IP or cable.",
        ]
      ),
      expertMcq(
        "Switch port disabled by spanning tree during loop formation may present as:",
        [
          "Sudden loss of PLC to HMI comm on one path while link lights look fine elsewhere",
          "Higher PRE on timers",
          "Motor overload trip",
          "Input module blown fuse only",
        ],
        0,
        "Network loops cause STP to block ports — comm symptoms without PLC hardware failure.",
        [
          "Timer presets do not change when STP blocks a port — you lose ping to one subnet path while other links stay up.",
          "Overload trips are thermal on the starter — STP shows as intermittent HMI freeze, not heater trip.",
          "Input fuse blows affect one card — STP blocking looks like random comm loss with good PLC I/O LEDs.",
        ]
      ),
      expertMcq(
        "After replacing an EtherNet/IP module, you must:",
        [
          "Update/configure the module in the I/O tree and verify the correct IP/path before expecting I/O",
          "Only cycle power — configuration is automatic for any module type",
          "Force all outputs ON to test",
          "Remove E-stop wiring to test comm",
        ],
        0,
        "Module identity, firmware, and IP must match the project configuration.",
        [
          "Power cycle alone leaves wrong catalog number or IP — RSLogix/Studio shows faulted module until configured to match the project.",
          "Forcing outputs does not prove comm — verify module OK in tree and read input image from the new adapter first.",
          "E-stop removal is unsafe — comm proves out with ping and I/O tree status, not by defeating safety wiring.",
        ]
      ),
    ],
  },

  "plc-fundamentals/program-troubleshooting": {
    moduleSlug: "plc-fundamentals",
    lessonSlug: "program-troubleshooting",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Forcing an output ON in a running PLC should be done only when:",
        [
          "LOTO/risk assessment allows it and you understand downstream motion hazards",
          "Production pressure demands it without telling maintenance",
          "The HMI is offline",
          "You have not read the rung logic",
        ],
        0,
        "Forcing bypasses logic — permitted for isolated diagnosis with safety controls, never as a permanent fix.",
        [
          "Production pressure does not remove pinch points — undocumented forces have caused injuries on packaging lines.",
          "HMI offline does not change hazard — the output still drives real contactors and conveyors when forced.",
          "Forcing blind can energize a valve or motor with guards open — read the rung and interlocks first.",
        ]
      ),
      expertMcq(
        "Online rung monitoring shows a NC contact false (not passing) while field device looks normal. Next step?",
        [
          "Compare the input image bit to field meter readings — wiring or wrong NC/NO logic tag",
          "Delete the rung",
          "Increase PRE on all timers",
          "Assume the software is corrupt",
        ],
        0,
        "Online monitor proves bit state — reconcile with field device normal state and ladder contact type.",
        [
          "Deleting rungs removes interlocks — meter the input terminal and confirm NC vs NO tag matches field wiring.",
          "Timer preset changes do not fix a bit stuck wrong — input image must match physical device state.",
          "Corrupt software is rare — mismatched contact type or open wire shows bit true when field looks normal.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "A rung is true in logic but output never energizes. Tag mapping error could mean:",
        [
          "The coil address does not match the physical output module terminal configured in the project",
          "Scan is too fast to see outputs",
          "Timers cannot drive outputs",
          "NC contacts cannot block outputs",
        ],
        0,
        "Verify O: module/slot/bit matches hardware and field wiring.",
        [
          "Monitor shows the coil true — if the output LED on the module stays off, compare tag address to I/O configuration.",
          "Timers can enable rungs that drive coils — mapping error is wrong O: address, not timer limitation.",
          "NC contacts block rungs upstream — here the rung is true, so the coil tag likely points to the wrong terminal.",
        ]
      ),
      expertMcq(
        "Temporary program edits on line without documentation risk:",
        [
          "Unreproducible fixes and safety regressions on the next download from backup",
          "Faster scan only",
          "Automatic backup to cloud",
          "Elimination of overload trips",
        ],
        0,
        "Online edits must be tracked, backed up, and reviewed — undocumented changes cause repeat failures.",
        [
          "Online edits do not improve scan speed — they overwrite project memory and vanish on the next restore from backup.",
          "No cloud backup happens automatically — undocumented rung changes disappear when someone downloads the archived project.",
          "Overload trips are thermal on the starter — mystery online edits can remove interlocks but never fix heater trips.",
        ]
      ),
      expertMcq(
        "Comparing a working line's program to a faulted line is useful when:",
        [
          "Equipment is similar and you suspect a parameter or rung difference — not a substitute for field checks",
          "The motors are different voltages entirely",
          "You want to skip I/O checks",
          "Safety circuits are removed on the good line",
        ],
        0,
        "Logic diff is a tool alongside field verification — not instead of it.",
        [
          "Different motor voltage means parameter and wiring diffs — compare logic only when machines are truly alike.",
          "Program compare does not replace meter checks — a blown fuse still stops the motor with identical logic.",
          "A good line with safety removed is not a valid reference — diff against a compliant backup, then verify I/O in the field.",
        ]
      ),
      expertMcq(
        "When clearing forces and returning to normal, a technician should:",
        [
          "Verify machine state safe, remove forces, test normal sequence with operators",
          "Leave forces enabled for night shift",
          "Download a blank program",
          "Disable E-stop to test start",
        ],
        0,
        "Forces are diagnostic only — restore normal logic control before returning equipment to production.",
        [
          "Forces left ON bypass interlocks all shift — the next operator may start into an unsafe condition.",
          "Blank download wipes the machine program — remove forces and test; do not erase the project.",
          "E-stop disable is never a test method — clear forces, reset E-stop, and run the normal start sequence.",
        ]
      ),
    ],
  },

  "powerflex-vfd/vfd-fundamentals": {
    moduleSlug: "powerflex-vfd",
    lessonSlug: "vfd-fundamentals",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "DC bus capacitors on a PowerFlex drive can retain hazardous voltage after input power is removed for:",
        [
          "Several minutes — verify with a meter before touching internal components",
          "Only one second — safe to open immediately",
          "Never — capacitors discharge instantly when the display goes dark",
          "Until the HMI is rebooted",
        ],
        0,
        "DC bus capacitors hold lethal energy. Follow manufacturer wait time and measure before service.",
        [
          "One second is far too short — PowerFlex manuals specify minutes and a DC bus discharge procedure before cover removal.",
          "Display dark only means control power dropped — bus caps can still hold hundreds of volts until bled.",
          "HMI reboot does not discharge drive capacitors — measure DC+ to DC- or wait per the label inside the enclosure.",
        ]
      ),
      expertMcq(
        "A standard multimeter on VFD output leads (motor terminals) often reads incorrectly because:",
        [
          "PWM waveform is not true RMS — use drive display parameters or inverter-rated meter",
          "VFD outputs are always DC",
          "Motors do not receive voltage from VFDs",
          "480 VAC is not present on any drive",
        ],
        0,
        "PWM confuses average-reading meters — read parameters Pxxx or use proper test equipment.",
        [
          "VFD output is switched AC PWM — a cheap meter shows unstable or low readings, not steady DC.",
          "Motors run from the inverter output — zero reading on a DMM does not mean the motor is unpowered during run.",
          "480 VAC is at the drive input — output is variable frequency AC; use the drive's output voltage parameter instead.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Input voltage imbalance of 2% at the drive can cause approximately:",
        [
          "20% current imbalance in the motor — check all three phases before chasing overcurrent faults",
          "No effect on motor current",
          "Automatic phase correction inside every drive",
          "Higher DC bus by 200 V always",
        ],
        0,
        "Voltage imbalance translates to severe current imbalance and nuisance trips.",
        [
          "Even small supply imbalance shows up as unequal leg current on clamp meter — drives trip F006/F012 with no motor fault.",
          "Drives detect imbalance and fault — they do not auto-balance plant supply without fixing upstream phases.",
          "DC bus voltage follows rectified input — imbalance causes current problems, not a fixed +200 V rise every time.",
        ]
      ),
      expertMcq(
        "The PowerFlex control section converts:",
        [
          "AC input to controlled variable-frequency AC output for motor speed/torque control",
          "DC bus directly to 24 VDC field power only",
          "Mechanical belt speed to hydraulic pressure",
          "PLC scan time to motor RPM without electronics",
        ],
        0,
        "VFDs rectify to DC bus then invert PWM AC to the motor.",
        [
          "24 VDC for controls comes from a separate power supply — the drive inverts DC bus to motor AC, not panel control power.",
          "Belt speed is mechanical — the drive converts electrical power to controlled frequency for the motor.",
          "Motor speed requires rectifier and inverter stages — scan time in the PLC only sends speed reference over comms.",
        ]
      ),
      expertMcq(
        "Motor leads should be disconnected at the drive before meggering because:",
        [
          "Megger voltage destroys IGBT modules and DC bus capacitors",
          "Megger only works on PLC I/O",
          "VFD increases megger voltage automatically",
          "Motor insulation cannot be tested",
        ],
        0,
        "Insulation testers apply high DC — never through the drive terminals.",
        [
          "Megger applies high DC to motor windings — applied through the drive, that voltage hits IGBTs and destroys them.",
          "Drives do not boost megger output — the tester applies its own DC, which the inverter cannot block if connected.",
          "Motor insulation is tested motor-to-ground with leads isolated — disconnect at T1/T2/T3, not skip the test.",
        ]
      ),
      expertMcq(
        "If display shows output frequency but motor does not turn, check:",
        [
          "Enable permissives, mechanical load, contactor bypass, and actual output current",
          "Only the HMI color theme",
          "PLC rack temperature",
          "EtherNet/IP cable color",
        ],
        0,
        "Commanded frequency without torque/current suggests enable, load, or mechanical binding issues.",
        [
          "HMI theme does not affect rotation — check drive enable, output current on display, and whether a bypass contactor is open.",
          "Rack temperature does not stop a spinning motor when frequency commands are present — look at load and current.",
          "Cable color is not diagnostic — verify output amps rise above zero and the motor is mechanically free.",
        ]
      ),
    ],
  },

  "powerflex-vfd/fault-codes-diagnostics": {
    moduleSlug: "powerflex-vfd",
    lessonSlug: "fault-codes-diagnostics",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "PowerFlex F004 (Undervoltage) on acceleration often points to:",
        [
          "Weak DC bus under load — supply, capacitors, or aggressive accel parameter",
          "Correct motor rotation only",
          "HMI language setting",
          "Photoeye alignment",
        ],
        0,
        "Undervoltage trips when bus sags during load — check input, caps, and ramp/accel settings.",
        [
          "Rotation direction does not cause F004 — bus voltage sags on accel when supply or caps cannot support load.",
          "HMI language is unrelated — F004 appears on the drive keypad during heavy accel, not from display settings.",
          "Photoeye blocks logic permissives — F004 is DC bus undervoltage during torque demand, not sensor alignment.",
        ]
      ),
      expertMcq(
        "Before clearing a drive fault and restarting, you should:",
        [
          "Read fault queue, record code, identify root cause — not just fault reset repeatedly",
          "Hold fault reset until the motor overheats",
          "Bypass overload in the drive permanently",
          "Disable all safety inputs",
        ],
        0,
        "Fault reset without fixing cause leads to repeat trips and equipment damage.",
        [
          "Repeated reset without fixing cause overheats windings — read the fault queue and measure input before restart.",
          "Bypassing overload removes motor protection — fix the overcurrent cause, do not disable thermal limits.",
          "Safety inputs disabled risks motion with guards open — fault clear follows root cause, not safety defeat.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "F012 (HW OverCurrent) during run suggests investigation of:",
        [
          "Motor ground fault, shorted output, or sudden mechanical jam — not just parameter tweak",
          "PLC input fuse only",
          "24 VDC common loose",
          "Operator language preference",
        ],
        0,
        "Hard overcurrent is serious — mechanical binding, wiring fault, or failed output stage.",
        [
          "PLC input fuse loss drops permissives — F012 is drive hardware overcurrent with high output amps, not a 24 V fuse.",
          "Loose 24 V common causes I/O faults — F012 trips the drive during motor current spike, not from control common.",
          "Language on the HMI does not trip the drive — inspect motor leads, ground fault, and mechanical bind when F012 latches.",
        ]
      ),
      expertMcq(
        "Parameter P033 (Motor OL Current) should be set based on:",
        [
          "Motor nameplate FLA and service factor per manufacturer guidance",
          "Random guess for faster acceleration",
          "PLC scan rate",
          "Conveyor photoeye voltage",
        ],
        0,
        "Motor thermal protection depends on accurate nameplate current settings.",
        [
          "Guessing high FLA disables protection — set P033 from nameplate amps or nuisance trips and damage follow.",
          "Scan rate is PLC timing — motor thermal limit in the drive uses nameplate current, not scan ms.",
          "Photoeye voltage is 24 VDC field — P033 tracks motor FLA from the nameplate on the motor junction box.",
        ]
      ),
      expertMcq(
        "Fault history in the drive helps because:",
        [
          "Intermittent faults show pattern — time, speed, load — guiding field investigation",
          "It replaces meter measurements",
          "It clears automatically without reading",
          "It only logs HMI logins",
        ],
        0,
        "Trend faults with operating conditions to separate supply, load, and parameter issues.",
        [
          "History points where to meter — you still clamp input and output amps when the logged fault repeats.",
          "Fault queue persists until cleared — read it before reset or the pattern is lost on the next trip.",
          "Drive fault log records trips and timestamps — not operator HMI sessions.",
        ]
      ),
      expertMcq(
        "F006 (Phase Loss) indicates:",
        [
          "Missing or low input phase — check fuses, connections, and supply before resetting",
          "Successful three-phase balance",
          "Photoeye blocked",
          "Seal-in rung open",
        ],
        0,
        "Input phase loss reduces bus support — verify full three-phase at the drive.",
        [
          "Balanced three-phase would not trip F006 — measure leg-to-leg at drive input; one missing phase triggers this fault.",
          "Blocked photoeye drops PLC permissive — F006 is supply side at the drive line terminals.",
          "Seal-in affects starter logic — phase loss shows as drive fault with low DC bus support, not an open rung.",
        ]
      ),
    ],
  },

  "powerflex-vfd/common-failures": {
    moduleSlug: "powerflex-vfd",
    lessonSlug: "common-failures",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "DC bus capacitors aging past 7–10 years often present as:",
        [
          "Nuisance undervoltage trips under load or visible capacitor bulging",
          "Faster motor acceleration only",
          "Lower input current always",
          "PLC comm faults only",
        ],
        0,
        "Capacitor ESR rise causes bus sag — proactive replacement avoids unplanned downtime.",
        [
          "Weak caps cause sag and slower effective accel — trips on F004, not faster ramps.",
          "Input current often rises as caps fail to support load — do not expect lower line amps.",
          "Comm faults are Ethernet — aged DC caps show as undervoltage trips under torque, not only PLC timeouts.",
        ]
      ),
      expertMcq(
        "Repeated overcurrent trips at the same speed point suggests:",
        [
          "Mechanical binding, worn bearings, or process overload — not only drive failure",
          "Correct belt tension always",
          "Input voltage too high only",
          "Timer PRE too long",
        ],
        0,
        "Correlate trip speed/load with mechanical inspection.",
        [
          "Same speed trip every cycle points to bind or jam — belt tension should be checked, not assumed correct.",
          "High input voltage causes different faults — repeat trip at one speed/load is mechanical or process overload.",
          "Timer PRE affects PLC delay — drive overcurrent at fixed Hz repeats from load, not ladder timer preset.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Fan failure on a PowerFlex 525 enclosure can lead to:",
        [
          "Overtemperature faults and accelerated component aging",
          "Higher DC bus voltage permanently",
          "Automatic motor speed doubling",
          "Loss of ladder logic",
        ],
        0,
        "Cooling airflow is required — dirty or failed fans cause heat faults.",
        [
          "Overheat faults from blocked airflow — bus voltage does not permanently rise when the fan stops.",
          "Speed follows reference — overheating derates or faults the drive, it does not double motor Hz.",
          "PLC logic stays in the CPU — a dead drive fan causes OT faults on the drive, not program loss.",
        ]
      ),
      expertMcq(
        "Ground fault on motor leads may trip the drive with:",
        [
          "Ground fault or overcurrent class faults — megger motor and cable with drive isolated",
          "Only communication alarms",
          "No fault indication",
          "Higher photoeye sensitivity",
        ],
        0,
        "Isolate drive before insulation testing; fix grounding paths per code and manufacturer.",
        [
          "Ground fault trips the drive with fault code — not merely a comm warning on EtherNet/IP.",
          "Drive latches fault on ground current — keypad shows trip; it is never silent.",
          "Photoeye sensitivity is field I/O — ground fault on motor shows as drive GF/OC trip, not sensor gain.",
        ]
      ),
      expertMcq(
        "Parameter restore to factory defaults without backup risks:",
        [
          "Wrong motor nameplate values and unsafe accel/decel — document before changes",
          "Automatic tuning to any motor",
          "Elimination of all future faults",
          "PLC program deletion",
        ],
        0,
        "Parameters are application-specific — save known-good sets before experiments.",
        [
          "Factory defaults do not auto-learn your motor — FLA and accel wrong until you re-enter nameplate data.",
          "Defaults do not prevent faults — wrong accel can increase trips after restore.",
          "Drive restore does not touch PLC memory — you lose motor parameters, not ladder in the controller.",
        ]
      ),
      expertMcq(
        "Bearing failure in the motor often appears at the drive as:",
        [
          "Increased current ripple and vibration-related overcurrent or speed instability",
          "Lower DC bus only",
          "EtherNet/IP timeout only",
          "Input module SF LED",
        ],
        0,
        "Mechanical defects increase torque demand — electrical and mechanical state must agree.",
        [
          "Bad bearings load the motor — output current ripple rises and OC trips occur, not a steady low bus.",
          "Comm timeout is network — bearing noise and vibration show as current spikes on the drive display.",
          "Input SF is an I/O card fault — bearing damage is mechanical with rising motor amps at the drive.",
        ]
      ),
    ],
  },

  "motors-controls/motor-control-circuits": {
    moduleSlug: "motors-controls",
    lessonSlug: "motor-control-circuits",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "In a standard 120 VAC three-wire control circuit, the hold-in contact is:",
        [
          "Auxiliary NO on the contactor (seal-in around the start button)",
          "The overload NC in series with the start button only",
          "The motor main power contacts",
          "The PLC output module fuse",
        ],
        0,
        "Aux contact parallels the start PB to latch the contactor coil.",
        [
          "Overload NC opens on trip — seal-in is the aux NO that parallels the momentary start button.",
          "Main power contacts switch 480 VAC to the motor — coil hold uses the low-voltage aux across start.",
          "Output fuse protects the module — hold-in is the contactor's own auxiliary contact wired in parallel with start.",
        ]
      ),
      expertMcq(
        "Control power (120 VAC or 24 VDC) is separate from motor power because:",
        [
          "Contactors use low-voltage coils while motor circuits may be 480 VAC",
          "They must be the same voltage always",
          "Control power runs the motor directly without contactors",
          "PLC replaces all control transformers",
        ],
        0,
        "Control circuit energizes coils; power circuit switches motor feeders.",
        [
          "Coils are 120 V or 24 V while motors often run 480 VAC — separate circuits are normal, not a rule that they match.",
          "Motors need contactors or starters on the power circuit — control power only energizes the coil.",
          "PLCs interface to contactors — control transformers and control power still feed pushbuttons and coils.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Stop button is NC in the control circuit so that:",
        [
          "An open circuit or wire break defaults to safe — coil de-energizes",
          "The motor starts faster",
          "480 VAC reaches the pushbutton",
          "Overload is bypassed",
        ],
        0,
        "NC stop is fail-safe — open wire looks like stop pressed.",
        [
          "NC stop slows safe shutdown, not acceleration — open wire drops the coil same as pressing stop.",
          "Pushbuttons sit on control voltage — 480 VAC stays on the contactor load side, not the stop station.",
          "Overload NC stays in series — stop NC opens the chain; it does not shunt the overload.",
        ]
      ),
      expertMcq(
        "Contactor coil rated 120 VAC receives 95 VAC. Likely result:",
        [
          "Chatter or failure to pull in — check transformer tap and supply",
          "Higher motor RPM",
          "PLC scan fault",
          "Photoeye stuck on",
        ],
        0,
        "Undervoltage on coils causes chatter, overheating, or no pull-in.",
        [
          "Coil undervoltage causes buzz and no pull-in — motor RPM unchanged until contactor closes.",
          "PLC scan is unrelated — measure 120 V at coil terminals; low control voltage causes physical chatter.",
          "Photoeye blocks PLC logic — here the contactor hums on low AC coil voltage, not from I:1/5.",
        ]
      ),
      expertMcq(
        "Motor branch circuit protection (fuse or breaker) protects:",
        [
          "Feeder conductors and equipment from overcurrent — distinct from overload relay",
          "Only the control transformer",
          "PLC input modules only",
          "HMI backlight",
        ],
        0,
        "Short-circuit protection vs overload relay serve different time/current curves.",
        [
          "Branch breaker is on the motor feeder — control transformer has its own smaller fuse on the control circuit.",
          "PLC inputs have module fuses — branch protection is sized for motor circuit conductors, not I/O cards.",
          "HMI backlight is low voltage — branch breaker protects 480 V motor feeders from short-circuit fault current.",
        ]
      ),
      expertMcq(
        "A three-wire control circuit requires momentary start because:",
        [
          "Without seal-in aux, releasing start would drop the coil — aux maintains latch",
          "Motors cannot use contactors",
          "480 VAC controls the pushbutton lamp",
          "PLCs cannot interface to contactors",
        ],
        0,
        "Momentary devices with seal-in are standard motor control practice.",
        [
          "Motors use contactors daily — momentary start plus aux seal-in is why release of start does not drop out.",
          "Pushbutton lamp may be 120 V on control — 480 VAC is on motor side, not the start button.",
          "PLCs drive contactor coils through outputs — three-wire control is hardwired aux seal-in, compatible with PLC interlocks.",
        ]
      ),
    ],
  },

  "motors-controls/starter-troubleshooting": {
    moduleSlug: "motors-controls",
    lessonSlug: "starter-troubleshooting",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Contactor chatters (buzzes, no solid pull-in). First electrical check?",
        [
          "Coil voltage under load and control circuit connections — low voltage is common",
          "Megger the PLC",
          "Force 480 VAC on the coil",
          "Replace motor bearings first",
        ],
        0,
        "Chatter = inadequate coil drive or loose control wire — measure voltage at coil terminals.",
        [
          "PLC megger does not explain coil buzz — clamp meter and voltmeter at A1/A2 while trying to pull in.",
          "Coils are 120 V or 24 V — 480 VAC on the coil destroys it and does not fix chatter.",
          "Bearings cause load noise when running — chatter at pull-in is low coil voltage or loose control wire.",
        ]
      ),
      expertMcq(
        "Main contacts welded closed on a contactor means:",
        [
          "Motor may run uncontrolled — isolate power, replace contactor, find why coil stayed energized or overcurrent occurred",
          "Normal wear — ignore",
          "Overload needs higher setting only",
          "Start button stuck is irrelevant",
        ],
        0,
        "Welded contacts are a safety hazard — mechanical isolation required.",
        [
          "Welded contacts can leave motor connected with coil dropped — LOTO and replace; never treat as normal wear.",
          "Higher overload setting does not fix welded mains — find why contacts welded, often severe overcurrent or stuck coil.",
          "Stuck start or welded aux can hold power — investigate why mains welded, including stuck pushbutton or PLC force.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Humming contactor, no aux change — suspect:",
        [
          "Partial coil voltage, mechanical obstruction in pole faces, or shaded pole damage",
          "Successful seal-in always",
          "Correct three-phase at motor",
          "PLC forcing outputs off",
        ],
        0,
        "Distinguish electrical chatter from mechanical binding on the contactor.",
        [
          "Seal-in pulled in shows aux toggled — hum with no aux change means coil not fully energizing or pole faces stuck.",
          "Motor three-phase can be fine while coil chatters on low control voltage — measure coil first, not motor legs.",
          "PLC forcing off drops output — here contactor hums physically with coil partially energized, not from logic force.",
        ]
      ),
      expertMcq(
        "Overload tripped — NC aux on overload opens control circuit. Reset requires:",
        [
          "Allowing bimetallic cool-down and pressing overload reset after confirming cause",
          "Bypassing overload permanently",
          "Forcing 480 VAC on control circuit",
          "Removing motor leads only",
        ],
        0,
        "Find overcurrent cause before reset — overload protects motor, not short circuits.",
        [
          "Bypass removes motor protection — cool, find jam or FLA cause, then press reset on the overload body.",
          "480 VAC on control destroys coil — reset button on overload after confirming why it tripped.",
          "Removing motor leads does not reset thermal overload — wait for cool-down and reset the overload aux.",
        ]
      ),
      expertMcq(
        "Single-phasing on a running three-phase motor may show:",
        [
          "High current on remaining legs, hum, and eventual thermal trip",
          "Lower current on all legs equally",
          "Faster belt speed",
          "Only communication faults",
        ],
        0,
        "Lost phase causes severe imbalance and motor heating — check fuses and connections.",
        [
          "One open phase raises current on the two remaining legs — clamp each leg; equal low current is not single-phase.",
          "Lost phase slows or stalls rotor — belt does not speed up; motor hums hot until overload trips.",
          "Comm faults are network — single-phase shows as loud motor hum and high amps on two legs, not Ethernet drop.",
        ]
      ),
      expertMcq(
        "Aux contact verification when seal-in fails:",
        [
          "Measure continuity on aux NO when contactor is manually pressed — aux must switch with main",
          "Assume aux is internal to PLC only",
          "Skip aux — force coil with jumper permanently",
          "Use photoeye to seal-in",
        ],
        0,
        "Seal-in depends on working aux contacts tied to contactor motion.",
        [
          "Seal-in aux is on the contactor — press plunger by hand and ohm the NO aux; PLC does not replace it.",
          "Permanent jumper bypasses stop safety — fix or replace aux that does not close when contactor pulls in.",
          "Photoeye is an input interlock — three-wire seal-in requires contactor auxiliary wired parallel to start.",
        ]
      ),
    ],
  },

  "motors-controls/overload-protection": {
    moduleSlug: "motors-controls",
    lessonSlug: "overload-protection",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Overload relay class (e.g., Class 10) defines:",
        [
          "Trip time curve relative to motor locked-rotor current — not instantaneous short-circuit protection",
          "Motor horsepower only",
          "PLC scan interval",
          "Control transformer VA",
        ],
        0,
        "Overload is thermal/time-based; fuses/breakers handle shorts.",
        [
          "HP helps pick heater range — class number defines trip time vs locked-rotor multiple, not HP alone.",
          "Scan interval is PLC timing — overload class is thermal trip curve for the motor heaters.",
          "Transformer VA feeds control circuit — overload class describes how fast heaters trip under sustained overcurrent.",
        ]
      ),
      expertMcq(
        "Setting overload dial to motor nameplate FLA is important because:",
        [
          "Trip point tracks allowable continuous current for that motor",
          "It increases motor speed",
          "It disables short-circuit protection",
          "It converts 480 VAC to 24 VDC",
        ],
        0,
        "FLA-based setting prevents chronic overheating without nuisance on inrush.",
        [
          "Overload setting does not change RPM — FLA dial matches heater trip to nameplate continuous amps.",
          "Branch breaker still clears shorts — overload dial only adjusts thermal trip, not breaker protection.",
          "Voltage conversion is transformer or power supply — FLA dial is motor current trip setting only.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Difference between overload trip and branch breaker trip:",
        [
          "Overload: sustained overcurrent on motor; breaker: high fault current on circuit",
          "They are identical devices",
          "Breaker protects only control circuit",
          "Overload clears short circuits instantly",
        ],
        0,
        "Coordination requires both — different thresholds and time curves.",
        [
          "Breaker clears bolted faults fast — overload waits on thermal curve for motor overcurrent, different devices.",
          "Motor branch breaker is on 480 V feeder — control circuit has separate small fuse, not the branch breaker role.",
          "Overload is slow thermal — short circuit blows branch fuse or trips breaker instantly, not the overload alone.",
        ]
      ),
      expertMcq(
        "Ambient temperature affects thermal overload because:",
        [
          "Higher ambient reduces cooling margin — may need lower heater class or adjustment",
          "Ambient has no effect on bimetallic relays",
          "Only hydraulic systems care about ambient",
          "PLC inputs drift with ambient only",
        ],
        0,
        "Motor and heater ambient derating matters in hot enclosures.",
        [
          "Hot MCC rooms trip overloads sooner — bimetallic heaters sense ambient; derate or use lower class in heat.",
          "Hydraulic temperature is separate — motor starter heaters in a hot enclosure nuisance-trip without derating.",
          "PLC input drift is electronic — thermal overload trip changes with enclosure temperature around the starter.",
        ]
      ),
      expertMcq(
        "Repeated nuisance overload trips at startup may indicate:",
        [
          "Heater class too aggressive, mechanical jam, or undervoltage — not just bad luck",
          "Correct FLA always",
          "Need to bypass overload for production",
          "Timer PRE too long",
        ],
        0,
        "Correlate trip timing with inrush vs running current measurements.",
        [
          "Wrong class or jam raises startup current — verify FLA dial, class, and mechanical free rotation before blaming luck.",
          "Bypass removes motor protection — measure startup amps and check Class 10 vs 20 if nuisance at every start.",
          "Timer PRE is PLC delay — overload trips on motor current, not because a TON preset is long.",
        ]
      ),
      expertMcq(
        "Electronic overload in a VFD replaces:",
        [
          "Thermal heater function using measured current — parameters must match motor data",
          "All branch circuit protection",
          "E-stop requirements",
          "Input module fuses",
        ],
        0,
        "Drive motor protection still needs correct nameplate programming.",
        [
          "Branch breaker still required — drive electronic OL replaces heaters, not short-circuit protection.",
          "E-stop stays hardwired — drive thermal uses P033 and measured amps, not safety chain replacement.",
          "Input fuses protect I/O modules — VFD motor OL is programmed from nameplate, unrelated to PLC card fuses.",
        ]
      ),
    ],
  },

  "safety-systems/estop-circuits": {
    moduleSlug: "safety-systems",
    lessonSlug: "estop-circuits",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "E-stop function per ISO/IEC standard practice is:",
        [
          "Remove motion-causing energy quickly — not a substitute for lockout for service",
          "Reset production schedules",
          "Bypass guard doors",
          "Increase motor speed to safe state",
        ],
        0,
        "E-stop is emergency stop of hazardous motion — service work still needs LOTO.",
        [
          "E-stop stops motion — it does not reschedule production; service still needs LOTO after E-stop.",
          "E-stop does not replace guards — it cuts hazardous motion when pressed; guards remain required.",
          "E-stop removes power or permissives — it never increases speed; restart is manual after reset.",
        ]
      ),
      expertMcq(
        "E-stop devices use NC contacts because:",
        [
          "Open circuit on press or wire break de-energizes safety chain — fail-safe",
          "NC is cheaper only",
          "PLC requires NO E-stops",
          "480 VAC needs NC",
        ],
        0,
        "NC chains default safe on open circuit.",
        [
          "Cost is not the reason — wire break on NC chain drops out same as press, failing safe.",
          "E-stops are NC in the field — PLC may map bit either way, but field device is NC for fail-safe.",
          "E-stop uses control voltage — NC opens chain on press; 480 VAC is not on the mushroom button contacts.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Category assessment for machine E-stop depends on:",
        [
          "Risk analysis, stop performance, and whether safety relays/PLd hardware are required",
          "Wire color only",
          "HMI brand",
          "Motor RPM",
        ],
        0,
        "Safety category follows risk — not one-size-fits-all wiring.",
        [
          "Wire color is not category — risk assessment and stop time determine Category 0/1/2 and safety relay need.",
          "HMI brand does not set safety performance — category comes from risk and stopping performance analysis.",
          "Motor RPM alone does not pick safety architecture — hazard analysis drives category and hardware choice.",
        ]
      ),
      expertMcq(
        "After E-stop press, restart typically requires:",
        [
          "Reset/unlatch E-stop, clear cause, then intentional start — not automatic resume",
          "Automatic restart when fault clears",
          "Bypass guard to test",
          "Force all outputs ON",
        ],
        0,
        "Manual reset prevents restart into an unsafe condition.",
        [
          "Automatic resume after E-stop is unsafe — twist reset on mushroom, then deliberate start when area is clear.",
          "Bypassing guard defeats interlock — reset E-stop and close guards before normal start, never force outputs.",
          "Forcing outputs skips safety — unlatch E-stop, clear cause, run normal start sequence with guards closed.",
        ]
      ),
      expertMcq(
        "Mixing standard PLC I/O with safety-rated E-stop without analysis:",
        [
          "May not meet required performance level — use appropriate safety hardware per risk assessment",
          "Is always acceptable on every machine",
          "Eliminates need for guards",
          "Increases scan rate",
        ],
        0,
        "Standard I/O is not a safety PLC — risk assessment drives architecture.",
        [
          "Standard I/O is not SIL-rated — risk assessment may require safety relay or safety PLC, not generic input card.",
          "Guards still required — standard I/O E-stop may not meet PLd without proper safety hardware analysis.",
          "Scan rate does not create safety performance — category needs safety-rated stop chain, not faster PLC scans.",
        ]
      ),
      expertMcq(
        "E-stop wiring fault (open wire) should present as:",
        [
          "Machine cannot start — same as pressed E-stop on NC chain",
          "Faster production",
          "Motor runs faster",
          "Only HMI alarm with motion continuing",
        ],
        0,
        "Fail-safe wiring opens the safety chain on wire break.",
        [
          "Open wire on NC chain drops permissives — machine stays stopped until wire repaired, same as pressed E-stop.",
          "Wire break does not speed production — start circuit open means coil never latches.",
          "Fail-safe wiring stops motion — you would not see only an HMI message with motor still running on NC chain.",
        ]
      ),
    ],
  },

  "sensors-instrumentation/proximity-photoelectric": {
    moduleSlug: "sensors-instrumentation",
    lessonSlug: "proximity-photoelectric",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "PNP sourcing sensor wired to sinking PLC input — sensor ON means:",
        [
          "Input bit TRUE when target detected (with correct common wiring)",
          "Input always FALSE when detecting",
          "480 VAC on the input terminal",
          "Output coil energizes automatically",
        ],
        0,
        "Know PNP vs NPN and sinking vs sourcing — wrong pairing gives inverted or dead input.",
        [
          "Correct PNP to sinking gives TRUE when detecting — FALSE always would mean wrong polarity or common.",
          "Sensor inputs are 24 VDC — measure terminal, never 480 VAC on the input card.",
          "Sensor toggles input bit — output coil energizes only when ladder logic rung is true, not automatically.",
        ]
      ),
      expertMcq(
        "Photoeye blocked beam should typically:",
        [
          "Change input state per sensor logic (NO/NC) — verify with LED and object present/absent",
          "Always read OFF regardless of beam",
          "Trip motor overload directly",
          "Set DC bus to 678 V",
        ],
        0,
        "Blocked vs clear depends on sensor mode — document normal state for the application.",
        [
          "Blocked vs clear depends on light-on/dark-on mode — check sensor LED with box in and out of beam.",
          "Photoeye feeds PLC input — overload trips from motor heaters, not directly from the sensor beam.",
          "DC bus is inside the drive — photoeye is 24 V field; blocked beam toggles input bit only.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Inductive proximity detects:",
        [
          "Metal targets at short range — not plastic or glass reliably",
          "Any material the same distance",
          "Only temperature",
          "480 VAC phase loss",
        ],
        0,
        "Inductive = ferrous/metal — capacitive or photoelectric for other materials.",
        [
          "Plastic and glass do not trigger inductive prox reliably — use capacitive or photoeye for non-metal.",
          "Inductive senses metal eddy loss — temperature is RTD/thermocouple domain, not prox switching.",
          "Phase loss is supply side — prox detects metal target presence at millimeters, not voltage imbalance.",
        ]
      ),
      expertMcq(
        "Diffuse photoelectric vs through-beam:",
        [
          "Diffuse reflects off target; through-beam needs aligned sender and receiver across path",
          "They are identical",
          "Diffuse requires 480 VAC",
          "Through-beam only senses metal",
        ],
        0,
        "Application and alignment differ — wrong type causes false trips.",
        [
          "Through-beam needs sender and receiver aligned — diffuse uses one housing and reflector or target surface.",
          "Both use 24 VDC field power — neither requires 480 VAC at the sensor.",
          "Through-beam sees any object breaking the beam — metal, cardboard, or hand; not metal-only.",
        ]
      ),
      expertMcq(
        "Sensor cable run near VFD output wires may cause:",
        [
          "Noise and false triggers — separate shielded sensor cables from power conductors",
          "Higher sensor range only",
          "Automatic PLC scan increase",
          "Elimination of overload",
        ],
        0,
        "EMI from PWM motor cables couples into sensor leads — routing matters.",
        [
          "EMI causes false trips and flicker — coupling reduces reliability; it does not increase sensing range.",
          "Scan rate is configured in CPU — noise causes bad input bits, not automatic scan change.",
          "Overload is thermal on starter — noisy prox cable may flash input bit, not disable overload.",
        ]
      ),
      expertMcq(
        "On Packaging Line 4, photoeye I:1/5 TRUE means blocked path in ladder NC interlock PE CLEAR because:",
        [
          "Blocked = input ON, NC contact opens, motor permissive drops",
          "TRUE always means clear path",
          "Photoeyes are wired to 480 VAC",
          "PLC outputs control the beam",
        ],
        0,
        "Align field state, input bit, and ladder contact type for troubleshooting.",
        [
          "On this line blocked sets bit TRUE — NC PE CLEAR opens when TRUE, dropping permissive; clear path drops bit.",
          "Photoeye field wiring is 24 VDC — 480 VAC is motor feeder, not sensor supply.",
          "Sensor emitter/receiver is field powered — PLC reads the input result; it does not generate the beam.",
        ]
      ),
    ],
  },

  "print-reading/ladder-diagram-conventions": {
    moduleSlug: "print-reading",
    lessonSlug: "ladder-diagram-conventions",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "On a ladder print, power flow is read:",
        [
          "Left to right on each rung, top to bottom between rungs",
          "Right to left only",
          "From outputs to inputs",
          "Only in the HMI",
        ],
        0,
        "Ladder convention mimics relay logic — left rail to right rail.",
        [
          "Relay ladder tradition reads left rail to right — outputs on the right side of the rung.",
          "Prints document input-to-output flow — troubleshoot from left-side contacts toward coils on the right.",
          "HMI shows runtime state — prints are paper/PDF ladder with left-to-right convention.",
        ]
      ),
      expertMcq(
        "Device tag CR1 on a print usually means:",
        [
          "Control relay or contactor representation — cross-reference to device list",
          "Capacitor resistor",
          "Communication register only",
          "480 VAC main breaker",
        ],
        0,
        "Use the drawing index — tags tie schematic to physical devices.",
        [
          "CR is control relay on most prints — check device index, not capacitor-resistor.",
          "Register addresses live in PLC — CR1 on a ladder print is a relay/contactor tag on the drawing index.",
          "Main breaker tags are often MS or CB — CR1 is control relay in the schematic device list.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "NC contact symbol on a ladder print with bit false means:",
        [
          "Contact passes power — matches PLC NC instruction when input bit is 0",
          "Contact always open",
          "Motor is running",
          "480 VAC present on coil",
        ],
        0,
        "Print symbols align with PLC instruction types when documented correctly.",
        [
          "NC symbol passes when bit is false — always open would be NO symbol behavior.",
          "Motor run state is on the coil downstream — NC contact state follows the input bit, not motor RPM.",
          "480 VAC is on power diagram — control print NC at bit false passes control continuity, not line voltage proof.",
        ]
      ),
      expertMcq(
        "Cross-referencing coil M1 to power diagram shows:",
        [
          "Which contactor and motor terminals implement the logic coil",
          "Only HMI colors",
          "PLC firmware version",
          "EtherNet/IP VLAN",
        ],
        0,
        "Multi-page prints link control logic to power devices via cross-ref.",
        [
          "Cross-ref jumps to power sheet — shows which contactor poles feed the motor, not HMI graphics.",
          "Firmware is in the controller — cross-ref ties M1 coil to line diagram page and terminal numbers.",
          "VLAN is network docs — M1 cross-ref links control schematic to motor feeder, not Ethernet config.",
        ]
      ),
      expertMcq(
        "Ladder print revision mismatch with field wiring risks:",
        [
          "Troubleshooting wrong terminals — verify sheet revision on the panel door",
          "Faster repairs always",
          "Automatic PLC updates",
          "Higher motor FLA",
        ],
        0,
        "Always confirm drawing revision matches as-built before tracing circuits.",
        [
          "Wrong revision sends you to old terminal numbers — check rev sticker inside door before tracing wires.",
          "PLC program does not auto-update from paper — mismatch means human error tracing the wrong rung.",
          "FLA is on motor nameplate — print revision mismatch mislabels wires, not motor amps.",
        ]
      ),
      expertMcq(
        "Overload contact OL on print in series with coil means:",
        [
          "Thermal overload opens control circuit to drop coil on overcurrent",
          "Short-circuit protection for the building",
          "PLC input only — never mechanical",
          "Photoeye interlock",
        ],
        0,
        "OL is in the control circuit — opens on sustained motor overcurrent.",
        [
          "OL is thermal in series with coil — branch breaker handles bolted faults, not the OL auxiliary contact role.",
          "OL aux is a physical NC on the overload body — it opens control power, not a PLC input-only symbol.",
          "Photoeye is a separate input device — OL on print is overload NC opening the coil circuit on heat trip.",
        ]
      ),
    ],
  },

};

export const CURATED_BATCH_1_KEYS = Object.keys(
  CURATED_LESSON_ASSESSMENTS_BATCH1
) as CuratedBatch1Key[];
