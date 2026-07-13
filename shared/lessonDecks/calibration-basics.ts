import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("sensors-instrumentation", "calibration-basics")!;

export const CALIBRATION_BASICS_DECK: LessonCardDeck = {
  moduleSlug: "sensors-instrumentation",
  lessonSlug: "calibration-basics",
  title: "Calibration Basics",
  whatYoullLearn: [
    "Apply zero and span concepts to transmitter calibration tasks.",
    "Use as-found/as-left records for traceability and drift analysis.",
    "Perform safe multi-point checks on 4-20 mA instruments.",
  ],
  estimatedMinutes: 12,
  previewCardCount: 2,
  cards: [
    {
      id: "cb-01",
      kind: "concept",
      heading: "A passed startup still hid a bad transmitter",
      body: "A pressure loop passed a quick endpoint check, but mid-range readings drifted enough to trigger nuisance alarms the next day. The team had skipped [[multi-point verification]] and recorded no [[as-found]] data.",
      takeaway: "Two-point-only checks can miss real calibration error.",
      visual: {
        type: "callout",
        tone: "field",
        text: "No as-found record means no evidence of drift trend or root cause.",
      },
    },
    {
      id: "cb-02",
      kind: "concept",
      heading: "Zero and span are different corrections",
      body: "[[Zero]] aligns low-end output to reference baseline. [[Span]] aligns high-end gain so full-scale output matches reference. Correcting the wrong one can make mid-range error worse.",
      takeaway: "Decide whether the error is offset, slope, or both before adjusting.",
    },
    {
      id: "cb-05",
      kind: "interaction",
      heading: "Knowledge check — zero and span purpose",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "cb-03",
      kind: "example",
      heading: "Interpreting error pattern quickly",
      body: "If zero is correct but high end is high, span likely needs correction. If both ends shift by similar amount, zero offset is likely. Mixed behavior can indicate nonlinearity or hardware issues.",
      takeaway: "Error shape across points points to the right adjustment.",
    },
    {
      id: "cb-04",
      kind: "concept",
      heading: "As-found and as-left records are operational assets",
      body: "These records support audits, reliability planning, and interval optimization. They also protect teams during handoff by showing exactly what changed and what tolerance was achieved.",
      takeaway: "Documentation quality directly affects future maintenance quality.",
    },
    {
      id: "cb-06",
      kind: "example",
      heading: "Tolerance decisions must follow site standards",
      body: "An instrument can be functionally usable yet outside documented tolerance. Calibration acceptance should align with criticality, compliance requirements, and declared uncertainty of the reference standard.",
      takeaway: "Passing operation does not always equal passing calibration.",
    },
    {
      id: "cb-07",
      kind: "concept",
      heading: "Multi-point up and down checks catch hysteresis",
      body: "Checking several points while increasing and decreasing signal can reveal [[hysteresis]] or sticking behavior invisible in simple endpoint checks. This is especially useful for aging [[transmitter]]s.",
      takeaway: "Bidirectional checks reveal dynamic measurement quality.",
    },
    {
      id: "cb-08",
      kind: "example",
      heading: "Calibration workflow mapped to loop terminals",
      body: "Disconnect loop safely, connect calibrated source/meter in series, apply known points, then compare measured [[loop current]] to expected and indicated values. Restore wiring and verify normal operation before handoff.",
      takeaway: "A repeatable wiring-and-source method prevents accidental mis-landing.",
      visual: { type: "diagram", variant: "io-terminal" },
    },
    {
      id: "cb-09",
      kind: "example",
      heading: "Field procedure — multimeter plus source verification",
      body: "Use a traceable source when possible, then verify actual loop current with a meter rather than trusting source setpoint alone. Record ambient and setup notes that may affect repeatability.",
      takeaway: "Trust measured mA, not only commanded mA.",
    },
    {
      id: "cb-10",
      kind: "example",
      heading: "Field procedure — drift-driven interval review",
      body: "If [[as-found]] data repeatedly shows [[drift]] near limits, shorten interval or investigate environment and installation factors. If stable over cycles, interval may be safely optimized per policy.",
      takeaway: "Calibration intervals should be evidence-based, not purely calendar-based.",
      visual: {
        type: "callout",
        tone: "tip",
        text: "Trend drift by tag to prioritize high-impact instruments first.",
      },
    },
    {
      id: "cb-11",
      kind: "interaction",
      heading: "Knowledge check — high-end error correction",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "cb-12",
      kind: "summary",
      heading: "Calibration is measurement confidence management",
      body: "• You will distinguish zero versus span corrections before adjusting transmitter output.\n• You will run multi-point verification against the as-found record.\n• You will create as-found/as-left records that survive audit and shift handoff.",
      takeaway: "Good calibration combines technique, evidence, and traceability.",
    },
  ],
};
