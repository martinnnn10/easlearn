import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("print-reading", "pid-symbols")!;

export const PID_SYMBOLS_DECK: LessonCardDeck = {
  moduleSlug: "print-reading",
  lessonSlug: "pid-symbols",
  title: "P&ID Symbols & Conventions",
  whatYoullLearn: [
    "Interpret common P&ID symbols and ISA tag naming in context.",
    "Link P&ID tags to loop checks, calibration, and operating risk.",
    "Use field procedures to verify process intent before instrument work.",
  ],
  estimatedMinutes: 14,
  previewCardCount: 2,
  cards: [
    {
      id: "pid-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **P&ID**: piping and instrumentation diagram\n- **FC**: fail-closed\n- **FO**: fail-open",
      takeaway: "These terms come up throughout this lesson.",
    },
    {
      id: "pid-01",
      kind: "concept",
      heading: "Overflow event from misread fail position",
      body: "During startup, a [[control valve]] was assumed **fail-open ([[FO]])**, but the **piping and instrumentation diagram ([[P&ID]])** annotation showed **[[FC]] (fail-closed)**. Air loss forced the valve shut, causing an upstream level spike and trip.",
      takeaway: "Fail-state misreads on P&IDs can create immediate process upsets.",
      visual: {
        type: "callout",
        tone: "warning",
        text: "Validate FC/FO annotations before line-up or bypass decisions.",
      },
    },
    {
      id: "pid-02",
      kind: "concept",
      heading: "What P&IDs represent",
      body: "P&IDs describe process equipment, piping, instrumentation functions, and control intent. They do not replace detailed electrical schematics or panel wiring prints.",
      takeaway: "Use P&IDs for process logic, not conductor-level wiring details.",
    },
    {
      id: "pid-05",
      kind: "interaction",
      heading: "Knowledge check — isolation valve symbol",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "pid-03",
      kind: "concept",
      heading: "ISA tag basics for technicians",
      body: "Tags like **[[FT]] (flow transmitter)**-101 and **[[LT]] (level transmitter)**-204 encode measured variable and loop identity. First letters define primary variable; numbering ties the tag to [[loop sheet]]s and calibration records.",
      takeaway: "Tag literacy improves traceability from print to field device.",
    },
    {
      id: "pid-04",
      kind: "example",
      heading: "Valve symbol intent in troubleshooting",
      body: "Gate, globe, check, and control valve symbols define process function. Misidentifying a check valve as manual isolation can lead to wrong line-up and reverse-flow issues.",
      takeaway: "Symbol identification affects safe process decisions.",
    },
    {
      id: "pid-06",
      kind: "example",
      heading: "Bubble callouts and signal meaning",
      body: "Instrument bubbles include tag and function; line style can indicate pneumatic, electrical, or digital signal per legend. Always read legend before assuming signal type.",
      takeaway: "Legend-based interpretation prevents wrong test methods.",
    },
    {
      id: "pid-07",
      kind: "example",
      heading: "Control valve fail annotations",
      body: "[[FC]], [[FO]], and **[[FL]] (fail-last)** define final position after loss of air or power. This behavior is safety-critical and should match [[actuator]] setup, control narrative, and operator expectations.",
      takeaway: "Fail-state verification is a commissioning and safety requirement.",
    },
    {
      id: "pid-08",
      kind: "example",
      heading: "Flow path and check-valve direction",
      body: "Process flow arrows and check-valve symbols show allowed direction. During upset diagnostics, verify these symbols before concluding that a pump, transmitter, or controller has failed.",
      takeaway: "Diagram card reinforces one-way flow interpretation on P&IDs.",
      visual: { type: "diagram", variant: "pid-symbol-table" },
    },
    {
      id: "pid-09",
      kind: "example",
      heading: "Field procedure — tag walkdown",
      body: "1) Pull current P&ID and loop sheet. 2) Walk down each instrument tag in area. 3) Confirm physical tag, service, and direction of flow. 4) Mark discrepancies before calibrations begin.",
      takeaway: "Tag walkdowns prevent calibrating the wrong instrument loop.",
    },
    {
      id: "pid-10",
      kind: "example",
      heading: "Field procedure — loop-check prep from P&ID",
      body: "Before **milliampere (mA)** simulation, verify process function, alarm limits, and fail intent from P&ID and cause-and-effect notes. Coordinate with operations to avoid unintended trips.",
      takeaway: "Process intent review reduces unsafe test outcomes.",
    },
    {
      id: "pid-11",
      kind: "interaction",
      heading: "Knowledge check — check valve function",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "pid-12",
      kind: "example",
      heading: "Boundary between P&ID and wiring drawings",
      body: "Use P&ID to identify what the instrument does, then jump to loop or wiring drawings to determine exactly where to land leads and where signals terminate.",
      takeaway: "Right document at right step speeds troubleshooting and prevents errors.",
    },
    {
      id: "pid-13",
      kind: "summary",
      heading: "P&ID action bullets for field execution",
      body: "- Confirm current revision and legend meaning first\n- Decode instrument tags before touching devices\n- Verify valve/check symbols and flow direction\n- Validate fail positions (FC/FO/FL) with operations\n- Bridge P&ID intent to loop and wiring sheets",
      takeaway: "Use disciplined P&ID actions to protect process and uptime.",
    },
  ],
};
