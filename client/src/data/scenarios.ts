/**
 * EAS Simulator Scenario Data
 * Each scenario has a full decision tree with branching paths,
 * consequences, scoring, and multiple possible outcomes.
 */

export interface DecisionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  consequence: string;
  scoreImpact: number;
  timeImpact: number;
  nextStepId: string | null;
  reading?: string; // voltage/signal reading shown after selection
}

export interface SimulatorStep {
  id: string;
  title: string;
  description: string;
  context: string;
  hint?: string;
  options: DecisionOption[];
}

export interface ScenarioData {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  type: string;
  duration: string;
  estimatedMinutes: number;
  description: string;
  initialCondition: string;
  equipment: string[];
  possibleFaults: string[];
  steps: SimulatorStep[];
  perfectScore: number;
  passingScore: number;
}

export const scenarioDatabase: ScenarioData[] = [
  // SCENARIO 1: Conveyor E-Stop Chain Open (Beginner)
  {
    id: "conveyor-estop",
    title: "Conveyor E-Stop Chain Open — Beginner",
    difficulty: "Beginner",
    type: "Safety Circuit",
    duration: "5-8 min",
    estimatedMinutes: 6,
    description: "A packaging line conveyor has stopped unexpectedly. The operator reports the system won't restart after pressing the START button. No alarms on the HMI other than 'Safety Circuit Open'.",
    initialCondition: "Conveyor stopped. HMI shows 'Safety Circuit Open'. Operator states they did NOT press any E-stop. Line has been down for 12 minutes.",
    equipment: ["Multimeter", "Prints", "Flashlight"],
    possibleFaults: ["E-stop chain break", "Safety relay fault", "Gate interlock failure", "Loose wiring at terminal block"],
    steps: [
      {
        id: "step-1",
        title: "Initial Assessment",
        description: "You arrive at the conveyor system. The HMI displays 'Safety Circuit Open' and the conveyor is completely stopped.",
        context: "The safety relay indicator on the panel is OFF (red). The main disconnect is ON. No obvious physical damage visible. Control voltage present at panel — 120VAC confirmed.",
        hint: "Start with the most common cause of safety circuit faults — check the physical E-stop devices first.",
        options: [
          {
            id: "1a",
            text: "Check all E-stop buttons in the circuit for tripped condition",
            isCorrect: true,
            consequence: "You systematically walk the line checking each E-stop. Station 3 E-stop is pulled out (tripped) but the operator at that station says they didn't press it.",
            scoreImpact: 15,
            timeImpact: 60,
            nextStepId: "step-2",
            reading: "Station 1: OK | Station 2: OK | Station 3: TRIPPED | Station 4: OK",
          },
          {
            id: "1b",
            text: "Go directly to the safety relay and try to reset it",
            isCorrect: false,
            consequence: "The safety relay won't reset because the circuit is still open. You've wasted time without identifying the root cause.",
            scoreImpact: -5,
            timeImpact: 90,
            nextStepId: "step-1-retry",
            reading: "Safety relay: FAULT — circuit open, cannot reset",
          },
          {
            id: "1c",
            text: "Check the PLC program for faults",
            isCorrect: false,
            consequence: "The PLC shows no program faults — the safety circuit is hardwired and independent of the PLC. This was the wrong diagnostic path.",
            scoreImpact: -10,
            timeImpact: 120,
            nextStepId: "step-1-retry",
            reading: "PLC: RUN mode, no faults. Safety circuit is hardwired — not PLC controlled.",
          },
        ],
      },
      {
        id: "step-1-retry",
        title: "Reassess the Situation",
        description: "Your initial approach didn't resolve the issue. The safety circuit is still open.",
        context: "Safety relay still showing fault. The circuit must have a physical break somewhere.",
        options: [
          {
            id: "1r-a",
            text: "Check all E-stop buttons in the circuit",
            isCorrect: true,
            consequence: "You find Station 3 E-stop is pulled out (tripped).",
            scoreImpact: 5,
            timeImpact: 60,
            nextStepId: "step-2",
            reading: "Station 3 E-stop: TRIPPED (extended position)",
          },
          {
            id: "1r-b",
            text: "Start checking wiring continuity from the panel",
            isCorrect: false,
            consequence: "You spend time tracing wires but eventually find the E-stop at Station 3 is tripped. Should have checked physical devices first.",
            scoreImpact: -5,
            timeImpact: 180,
            nextStepId: "step-2",
          },
        ],
      },
      {
        id: "step-2",
        title: "E-Stop Investigation",
        description: "Station 3 E-stop is in the tripped position. The operator denies pressing it.",
        context: "The E-stop mushroom button is extended (tripped position). There's noticeable vibration from the adjacent stamping press. The mounting bracket looks slightly loose — one bolt is missing.",
        hint: "Consider what could cause an E-stop to trip without human intervention.",
        options: [
          {
            id: "2a",
            text: "Reset the E-stop and check if the mounting is secure",
            isCorrect: true,
            consequence: "You twist-reset the E-stop. The mounting bracket has a missing bolt — vibration from the adjacent press is causing the button to work itself out. You secure the bracket with a new bolt.",
            scoreImpact: 20,
            timeImpact: 45,
            nextStepId: "step-3",
            reading: "E-stop reset successful. Mounting: 1 of 2 bolts missing. Vibration source: adjacent press, 3ft away.",
          },
          {
            id: "2b",
            text: "Replace the E-stop button assuming it's defective",
            isCorrect: false,
            consequence: "You replace the E-stop but the new one also trips after 20 minutes because the real issue is the loose mounting bracket causing vibration-induced trips.",
            scoreImpact: -15,
            timeImpact: 300,
            nextStepId: "step-3",
          },
          {
            id: "2c",
            text: "Just reset it and move on — operator probably bumped it",
            isCorrect: false,
            consequence: "You reset the E-stop and leave. It trips again 30 minutes later. You're called back. The loose bracket is the root cause.",
            scoreImpact: -20,
            timeImpact: 30,
            nextStepId: "step-3",
          },
        ],
      },
      {
        id: "step-3",
        title: "System Restart",
        description: "The E-stop issue has been addressed. Now you need to restart the system properly.",
        context: "E-stop is reset. Mounting bracket is secured. Safety relay panel is still showing fault.",
        options: [
          {
            id: "3a",
            text: "Reset the safety relay, verify the circuit is complete, then restart the conveyor",
            isCorrect: true,
            consequence: "You reset the safety relay — indicator goes green. You verify all E-stops are in the run position, then press START. Conveyor runs normally. You document the repair and submit a PM request for all E-stop mounts on the line.",
            scoreImpact: 20,
            timeImpact: 60,
            nextStepId: null,
            reading: "Safety relay: RESET — GREEN. All stations: RUN position. Conveyor: RUNNING at 45 FPM.",
          },
          {
            id: "3b",
            text: "Press START immediately without resetting the safety relay",
            isCorrect: false,
            consequence: "Nothing happens — the safety relay must be manually reset after a fault before the system will allow a start command. You then reset it properly.",
            scoreImpact: -5,
            timeImpact: 30,
            nextStepId: null,
            reading: "START command rejected. Safety relay requires manual reset.",
          },
        ],
      },
    ],
    perfectScore: 55,
    passingScore: 30,
  },

  // SCENARIO 2: Intermittent 24VDC Control Loss (Intermediate)
  {
    id: "24vdc-loss",
    title: "Intermittent 24VDC Control Loss",
    difficulty: "Intermediate",
    type: "Power Supply",
    duration: "8-12 min",
    estimatedMinutes: 10,
    description: "A palletizer is experiencing random stops. Operators report the HMI goes dark momentarily then comes back, but the machine faults out and requires a full restart. It happens 2-3 times per shift.",
    initialCondition: "Machine currently running. Last fault was 45 minutes ago. HMI fault log shows 'CPU Watchdog Timeout' and '24VDC Power Loss' events at the same timestamp. 24VDC power supply LED is currently green.",
    equipment: ["Multimeter", "Prints", "Flashlight"],
    possibleFaults: ["24VDC supply overloaded", "Loose terminal connection", "Failing power supply", "Shared circuit drawing too much current"],
    steps: [
      {
        id: "step-1",
        title: "Initial Assessment",
        description: "The machine is running now, but you need to find the intermittent 24VDC loss. The fault log shows the power loss correlates with the CPU watchdog timeout.",
        context: "24VDC supply: Phoenix Contact QUINT, rated 10A. Current output LED shows approximately 80% load. Supply output terminals show 23.8VDC. The supply feeds the PLC, HMI, I/O modules, and 12 proximity sensors.",
        hint: "An intermittent power loss under load often points to a supply at capacity or a loose connection that opens under thermal expansion.",
        options: [
          {
            id: "1a",
            text: "Measure actual current draw on the 24VDC supply and compare to rating",
            isCorrect: true,
            consequence: "You clamp-meter the output: 8.7A steady state on a 10A supply. That's 87% load — close to capacity. When the palletizer actuates its pneumatic valves (solenoids), the inrush could be pushing it over.",
            scoreImpact: 15,
            timeImpact: 60,
            nextStepId: "step-2",
            reading: "24VDC output: 23.8V | Load current: 8.7A / 10A rated (87%) | Inrush during valve cycle: ~11.2A peak",
          },
          {
            id: "1b",
            text: "Replace the 24VDC power supply with a new one",
            isCorrect: false,
            consequence: "You replace with the same 10A supply. It works for a shift, then the same fault returns. The supply isn't failing — it's overloaded during peak demand.",
            scoreImpact: -10,
            timeImpact: 240,
            nextStepId: "step-2",
          },
          {
            id: "1c",
            text: "Check all terminal connections on the 24VDC distribution block",
            isCorrect: false,
            consequence: "All connections are tight. The terminals aren't the issue. While checking connections is good practice, the fault pattern (correlating with machine cycles) suggests a load issue.",
            scoreImpact: 0,
            timeImpact: 120,
            nextStepId: "step-1-retry",
          },
        ],
      },
      {
        id: "step-1-retry",
        title: "Dig Deeper",
        description: "Connections are solid. The intermittent fault correlates with machine cycle timing. What else could cause a momentary 24VDC dropout?",
        context: "Terminals tight. Supply LED green. Fault happens during active machine cycles, not at idle.",
        options: [
          {
            id: "1r-a",
            text: "Measure current draw and monitor during a machine cycle",
            isCorrect: true,
            consequence: "Current spikes to 11.2A during the palletizer's clamp-and-lift sequence. The 10A supply is going into current limit and dropping voltage.",
            scoreImpact: 10,
            timeImpact: 90,
            nextStepId: "step-2",
            reading: "Peak current during clamp cycle: 11.2A (exceeds 10A rating). Voltage dip: 23.8V → 18.4V for 200ms.",
          },
          {
            id: "1r-b",
            text: "Add a UPS to the 24VDC circuit",
            isCorrect: false,
            consequence: "A UPS would mask the symptom but doesn't fix the root cause. The supply is undersized for the load.",
            scoreImpact: -10,
            timeImpact: 180,
            nextStepId: "step-2",
          },
        ],
      },
      {
        id: "step-2",
        title: "Load Analysis",
        description: "The 24VDC supply is overloaded during peak demand. The solenoid inrush is pushing it past its 10A rating, causing a voltage dropout that resets the PLC.",
        context: "Steady state: 8.7A. Peak during valve actuation: 11.2A. Supply rating: 10A. The supply goes into current-limit mode and voltage drops below PLC minimum (19.2VDC).",
        hint: "You need to either reduce the load or increase supply capacity.",
        options: [
          {
            id: "2a",
            text: "Add a second 24VDC supply dedicated to the solenoid valves, separating control and field power",
            isCorrect: true,
            consequence: "You spec a separate 5A supply for the 12 solenoid valves. PLC/HMI stay on the original supply (now at ~5A load). This is the correct engineering solution — separate control power from field device power.",
            scoreImpact: 20,
            timeImpact: 120,
            nextStepId: "step-3",
            reading: "Solution: Dedicated supply for field devices. Control supply load drops to 5.1A/10A (51%). Adequate headroom.",
          },
          {
            id: "2b",
            text: "Replace the 10A supply with a 20A supply",
            isCorrect: false,
            consequence: "A larger supply works but isn't best practice. If a field device shorts, the higher-capacity supply can deliver more fault current before tripping, potentially damaging wiring or components. Separating circuits is better.",
            scoreImpact: 5,
            timeImpact: 60,
            nextStepId: "step-3",
          },
          {
            id: "2c",
            text: "Add suppression diodes across each solenoid to reduce inrush",
            isCorrect: false,
            consequence: "Suppression diodes help with back-EMF but don't significantly reduce inrush current. The supply is still overloaded. This doesn't solve the core problem.",
            scoreImpact: -5,
            timeImpact: 180,
            nextStepId: "step-2",
          },
        ],
      },
      {
        id: "step-3",
        title: "Implementation & Verification",
        description: "You've identified the solution. Now implement and verify the fix eliminates the intermittent fault.",
        context: "New supply installed and wired to solenoid bank. Original supply now only feeds PLC, HMI, and I/O modules.",
        options: [
          {
            id: "3a",
            text: "Monitor both supplies during multiple machine cycles, verify no voltage dips, run for a full shift before closing the work order",
            isCorrect: true,
            consequence: "Control supply holds steady at 24.1VDC during all cycles. Field supply handles solenoid inrush without dropout. Machine runs a full shift with zero faults. You document the root cause and fix for the maintenance records.",
            scoreImpact: 20,
            timeImpact: 120,
            nextStepId: null,
            reading: "Control supply: 24.1V steady (no dips). Field supply: 23.6V during peak (acceptable). 8-hour run: ZERO faults.",
          },
          {
            id: "3b",
            text: "Run one cycle to confirm, then close the work order",
            isCorrect: false,
            consequence: "One cycle looks good, but intermittent faults need extended monitoring to confirm the fix. If it fails again on night shift, you'll be called back.",
            scoreImpact: -5,
            timeImpact: 30,
            nextStepId: null,
          },
        ],
      },
    ],
    perfectScore: 55,
    passingScore: 30,
  },

  // SCENARIO 3: VFD Trips During Ramp-Up (Intermediate)
  {
    id: "vfd-ramp",
    title: "VFD Trips During Ramp-Up",
    difficulty: "Intermediate",
    type: "Drives",
    duration: "10-15 min",
    estimatedMinutes: 12,
    description: "A PowerFlex 525 on a large exhaust fan trips on 'Overcurrent' fault (F012) every time it tries to ramp up to full speed. It starts fine but faults at approximately 42Hz. The fan was working normally until yesterday's PM where the motor coupling was replaced.",
    initialCondition: "VFD faulted: F012 Overcurrent at 42Hz. Motor: 25HP, 460V, 32A FLA. Drive rated 30HP. Fan is a centrifugal type — load increases with speed cubed. Coupling was just replaced during PM.",
    equipment: ["Multimeter", "Prints", "Flashlight"],
    possibleFaults: ["Coupling misalignment", "Motor bearing failure", "VFD accel time too fast", "Incorrect motor parameters after reset"],
    steps: [
      {
        id: "step-1",
        title: "Initial Assessment",
        description: "The VFD faults at 42Hz during ramp-up. This started after a coupling replacement. You need to determine if the issue is mechanical or electrical.",
        context: "Drive display: F012 Overcurrent. Last run: reached 42Hz, current was 38A (FLA is 32A) at fault. Accel time parameter: 10 seconds. Fan is centrifugal — load increases with cube of speed.",
        hint: "The fault started after a coupling replacement. Consider what could have changed mechanically. Also consider if the accel time is appropriate for a centrifugal fan load.",
        options: [
          {
            id: "1a",
            text: "Check the VFD accel time parameter and compare to what it was before the PM",
            isCorrect: true,
            consequence: "Accel time is set to 10 seconds. You check the PM records — before the coupling job, it was 30 seconds. Someone reset the drive parameters during the PM and the accel time defaulted to 10s. A centrifugal fan needs longer ramp time due to the cube-law load curve.",
            scoreImpact: 20,
            timeImpact: 60,
            nextStepId: "step-2",
            reading: "Current accel time: 10 sec (default). Previous accel time: 30 sec. Fan load curve: torque ∝ speed³.",
          },
          {
            id: "1b",
            text: "Check the coupling alignment with a straightedge",
            isCorrect: false,
            consequence: "Coupling alignment looks acceptable — within tolerance. The mechanical PM work was done correctly. The issue is in the drive parameters, not the coupling.",
            scoreImpact: -5,
            timeImpact: 120,
            nextStepId: "step-1-retry",
          },
          {
            id: "1c",
            text: "Megger the motor to check for a winding fault",
            isCorrect: false,
            consequence: "Motor insulation tests good at >500MΩ. The motor is fine. The overcurrent is from trying to accelerate too fast, not from a motor fault.",
            scoreImpact: -10,
            timeImpact: 180,
            nextStepId: "step-1-retry",
          },
        ],
      },
      {
        id: "step-1-retry",
        title: "Reconsider the Evidence",
        description: "The motor and coupling are fine mechanically. The fault started after the PM. Think about what else could have changed.",
        context: "Motor: good. Coupling: aligned. Fault occurs at 42Hz during ramp. The PM crew had to power down the drive to lock out for coupling work.",
        options: [
          {
            id: "1r-a",
            text: "Check if VFD parameters were reset during the PM power-down",
            isCorrect: true,
            consequence: "The accel time is at 10s (factory default) instead of the 30s it should be. Parameters were lost or reset during the PM.",
            scoreImpact: 10,
            timeImpact: 60,
            nextStepId: "step-2",
            reading: "Accel time: 10s (should be 30s). Motor params: correct. Other params: some at defaults.",
          },
          {
            id: "1r-b",
            text: "Increase the overcurrent trip level on the VFD",
            isCorrect: false,
            consequence: "Raising the trip level is dangerous — it removes motor protection. The current is high because the ramp is too aggressive, not because the trip is set wrong.",
            scoreImpact: -15,
            timeImpact: 30,
            nextStepId: "step-2",
          },
        ],
      },
      {
        id: "step-2",
        title: "Parameter Correction",
        description: "The VFD accel time was reset to 10 seconds (factory default) during the PM. For a centrifugal fan, this is too aggressive — the load increases with the cube of speed.",
        context: "At 42Hz (70% speed), the fan load is already at 34% of full-speed torque. With only 10s to reach 60Hz, the drive can't supply enough current without tripping. Need 30s minimum for this fan.",
        hint: "Restore the correct accel time and verify other critical parameters weren't also reset.",
        options: [
          {
            id: "2a",
            text: "Restore accel time to 30 seconds and verify all other motor/application parameters match the documented settings",
            isCorrect: true,
            consequence: "You set accel time to 30s. You also verify motor nameplate data, decel time (45s for this fan to avoid overvoltage), current limit, and all application parameters against the documented backup. Two other parameters were also at defaults — you correct them.",
            scoreImpact: 20,
            timeImpact: 90,
            nextStepId: "step-3",
            reading: "Accel: 30s ✓ | Decel: 45s ✓ | Motor FLA: 32A ✓ | Current limit: 40A ✓ | All params verified against backup.",
          },
          {
            id: "2b",
            text: "Just change the accel time to 30 seconds and test",
            isCorrect: false,
            consequence: "The fan ramps up successfully now. But you didn't check other parameters — the decel time is also at default (10s). When the fan stops, the regenerative energy causes an overvoltage fault. You have to go back and fix more parameters.",
            scoreImpact: 5,
            timeImpact: 60,
            nextStepId: "step-3",
          },
        ],
      },
      {
        id: "step-3",
        title: "Test Run & Documentation",
        description: "Parameters are restored. Time to test the fan and verify normal operation.",
        context: "All parameters verified against documented backup. Ready to clear fault and test run.",
        options: [
          {
            id: "3a",
            text: "Clear the fault, ramp to full speed while monitoring current, verify steady-state operation, then document the root cause and recommend parameter backup procedures",
            isCorrect: true,
            consequence: "Fan ramps smoothly to 60Hz in 30 seconds. Current peaks at 29A during accel (within limits) and settles to 27A at full speed. You document: 'Root cause: VFD parameters reset to factory defaults during PM power-down. Recommend: backup parameters before any drive power-down, add parameter sheet to PM checklist.'",
            scoreImpact: 20,
            timeImpact: 120,
            nextStepId: null,
            reading: "Ramp: 0→60Hz in 30s (smooth). Peak current: 29A. Steady state: 27A / 32A FLA. Vibration: normal. Bearing temp: 142°F (normal).",
          },
          {
            id: "3b",
            text: "Clear the fault and let production restart without monitoring",
            isCorrect: false,
            consequence: "The fan starts fine, but without monitoring you miss that the current is slightly high (30A vs expected 27A). A belt tension issue from the PM is adding load. It'll work for now but the belt will wear prematurely.",
            scoreImpact: -5,
            timeImpact: 30,
            nextStepId: null,
          },
        ],
      },
    ],
    perfectScore: 60,
    passingScore: 30,
  },

  // SCENARIO 4: Motor Starter Chatter Condition (Advanced)
  {
    id: "starter-chatter",
    title: "Motor Starter Chatter Condition",
    difficulty: "Advanced",
    type: "Motor Control",
    duration: "15-20 min",
    estimatedMinutes: 17,
    description: "A 10HP mixer motor starter is 'chattering' — the contactor is rapidly engaging and disengaging, creating a loud buzzing sound. The mixer is critical for a batch process that's currently timing out. Operators report it started gradually over the past week and is now constant.",
    initialCondition: "Contactor buzzing/chattering audibly. Motor attempts to start but immediately drops out, repeatedly. OL not tripped. Control voltage at panel: 118VAC. Contactor is a Size 2 NEMA, approximately 8 years old. The issue is worse during peak production hours.",
    equipment: ["Multimeter", "Prints", "Flashlight"],
    possibleFaults: ["Low control voltage", "Contactor coil degraded", "Weak contact spring", "Voltage drop in control circuit", "Shared control transformer overloaded"],
    steps: [
      {
        id: "step-1",
        title: "Initial Assessment",
        description: "The contactor is chattering — rapidly pulling in and dropping out. You can hear the distinctive buzzing. The motor tries to start but can't maintain contact.",
        context: "Panel voltage reads 118VAC at the incoming lugs. Contactor coil is rated 120VAC. The chatter is consistent — about 4-5 cycles per second. You notice the panel is warm. There are 6 other starters in this MCC section, 3 currently running.",
        hint: "Contactor chatter is almost always a voltage issue — either the coil voltage is too low to hold the armature, or the coil/armature is mechanically worn. Measure voltage AT THE COIL during the chatter.",
        options: [
          {
            id: "1a",
            text: "Measure voltage directly at the contactor coil terminals while it's chattering",
            isCorrect: true,
            consequence: "You measure at the coil: voltage is fluctuating between 92-105VAC during chatter. That's well below the 120VAC needed to hold the armature sealed. But panel incoming is 118V — there's a significant voltage drop in the control circuit.",
            scoreImpact: 20,
            timeImpact: 45,
            nextStepId: "step-2",
            reading: "Coil voltage during chatter: 92-105VAC (fluctuating). Panel incoming: 118VAC. Voltage drop: 13-26V in control circuit.",
          },
          {
            id: "1b",
            text: "Replace the contactor — it's 8 years old and probably worn out",
            isCorrect: false,
            consequence: "You install a new contactor. It also chatters. The issue isn't the contactor — it's the voltage feeding it. You've wasted time and a contactor.",
            scoreImpact: -15,
            timeImpact: 300,
            nextStepId: "step-2",
            reading: "New contactor installed — same chatter condition. Issue is upstream.",
          },
          {
            id: "1c",
            text: "Check the overload relay and heater elements",
            isCorrect: false,
            consequence: "OL relay is not tripped and heaters are correctly sized. The OL isn't causing the chatter — the contactor can't even stay sealed long enough for the motor to draw current.",
            scoreImpact: -5,
            timeImpact: 90,
            nextStepId: "step-1-retry",
          },
        ],
      },
      {
        id: "step-1-retry",
        title: "Focus on the Chatter",
        description: "The OL is fine. The contactor is chattering because it can't stay sealed. What prevents a contactor from sealing?",
        context: "Chatter = armature can't hold. Either insufficient magnetic force (low voltage) or mechanical resistance (worn/binding). The issue got worse over time and is worse during peak hours.",
        options: [
          {
            id: "1r-a",
            text: "Measure voltage at the coil during chatter",
            isCorrect: true,
            consequence: "Coil voltage: 92-105VAC fluctuating. Far below the 120VAC rating. The coil can't generate enough magnetic force to hold the armature.",
            scoreImpact: 10,
            timeImpact: 45,
            nextStepId: "step-2",
            reading: "Coil voltage: 92-105VAC. Required: 110VAC minimum to seal.",
          },
          {
            id: "1r-b",
            text: "Manually push the contactor armature in to check for mechanical binding",
            isCorrect: false,
            consequence: "UNSAFE with power on! Never manually force a contactor while energized. De-energize first if checking mechanical condition. Also, the armature moves freely — it's not binding.",
            scoreImpact: -20,
            timeImpact: 30,
            nextStepId: "step-2",
          },
        ],
      },
      {
        id: "step-2",
        title: "Voltage Drop Investigation",
        description: "There's a 13-26V drop between the panel incoming (118V) and the coil (92-105V). You need to find where the voltage is being lost.",
        context: "Control circuit path: Control transformer → Fuse → Control relay contact → OL NC contact → Coil. You need to measure at each point to find the drop. The issue is worse during peak hours when more starters are running.",
        hint: "A voltage drop that gets worse under load and during peak hours suggests either a shared source being overloaded or a high-resistance connection.",
        options: [
          {
            id: "2a",
            text: "Measure voltage at the control transformer secondary while all starters are running",
            isCorrect: true,
            consequence: "Control transformer secondary: 109VAC under load. It's a 150VA transformer feeding 7 starter coils. When 4+ coils are energized simultaneously, the transformer is overloaded and voltage sags. The transformer is undersized for the load that's been added over the years.",
            scoreImpact: 20,
            timeImpact: 90,
            nextStepId: "step-3",
            reading: "CT secondary: 109VAC (loaded, 4 coils energized). CT rating: 150VA. Actual load: ~185VA. Overloaded by 23%.",
          },
          {
            id: "2b",
            text: "Check each connection point in the control circuit for high resistance",
            isCorrect: false,
            consequence: "You find a slightly warm connection at the control relay, but tightening it only gains 2V. The main issue is the transformer being overloaded — individual connection resistance is a minor contributor.",
            scoreImpact: 5,
            timeImpact: 120,
            nextStepId: "step-2-b",
          },
          {
            id: "2c",
            text: "Boost the voltage by tapping up the control transformer",
            isCorrect: false,
            consequence: "Tapping up would raise voltage for ALL circuits, potentially over-volting coils when fewer starters are running. This masks the problem and could damage other coils. The transformer needs to be properly sized.",
            scoreImpact: -10,
            timeImpact: 60,
            nextStepId: "step-3",
          },
        ],
      },
      {
        id: "step-2-b",
        title: "Continue Investigating",
        description: "The connection helped slightly but the chatter persists. The voltage is still too low at the coil.",
        context: "Gained 2V from tightening connection. Coil now sees ~97-107V. Still chattering. Need to find the main source of the voltage drop.",
        options: [
          {
            id: "2b-a",
            text: "Check the control transformer loading — measure VA output vs rating",
            isCorrect: true,
            consequence: "Transformer is 150VA but you calculate 185VA of connected coil load. It's been overloaded since two additional starters were added 3 years ago without upsizing the transformer.",
            scoreImpact: 15,
            timeImpact: 60,
            nextStepId: "step-3",
            reading: "CT: 150VA rated. Connected load: 7 coils × 26VA = 182VA + indicator lights = ~185VA total. Overloaded.",
          },
          {
            id: "2b-b",
            text: "Replace the contactor coil with a 110V rated coil for more margin",
            isCorrect: false,
            consequence: "There's no standard 110V coil for this contactor. And even if there were, it would still chatter at 92V. The source voltage needs to be fixed, not the coil rating.",
            scoreImpact: -10,
            timeImpact: 120,
            nextStepId: "step-3",
          },
        ],
      },
      {
        id: "step-3",
        title: "Root Cause Resolution",
        description: "The control transformer is overloaded — 185VA load on a 150VA transformer. When multiple starters are energized, voltage sags below the minimum coil holding voltage, causing chatter on the last contactor to pull in.",
        context: "Solution needed: either reduce load or increase transformer capacity. This is a design/capacity issue that developed over time as equipment was added.",
        options: [
          {
            id: "3a",
            text: "Replace the 150VA control transformer with a 250VA unit, verify voltage at all coils under full load, and document the root cause",
            isCorrect: true,
            consequence: "You install a 250VA transformer. Under full load (all 7 starters energized), secondary voltage holds at 117VAC. All coils receive adequate voltage. Chatter eliminated. You document: 'Root cause: control transformer undersized for added loads. Added starters in 2023 without upgrading CT. Replaced 150VA with 250VA.'",
            scoreImpact: 20,
            timeImpact: 180,
            nextStepId: null,
            reading: "New CT: 250VA. Full load voltage: 117VAC. All coils: 114-117VAC. Chatter: ELIMINATED. Headroom: 35%.",
          },
          {
            id: "3b",
            text: "Add a second small control transformer for just this starter",
            isCorrect: false,
            consequence: "This works for this one starter but doesn't address the systemic issue. The next starter added will have the same problem. And now you have two transformers to maintain. Better to properly size one transformer for the full load.",
            scoreImpact: 5,
            timeImpact: 120,
            nextStepId: null,
          },
          {
            id: "3c",
            text: "Remove two of the indicator lights to reduce load below 150VA",
            isCorrect: false,
            consequence: "Removing indicator lights saves maybe 10VA — not enough. And you're removing useful diagnostic indicators to band-aid a capacity problem. The transformer needs to be upsized.",
            scoreImpact: -10,
            timeImpact: 60,
            nextStepId: null,
          },
        ],
      },
    ],
    perfectScore: 60,
    passingScore: 30,
  },

  // SCENARIO 5: Case Packer Won't Reset After Jam (Intermediate)
  {
    id: "case-packer-jam",
    title: "Case Packer Won't Reset After Jam",
    difficulty: "Intermediate",
    type: "Packaging",
    duration: "8-12 min",
    estimatedMinutes: 10,
    description: "A case packer jammed during a product changeover. Maintenance cleared the jam, but the machine won't reset. The HMI shows 'Jam Fault Active' even though the jam is physically cleared. Operators are waiting.",
    initialCondition: "Jam physically cleared. All guards closed. HMI still shows 'Jam Fault Active'. Reset button on the panel does nothing. Machine has been down for 22 minutes.",
    equipment: ["Multimeter", "Prints", "Flashlight"],
    possibleFaults: ["Photoeye blocked by debris", "Proximity sensor misaligned after jam", "PLC input stuck", "Guard interlock not fully seated"],
    steps: [
      {
        id: "step-1",
        title: "Initial Assessment",
        description: "The jam has been cleared but the machine won't reset. The HMI fault message persists.",
        context: "The jam occurred at the case erector section. Product was physically removed. All guards are closed. The RESET button on the panel illuminates when pressed but the fault doesn't clear. PLC is in RUN mode.",
        hint: "If a fault won't clear after the physical issue is resolved, a sensor is likely still seeing the fault condition.",
        options: [
          {
            id: "1a",
            text: "Check the PLC I/O status to see which input is still holding the fault active",
            isCorrect: true,
            consequence: "You open the PLC I/O monitor. Input I:3/7 labeled 'Case Erector Jam Detect' is still ON even though the jam is cleared. This is a photoeye input — something is still blocking it or it's misaligned.",
            scoreImpact: 15,
            timeImpact: 45,
            nextStepId: "step-2",
            reading: "PLC I/O: I:3/7 'Case Erector Jam Detect' = ON (active). All other jam inputs = OFF (clear)."
          },
          {
            id: "1b",
            text: "Power cycle the machine to force a full reset",
            isCorrect: false,
            consequence: "You power cycle the entire machine. It takes 4 minutes to reboot the HMI and PLC. When it comes back up, the same fault reappears immediately because the sensor is still triggered.",
            scoreImpact: -10,
            timeImpact: 240,
            nextStepId: "step-1-retry",
            reading: "System rebooted. Fault reappears on startup: 'Jam Fault Active' — I:3/7 still ON."
          },
          {
            id: "1c",
            text: "Check all guard interlocks and safety switches",
            isCorrect: false,
            consequence: "All guards are closed and interlocks are made. The safety circuit is complete — this isn't a guard issue. The fault is specifically a jam detection sensor.",
            scoreImpact: -5,
            timeImpact: 90,
            nextStepId: "step-1-retry",
            reading: "All guard interlocks: CLOSED. Safety circuit: COMPLETE. Issue is jam detection, not safety."
          }
        ]
      },
      {
        id: "step-1-retry",
        title: "Refocus on the Fault",
        description: "The machine rebooted or guards checked — fault persists. Something is still triggering the jam detection.",
        context: "The fault is tied to a specific sensor input. You need to find which sensor and why it's still active.",
        options: [
          {
            id: "1r-a",
            text: "Check PLC I/O status to identify which jam sensor is still active",
            isCorrect: true,
            consequence: "I:3/7 'Case Erector Jam Detect' is ON. This is a retroreflective photoeye at the erector section.",
            scoreImpact: 10,
            timeImpact: 45,
            nextStepId: "step-2",
            reading: "I:3/7 = ON. Photoeye PE-307 at case erector."
          },
          {
            id: "1r-b",
            text: "Call the OEM tech support line for help",
            isCorrect: false,
            consequence: "OEM puts you on hold for 15 minutes, then tells you to check the jam detection sensors. You could have done this yourself.",
            scoreImpact: -5,
            timeImpact: 900,
            nextStepId: "step-2"
          }
        ]
      },
      {
        id: "step-2",
        title: "Sensor Investigation",
        description: "Photoeye PE-307 at the case erector is still showing 'blocked' even though the jam is cleared.",
        context: "PE-307 is a retroreflective photoeye mounted on the frame. The reflector is on the opposite side. The indicator LED on the sensor is solid ON (detecting an obstruction). You can see the reflector from the sensor side — the path looks clear visually.",
        hint: "Retroreflective photoeyes need a clean reflector and clear path. After a jam, debris or product residue can block the beam even if the large pieces are removed.",
        options: [
          {
            id: "2a",
            text: "Clean the photoeye lens and reflector — check for debris in the beam path",
            isCorrect: true,
            consequence: "You wipe the photoeye lens — it's clean. You check the reflector and find a strip of packing tape stuck across it from the jammed case. You peel it off. The sensor LED goes OFF immediately. Fault clears.",
            scoreImpact: 20,
            timeImpact: 30,
            nextStepId: "step-3",
            reading: "Reflector: packing tape debris blocking beam. Removed. PE-307 LED: OFF. I:3/7 = OFF. Fault cleared."
          },
          {
            id: "2b",
            text: "Replace the photoeye — it might be damaged from the jam",
            isCorrect: false,
            consequence: "You replace the photoeye with a spare. The new one also shows 'blocked' because the reflector still has tape on it. The sensor wasn't the problem — the beam path was obstructed.",
            scoreImpact: -10,
            timeImpact: 300,
            nextStepId: "step-2-retry",
            reading: "New sensor installed — still showing BLOCKED. Issue is in the beam path, not the sensor."
          },
          {
            id: "2c",
            text: "Bypass the sensor input in the PLC to get the machine running",
            isCorrect: false,
            consequence: "UNSAFE! Bypassing a jam detection sensor means the machine can't detect future jams. Product could pile up and cause mechanical damage or a safety hazard. Never bypass protective sensors.",
            scoreImpact: -20,
            timeImpact: 30,
            nextStepId: "step-2-retry",
            reading: "SAFETY VIOLATION: Jam detection bypassed. Machine runs but cannot detect future jams."
          }
        ]
      },
      {
        id: "step-2-retry",
        title: "Sensor Still Blocked",
        description: "The photoeye is still showing an obstruction. You need to investigate the beam path more carefully.",
        context: "The sensor or its replacement is still reading 'blocked'. The physical jam was cleared but something in the beam path is still interrupting it.",
        options: [
          {
            id: "2r-a",
            text: "Inspect and clean the reflector surface",
            isCorrect: true,
            consequence: "You find a strip of clear packing tape across the reflector. It's nearly invisible but enough to scatter the beam. You remove it and the sensor clears.",
            scoreImpact: 10,
            timeImpact: 30,
            nextStepId: "step-3",
            reading: "Tape removed from reflector. Beam restored. Sensor: CLEAR."
          },
          {
            id: "2r-b",
            text: "Adjust the sensor alignment",
            isCorrect: false,
            consequence: "You adjust the sensor angle and it momentarily clears, but it's unreliable because the tape is still partially blocking the reflector. The real fix is cleaning the reflector.",
            scoreImpact: -5,
            timeImpact: 120,
            nextStepId: "step-3"
          }
        ]
      },
      {
        id: "step-3",
        title: "System Restart and Prevention",
        description: "The photoeye is now clear. You need to restart the machine and prevent recurrence.",
        context: "PE-307 is reading clear. The HMI fault has cleared. The machine is ready to restart.",
        options: [
          {
            id: "3a",
            text: "Reset the machine, verify operation through one full cycle, and add reflector cleaning to the changeover checklist",
            isCorrect: true,
            consequence: "Machine resets cleanly. You run one full case through — perfect operation. You add 'Clean all photoeye reflectors' to the changeover procedure and label PE-307 with its function for future reference.",
            scoreImpact: 20,
            timeImpact: 120,
            nextStepId: null,
            reading: "Machine: RUNNING. First case: PASS. Changeover checklist updated. Total downtime: resolved."
          },
          {
            id: "3b",
            text: "Just hit reset and walk away — it's running",
            isCorrect: false,
            consequence: "The machine runs but you missed the opportunity to prevent recurrence. This same issue will happen again at the next changeover. No documentation, no process improvement.",
            scoreImpact: 0,
            timeImpact: 15,
            nextStepId: null,
            reading: "Machine running. No preventive action taken. Issue will likely recur."
          }
        ]
      }
    ],
    perfectScore: 55,
    passingScore: 30,
  },

  // SCENARIO 6: Palletizer Safety Gate Fault (Advanced)
  {
    id: "palletizer-safety-gate",
    title: "Palletizer Safety Gate Fault",
    difficulty: "Advanced",
    type: "Safety Systems",
    duration: "12-18 min",
    estimatedMinutes: 15,
    description: "A robotic palletizer won't restart after a routine pallet change. The safety system shows 'Gate Fault' but all gates appear closed. The robot is in a safe position. Production is backed up on three upstream lines.",
    initialCondition: "Robot in home position. All physical gates closed and latched. Safety PLC shows 'Zone 2 Gate Fault'. Main safety relay is tripped. Light curtain at infeed is active (green). Pressure is building — 3 lines are backing up.",
    equipment: ["Multimeter", "Prints", "Flashlight"],
    possibleFaults: ["Safety switch wiring fault", "Interlock actuator misaligned", "Safety PLC input failure", "Door switch contact degradation"],
    steps: [
      {
        id: "step-1",
        title: "Initial Assessment",
        description: "The palletizer won't restart. Safety system shows 'Zone 2 Gate Fault' but all gates look closed. Three upstream lines are backing up.",
        context: "Zone 2 has two access gates: Gate 2A (operator side) and Gate 2B (maintenance side). Both appear physically closed and latched. Each gate has a coded safety switch (Schmersal type) with dual-channel monitoring. The safety PLC is an Allen-Bradley GuardLogix.",
        hint: "Coded safety switches have an actuator (tongue) that inserts into the switch body. Even if the gate looks closed, the actuator may not be fully engaging the switch.",
        options: [
          {
            id: "1a",
            text: "Check the safety PLC diagnostics to identify which specific gate and channel is faulting",
            isCorrect: true,
            consequence: "You access the GuardLogix safety I/O. Gate 2B shows Channel 1: ON, Channel 2: OFF. A dual-channel mismatch — the safety PLC sees this as a fault condition because both channels must agree.",
            scoreImpact: 15,
            timeImpact: 60,
            nextStepId: "step-2",
            reading: "Gate 2A: Ch1=ON, Ch2=ON (OK). Gate 2B: Ch1=ON, Ch2=OFF (MISMATCH FAULT). Discrepancy time exceeded."
          },
          {
            id: "1b",
            text: "Open and close all gates to try to reseat the switches",
            isCorrect: false,
            consequence: "You open and close both gates. Gate 2A clears fine but Gate 2B still faults after closing. The issue is specific to Gate 2B's switch — opening and closing doesn't fix a wiring or contact issue.",
            scoreImpact: -5,
            timeImpact: 120,
            nextStepId: "step-1-retry",
            reading: "Gate 2B: still faulting after re-close. Physical latch engages but safety switch doesn't fully make."
          },
          {
            id: "1c",
            text: "Reset the safety PLC and try to restart",
            isCorrect: false,
            consequence: "The safety PLC won't allow a reset while an input fault is active. Safety systems are designed to prevent bypassing — you must fix the input condition first.",
            scoreImpact: -10,
            timeImpact: 60,
            nextStepId: "step-1-retry",
            reading: "Safety PLC: RESET REJECTED — active fault on Zone 2 input. Must clear fault condition before reset."
          }
        ]
      },
      {
        id: "step-1-retry",
        title: "Identify the Specific Fault",
        description: "The gate manipulation didn't help and the safety PLC won't reset. You need to identify exactly what's wrong.",
        context: "Gate 2B is the problem gate. The physical latch engages but the safety system still sees a fault.",
        options: [
          {
            id: "1r-a",
            text: "Access safety PLC diagnostics to check channel status on Gate 2B",
            isCorrect: true,
            consequence: "Gate 2B: Channel 1 ON, Channel 2 OFF. Dual-channel mismatch. One contact in the switch is not making.",
            scoreImpact: 10,
            timeImpact: 60,
            nextStepId: "step-2",
            reading: "Gate 2B: Ch1=ON, Ch2=OFF. Mismatch fault."
          },
          {
            id: "1r-b",
            text: "Replace the entire safety switch on Gate 2B",
            isCorrect: false,
            consequence: "You could replace it, but coded safety switches are expensive ($400+) and take time to install. Better to diagnose first — it might be a simple alignment issue.",
            scoreImpact: -5,
            timeImpact: 600,
            nextStepId: "step-3"
          }
        ]
      },
      {
        id: "step-2",
        title: "Gate 2B Switch Investigation",
        description: "Gate 2B has a dual-channel mismatch: Channel 1 is made but Channel 2 is not. The gate is physically closed and latched.",
        context: "The Schmersal coded switch has a body (mounted on frame) and an actuator tongue (mounted on gate). When the gate closes, the tongue inserts into the body and activates both internal contacts. If the tongue doesn't fully insert, one contact may make before the other — or only one makes.",
        hint: "Check the physical alignment of the actuator tongue relative to the switch body. Even 2-3mm of misalignment can cause partial engagement.",
        options: [
          {
            id: "2a",
            text: "Inspect the actuator tongue alignment and insertion depth on Gate 2B",
            isCorrect: true,
            consequence: "You examine the switch closely with your flashlight. The gate hinge has sagged slightly — the actuator tongue is entering the switch body at a slight angle and only inserting about 15mm instead of the required 20mm. Channel 1 contact makes at 12mm, Channel 2 at 18mm. It's a mechanical alignment issue.",
            scoreImpact: 20,
            timeImpact: 60,
            nextStepId: "step-3",
            reading: "Tongue insertion: ~15mm (required: 20mm min). Hinge sag: 3mm drop at latch side. Ch1 makes at 12mm, Ch2 at 18mm — explains mismatch."
          },
          {
            id: "2b",
            text: "Check wiring continuity on Channel 2 back to the safety PLC",
            isCorrect: false,
            consequence: "Wiring checks out fine — continuity is good from switch to PLC. The issue isn't wiring, it's mechanical. The switch contact itself isn't being activated because the tongue isn't fully inserted.",
            scoreImpact: 0,
            timeImpact: 180,
            nextStepId: "step-2-retry",
            reading: "Wiring: Ch2 continuity OK from switch terminal to PLC input. Issue is at the switch mechanism, not wiring."
          },
          {
            id: "2c",
            text: "Jumper Channel 2 to get the machine running while you order a new switch",
            isCorrect: false,
            consequence: "CRITICAL SAFETY VIOLATION! Never jumper safety switch channels. This defeats the dual-channel redundancy designed to protect personnel. If Channel 1 fails later, there's no backup. This could result in serious injury.",
            scoreImpact: -25,
            timeImpact: 15,
            nextStepId: "step-2-retry",
            reading: "SAFETY VIOLATION: Jumpering safety channels defeats redundancy. Risk of serious injury. OSHA recordable."
          }
        ]
      },
      {
        id: "step-2-retry",
        title: "Mechanical Investigation",
        description: "The wiring is fine. The issue must be at the switch itself. Why would one channel make and not the other?",
        context: "Both channels are in the same switch body. If wiring is good, the switch mechanism must not be fully actuating.",
        options: [
          {
            id: "2r-a",
            text: "Check actuator tongue alignment and insertion depth",
            isCorrect: true,
            consequence: "The tongue is only inserting 15mm due to hinge sag. Channel 2 needs 18mm to make. Alignment issue confirmed.",
            scoreImpact: 15,
            timeImpact: 60,
            nextStepId: "step-3",
            reading: "Insertion: 15mm. Required for Ch2: 18mm. Hinge sag: 3mm."
          },
          {
            id: "2r-b",
            text: "Slam the gate harder to force the tongue in deeper",
            isCorrect: false,
            consequence: "Forcing the gate risks damaging the switch body, the actuator, or the gate frame. And it's not a sustainable fix — the hinge sag will still be there.",
            scoreImpact: -10,
            timeImpact: 30,
            nextStepId: "step-3"
          }
        ]
      },
      {
        id: "step-3",
        title: "Repair and Verification",
        description: "The gate hinge has sagged 3mm, preventing full actuator engagement. You need to fix this and verify the safety system.",
        context: "The hinge bolts are accessible. You can shim the hinge or adjust the switch mounting to compensate. The safety system requires both channels to agree within 500ms of gate closure.",
        options: [
          {
            id: "3a",
            text: "Shim the hinge to restore alignment, verify both channels make within spec, reset safety PLC, and test 3 open/close cycles",
            isCorrect: true,
            consequence: "You add a 3mm shim under the lower hinge. Gate now closes with full tongue insertion (22mm). Both channels make simultaneously. Safety PLC resets cleanly. You test 3 cycles — all pass. You document the repair and add hinge inspection to the quarterly PM.",
            scoreImpact: 20,
            timeImpact: 300,
            nextStepId: null,
            reading: "Shimmed: +3mm. Insertion: 22mm. Ch1: ON, Ch2: ON. Safety PLC: RESET OK. 3/3 test cycles: PASS. PM updated."
          },
          {
            id: "3b",
            text: "Move the switch body down 3mm to match the sagged gate position",
            isCorrect: false,
            consequence: "This works but now the switch is at the edge of its mounting slot. If the hinge sags further (it will), you'll have the same problem with no more adjustment room. Better to fix the hinge — address root cause.",
            scoreImpact: 5,
            timeImpact: 180,
            nextStepId: null,
            reading: "Switch moved. Currently working but at limit of adjustment. Hinge sag not addressed — will recur."
          },
          {
            id: "3c",
            text: "Replace the hinge entirely",
            isCorrect: false,
            consequence: "A full hinge replacement is a 2-hour job requiring the gate to be removed. A shim takes 10 minutes and fully restores alignment. The hinge isn't broken — it just needs the sag compensated.",
            scoreImpact: 0,
            timeImpact: 7200,
            nextStepId: null,
            reading: "Hinge replacement: 2+ hours. Excessive for 3mm sag that a shim resolves in 10 minutes."
          }
        ]
      }
    ],
    perfectScore: 55,
    passingScore: 30,
  },

  // SCENARIO 7: Photoeye False Triggering (Beginner)
  {
    id: "photoeye-false-trigger",
    title: "Photoeye False Triggering",
    difficulty: "Beginner",
    type: "Sensors",
    duration: "5-8 min",
    estimatedMinutes: 7,
    description: "A case conveyor keeps stopping randomly. The HMI shows 'Product Jam at Zone 3' but there's no actual jam. Operators clear the fault and it runs for 2-10 minutes before faulting again. It started this morning after the weekend.",
    initialCondition: "Conveyor currently stopped on 'Zone 3 Jam' fault. No product in Zone 3. Photoeye PE-12 at Zone 3 is the jam detection sensor. The sensor LED is flickering between ON and OFF rapidly.",
    equipment: ["Multimeter", "Prints", "Flashlight"],
    possibleFaults: ["Dirty photoeye lens", "Sunlight interference", "Reflector contamination", "Sensor sensitivity drift"],
    steps: [
      {
        id: "step-1",
        title: "Initial Assessment",
        description: "The conveyor keeps faulting on a phantom jam. PE-12 is flickering — sometimes seeing an obstruction that isn't there.",
        context: "PE-12 is a diffuse reflective photoeye aimed across the conveyor. Its LED is rapidly flickering. The sun is streaming through a nearby overhead door that was opened this morning for a delivery. The sensor has been reliable for 2 years.",
        hint: "What changed? The problem started this morning. Look for environmental changes — lighting, temperature, vibration sources.",
        options: [
          {
            id: "1a",
            text: "Check for environmental interference — the overhead door is open and sunlight is hitting the sensor area",
            isCorrect: true,
            consequence: "You notice direct sunlight is hitting the conveyor right at PE-12's sensing zone. The sun angle this morning is putting a beam directly into the sensor. When clouds pass or the sun shifts, it triggers and clears — explaining the intermittent behavior.",
            scoreImpact: 15,
            timeImpact: 30,
            nextStepId: "step-2",
            reading: "Sunlight angle: direct beam into PE-12 sensing zone. Overhead door: OPEN (normally closed weekdays). Sensor type: diffuse reflective — susceptible to ambient light interference."
          },
          {
            id: "1b",
            text: "Clean the photoeye lens — it's probably dirty",
            isCorrect: false,
            consequence: "You clean the lens. It's slightly dusty but cleaning doesn't fix the flickering. The issue is external light interference, not a dirty lens. A dirty lens would cause consistent missed detections, not false triggers.",
            scoreImpact: -5,
            timeImpact: 60,
            nextStepId: "step-1-retry",
            reading: "Lens cleaned. Still flickering. Dirty lens causes missed detections, not false triggers."
          },
          {
            id: "1c",
            text: "Replace the photoeye — it's probably failing after 2 years",
            isCorrect: false,
            consequence: "You install a new sensor. It also flickers in the same location because the sunlight is the issue, not the sensor. You've wasted a sensor and 20 minutes.",
            scoreImpact: -10,
            timeImpact: 300,
            nextStepId: "step-1-retry",
            reading: "New sensor installed — same flickering. Issue is environmental, not sensor failure."
          }
        ]
      },
      {
        id: "step-1-retry",
        title: "Still Flickering",
        description: "The sensor is still false triggering. Cleaning or replacing didn't help. Something external is causing this.",
        context: "The problem started this morning. What's different today? The overhead door is open for a delivery — it's normally closed during production.",
        options: [
          {
            id: "1r-a",
            text: "Look for light sources — the overhead door is open and sun is coming in",
            isCorrect: true,
            consequence: "Direct sunlight is hitting the sensor zone. That's the interference source.",
            scoreImpact: 10,
            timeImpact: 30,
            nextStepId: "step-2",
            reading: "Sunlight confirmed as interference source. Overhead door open since 6 AM."
          },
          {
            id: "1r-b",
            text: "Increase the sensor sensitivity to overcome the interference",
            isCorrect: false,
            consequence: "Increasing sensitivity makes it WORSE — now it's even more responsive to the sunlight. You need to reduce interference, not amplify it.",
            scoreImpact: -10,
            timeImpact: 60,
            nextStepId: "step-2"
          }
        ]
      },
      {
        id: "step-2",
        title: "Immediate Fix",
        description: "Sunlight through the open overhead door is causing PE-12 to false trigger. You need to get the line running now and implement a permanent fix.",
        context: "The delivery truck is still at the dock — the door needs to stay open for another hour. You need an immediate solution and a long-term prevention plan.",
        hint: "Think about blocking the light from reaching the sensor, or switching to a sensor type that's immune to ambient light.",
        options: [
          {
            id: "2a",
            text: "Shield the sensor from sunlight with a temporary hood, then close the overhead door when the truck leaves and plan a permanent sunshield",
            isCorrect: true,
            consequence: "You fashion a cardboard hood over PE-12 to block the direct sunlight. The flickering stops immediately. You clear the fault and the conveyor runs. You note to install a permanent metal sunshield and request the dock door be closed when not actively loading.",
            scoreImpact: 20,
            timeImpact: 60,
            nextStepId: "step-3",
            reading: "Temporary hood installed. PE-12: STABLE (no flicker). Fault cleared. Conveyor: RUNNING."
          },
          {
            id: "2b",
            text: "Close the overhead door immediately",
            isCorrect: false,
            consequence: "Shipping says the truck isn't done loading — they need the door open. You can't just close it. You need a solution that works with the door open.",
            scoreImpact: -5,
            timeImpact: 30,
            nextStepId: "step-2-retry",
            reading: "Door cannot be closed — active loading. Need alternative solution."
          },
          {
            id: "2c",
            text: "Put the sensor in 'dark operate' mode to invert the logic",
            isCorrect: false,
            consequence: "Inverting the sensor logic means it now detects 'no product' as a jam and 'product present' as clear. This completely breaks the jam detection logic. You quickly switch it back.",
            scoreImpact: -15,
            timeImpact: 60,
            nextStepId: "step-2-retry",
            reading: "Dark operate: WRONG — inverts all detection logic. Jam detection now backwards. Reverted."
          }
        ]
      },
      {
        id: "step-2-retry",
        title: "Find a Working Solution",
        description: "The door can't close yet and inverting logic doesn't work. You need to block the sunlight from the sensor.",
        context: "The sensor needs to be shielded from the direct sunlight while still being able to detect product on the conveyor.",
        options: [
          {
            id: "2r-a",
            text: "Create a temporary sunshield/hood over the sensor",
            isCorrect: true,
            consequence: "A simple cardboard hood blocks the sunlight. Sensor stabilizes immediately.",
            scoreImpact: 15,
            timeImpact: 60,
            nextStepId: "step-3",
            reading: "Hood installed. Sensor stable. Conveyor running."
          },
          {
            id: "2r-b",
            text: "Reduce sensor sensitivity until it stops flickering",
            isCorrect: false,
            consequence: "Reducing sensitivity stops the false triggers but now the sensor can't reliably detect actual product jams. You've created a blind spot.",
            scoreImpact: -10,
            timeImpact: 45,
            nextStepId: "step-3"
          }
        ]
      },
      {
        id: "step-3",
        title: "Permanent Prevention",
        description: "The line is running with the temporary fix. Now plan the permanent solution.",
        context: "The temporary hood works but isn't a permanent solution. This dock door opens regularly for shipments. You need a fix that prevents recurrence regardless of door position.",
        options: [
          {
            id: "3a",
            text: "Order a metal sunshield for PE-12, add a note to the dock procedure about sensor interference, and consider upgrading to a through-beam sensor that's immune to ambient light",
            isCorrect: true,
            consequence: "You submit a work order for a permanent stainless sunshield, add a caution note to the dock loading procedure, and recommend upgrading PE-12 to a through-beam type at the next PM window. Problem documented and permanently addressed.",
            scoreImpact: 20,
            timeImpact: 60,
            nextStepId: null,
            reading: "WO submitted: sunshield install. Dock procedure updated. Through-beam upgrade recommended for next PM. Root cause documented."
          },
          {
            id: "3b",
            text: "Just leave the cardboard hood — it works fine",
            isCorrect: false,
            consequence: "Cardboard won't survive washdown, humidity, or accidental contact. It'll fall off within a week and the problem returns. A permanent engineered solution is needed.",
            scoreImpact: -5,
            timeImpact: 0,
            nextStepId: null,
            reading: "Temporary fix only. Cardboard will degrade. No permanent solution implemented."
          }
        ]
      }
    ],
    perfectScore: 55,
    passingScore: 30,
  },
];
