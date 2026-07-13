import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("print-reading", "ladder-diagram-conventions")!;

export const LADDER_DIAGRAM_CONVENTIONS_DECK: LessonCardDeck = {
  moduleSlug: "print-reading",
  lessonSlug: "ladder-diagram-conventions",
  title: "Ladder Diagram Conventions",
  whatYoullLearn: [
    "Read ladder prints left-to-right and top-to-bottom without skipping interlocks.",
    "Use tags and cross-references to connect control logic with panel hardware.",
    "Run a repeatable field print-trace procedure before editing PLC logic.",
  ],
  estimatedMinutes: 14,
  previewCardCount: 2,
  cards: [
    {
      id: "ldc-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **PLC**: programmable logic controller\n- **CR**: control relay\n- **NO**: normally open\n- **NC**: normally closed",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "ldc-01",
      kind: "concept",
      heading: "Conveyor won’t restart after lunch break",
      body: "A packaging conveyor stayed down after a restart because a technician traced the wrong rung from an outdated print revision and landed on the wrong overload contact. The programmable logic controller ([[PLC]]) logic was fine; the print interpretation was wrong.",
      takeaway: "Failure scenarios often start with print-reading mistakes, not bad code.",
      visual: {
        type: "callout",
        tone: "field",
        text: "Check drawing revision first. Wrong sheet means wrong diagnosis.",
      },
    },
    {
      id: "ldc-02",
      kind: "concept",
      heading: "Power flow convention on ladder prints",
      body: "Standard ladder prints are read left rail to right rail on each [[rung]], then top to bottom through the page. Contacts on the left establish permissives; coils and outputs appear toward the right side.",
      takeaway: "Follow print direction consistently to avoid skipping true root causes.",
    },
    {
      id: "ldc-05",
      kind: "interaction",
      heading: "Knowledge check — reading ladder flow",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "ldc-03",
      kind: "concept",
      heading: "Tags connect paper to hardware",
      body: "Device tags like control relay ([[CR]]) 1, M1, and overload (OL) 1 map the drawing to the physical control panel. Use the symbol legend and device list to verify the exact component before metering terminals.",
      takeaway: "Tag discipline reduces random probing and unsafe assumptions.",
    },
    {
      id: "ldc-04",
      kind: "example",
      heading: "Normally open ([[NO]]) and [[NC]] symbols in troubleshooting",
      body: "Normally closed ([[NC]]) [[overload]] and stop contacts pass continuity in healthy state. If field state and symbol behavior are inverted, your [[rung]] interpretation and troubleshooting path both break.",
      takeaway: "Compare expected healthy state to print symbol before changing wiring.",
    },
    {
      id: "ldc-06",
      kind: "example",
      heading: "Cross-reference from coil to power sheet",
      body: "When a control coil reference points to another page, jump there and verify the actual contactor, [[overload]] block, and terminal numbers that complete the motor circuit.",
      takeaway: "Cross-reference is mandatory when tracing from logic symbol to power device.",
    },
    {
      id: "ldc-07",
      kind: "example",
      heading: "Revision clouds are troubleshooting clues",
      body: "If a [[rung]] or terminal area is clouded, it changed since the prior release. Work only from current revision and reconcile any field redlines before trusting old troubleshooting notes.",
      takeaway: "Revision awareness prevents chasing removed or relocated devices.",
    },
    {
      id: "ldc-08",
      kind: "example",
      heading: "Seal-in (holding circuit) [[rung]] anatomy on print",
      body: "Use the [[rung]] shape to verify permissive contacts, momentary start, and parallel hold-in branch before touching runtime logic. The print should match what operators observe during start/stop behavior.",
      takeaway: "Diagram-first review catches missing or miswired hold-in paths.",
      visual: { type: "diagram", variant: "ladder-seal-in" },
    },
    {
      id: "ldc-09",
      kind: "example",
      heading: "Field procedure — [[rung]]-to-terminal trace",
      body: "1) Confirm drawing revision at panel door. 2) Start at coil [[rung]] right side and list each permissive contact leftward. 3) Cross-reference every tag to terminal strip points. 4) Verify continuity and voltage in that exact order.",
      takeaway: "Structured tracing beats random meter checks.",
    },
    {
      id: "ldc-10",
      kind: "example",
      heading: "Field procedure — verify logic against print",
      body: "1) Go online in Studio 5000 and monitor [[rung]] status. 2) Compare each true/false permissive to printed symbol state. 3) Record first mismatch between field state and print expectation before any code edits.",
      takeaway: "First mismatch is usually the highest-value diagnostic clue.",
    },
    {
      id: "ldc-11",
      kind: "interaction",
      heading: "Knowledge check — [[NC]] contact behavior",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "ldc-12",
      kind: "example",
      heading: "Escalation trigger for engineering review",
      body: "If print, [[PLC]] logic, and field wiring disagree after revision check, stop corrective changes and escalate with marked-up evidence. Unapproved point changes create new undocumented faults.",
      takeaway: "Escalate inconsistencies early with documented evidence.",
    },
    {
      id: "ldc-13",
      kind: "summary",
      heading: "Use print-reading actions every callout",
      body: "- Confirm latest drawing revision and legend\n- Read [[rung]] left-to-right and top-to-bottom\n- Cross-reference tags to real terminals and devices\n- Verify field state vs symbol state online\n- Log mismatches before any [[PLC]] edits",
      takeaway: "Action-first print discipline prevents repeat downtime.",
    },
  ],
};
