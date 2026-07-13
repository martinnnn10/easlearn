import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("powerflex-vfd", "vfd-fundamentals")!;

export const VFD_FUNDAMENTALS_DECK: LessonCardDeck = {
  moduleSlug: "powerflex-vfd",
  lessonSlug: "vfd-fundamentals",
  title: "VFD Fundamentals & Operating Principles",
  whatYoullLearn: [
    "Follow power through rectifier, DC bus, and inverter stages.",
    "Relate frequency control to motor speed (RPM = 120f/P).",
    "Apply V/Hz control and critical safety rules on the plant floor.",
  ],
  estimatedMinutes: 12,
  previewCardCount: 2,
  cards: [
    {
      id: "vfd-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **VFD**: variable frequency drive\n- **PM**: preventive maintenance\n- **VAC**: volts AC\n- **PWM**: pulse width modulation\n- **HMI**: human-machine interface",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "vfd-01",
      kind: "concept",
      heading: "Megger through the drive — one second of bad judgment",
      body: "A **PowerFlex 525** on a conveyor line was dead after preventive maintenance ([[PM]]). The tech meggered motor leads **with T1/T2/T3 still on the drive terminals**. Root cause: destroyed **IGBT** modules — not a bad motor. After this lesson you disconnect motor leads at the drive before any insulation test.",
      takeaway: "Never megger through a variable frequency drive ([[VFD]]) — isolate motor leads at the drive first.",
      visual: { type: "callout", tone: "warning", text: "Megger through VFD terminals = destroyed semiconductors." },
    },
    {
      id: "vfd-02",
      kind: "concept",
      heading: "Three sections inside every drive",
      body: "**Rectifier** converts **480 volts AC ([[VAC]])** to ~678 V DC bus. **DC bus** stores energy in capacitors. **Inverter** switches **IGBTs** with pulse width modulation (PWM) to simulate variable-frequency alternating current (AC) to the motor.",
      takeaway: "AC → DC → controlled AC — know where faults localize.",
      visual: { type: "diagram", variant: "vfd-stages" },
    },
    {
      id: "vfd-03",
      kind: "interaction",
      heading: "Knowledge check — DC bus after lockout",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "vfd-04",
      kind: "example",
      heading: "On a PowerFlex 525, DC bus still hot",
      body: "Symptom: display dark after disconnect, tech opens cover immediately. Cause: bus capacitors hold **650 V+** for minutes. Diagnostic: wait per label, meter **DC+ to DC−**. Fix: verify zero before touching terminals — not when the screen goes blank.",
      takeaway: "Display off does not mean bus is safe — meter before touch.",
    },
    {
      id: "vfd-05",
      kind: "concept",
      heading: "Speed and the V/[[Hz]] ratio",
      body: "Synchronous speed: **RPM = (120 × f) / P**. V/[[Hz]] control keeps flux constant — at **460 V / 60 hertz ([[Hz]])** the ratio is 7.67 V/[[Hz]]. At **30 Hz** the drive outputs ~**230 V**. Below ~5–6 Hz torque falls without boost.",
      takeaway: "On the drive display, output frequency and voltage move together under V/[[Hz]].",
    },
    {
      id: "vfd-06",
      kind: "example",
      heading: "PWM confuses your multimeter",
      body: "Symptom: **0 V** or unstable reading on motor leads while running. Cause: PWM is not true RMS. Diagnostic: read output voltage and current **parameters** on the **PowerFlex** keypad or **Studio 5000** drive object. Fix: use inverter-rated meter if you must measure at terminals.",
      takeaway: "Use drive parameters — not a cheap multimeter alone on motor leads.",
    },
    {
      id: "vfd-07",
      kind: "example",
      heading: "2% voltage imbalance → nuisance trips",
      body: "Symptom: **F012** overcurrent at steady load. Cause: **2%** phase imbalance at drive input → ~**20%** current imbalance in the motor. Diagnostic: meter all three line legs at drive input. Fix: correct upstream supply before lowering accel ramps.",
      takeaway: "Supply quality is part of drive troubleshooting — meter phases first.",
    },
    {
      id: "vfd-08",
      kind: "example",
      heading: "Frequency commanded, motor still",
      body: "Symptom: display shows output frequency, zero rotation. Cause: enable permissive, open bypass contactor, or mechanical bind. Diagnostic: check output current parameter rising above zero. Fix: enable chain and mechanical load — not just human-machine interface ([[HMI]]) speed setpoint.",
      takeaway: "Commanded frequency without current means enable or mechanical — not magic.",
    },
    {
      id: "vfd-09",
      kind: "interaction",
      heading: "Knowledge check — multimeter on motor terminals",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[1]),
    },
    {
      id: "vfd-10",
      kind: "example",
      heading: "Field procedure — safe drive service entry",
      body: "1. Complete **lockout/tagout (LOTO) procedure** on drive input feeder. 2. Wait manufacturer bus discharge time. 3. Meter **DC bus** before opening cover. 4. Disconnect motor leads at **T1/T2/T3** before megger. 5. Document wait time and readings in the work order (WO).",
      takeaway: "[[LOTO]] procedure + bus meter + isolated motor leads — every service.",
    },
    {
      id: "vfd-11",
      kind: "example",
      heading: "Field procedure — read drive health parameters",
      body: "1. On **PowerFlex** keypad: output frequency, output current, DC bus voltage. 2. Compare output current to motor nameplate **FLA**. 3. Note input phase balance if tripping. 4. Log **fault code** history before clearing.",
      takeaway: "Drive display parameters beat guessing from [[HMI]] speed bar alone.",
    },
    {
      id: "vfd-12",
      kind: "summary",
      heading: "Respect the bus, read parameters",
      body: "• You will disconnect motor leads at the drive before meggering — every time.\n• You will wait and meter the DC bus after **LOTO procedure** — not when the display goes dark.\n• You will read **PowerFlex** output current and frequency parameters instead of trusting a standard multimeter on PWM.\n• You will meter all three input phases before chasing **F012** with parameter changes.",
      takeaway: "Bus voltage, phase balance, parameters — then decide on hardware.",
    },
  ],
};
