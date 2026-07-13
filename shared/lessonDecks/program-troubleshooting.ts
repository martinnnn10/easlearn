import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("plc-fundamentals", "program-troubleshooting")!;

export const PROGRAM_TROUBLESHOOTING_DECK: LessonCardDeck = {
  moduleSlug: "plc-fundamentals",
  lessonSlug: "program-troubleshooting",
  title: "Online Troubleshooting & Forcing I/O",
  whatYoullLearn: [
    "Use Studio 5000 online monitor to find which permissive blocks a rung.",
    "Force outputs safely with LOTO and hazard review.",
    "Match coil tags to physical output terminals before blaming logic.",
  ],
  estimatedMinutes: 14,
  previewCardCount: 2,
  cards: [
    {
      id: "pt-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **LOTO**: lockout/tagout\n- **OTE**: output energize\n- **NC**: normally closed\n- **XIC**: examine if closed\n- **XIO**: examine if open\n- **I/O**: input/output\n- **E-stop**: emergency stop",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "pt-01",
      kind: "concept",
      heading: "The force that moved a guard",
      body: "A tech forced **O:2/0** ON to prove the contactor — nobody cleared the infeed. The motor started into a jam with the guard open. **Forcing bypasses every interlock** in software. lockout/tagout ([[LOTO]]) and area control come first; forces are diagnostic only and must be cleared before handoff.",
      takeaway: "Never force motion outputs without [[LOTO]] or confirmed zero energy downstream.",
      visual: {
        type: "callout",
        tone: "warning",
        text: "Forces do not remove pinch points — read the rung and talk to operators first.",
      },
    },
    {
      id: "pt-02",
      kind: "concept",
      heading: "Online monitor — what green and red mean",
      body: "In Studio 5000 **Run** mode, highlight a [[rung]]: **green** contacts/bits are true this scan; **red** are false. The monitor shows the **input image** the logic used — not a prediction. Scroll permissives left to right until you find the first false contact blocking the motor rung.",
      takeaway: "First false examine if closed ([[XIC]]) on the start [[rung]] is your next field check — not a random coil edit.",
    },
    {
      id: "pt-05",
      kind: "interaction",
      heading: "Knowledge check — when forcing is allowed",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "pt-03",
      kind: "concept",
      heading: "Tag mapping vs physical terminal",
      body: "**MTR_RUN** output energize ([[OTE]]) must map to **O:2/0** on the **1756-OB16** that actually wires to the contactor. Logic true + output LED off = wrong slot, wrong bit, or module fault. Compare tag properties → **Monitor** tab address to the panel schedule on the door.",
      takeaway: "Online true with dead field = mapping or wiring — not “bad logic.”",
      visual: { type: "diagram", variant: "io-terminal" },
    },
    {
      id: "pt-04",
      kind: "example",
      heading: "[[NC]] contact false while field looks normal",
      body: "Monitor shows **ESTOP_OK** [[XIC]] false — emergency stop ([[E-stop]]) looks released. Cause: open wire in normally closed ([[NC]]) chain, wrong bit address, or [[XIC]]/examine if open ([[XIO]]) mismatch. Diagnostic: meter continuity on E-stop string; compare bit state while toggling device. Fix wiring or contact type — do not delete the [[rung]].",
      takeaway: "Bit state wins over operator report — meter the input terminal.",
    },
    {
      id: "pt-06",
      kind: "example",
      heading: "Rung true, output never energizes",
      body: "Symptom: **MTR_RUN** coil green in monitor; **O:2/0** LED off. Cause: coil tag mapped to **O:3/0** while wiring on **O:2/0**. Diagnostic: cross-reference input/output ([[I/O]]) configuration to print. Fix tag address or rewire — confirm output LED follows coil.",
      takeaway: "Mapping error is common after copying projects between lines.",
    },
    {
      id: "pt-07",
      kind: "example",
      heading: "Undocumented online edit",
      body: "Symptom: [[fault]] returns every Monday after weekend run — logic differs from backup. Cause: Friday night online edit never saved to project file or documented. Diagnostic: export compare against last known **.ACD** backup. Fix: restore reviewed logic; ban undocumented online edits on safety rungs.",
      takeaway: "Processor memory ≠ your backup file — compare before chasing field devices.",
    },
    {
      id: "pt-08",
      kind: "example",
      heading: "Compare to a sister line",
      body: "Symptom: identical machine, one line runs. Cause: parameter or [[rung]] difference — e.g. missing **photoeye clear** permissive. Diagnostic: logic compare in Studio 5000 between projects — then **still meter I/O** on the faulted line. Program diff is a guide, not a substitute for field checks.",
      takeaway: "Diff two programs only when machines are truly alike — then verify with meter.",
    },
    {
      id: "pt-09",
      kind: "example",
      heading: "Leaving forces enabled",
      body: "Symptom: motor runs with all permissives false in monitor. Cause: **Force ON** still active on output. Diagnostic: Studio 5000 **Force List** — yellow force icons. Fix: remove forces, test normal start sequence with operators, sign log entry.",
      takeaway: "Check Force List before any handoff — forces hide real permissive failures.",
    },
    {
      id: "pt-10",
      kind: "interaction",
      heading: "Knowledge check — tag mapping",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "pt-11",
      kind: "example",
      heading: "Field procedure — safe output force test",
      body: "1. Complete **LOTO** or confirm zero motion hazard. 2. Read entire **MTR_RUN** [[rung]] — list all devices affected. 3. Studio 5000 → right-click output → **Force ON** (one bit only). 4. Verify **module LED** and field voltage — not just coil color. 5. **Remove force**; test normal sequence before production restart.",
      takeaway: "One force, one bit, one documented reason — remove before leaving panel.",
    },
    {
      id: "pt-12",
      kind: "example",
      heading: "Field procedure — monitor a blocked start [[rung]]",
      body: "1. Go online; open start [[rung]]. 2. With START pressed, watch which [[XIC]] stays **red**. 3. Jump to that tag in [[I/O]] monitor — note address **I:1/x**. 4. Meter field device at terminal block. 5. Fix field or tag; **do not force** until root cause is understood.",
      takeaway: "First red permissive in monitor = your meter location — every time.",
    },
    {
      id: "pt-13",
      kind: "summary",
      heading: "Monitor first, force last, document always",
      body: "You will walk permissives online before forcing outputs, verify tag-to-terminal mapping when logic says ON but the field is dead, and clear every force before shift handoff. Undocumented online edits cause repeat Monday-morning failures — save and backup after any approved change.",
      takeaway: "Online monitor finds the false bit — forces only confirm the output path, never replace diagnosis.",
    },
  ],
};
