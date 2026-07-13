import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("electrical-fundamentals", "meters-measurements")!;

export const METERS_MEASUREMENTS_DECK: LessonCardDeck = {
  moduleSlug: "electrical-fundamentals",
  lessonSlug: "meters-measurements",
  title: "Meters & Measurements",
  whatYoullLearn: [
    "Match the meter mode to the circuit before you trust a single reading.",
    "Clamp one conductor for current — and know why enclosing three reads zero.",
    "Verify Live-Dead-Live so a dead battery never reads as a dead circuit.",
  ],
  estimatedMinutes: 12,
  previewCardCount: 2,
  cards: [
    {
      id: "mtr-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **DMM**: digital multimeter — reads volts, amps, ohms\n- **OL**: over-limit — the reading exceeds the selected range (often means open)\n- **VFD**: variable frequency drive — controls a motor's speed\n- **LOTO**: lockout/tagout — the zero-energy safety procedure\n- **Ω**: ohms — the unit of resistance",
      takeaway: "The meter only tells the truth when it is in the mode the circuit calls for.",
    },
    {
      id: "mtr-01",
      kind: "concept",
      heading: "A good meter, a wrong reading",
      body: "A motor is clearly running, but your [[clamp meter]] shows 0 A. The meter is not broken — the technique is wrong. Enclose all three conductors of a **balanced** [[three-phase]] cord and the phase magnetic fields sum to nearly zero — a leftover reading means unbalanced load or ground-fault current. Put a **DMM (digital multimeter)** on V AC and probe a 24-volt DC sensor loop and you get a misleading number for a related reason: wrong mode, wrong answer.",
      takeaway: "Most \"bad meter\" calls are really wrong-mode or wrong-technique calls.",
    },
    {
      id: "mtr-02",
      kind: "concept",
      heading: "Pick the mode before you probe",
      body: "Voltage: match V AC or V DC to the circuit. Current: use the clamp on **one** conductor. [[resistance]]: ohms mode, and only on a de-energized circuit under [[LOTO]]. Insulation: a [[megger]], with the load isolated from any electronics. Each mode answers one question — reading a circuit in the wrong one is how techs chase ghosts.",
      takeaway: "The mode selector is the first troubleshooting decision, not an afterthought.",
      visual: { type: "diagram", variant: "meter-mode-table" },
    },
    {
      id: "mtr-03",
      kind: "interaction",
      heading: "Knowledge check — clamp reads zero",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "mtr-04",
      kind: "example",
      heading: "Live-Dead-Live before you trust \"dead\"",
      body: "[[Live-Dead-Live]] is how you prove absence of voltage. Test the meter on a **known-live** source, test the circuit you locked out and expect **dead**, then test the known-live source **again**. If the meter read live both times and dead in the middle, you can trust the zero. Skip the second live test and a battery that died between steps reads every energized bus as \"safe.\"",
      takeaway: "A single dead reading proves nothing — a dead meter and a dead circuit look identical.",
      visual: { type: "callout", tone: "warning", text: "No Live-Dead-Live, no trust. Prove the meter works on a live source before AND after the zero-energy check." },
    },
    {
      id: "mtr-05",
      kind: "concept",
      heading: "Resistance is a de-energized measurement",
      body: "Ohms mode injects the meter's own tiny current and reads the return — apply it to a live circuit and the reading is meaningless and the meter is at risk. Before any [[resistance]] check: kill power, apply [[LOTO]], discharge, and often lift one lead so parallel paths do not sneak current around the part you are testing.",
      takeaway: "If the circuit is energized, the ohmmeter is the wrong tool — every time.",
    },
    {
      id: "mtr-06",
      kind: "interaction",
      heading: "Knowledge check — measuring a coil",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[1]),
    },
    {
      id: "mtr-07",
      kind: "example",
      heading: "Never megger through a drive",
      body: "A [[megger]] applies hundreds to a thousand volts DC to test insulation. Aim that through a motor still landed on a **VFD (variable frequency drive)** output and the test voltage back-feeds the output transistors and DC bus — you destroy the drive to test the motor. Disconnect the motor leads at the drive first, megger the motor alone, then reconnect.",
      takeaway: "Isolate the motor from all electronics before an insulation test — no exceptions.",
      visual: { type: "callout", tone: "warning", text: "Meggering a motor with its leads still on the VFD output is how a $4,000 drive dies during a routine test." },
    },
    {
      id: "mtr-08",
      kind: "example",
      heading: "What a contact's resistance tells you",
      body: "A good closed contact reads under 1 Ω. Watch it climb past about 5 Ω and you are seeing pitting or corrosion — resistance that will drop voltage and make heat under load (**P = I² × R**). A reading of **OL** across a contact that should be closed means it is open. The number is a health gauge, not just pass/fail.",
      takeaway: "Under 1 Ω is healthy; a few ohms is a warning; OL is an open.",
    },
    {
      id: "mtr-09",
      kind: "interaction",
      heading: "Knowledge check — proving the meter",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "mtr-10",
      kind: "example",
      heading: "Field procedure — a reading that won't hold still",
      body: "1. Voltage at a terminal jumps around under load. 2. That flutter is intermittent contact [[resistance]] — a loose lug or a tired spring clamp. 3. De-energize and apply [[LOTO]]. 4. Check the termination for torque and the conductor for discoloration. 5. Re-torque to spec or replace the lug — a stable circuit does not wander at a tight connection.",
      takeaway: "Wandering voltage under load points at the connection, not the meter's battery.",
    },
    {
      id: "mtr-11",
      kind: "summary",
      heading: "The meter is only as good as the technique",
      body: "• You will match the mode — V AC, V DC, clamp, ohms, or [[megger]] — to the question you are asking.\n• You will clamp a single conductor and know why three read near zero.\n• You will run [[Live-Dead-Live]] before trusting any de-energized reading.\n• You will isolate a motor from its drive before an insulation test.",
      takeaway: "Right mode, right technique, verified meter — then the number means something.",
    },
  ],
};
