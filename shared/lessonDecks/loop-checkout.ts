import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("sensors-instrumentation", "loop-checkout")!;

export const LOOP_CHECKOUT_DECK: LessonCardDeck = {
  moduleSlug: "sensors-instrumentation",
  lessonSlug: "loop-checkout",
  title: "Loop Checkout & Verification",
  whatYoullLearn: [
    "Run end-to-end analog loop checks from field to HMI.",
    "Validate 4-20 mA scaling and alarm/action behavior at key points.",
    "Execute safe bump and stroke procedures with operations coordination.",
  ],
  estimatedMinutes: 12,
  previewCardCount: 2,
  cards: [
    {
      id: "lc-01",
      kind: "concept",
      heading: "Commissioning delay from one bad scale block",
      body: "A new flow loop looked healthy in the field, but the **human-machine interface (HMI)** displayed 75% at 12 mA and tripped high alarms during checkout. The root cause was mismatched **programmable logic controller (PLC)** scaling, discovered only after end-to-end simulation.",
      takeaway: "Loop checkout catches integration faults calibration alone cannot.",
      visual: {
        type: "callout",
        tone: "field",
        text: "Field signal correct + HMI wrong usually means mapping or scaling mismatch.",
      },
    },
    {
      id: "lc-02",
      kind: "concept",
      heading: "Loop checkout is an end-to-end test",
      body: "You are not only proving instrument output. You are proving marshalling, [[PLC]] input configuration, engineering scaling, alarming, and any final-element response tied to the loop.",
      takeaway: "Checkout scope includes every hop in the control chain.",
    },
    {
      id: "lc-05",
      kind: "interaction",
      heading: "Knowledge check — why simulate multiple points",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "lc-03",
      kind: "example",
      heading: "Three-point simulation strategy",
      body: "Inject 4, 12, and 20 mA to verify low, midpoint, and high behavior. Compare measured current, [[PLC]] value, and [[HMI]] display at each point before enabling automatic control.",
      takeaway: "Three-point checks expose both endpoint and midscale errors.",
    },
    {
      id: "lc-04",
      kind: "concept",
      heading: "Direction matters as much as value",
      body: "A loop can display a believable value while acting in reverse due to inversion in scaling or final control element setup. Confirm that process variable and manipulated variable move in expected directions.",
      takeaway: "Validate loop polarity before closed-loop operation.",
    },
    {
      id: "lc-06",
      kind: "example",
      heading: "Valve stroke confirms final element readiness",
      body: "Command full travel limits and verify position feedback and directionality. Mechanical sticking, air supply issues, or linkage problems can pass signal checks yet fail process control.",
      takeaway: "Final element movement is mandatory evidence before startup.",
    },
    {
      id: "lc-07",
      kind: "concept",
      heading: "Bump tests should be small and controlled",
      body: "Use limited perturbations to observe loop response safely. Large step changes may upset production and obscure useful diagnostic behavior during commissioning windows.",
      takeaway: "Small, planned bumps reveal dynamics without unnecessary risk.",
    },
    {
      id: "lc-08",
      kind: "example",
      heading: "Loop terminal chain review before live tests",
      body: "Trace instrument output to marshalling, card terminal, [[PLC]] tag, and [[HMI]] point before bumping live process. This prevents running tests on the wrong loop or wrong controller tag.",
      takeaway: "Point-to-point verification prevents dangerous misidentification.",
      visual: { type: "diagram", variant: "io-terminal" },
    },
    {
      id: "lc-09",
      kind: "example",
      heading: "Field procedure — multimeter in series for truth",
      body: "Insert meter in series to confirm real loop current while simulation is applied. Do not rely on only source readout or only [[HMI]] value; validate both against measured mA.",
      takeaway: "Measured current anchors the checkout record to physical reality.",
    },
    {
      id: "lc-10",
      kind: "example",
      heading: "Field procedure — operations-safe bump execution",
      body: "Coordinate test window, notify operations, set guardrails, and define abort criteria. Perform small bumps, capture PV/MV trend response, and restore normal mode only after confirming stable behavior.",
      takeaway: "Communication and safe process window are part of technical quality.",
      visual: {
        type: "callout",
        tone: "warning",
        text: "Never run live bump tests without operations signoff and stop criteria.",
      },
    },
    {
      id: "lc-11",
      kind: "interaction",
      heading: "Knowledge check — bump test objective",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "lc-12",
      kind: "summary",
      heading: "Checkout verifies readiness, not just wiring",
      body: "• You will trace analog loops across 4-20 mA points with a multimeter before changing scale.\n• You will prove final-element response before closed-loop operation.\n• You will run coordinated bump tests with operations signoff and stop criteria.",
      takeaway: "End-to-end evidence is the standard for loop readiness.",
    },
  ],
};
