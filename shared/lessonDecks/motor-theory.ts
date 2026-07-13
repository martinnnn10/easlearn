import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("motors-controls", "motor-theory")!;

export const MOTOR_THEORY_DECK: LessonCardDeck = {
  moduleSlug: "motors-controls",
  lessonSlug: "motor-theory",
  title: "AC & DC Motor Theory",
  whatYoullLearn: [
    "Use nameplate and pole count to predict expected motor speed.",
    "Connect slip, torque, and current to real failure symptoms.",
    "Separate AC induction behavior from DC motor speed control.",
  ],
  estimatedMinutes: 14,
  previewCardCount: 2,
  cards: [
    {
      id: "mt-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **AC**: alternating current\n- **DC**: direct current\n- **Hz**: hertz\n- **MCC**: motor control center\n- **VAC**: volts AC",
      takeaway: "These terms come up throughout this lesson.",
    },
    {
      id: "mt-01",
      kind: "concept",
      heading: "New conveyor motor overheats at half load",
      body: "A replacement **Baldor Reliance** 10 HP motor on a carton conveyor ran hot and tripped overloads after 20 minutes. Voltage was balanced and bearings were new. Root cause: installer assumed 3,600 RPM behavior on a **4-pole** motor and geared the line wrong, driving high slip current all shift.",
      takeaway: "Motor theory errors can look like hardware failure in the field.",
    },
    {
      id: "mt-02",
      kind: "concept",
      heading: "Synchronous speed sets the target",
      body: "For alternating current (AC) induction motors, synchronous speed is **Ns = 120 x frequency / poles**. A 4-pole motor on 60 hertz ([[Hz]]) has a 1,800 RPM field speed, while a 2-pole motor has 3,600 RPM. Rotor speed is always slightly lower under load.",
      takeaway: "Know pole count first, then compare measured speed to expected range.",
    },
    {
      id: "mt-05",
      kind: "interaction",
      heading: "Knowledge check - synchronous speed",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "mt-03",
      kind: "example",
      heading: "Slip is normal, excessive slip is a warning",
      body: "Slip is the gap between synchronous speed and rotor speed. On a healthy 1,800 RPM class induction motor, running speed might be around 1,740-1,770 RPM near rated load. If speed drops further while amps rise, check for overload, low voltage, or rotor defects.",
      takeaway: "High current plus low speed points to torque demand or rotor issues.",
    },
    {
      id: "mt-04",
      kind: "concept",
      heading: "Three-phase torque production basics",
      body: "Three-phase stator windings create a rotating magnetic field. The rotor follows that field and develops torque from induced currents. If phase sequence is reversed, rotation reverses - useful for correction but dangerous if not verified before coupling.",
      takeaway: "Phase sequence controls direction; slip controls torque production.",
    },
    {
      id: "mt-06",
      kind: "example",
      heading: "Nameplate values drive protection settings",
      body: "Techs on a **Square D** motor control center ([[MCC]]) bucket used the nameplate **FLA** to set [[overload]] dial and verify conductor sizing. They left service factor and insulation class documented for future troubleshooting, then compared measured current to rated full-load current under steady production.",
      takeaway: "Nameplate data anchors both protection and diagnostics.",
    },
    {
      id: "mt-07",
      kind: "concept",
      heading: "DC motor speed differs from AC induction",
      body: "Direct current (DC) motor speed is largely tied to armature voltage below base speed, unlike induction motors where frequency and poles define synchronous speed. Field weakening can extend speed above base on some DC systems, but torque limits must be respected.",
      takeaway: "Do not apply AC slip assumptions directly to DC armature control.",
    },
    {
      id: "mt-08",
      kind: "example",
      heading: "Diagram read - where speed expectations begin",
      body: "A standard motor starter chain still tells you where to verify theory: incoming supply, starter, [[overload]], then motor. Before blaming controls, compare measured shaft RPM and amps to pole-count expectations and nameplate FLA.",
      takeaway: "Use the power path diagram to connect math with field measurements.",
      visual: { type: "diagram", variant: "motor-starter-chain" },
    },
    {
      id: "mt-09",
      kind: "example",
      heading: "Low voltage, high slip, high heat",
      body: "When an **Allen-Bradley** starter fed 440 volts AC ([[VAC]]) instead of expected 480 [[VAC]], torque margin fell and slip increased under load. Operators reported sluggish starts and hotter frame temperatures. Correct transformer tap and feeder drop restored normal current and speed.",
      takeaway: "Undervoltage can mimic mechanical drag by increasing slip current.",
    },
    {
      id: "mt-10",
      kind: "example",
      heading: "Field procedure - verify expected RPM quickly",
      body: "1. Read nameplate poles, frequency, and rated RPM. 2. Compute synchronous speed. 3. Measure shaft RPM with tachometer at no-load and loaded states. 4. Compare current against FLA. 5. If slip is excessive, inspect supply balance, load, and rotor condition before replacing motor.",
      takeaway: "A 3-minute speed/current check prevents unnecessary motor swaps.",
    },
    {
      id: "mt-11",
      kind: "interaction",
      heading: "Knowledge check - rotating field",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "mt-12",
      kind: "example",
      heading: "Common misconception - RPM equals line frequency",
      body: "Teams sometimes treat 60 [[Hz]] as 60 RPM logic, ignoring the pole formula. That mismatch causes incorrect gearbox ratios, bad acceptance criteria, and chronic [[overload]] complaints. Always evaluate motor speed in RPM using poles and frequency together.",
      takeaway: "Frequency alone never predicts shaft speed correctly.",
    },
    {
      id: "mt-13",
      kind: "summary",
      heading: "Use theory before replacement",
      body: "• You will calculate synchronous speed from frequency and poles before judging a motor as slow.\n• You will compare measured RPM and amps to nameplate rated values under real load.\n• You will treat high slip plus high current as a diagnostic clue, not automatic motor failure.\n• You will verify phase sequence and direction before coupling any driven load.",
      takeaway: "Speed math, slip, and nameplate checks should lead every motor diagnosis.",
    },
  ],
};
