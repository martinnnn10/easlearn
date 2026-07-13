import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("electrical-fundamentals", "electrical-safety-lockout")!;

export const ELECTRICAL_SAFETY_LOTO_DECK: LessonCardDeck = {
  moduleSlug: "electrical-fundamentals",
  lessonSlug: "electrical-safety-lockout",
  title: "Electrical Safety & Lockout/Tagout",
  whatYoullLearn: [
    "Respect voltage/current thresholds that injure or kill.",
    "Execute OSHA LOTO six steps including Live-Dead-Live verification.",
    "Identify stored energy beyond the disconnect.",
  ],
  estimatedMinutes: 12,
  previewCardCount: 2,
  cards: [
    {
      id: "es-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **LOTO**: lockout/tagout\n- **E-stop**: emergency stop\n- **NFPA**: National Fire Protection Association\n- **DC**: direct current\n- **MCC**: motor control center\n- **VFD**: variable frequency drive\n- **OSHA**: Occupational Safety and Health Administration",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "es-01",
      kind: "concept",
      heading: "Opened the [[VFD]] cover on dark display",
      body: "A tech opened a **PowerFlex 755** two minutes after feeder **lockout/tagout ([[LOTO]]) procedure** — display was dark so he assumed safe. **direct current (DC) bus** still held **650 V**. Root cause: bus capacitors outlive the screen. After this lesson you meter the bus before any cover screw turns.",
      takeaway: "[[LOTO]] procedure on input does not instantly zero the DC bus — wait and meter.",
      visual: { type: "callout", tone: "warning", text: "50 mA through the chest can fibrillate — DC bus holds hundreds of volts for minutes." },
    },
    {
      id: "es-02",
      kind: "concept",
      heading: "[[OSHA]] [[LOTO]] — six steps",
      body: "1) Notify affected people. 2) Shut down normally. 3) Isolate all energy. 4) Apply personal lock and tag. 5) Verify zero energy. 6) Release stored energy (capacitors, springs, gravity, pressure).",
      takeaway: "Verification separates procedure from ritual.",
      visual: { type: "diagram", variant: "loto-steps" },
    },
    {
      id: "es-03",
      kind: "interaction",
      heading: "Knowledge check — [[LOTO]] vs [[E-stop]]",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "es-04",
      kind: "example",
      heading: "Live-Dead-Live with a multimeter",
      body: "On a **480 V** motor control center ([[MCC]]) bucket: test multimeter on known live → test locked-out circuit (expect **0 V**) → test meter on live again. Check **all phases** phase-to-phase and to ground. One skipped step invalidates the reading.",
      takeaway: "Live-Dead-Live is non-negotiable before touching conductors.",
      visual: { type: "callout", tone: "tip", text: "Confirm the multimeter works before AND after zero-energy test." },
    },
    {
      id: "es-05",
      kind: "concept",
      heading: "[[NFPA]] 70E approach boundaries",
      body: "On **480 V** systems, limited approach starts at **3.5 ft**, restricted at **1 ft** with PPE. Arc flash boundary distance comes from incident energy calculations on the equipment label — not habit.",
      takeaway: "Distance and PPE match calculated incident energy on the label.",
    },
    {
      id: "es-06",
      kind: "example",
      heading: "Stored energy beyond electrical [[LOTO]]",
      body: "Symptom: press moves after electrical lockout. Cause: **hydraulic** pressure, **variable frequency drive ([[VFD]])** DC bus, motor back-EMF, **Parker** accumulator. Fix: bleed per procedure, block mechanical motion — electrical [[LOTO]] alone is not zero energy.",
      takeaway: "Zero energy includes pressure, gravity, springs, and capacitors.",
    },
    {
      id: "es-07",
      kind: "example",
      heading: "Arc flash PPE categories",
      body: "On a labeled **8 cal/cm²** panel, Category **2** minimum: arc shirt, pants, face shield. Higher incident energy requires arc flash suit — match the label, not what you wore last time.",
      takeaway: "Read the arc flash label on the equipment before opening.",
    },
    {
      id: "es-08",
      kind: "example",
      heading: "Personal lock accountability",
      body: "Symptom: machine energized while someone still inside. Cause: shared lock or missing personal lock. Fix: each authorized worker applies their own lock — group lockbox for teams per **Occupational Safety and Health Administration ([[OSHA]]) 1910.147**.",
      takeaway: "Your lock, your key — no shared padlock on live work.",
    },
    {
      id: "es-09",
      kind: "interaction",
      heading: "Knowledge check — personal locks",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "es-10",
      kind: "example",
      heading: "Field procedure — [[LOTO]] on a motor starter",
      body: "1. Notify production. 2. Shut down normally. 3. Open disconnect — apply personal lock and tag. 4. Try start at local station. 5. **Live-Dead-Live** at starter terminals with multimeter. 6. Block any stored motion.",
      takeaway: "Try start + meter — visual off is not verification.",
    },
    {
      id: "es-11",
      kind: "example",
      heading: "Field procedure — [[VFD]] service after [[LOTO]]",
      body: "1. **LOTO procedure** on drive feeder. 2. Wait bus discharge time on label. 3. Meter **DC+ to DC−**. 4. Confirm zero before opening cover. 5. Log wait time and reading on tag.",
      takeaway: "Bus meter reading goes in the log — not just “display was dark.”",
    },
    {
      id: "es-12",
      kind: "summary",
      heading: "Go home safe every shift",
      body: "• You will meter **DC bus** on **PowerFlex** drives after **LOTO procedure** — not when the display goes dark.\n• You will use **Live-Dead-Live** on every zero-energy verification.\n• You will apply your own lock — never share one padlock on a job.\n• You will bleed **hydraulic** and **pneumatic** stored energy after electrical isolation.",
      takeaway: "Verify zero energy — electrical, mechanical, and stored — before hands-on work.",
    },
  ],
};
