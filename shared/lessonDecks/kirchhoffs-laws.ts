import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("electrical-fundamentals", "kirchhoffs-laws")!;

export const KIRCHHOFFS_LAWS_DECK: LessonCardDeck = {
  moduleSlug: "electrical-fundamentals",
  lessonSlug: "kirchhoffs-laws",
  title: "Kirchhoff's Laws",
  whatYoullLearn: [
    "Use KVL — source voltage equals the sum of drops — to walk a series loop.",
    "Spot the open as the one series device wearing the full source voltage.",
    "Use KCL — currents in equal currents out — to catch a hidden ground path.",
  ],
  estimatedMinutes: 12,
  previewCardCount: 2,
  cards: [
    {
      id: "kir-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **KVL**: Kirchhoff's Voltage Law — voltage drops around a loop add up to the source\n- **KCL**: Kirchhoff's Current Law — current into a junction equals current out\n- **OL**: overload relay contacts in the control string — not the meter's over-limit display\n- **MCC**: motor control center — the lineup that feeds many motor branches\n- **NC**: normally closed — a contact that passes current until it acts\n- **LOTO**: lockout/tagout — the zero-energy safety procedure",
      takeaway: "Two conservation rules: voltage balances around a loop, current balances at a node.",
    },
    {
      id: "kir-01",
      kind: "concept",
      heading: "You already troubleshoot with these",
      body: "You may not name them, but every voltage-drop check uses [[KVL]] and every clamp-around-the-bus check uses [[KCL]]. They are conservation laws: energy and charge have to balance. Making them explicit turns \"poke around until something looks wrong\" into a method that tells you exactly where to meter next.",
      takeaway: "Kirchhoff's laws are the method behind voltage-drop and current-balance troubleshooting.",
    },
    {
      id: "kir-02",
      kind: "concept",
      heading: "Voltage around the loop, current at the node",
      body: "**[[KVL]]**: walk any closed loop and the source voltage equals the sum of every drop — in a 120 V control circuit, all the drops must add back to 120 V. **[[KCL]]**: at any junction, the current flowing in equals the current flowing out — the branch currents off a bus must sum to the feed. One governs a series loop; the other governs a junction.",
      takeaway: "KVL: drops sum to the source. KCL: currents in equal currents out.",
      visual: { type: "diagram", variant: "kvl-kcl-diagram" },
    },
    {
      id: "kir-03",
      kind: "interaction",
      heading: "Knowledge check — what KVL says",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "kir-04",
      kind: "example",
      heading: "KVL points straight at the open",
      body: "A coil will not pull in. You read **120 V** across a set of **OL** [[NC]] contacts and **0 V** across the coil in the same series string. [[KVL]] reads that instantly: the source has to appear somewhere, and it is sitting across the open **OL** — a good closed contact would drop near 0 V. The coil reads 0 V because no current reaches it. The open device wears the whole supply.",
      takeaway: "The device wearing full source voltage is the open; a de-energized coil reads 0 V downstream of it.",
    },
    {
      id: "kir-05",
      kind: "concept",
      heading: "Good drops near zero, open drops it all",
      body: "This is the heart of voltage-drop work. A closed, healthy series device — contact, fuse, or wire — drops almost nothing because its [[resistance]] is tiny. The one open device drops the full source, because by [[KVL]] the voltages must still add to the source and the open has all the resistance. A good closed fuse reads near 0 V across it; a blown one reads the full line.",
      takeaway: "Near 0 V across a series device means good; full source voltage means open.",
    },
    {
      id: "kir-06",
      kind: "interaction",
      heading: "Knowledge check — 120 V across the contacts",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[1]),
    },
    {
      id: "kir-07",
      kind: "example",
      heading: "KCL balances the bus",
      body: "Clamp an **MCC (motor control center)** feed at 45 A, then clamp the branches: 15.2 A, 19.8 A, and 10.1 A. They add to about 45 A, so [[KCL]] balances — the feed is fully accounted for and there is no unexplained path. This is the everyday sanity check: the currents leaving a junction should add up to the current arriving.",
      takeaway: "When branch currents sum to the feed, KCL confirms nothing is leaking away.",
    },
    {
      id: "kir-08",
      kind: "example",
      heading: "A KCL gap is a hidden path",
      body: "Now the feed reads 45 A but the branches total only 35 A. Charge does not vanish — [[KCL]] says 10 A is flowing on a path you have not measured: a ground fault, or a branch you missed. Do not wave it off as meter error. A persistent imbalance at a node is current escaping somewhere, and it is worth finding before it becomes a shock or a fire.",
      takeaway: "Missing amperes at a junction are current on an unmeasured path — investigate, don't dismiss.",
      visual: { type: "callout", tone: "warning", text: "A persistent KCL imbalance at a node is current on an unmeasured path — treat it as a ground fault until proven otherwise." },
    },
    {
      id: "kir-09",
      kind: "interaction",
      heading: "Knowledge check — where to start",
      body: "",
      // lessonQuizzes[3] is the "confirm the source first" item — deliberately paired with the kir-10 KVL walk.
      interaction: curatedChoiceMcq(curated.lessonQuizzes[3]),
    },
    {
      id: "kir-10",
      kind: "example",
      heading: "Field procedure — walk a loop with KVL",
      body: "Voltage-drop work is just [[KVL]] applied step by step. 1. Meter the source and write the number down — every drop has to add back to it. 2. Calling to run, move your leads across each device toward the coil, keeping a running tally of drops. 3. A near-0 V drop means the source is not hiding there — keep going. 4. When one device shows the whole source, the tally is complete: that device is the open. 5. De-energize, apply [[LOTO]], and repair it. The law did the searching — you just read the drops.",
      takeaway: "KVL turns \"poke around\" into a running tally — the device that balances the loop back to the source is the open.",
    },
    {
      id: "kir-11",
      kind: "summary",
      heading: "Two laws, one troubleshooting method",
      body: "• You will confirm the source, then use [[KVL]] to walk a series loop drop by drop.\n• You will read full source voltage across a device as the open, and near 0 V as healthy.\n• You will use [[KCL]] to check that branch currents sum to the feed at a bus.\n• You will treat a current imbalance at a node as a real, hidden path — not meter error.",
      takeaway: "KVL walks the loop to the open; KCL balances the node to expose what is leaking.",
    },
  ],
};
