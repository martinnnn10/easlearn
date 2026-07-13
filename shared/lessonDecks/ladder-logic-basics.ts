import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("plc-fundamentals", "ladder-logic-basics")!;

export const LADDER_LOGIC_BASICS_DECK: LessonCardDeck = {
  moduleSlug: "plc-fundamentals",
  lessonSlug: "ladder-logic-basics",
  title: "Ladder Logic: Contacts, Coils, and Basic Instructions",
  whatYoullLearn: [
    "Read XIC, XIO, and OTE instructions on a ControlLogix rung.",
    "Build and troubleshoot seal-in (latching) motor run logic.",
    "Reconcile online monitor bit states with field pushbuttons and contactors.",
  ],
  estimatedMinutes: 14,
  previewCardCount: 2,
  cards: [
    {
      id: "ll-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **I/O**: input/output\n- **PB**: pushbutton\n- **XIC**: examine if closed\n- **XIO**: examine if open\n- **OTE**: output energize\n- **NC**: normally closed",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "ll-01",
      kind: "concept",
      heading: "Why [[seal-in]] logic matters on the floor",
      body: "A case packer motor would start on START but drop out the instant the operator released the button — the **seal-in (holding circuit)** branch was missing after a program restore from last month's backup. Production lost two hours while three techs argued about the **variable frequency drive (VFD)**. The fix was one parallel **examine if closed ([[XIC]]) MTR_RUN** contact around START — not a drive parameter.",
      takeaway: "Momentary start requires an **auxiliary contact (aux)** hold-in contact in ladder — every time.",
      visual: {
        type: "callout",
        tone: "field",
        text: "Symptom: motor runs only while START is held — look for missing seal-in, not the PowerFlex.",
      },
    },
    {
      id: "ll-02",
      kind: "concept",
      heading: "[[XIC]], [[XIO]], and [[OTE]] on ControlLogix",
      body: "**examine if closed ([[XIC]])** passes when the bit is TRUE — your normally open field device made. **examine if open ([[XIO]])** passes when the bit is FALSE — **normally closed ([[NC]])** **emergency stop (E-stop)** released, overload OK. **output energize ([[OTE]])** energizes the output bit when the rung is true for the entire scan.",
      takeaway: "Contact type must match how the field device is wired — [[NC]] field device usually means [[XIC]] on a TRUE bit when healthy.",
    },
    {
      id: "ll-05",
      kind: "interaction",
      heading: "Knowledge check — contact types",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "ll-03",
      kind: "concept",
      heading: "One scan, one snapshot",
      body: "The **central processing unit (CPU)** reads all inputs, then evaluates rungs top to bottom using that frozen image. A coil turned ON mid-[[rung]] does not affect contacts above it until the **next scan**. In Studio 5000 online monitor you see bit states update once per scan — typically 2–10 ms on CompactLogix.",
      takeaway: "Online monitor shows the same image table the logic used this scan.",
      visual: { type: "diagram", variant: "scan-cycle" },
    },
    {
      id: "ll-04",
      kind: "example",
      heading: "Seal-in on Packaging Line 4",
      body: "Rung path: **XIC ESTOP_OK** → **XIC START_PB** → **OTE MTR_RUN**, with **XIC MTR_RUN** in parallel around START. Allen-Bradley contactor aux **normally open (NO)** feeds input I:1/6; output **O:2/0** drives the coil. Release START — aux holds the [[rung]] true until STOP or an interlock opens.",
      takeaway: "Parallel branch contact must be the same bit as the coil output.",
      visual: { type: "diagram", variant: "ladder-seal-in" },
    },
    {
      id: "ll-06",
      kind: "example",
      heading: "STOP is [[NC]] in the field and in logic",
      body: "Guardmaster [[E-stop]] drops the [[NC]] chain — bit goes FALSE — **XIC ESTOP_OK** opens the [[rung]]. If someone converts STOP to an [[XIO]] without rewiring, the [[rung]] inverts: machine runs when [[E-stop]] is **pressed**. That is a safety regression, not a nuisance fault.",
      takeaway: "Field wiring style and ladder contact type must agree.",
      visual: { type: "diagram", variant: "nc-chain" },
    },
    {
      id: "ll-07",
      kind: "example",
      heading: "Rung true, contactor silent",
      body: "Online monitor shows **MTR_RUN** TRUE but the contactor never pulls in. Symptom → likely cause → check: logic ON → output module or wiring → **O:2/0 LED** on the 1756-OB16, 120 **volts AC (VAC)** at coil terminals, contactor coil resistance. Logic proved the [[CPU]] commanded run — the break is after the output module.",
      takeaway: "Separate “bit true” from “coil energized” before editing ladder.",
    },
    {
      id: "ll-08",
      kind: "example",
      heading: "ONS — one pulse per event",
      body: "**ONS** (one-shot) fires TRUE for **one scan** on a false-to-true transition — used to count cases or increment a **count up (CTU)** without multiple counts while a photoeye stays blocked. Hold the eye made: ONS pulses once; without ONS the counter adds a count every scan.",
      takeaway: "Use ONS before counters and one-shot setpoints — not for motor [[seal-in]].",
    },
    {
      id: "ll-09",
      kind: "example",
      heading: "Wrong contact after tag rename",
      body: "After copying a [[rung]] from Line 3, **START_PB** still pointed at the old tag — [[rung]] looked right, wrong input. Symptom: START does nothing. Fix: cross-reference tag to physical **I:1/3** terminal in the [[I/O]] tree and monitor that bit while pressing START.",
      takeaway: "Copied rungs carry wrong tags — verify address in monitor, not just [[rung]] shape.",
    },
    {
      id: "ll-10",
      kind: "interaction",
      heading: "Knowledge check — stop circuit",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "ll-11",
      kind: "example",
      heading: "Field procedure — trace a start [[rung]] online",
      body: "1. Go online in Studio 5000 on a **CompactLogix 5380** — Run mode. 2. Open the **MTR_RUN** [[rung]]; highlight each [[XIC]] — red = false, green = true. 3. Press START; watch **START_PB** flash true one scan. 4. Confirm **MTR_RUN** latches true after release. 5. Record which permissive is false if the [[rung]] never goes true.",
      takeaway: "Monitor bits in order — do not force outputs until permissives are understood.",
    },
    {
      id: "ll-12",
      kind: "example",
      heading: "Field procedure — output vs contactor",
      body: "1. With [[rung]] true, check **O:2/0** output LED on the module. 2. Meter **120 volts AC ([[VAC]])** at contactor A1–A2 — good is ~120 V; 0 V means open coil, blown fuse, or open **overload (OL)** in series with coil. 3. Compare to contactor hum and aux feedback on **I:1/6**. 4. Document findings before changing logic.",
      takeaway: "Output LED ON + 0 V at coil = field wiring or coil open — not a scan problem.",
    },
    {
      id: "ll-13",
      kind: "summary",
      heading: "Read rungs before you rewrite them",
      body: "Before changing any motor [[rung]] after a restore, compare [[seal-in]] aux to the contactor wiring diagram and monitor **START**, **STOP**, and **MTR_RUN** online. You will trace permissives first and match [[NC]]/[[NO]] to field devices — not swap coils at random.",
      takeaway: "Seal-in, contact type, and output chain — in that order, every start [[fault]].",
    },
  ],
};
