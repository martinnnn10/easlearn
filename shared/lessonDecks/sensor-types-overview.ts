import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("sensors-instrumentation", "sensor-types-overview")!;

export const SENSOR_TYPES_OVERVIEW_DECK: LessonCardDeck = {
  moduleSlug: "sensors-instrumentation",
  lessonSlug: "sensor-types-overview",
  reflection: true, // apprenticeship closeout — scenario in shared/lessonCloseouts.ts (SME-audited)
  title: "Industrial Sensor Types Overview",
  whatYoullLearn: [
    "Separate discrete state detection from analog process measurement.",
    "Match NPN/PNP output style to PLC input card expectations.",
    "Verify sensor loops in the field with safe meter-driven checks.",
  ],
  estimatedMinutes: 12,
  previewCardCount: 2,
  cards: [
    {
      id: "sto-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **PLC**: programmable logic controller\n- **I/O**: input/output\n- **NPN**: sinking output type (current flows into sensor)\n- **PNP**: sourcing output type (current flows out of sensor)\n- **HMI**: human-machine interface",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "sto-01",
      kind: "concept",
      heading: "The line was down because the wrong sensor was installed",
      body: "A replacement tech installed a discrete prox where a 4-20 mA level transmitter belonged. The **PLC (programmable logic controller)** input showed only ON/OFF and the filler oscillated until production stopped. The issue was not ladder logic; it was a mismatched signal type at the instrument.",
      takeaway: "Pick signal type first: state sensing vs continuous measurement.",
      visual: {
        type: "callout",
        tone: "field",
        text: "Wrong replacement part can mimic a control bug for hours.",
      },
    },
    {
      id: "sto-02",
      kind: "concept",
      heading: "Discrete and analog answer different questions",
      body: "Discrete sensors answer yes/no questions like product present. Analog sensors answer how much questions like level, temperature, or pressure. Control strategies fail when these two intents are mixed.",
      takeaway: "Use discrete for events, analog for continuous process values.",
    },
    {
      id: "sto-05",
      kind: "interaction",
      heading: "Knowledge check — discrete vs analog",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "sto-03",
      kind: "example",
      heading: "Common floor examples",
      body: "Inductive prox confirms metal target arrival at a stop gate. A pressure transmitter sends 4-20 mA to represent vessel pressure. Both are sensors, but only one is suitable for **PID (proportional-integral-derivative)** control.",
      takeaway: "Sensor category drives wiring, card type, and control logic.",
    },
    {
      id: "sto-04",
      kind: "concept",
      heading: "[[NPN]], [[PNP]], [[sinking]], and [[sourcing]]",
      body: "**PNP ([[sourcing]] output)** outputs source positive voltage when active and often pair with [[sinking]] [[PLC]] inputs. **NPN ([[sinking]] output)** outputs sink to common and pair with [[sourcing]] inputs. Wrong pairings cause dead or inverted bits.",
      takeaway: "Confirm output style and input card type before termination.",
      visual: { type: "diagram", variant: "npn-pnp-wiring" },
    },
    {
      id: "sto-06",
      kind: "example",
      heading: "4-20 mA survives noisy plant environments",
      body: "Current loops maintain signal integrity over long runs better than voltage-only signals. A live-zero at 4 mA also helps identify open-loop faults or dead transmitters faster during startup.",
      takeaway: "Live-zero and distance robustness are why current loops dominate industry.",
    },
    {
      id: "sto-07",
      kind: "concept",
      heading: "Input card LEDs are fast truth checks",
      body: "Before forcing code changes, verify whether the [[PLC]] card sees the signal state you expect. If the LED does not change while the field condition changes, diagnose power, common, and wiring first.",
      takeaway: "Card LED behavior narrows faults before software edits.",
    },
    {
      id: "sto-08",
      kind: "example",
      heading: "Terminal map before troubleshooting",
      body: "Document sensor terminal, common, and [[PLC]] point mapping before touching logic. A clean point map reduces swap mistakes and reveals cross-landed wires during shift handoff.",
      takeaway: "A mapped terminal sheet prevents repeated troubleshooting loops.",
      visual: { type: "diagram", variant: "io-terminal" },
    },
    {
      id: "sto-09",
      kind: "example",
      heading: "Field symptom: analog flatline at 0%",
      body: "If an **HMI (human-machine interface)** value sits at 0% while process clearly changes, check loop power and meter loop current at a test jack. A measured 0 mA indicates open loop, blown fuse, or broken return path.",
      takeaway: "Measure loop current before changing scale settings.",
    },
    {
      id: "sto-10",
      kind: "example",
      heading: "Field procedure — multimeter and loop sanity check",
      body: "1. Confirm loop supply is present. 2. Measure current in series at the instrument loop. 3. Verify card sees roughly 4 mA at low end and 20 mA at high end. 4. Record engineering-unit value shown on [[HMI]] for each point.",
      takeaway: "Loop mA and displayed engineering units must track together.",
      visual: {
        type: "callout",
        tone: "tip",
        text: "At 12 mA, most linear scales should indicate near 50% span.",
      },
    },
    {
      id: "sto-11",
      kind: "interaction",
      heading: "Knowledge check — [[PLC]] compatibility choice",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "sto-12",
      kind: "summary",
      heading: "Start with signal intent, then wire type",
      body: "• You will separate state detection from continuous measurement before selecting a sensor.\n• You will match output style to input card behavior on the **I/O (input/output)** list.\n• You will verify 4-20 mA loops with a multimeter before changing scaling in the [[PLC]].",
      takeaway: "Signal type and wiring conventions prevent avoidable downtime.",
    },
  ],
};
