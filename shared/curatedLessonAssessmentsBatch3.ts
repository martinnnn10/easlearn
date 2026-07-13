/**
 * Credibility audit batch 3 — electrical/digital/semiconductor fundamentals,
 * fluid power schematics & diagnostics, power distribution, alignment, PM design.
 */
import type { CuratedLessonAssessment } from "./curatedLessonAssessmentTypes";
import { expertMcq } from "./curatedMcqHelpers";

export const CURATED_LESSON_ASSESSMENTS_BATCH3: Record<string, CuratedLessonAssessment> = {
  "electrical-fundamentals/ohms-law-power": {
    moduleSlug: "electrical-fundamentals",
    lessonSlug: "ohms-law-power",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "A 480 V motor branch draws 22.5 A on a 20 A breaker. Using P ≈ V × I × √3 for three-phase, approximate real power:",
        [
          "≈ 15.9 kW — circuit is overloaded before the breaker trips",
          "≈ 10.8 kW — well within breaker rating",
          "480 W — single-phase calculation only",
          "0 kW — voltage present means no power",
        ],
        0,
        "P ≈ 480 × 22.5 × 1.73 ≈ 18.7 kVA class load; sustained 22.5 A on a 20 A device confirms overload.",
        [
          "22.5 A exceeds 20 A rating — the load is not within rating even if voltage looks normal.",
          "Three-phase plant loads need the √3 factor — 480 × 22.5 alone understates motor branch power.",
          "Current flow with voltage always converts energy — 0 kW would require 0 A.",
        ]
      ),
      expertMcq(
        "Motor terminals read 478 V but clamp meter shows 0 A while commanded to run. Winding resistance reads OL (open). Best diagnosis:",
        [
          "Open winding — voltage is present but no current path through the motor",
          "Normal locked-rotor starting — always 0 A at start",
          "Meter on AC setting is wrong — switch to capacitance",
          "Low voltage — 478 V is too low to develop current",
        ],
        0,
        "Ohm's Law: voltage with infinite resistance (open winding) yields no current.",
        [
          "Locked rotor draws high current, not zero — 0 A with voltage present points to an open.",
          "Capacitance mode does not validate a de-energized winding resistance check.",
          "478 V is essentially nominal — the open winding prevents current, not the voltage level.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Loose termination measuring 0.5 Ω at 15 A dissipates roughly:",
        [
          "112 W of heat — enough to damage insulation over time",
          "7.5 W — negligible at any current",
          "0 W — power only exists in motors",
          "7,500 kW — utility-scale heating",
        ],
        0,
        "P = I²R = 15² × 0.5 = 112.5 W concentrated at the connection.",
        [
          "I²R heating scales with the square of current — 15 A through half an ohm is serious heat.",
          "Any resistance with current converts electrical energy to heat per P = I²R.",
          "That magnitude would require far higher V × I — not a single bad termination.",
        ]
      ),
      expertMcq(
        "Ohm's Law relationship for troubleshooting an unknown resistance is:",
        [
          "R = V / I",
          "R = V × I",
          "R = I / V",
          "R = P × V",
        ],
        0,
        "Rearrange V = I × R to solve resistance from measured voltage and current.",
        [
          "V × I is power (P), not resistance.",
          "I / V inverts the relationship — resistance rises with voltage for a fixed current.",
          "P × V is not a standard Ohm's Law form.",
        ]
      ),
      expertMcq(
        "A 240 V heater element measures 20 Ω. Expected power is closest to:",
        [
          "2,880 W",
          "240 W",
          "12 W",
          "4,800 W",
        ],
        0,
        "P = V² / R = 240² / 20 = 2,880 W.",
        [
          "P = V²/R, not V alone — 240 V across 20 Ω is kilowatt-class heat.",
          "That would imply near-zero current — 20 Ω at 240 V draws 12 A.",
          "4,800 W would require half the measured resistance or higher voltage.",
        ]
      ),
      expertMcq(
        "You measure full source voltage at the motor starter line side but 0 V at the motor with the contactor closed. First inference using Ohm's Law:",
        [
          "High-resistance or open path between those points — current cannot reach the load",
          "Motor is running normally — 0 V is expected across a load",
          "Clamp meter should read FLA — always trust the motor nameplate",
          "Increase supply voltage until current appears",
        ],
        0,
        "Full voltage upstream with 0 V at the load indicates an open or high-R series element.",
        [
          "A running motor shows voltage at terminals and draws current — 0 V means no potential at the load.",
          "Nameplate FLA assumes a complete circuit — verify voltage drop path first.",
          "Raising voltage on a faulted circuit risks arc flash and does not fix an open.",
        ]
      ),
    ],
  },

  "electrical-fundamentals/kirchhoffs-laws": {
    moduleSlug: "electrical-fundamentals",
    lessonSlug: "kirchhoffs-laws",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Kirchhoff's Voltage Law (KVL) in a 120 V control circuit means:",
        [
          "Source voltage equals the sum of voltage drops around the closed loop",
          "Current is identical in every parallel branch",
          "Power factor must be unity at the coil",
          "Ground current always equals line current",
        ],
        0,
        "Walk the series path: all drops must add to the 120 V supply.",
        [
          "Equal current in parallel branches is KCL, not KVL.",
          "Power factor affects AC power calculations, not the loop voltage balance rule.",
          "Ground current relationships involve fault paths — not the KVL loop sum.",
        ]
      ),
      expertMcq(
        "You read 120 V across the overload relay NC contacts and 0 V across the contactor coil in the same series string. The fault is:",
        [
          "Open OL contacts — full source voltage appears across the open device",
          "Shorted OL contacts — they should read 120 V when good",
          "Coil is good because it reads 0 V",
          "Meter leads reversed — always swap and ignore",
        ],
        0,
        "Voltage drop troubleshooting: source voltage across a series device means it is open.",
        [
          "A closed good contact drops near 0 V — 120 V there means open.",
          "0 V at the coil confirms no potential difference — coil is de-energized because OL is open.",
          "Consistent readings across multiple points confirm the OL is the open element.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "MCC bus clamp reads 45 A. Branch clamps read 15.2 A, 19.8 A, and 10.1 A. KCL indicates:",
        [
          "Branch currents sum to bus current — no unexplained 10 A leakage path",
          "10 A is missing — certain ground fault on the bus",
          "KCL does not apply inside an MCC",
          "Only the largest branch matters for KCL",
        ],
        0,
        "45.1 A branches ≈ 45 A feed — junction balance holds.",
        [
          "A 10 A gap would suggest leakage, but here the branches account for the feed.",
          "KCL applies at every electrical junction, including MCC buses.",
          "All branches contribute to the total — not just one motor.",
        ]
      ),
      expertMcq(
        "Bus feed 45 A but measured branches total only 35 A. Most likely KCL interpretation:",
        [
          "10 A flowing on an unintended path — investigate ground fault or unmeasured branch",
          "KCL is wrong — current can disappear in transformers",
          "Meter accuracy always explains the gap — ignore it",
          "Branches must be opened one at a time until the math works",
        ],
        0,
        "Missing amperes at a node imply another current path not in your branch sum.",
        [
          "Current is conserved — it does not vanish inside a transformer without a path.",
          "Repeated imbalance warrants investigation — not dismissal as meter error.",
          "Opening branches is diagnostic, but the KCL mismatch itself signals a hidden path.",
        ]
      ),
      expertMcq(
        "A good closed fuse in a series control circuit should measure across it:",
        [
          "Near 0 V — current flows with minimal drop",
          "Full 120 V — proves the fuse is conducting",
          "60 V — half the source always",
          "OL on the meter — fuses are infinite resistance when good",
        ],
        0,
        "Low drop across a closed protective device confirms it is passing current.",
        [
          "Full voltage across a series device means open — blown fuse reads 120 V across it.",
          "Half voltage is not a rule for fuses — it indicates a different fault location.",
          "Good fuses read low ohms, not OL — OL means blown or open.",
        ]
      ),
      expertMcq(
        "Voltage drop troubleshooting on an energized series string starts by:",
        [
          "Confirming source voltage, then measuring across each series component toward the load",
          "Meggering every device before applying power",
          "Replacing the coil first because it is the load",
          "Measuring only at the load — source is assumed good",
        ],
        0,
        "KVL method: source → each drop → find the component with full voltage across it.",
        [
          "Megger requires de-energized circuits — this technique is for live voltage drop.",
          "The open is often an interposing device, not the coil — measure the chain.",
          "Source must be verified — a partial loss upstream skews every downstream reading.",
        ]
      ),
    ],
  },

  "electrical-fundamentals/ac-dc-theory": {
    moduleSlug: "electrical-fundamentals",
    lessonSlug: "ac-dc-theory",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "480 V AC RMS input to a VFD rectifier produces a DC bus closest to:",
        [
          "≈ 679 V DC — peak value is 1.414 × RMS",
          "480 V DC — RMS equals DC magnitude",
          "240 V DC — half of line voltage",
          "24 V DC — control power only",
        ],
        0,
        "Rectifiers charge capacitors to peak AC voltage: 480 × 1.414 ≈ 679 V.",
        [
          "RMS is the heating equivalent — the DC bus charges to peak, not RMS.",
          "Half line voltage is not the three-phase rectified peak relationship.",
          "24 V is control power — unrelated to the main DC bus magnitude.",
        ]
      ),
      expertMcq(
        "PLC I/O, safety relays, and most control circuits on the plant floor use:",
        [
          "24 V DC with defined polarity",
          "480 V AC directly on every input card",
          "4-20 mA as the only control voltage",
          "120 V DC battery bus on every starter",
        ],
        0,
        "Control systems standardize on 24 V DC supplies — polarity matters for sinking/sourcing.",
        [
          "480 V AC feeds power circuits — not typical PLC input voltage.",
          "4-20 mA is a signal standard, not the rack supply voltage.",
          "120 V DC exists in some UPS systems — not universal control power.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "North American industrial AC distribution is commonly:",
        [
          "60 Hz three-phase at 480 V (and 208/120 V systems)",
          "50 Hz only with no three-phase available",
          "400 Hz aircraft power on every MCC",
          "DC-only distribution above 1 kV in all plants",
        ],
        0,
        "60 Hz, 480 V three-phase is the dominant US industrial motor voltage.",
        [
          "50 Hz is international — North America standard is 60 Hz.",
          "400 Hz is specialized — not general plant distribution.",
          "AC distribution dominates motor loads — DC at scale is exception, not rule.",
        ]
      ),
      expertMcq(
        "A technician measures a 24 V DC sensor circuit with the meter on V AC. Likely reading:",
        [
          "Near 0 V or misleading — wrong meter mode for DC",
          "Exactly 24 V AC — DC always reads on AC range",
          "48 V — AC doubles DC automatically",
          "679 V — same as VFD bus",
        ],
        0,
        "AC mode filters/averages away steady DC — readings are unreliable.",
        [
          "DC on AC range does not faithfully display 24 V — mode must match the circuit.",
          "There is no automatic doubling — wrong mode gives wrong results.",
          "679 V is VFD DC bus territory — unrelated to a 24 V sensor.",
        ]
      ),
      expertMcq(
        "Swapping any two phases on a three-phase motor will:",
        [
          "Reverse rotation direction",
          "Reduce voltage to 277 V automatically",
          "Convert the motor to single-phase",
          "Increase frequency to 120 Hz",
        ],
        0,
        "Phase sequence sets rotating magnetic field direction — swap two lines to reverse.",
        [
          "Phase swap does not change nominal line voltage.",
          "Motor remains three-phase — only rotation changes.",
          "Utility frequency is fixed — phase swap does not alter Hz.",
        ]
      ),
      expertMcq(
        "Standard multimeter on VFD output terminals often reads low because:",
        [
          "PWM waveform is not true sinusoidal AC — meter needs inverter-rated true RMS",
          "VFD output is DC only — AC mode always reads zero",
          "Motor absorbs all voltage — meter always reads 0 V",
          "Frequency is too low for any meter — always use ohms",
        ],
        0,
        "Non-inverter-duty meters misinterpret PWM — use drive display or proper meter.",
        [
          "VFD output to the motor is variable-frequency AC, not DC-only.",
          "Voltage is present — the issue is measurement technique, not zero potential.",
          "Ohms mode is for de-energized resistance — not running output voltage.",
        ]
      ),
    ],
  },

  "electrical-fundamentals/series-parallel-circuits": {
    moduleSlug: "electrical-fundamentals",
    lessonSlug: "series-parallel-circuits",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "E-Stop, overload, and fuse in a motor starter control circuit are placed in series because:",
        [
          "Any single open device de-energizes the coil — fail-safe design",
          "Parallel wiring is cheaper for safety devices",
          "Series placement increases voltage to the coil",
          "Only the start button needs to be in series",
        ],
        0,
        "Safety interlocks must break the entire control path — one fault stops the circuit.",
        [
          "Parallel safety would allow another path to keep the coil energized — unsafe.",
          "Series divides voltage — it does not boost coil voltage.",
          "Stop, OL, and E-Stop are all in the safety chain — not just start.",
        ]
      ),
      expertMcq(
        "One MCC branch breaker trips while others keep running. The branch is:",
        [
          "Parallel to other feeders — independent path",
          "Series with every other motor — all should stop",
          "Always upstream of the main breaker only",
          "Not part of the bus distribution",
        ],
        0,
        "MCC branches are parallel — one trip isolates that motor only.",
        [
          "If series, one trip would stop all motors — that is not MCC topology.",
          "Branch breakers are downstream feeders, not only main protection.",
          "Each bucket is a parallel branch off the vertical bus.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "In a series string, an open contact is found when you measure:",
        [
          "Full source voltage across that contact",
          "0 V across every device including the open one",
          "Half voltage only at the load",
          "Infinite current through the open contact",
        ],
        0,
        "The open device drops the entire source voltage — classic series troubleshooting.",
        [
          "0 V across an open in series means you are not measuring across the open element.",
          "Half voltage is not the signature of a single open in series.",
          "Open means no current — not infinite current.",
        ]
      ),
      expertMcq(
        "Dual-speed motor with low/high interlocks uses parallel branches with:",
        [
          "Series interlocks preventing both speeds energized simultaneously",
          "No interlocks — parallel means both can run",
          "Hydraulic valving only — electrical rules do not apply",
          "Shared OL bypassed on high speed",
        ],
        0,
        "Speed paths are parallel selectable; interlocks in series block simultaneous energization.",
        [
          "Parallel selection still requires mutual exclusion — interlocks enforce it.",
          "Electrical interlocks are standard on multi-speed starters.",
          "OL protects the motor on both speeds — not bypassed.",
        ]
      ),
      expertMcq(
        "Total resistance in series increases because:",
        [
          "R_total = R1 + R2 + R3 — current has one path through all elements",
          "Reciprocals add — 1/R_total = sum of 1/R",
          "Series halves resistance each time",
          "Only the largest resistor counts",
        ],
        0,
        "Single-path current must pass through every resistor — resistances add.",
        [
          "Reciprocal sum is the parallel formula — not series.",
          "Adding components increases total R — it does not halve.",
          "All resistors contribute — not just the maximum value.",
        ]
      ),
      expertMcq(
        "Troubleshooting strategy: 'If this opens, does everything downstream stop?' If yes:",
        [
          "Treat that section as series — use voltage drop across each device",
          "Treat as parallel — measure branch current only",
          "Ignore — only power circuits matter",
          "Replace all parallel branches at once",
        ],
        0,
        "Downstream everything stops → series chain → voltage drop method.",
        [
          "Parallel branches are independent — that question distinguishes topology.",
          "Control circuits are series-heavy — critical for starter troubleshooting.",
          "Replacing all branches is unnecessary — isolate the series fault first.",
        ]
      ),
    ],
  },

  "electrical-fundamentals/meters-measurements": {
    moduleSlug: "electrical-fundamentals",
    lessonSlug: "meters-measurements",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Clamp meter reads 0 A around a three-conductor SO cord carrying balanced motor current because:",
        [
          "Phase magnetic fields cancel when all conductors are inside the jaw",
          "Motor is off — clamp meters only work on DC",
          "480 V is too high for clamp range",
          "You must clamp the conduit, not the wires",
        ],
        0,
        "Clamp ONE phase conductor — enclosing all phases sums to near zero.",
        [
          "Clamp meters measure AC/DC per mode — balanced three-phase needs single-conductor clamp.",
          "Voltage level does not force zero reading — wrong clamp technique does.",
          "Conduit clamp is not the standard motor current method.",
        ]
      ),
      expertMcq(
        "Resistance measurement on a contactor coil requires:",
        [
          "De-energized circuit, LOTO, and often isolating the coil from parallel paths",
          "Energized 480 V circuit — ohms works live",
          "Clamp meter around the coil leads only",
          "Megger at 1000 V with power on",
        ],
        0,
        "Ohms mode on live circuits is invalid and dangerous — isolate and discharge first.",
        [
          "Live ohms readings are meaningless and risk meter damage.",
          "Clamp measures current, not winding resistance.",
          "Megger is insulation test — still requires de-energized isolation.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Live-Dead-Live meter verification means:",
        [
          "Test on known live → test de-energized circuit → test live again to confirm meter function",
          "Test once on dead circuit only — sufficient for LOTO",
          "Alternate AC and DC ranges until a reading appears",
          "Megger first, then voltage — order does not matter",
        ],
        0,
        "Proves the meter worked before and after the zero-energy test — catches dead batteries.",
        [
          "Single dead test cannot prove the meter was functional during the check.",
          "Range hunting is not verification — known live source is required.",
          "Megger is separate from voltage verification sequence.",
        ]
      ),
      expertMcq(
        "Megger testing a motor still connected to a VFD output will:",
        [
          "Destroy VFD IGBTs and DC bus components — disconnect motor leads first",
          "Safely test through the drive — drives are megger-rated",
          "Only read the VFD parameters — no hardware risk",
          "Work if you megger at 250 V on a 480 V motor",
        ],
        0,
        "High DC test voltage back-feeds through output terminals — isolate from electronics.",
        [
          "VFD output stages are not insulation testers — high voltage destroys semiconductors.",
          "Parameter read does not replace isolation before insulation test.",
          "Lower test voltage still energizes the drive output path — disconnect first.",
        ]
      ),
      expertMcq(
        "Good closed contact resistance is typically:",
        [
          "Less than 1 Ω — rises above ~5 Ω indicates pitting or corrosion",
          "Exactly 0 Ω — meter always reads absolute zero",
          "Greater than 100 Ω — high R proves good contact",
          "OL — closed contacts should not conduct",
        ],
        0,
        "Low milliohm-to-ohm range is normal — high R means heat and failure coming.",
        [
          "Meters show small residual — 'exactly zero' is not the field criterion.",
          "High resistance on a closed contact means poor conduction — fault sign.",
          "OL on closed contacts means open — opposite of good.",
        ]
      ),
      expertMcq(
        "Fluctuating voltage readings at a terminal block often indicate:",
        [
          "Loose or intermittent connection — re-torque or replace lug",
          "Correct behavior — all terminals fluctuate normally",
          "Meter battery low — always replace meter first",
          "Phase rotation reversed — swap any two phases",
        ],
        0,
        "Intermittent contact resistance causes unstable voltage drop under load.",
        [
          "Stable circuits do not wildly fluctuate at a tight connection.",
          "Battery check is good practice, but physical looseness is the common root.",
          "Phase rotation does not cause random voltage flutter at one terminal.",
        ]
      ),
    ],
  },

  "digital-fundamentals/binary-number-systems": {
    moduleSlug: "digital-fundamentals",
    lessonSlug: "binary-number-systems",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "PLC input word 0000 0000 0010 0101 (bit 0 = LSB) means:",
        [
          "Inputs 0, 2, and 5 ON — all other bits OFF",
          "Inputs 5, 2, and 0 OFF — inverted logic",
          "Decimal 255 — all inputs ON",
          "Hex FF — fault code active",
        ],
        0,
        "Bits set where 1 appears: positions 0, 2, and 5 = decimal 37.",
        [
          "1 means ON for each bit position — not OFF.",
          "255 would be all eight low bits set — pattern 00100101 is not that.",
          "0xFF is all ones in a byte — this pattern is 0x25 in the low byte.",
        ]
      ),
      expertMcq(
        "Each hexadecimal digit represents:",
        [
          "Exactly 4 binary bits — compact display of PLC status/fault words",
          "8 decimal digits — BCD only",
          "One PLC scan period",
          "480 V phase identification",
        ],
        0,
        "Hex groups nibbles: 0xA = 1010 — standard for fault codes and addresses.",
        [
          "Hex maps to 4 bits per digit — not 8 decimal digits.",
          "Scan time is milliseconds — unrelated to number base.",
          "Voltage identification uses phasing labels — not hex notation.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Binary 10110011 converts to decimal:",
        [
          "179",
          "115",
          "51",
          "255",
        ],
        0,
        "128 + 32 + 16 + 2 + 1 = 179.",
        [
          "Missing the 128 and 32 bits understates the value.",
          "51 is only the lower nibble — full byte must be summed.",
          "255 is all bits set — not this pattern.",
        ]
      ),
      expertMcq(
        "PLC BOOL versus INT data types differ because:",
        [
          "BOOL is one bit (on/off); INT is 16-bit signed integer for analog/scaled values",
          "BOOL is 32-bit floating point — INT is one bit",
          "They are identical on every platform",
          "INT stores only Ethernet IP addresses",
        ],
        0,
        "Digital I/O uses BOOL; analog scaling and timers commonly use INT/DINT.",
        [
          "BOOL is single-bit — not floating point.",
          "Platforms distinguish bit vs word data — not interchangeable.",
          "IP addresses may display in hex — INT is general numeric storage.",
        ]
      ),
      expertMcq(
        "To test if bit 4 is set in a status word, you AND with mask:",
        [
          "0000 0000 0001 0000 (decimal 16) — non-zero result means bit 4 is set",
          "1111 1111 1111 1111 — clears all bits",
          "0000 0000 0000 0001 — tests bit 15 only",
          "0000 0000 0000 0000 — always proves bit 4 ON",
        ],
        0,
        "Mask isolates the target bit — AND result ≠ 0 confirms it is high.",
        [
          "All-ones mask returns the whole word — does not isolate one bit.",
          "0x0001 tests bit 0, not bit 4.",
          "Zero mask always yields zero — proves nothing.",
        ]
      ),
      expertMcq(
        "Fault display 0x0004 on a drive HMI most directly means:",
        [
          "Fault code 4 — convert hex to decimal for the manual lookup",
          "IP address 0.0.0.4 — network misconfigured",
          "4 kW output power — not a fault",
          "Binary 0004 — always undervoltage regardless of manual",
        ],
        0,
        "0x0004 = decimal 4 — cross-reference the vendor fault table.",
        [
          "0x prefix is hex fault coding — not dotted-decimal IP.",
          "Power is kW engineering units — not hex fault notation.",
          "Specific fault meaning depends on the manual — hex is the encoding, not the diagnosis alone.",
        ]
      ),
    ],
  },

  "digital-fundamentals/logic-gates-boolean": {
    moduleSlug: "digital-fundamentals",
    lessonSlug: "logic-gates-boolean",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Two NC E-Stop contacts in series with a safety relay coil implement:",
        [
          "AND logic — both must be closed (inputs true to safety chain) for coil path",
          "OR logic — either E-Stop energizes the coil",
          "XOR — only one may be pressed",
          "NOT — coil energized when E-Stop pressed",
        ],
        0,
        "Series contacts all must pass current — logical AND of permissive conditions.",
        [
          "Parallel would be OR — either path could keep circuit alive — unsafe for E-Stops.",
          "XOR requires different inputs — dual E-Stops are both required permissives.",
          "NOT inverts one input — series NCs are AND of release conditions.",
        ]
      ),
      expertMcq(
        "Ladder rung with two contacts in parallel feeding one coil is:",
        [
          "OR logic — either contact energizes the coil",
          "AND logic — both required",
          "XOR — exclusive selection only",
          "Timer on-delay — always TON",
        ],
        0,
        "Parallel branches are OR — first true path completes the rung.",
        [
          "Series on one rung is AND — parallel branches are OR.",
          "XOR needs mutually exclusive conditions — parallel NO contacts are OR.",
          "TON is a timer instruction — not contact placement.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "NC contact (XIO) in ladder logic corresponds to gate:",
        [
          "NOT — rung true when input is de-energized/absent",
          "AND — always needs second contact",
          "OR — parallel only",
          "NAND — output always true",
        ],
        0,
        "Examine If Open: bit 0 makes contact pass — inverts presence to permissive.",
        [
          "AND needs multiple series conditions — one XIO is inversion.",
          "OR is parallel structure — XIO is contact type, not branch layout.",
          "NAND is combined AND+NOT — XIO alone is NOT.",
        ]
      ),
      expertMcq(
        "Forward XOR Reverse command interlock means output is TRUE when:",
        [
          "Exactly one direction is selected — both active is a fault (FALSE)",
          "Both directions ON is required for jog",
          "Neither selected always runs forward",
          "XOR is not used in motor control",
        ],
        0,
        "XOR: different inputs TRUE; both TRUE yields FALSE — prevents dual direction.",
        [
          "Both directions on is a conflict — XOR blocks it.",
          "Neither selected should not default to motion — interlock prevents run.",
          "Direction interlocks commonly use XOR or paired interlocks.",
        ]
      ),
      expertMcq(
        "De Morgan's NOT(A AND B) equals:",
        [
          "(NOT A) OR (NOT B)",
          "(NOT A) AND (NOT B)",
          "A OR B",
          "Always 0",
        ],
        0,
        "Invert the AND by ORing the inverted inputs — used when simplifying safety logic.",
        [
          "AND of NOTs is NOR form — not De Morgan's first theorem.",
          "A OR B is not the inversion of A AND B.",
          "Result depends on inputs — not constant zero.",
        ]
      ),
      expertMcq(
        "Dual palm-button press to cycle a press implements:",
        [
          "AND — both hands on buttons simultaneously",
          "OR — either button alone is sufficient",
          "NOT — buttons must be released to run",
          "NOR — only one button may be touched",
        ],
        0,
        "Two-hand control requires both inputs TRUE — classic AND safety.",
        [
          "Single button OR would allow one-hand operation — unsafe on presses.",
          "NOT would invert — you need active press, not release.",
          "NOR requires all inputs false for output — opposite of two-hand control.",
        ]
      ),
    ],
  },

  "semiconductor-fundamentals/diode-fundamentals": {
    moduleSlug: "semiconductor-fundamentals",
    lessonSlug: "diode-fundamentals",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Silicon diode forward voltage drop is typically:",
        [
          "0.6–0.7 V when conducting",
          "24 V — matches PLC supply",
          "0 V — ideal short always",
          "480 V — line voltage drop",
        ],
        0,
        "Forward bias exceeds ~0.7 V before significant conduction — important in calculations.",
        [
          "24 V is system supply — junction drop is under a volt.",
          "Real diodes always drop Vf — not zero.",
          "Line voltage is across the circuit — not the junction alone.",
        ]
      ),
      expertMcq(
        "Flyback diode across a relay coil prevents:",
        [
          "Inductive kick destroying transistor outputs when coil de-energizes",
          "AC ripple on the DC bus only",
          "Phase loss on the motor feeder",
          "PLC scan time overrun",
        ],
        0,
        "Collapsing field generates spike — diode gives current a safe freewheel path.",
        [
          "AC ripple is rectifier/filter domain — flyback is inductive switching.",
          "Phase loss is distribution — not coil back-EMF.",
          "Scan time is PLC execution — unrelated to coil inductive energy.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Full-wave bridge rectifier on 480 V AC RMS charges capacitors to about:",
        [
          "679 V — peak rectification (480 × 1.414)",
          "480 V — RMS transferred directly",
          "240 V — half-wave only",
          "24 V — control tap",
        ],
        0,
        "Bridge doubles utilization vs half-wave and peaks at √2 × RMS.",
        [
          "Capacitors charge to peak — not RMS magnitude.",
          "240 V is not the full-wave peak from 480 V RMS.",
          "24 V is a different supply tier — not rectified line peak.",
        ]
      ),
      expertMcq(
        "Diode test mode: good silicon diode reads:",
        [
          "0.5–0.7 V forward, OL reverse",
          "0 Ω both directions — always shorted",
          "OL both directions — always open",
          "480 V forward — line voltage drop",
        ],
        0,
        "One-way conduction — forward shows junction drop, reverse blocks.",
        [
          "Low both ways indicates shorted junction.",
          "OL both ways is open device.",
          "Diode mode uses small test current — not line voltage.",
        ]
      ),
      expertMcq(
        "Reverse bias on a standard rectifier diode means:",
        [
          "Only microamp leakage — acts as open switch until PIV exceeded",
          "Heavy forward current flows",
          "Zener regulation at 24 V always",
          "LED emits light",
        ],
        0,
        "Reverse blocks conduction — exceeding PIV causes breakdown (destructive on standard diodes).",
        [
          "Forward bias allows conduction — reverse blocks.",
          "Zener is designed for reverse breakdown — standard rectifiers are not.",
          "LED forward conduction emits light — different device.",
        ]
      ),
      expertMcq(
        "Six-diode three-phase bridge in a VFD input stage converts:",
        [
          "AC line to pulsating DC on the bus capacitors",
          "DC bus back to variable AC at the motor",
          "480 V AC to 24 V AC for I/O",
          "Analog 4-20 mA to pneumatic PSI",
        ],
        0,
        "Rectifier section charges the DC bus — inverter section creates motor AC.",
        [
          "Inverter creates motor AC — rectifier is input conversion.",
          "24 V comes from control transformer/PSU — not the main bridge.",
          "4-20 mA is instrumentation — not diode bridge function.",
        ]
      ),
    ],
  },

  "semiconductor-fundamentals/transistors-switching": {
    moduleSlug: "semiconductor-fundamentals",
    lessonSlug: "transistors-switching",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "PNP sensor output must pair with:",
        [
          "Sinking (NPN-style) PLC input — sensor sources +V to the input",
          "Sourcing input — same as PNP output",
          "480 V AC discrete input",
          "Analog 4-20 mA loop only",
        ],
        0,
        "PNP sources current — input module must sink to common.",
        [
          "Matching PNP to sourcing input fights polarity — common mismatch.",
          "Discrete inputs are 24 V DC class — not 480 V.",
          "Discrete sensors are digital — not loop-powered analog.",
        ]
      ),
      expertMcq(
        "BJT operated as a switch: no base current means:",
        [
          "Collector-emitter path off — load de-energized",
          "Saturation always — load always on",
          "Gate oxide rupture — MOSFET failure only",
          "hFE equals zero permanently",
        ],
        0,
        "Transistor switch opens without base drive — no collector current.",
        [
          "Saturation requires base current — without it, switch is off.",
          "Gate oxide is MOSFET terminology — BJT uses base.",
          "hFE is gain parameter — not a permanent latch state.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "MOSFET gate drive in VFD output stages versus BJT:",
        [
          "Voltage-controlled gate — very fast switching, low on-resistance",
          "Current-controlled base only — MOSFETs cannot switch power",
          "MOSFETs are used only in 24 V relay coils",
          "BJTs are always faster than MOSFETs at kHz PWM",
        ],
        0,
        "IGBT/MOSFET family enables high-frequency PWM with manageable losses.",
        [
          "MOSFETs/IGBTs dominate power switching — not current-only BJTs at PWM rates.",
          "VFD IGBTs are high voltage — not limited to 24 V coils.",
          "MOSFET/IGBT switching exceeds BJT speed for PWM motor drives.",
        ]
      ),
      expertMcq(
        "NPN transistor diode test: C-E reads low both directions indicates:",
        [
          "Shorted collector-emitter — replace device",
          "Good transistor — always low C-E",
          "Open base — normal off state",
          "Perfect zener — regulate 24 V",
        ],
        0,
        "C-E should be OL in both directions when off — low both ways is short.",
        [
          "Good off-state C-E is high impedance — not low both ways.",
          "Open base shows junction tests on B-E/B-C — not C-E short signature.",
          "Zener is a different structure — not C-E short.",
        ]
      ),
      expertMcq(
        "Darlington pair (e.g., ULN2003) in PLC output modules trades:",
        [
          "High current gain for higher saturation voltage (~1.2–1.4 V drop)",
          "Zero voltage drop — ideal switch",
          "AC motor control without DC supply",
          "Elimination of flyback diodes",
        ],
        0,
        "β multiplication drives relays — extra V_CE(sat) is the cost.",
        [
          "Darlingtons still drop voltage — not ideal zero.",
          "Still DC switching — not AC motor bridge replacement.",
          "Inductive loads still need suppression — Darlington does not remove diodes.",
        ]
      ),
      expertMcq(
        "Shorted C-E on a relay driver transistor symptom:",
        [
          "Output always ON — fuse may blow, coil stays energized",
          "Output never turns ON — open circuit only",
          "Only communication faults on EtherNet/IP",
          "Increased photoeye sensitivity",
        ],
        0,
        "Short keeps load path closed — stuck-on output regardless of logic.",
        [
          "Never ON is open failure — short is always on.",
          "Network faults do not explain stuck transistor output hardware.",
          "Photoeye sensitivity is optical — unrelated to output transistor.",
        ]
      ),
    ],
  },

  "fluid-power/circuit-reading": {
    moduleSlug: "fluid-power",
    lessonSlug: "circuit-reading",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "On a fluid power schematic, a double-acting cylinder symbol with ports A and B connects to:",
        [
          "A 4-way directional control valve — pressure alternates extend/retract",
          "A 2-way check valve only — single direction",
          "Electrical ladder rung — not hydraulic",
          "Relief valve tank line only",
        ],
        0,
        "4-way (5/2 pneumatic) valves route pressure to cap/rod sides for both directions.",
        [
          "2-way passes or blocks — cannot reverse a double-acting cylinder.",
          "Ladder is electrical domain — this is fluid schematic symbology.",
          "Relief dumps to tank — does not route cylinder motion.",
        ]
      ),
      expertMcq(
        "NC (normally closed) check valve symbol on a schematic means:",
        [
          "Blocks reverse flow until cracked open by forward pressure",
          "Allows free flow both directions always",
          "Electrical contact open when de-energized",
          "Cylinder locked mechanically — no fluid",
        ],
        0,
        "Check valve permits one direction — NC arrow shows blocked reverse path.",
        [
          "Bidirectional free flow is not a check valve function.",
          "Electrical NC is ladder notation — fluid symbols describe flow path.",
          "Mechanical lock is a different symbol — check is fluid one-way.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Pneumatic schematic FRL group order (flow direction) is typically:",
        [
          "Filter → Regulator → Lubricator before valves and actuators",
          "Lubricator → Filter → Regulator — oil first",
          "Regulator only — filters optional on shop air",
          "FRL after every cylinder — not at supply",
        ],
        0,
        "Clean, set pressure, then lubricate — protects valves and seals downstream.",
        [
          "Oiling before filtration sends contaminants into valves.",
          "Filters are standard — unfiltered air destroys spools and seals.",
          "FRL conditions supply once — not repeated per actuator.",
        ]
      ),
      expertMcq(
        "Hydraulic schematic center position 'blocked A-B, pump to tank' is:",
        [
          "Float/center exhaust — cylinder holds if seals tight; pump unloads to tank",
          "Locked pump pressure on both cylinder ports — cannot move",
          "Electrical E-Stop latched",
          "Open crossover — ports connected together",
        ],
        0,
        "Tandem center unloads pump while blocking work ports — drift possible if seals leak.",
        [
          "Pressure lock center traps oil — different symbol (often P connected).",
          "E-Stop is electrical safety — valve center is hydraulic topology.",
          "Cross-connect center joins A-B — not tandem unload.",
        ]
      ),
      expertMcq(
        "Reading a schematic before troubleshooting helps you:",
        [
          "Identify meter points, valve states, and accumulator locations without guessing hose paths",
          "Skip lockout — prints replace isolation",
          "Ignore pressure ratings — symbols define PSI",
          "Replace every valve before testing",
        ],
        0,
        "Print tells where to tee gauges and which solenoid shifts which section.",
        [
          "LOTO still required — schematic does not de-energize the system.",
          "Symbols show function — component ratings still come from labels/data.",
          "Systematic reading reduces parts swapping — not eliminate testing.",
        ]
      ),
      expertMcq(
        "Solenoid-operated valve shown de-energized on print (spring return) means:",
        [
          "Spring default position is the fail state shown — energize to shift",
          "Solenoid always energized in operation",
          "Hydraulic pressure holds the spool — spring irrelevant",
          "Electrical 480 V powers the coil directly",
        ],
        0,
        "Print shows resting state — know which position is safe/default when power drops.",
        [
          "Many valves are spring-return to home — not permanently energized.",
          "Pressure assists shift but spring defines de-energized position on print.",
          "Coils are typically 24 V DC or low AC — not 480 V motor voltage.",
        ]
      ),
    ],
  },

  "fluid-power/pressure-diagnostics": {
    moduleSlug: "fluid-power",
    lessonSlug: "pressure-diagnostics",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Hydraulic cylinder extends slowly but pump sounds normal. Work port pressure at full extend is low. Likely:",
        [
          "Internal leakage past piston seals or open relief dumping flow",
          "Electrical phase loss on motor only",
          "PLC scan too slow — hydraulic unaffected",
          "Gauge calibrated for 24 V DC",
        ],
        0,
        "Flow is going somewhere other than useful work — leak or relief mis-set bleeds pressure.",
        [
          "Phase loss affects pump shaft power — low work pressure points to hydraulic leakage path.",
          "Scan time does not change physical pressure — look for fluid path faults.",
          "PSI gauges measure fluid pressure — not voltage.",
        ]
      ),
      expertMcq(
        "Clamp meter on all three motor leads reads imbalance; hydraulic heat rising; relief hot. Check:",
        [
          "Relief setting and loading valve — excess flow over relief creates heat",
          "Only pneumatic FRL lubricator level",
          "EtherNet/IP cable shield",
          "Photoeye alignment only",
        ],
        0,
        "Flow over relief without work converts to heat — verify setpoint and load demand.",
        [
          "FRL is pneumatic supply — relief heat is hydraulic overpressure/flow.",
          "Network cable does not heat hydraulic relief valve.",
          "Photoeye is unrelated to hydraulic thermal rise at relief.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Best practice installing a hydraulic test gauge:",
        [
          "Tee at the port specified on the schematic with system isolated if opening a live line",
          "Remove relief valve to install tee — faster access",
          "Vent to atmosphere first — no pressure needed",
          "Use 0–100 PSI gauge on 3,000 PSI system",
        ],
        0,
        "Use rated gauge at documented test points — bleed trapped pressure before breaking lines.",
        [
          "Removing relief defeats protection and misplaces the measurement point.",
          "Many lines hold trapped pressure — vent/bleed per procedure.",
          "Underranged gauge destroys instrument and risks injury.",
        ]
      ),
      expertMcq(
        "Pneumatic cylinder sluggish; pressure gauge past regulator reads 90 PSI; regulator set 80 PSI. Likely:",
        [
          "Regulator undersized or high flow demand — pressure droop under load",
          "Hydraulic oil too hot — wrong domain",
          "480 V sag — unrelated to air pressure",
          "Cylinder always runs at supply header pressure without drop",
        ],
        0,
        "Flow demand can pull regulated pressure below setpoint — upsize regulator or reduce flow.",
        [
          "Oil temperature is hydraulic — this is pneumatic pressure droop.",
          "Line voltage does not directly set shop air PSI at the regulator.",
          "All regulators droop under load — verify under flow, not static.",
        ]
      ),
      expertMcq(
        "Flow meter in parallel with a blocked cylinder circuit reads near zero while pump at pressure. Indicates:",
        [
          "No flow reaching the meter path — blocked valve or closed isolation",
          "Perfect efficiency — zero flow is always normal at pressure",
          "Motor single-phasing only — always check electrical first for zero flow",
          "Gauge needs AC voltage range",
        ],
        0,
        "Pressure without flow means oil is trapped or path is blocked — find the closed element.",
        [
          "Work requires flow — zero flow at commanded motion is faulted.",
          "Electrical checks matter, but blocked hydraulic path explains zero flow directly.",
          "Flow measurement is hydraulic — not meter AC/DC setting issue.",
        ]
      ),
      expertMcq(
        "Cavitation symptoms at the pump inlet include:",
        [
          "Gravel/marble noise and inlet vacuum — check suction strainer and oil level",
          "Silent operation with stable temperature only",
          "480 Hz hum from VFD output only",
          "Increased pneumatic lubricator mist",
        ],
        0,
        "Inlet starvation boils oil vapors — damages pump; fix suction path.",
        [
          "Cavitation is loud and destructive — not silent normal.",
          "VFD hum is electrical — cavitation is hydraulic suction.",
          "Lubricator mist is pneumatic — not pump inlet condition.",
        ]
      ),
    ],
  },

  "fluid-power/fluid-power-maintenance": {
    moduleSlug: "fluid-power",
    lessonSlug: "fluid-power-maintenance",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Hydraulic return filter differential indicator tripped. First PM action:",
        [
          "Replace or clean filter element per manufacturer — verify oil cleanliness",
          "Bypass filter permanently to restore flow",
          "Raise relief valve setting 500 PSI",
          "Convert system to shop air",
        ],
        0,
        "Clogged return filter restricts flow and heats oil — service element, sample oil if trend is poor.",
        [
          "Bypass sends contaminants to pump/valves — destroys system.",
          "Relief setting does not fix filter clog.",
          "Hydraulic oil and pneumatics are not interchangeable media.",
        ]
      ),
      expertMcq(
        "Pneumatic PM on FRL unit includes:",
        [
          "Drain bowl moisture, replace filter element, verify regulator setpoint and lubricator drip rate",
          "Megger the solenoid coils at 1000 V",
          "Swap hydraulic oil viscosity grade",
          "Adjust VFD accel time",
        ],
        0,
        "Air prep maintenance keeps valves sealing and prevents water/oil emulsion in lines.",
        [
          "Megger is motor insulation — not FRL maintenance.",
          "Hydraulic oil is wrong domain for pneumatic FRL.",
          "VFD tuning does not maintain FRL components.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Darkening hydraulic oil and rising operating temperature trend suggests:",
        [
          "Oxidation/contamination — sample oil, check filter bypass history and heat exchanger",
          "Normal — oil never changes color",
          "Only electrical harmonics — ignore fluid",
          "Lower pneumatic lubricator setting fixes hydraulic oil",
        ],
        0,
        "Color/temperature trends signal fluid breakdown or contamination load — act before pump wear.",
        [
          "Oil color change is a diagnostic clue — not ignorable.",
          "Harmonics heat electrical gear — oil color still points to fluid condition.",
          "Pneumatic lubricator does not treat hydraulic reservoir oil.",
        ]
      ),
      expertMcq(
        "Cylinder rod seal leak visible as oil film on rod. PM priority:",
        [
          "Schedule seal replacement — continued operation loses pressure and ingests dirt",
          "Ignore until cylinder stops moving",
          "Tighten relief valve to stop leak",
          "Increase pneumatic pressure to 120 PSI",
        ],
        0,
        "Rod leaks worsen contamination and efficiency — plan seal kit service.",
        [
          "Waiting for total failure risks sudden downtime and safety issues.",
          "Relief valve does not seal rod wipers — different component.",
          "Pneumatic pressure does not seal hydraulic rods.",
        ]
      ),
      expertMcq(
        "High-hour hydraulic hose PM should include:",
        [
          "Inspect for abrasion, weeping fittings, and replace per age/cycle guidelines",
          "Paint hoses to match panel color only",
          "Remove all hose shields to speed inspection",
          "Permanently remove relief valve for faster cycles",
        ],
        0,
        "Hose bursts are sudden — look for outer cover wear and fitting seep before failure.",
        [
          "Cosmetic paint does not assess burst risk.",
          "Shields protect from abrasion — do not remove for convenience.",
          "Relief is safety — never remove for speed.",
        ]
      ),
      expertMcq(
        "Water in pneumatic lines from failed auto-drain causes:",
        [
          "Valve spool corrosion, seal swell, and inconsistent actuator speed",
          "Higher hydraulic pressure automatically",
          "DC bus overvoltage on VFD",
          "Improved lubricator performance always",
        ],
        0,
        "Moisture destroys pneumatic valve precision — drain bowls and maintain dryers.",
        [
          "Water in air does not raise hydraulic PSI.",
          "VFD DC bus is unrelated to compressed air moisture.",
          "Water often washes out lubricant — performance degrades.",
        ]
      ),
    ],
  },

  "power-distribution/industrial-power-systems": {
    moduleSlug: "power-distribution",
    lessonSlug: "industrial-power-systems",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Motors running hot; MCC voltage reads 505 V on a 480 V nominal system. First check:",
        [
          "Utility/transformer tap setting — may be on +5% tap",
          "Replace all motors immediately without measurement",
          "Lower PLC scan rate",
          "Increase pneumatic regulator to 150 PSI",
        ],
        0,
        "High line voltage raises magnetizing current and heating — verify taps before motor swap.",
        [
          "Tap verification is faster than wholesale motor replacement.",
          "PLC scan does not set distribution voltage.",
          "Pneumatic pressure does not correct electrical overvoltage.",
        ]
      ),
      expertMcq(
        "Delta-Wye transformer secondary commonly provides:",
        [
          "480 V line-to-line and 277 V line-to-neutral for motors and lighting",
          "120 V only — no three-phase",
          "24 V DC bus directly",
          "Pneumatic pressure at 80 PSI",
        ],
        0,
        "Grounded wye secondary gives 480/277 split common in industrial plants.",
        [
          "Three-phase 480 is standard — not 120-only service.",
          "24 V comes from control power supplies — not the main transformer secondary directly.",
          "Compressed air is unrelated to transformer windings.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "MCC vertical bus function is to:",
        [
          "Distribute three-phase power to each starter bucket on the bus stabs",
          "Provide 24 V DC only to PLC racks",
          "Filter hydraulic oil to each motor",
          "Terminate Ethernet/IP only",
        ],
        0,
        "Vertical bus is the shared feeder — buckets stab in for motor branch power.",
        [
          "24 V is from control transformers/PSUs — not the MCC power bus.",
          "Hydraulic filtration is mechanical — not MCC electrical bus.",
          "Network cables are separate — bus is power distribution.",
        ]
      ),
      expertMcq(
        "Harmonic distortion from many VFDs on one transformer often causes:",
        [
          "Transformer overheating and nuisance breaker trips — consider filters/isolation",
          "Improved power factor without capacitors",
          "Lower DC bus on every drive automatically",
          "Elimination of ground faults",
        ],
        0,
        "Non-linear loads add harmonic current — heats conductors and iron.",
        [
          "Harmonics usually worsen PF and heating — not free improvement.",
          "DC bus is per-drive rectifier — harmonics do not lower it directly.",
          "Ground faults are separate failure mode — harmonics do not prevent them.",
        ]
      ),
      expertMcq(
        "Medium voltage 13.8 kV feed typically steps down to:",
        [
          "480 V class for plant distribution via main transformer",
          "24 V DC at the utility pole",
          "80 PSI shop air",
          "4-20 mA loop only",
        ],
        0,
        "Main transformer brings utility MV to low-voltage switchgear/MCC level.",
        [
          "24 V is downstream control — not direct utility delivery.",
          "Compressed air is not electrical transformation output.",
          "4-20 mA is instrument signal — not primary distribution.",
        ]
      ),
      expertMcq(
        "Power factor penalty on utility bill is improved by:",
        [
          "Capacitor banks correcting lagging VARs from motors",
          "Removing overload relays",
          "Increasing relief valve setting on hydraulics",
          "Disabling VFDs permanently",
        ],
        0,
        "Motors draw reactive power — capacitors offset VARs to approach unity PF.",
        [
          "Overload protects motors — unrelated to utility PF billing.",
          "Hydraulic relief does not affect electrical VARs.",
          "VFDs can help controllability — disabling is not PF strategy.",
        ]
      ),
    ],
  },

  "power-distribution/overcurrent-protection": {
    moduleSlug: "power-distribution",
    lessonSlug: "overcurrent-protection",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Motor branch fuse blows repeatedly. Correct response:",
        [
          "Investigate overload/short cause — replace with same type and rating only",
          "Install larger fuse to keep production running",
          "Bypass fuse with copper bar",
          "Replace motor contactor coil only — fuses self-heal",
        ],
        0,
        "Fuse size protects conductors — upsizing lets wire overheat before clearing.",
        [
          "Larger fuse defeats coordination and fire protection.",
          "Bypass removes protection entirely — never acceptable.",
          "Blown fuse indicates fault current — coil swap ignores root cause.",
        ]
      ),
      expertMcq(
        "Dual-element time-delay fuse on motor branch is chosen because:",
        [
          "It tolerates starting inrush while still clearing sustained overloads",
          "It is faster than fast-acting on every fault",
          "It replaces the overload relay entirely",
          "It only protects control transformers",
        ],
        0,
        "Time-delay handles inrush — motor overload relay still handles running overload.",
        [
          "Fast-acting blows on inrush — dual-element is slower by design.",
          "Branch fuse does not replace OL — different protection layers.",
          "Motor branch fuses protect feeder conductors and short faults — not only control.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "One fuse blown on a running three-phase motor often causes:",
        [
          "Single-phasing — motor overheats, should stop immediately",
          "Normal operation — two phases are enough indefinitely",
          "Higher power factor — run until smoke visible",
          "Automatic phase regeneration inside the motor",
        ],
        0,
        "Missing phase creates severe imbalance and heating — stop and find open fuse/open leg.",
        [
          "Three-phase motors are not designed for indefinite two-phase operation.",
          "Continuing risks fire and winding damage — not acceptable.",
          "Motors do not create the missing phase internally.",
        ]
      ),
      expertMcq(
        "Protective coordination means:",
        [
          "Device closest to the fault clears first — upstream stays closed",
          "All breakers trip together always",
          "Main breaker must trip before branch devices",
          "Fuses are never coordinated with breakers",
        ],
        0,
        "Selective clearing limits outage scope — branch clears before feeder/main.",
        [
          "Simultaneous tripping is miscoordination — defeats selectivity.",
          "Upstream should remain if downstream clears — not trip first.",
          "Engineered studies coordinate fuses and breakers routinely.",
        ]
      ),
      expertMcq(
        "Thermal-magnetic breaker provides:",
        [
          "Thermal element for overloads and magnetic element for fast short-circuit trip",
          "Only ground fault protection — no overload",
          "PLC communication only",
          "Hydraulic pressure relief",
        ],
        0,
        "Bimetal handles sustained overcurrent; magnet trips instantly on high fault.",
        [
          "Ground fault may be separate function — thermal-magnetic is overload + short.",
          "Breaker is electrical protection — not network comms.",
          "Pressure relief is fluid power — unrelated.",
        ]
      ),
      expertMcq(
        "Arc flash label on 480 V MCC bucket requires:",
        [
          "PPE matched to incident energy before opening energized equipment",
          "No PPE — 480 V is low hazard always",
          "Only safety glasses for all energies",
          "Hydraulic gloves — oil resistant",
        ],
        0,
        "NFPA 70E uses calculated cal/cm² — PPE category follows the label.",
        [
          "480 V equipment can exceed 8 cal/cm² — never assume low hazard.",
          "Safety glasses alone are insufficient for medium/high incident energy.",
          "Hydraulic gloves do not protect from arc flash.",
        ]
      ),
    ],
  },

  "power-distribution/grounding-bonding": {
    moduleSlug: "power-distribution",
    lessonSlug: "grounding-bonding",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Equipment bonding (green wire) primary purpose is:",
        [
          "Provide low-impedance fault return so overcurrent devices trip quickly",
          "Increase motor efficiency by 20%",
          "Replace insulation on conductors",
          "Lower pneumatic pressure spikes",
        ],
        0,
        "Bonding connects metal parts to clear faults — impedance must be low enough to trip.",
        [
          "Bonding is safety/fault clearing — not efficiency optimization.",
          "Insulation is separate — bonding does not replace it.",
          "Compressed air dynamics are unrelated to equipment ground.",
        ]
      ),
      expertMcq(
        "High-resistance grounded (HRG) system first ground fault typically:",
        [
          "Alarms without immediate shutdown — fault must be found before a second fault",
          "Trips main breaker instantly every time",
          "Eliminates need for any ground fault monitoring",
          "Converts 480 V to 24 V DC",
        ],
        0,
        "HRG limits fault current — continuity processes stay up but require disciplined tracking.",
        [
          "Instant trip is solidly grounded behavior — HRG limits current instead.",
          "HRG requires detection/alarm — not unmonitored.",
          "Grounding scheme does not change nominal voltage conversion.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "GFCI (5 mA) differs from GFPE (equipment) because:",
        [
          "GFCI protects personnel on 120 V receptacles; GFPE handles larger feeder ground faults",
          "They are identical devices at same threshold",
          "GFCI is for 480 V motor feeders only",
          "GFPE trips at 5 mA on all services",
        ],
        0,
        "Personnel protection vs equipment protection — thresholds and applications differ.",
        [
          "Thresholds and NEC applications differ — not the same device.",
          "Motor feeders use GFPE/class higher devices — not 5 mA GFCI.",
          "GFPE thresholds are adjustable and much higher than 5 mA.",
        ]
      ),
      expertMcq(
        "Megger motor winding T1-to-ground reads 0.5 MΩ while T2/T3 read >100 MΩ. Action:",
        [
          "T1 insulation degraded — plan motor replacement or rewind before run-to-failure",
          "All windings excellent — return to service",
          "Only tighten pneumatic FRL drain",
          "Swap any two phases to fix insulation",
        ],
        0,
        "Low megohm on one phase indicates ground leakage — unsafe to ignore.",
        [
          "0.5 MΩ is poor — other phases do not excuse the faulted winding.",
          "Pneumatic maintenance does not restore winding insulation.",
          "Phase swap does not repair insulation resistance.",
        ]
      ),
      expertMcq(
        "Bonding vs grounding: which is more critical for shock prevention between enclosures?",
        [
          "Bonding — equalizes potential so touch voltage stays low between metal parts",
          "Ground rod alone without bonding — always sufficient",
          "Only lightning rods matter indoors",
          "Pneumatic lubricator mist provides bonding",
        ],
        0,
        "Equal potential between conductive parts prevents shock across two touched surfaces.",
        [
          "Ground rod far away does not bond nearby enclosures together.",
          "Lightning protection is separate from equipment bonding for faults.",
          "Oil mist is not an electrical bond.",
        ]
      ),
      expertMcq(
        "Finding ground fault procedure starts by:",
        [
          "Isolate circuit, disconnect load, megger each conductor and winding to ground",
          "Energize and measure with ohms mode live",
          "Increase fuse size until fault clears",
          "Add water to motor cooling — improves megger",
        ],
        0,
        "Systematic insulation test isolates whether fault is motor, cable, or connection.",
        [
          "Live ohms is invalid — de-energize and test insulation properly.",
          "Larger fuse does not remove ground path — hides the fault.",
          "Water destroys insulation — worsens fault.",
        ]
      ),
    ],
  },

  "alignment/alignment-fundamentals": {
    moduleSlug: "alignment",
    lessonSlug: "alignment-fundamentals",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Coupling misalignment primarily damages:",
        [
          "Bearings, seals, and coupling elements through radial/axial loads",
          "Only the paint on the motor frame",
          "PLC input filtering settings",
          "Pneumatic regulator diaphragm only",
        ],
        0,
        "Offset/angle forces vibration and heat — bearing and seal life collapse.",
        [
          "Cosmetic paint is not the reliability driver — rotating loads are.",
          "PLC settings do not absorb mechanical misalignment forces.",
          "Air regulator is unrelated to shaft centerline error.",
        ]
      ),
      expertMcq(
        "Angular misalignment means:",
        [
          "Shaft centerlines meet at an angle — coupling faces not parallel",
          "Parallel offset only — shafts still parallel",
          "Motor nameplate FLA too high",
          "Electrical phase rotation reversed only",
        ],
        0,
        "Angle between centerlines loads coupling axially and radially each rotation.",
        [
          "Parallel offset is a different error — both angle and offset can coexist.",
          "FLA is electrical — not geometric alignment.",
          "Phase rotation affects motor direction — not coupling face parallelism.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "High vibration at 2× running speed on a coupled motor/pump often suggests:",
        [
          "Misalignment generating twice-per-revolution forcing",
          "Perfect alignment — always 2× on good installs",
          "Only electrical harmonics — never mechanical",
          "Low hydraulic oil temperature only",
        ],
        0,
        "Misalignment signature often shows 2× line frequency in vibration spectra.",
        [
          "Healthy aligned machines show lower 2× coupling forces — not guaranteed high 2×.",
          "Mechanical forcing is common — do not blame harmonics first.",
          "Hydraulic oil temperature does not create 2× mechanical vibration.",
        ]
      ),
      expertMcq(
        "Runout check on a shaft before alignment verifies:",
        [
          "Shaft surface/runout eccentricity — bent shaft or damaged journal invalidates alignment",
          "Ethernet/IP device version",
          "PLC battery status",
          "FRL lubricator drip rate",
        ],
        0,
        "You cannot align to a bent shaft — measure runout and fix mechanical defects first.",
        [
          "Firmware version is controls — unrelated to shaft geometry.",
          "PLC battery does not indicate shaft bend.",
          "Lubricator drip is pneumatic PM — not shaft runout.",
        ]
      ),
      expertMcq(
        "Cost of chronic misalignment on production equipment includes:",
        [
          "Unplanned bearing/seal failure, energy loss, and quality scrap from vibration",
          "Only higher power factor on utility bill",
          "Improved coupling life indefinitely",
          "Automatic laser alignment without measurement",
        ],
        0,
        "Downtime and consumables dominate — alignment is cheap insurance.",
        [
          "PF improvement is not the primary misalignment cost driver.",
          "Coupling life shortens — does not improve.",
          "Laser tools still require procedure — not automatic correction.",
        ]
      ),
      expertMcq(
        "Rough alignment before precision work typically uses:",
        [
          "Straightedge/feeler or dial indicator sweep — get within coarse tolerance first",
          "Full motor rewind",
          "Swap hydraulic pump displacement",
          "Change VFD carrier frequency only",
        ],
        0,
        "Coarse methods speed final laser/dial precision — gross errors waste fine adjustment.",
        [
          "Rewind does not replace geometric alignment.",
          "Pump displacement is hydraulic sizing — unrelated.",
          "Carrier frequency is drive tuning — not shaft centering.",
        ]
      ),
    ],
  },

  "alignment/laser-alignment": {
    moduleSlug: "alignment",
    lessonSlug: "laser-alignment",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Laser alignment system measures primarily:",
        [
          "Shaft centerline offset and angle in vertical/horizontal planes",
          "Motor winding resistance only",
          "PLC scan time milliseconds",
          "Hydraulic PSI at relief valve",
        ],
        0,
        "Laser heads report coupling misalignment vectors for shimming and move corrections.",
        [
          "Winding resistance is electrical — not geometric alignment.",
          "Scan time is controller performance — unrelated.",
          "Relief pressure is hydraulic — not shaft position.",
        ]
      ),
      expertMcq(
        "Soft foot on a motor base means:",
        [
          "One or more feet do not contact base evenly — distorts frame when bolted",
          "Only electrical ground missing",
          "Coupling guard removed",
          "Laser battery low",
        ],
        0,
        "Soft foot bends the frame — alignment readings change when bolt torque applied.",
        [
          "Ground is electrical — soft foot is mechanical foot contact.",
          "Guard removal is safety — different issue.",
          "Battery affects tool operation — not definition of soft foot.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Before final laser alignment, you should:",
        [
          "Correct soft foot and rough-align within coarse limits — tighten bolts to spec torque",
          "Hot-align always without cold baseline",
          "Remove coupling guard permanently for speed",
          "Ignore base grout condition",
        ],
        0,
        "Frame distortion and loose feet invalidate precision — mechanical prep first.",
        [
          "Hot vs cold alignment may both be needed — but prep steps still required.",
          "Guard must be replaced — safety requirement.",
          "Foundation/grout affects stability — not ignorable.",
        ]
      ),
      expertMcq(
        "Thermal growth compensation in alignment accounts for:",
        [
          "Machine centerlines shifting as piping and frames heat from operating temperature",
          "Only ambient room lighting changes",
          "VFD carrier frequency drift",
          "Pneumatic filter color change",
        ],
        0,
        "Align cold with target offsets so hot running centerlines coincide.",
        [
          "Lighting does not move shaft centerlines.",
          "Carrier frequency is electrical — not thermal expansion.",
          "Filter appearance is unrelated to thermal growth.",
        ]
      ),
      expertMcq(
        "Acceptance tolerance for precision coupled pumps is often:",
        [
          "Vendor-specific mils and angular mils — tighter than rough visual alignment",
          "±1 inch offset always acceptable",
          "Any value if coupling rubber is new",
          "Determined only by motor FLA",
        ],
        0,
        "Follow coupling manufacturer limits — laser reports in mils/degrees for comparison.",
        [
          "1 inch is gross misalignment — far beyond precision specs.",
          "New elastomer does not excuse large offset.",
          "FLA is electrical load — not alignment tolerance.",
        ]
      ),
      expertMcq(
        "Live alignment (hot) versus cold alignment is chosen when:",
        [
          "Operating temperature causes significant growth — compare both states if needed",
          "Never — lasers only work de-energized always",
          "Only during pneumatic filter change",
          "Motor must be single-phased for laser",
        ],
        0,
        "Some trains require hot measurement to match running geometry — procedure defines which.",
        [
          "Many procedures use cold alignment with thermal targets — hot may be required case-by-case.",
          "Filter change is unrelated to alignment temperature state.",
          "Phase connection does not enable laser — safety and access govern.",
        ]
      ),
    ],
  },

  "preventative-maintenance/pm-program-design": {
    moduleSlug: "preventative-maintenance",
    lessonSlug: "pm-program-design",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Criticality ranking in PM program design prioritizes:",
        [
          "Assets by safety/production impact — highest criticality gets more rigorous tasks",
          "Only the newest equipment on site",
          "Alphabetical asset tag order",
          "Paint color of the enclosure",
        ],
        0,
        "Risk-based PM focuses labor on failures that hurt safety, environment, or throughput most.",
        [
          "Age alone ignores consequence — old low-impact gear may need less.",
          "Alphabetical order ignores risk.",
          "Cosmetic color is not reliability criteria.",
        ]
      ),
      expertMcq(
        "Time-based PM versus condition-based monitoring (CBM):",
        [
          "TBM on calendar/runtime; CBM triggers on measured condition trends",
          "They are identical — both ignore data",
          "CBM never uses vibration or thermography",
          "TBM only applies to office HVAC",
        ],
        0,
        "CBM uses oil analysis, vibration, IR — TBM is interval-driven regardless of state.",
        [
          "CBM explicitly uses condition data — not the same as fixed intervals.",
          "Vibration and IR are common CBM technologies.",
          "TBM is standard on production assets — not office-only.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Effective PM task specifies:",
        [
          "Clear steps, tools, acceptance criteria, and safe LOTO/isolation requirements",
          "Vague 'check machine' with no standard",
          "Only production rate targets",
          "EtherNet/IP VLAN IDs",
        ],
        0,
        "Technicians need measurable pass/fail — ambiguity creates skipped steps.",
        [
          "Vague tasks yield inconsistent execution — not effective PM.",
          "Production rate is outcome — not task instruction content.",
          "Network VLAN is IT config — not PM task definition.",
        ]
      ),
      expertMcq(
        "PM optimization after failures should:",
        [
          "Update task frequency/method using failure history — eliminate ineffective checks",
          "Add more identical checks without review",
          "Remove all inspections to save time",
          "Ignore root cause documentation",
        ],
        0,
        "RCM/PM review tunes tasks to actual failure modes — reduce waste, add missing coverage.",
        [
          "Duplicating ineffective checks wastes labor — analyze first.",
          "Removing all inspections invites repeat failures.",
          "Root cause data drives better PM design — do not discard.",
        ]
      ),
      expertMcq(
        "Bill of materials attached to PM work orders helps:",
        [
          "Kit correct seals/filters before the window — reduce waiting on storeroom",
          "Eliminate need for skilled trades",
          "Replace engineering drawings permanently",
          "Disable LOTO requirements",
        ],
        0,
        "Pre-kitted parts shorten PM duration and prevent partial completion.",
        [
          "Skilled execution still required — kits support, not replace, trades.",
          "Drawings remain authoritative — BOM supplements parts planning.",
          "LOTO still mandatory — BOM does not change safety rules.",
        ]
      ),
      expertMcq(
        "Leading KPI for PM program health includes:",
        [
          "Percent PM completions on schedule and percent failures preceded by overdue PM",
          "Only total plant headcount",
          "Number of HMI color themes",
          "Shop air color in FRL bowl",
        ],
        0,
        "On-time completion and failure correlation show whether the program is executed and effective.",
        [
          "Headcount alone does not measure PM execution quality.",
          "HMI themes are UI — not maintenance KPI.",
          "Bowl condensation color is not program metric.",
        ]
      ),
    ],
  },

  "hvac-fundamentals/refrigeration-cycle": {
    moduleSlug: "hvac-fundamentals",
    lessonSlug: "refrigeration-cycle",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "In the basic refrigeration cycle, what state change occurs in the evaporator?",
        [
          "Liquid refrigerant absorbs heat and evaporates to gas",
          "High-pressure gas condenses to liquid",
          "Liquid flashes to gas only in the condenser",
          "Compressor converts gas directly to liquid",
        ],
        0,
        "Evaporation in the coil absorbs space heat — that is the cooling effect.",
        [
          "Condensation rejects heat outdoors — it happens in the condenser, not the evaporator.",
          "Flash gas at the expansion device is not the main evaporator state change — evaporation in the coil cools the space.",
          "The compressor raises pressure on gas — it does not convert gas to liquid.",
        ]
      ),
      expertMcq(
        "Superheat measured at 2°F on a TXV system most likely indicates:",
        [
          "Evaporator flooding risk — liquid may reach the compressor",
          "Perfect charge — no action needed always",
          "Condenser fan failure only",
          "Low head pressure from dirty filter only",
        ],
        0,
        "Low superheat means too much liquid leaving the evaporator — slugging risk.",
        [
          "2°F is below typical TXV target (10–15°F) — not automatically perfect.",
          "Condenser fan affects head pressure — low superheat is an evaporator-side flooding signal.",
          "Dirty filter affects airflow and charge symptoms — 2°F superheat still points to flooding first.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Poor cooling with high superheat and low subcooling most likely indicates:",
        [
          "Low refrigerant charge",
          "TXV stuck wide open flooding the compressor",
          "Condenser fan running too fast",
          "Excess oil in the suction line only",
        ],
        0,
        "Low charge shows high superheat and low subcooling together.",
        [
          "Stuck-open TXV drives superheat down (flooding), not high superheat with low subcooling.",
          "Faster condenser fan raises subcooling — it does not mimic low-charge signatures.",
          "Oil in suction affects compression — charge loss shows in both superheat and subcooling pattern.",
        ]
      ),
      expertMcq(
        "Subcooling of 0°F at the condenser outlet means:",
        [
          "Condenser not fully condensing — investigate charge, airflow, or restriction",
          "Perfect charge on every system always",
          "Evaporator is flooded",
          "Compressor is mechanically locked",
        ],
        0,
        "Zero subcooling means no liquid subcooling margin before the expansion device.",
        [
          "Some systems target 10–15°F subcooling — 0°F is not universal perfection.",
          "Flooded evaporator shows low superheat — subcooling at condenser is a different measurement.",
          "Locked compressor is electrical/mechanical — subcooling reads condenser liquid state.",
        ]
      ),
      expertMcq(
        "Ice on the suction line with very low superheat suggests:",
        [
          "TXV stuck open or overcharge — liquid returning toward compressor",
          "Normal winter operation always",
          "Condenser is too clean",
          "Only electrical control fault",
        ],
        0,
        "Low superheat and suction icing indicate flooding/overcharge, not control-only faults.",
        [
          "Winter ambient changes head pressure — icing with low superheat is refrigerant-side flooding.",
          "Clean condenser raises head — icing on suction still ties to low superheat at evaporator.",
          "Controls can fail, but suction ice with low superheat is classic overcharge/TXV fault.",
        ]
      ),
      expertMcq(
        "Before adding refrigerant to a system, a technician should:",
        [
          "Verify airflow, measure superheat and subcooling, and confirm leak/restriction hypothesis",
          "Add until suction pressure matches discharge",
          "Bypass superheat measurement on TXV systems",
          "Raise head pressure by blocking condenser airflow",
        ],
        0,
        "Charge adjustments require evidence from superheat, subcooling, and airflow — not guesswork.",
        [
          "Matching suction to discharge is not a charge procedure — use superheat/subcooling targets.",
          "TXV systems require superheat — skipping it risks slugging the compressor.",
          "Blocking condenser airflow distorts readings — it is not a charge method.",
        ]
      ),
    ],
  },
};

export const CURATED_BATCH_3_KEYS = Object.keys(CURATED_LESSON_ASSESSMENTS_BATCH3);
