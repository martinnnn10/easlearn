import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("powerflex-vfd", "basic-programming")!;

export const BASIC_PROGRAMMING_DECK: LessonCardDeck = {
  moduleSlug: "powerflex-vfd",
  lessonSlug: "basic-programming",
  title: "Basic Programming: Speed Reference, Accel/Decel, Motor Data",
  whatYoullLearn: [
    "Set core PowerFlex run parameters without creating nuisance trips.",
    "Choose the correct speed reference source for keypad, analog, or network control.",
    "Validate ramp behavior with measurements before production release.",
  ],
  estimatedMinutes: 14,
  previewCardCount: 2,
  cards: [
    {
      id: "bp-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **DC**: direct current\n- **LOTO**: lockout/tagout\n- **PLC**: programmable logic controller\n",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "bp-01",
      kind: "concept",
      heading: "Conveyor slammed to speed after rushed commissioning",
      body: "A **PowerFlex 525** replacement on a bottling line started at an aggressive ramp and spilled product on first run. Parameter values were copied from a different load profile. The motor and gearbox were fine; programming was not. Production stopped for cleanup and retuning.",
      takeaway: "Basic programming errors can look like mechanical failure in minutes.",
      visual: { type: "callout", tone: "field", text: "Tune accel/decel for the actual load, not a similar machine." },
    },
    {
      id: "bp-02",
      kind: "concept",
      heading: "Core parameters drive behavior",
      body: "Basic programming covers speed reference, accel/decel times, and motor data. These values determine how the drive responds to a run command and how fast torque demand changes. Wrong defaults can trigger fault codes before any hardware issue exists.",
      takeaway: "Start with core parameters before replacing parts.",
    },
    {
      id: "bp-05",
      kind: "interaction",
      heading: "Knowledge check — what P101-P104 influence",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "bp-03",
      kind: "concept",
      heading: "Speed command ownership must be explicit",
      body: "If speed reference is set to keypad, network commands may appear ignored. If set to network, local keypad changes may do nothing. Define one active command path and verify it in startup checks.",
      takeaway: "One control source at a time prevents conflicting commands.",
    },
    {
      id: "bp-04",
      kind: "example",
      heading: "Field example — correcting bad decel on high inertia",
      body: "A loaded conveyor generated overvoltage [[fault]] code events during stop. Decel parameter was too short for the inertia, so regenerative energy pushed bus voltage high. Extending decel stabilized stop behavior without hardware changes.",
      takeaway: "High-inertia loads need realistic decel settings to avoid bus faults.",
    },
    {
      id: "bp-06",
      kind: "example",
      heading: "Failure mode — motor jerks then trips overcurrent",
      body: "Symptom: hard launch, brief current spike, nuisance [[fault]] code. Cause: acceleration parameter too short for belt load. Diagnostic: compare output current trend to ramp time while observing mechanics. Fix: increase accel time and retest under normal load.",
      takeaway: "Aggressive ramps create current spikes that resemble electrical faults.",
    },
    {
      id: "bp-07",
      kind: "example",
      heading: "Failure mode — command accepted, wrong speed achieved",
      body: "Symptom: displayed frequency does not match expected process speed. Cause: base motor data parameter entered incorrectly during setup. Diagnostic: verify nameplate frequency and voltage, then compare with programmed values. Fix: correct motor data and revalidate at multiple setpoints.",
      takeaway: "Accurate nameplate entry is required for predictable speed and torque.",
    },
    {
      id: "bp-08",
      kind: "concept",
      heading: "Programming context across power stages",
      body: "Ramp and speed parameters change how the inverter requests current and frequency from the **DC (direct current)** bus. Use this stage map to connect parameter edits to real electrical behavior.",
      takeaway: "Every programming change moves electrical stress somewhere in the drive.",
      visual: { type: "diagram", variant: "vfd-stages" },
    },
    {
      id: "bp-09",
      kind: "example",
      heading: "Field procedure — controlled basic programming test",
      body: "1. Verify **LOTO (lockout/tagout) procedure** complete if panel access is needed. 2. Record current parameter set. 3. Enter one change (speed source or ramp). 4. Start unloaded, then loaded, while watching output current and [[fault]] code queue. 5. Log pass/fail and final value.",
      takeaway: "Controlled sequencing avoids layered startup faults.",
    },
    {
      id: "bp-10",
      kind: "example",
      heading: "Field procedure — electrical verification before final release",
      body: "1. Use a **multimeter** to confirm stable three-phase input at line terminals. 2. Verify motor rotation and process direction at low speed first. 3. Check drive current against nameplate FLA at target speed. 4. Confirm no recurring [[fault]] code after five cycles.",
      takeaway: "Programming sign-off requires measured electrical stability, not one successful start.",
    },
    {
      id: "bp-11",
      kind: "interaction",
      heading: "Knowledge check — commissioning verification",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[3]),
    },
    {
      id: "bp-12",
      kind: "example",
      heading: "Application check — avoid fixing with ladder [[rung]] hacks",
      body: "When drive behavior is unstable due to parameter setup, adding delays in a **PLC (programmable logic controller)** ladder rung can hide symptoms without fixing root cause. Correct drive parameters first, then use [[PLC]] logic only for sequence intent and interlocks.",
      takeaway: "Do not compensate bad drive setup with temporary [[PLC]] timing patches.",
    },
    {
      id: "bp-13",
      kind: "summary",
      heading: "Program once, validate like a technician",
      body: "• You will set speed source ownership before run testing.\n• You will tune accel/decel based on load inertia and measured current.\n• You will verify motor data parameters from the nameplate, not memory.\n• You will confirm repeatable starts/stops with no recurring [[fault]] code.\n• You will avoid ladder [[rung]] workarounds for drive parameter problems.",
      takeaway: "Measured commissioning beats trial-and-error edits.",
    },
  ],
};
