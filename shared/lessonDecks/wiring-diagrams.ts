import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("print-reading", "wiring-diagrams")!;

export const WIRING_DIAGRAMS_DECK: LessonCardDeck = {
  moduleSlug: "print-reading",
  lessonSlug: "wiring-diagrams",
  title: "Wiring Diagrams & Print Packages",
  whatYoullLearn: [
    "Trace wires accurately across schematic, terminal, and panel layout sheets.",
    "Interpret terminal and wire numbering conventions during diagnostics.",
    "Apply field-safe print package procedures before moving or landing conductors.",
  ],
  estimatedMinutes: 14,
  previewCardCount: 2,
  cards: [
    {
      id: "wd-01",
      kind: "concept",
      heading: "Wrong terminal landed after retrofit",
      body: "After a retrofit, a motor starter coil stayed dead because a wire was landed on TB4-8 instead of TB4-7. The technician read an old panel layout and skipped wire-number cross-reference, causing a full shift of downtime.",
      takeaway: "Failure starts when wire numbers are ignored across print pages.",
      visual: {
        type: "callout",
        tone: "field",
        text: "Never move conductors by memory. Verify wire number and terminal point.",
      },
    },
    {
      id: "wd-02",
      kind: "concept",
      heading: "What a wiring package must include",
      body: "A complete package links schematic symbols, terminal strip tables, panel layout, cable schedule, and revision record. Missing one section usually creates rework during startup or troubleshooting.",
      takeaway: "Use the full print package, not a single page screenshot.",
    },
    {
      id: "wd-05",
      kind: "interaction",
      heading: "Knowledge check — wire number meaning",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "wd-03",
      kind: "concept",
      heading: "Wire numbers are the trace backbone",
      body: "Wire numbers provide continuity across sheets and physical panel labeling. If wire 115 appears at **programmable logic controller (PLC)** input and terminal strip, those points must align unless redlined and approved.",
      takeaway: "Trace by wire number first, then validate by color and location.",
    },
    {
      id: "wd-04",
      kind: "example",
      heading: "Terminal notation TB4-7",
      body: "TB4-7 means terminal block 4, point 7. Confirm that exact point physically before any meter readings; nearby points may carry different voltage classes or control functions.",
      takeaway: "Precise terminal notation prevents probing the wrong circuit.",
    },
    {
      id: "wd-06",
      kind: "example",
      heading: "Revision clouds and field risk",
      body: "A clouded section marks engineering changes. If your onsite print lacks that revision, you may troubleshoot components that no longer exist or miss newly added interlocks.",
      takeaway: "Clouded changes are high-priority checkpoints before diagnosis.",
    },
    {
      id: "wd-07",
      kind: "example",
      heading: "Dashed lines require legend confirmation",
      body: "Dashed line meaning depends on the drawing legend: optional harness, future install, or alternate route. Assuming voltage or de-energized status from line style alone is unsafe.",
      takeaway: "Interpret line styles only through the sheet legend.",
    },
    {
      id: "wd-08",
      kind: "example",
      heading: "Trace control chain from field to [[PLC]] **input/output (I/O)**",
      body: "Start at field device, follow conductor labels through terminal strip, then confirm [[PLC]] card channel and tag mapping. This catches swapped cores and mis-terminated retrofit wiring quickly.",
      takeaway: "Diagram card anchors a repeatable end-to-end trace method.",
      visual: { type: "diagram", variant: "wire-numbering-convention" },
    },
    {
      id: "wd-09",
      kind: "example",
      heading: "Field procedure — terminal verification",
      body: "1) Isolate and verify safe state. 2) Match terminal marker to print notation. 3) Verify wire number at both ends. 4) Meter expected signal and record value with sheet reference.",
      takeaway: "Terminal verification must include both identity and measurement.",
    },
    {
      id: "wd-10",
      kind: "example",
      heading: "Field procedure — controlled redline workflow",
      body: "When as-built differs from print, mark redline on controlled copy, note conductor IDs, and submit update to document control. Avoid ad-hoc sticky notes that disappear before the next outage.",
      takeaway: "Redline discipline keeps future troubleshooting accurate and safe.",
    },
    {
      id: "wd-11",
      kind: "interaction",
      heading: "Knowledge check — print revision cloud",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "wd-12",
      kind: "example",
      heading: "Common misread: panel layout is not logic",
      body: "Panel layout shows physical placement; schematic shows electrical function. Using layout alone can hide series permissives and interlocks that decide why a coil is de-energized.",
      takeaway: "Use layout for location, schematic for behavior.",
    },
    {
      id: "wd-13",
      kind: "summary",
      heading: "Apply wiring-trace actions on every print job",
      body: "- Validate latest revision and clouded changes\n- Trace by wire number across all sheets\n- Confirm exact terminal notation before metering\n- Separate physical layout from logic function\n- Redline and submit controlled as-built updates",
      takeaway: "Consistent trace actions cut repeat wiring faults.",
    },
  ],
};

