/**
 * Industrial Glossary — Source of Truth
 *
 * Every acronym or shorthand term that appears in lesson content.
 * Powers future tooltip UI; used by content audit tests today.
 */

export interface GlossaryEntry {
  term: string;
  expansion: string;
  definition: string;
  domain: string;
  example: string;
}

export const INDUSTRIAL_GLOSSARY: GlossaryEntry[] = [
  // === PLC & Programming ===
  { term: "PLC", expansion: "programmable logic controller", definition: "An industrial computer that runs machine logic by reading inputs, executing a program, and controlling outputs.", domain: "plc", example: "The PLC controls the conveyor start/stop sequence." },
  { term: "I/O", expansion: "input/output", definition: "Signals going into and out of the PLC — inputs read field devices, outputs drive loads.", domain: "plc", example: "Check the I/O module LEDs to see which inputs are active." },
  { term: "HMI", expansion: "human-machine interface", definition: "The touchscreen or panel that operators use to monitor and control the machine.", domain: "plc", example: "The HMI shows a fault alarm when the conveyor stops." },
  { term: "CPU", expansion: "central processing unit", definition: "The processor module in a PLC that executes the control program.", domain: "plc", example: "The CPU runs the ladder logic every scan cycle." },
  { term: "XIC", expansion: "examine if closed", definition: "A PLC ladder logic instruction that checks if a bit is ON (true/1).", domain: "plc", example: "XIC I:1/0 checks whether the start pushbutton input is energized." },
  { term: "XIO", expansion: "examine if open", definition: "A PLC ladder logic instruction that checks if a bit is OFF (false/0).", domain: "plc", example: "XIO I:1/3 checks whether the E-stop input is NOT energized." },
  { term: "OTE", expansion: "output energize", definition: "A PLC ladder logic instruction that turns an output bit ON when rung conditions are true.", domain: "plc", example: "OTE O:2/0 energizes the motor contactor coil output." },
  { term: "OTL", expansion: "output latch", definition: "A PLC instruction that latches an output ON — it stays ON even if rung conditions go false.", domain: "plc", example: "OTL B3:0/0 latches the alarm bit until an unlatch clears it." },
  { term: "OTU", expansion: "output unlatch", definition: "A PLC instruction that unlatches (resets) a previously latched output.", domain: "plc", example: "OTU B3:0/0 clears the alarm latch when the reset button is pressed." },
  { term: "TON", expansion: "timer on-delay", definition: "A PLC timer that starts counting when its rung goes true and energizes its done bit after the preset time.", domain: "plc", example: "TON T4:0 delays the conveyor start by 5 seconds after the horn sounds." },
  { term: "TOF", expansion: "timer off-delay", definition: "A PLC timer that starts counting when its rung goes false and keeps its done bit on until the preset expires.", domain: "plc", example: "TOF T4:1 keeps the lube pump running 30 seconds after the motor stops." },
  { term: "RTO", expansion: "retentive timer on", definition: "A timer that accumulates time across multiple true/false cycles — it does not reset when the rung goes false.", domain: "plc", example: "RTO T4:2 tracks total run hours for preventive maintenance scheduling." },
  { term: "CTU", expansion: "count up", definition: "A PLC counter that increments by one each time its rung transitions from false to true.", domain: "plc", example: "CTU C5:0 counts parts passing the photoelectric sensor." },
  { term: "CTD", expansion: "count down", definition: "A PLC counter that decrements by one each time its rung transitions from false to true.", domain: "plc", example: "CTD C5:1 counts down remaining parts in the batch." },
  { term: "DN", expansion: "done bit", definition: "A status bit on a timer or counter that turns ON when the accumulated value reaches the preset.", domain: "plc", example: "When T4:0.DN is true, the timer has finished counting." },
  { term: "EN", expansion: "enable bit", definition: "A status bit that is ON whenever the timer or counter rung is true (actively timing or counting).", domain: "plc", example: "T4:0.EN tells you the timer is currently running." },
  { term: "PRE", expansion: "preset value", definition: "The target value a timer or counter must reach before its done bit turns on.", domain: "plc", example: "Set the PRE to 5000 for a 5-second delay (1 ms time base)." },
  { term: "ACC", expansion: "accumulated value", definition: "The current count of how far a timer or counter has progressed toward its preset.", domain: "plc", example: "The ACC shows 3200 out of 5000 — the timer is 64% done." },
  { term: "SF", expansion: "status fault", definition: "A red LED on an Allen-Bradley I/O module indicating that specific card has a fault condition.", domain: "plc", example: "A solid SF on the 1756-IB16 means check that card's field power, not the CPU." },
  { term: "BF", expansion: "bus fault", definition: "A fault indicating communication failure between the PLC backplane and a module.", domain: "plc", example: "A flashing BF LED means the module lost communication with the CPU." },
  { term: "RSLogix", expansion: "RSLogix (Rockwell programming software)", definition: "Rockwell Automation's legacy PLC programming software for SLC 500 and PLC-5 platforms.", domain: "plc", example: "Open RSLogix 500 to go online with the SLC and check the fault code." },
  { term: "MCR", expansion: "master control relay", definition: "A safety device or PLC zone that de-energizes all outputs in a section when tripped.", domain: "plc", example: "The MCR zone shuts down all outputs between the MCR fences when the E-stop is pressed." },

  // === Motor Controls ===
  { term: "OL", expansion: "overload", definition: "A protective device that trips when motor current exceeds a safe level for too long, preventing motor damage.", domain: "motor-controls", example: "The OL tripped because the conveyor was jammed and drawing excess current." },
  { term: "VFD", expansion: "variable frequency drive", definition: "A drive that controls motor speed by changing the frequency and voltage sent to the motor.", domain: "motor-controls", example: "The VFD fault code tells you why the drive stopped the motor." },
  { term: "MCC", expansion: "motor control center", definition: "A cabinet that houses motor starters, overloads, disconnects, and control wiring for multiple motors.", domain: "motor-controls", example: "Go to the MCC and check bucket 4 for the conveyor starter." },
  { term: "NC", expansion: "normally closed", definition: "A contact that is closed (conducting) in its resting state and opens when actuated.", domain: "motor-controls", example: "The E-stop uses NC contacts — opening the circuit kills power." },
  { term: "NO", expansion: "normally open", definition: "A contact that is open (not conducting) in its resting state and closes when actuated.", domain: "motor-controls", example: "The start pushbutton is NO — pressing it closes the circuit to energize the starter." },
  { term: "CR", expansion: "control relay", definition: "A relay used in control circuits to multiply contacts or isolate logic from power circuits.", domain: "motor-controls", example: "CR1 energizes when the safety circuit is complete, enabling the start circuit." },
  { term: "PB", expansion: "pushbutton", definition: "A momentary switch operated by pressing — used for start, stop, and jog functions.", domain: "motor-controls", example: "Press the green PB to start the motor; press the red PB to stop." },
  { term: "E-stop", expansion: "emergency stop", definition: "A red mushroom-head pushbutton that immediately de-energizes the machine when pressed for safety.", domain: "safety", example: "Hit the E-stop if anyone is in danger — it cuts power to all motion." },
  { term: "FVNR", expansion: "full-voltage non-reversing", definition: "A motor starter that applies full line voltage to the motor in one direction only.", domain: "motor-controls", example: "The conveyor uses an FVNR starter — it only runs forward." },
  { term: "FVR", expansion: "full-voltage reversing", definition: "A motor starter with two contactors that can run the motor in either direction.", domain: "motor-controls", example: "The FVR starter uses a mechanical interlock to prevent both contactors from closing." },

  // === Electrical Fundamentals ===
  { term: "VDC", expansion: "volts direct current", definition: "A measurement of DC voltage — common control voltage levels are 24 VDC and 12 VDC.", domain: "electrical", example: "The sensor needs 24 VDC to operate — check for voltage at the terminal." },
  { term: "VAC", expansion: "volts alternating current", definition: "A measurement of AC voltage — common levels are 120 VAC (control) and 480 VAC (power).", domain: "electrical", example: "The control transformer steps 480 VAC down to 120 VAC for the control circuit." },
  { term: "AC", expansion: "alternating current", definition: "Electrical current that reverses direction periodically — standard power distribution in plants.", domain: "electrical", example: "The 480 VAC three-phase AC supply feeds the motor through the starter." },
  { term: "DC", expansion: "direct current", definition: "Electrical current that flows in one direction only — used for control signals and sensors.", domain: "electrical", example: "The PLC inputs run on 24 VDC from the power supply." },
  { term: "NPN", expansion: "NPN (sinking output)", definition: "A sensor output type that switches the negative (0V) side of the circuit — current sinks into the sensor.", domain: "sensors", example: "An NPN sensor connects to a sinking input card — current flows into the sensor output." },
  { term: "PNP", expansion: "PNP (sourcing output)", definition: "A sensor output type that switches the positive (+V) side of the circuit — current sources from the sensor.", domain: "sensors", example: "A PNP sensor connects to a sourcing input card — current flows out of the sensor output." },
  { term: "COM", expansion: "common terminal", definition: "The shared return wire for a group of inputs or outputs — either the positive or negative bus.", domain: "electrical", example: "Wire the COM terminal to 0V for sinking inputs or to +24V for sourcing inputs." },
  { term: "PE", expansion: "protective earth (ground)", definition: "The safety ground conductor that bonds equipment frames to earth for fault protection.", domain: "electrical", example: "The green/yellow PE wire connects the motor frame to the ground bus." },
  { term: "DMM", expansion: "digital multimeter", definition: "A handheld test instrument that measures voltage, current, and resistance.", domain: "electrical", example: "Use the DMM to check for 24 VDC at the sensor terminals." },
  { term: "VOM", expansion: "volt-ohm-milliammeter", definition: "An older term for a multimeter that measures voltage, resistance, and current.", domain: "electrical", example: "Grab the VOM and check continuity on that wire." },

  // === Safety ===
  { term: "LOTO", expansion: "lockout/tagout", definition: "A safety procedure that ensures machines are de-energized and cannot be restarted during maintenance.", domain: "safety", example: "Perform LOTO before opening the panel — lock the disconnect and verify zero energy." },
  { term: "OSHA", expansion: "Occupational Safety and Health Administration", definition: "The U.S. federal agency that sets and enforces workplace safety standards.", domain: "safety", example: "OSHA 1910.147 requires LOTO procedures for servicing energized equipment." },
  { term: "NFPA", expansion: "National Fire Protection Association", definition: "The organization that publishes electrical safety standards including NFPA 70E for arc flash.", domain: "safety", example: "NFPA 70E defines the PPE categories for working on energized equipment." },
  { term: "PELV", expansion: "protective extra-low voltage", definition: "A safety classification for circuits below 30 VAC or 60 VDC with protective earth bonding.", domain: "safety", example: "The 24 VDC control circuit qualifies as PELV because it is earth-referenced." },
  { term: "SIL", expansion: "safety integrity level", definition: "A rating (1-4) that defines how reliable a safety function must be — higher means more redundancy.", domain: "safety", example: "The E-stop circuit is rated SIL 3, requiring dual-channel monitoring." },

  // === Standards & Codes ===
  { term: "NEC", expansion: "National Electrical Code", definition: "NFPA 70 — the U.S. standard for safe electrical installation practices.", domain: "standards", example: "The NEC requires GFCI protection on 120V receptacles in wet locations." },
  { term: "JIC", expansion: "Joint Industrial Council", definition: "The body that published standard electrical symbols and diagram conventions for industrial controls.", domain: "standards", example: "JIC symbols use diagonal lines for contacts and circles for coils on elementary diagrams." },
  { term: "NEMA", expansion: "National Electrical Manufacturers Association", definition: "The organization that sets standards for electrical enclosures, motor ratings, and device sizing.", domain: "standards", example: "A NEMA 4X enclosure is rated for washdown environments." },
  { term: "IEC", expansion: "International Electrotechnical Commission", definition: "The international body that publishes global electrical standards — common outside North America.", domain: "standards", example: "IEC uses different contact symbols than NEMA/JIC — horizontal bars vs diagonal lines." },

  // === Instrumentation & Sensors ===
  { term: "RTD", expansion: "resistance temperature detector", definition: "A temperature sensor that changes electrical resistance as temperature changes — very accurate.", domain: "sensors", example: "The RTD reads bearing temperature — if resistance rises, the bearing is overheating." },
  { term: "TC", expansion: "thermocouple", definition: "A temperature sensor made of two dissimilar metals that generates a small voltage proportional to temperature.", domain: "sensors", example: "The Type K thermocouple measures furnace temperature up to 1260°C." },
  { term: "PID", expansion: "proportional-integral-derivative", definition: "A control algorithm that continuously adjusts an output to maintain a process variable at setpoint.", domain: "instrumentation", example: "The PID loop adjusts the valve position to keep tank level at 75%." },
  { term: "SCADA", expansion: "supervisory control and data acquisition", definition: "A system that monitors and controls industrial processes across multiple sites from a central location.", domain: "instrumentation", example: "The SCADA screen shows all pump stations across the water treatment plant." },

  // === Networking ===
  { term: "IP", expansion: "Internet Protocol (address)", definition: "A numeric address that identifies a device on an industrial Ethernet network.", domain: "networking", example: "Set the VFD IP address to 192.168.1.10 so the PLC can communicate with it." },
  { term: "MAC", expansion: "media access control (address)", definition: "A unique hardware address burned into every network device — used for device identification.", domain: "networking", example: "The MAC address is printed on the module label if you need to identify it on the network." },
  { term: "EtherNet/IP", expansion: "EtherNet/Industrial Protocol", definition: "Rockwell Automation's industrial Ethernet protocol for PLC-to-device communication.", domain: "networking", example: "The PowerFlex 525 communicates with the ControlLogix over EtherNet/IP." },

  // === Maintenance ===
  { term: "PM", expansion: "preventive maintenance", definition: "Scheduled maintenance tasks performed at regular intervals to prevent equipment failure.", domain: "maintenance", example: "The PM schedule calls for greasing the conveyor bearings every 500 hours." },
  { term: "CMMS", expansion: "computerized maintenance management system", definition: "Software that tracks work orders, PM schedules, parts inventory, and equipment history.", domain: "maintenance", example: "Create a work order in the CMMS when you find a problem during your PM rounds." },
  { term: "WO", expansion: "work order", definition: "A documented task assigned to maintenance — includes the problem, location, priority, and parts needed.", domain: "maintenance", example: "The WO says replace the proximity sensor on conveyor 3 — priority high." },
  { term: "RCA", expansion: "root cause analysis", definition: "A systematic method to identify why a failure happened so you can prevent it from recurring.", domain: "maintenance", example: "The RCA showed the bearing failed because the grease fitting was blocked, not because of overload." },

  // === VFD-Specific ===
  { term: "Hz", expansion: "hertz (cycles per second)", definition: "The unit of frequency — motor speed is controlled by changing the Hz output of the VFD.", domain: "motor-controls", example: "At 60 Hz the motor runs full speed; at 30 Hz it runs half speed." },
  { term: "V/Hz", expansion: "volts per hertz (ratio)", definition: "The relationship between voltage and frequency that a VFD maintains to keep motor torque constant.", domain: "motor-controls", example: "The V/Hz pattern keeps the motor from overheating at low speeds." },

  // === Common Plant-Floor Terms ===
  { term: "photoeye", expansion: "photoelectric sensor", definition: "A through-beam or reflective sensor. When blocked, the PLC input typically reads ON; an NC interlock in ladder logic drops out until the path is clear.", domain: "sensors", example: "The photoeye on conveyor 3 is blocked — check for jammed product." },
  { term: "rung", expansion: "rung (ladder logic line)", definition: "One horizontal line of ladder logic scanned left-to-right by the PLC processor.", domain: "plc", example: "Rung 5 has the motor start logic — trace it left to right." },
  { term: "overload", expansion: "overload relay/heater", definition: "A thermal or electronic heater element that trips when motor current exceeds safe FLA for too long.", domain: "motor-controls", example: "The overload tripped because the belt was jammed." },
  { term: "PLC input", expansion: "PLC input module signal", definition: "A discrete or analog signal wired into an input module (e.g., I:1/5) from field devices.", domain: "plc", example: "Check the PLC input LED to see if the sensor signal is reaching the card." },
  { term: "PLC output", expansion: "PLC output module signal", definition: "A driven signal from an output module (e.g., O:2/0) to contactors, solenoids, or indicators.", domain: "plc", example: "The PLC output LED is on but the motor won't start — check the wiring downstream." },
  { term: "fault", expansion: "fault condition", definition: "An abnormal condition — wiring, device, or logic — that prevents expected machine response.", domain: "plc", example: "Clear the fault and check what caused it before restarting." },

  // === Informal Shorthand ===
  { term: "seal-in", expansion: "seal-in contact (holding circuit)", definition: "An auxiliary NO contact wired in parallel with the start button that keeps the circuit energized after the button is released.", domain: "motor-controls", example: "The seal-in contact holds the contactor energized after you release the start pushbutton." },
  { term: "dry contact", expansion: "dry contact (voltage-free contact)", definition: "A relay or switch contact that does not supply its own voltage — the receiving device provides the signal power.", domain: "electrical", example: "The VFD fault output is a dry contact — wire it to a PLC input with external 24 VDC." },
  { term: "sinking", expansion: "sinking (current flows into the device)", definition: "A wiring configuration where current flows into the device terminal toward the negative rail.", domain: "sensors", example: "A sinking input card expects current to flow into the input terminal from the sensor." },
  { term: "sourcing", expansion: "sourcing (current flows out of the device)", definition: "A wiring configuration where current flows out of the device terminal from the positive rail.", domain: "sensors", example: "A sourcing input card provides current out of the input terminal to the sensor." },
  { term: "control voltage", expansion: "control voltage (low-voltage circuit)", definition: "The lower voltage (typically 24 VDC or 120 VAC) used for logic, sensors, and control devices — separate from motor power voltage.", domain: "electrical", example: "The control voltage is 24 VDC — check it at the power supply before troubleshooting inputs." },
  { term: "line side", expansion: "line side (incoming power)", definition: "The terminals where incoming power connects to a device — upstream of the load.", domain: "electrical", example: "Check voltage on the line side of the disconnect to confirm power is available." },
  { term: "load side", expansion: "load side (outgoing to equipment)", definition: "The terminals where power exits a device toward the equipment it feeds — downstream.", domain: "electrical", example: "No voltage on the load side of the overload means the OL has tripped." },
  { term: "aux contact", expansion: "auxiliary contact", definition: "An extra set of contacts on a contactor or relay used for control logic rather than carrying motor current.", domain: "motor-controls", example: "The aux contact on M1 provides the seal-in path and a status signal to the PLC." },
  { term: "interlock", expansion: "interlock (safety or sequence lock)", definition: "A device or logic condition that prevents an action unless specific safety or sequence requirements are met.", domain: "safety", example: "The guard interlock prevents the machine from running when the door is open." },
  { term: "trip class", expansion: "trip class (overload response time)", definition: "A rating that defines how quickly an overload relay trips at a given overcurrent level — Class 10, 20, or 30.", domain: "motor-controls", example: "Class 10 trips faster than Class 20 — use Class 10 for motors that cannot tolerate extended overload." },
];

