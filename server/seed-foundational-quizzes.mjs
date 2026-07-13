/**
 * Seed quiz questions for the 4 foundational modules
 * Run: node server/seed-foundational-quizzes.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const MODULE_IDS = {
  electrical: 30001,
  digital: 30002,
  semiconductor: 30003,
  hvac: 30004,
};

// ─── ELECTRICAL FUNDAMENTALS (30001) ────────────────────────────────────────
const electricalQuestions = [
  {
    question: "According to Ohm's Law, if a 24V supply feeds a 4.7kΩ resistor, what is the approximate current?",
    options: ["5.1 mA", "112.8 mA", "24 mA", "0.51 A"],
    correctIndex: 0,
    explanation: "I = V/R = 24V / 4700Ω = 0.00511A ≈ 5.1 mA. Always convert kΩ to Ω before calculating.",
  },
  {
    question: "In a series circuit with three resistors (100Ω, 220Ω, 330Ω) connected to 120VAC, what is the total resistance?",
    options: ["650Ω", "55Ω", "217Ω", "330Ω"],
    correctIndex: 0,
    explanation: "In series: R_total = R1 + R2 + R3 = 100 + 220 + 330 = 650Ω. Series resistances simply add together.",
  },
  {
    question: "What does Kirchhoff's Voltage Law (KVL) state?",
    options: [
      "The sum of all voltages around any closed loop equals zero",
      "Current entering a node equals current leaving it",
      "Power equals voltage times current",
      "Resistance increases with temperature"
    ],
    correctIndex: 0,
    explanation: "KVL states that the algebraic sum of all voltages around any closed loop in a circuit must equal zero. This is based on conservation of energy.",
  },
  {
    question: "A maintenance tech measures 0V across a closed relay contact that should be carrying current. What does this indicate?",
    options: [
      "The contact is functioning normally — a closed contact has zero voltage drop",
      "The relay coil has failed",
      "The contact is open and not passing current",
      "The meter is malfunctioning"
    ],
    correctIndex: 0,
    explanation: "A properly closed contact acts like a short circuit with essentially 0V across it. If you measure full source voltage across a contact, THAT indicates the contact is open.",
  },
  {
    question: "What is the RMS voltage of standard US industrial 3-phase power?",
    options: ["480V line-to-line", "208V line-to-line", "120V line-to-neutral", "600V line-to-line"],
    correctIndex: 0,
    explanation: "Standard US industrial 3-phase is 480V line-to-line (277V line-to-neutral). 208V is common in commercial buildings, and 600V is used in Canada.",
  },
  {
    question: "Two 100Ω resistors in parallel have a combined resistance of:",
    options: ["50Ω", "200Ω", "100Ω", "25Ω"],
    correctIndex: 0,
    explanation: "For two equal resistors in parallel: R_total = R/2 = 100/2 = 50Ω. The shortcut: 1/R_total = 1/R1 + 1/R2.",
  },
  {
    question: "Before working on a 480V motor starter, what is the FIRST step in the LOTO procedure?",
    options: [
      "Notify all affected personnel",
      "Place your lock on the disconnect",
      "Verify zero energy with a meter",
      "Remove the motor leads"
    ],
    correctIndex: 0,
    explanation: "The first step is always notification. The full LOTO sequence is: Notify → Identify energy sources → Shut down → Isolate → Lock/Tag → Verify zero energy.",
  },
  {
    question: "When measuring AC voltage on a VFD output with a standard multimeter, the reading is inaccurate because:",
    options: [
      "The PWM output is not a true sine wave and standard meters can't read it correctly",
      "VFDs output DC voltage, not AC",
      "The voltage is too high for standard meters",
      "AC meters only work at 60Hz"
    ],
    correctIndex: 0,
    explanation: "VFD outputs are PWM (Pulse Width Modulation) waveforms, not true sine waves. Standard averaging meters give incorrect readings. Use a True RMS meter for accurate VFD output measurements.",
  },
  {
    question: "A 10HP motor running at 480V, 3-phase has a full load current of approximately:",
    options: ["14A", "28A", "7A", "42A"],
    correctIndex: 0,
    explanation: "Rule of thumb for 480V 3-phase: ~1.4A per HP. So 10HP × 1.4 = 14A. Always verify with the motor nameplate, but this estimate helps for quick field calculations.",
  },
  {
    question: "What is the primary purpose of a control transformer in a motor starter?",
    options: [
      "Step down 480V to 120V for the control circuit",
      "Boost voltage to start the motor",
      "Filter harmonics from the power line",
      "Provide power factor correction"
    ],
    correctIndex: 0,
    explanation: "Control transformers step down the line voltage (typically 480V) to a safer 120V for the control circuit components like push buttons, pilot lights, and relay coils.",
  },
];

// ─── DIGITAL FUNDAMENTALS (30002) ───────────────────────────────────────────
const digitalQuestions = [
  {
    question: "What is the decimal value of the binary number 10110101?",
    options: ["181", "173", "165", "189"],
    correctIndex: 0,
    explanation: "10110101 = 128 + 32 + 16 + 4 + 1 = 181. Work right to left: bit positions are 1, 0, 4, 0, 16, 32, 0, 128.",
  },
  {
    question: "In ladder logic, what does an XIC (Examine If Closed) instruction evaluate?",
    options: [
      "TRUE when the addressed bit is ON (1)",
      "TRUE when the addressed bit is OFF (0)",
      "TRUE when the output is energized",
      "TRUE when the timer is done"
    ],
    correctIndex: 0,
    explanation: "XIC (Examine If Closed) is like a normally-open contact — it passes power (evaluates TRUE) when the addressed bit is 1/ON. XIO (Examine If Open) is the opposite.",
  },
  {
    question: "A PLC input module addressed as I:1/4 refers to:",
    options: [
      "Slot 1, bit 4 of the input file",
      "Input 1, channel 4",
      "Module 1, rack 4",
      "Input file 4, word 1"
    ],
    correctIndex: 0,
    explanation: "In Allen-Bradley SLC/MicroLogix addressing: I = Input file, 1 = slot number, /4 = bit number. So I:1/4 is the 5th input (bit 4) on the module in slot 1.",
  },
  {
    question: "What logic gate outputs TRUE only when ALL inputs are TRUE?",
    options: ["AND gate", "OR gate", "XOR gate", "NAND gate"],
    correctIndex: 0,
    explanation: "An AND gate requires all inputs to be TRUE (1) to output TRUE. In ladder logic, this is represented by contacts in series.",
  },
  {
    question: "A TON (Timer On-Delay) instruction with a preset of 5000 and a time base of 1ms will time out after:",
    options: ["5 seconds", "5000 seconds", "0.5 seconds", "50 seconds"],
    correctIndex: 0,
    explanation: "5000 × 1ms = 5000ms = 5 seconds. TON timers start timing when the rung goes true and the DN (done) bit sets when accumulated value reaches the preset.",
  },
  {
    question: "In a PLC scan cycle, what is the correct order of operations?",
    options: [
      "Read inputs → Execute program → Update outputs → Housekeeping",
      "Execute program → Read inputs → Update outputs → Housekeeping",
      "Update outputs → Read inputs → Execute program → Housekeeping",
      "Housekeeping → Execute program → Read inputs → Update outputs"
    ],
    correctIndex: 0,
    explanation: "The PLC scan cycle: (1) Read all inputs into the input image table, (2) Execute the program logic, (3) Write the output image table to physical outputs, (4) Perform housekeeping/communications.",
  },
  {
    question: "What is the hexadecimal equivalent of decimal 255?",
    options: ["FF", "FE", "100", "F0"],
    correctIndex: 0,
    explanation: "255 in hex is FF. Each F represents 15 in decimal. F×16 + F×1 = 240 + 15 = 255. This is the maximum value for one byte (8 bits all set to 1).",
  },
  {
    question: "A CTU (Count Up) instruction in ladder logic increments its accumulated value when:",
    options: [
      "The rung transitions from false to true (rising edge)",
      "The rung is continuously true",
      "The rung transitions from true to false",
      "A timer completes its cycle"
    ],
    correctIndex: 0,
    explanation: "CTU counts on the false-to-true transition (rising edge) of the rung condition. It only counts once per transition, not continuously while the rung is true.",
  },
  {
    question: "What does a NOR gate output?",
    options: [
      "TRUE only when ALL inputs are FALSE",
      "TRUE when any input is TRUE",
      "TRUE only when ALL inputs are TRUE",
      "TRUE when inputs are different"
    ],
    correctIndex: 0,
    explanation: "NOR is OR + NOT. It outputs TRUE (1) only when all inputs are FALSE (0). As soon as any input goes TRUE, the output goes FALSE.",
  },
  {
    question: "In PLC troubleshooting, if an input LED is ON on the module but the corresponding bit in the input image table is OFF, the most likely cause is:",
    options: [
      "The input module or slot is not configured correctly in the I/O tree",
      "The field device has failed",
      "The PLC is in program mode",
      "The wire is disconnected"
    ],
    correctIndex: 0,
    explanation: "If the physical LED is ON but the software doesn't see it, the module configuration is likely wrong — wrong slot assignment, wrong module type selected, or communication fault between the module and processor.",
  },
];

// ─── SEMICONDUCTOR FUNDAMENTALS (30003) ─────────────────────────────────────
const semiconductorQuestions = [
  {
    question: "A silicon diode has a forward voltage drop of approximately:",
    options: ["0.7V", "0.3V", "1.2V", "2.0V"],
    correctIndex: 0,
    explanation: "Silicon diodes have a characteristic forward voltage drop of approximately 0.6-0.7V. Germanium diodes drop about 0.3V, and LEDs drop 1.5-3.5V depending on color.",
  },
  {
    question: "In a VFD's power section, what component converts DC bus voltage back to variable-frequency AC?",
    options: ["IGBT inverter bridge", "Diode rectifier bridge", "DC bus capacitors", "Input line reactor"],
    correctIndex: 0,
    explanation: "The IGBT (Insulated Gate Bipolar Transistor) inverter bridge switches the DC bus voltage at high frequency using PWM to synthesize a variable-frequency AC output for the motor.",
  },
  {
    question: "What is the primary advantage of an IGBT over a standard bipolar transistor in power electronics?",
    options: [
      "High input impedance (voltage-driven gate) combined with high current capacity",
      "Lower cost per unit",
      "Faster switching speed than all other devices",
      "No heat sink required"
    ],
    correctIndex: 0,
    explanation: "IGBTs combine the high input impedance of a MOSFET (voltage-driven, easy to control) with the high current-carrying capacity of a bipolar transistor. This makes them ideal for VFDs and motor drives.",
  },
  {
    question: "A thyristor (SCR) differs from a transistor because:",
    options: [
      "Once triggered ON, it stays ON until current drops below the holding current",
      "It can switch faster than a transistor",
      "It has only two terminals",
      "It doesn't require a gate signal"
    ],
    correctIndex: 0,
    explanation: "SCRs are latching devices — once the gate triggers them ON, they stay conducting even if the gate signal is removed. They only turn OFF when the anode current drops below the holding current (natural commutation in AC circuits).",
  },
  {
    question: "When testing a diode with a multimeter in diode-check mode, a good diode will show:",
    options: [
      "~0.5-0.7V forward, OL (open) reverse",
      "0V in both directions",
      "OL in both directions",
      "~0.5-0.7V in both directions"
    ],
    correctIndex: 0,
    explanation: "A good silicon diode shows ~0.5-0.7V in forward bias and OL (overload/open) in reverse bias. Shorted diodes read ~0V both ways. Open diodes read OL both ways.",
  },
  {
    question: "The DC bus capacitors in a VFD serve what primary purpose?",
    options: [
      "Smooth the pulsating DC from the rectifier into stable DC voltage",
      "Store energy for regenerative braking only",
      "Filter harmonics on the output side",
      "Protect the IGBTs from voltage spikes"
    ],
    correctIndex: 0,
    explanation: "DC bus capacitors filter the rectified DC, smoothing the 360Hz ripple (from 6-pulse rectification of 60Hz 3-phase) into a stable DC voltage for the inverter section.",
  },
  {
    question: "A full-wave bridge rectifier using 4 diodes converts 480VAC to approximately what DC voltage?",
    options: ["~650VDC (peak)", "~480VDC", "~340VDC", "~240VDC"],
    correctIndex: 0,
    explanation: "DC peak = VAC × √2 = 480 × 1.414 ≈ 679V. With capacitor filtering, the DC bus voltage settles around 650VDC. This is why VFD DC bus voltage is always higher than the input AC voltage.",
  },
  {
    question: "What failure mode is indicated when an IGBT measures low resistance between collector and emitter in both directions?",
    options: [
      "Short-circuit failure — the IGBT is shorted",
      "Normal operation — IGBTs always show low resistance",
      "Open-circuit failure",
      "Gate driver failure"
    ],
    correctIndex: 0,
    explanation: "A good IGBT should show high resistance (OL) between collector and emitter with no gate signal. Low resistance in both directions indicates the device has failed short — a common VFD failure mode that usually trips an overcurrent fault.",
  },
  {
    question: "In a linear power supply, what component provides voltage regulation?",
    options: [
      "A series-pass transistor controlled by a feedback loop",
      "The transformer alone",
      "The filter capacitor",
      "The rectifier diodes"
    ],
    correctIndex: 0,
    explanation: "Linear regulators use a series-pass transistor (or IC like the 7805) that acts as a variable resistor, controlled by a feedback loop comparing output voltage to a reference. It drops excess voltage as heat.",
  },
  {
    question: "A Zener diode is specifically designed to:",
    options: [
      "Operate in reverse breakdown at a precise voltage for voltage regulation",
      "Emit light when forward biased",
      "Switch high currents like an SCR",
      "Block voltage in both directions"
    ],
    correctIndex: 0,
    explanation: "Zener diodes are designed to operate in reverse breakdown at a specific, stable voltage (the Zener voltage). They're used as voltage references and simple voltage regulators in control circuits.",
  },
];

// ─── HVAC FUNDAMENTALS (30004) ──────────────────────────────────────────────
const hvacQuestions = [
  {
    question: "In the basic refrigeration cycle, what state change occurs in the evaporator?",
    options: [
      "Low-pressure liquid refrigerant absorbs heat and becomes a gas",
      "High-pressure gas releases heat and becomes a liquid",
      "Refrigerant is compressed from low to high pressure",
      "Refrigerant pressure drops through an expansion device"
    ],
    correctIndex: 0,
    explanation: "The evaporator is where cooling happens. Low-pressure liquid refrigerant absorbs heat from the air (or water) passing over the coil, causing the refrigerant to evaporate (change from liquid to gas).",
  },
  {
    question: "What is the primary reason VFDs are used on HVAC fan and pump motors?",
    options: [
      "Energy savings — reducing speed by 20% saves approximately 50% energy due to the affinity laws",
      "To increase the maximum speed of the motor",
      "To eliminate the need for motor starters",
      "To convert single-phase to three-phase power"
    ],
    correctIndex: 0,
    explanation: "The affinity laws state that power varies with the cube of speed. So reducing fan/pump speed by 20% (to 80%) reduces power to 0.8³ = 0.512, saving nearly 50% energy. This is the primary economic justification for VFDs in HVAC.",
  },
  {
    question: "A scroll compressor differs from a reciprocating compressor in that it:",
    options: [
      "Uses two spiral-shaped scrolls orbiting to compress refrigerant continuously",
      "Uses pistons moving up and down in cylinders",
      "Requires an external oil pump",
      "Can only be used with R-22 refrigerant"
    ],
    correctIndex: 0,
    explanation: "Scroll compressors use two interleaving spiral scrolls — one fixed, one orbiting. Gas is trapped between the scrolls and compressed as the orbiting scroll moves, providing smooth, continuous compression with fewer moving parts than reciprocating types.",
  },
  {
    question: "When a chiller's approach temperature is increasing over time, this typically indicates:",
    options: [
      "Fouled heat exchanger tubes that need cleaning",
      "Low refrigerant charge",
      "Compressor bearing failure",
      "Expansion valve stuck open"
    ],
    correctIndex: 0,
    explanation: "Approach temperature is the difference between leaving water temperature and refrigerant temperature. Increasing approach means reduced heat transfer efficiency, most commonly caused by fouling (scale, algae, debris) on the heat exchanger tubes.",
  },
  {
    question: "In a DDC (Direct Digital Control) system, what does a BACnet MS/TP network use for communication?",
    options: [
      "RS-485 twisted pair wiring",
      "Ethernet Cat6 cable",
      "Wireless Wi-Fi",
      "Fiber optic cable"
    ],
    correctIndex: 0,
    explanation: "BACnet MS/TP (Master-Slave/Token-Passing) uses RS-485 serial communication over twisted pair wiring. It's the most common field-level network in building automation, supporting up to 128 devices at distances up to 4000 feet.",
  },
  {
    question: "A VFD running an AHU supply fan shows a 'Motor Overload' fault at 45Hz. The most likely cause is:",
    options: [
      "Dirty filters or blocked coils increasing static pressure and motor load",
      "The VFD is undersized for the motor",
      "The motor bearings have seized",
      "The VFD firmware needs updating"
    ],
    correctIndex: 0,
    explanation: "At 45Hz (75% speed), the motor shouldn't be overloaded under normal conditions. Increased static pressure from dirty filters or blocked coils forces the fan to work harder, drawing more current than expected and tripping the overload.",
  },
  {
    question: "What is superheat in a refrigeration system?",
    options: [
      "Temperature of the refrigerant gas above its boiling point at the evaporator outlet",
      "Temperature of the liquid above its condensing point",
      "The maximum temperature the compressor can handle",
      "Heat added by the reheat coil"
    ],
    correctIndex: 0,
    explanation: "Superheat is measured at the evaporator outlet — it's how many degrees the refrigerant gas temperature exceeds the saturation (boiling) temperature at that pressure. Normal superheat is 8-12°F. Low superheat risks liquid slugging the compressor.",
  },
  {
    question: "A 3-way mixing valve in a chilled water system controls temperature by:",
    options: [
      "Blending bypass water with chilled water to achieve the desired supply temperature",
      "Throttling flow to reduce cooling capacity",
      "Switching between heating and cooling modes",
      "Regulating refrigerant flow to the evaporator"
    ],
    correctIndex: 0,
    explanation: "A 3-way mixing valve has two inlets (chilled water supply and bypass/return) and one outlet. By varying the mix ratio, it controls the supply water temperature to the coil without changing total flow through the system.",
  },
  {
    question: "When troubleshooting an RTU (Rooftop Unit) that won't cool, the FIRST thing to check is:",
    options: [
      "Thermostat calling for cooling and control voltage present",
      "Refrigerant charge level",
      "Compressor winding resistance",
      "Condenser fan motor capacitor"
    ],
    correctIndex: 0,
    explanation: "Always start with the simplest checks: Is the thermostat actually calling for cooling? Is 24VAC control voltage present? Many service calls are resolved at the thermostat/control level without ever touching the refrigeration system.",
  },
  {
    question: "The coefficient of performance (COP) of a chiller measures:",
    options: [
      "The ratio of cooling output to energy input — higher is more efficient",
      "The maximum cooling capacity in tons",
      "The compressor discharge pressure",
      "The refrigerant flow rate"
    ],
    correctIndex: 0,
    explanation: "COP = Cooling Output (BTU) / Energy Input (BTU). A COP of 5.0 means the system produces 5 units of cooling for every 1 unit of energy consumed. Modern centrifugal chillers can achieve COPs of 6-7 at full load.",
  },
];

// ─── SEED EXECUTION ─────────────────────────────────────────────────────────
async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  const allQuestions = [
    { moduleId: MODULE_IDS.electrical, questions: electricalQuestions },
    { moduleId: MODULE_IDS.digital, questions: digitalQuestions },
    { moduleId: MODULE_IDS.semiconductor, questions: semiconductorQuestions },
    { moduleId: MODULE_IDS.hvac, questions: hvacQuestions },
  ];

  let totalInserted = 0;

  for (const { moduleId, questions } of allQuestions) {
    // Check if questions already exist for this module
    const [existing] = await conn.query(
      "SELECT COUNT(*) as cnt FROM quiz_questions WHERE moduleId = ?",
      [moduleId]
    );
    if (existing[0].cnt > 0) {
      console.log(`Module ${moduleId} already has ${existing[0].cnt} questions, skipping.`);
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
    console.log(`✓ Inserted ${questions.length} questions for module ${moduleId}`);
  }

  console.log(`\nDone! Inserted ${totalInserted} quiz questions total.`);
  await conn.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
