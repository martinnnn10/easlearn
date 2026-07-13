import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("powerflex-vfd", "fault-codes-diagnostics")!;

export const FAULT_CODES_DIAGNOSTICS_DECK: LessonCardDeck = {
  moduleSlug: "powerflex-vfd",
  lessonSlug: "fault-codes-diagnostics",
  reflection: true, // apprenticeship closeout — scenario in shared/lessonCloseouts.ts
  title: "Fault Codes & Diagnostic Procedures",
  whatYoullLearn: [
    "Interpret PowerFlex fault codes as diagnostic evidence, not random alarms.",
    "Build a symptom-to-cause workflow before clearing and restarting.",
    "Use meter checks and fault history to isolate electrical vs mechanical causes.",
  ],
  estimatedMinutes: 15,
  previewCardCount: 2,
  cards: [
    {
      id: "fcd-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **VFD**: variable frequency drive\n- **LOTO**: lockout/tagout\n- **DC**: direct current",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "fcd-01",
      kind: "concept",
      heading: "Resetting F004 all shift finally ended in a hard trip",
      body: "A **PowerFlex 753** on a palletizer kept showing F004 and operators repeatedly hit reset. The line ran in short bursts until a full stop during peak production. Root cause was supply sag under load that no one measured. Blind reset turned a quick fix into major downtime.",
      takeaway: "A [[fault]] code is a diagnostic starting point, not a restart button prompt.",
      visual: {
        type: "callout",
        tone: "warning",
        text: "Read and record fault code history before every reset attempt.",
      },
    },
    {
      id: "fcd-02",
      kind: "concept",
      heading: "How to classify drive [[fault]] codes",
      body: "Most faults fall into supply quality, load/mechanical stress, thermal limits, or configuration errors. Sorting by class narrows diagnostics quickly. For example, phase loss points upstream while overcurrent often needs both electrical and mechanical checks.",
      takeaway: "Classify first, then test in the likely direction.",
      visual: { type: "diagram", variant: "powerflex-fault-table" },
    },
    {
      id: "fcd-05",
      kind: "interaction",
      heading: "Knowledge check — F004 on acceleration",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "fcd-03",
      kind: "concept",
      heading: "Queue history gives sequence, not just latest event",
      body: "The active fault is only one data point. Queue order, speed, and load context reveal whether you have a single event or pattern. Patterns reduce unnecessary component swaps.",
      takeaway: "Use event sequence to decide whether cause is intermittent or repeatable.",
    },
    {
      id: "fcd-04",
      kind: "example",
      heading: "Field example — F006 traced to input fuse holder heat damage",
      body: "A drive showed phase loss [[fault]] code after lunch shift starts. Multimeter checks found one leg dropping under load due to a loose fuse clip. Tightening and replacing the damaged holder cleared recurring faults without touching parameters.",
      takeaway: "Supply-side integrity can fail only under load; meter all legs live.",
    },
    {
      id: "fcd-06",
      kind: "example",
      heading: "Failure mode — overcurrent at one speed band",
      body: "Symptom: overcurrent [[fault]] code repeats near the same frequency. Cause: mechanical drag and intermittent product jam increased torque demand. Diagnostic: compare drive current trend with conveyor load state and inspect rollers. Fix: clear jam source and verify current stabilizes before retuning ramps.",
      takeaway: "Recurring speed-specific overcurrent usually includes a mechanical contributor.",
    },
    {
      id: "fcd-07",
      kind: "example",
      heading: "Failure mode — nuisance undervoltage after panel service",
      body: "Symptom: undervoltage [[fault]] code appears during startup but not idle. Cause: loose line lug raised resistance and bus sagged on acceleration. Diagnostic: torque-check line lugs and verify input phase voltage with multimeter under load. Fix: reterminate and retest at full process load.",
      takeaway: "Connections that look fine cold can fail when current demand rises.",
    },
    {
      id: "fcd-08",
      kind: "concept",
      heading: "Visual diagnostic path through drive stages",
      body: "Use this stage view to map each [[fault]] code to probable section: line input/rectifier, **direct current (DC)** bus stability, or inverter/motor side. It keeps troubleshooting structured and fast.",
      takeaway: "Map the code to the stage before opening parameter groups.",
      visual: { type: "diagram", variant: "vfd-stages" },
    },
    {
      id: "fcd-09",
      kind: "example",
      heading: "Field procedure — pre-reset diagnostic sequence",
      body: "1. Apply **lockout/tagout ([[LOTO]])** procedure for any exposed panel work. 2. Record active and queued [[fault]] code entries. 3. Use a **multimeter** to verify three-phase input and phase balance. 4. Check output current trend at attempted restart. 5. Reset once only after root cause action is complete.",
      takeaway: "Record, measure, correct, then reset.",
    },
    {
      id: "fcd-10",
      kind: "example",
      heading: "Field procedure — verify correction is real",
      body: "1. Run five start/stop cycles at normal load. 2. Confirm [[fault]] queue remains clear. 3. Compare output current to motor nameplate. 4. Document corrective action and final parameter values. 5. Return line with operator signoff.",
      takeaway: "A fix is complete only when repeat cycles stay stable.",
    },
    {
      id: "fcd-11",
      kind: "interaction",
      heading: "Knowledge check — why [[fault]] history matters",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[2]),
    },
    {
      id: "fcd-12",
      kind: "example",
      heading: "Application check — avoid [[fault]] code tunnel vision",
      body: "A single [[fault]] code can be symptom, not root cause. If F012 appears with a new mechanical noise trend, investigate drivetrain before reducing protections. Keep parameter edits evidence-based and reversible.",
      takeaway: "Use electrical and mechanical evidence together before tuning protection limits.",
    },
    {
      id: "fcd-13",
      kind: "summary",
      heading: "Diagnose [[fault]] codes with evidence flow",
      body: "• You will capture active and historical [[fault]] code data before reset.\n• You will classify faults by supply, bus, inverter, or load behavior.\n• You will use multimeter measurements and current trends to validate causes.\n• You will confirm corrective action over repeated production cycles.\n• You will avoid parameter guesswork when history points to field wiring or mechanical issues.",
      takeaway: "Evidence chain first, reset second.",
    },
  ],
};
