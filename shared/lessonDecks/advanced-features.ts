import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("powerflex-vfd", "advanced-features")!;

export const ADVANCED_FEATURES_DECK: LessonCardDeck = {
  moduleSlug: "powerflex-vfd",
  lessonSlug: "advanced-features",
  title: "Advanced Features: PID, Multi-Speed, Communication",
  whatYoullLearn: [
    "Apply PowerFlex PID and multi-speed features without creating unstable control.",
    "Set command authority rules between keypad and network control.",
    "Diagnose communication-related behavior using structured checks.",
  ],
  estimatedMinutes: 15,
  previewCardCount: 2,
  cards: [
    {
      id: "af-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **PID**: proportional-integral-derivative\n- **PLC**: programmable logic controller\n- **LOTO**: lockout/tagout\n- **PV**: process variable\n- **SP**: setpoint\n- **DC**: direct current",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "af-01",
      kind: "concept",
      heading: "[[PID]] enabled fast, loop oscillated all shift",
      body: "A water transfer skid using **PowerFlex 755** switched to drive proportional-integral-derivative ([[PID]]) during startup and immediately hunted around setpoint. Operators thought the sensor failed, but gain was too aggressive and scaling was wrong. Output kept surging until mode was returned to manual. Correct tuning restored stable flow.",
      takeaway: "Advanced features fail fast when feedback scaling and gains are wrong.",
      visual: { type: "callout", tone: "warning", text: "Validate scaling before increasing PID gain." },
    },
    {
      id: "af-02",
      kind: "concept",
      heading: "What advanced features add to base control",
      body: "Advanced functions include internal [[PID]], multi-speed presets, and network command exchange. They reduce programmable logic controller ([[PLC]]) workload when configured correctly. They also add failure points when command ownership is unclear.",
      takeaway: "Advanced features improve control only with explicit authority and validation.",
    },
    {
      id: "af-05",
      kind: "interaction",
      heading: "Knowledge check — purpose of drive [[PID]]",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "af-03",
      kind: "concept",
      heading: "Command authority must be deterministic",
      body: "If keypad and network both issue run/speed commands, behavior becomes unpredictable. Define one active owner and a comm-loss fallback mode. This prevents unintended starts and unsafe transitions.",
      takeaway: "One active command path is a safety and reliability requirement.",
    },
    {
      id: "af-04",
      kind: "example",
      heading: "Field example — preset speeds for recipe changeovers",
      body: "A packaging machine used three discrete speeds selected by [[PLC]] outputs for product recipes. Multi-speed presets gave repeatable transitions without analog scaling drift. Verification included load tests at each preset and fault monitoring.",
      takeaway: "Preset speeds simplify repeatable operation when process states are discrete.",
    },
    {
      id: "af-06",
      kind: "example",
      heading: "Failure mode — [[PID]] oscillation around setpoint",
      body: "Symptom: output speed swings and process variable hunts. Cause: gain too high with poorly scaled feedback. Diagnostic: trend process variable (PV), setpoint (SP), and output while reducing gain increments. Fix: correct scaling and tune gradually under controlled process load.",
      takeaway: "Most loop instability starts with gain/scaling mismatch, not hardware failure.",
    },
    {
      id: "af-07",
      kind: "example",
      heading: "Failure mode — network/keypad command conflict",
      body: "Symptom: drive starts from keypad while [[PLC]] expects stop state. Cause: command priority not enforced after maintenance testing. Diagnostic: verify active command source parameter and run permissive chain. Fix: restore authority strategy and lock local mode for production.",
      takeaway: "Control conflicts are configuration faults, not random comm glitches.",
    },
    {
      id: "af-08",
      kind: "concept",
      heading: "Visual stage context for advanced diagnostics",
      body: "Even advanced features still act through rectifier, direct current (DC) bus, and inverter stages. When behavior is abnormal, separate control strategy issues from power-stage faults.",
      takeaway: "Advanced control sits on top of the same electrical backbone.",
      visual: { type: "diagram", variant: "vfd-stages" },
    },
    {
      id: "af-09",
      kind: "example",
      heading: "Field procedure — commissioning advanced features",
      body: "1. Apply **lockout/tagout ([[LOTO]]) procedure** where cabinet access is needed. 2. Record baseline parameters. 3. Configure one feature at a time ([[PID]], preset, or comm ownership). 4. Run staged tests while monitoring [[fault]] queue and output current. 5. Approve only after stable repeat cycles.",
      takeaway: "Sequence one feature per test to isolate results clearly.",
    },
    {
      id: "af-10",
      kind: "example",
      heading: "Field procedure — communication and signal validation",
      body: "1. Verify network status and cyclic data mapping ownership. 2. Check local/remote mode indicators. 3. Use a **multimeter** to confirm analog feedback scaling if [[PID]] uses field input. 4. Simulate comm loss and confirm safe fallback response.",
      takeaway: "Commissioning is incomplete until safe comm-loss behavior is verified.",
    },
    {
      id: "af-11",
      kind: "interaction",
      heading: "Knowledge check — command conflict prevention",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[3]),
    },
    {
      id: "af-12",
      kind: "example",
      heading: "Application check — keep sequence logic in ladder [[rung]] control",
      body: "Drive features can control speed behavior, but machine sequence interlocks still belong in [[PLC]] ladder rung logic. Keep responsibilities clear: drive handles motion profile, [[PLC]] handles coordinated machine state and safety permissives.",
      takeaway: "Clear split between drive control and [[PLC]] sequence prevents hidden logic fights.",
    },
    {
      id: "af-13",
      kind: "summary",
      heading: "Use advanced features with controlled ownership",
      body: "• You will validate feedback scaling before [[PID]] tuning.\n• You will enforce one active command authority at a time.\n• You will commission presets and [[PID]] through staged tests, not bulk edits.\n• You will verify safe comm-loss behavior before production handoff.\n• You will keep machine sequence intent in ladder [[rung]] logic while drive handles speed control.",
      takeaway: "Configure clearly, tune slowly, verify safely.",
    },
  ],
};
