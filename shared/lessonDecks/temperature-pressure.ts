import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("sensors-instrumentation", "temperature-pressure")!;

export const TEMPERATURE_PRESSURE_DECK: LessonCardDeck = {
  moduleSlug: "sensors-instrumentation",
  lessonSlug: "temperature-pressure",
  title: "Temperature & Pressure Instrumentation",
  whatYoullLearn: [
    "Select RTD vs thermocouple based on range and accuracy needs.",
    "Prevent pressure measurement errors from impulse-line issues.",
    "Validate 4-20 mA scaling with meter and control-room observations.",
  ],
  estimatedMinutes: 12,
  previewCardCount: 2,
  cards: [
    {
      id: "tp-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **RTD**: resistance temperature detector\n- **PLC**: programmable logic controller\n- **LRV**: lower range value\n- **URV**: upper range value\n- **PV**: process variable\n",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "tp-01",
      kind: "concept",
      heading: "Boiler shutdown from a bad pressure reading",
      body: "A boiler trip occurred when pressure appeared to spike, but the process was stable. Root cause was a partially blocked impulse line causing delayed and distorted transmitter response, not a true process excursion.",
      takeaway: "Bad instrument plumbing can look like bad process behavior.",
      visual: {
        type: "callout",
        tone: "field",
        text: "If PV behavior is implausible, inspect sensing path before retuning controls.",
      },
    },
    {
      id: "tp-02",
      kind: "concept",
      heading: "[[RTD]] and thermocouple are not interchangeable",
      body: "**RTDs (resistance temperature detectors)** generally offer strong accuracy and stability in moderate ranges. Thermocouples handle wider high-temperature service but require correct type matching and compensation for reliable readings.",
      takeaway: "Sensor element choice should match temperature range and accuracy target.",
    },
    {
      id: "tp-05",
      kind: "interaction",
      heading: "Knowledge check — [[RTD]] selection reason",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "tp-03",
      kind: "example",
      heading: "Thermocouple measurement chain",
      body: "Thermocouples generate millivolt signals that are sensitive to wiring and reference compensation. A wrong type configuration or missing compensation can offset readings enough to mislead operators.",
      takeaway: "Low-level millivolt signals demand proper input/transmitter setup.",
    },
    {
      id: "tp-04",
      kind: "concept",
      heading: "Pressure transmitters depend on impulse-line health",
      body: "Leaks, plugs, trapped condensate, or poor routing can introduce lag and bias between process pressure and sensed pressure. Maintenance of tubing and manifold hardware is measurement maintenance.",
      takeaway: "Impulse-line condition is part of instrument accuracy.",
    },
    {
      id: "tp-06",
      kind: "example",
      heading: "LRV and URV determine engineering meaning",
      body: "A healthy 4-20 mA loop still displays wrong process units when transmitter range or **PLC (programmable logic controller)** scaling is wrong. Confirm **LRV (lower range value)**/**URV (upper range value)** and corresponding engineering unit mapping at both instrument and control configuration layers.",
      takeaway: "Correct current does not guarantee correct engineering value.",
    },
    {
      id: "tp-07",
      kind: "example",
      heading: "Noise and grounding in low-level temperature circuits",
      body: "Thermocouple extension type mismatch or poor shield termination can create unstable **PV (process variable)**. Route instrumentation wiring away from power conductors and follow site grounding standards for repeatable measurements.",
      takeaway: "Signal integrity practices are essential for stable analog readings.",
    },
    {
      id: "tp-08",
      kind: "example",
      heading: "Map field values to [[PLC]] analog input channel",
      body: "During startup, track sensor element, transmitter output, [[PLC]] raw count, and displayed engineering units as one chain. This avoids guessing when discrepancies appear between panel meter and **HMI (human-machine interface)** trend.",
      takeaway: "Instrument-to-[[HMI]] traceability shortens commissioning delays.",
      visual: { type: "diagram", variant: "io-terminal" },
    },
    {
      id: "tp-09",
      kind: "example",
      heading: "Field procedure — pressure signal verification",
      body: "Isolate transmitter safely, apply known pressure source, and meter loop current at several points. Compare expected versus displayed values and confirm monotonic response with no dead band.",
      takeaway: "Known source plus measured mA exposes scaling or sensing faults quickly.",
    },
    {
      id: "tp-10",
      kind: "example",
      heading: "Field procedure — 4-20 mA midpoint check",
      body: "Inject 12 mA with a loop calibrator and verify about 50% span in the control system. If reading is significantly off, investigate card scaling, transmitter range, or engineering unit conversion errors.",
      takeaway: "12 mA is a quick midpoint truth test for analog loops.",
      visual: {
        type: "callout",
        tone: "tip",
        text: "Document source, measured mA, and displayed value in one record line.",
      },
    },
    {
      id: "tp-11",
      kind: "interaction",
      heading: "Knowledge check — thermocouple measurement requirements",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "tp-12",
      kind: "summary",
      heading: "Reliable PV requires correct sensor and complete signal chain",
      body: "• You will choose temperature elements by application before wiring the loop.\n• You will protect pressure measurement fidelity through impulse-line care and isolation checks.\n• You will validate analog scaling end-to-end with a known source and multimeter evidence.",
      takeaway: "Trust measurements only after the full chain is verified.",
    },
  ],
};
