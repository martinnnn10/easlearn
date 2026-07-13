import type { CuratedLessonAssessment } from "./curatedLessonAssessmentTypes";
import { expertMcq } from "./curatedMcqHelpers";

export const CURATED_LESSON_ASSESSMENTS_ILU7: Record<string, CuratedLessonAssessment> = {
  "powerflex-vfd/powerflex-parameter-groups": {
    moduleSlug: "powerflex-vfd",
    lessonSlug: "powerflex-parameter-groups",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "On a PowerFlex drive, a parameter labeled P102 is typically interpreted as:",
        [
          "A basic program parameter in the P-group that can be viewed and edited from the keypad",
          "A hardware terminal number that cannot be changed in software",
          "A PLC tag address from the controller project",
          "A fault code that always requires replacing the drive",
        ],
        0,
        "P-group parameters are programmable setup values; they are not fixed wiring terminals or PLC addresses.",
        [
          "Terminal numbers are physical wiring points, while P102 is a configurable software parameter.",
          "PLC tags live in the controller, not as native PowerFlex parameter identifiers.",
          "Faults use fault codes/events; a parameter number alone does not mean hardware failure.",
        ]
      ),
      expertMcq(
        "Why is the motor data/nameplate group critical during initial drive setup?",
        [
          "It gives the drive accurate motor voltage, current, and frequency references used for protection and control",
          "It only affects HMI text labels and has no control impact",
          "It disables overload protection so nuisance trips stop",
          "It automatically corrects any incoming line voltage imbalance",
        ],
        0,
        "Correct nameplate values let the drive estimate motor behavior and protect the motor properly.",
        [
          "Nameplate entries directly influence control and protection behavior, not only display labels.",
          "Disabling protection is unsafe and not the purpose of motor data parameters.",
          "A drive cannot magically fix upstream power quality; it can only react within limits.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "When navigating parameter groups from the HIM/keypad, best practice before changing values is to:",
        [
          "Record the existing value and parameter number so you can restore the known-good setting if needed",
          "Change multiple parameters quickly without documenting to save downtime",
          "Only rely on memory because the drive stores everything automatically",
          "Reset to factory defaults first, then tune from scratch on a running machine",
        ],
        0,
        "Documenting baseline values prevents extended downtime and supports controlled troubleshooting.",
        [
          "Undocumented batch changes make root-cause analysis much harder after a bad outcome.",
          "Automatic storage does not replace a technician's change log and rollback plan.",
          "Blind factory reset on production assets can remove critical application-specific settings.",
        ]
      ),
      expertMcq(
        "A tech needs to verify accel/decel behavior. Which parameter area should be checked first?",
        [
          "Basic program parameters in the P-group where ramp times are configured",
          "Only digital input terminal wiring, because ramps are purely hardware based",
          "EtherNet/IP switch VLAN settings",
          "Motor frame size stamped on the nameplate only",
        ],
        0,
        "Ramp behavior is configured in drive parameters; wiring and network settings are secondary checks.",
        [
          "Ramps are software-controlled in the drive, not solely determined by terminal wiring.",
          "Network segmentation does not define local accel/decel timing.",
          "Frame size matters for selection, but ramp timing comes from configured parameters.",
        ]
      ),
      expertMcq(
        "If keypad edits are locked out or unavailable, the safest next step is to:",
        [
          "Use approved software access and proper permissions to review/change parameters with change control",
          "Bypass permissions using undocumented service codes from the internet",
          "Cycle power repeatedly until edit mode appears",
          "Swap the drive immediately without checking configuration policy",
        ],
        0,
        "Controlled access protects machine reliability and prevents unauthorized parameter drift.",
        [
          "Circumventing controls creates cybersecurity and reliability risk.",
          "Power cycling does not resolve policy or lockout configuration issues.",
          "Hardware replacement is premature when the issue is likely access control.",
        ]
      ),
      expertMcq(
        "Motor nameplate current entered too low in parameters will most likely cause:",
        [
          "Nuisance overload or current-related trips during normal production load",
          "Automatic energy savings with no side effects",
          "The drive to ignore thermal protection completely",
          "Loss of all communication with the PLC network",
        ],
        0,
        "Understated current limits make the drive think normal load is overcurrent.",
        [
          "Lowering current settings does not create free efficiency; it often reduces available torque margin.",
          "Protection remains active; the issue is it acts too early, not that it disappears.",
          "Current limit settings are separate from network communication health.",
        ]
      ),
    ],
  },

  "powerflex-vfd/basic-programming": {
    moduleSlug: "powerflex-vfd",
    lessonSlug: "basic-programming",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "For common PowerFlex setups, parameters P101-P104 are most often associated with:",
        [
          "Core speed reference and accel/decel timing behavior used in day-to-day operation",
          "DC bus capacitor replacement intervals",
          "EtherNet/IP MAC address assignment only",
          "Motor insulation resistance test thresholds",
        ],
        0,
        "These are foundational run-profile parameters that shape how the motor starts, accelerates, and slows.",
        [
          "Maintenance intervals for internal components are not typically configured as P101-P104.",
          "Network identity settings are handled elsewhere, not in basic speed/ramp parameters.",
          "Megger thresholds are maintenance criteria, not standard basic programming parameters.",
        ]
      ),
      expertMcq(
        "Speed reference source must be configured correctly because it determines:",
        [
          "Where the run speed command comes from (keypad, analog input, or network command)",
          "The physical motor rotation direction regardless of command",
          "Whether branch-circuit protection is required",
          "The lockout/tagout procedure for maintenance",
        ],
        0,
        "If the source is wrong, the drive may ignore expected commands or respond to the wrong control point.",
        [
          "Rotation direction depends on commands/wiring/parameters, not speed source alone.",
          "Electrical protection requirements remain regardless of speed reference source.",
          "LOTO is a safety procedure and is not replaced by drive source configuration.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "A conveyor jerks to speed too quickly after start. First programming adjustment to review:",
        [
          "Acceleration time parameter (for example within P101-P104 range) before making hardware changes",
          "Motor nameplate RPM only, because ramp timing is fixed",
          "PLC scan time because drives do not own acceleration behavior",
          "Remove current limits so the motor reaches speed faster",
        ],
        0,
        "Ramp aggression is usually a parameter issue and should be tuned in software first.",
        [
          "Nameplate RPM is needed, but jerk response is primarily ramp-parameter related.",
          "Drives enforce their own accel profiles even when PLC commands start/stop.",
          "Removing limits can damage equipment and is not a controlled fix.",
        ]
      ),
      expertMcq(
        "If decel time is set unrealistically short for a high-inertia load, a likely result is:",
        [
          "Overvoltage trips due to regenerative energy returning to the DC bus",
          "Cleaner network communication and fewer PLC faults",
          "Guaranteed shorter stopping distance in every case",
          "Lower motor heating under all load conditions",
        ],
        0,
        "Rapid commanded decel can push regenerated energy back into the drive faster than it can dissipate.",
        [
          "Network quality is unrelated to regen energy behavior.",
          "Stopping distance also depends on inertia and available braking capability.",
          "Aggressive decel can increase stress and heating, not universally reduce it.",
        ]
      ),
      expertMcq(
        "Entering incorrect motor base frequency in basic programming can cause:",
        [
          "Poor speed scaling and torque performance because V/Hz relationship is misapplied",
          "Only cosmetic differences in keypad display units",
          "Automatic correction from the PLC every scan",
          "No impact as long as acceleration time is correct",
        ],
        0,
        "Base frequency is fundamental to how the drive maps output frequency and voltage for the motor.",
        [
          "This parameter affects control behavior, not just display formatting.",
          "PLC logic typically does not auto-correct drive motor data errors.",
          "Good ramp settings cannot fully compensate for wrong motor base data.",
        ]
      ),
      expertMcq(
        "Before finalizing basic programming on a production machine, the best verification step is to:",
        [
          "Run a controlled functional test through expected speeds and ramps while monitoring current/faults",
          "Save parameters without a test to avoid any interruption",
          "Force full speed immediately to prove stability faster",
          "Disable protective trips during commissioning to prevent nuisance faults",
        ],
        0,
        "Commissioning requires observed behavior under realistic operation with protections active.",
        [
          "Skipping validation risks unexpected trips and unstable operation once production starts.",
          "Immediate full-speed jumps increase mechanical and process risk during setup.",
          "Protection should be tuned, not disabled, during commissioning.",
        ]
      ),
    ],
  },

  "powerflex-vfd/advanced-features": {
    moduleSlug: "powerflex-vfd",
    lessonSlug: "advanced-features",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "In a drive-controlled process loop, enabling PID in the VFD primarily allows:",
        [
          "Closed-loop adjustment of drive output to hold a process variable near setpoint",
          "Automatic bypass of all external sensors",
          "Elimination of all PLC logic for machine sequencing",
          "Direct control of breaker trip curves",
        ],
        0,
        "Drive PID can regulate speed/output based on feedback, but still depends on valid instrumentation and system design.",
        [
          "PID requires trustworthy feedback; it cannot function correctly with sensors removed.",
          "Sequencing, interlocks, and broader machine logic often remain in PLC control.",
          "Breaker protection settings are electrical distribution functions, not PID loop outcomes.",
        ]
      ),
      expertMcq(
        "Comm loss action on a networked drive should be configured to:",
        [
          "Transition the machine to a predefined safe behavior appropriate for the process risk",
          "Always continue at last speed regardless of process state",
          "Ignore communications alarms to maximize uptime",
          "Reset and restart repeatedly until communication returns",
        ],
        0,
        "A deterministic comm-loss response prevents uncontrolled operation when control authority is lost.",
        [
          "Holding last speed can be unsafe in many applications without risk assessment approval.",
          "Suppressing alarms hides loss-of-control conditions and delays response.",
          "Repeated blind restarts can worsen mechanical/process instability.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "Multi-speed presets are typically used when:",
        [
          "An application needs repeatable discrete operating speeds selected by logic or digital inputs",
          "The process requires only one fixed speed forever",
          "PID control is unavailable in the drive",
          "The motor cannot tolerate acceleration ramps",
        ],
        0,
        "Preset speeds simplify recipes and repeatable machine states without analog scaling complexity.",
        [
          "If only one speed is needed, presets add unnecessary complexity.",
          "Preset speeds and PID can coexist depending on control mode and application.",
          "Ramps still apply; presets define targets, not abrupt no-ramp behavior.",
        ]
      ),
      expertMcq(
        "When using embedded EtherNet/IP in a PowerFlex drive, a common commissioning check is:",
        [
          "Confirming cyclic I/O data mapping and command/reference ownership between PLC and drive",
          "Assuming defaults are always correct if ping responds",
          "Disabling drive fault reporting to reduce traffic",
          "Using only explicit messages for high-speed run permissives",
        ],
        0,
        "Successful ping proves reachability, not correct control-word mapping or ownership.",
        [
          "Many startup issues are mapping/ownership errors despite basic IP connectivity.",
          "Fault reporting is critical for diagnostics and should not be suppressed.",
          "High-speed control usually depends on cyclic implicit I/O, not only explicit transactions.",
        ]
      ),
      expertMcq(
        "A PID loop in the drive is oscillating. First practical tuning move is usually to:",
        [
          "Reduce aggressive gain settings and confirm sensor scaling before deeper retuning",
          "Increase every gain term to respond faster",
          "Disable feedback filtering entirely",
          "Switch to factory defaults while the process is at full load",
        ],
        0,
        "Most loop instability starts with too-aggressive tuning or bad scaling, not insufficient gain.",
        [
          "Increasing all gains generally worsens oscillation.",
          "Removing filtering can amplify noisy signals and destabilize control.",
          "Blind resets at full load can create unacceptable process upsets.",
        ]
      ),
      expertMcq(
        "If network commands and local keypad commands conflict, reliable operation requires:",
        [
          "A clear command priority strategy so only one active authority controls run/speed at a time",
          "Allowing both to command simultaneously and trusting the drive to blend them",
          "Disabling all local diagnostics access",
          "Forcing fixed full speed whenever command ownership is unclear",
        ],
        0,
        "Defined ownership avoids ambiguous control states and unexpected starts/stops.",
        [
          "Competing command sources create unpredictable machine behavior.",
          "Diagnostic access can remain while still enforcing command authority.",
          "Defaulting to full speed is hazardous and not a valid conflict strategy.",
        ]
      ),
    ],
  },

  "sensors-instrumentation/sensor-types-overview": {
    moduleSlug: "sensors-instrumentation",
    lessonSlug: "sensor-types-overview",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "The key distinction between a discrete and analog sensor output is:",
        [
          "Discrete reports state (on/off), while analog reports a continuous measured value",
          "Discrete is always higher voltage than analog",
          "Analog cannot be used with PLCs",
          "Discrete outputs always communicate over Ethernet",
        ],
        0,
        "Choose output type based on whether the control task needs state detection or variable measurement.",
        [
          "Signal type is about information content, not simply voltage magnitude.",
          "Analog inputs are standard in PLC-based process/control systems.",
          "Many discrete devices are hardwired transistor/relay outputs, not Ethernet nodes.",
        ]
      ),
      expertMcq(
        "4-20 mA is preferred in industry partly because:",
        [
          "It is robust over distance and can indicate wire-break/fault when current drops below expected live-zero",
          "It requires no calibration at any point in system life",
          "It eliminates electrical noise in all installations",
          "It works only for temperature and not pressure or flow",
        ],
        0,
        "Current loops are noise-resistant and support practical fault detection with a live-zero baseline.",
        [
          "Transmitters still require calibration and periodic verification.",
          "No signal standard is immune to all noise; grounding/shielding still matter.",
          "4-20 mA is widely used across pressure, flow, level, temperature, and more.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "For PLC digital input compatibility, a PNP sensor most commonly pairs with:",
        [
          "A sinking input card expecting the sensor to source positive voltage when active",
          "Another PNP output in series as the only load",
          "A thermocouple input channel",
          "A 4-20 mA analog output channel",
        ],
        0,
        "Matching source/sink conventions avoids inverted logic and dead inputs during startup.",
        [
          "Output-to-output wiring is not a proper input interface strategy.",
          "Thermocouple modules read millivolt signals, not transistor switching outputs.",
          "4-20 mA channels are analog measurement interfaces, not discrete transistor input points.",
        ]
      ),
      expertMcq(
        "Selecting a sensor for oily, dusty conveyor detection usually prioritizes:",
        [
          "A sensing technology and housing rating suited to contamination and washdown conditions",
          "The lowest-cost device regardless of environment",
          "Only the cable color for maintenance visibility",
          "Maximum sensing range even if false triggers increase",
        ],
        0,
        "Environmental fit and false-trigger resistance often determine reliability more than purchase price.",
        [
          "Cheap sensors can become expensive through downtime and repeated replacement.",
          "Cable color can help ID but does not determine sensing reliability.",
          "Excess range can pick up background targets and create nuisance trips.",
        ]
      ),
      expertMcq(
        "A discrete proximity switch is best used to:",
        [
          "Confirm presence/absence or position state at a threshold point",
          "Provide high-resolution continuous flow measurement",
          "Directly power a three-phase motor",
          "Replace calibrated pressure transmitters in control loops",
        ],
        0,
        "Discrete sensors excel at state detection, not precision continuous process measurement.",
        [
          "Continuous flow needs analog/transmitter-style instrumentation.",
          "Sensors signal controls; they do not serve as motor power devices.",
          "Pressure loop control requires proper pressure instrumentation and scaling.",
        ]
      ),
      expertMcq(
        "When reviewing sensor options, response time and hysteresis matter because they affect:",
        [
          "How reliably switching occurs at production speed without chatter or missed detections",
          "Only the sensor's cosmetic datasheet appearance",
          "The plant utility power factor correction plan",
          "Whether lockout/tagout is legally required",
        ],
        0,
        "Dynamic behavior must match machine cycle speed to avoid nuisance faults or missed parts.",
        [
          "These specs are functional, not cosmetic.",
          "Power factor programs are electrical infrastructure concerns, not sensor switching behavior.",
          "LOTO requirements remain regardless of sensor response specifications.",
        ]
      ),
    ],
  },

  "sensors-instrumentation/temperature-pressure": {
    moduleSlug: "sensors-instrumentation",
    lessonSlug: "temperature-pressure",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "Compared with thermocouples, RTDs are commonly chosen when the application needs:",
        [
          "Higher accuracy and stability over a moderate temperature range",
          "No wiring polarity considerations at all",
          "Operation only above furnace-level extreme temperatures",
          "Direct 4-20 mA output with no transmitter hardware",
        ],
        0,
        "RTDs often provide better precision, while thermocouples typically cover wider high-temperature ranges.",
        [
          "RTD wiring method (2/3/4-wire) still matters for lead resistance effects.",
          "Thermocouples are often preferred at extreme temperatures.",
          "Both RTD and TC elements usually need transmitter/interface electronics for standardized outputs.",
        ]
      ),
      expertMcq(
        "Impulse lines on pressure instruments should be maintained because blockage can:",
        [
          "Cause delayed or incorrect pressure readings that mislead operators and control loops",
          "Improve transmitter response by damping all process noise",
          "Increase sensor accuracy automatically over time",
          "Only affect local gauge readability, never control signals",
        ],
        0,
        "Plugged or leaking impulse lines distort true process pressure before it reaches the sensing element.",
        [
          "Uncontrolled blockage introduces bias and lag, not healthy damping.",
          "Contamination generally degrades accuracy rather than improving it.",
          "If the transmitter is fed from the line, both local and control readings can be wrong.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "A thermocouple signal is typically small and in millivolts, so accurate measurement requires:",
        [
          "Proper type matching, reference compensation, and suitable input/transmitter configuration",
          "A standard digital input card configured as on/off",
          "Shield removal to reduce circuit resistance",
          "Direct connection to a relay coil for stronger signal",
        ],
        0,
        "TC measurement quality depends on correct sensor type, compensation, and noise-aware wiring practices.",
        [
          "Digital input cards cannot interpret low-level thermoelectric analog signals correctly.",
          "Removing shielding often worsens noise susceptibility.",
          "Relay coils are loads, not precision measurement interfaces.",
        ]
      ),
      expertMcq(
        "A pressure transmitter with incorrect range setup (LRV/URV) will likely produce:",
        [
          "Mis-scaled process values, causing bad control decisions even if wiring is healthy",
          "Perfectly accurate pressure because 4-20 mA always self-scales",
          "Only a network alarm with no process impact",
          "Immediate correction from the PLC without reconfiguration",
        ],
        0,
        "Range configuration defines how measured pressure maps into the output signal.",
        [
          "Current loop quality does not fix a wrong engineering range configuration.",
          "Mis-scaling directly affects process logic, alarms, and operator decisions.",
          "PLC scaling cannot always compensate for a badly ranged instrument in the field.",
        ]
      ),
      expertMcq(
        "When comparing RTD vs thermocouple for a steam line near upper-temperature limits, a common choice is:",
        [
          "Thermocouple, because many types tolerate higher temperatures better than RTDs",
          "RTD always, because it has no practical temperature limits",
          "A discrete prox sensor, because temperature is binary",
          "Any sensor type, because transmitter scaling makes them equivalent",
        ],
        0,
        "Sensor selection must respect operating range, required accuracy, and installation constraints.",
        [
          "RTDs have practical upper limits and may not suit extreme temperature service.",
          "Temperature control usually needs analog measurement, not discrete state only.",
          "Scaling cannot overcome the underlying sensing element's physical limitations.",
        ]
      ),
      expertMcq(
        "In pressure service with long impulse tubing, one practical reliability step is to:",
        [
          "Use proper slope/placement and routine checks to avoid liquid/gas pockets that skew readings",
          "Install random loops in tubing to absorb vibration",
          "Increase transmitter span to hide line issues",
          "Disable pressure alarms until maintenance is complete",
        ],
        0,
        "Impulse line routing quality is part of measurement accuracy, not just mechanical installation.",
        [
          "Random routing can trap media and worsen response characteristics.",
          "Widening span hides symptoms and reduces useful resolution.",
          "Alarm suppression can mask real process risk.",
        ]
      ),
    ],
  },

  "sensors-instrumentation/calibration-basics": {
    moduleSlug: "sensors-instrumentation",
    lessonSlug: "calibration-basics",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "In instrument calibration, zero and span adjustments are used to:",
        [
          "Align low-end and full-scale output so measured signal matches known reference points",
          "Increase sensor response time for smoother trends",
          "Bypass process interlocks during startup",
          "Set Ethernet switch QoS priorities",
        ],
        0,
        "Zero corrects baseline offset and span corrects slope/gain across the measurement range.",
        [
          "Response time tuning is a separate dynamic setting, not the definition of zero/span.",
          "Calibration should follow controlled procedures, not interlock bypasses.",
          "Network QoS settings are unrelated to analog measurement calibration.",
        ]
      ),
      expertMcq(
        "The value of recording as-found and as-left data is that it:",
        [
          "Provides traceability of instrument drift and confirms final condition after adjustment",
          "Eliminates the need for future calibrations",
          "Proves the process never changed during testing",
          "Replaces loop checkout documentation",
        ],
        0,
        "As-found/as-left records support audits, reliability analysis, and maintenance planning.",
        [
          "One calibration record does not remove ongoing drift risk.",
          "Process conditions can vary; records capture instrument state, not all process behavior.",
          "Loop checkout and calibration records are complementary, not interchangeable.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "A transmitter is within tolerance at zero but out at high end. Most likely needed correction:",
        [
          "Span adjustment, followed by recheck at multiple points",
          "Only a wiring polarity swap",
          "A full factory reset without documenting initial values",
          "Ignore because zero point passed",
        ],
        0,
        "High-end error with good zero usually indicates slope error, not baseline offset.",
        [
          "Polarity issues create gross signal faults, not a subtle high-end slope deviation.",
          "Undocumented resets remove diagnostic evidence and may worsen configuration state.",
          "Passing one point is insufficient; calibration must meet tolerance across the range.",
        ]
      ),
      expertMcq(
        "A proper calibration interval is typically based on:",
        [
          "Criticality, historical drift, manufacturer guidance, and regulatory/site requirements",
          "Only when operators complain about trends",
          "A fixed one-size-fits-all annual schedule for every instrument",
          "Whether spare transmitters are currently in stock",
        ],
        0,
        "Risk-based calibration planning balances reliability, compliance, and maintenance effort.",
        [
          "Waiting for complaints is reactive and can allow quality/safety excursions.",
          "Different services and sensor types drift differently; intervals should be evidence-based.",
          "Spare inventory affects logistics, not calibration necessity criteria.",
        ]
      ),
      expertMcq(
        "During bench calibration of a 4-20 mA transmitter, best practice is to:",
        [
          "Use a traceable reference source and verify several points (up and down) for linearity/hysteresis",
          "Check only 4 mA and assume the rest is correct",
          "Use an unverified handheld meter if it is convenient",
          "Skip documenting ambient conditions and setup",
        ],
        0,
        "Multi-point checks catch nonlinearity and hysteresis that two-point checks can miss.",
        [
          "Single-point or two-point-only checks can overlook mid-range errors.",
          "Reference accuracy limits the calibration quality; unknown tools weaken results.",
          "Setup conditions and method matter for repeatability and audits.",
        ]
      ),
      expertMcq(
        "If as-found error exceeds tolerance but as-left is acceptable, the maintenance implication is:",
        [
          "Instrument was drifting and corrective action restored it; interval or root cause may need review",
          "Calibration can be skipped next cycle because it passed at the end",
          "The original as-found data should be deleted",
          "Process data from that period is guaranteed invalid",
        ],
        0,
        "Out-of-tolerance as-found is a reliability signal that should feed future maintenance decisions.",
        [
          "End-pass condition does not erase evidence of prior drift behavior.",
          "As-found data is essential and should be retained for traceability.",
          "Impact on historical process quality depends on context and should be evaluated, not assumed absolute.",
        ]
      ),
    ],
  },

  "sensors-instrumentation/loop-checkout": {
    moduleSlug: "sensors-instrumentation",
    lessonSlug: "loop-checkout",
    auditedKnowledgeCheck: 0,
    auditedQuiz: 0,
    knowledgeChecks: [
      expertMcq(
        "During analog loop checkout, simulating 4, 12, and 20 mA is done to:",
        [
          "Verify scaling, indication, and control/alarm response across the full operating span",
          "Test only the transmitter power supply fuse",
          "Prove network switch redundancy",
          "Replace calibration entirely",
        ],
        0,
        "Three-point simulation confirms both endpoints and mid-scale behavior from field to control system.",
        [
          "Fuse checks are useful but do not validate end-to-end loop scaling and logic.",
          "Network redundancy tests are separate from analog signal path verification.",
          "Loop checkout validates integration; calibration validates instrument accuracy.",
        ]
      ),
      expertMcq(
        "A valve stroke test in checkout mainly confirms:",
        [
          "The final element responds through full travel with correct direction and position feedback",
          "Only that compressed air is available at the manifold",
          "The PID loop is perfectly tuned for all future conditions",
          "The instrument tag naming convention is complete",
        ],
        0,
        "Stroke testing verifies actuator mechanics and command-response integrity before startup.",
        [
          "Air supply presence alone does not prove full, controlled valve movement.",
          "Stroke test validates actuation path, not complete long-term tuning quality.",
          "Correct tagging is important but does not prove physical movement performance.",
        ]
      ),
    ],
    lessonQuizzes: [
      expertMcq(
        "A bump test for a process loop is intended to:",
        [
          "Introduce a small controlled change and confirm expected PV/MV response direction and sensitivity",
          "Drive the process to full load immediately",
          "Bypass alarms so operators are not disturbed",
          "Replace formal SAT/FAT documentation",
        ],
        0,
        "Small perturbations reduce risk while proving loop polarity and dynamic response.",
        [
          "Large abrupt changes increase process risk and obscure controlled analysis.",
          "Alarm handling should be planned, not bypassed blindly.",
          "Bump tests are one commissioning activity, not full acceptance documentation.",
        ]
      ),
      expertMcq(
        "If 12 mA simulation displays near 75% on the HMI, the most likely issue is:",
        [
          "Input scaling mismatch between field signal range and configured engineering range",
          "A failed control valve actuator spring",
          "Drive acceleration parameter too short",
          "Correct behavior because 12 mA always equals 75%",
        ],
        0,
        "With standard 4-20 mA linear scaling, 12 mA should represent approximately 50% of span.",
        [
          "Valve actuator mechanics do not explain a purely analog indication scaling error.",
          "VFD accel settings do not alter analog input percentage mapping.",
          "12 mA is mid-span on 4-20 mA, not three-quarters span.",
        ]
      ),
      expertMcq(
        "Before performing live valve stroke or bump tests, teams should confirm:",
        [
          "Operations readiness, communication, and safe process window to avoid upset or hazard",
          "Only that the instrument tech is available",
          "That all alarms are suppressed plantwide",
          "That control logic is permanently in manual mode",
        ],
        0,
        "Coordination prevents unintended trips, quality loss, and unsafe process transients.",
        [
          "Single-person readiness is insufficient for process-impacting tests.",
          "Plantwide alarm suppression removes critical protections and awareness.",
          "Permanent manual mode is not a commissioning objective.",
        ]
      ),
      expertMcq(
        "A successful end-to-end loop checkout package should include:",
        [
          "Test points, observed values, discrepancies, corrective actions, and final sign-off",
          "Only a statement that startup was successful",
          "Screenshots with no context or expected values",
          "Undocumented field adjustments to speed up handover",
        ],
        0,
        "Structured records make startup defensible and support future troubleshooting and audits.",
        [
          "Outcome-only notes lack traceability for later issues.",
          "Raw screenshots are weak evidence without expected/actual context.",
          "Undocumented adjustments create hidden failure modes after handover.",
        ]
      ),
    ],
  },
};

export const CURATED_ILU_7_KEYS = Object.keys(CURATED_LESSON_ASSESSMENTS_ILU7);
