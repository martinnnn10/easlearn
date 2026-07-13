import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("powerflex-vfd", "powerflex-parameter-groups")!;

export const POWERFLEX_PARAMETER_GROUPS_DECK: LessonCardDeck = {
  moduleSlug: "powerflex-vfd",
  lessonSlug: "powerflex-parameter-groups",
  title: "PowerFlex Parameter Groups & Navigation",
  whatYoullLearn: [
    "Navigate PowerFlex parameter groups without changing the wrong value.",
    "Separate parameter edits from fault code diagnostics during startup issues.",
    "Apply safe documentation habits before and after parameter changes.",
  ],
  estimatedMinutes: 13,
  previewCardCount: 2,
  cards: [
    {
      id: "pfg-01",
      kind: "concept",
      heading: "Line restart failed after one undocumented keypad edit",
      body: "A packaging line with a **PowerFlex 525** started tripping after a shift tech changed one parameter and left no notes. Day shift saw a new fault code, but nobody knew the original value. The drive was healthy; the parameter history was missing. Four hours were lost recreating settings from memory.",
      takeaway: "Parameter changes without a baseline create longer downtime than the original [[fault]].",
      visual: { type: "callout", tone: "warning", text: "Record parameter number + old value before every edit." },
    },
    {
      id: "pfg-02",
      kind: "concept",
      heading: "What parameter groups actually organize",
      body: "PowerFlex groups split settings by function: basic run behavior, motor nameplate data, communications, and diagnostics. A label like **P102** is a configurable value, not a terminal point. Reading the right group first prevents random edits when a [[fault]] code appears.",
      takeaway: "Parameter group context is your troubleshooting map before touching values.",
    },
    {
      id: "pfg-05",
      kind: "interaction",
      heading: "Knowledge check — interpreting P-group parameters",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "pfg-03",
      kind: "concept",
      heading: "Parameter versus [[fault]] code",
      body: "A **parameter** defines behavior (accel, speed source, motor current limits). A **fault code** reports a protection event that already happened. Clear the [[fault]] only after verifying which parameter and field condition caused it.",
      takeaway: "Treat [[fault]] codes as evidence and parameters as controllable causes.",
    },
    {
      id: "pfg-04",
      kind: "example",
      heading: "Field example — finding wrong accel/decel values",
      body: "Conveyor overshoot appeared after maintenance. Tech review found accel/decel parameters changed during keypad navigation while troubleshooting an unrelated alarm. Restoring documented values removed the nuisance stop without replacing hardware.",
      takeaway: "Compare current values to documented baseline before replacing components.",
    },
    {
      id: "pfg-06",
      kind: "example",
      heading: "Failure mode — nuisance [[overload]] trip after motor swap",
      body: "Symptom: repeated overload-related [[fault]] code during normal load. Cause: motor nameplate parameter left from old motor, so limit was too low. Diagnostic: compare drive motor current parameter to actual nameplate and multimeter current reading. Fix: enter correct nameplate parameter values, then retest ramp.",
      takeaway: "Wrong motor-data parameters can mimic mechanical problems.",
    },
    {
      id: "pfg-07",
      kind: "example",
      heading: "Failure mode — drive ignores expected speed command",
      body: "Symptom: operator changes **HMI (human-machine interface)** speed but drive stays fixed. Cause: speed reference source parameter points to keypad instead of network input. Diagnostic: verify command source parameter and confirm active ownership. Fix: set correct source and validate run from authorized control point.",
      takeaway: "Always confirm command source parameters before editing ladder rung logic.",
    },
    {
      id: "pfg-08",
      kind: "concept",
      heading: "Visual map — where faults and parameters connect",
      body: "This flow helps decide if you should investigate input power, motor data, or command settings when a [[fault]] code appears. Use it before opening random groups on the keypad.",
      takeaway: "Read the stage and symptom first, then navigate to the relevant parameter group.",
      visual: { type: "diagram", variant: "vfd-stages" },
    },
    {
      id: "pfg-09",
      kind: "example",
      heading: "Field procedure — safe parameter review",
      body: "1. Follow **LOTO (lockout/tagout)** procedure if cabinet access is required. 2. Open parameter list and record parameter number, old value, and timestamp. 3. Change one parameter only. 4. Run machine at low load and monitor [[fault]] code queue and output current. 5. Document final value and reason in work order.",
      takeaway: "Single-change discipline prevents stacked troubleshooting errors.",
    },
    {
      id: "pfg-10",
      kind: "example",
      heading: "Field procedure — verify with meter and trend",
      body: "1. Use a **multimeter** to confirm input voltage and phase balance before blaming parameters. 2. Check drive current parameter against motor nameplate FLA. 3. Review last [[fault]] code entries. 4. If needed, restore prior value and retest one cycle.",
      takeaway: "Parameter edits must be backed by electrical measurements, not guesswork.",
    },
    {
      id: "pfg-11",
      kind: "interaction",
      heading: "Knowledge check — controlled parameter changes",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "pfg-12",
      kind: "example",
      heading: "Application check — when not to edit parameters",
      body: "If a [[fault]] code points to missing input phase, do not start by tuning ramps. First confirm three-phase supply at the drive line side with a multimeter. Correct electrical supply faults before returning to parameter adjustments.",
      takeaway: "Use [[fault]] evidence order: supply, wiring, parameter, then component replacement.",
    },
    {
      id: "pfg-13",
      kind: "summary",
      heading: "Parameter discipline prevents repeat downtime",
      body: "• You will document each parameter number and original value before edits.\n• You will separate [[fault]] code evidence from configuration changes.\n• You will verify supply and load with a multimeter before changing settings.\n• You will change one parameter at a time and retest under controlled load.",
      takeaway: "Baseline, measure, change once, verify.",
    },
  ],
};
