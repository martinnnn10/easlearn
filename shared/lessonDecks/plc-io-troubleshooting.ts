import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("plc-fundamentals", "io-troubleshooting")!;

/** I/O Module Troubleshooting & Wiring */
export const PLC_IO_TROUBLESHOOTING_DECK: LessonCardDeck = {
  moduleSlug: "plc-fundamentals",
  lessonSlug: "io-troubleshooting",
  reflection: true, // apprenticeship closeout — scenario in shared/lessonCloseouts.ts
  title: "I/O Module Troubleshooting & Wiring",
  whatYoullLearn: [
    "Trace field symptoms to the correct I/O point before touching ladder logic.",
    "Read normally open and normally closed states on real devices.",
    "Use a multimeter safely to confirm wiring instead of guessing at the PLC panel.",
  ],
  estimatedMinutes: 12,
  previewCardCount: 2,
  cards: [
    {
      id: "io-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **I/O**: input/output\n- **E-stop**: emergency stop\n- **VAC**: volts AC\n- **LOTO**: lockout/tagout",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "io-01",
      kind: "concept",
      heading: "Two hours on a stuck [[photoeye]]",
      body: "Packaging **Line 4** would not start after a jam clear — operators swore the path was clear. The tech opened ladder logic for an hour. Root cause: **input/output ([[I/O]])**:1/5 photoeye input stuck ON from misaligned **Banner** sensor debris. After this lesson you walk input LEDs before you touch the program.",
      takeaway: "A stuck input looks like bad logic — check the input card LED first.",
      visual: {
        type: "callout",
        tone: "field",
        text: "Operator: “Line is clear.” Input LED: ON. Trust the LED.",
      },
    },
    {
      id: "io-02",
      kind: "example",
      heading: "Map the start permissive chain",
      body: "A typical start ladder rung requires normally closed **emergency stop ([[E-stop]])** OK, [[photoeye]] clear, and no **overload** trip. **Line 4** uses **I:1/2** [[E-stop]], **I:1/4** overload, **I:1/5** [[photoeye]], and output coil **O:2/0** for the motor contactor.",
      takeaway: "One stuck input blocks the entire start chain.",
      visual: { type: "diagram", variant: "io-terminal" },
    },
    {
      id: "io-03",
      kind: "interaction",
      heading: "Knowledge check — dead conveyor first move",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "io-04",
      kind: "concept",
      heading: "Normally open vs normally closed in the field",
      body: "Normally open devices (many sensors) close when made. Normally closed safety devices (**Guardmaster** [[E-stop]], [[overload]]) open when tripped. The input card LED shows what the card sees — sinking or sourcing wiring determines what “on” means electrically.",
      takeaway: "Know the normal state of each device before interpreting the input LED.",
      visual: { type: "diagram", variant: "nc-chain" },
    },
    {
      id: "io-05",
      kind: "example",
      heading: "Reading an input LED without guessing",
      body: "On **Allen-Bradley** discrete inputs, the panel LED shows what the card sees. If **I:1/5** is the [[photoeye]] and the LED is ON while the eye should be clear, the input is stuck on — that blocks any ladder [[rung]] waiting for a clear path.",
      takeaway: "LED on + product absent = stuck input or wiring fault.",
    },
    {
      id: "io-06",
      kind: "example",
      heading: "Output coil ON, motor dead",
      body: "Symptom: **O:2/0** LED ON, no contactor pull-in. Cause: open coil, welded contacts, or [[overload]] open downstream. Diagnostic: meter **120 volts AC ([[VAC]])** at contactor **A1–A2**. Confirmation: 0 V at coil with output LED on = field break after the output card.",
      takeaway: "Output coil ON is not proof of motion — meter the contactor coil.",
      visual: { type: "callout", tone: "tip", text: "Compare O:2/0 LED, contactor hum, and motor leads." },
    },
    {
      id: "io-07",
      kind: "example",
      heading: "Photoeye stuck-on after jam clear",
      body: "Symptom: start blocked after jam. Cause: product still blocking beam or sensor misaligned. Diagnostic: watch **I:1/5** LED while clearing path. Fix: align **Banner** sensor, clean lens — input must drop OUT when path is clear.",
      takeaway: "Clear the eye path and verify the input drops out before retrying start.",
      visual: { type: "diagram", variant: "photoeye-loop" },
    },
    {
      id: "io-08",
      kind: "example",
      heading: "Open wire on normally closed [[E-stop]] chain",
      body: "Symptom: line dead, [[E-stop]] looks released. Cause: open wire in normally closed (NC) chain reads like [[E-stop]] pressed. Diagnostic: continuity on [[E-stop]] string with multimeter. Fix: repair wire or terminal — do not force outputs to test.",
      takeaway: "Open [[NC]] wire = safe shutdown — same symptom as pressed [[E-stop]].",
    },
    {
      id: "io-09",
      kind: "interaction",
      heading: "Knowledge check — stuck [[photoeye]] cause",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[3]),
    },
    {
      id: "io-10",
      kind: "example",
      heading: "Field procedure — meter before forcing",
      body: "1. Complete **lockout/tagout ([[LOTO]])** procedure if opening the panel. 2. List permissive inputs from the print. 3. Watch each input LED while toggling field devices. 4. Meter continuity on [[NC]] chains and voltage at terminals. 5. Record readings before any online force in **Studio 5000**.",
      takeaway: "Measure with a multimeter, then decide — never force blind.",
      visual: { type: "callout", tone: "warning", text: "LOTO procedure before opening panels or working on live circuits." },
    },
    {
      id: "io-11",
      kind: "example",
      heading: "Field procedure — from evidence to fix",
      body: "1. Note **I:1/2** [[E-stop]], **I:1/5** [[photoeye]], **O:2/0** states. 2. If permissives fail before output energizes, fix field inputs first. 3. Retry start with operator present. 4. Log which terminal was wrong for the next shift.",
      takeaway: "List inputs and outputs — let the pattern point to the [[fault]] class.",
    },
    {
      id: "io-12",
      kind: "summary",
      heading: "Start at the input card, not the program",
      body: "• You will walk input LEDs on **Line 4** before opening ladder logic on a dead start.\n• You will trust a stuck input LED over an operator “all clear” report until you verify the field device.\n• You will meter [[NC]] [[E-stop]] chains before forcing an output coil online.\n• You will separate “logic says ON” from “contactor pulled in” every time.",
      takeaway: "Input card → terminal strip → device — in that order, every call.",
    },
  ],
};
