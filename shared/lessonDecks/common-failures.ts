import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("powerflex-vfd", "common-failures")!;

export const COMMON_FAILURES_DECK: LessonCardDeck = {
  moduleSlug: "powerflex-vfd",
  lessonSlug: "common-failures",
  title: "Common Failure Modes in Manufacturing",
  whatYoullLearn: [
    "Recognize recurring PowerFlex failure patterns before they become major stops.",
    "Connect thermal, electrical, and mechanical symptoms to practical fixes.",
    "Build repeatable field checks using LOTO and meter-driven diagnostics.",
  ],
  estimatedMinutes: 14,
  previewCardCount: 2,
  cards: [
    {
      id: "cf-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **VFD**: variable frequency drive\n- **DC**: direct current\n- **LOTO**: lockout/tagout\n- **PM**: preventive maintenance",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "cf-01",
      kind: "concept",
      heading: "A cooling fan failure looked like random trip noise",
      body: "A **PowerFlex 525** variable frequency drive ([[VFD]]) in a dusty panel faulted only on hot afternoon shifts. Teams kept clearing faults and restarting. The root cause was a seized cooling fan and blocked airflow. Replacing the fan and cleaning filters ended repeat stops.",
      takeaway: "Repeated thermal-related faults often point to cooling hardware, not logic.",
      visual: { type: "callout", tone: "warning", text: "If trip frequency follows temperature, inspect airflow first." },
    },
    {
      id: "cf-02",
      kind: "concept",
      heading: "High-frequency failures in [[VFD]] service",
      body: "Common field failures include cooling loss, aging direct current (DC) bus capacitors, loose power terminations, and load-side faults. These issues produce recognizable fault code patterns. Early detection prevents emergency component swaps.",
      takeaway: "Pattern recognition shortens mean time to repair.",
    },
    {
      id: "cf-05",
      kind: "interaction",
      heading: "Knowledge check — signs of capacitor aging",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "cf-03",
      kind: "concept",
      heading: "Electrical symptoms can originate mechanically",
      body: "A bearing or conveyor jam increases torque demand and appears as current spikes at the drive. The drive reports electrical stress, but root cause may be mechanical resistance. Diagnose both paths together.",
      takeaway: "Drive [[fault]] codes report stress, not always source location.",
    },
    {
      id: "cf-04",
      kind: "example",
      heading: "Field example — aged capacitors causing undervoltage trips",
      body: "A nine-year-old drive began tripping undervoltage only during acceleration. Input voltage tested normal, but bus support sagged under load. Planned capacitor replacement restored stable starts without changing process speed.",
      takeaway: "Age-related capacitor decline appears under dynamic load, not idle checks.",
    },
    {
      id: "cf-06",
      kind: "example",
      heading: "Failure mode — fan seizure and overtemperature faults",
      body: "Symptom: thermal [[fault]] code appears after 20-30 minutes. Cause: seized internal fan plus clogged panel filter. Diagnostic: inspect fan operation, panel temperature rise, and heatsink cleanliness. Fix: replace fan, clean airflow path, and verify stable run.",
      takeaway: "Thermal faults demand airflow verification before parameter changes.",
    },
    {
      id: "cf-07",
      kind: "example",
      heading: "Failure mode — recurring overcurrent from mechanical drag",
      body: "Symptom: overcurrent [[fault]] code repeats at the same conveyor segment. Cause: worn idler bearings increasing load torque. Diagnostic: compare current spikes with physical location and listen for mechanical noise. Fix: repair bearings and confirm current trend normalizes.",
      takeaway: "If trip timing follows machine position, inspect mechanics before tuning.",
    },
    {
      id: "cf-08",
      kind: "concept",
      heading: "Failure localization through power stages",
      body: "Use stage-level mapping to decide where a failure most likely sits: line input, DC bus energy storage, or inverter/motor output. This keeps troubleshooting targeted.",
      takeaway: "Stage-based triage prevents random replacement.",
      visual: { type: "diagram", variant: "vfd-stages" },
    },
    {
      id: "cf-09",
      kind: "example",
      heading: "Field procedure — common failure inspection loop",
      body: "1. Perform **lockout/tagout ([[LOTO]]) procedure** and verify safe access. 2. Inspect fans, filters, and signs of heat damage. 3. Use a **multimeter** for input phase balance and terminal integrity. 4. Review [[fault]] code history and recent parameter edits. 5. Restart under controlled load and monitor current.",
      takeaway: "Mechanical, thermal, and electrical checks belong in one loop.",
    },
    {
      id: "cf-10",
      kind: "example",
      heading: "Field procedure — document and prevent recurrence",
      body: "1. Log failed component and observed [[fault]] code pattern. 2. Capture final parameter values after repair. 3. Define preventive maintenance ([[PM]]) check items for fan, filters, and terminal torque. 4. Verify no repeat faults over full shift runtime.",
      takeaway: "A repaired [[fault]] becomes preventive knowledge only when documented.",
    },
    {
      id: "cf-11",
      kind: "interaction",
      heading: "Knowledge check — fan failure consequences",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "cf-12",
      kind: "example",
      heading: "Application check — do not bypass protection to keep running",
      body: "When recurring failures hit production pressure, bypassing thermal or current limits may keep a line moving briefly but increases damage risk. Keep protections active, fix root cause, and only retune with evidence.",
      takeaway: "Protection bypass is not troubleshooting; it is risk escalation.",
    },
    {
      id: "cf-13",
      kind: "summary",
      heading: "Treat repeat faults as patterns, not surprises",
      body: "• You will use [[fault]] code patterns to classify likely failure mode quickly.\n• You will inspect cooling and mechanical load before changing protections.\n• You will verify electrical health with a multimeter during every major failure.\n• You will record repairs and parameter states so failures do not repeat across shifts.",
      takeaway: "Pattern, inspect, measure, document.",
    },
  ],
};
