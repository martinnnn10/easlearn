import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("plc-fundamentals", "timers-counters")!;

export const TIMERS_COUNTERS_DECK: LessonCardDeck = {
  moduleSlug: "plc-fundamentals",
  lessonSlug: "timers-counters",
  title: "Timers, Counters, and Comparison Instructions",
  whatYoullLearn: [
    "Read TON PRE, ACC, and .DN in Studio 5000 timer monitor.",
    "Distinguish retentive from non-retentive timing behavior.",
    "Apply CTU and one-shots without double-counting production events.",
  ],
  estimatedMinutes: 14,
  previewCardCount: 2,
  cards: [
    {
      id: "tc-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **TON**: timer on-delay\n- **PRE**: preset value\n- **DN**: done bit\n- **ACC**: accumulated value\n- **EN**: enable bit",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "tc-01",
      kind: "concept",
      heading: "When 0.25 seconds costs a shift",
      body: "A bagger ran **short fills for four hours** after someone restored a program backup. The **FillDelay** TON (timer on-delay) preset had changed from **2500 ms to 250 ms** — solenoid opened too early every cycle. Nobody checked timer **PRE (preset value)** against the run sheet until QA flagged underweight cases.",
      takeaway: "After any program download or restore, spot-check timer [[PRE]] against the run sheet.",
      visual: {
        type: "callout",
        tone: "field",
        text: "Symptom: process too fast or too slow — open timer monitor before blaming mechanical.",
      },
    },
    {
      id: "tc-02",
      kind: "concept",
      heading: "[[TON]] — timer on delay",
      body: "**TON** accumulates time while the [[rung]] is true. When **ACC (accumulated value) ≥ PRE**, the **DN (done bit)** bit sets TRUE. On a **CompactLogix**, [[PRE]] is in milliseconds — [[PRE]] = 2500 means 2.5 seconds. [[ACC]] resets to zero when the rung goes false on a standard (non-retentive) [[TON]].",
      takeaway: "Watch [[ACC]] climb in monitor — [[DN]] means enough time elapsed while EN (enable bit) was true.",
      visual: { type: "diagram", variant: "timer-ton-block" },
    },
    {
      id: "tc-05",
      kind: "interaction",
      heading: "Knowledge check — [[TON]] done bit",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "tc-03",
      kind: "concept",
      heading: "[[TOF]] and [[RTO]] — know which you have",
      body: "**TOF (timer off-delay)** starts timing when the [[rung]] goes **false** — conveyor coast clears before interlock. **RTO (retentive timer on)** **keeps ACC** when the [[rung]] drops — used when total accumulated run time matters. Wrong type = wrong machine behavior after every stop.",
      takeaway: "[[RTO]] retains [[ACC]]; standard [[TON]] clears [[ACC]] when [[EN]] drops.",
    },
    {
      id: "tc-04",
      kind: "concept",
      heading: "[[CTU]] and comparison instructions",
      body: "**CTU (count up)** increments on rising edges — pair with **ONS** so one product pulse equals one count. **GEQ**, **LEQ**, **EQU** compare values — common for batch complete when **CaseCount.[[ACC]] ≥ CaseCount.PRE**. Comparison blocks do not replace timers; they react to numeric tags.",
      takeaway: "Counters count events; comparisons react to tag values — different troubleshooting paths.",
    },
    {
      id: "tc-06",
      kind: "example",
      heading: "Fill valve opens early — timer too short",
      body: "Symptom: underweight bags. Cause: **PRE** lowered or wrong timebase. Diagnostic: online monitor **FillDelay.ACC** and **PRE** during a cycle — [[DN]] goes true at 250 ms instead of 2500 ms. Fix: restore [[PRE]] from documented run sheet; verify with scale before releasing line.",
      takeaway: "[[PRE]] error looks like mechanical drift — timer monitor proves it in one cycle.",
    },
    {
      id: "tc-07",
      kind: "example",
      heading: "Conveyor stagger delay",
      body: "Three conveyors use **TON** stagger: **Conv2_Start.DN** enables **Conv3** motor [[rung]] 3 s after **Conv2** permissive. Symptom: product pile-up — **Conv3** starts instantly. Cause: **Conv2_Start.PRE** at 0 or [[rung]] bypassed. Check **ACC** never reaching **PRE** because upstream permissive drops every scan.",
      takeaway: "Stagger timers need stable [[EN]] — flickering permissive resets [[ACC]] every scan.",
    },
    {
      id: "tc-08",
      kind: "example",
      heading: "Counter double-count on [[photoeye]]",
      body: "Symptom: batch completes at half the expected count. Cause: **CTU** wired to raw photoeye without **ONS** — eye blocked 15 scans = 15 counts. Fix: **ONS** on the clear edge or use rising-edge instruction. Confirm **ACC** increments once per case in monitor.",
      takeaway: "One physical event must equal one count edge — not one scan of a made sensor.",
    },
    {
      id: "tc-09",
      kind: "example",
      heading: "Retentive timer after brief stop",
      body: "Symptom: heat-soak timer restarts from zero after a 2-second stop — product scrapped. Cause: standard **TON** instead of **RTO**. Diagnostic: watch **ACC** drop to 0 when [[EN]] flickers false. Fix: change to **RTO** or latch [[EN]] during required soak window.",
      takeaway: "If [[ACC]] must survive a brief stop, you need retentive timing — not a lower [[PRE]].",
    },
    {
      id: "tc-10",
      kind: "interaction",
      heading: "Knowledge check — conveyor start delay",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "tc-11",
      kind: "example",
      heading: "Field procedure — timer monitor in Studio 5000",
      body: "1. Go online; locate the [[TON]] instruction (e.g. **FillDelay**). 2. Right-click → **Monitor** — watch **EN**, **ACC**, **PRE**, **DN**. 3. Run one production cycle; confirm **ACC** reaches **PRE** at the expected process point. 4. Compare **PRE** to the run sheet value in ms. 5. Screenshot **ACC/[[PRE]]/DN** for maintenance log if adjusting.",
      takeaway: "Document [[PRE]] before and after any edit — restores happen without warning.",
    },
    {
      id: "tc-12",
      kind: "example",
      heading: "Field procedure — counter verification",
      body: "1. Monitor **CTU** block — **ACC**, **PRE**, **DN**. 2. Trigger one product event; **ACC** should increment by 1. 3. If [[ACC]] jumps by more than 1, add **ONS** or fix sensor bounce. 4. At **ACC = PRE**, confirm **DN** sets and the downstream [[rung]] reacts once — not every scan while [[DN]] stays true.",
      takeaway: "Use manual pulse test at slow speed before trusting batch-complete interlocks.",
    },
    {
      id: "tc-13",
      kind: "summary",
      heading: "Check [[PRE]] before blaming the machine",
      body: "After any backup restore or download, compare timer **PRE** and counter **PRE** to production records. You will open timer monitor first on timing faults, use **ONS** before **CTU**, and pick **RTO** when accumulated time must survive brief stops.",
      takeaway: "Timer faults are usually [[PRE]], [[EN]] stability, or wrong instruction type — not mystery logic.",
    },
  ],
};