/** Lookup a glossary entry by its term (case-insensitive). */
export function getGlossaryEntry(term: string): GlossaryEntry | undefined {
  return INDUSTRIAL_GLOSSARY.find(
    (e) => e.term.toLowerCase() === term.toLowerCase()
  );
}

/** Get all glossary entries for a given domain. */
export function getGlossaryByDomain(domain: string): GlossaryEntry[] {
  return INDUSTRIAL_GLOSSARY.filter((e) => e.domain === domain);
}

/**
 * HIGH_RISK_ACRONYMS — terms that MUST be expanded on first use in every lesson.
 * Used by the content audit test.
 */
export const HIGH_RISK_ACRONYMS: string[] = [
  "PLC", "I/O", "HMI", "VFD", "OL", "MCC", "LOTO", "NC", "NO",
  "SF", "BF", "OTE", "XIC", "XIO", "TON", "CTU", "DN", "EN",
  "PRE", "ACC", "VDC", "VAC", "NPN", "PNP", "COM", "PE",
  "PELV", "NEC", "NFPA", "OSHA", "JIC", "NEMA", "IEC",
  "PM", "CMMS", "WO", "RCA", "VOM", "DMM", "RTD", "PID",
  "SCADA", "IP", "MAC", "CR", "PB", "MCR", "E-stop",
  "EtherNet/IP", "CPU", "MCC",
];
