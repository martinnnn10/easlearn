import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("electrical-fundamentals", "series-parallel-circuits")!;

export const SERIES_PARALLEL_CIRCUITS_DECK: LessonCardDeck = {
  moduleSlug: "electrical-fundamentals",
  lessonSlug: "series-parallel-circuits",
  title: "Series & Parallel Circuits",
  whatYoullLearn: [
    "Tell series from parallel by asking whether one open stops everything downstream.",
    "Read full source voltage across a series device as the open you are hunting.",
    "Know why safety interlocks are wired in series and MCC branches in parallel.",
  ],
  estimatedMinutes: 11,
  previewCardCount: 2,
  cards: [
    {
      id: "ser-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **E-stop**: emergency-stop button that breaks the control circuit\n- **OL**: overload relay contacts that open when a motor runs too hot — not the meter's over-limit display\n- **MCC**: motor control center — a lineup of motor starter \"buckets\"\n- **NC**: normally closed — a contact that passes current until acted on\n- **NO**: normally open — a contact that blocks current until acted on\n- **LOTO**: lockout/tagout — the zero-energy safety procedure",
      takeaway: "Series shares one current path; parallel splits into independent branches.",
    },
    {
      id: "ser-01",
      kind: "concept",
      heading: "One dead machine, or the whole line?",
      body: "Two calls sound the same until you look at the topology. A control circuit where the coil dropped out is a **series** problem — one device in the string opened. An **MCC (motor control center)** where one starter tripped while its neighbors keep running is a **parallel** problem — that branch is independent. Naming the topology first tells you which measurement to reach for.",
      takeaway: "Whether one fault stops everything or just one load tells you series versus parallel.",
    },
    {
      id: "ser-02",
      kind: "concept",
      heading: "One path versus many paths",
      body: "In a **series** circuit the same current flows through every device, so any single open kills the whole path and total [[resistance]] adds up: **R = R1 + R2 + R3**. In a **parallel** circuit each branch is its own path — one branch opening leaves the others energized. Control safety strings are series by design; power distribution to many loads is parallel by design.",
      takeaway: "Series: one open stops all. Parallel: one open stops one.",
      visual: { type: "diagram", variant: "series-parallel-circuit" },
    },
    {
      id: "ser-03",
      kind: "interaction",
      heading: "Knowledge check — why the safety string is series",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "ser-04",
      kind: "example",
      heading: "The open hides where the voltage piles up",
      body: "Walk a de-energized [[series]] string with an ohmmeter and the resistances add. Energize it and Kirchhoff's Voltage Law ([[KVL]]) flips the view: the loop drops must total the source, so every good closed device shows near 0 V — its [[resistance]] is tiny — while the one open device is left holding the **entire source voltage**. That is the signature: 120 V across a set of contacts that should read near zero is your open, whether it is an **E-stop**, an **OL** contact, or a blown fuse.",
      takeaway: "Full source voltage across one series device is the open — every other drop is near zero.",
      visual: { type: "callout", tone: "warning", text: "120 V across contacts that should read near zero is your open — do not raise supply voltage chasing it; find and fix the break." },
    },
    {
      id: "ser-05",
      kind: "concept",
      heading: "The one question that sorts topology",
      body: "Standing at a circuit you do not know, ask: \"If this device opens, does everything downstream stop?\" **Yes** means you are in a series chain — reach for the voltage-drop method and walk each device. **No** — the neighbors keep running — means parallel branches, so measure the branch current or the branch breaker. One question picks your whole strategy.",
      takeaway: "\"Does everything downstream stop?\" — yes is series, no is parallel.",
    },
    {
      id: "ser-06",
      kind: "interaction",
      heading: "Knowledge check — one branch trips",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[1]),
    },
    {
      id: "ser-07",
      kind: "example",
      heading: "Field procedure — walk a series control string",
      body: "1. Confirm source voltage at the top of the string. 2. With the circuit calling to run, meter across each series device toward the coil. 3. Near 0 V across a device means it is closed and good — keep walking. 4. Full source voltage across a device means that is your open — stop there. 5. De-energize, apply [[LOTO]], and repair the one device the voltage pointed you to.",
      takeaway: "Source at the top, walk each drop, and the open announces itself with full voltage.",
    },
    {
      id: "ser-08",
      kind: "example",
      heading: "Parallel branches fail independently",
      body: "An **MCC** vertical bus feeds each bucket as a [[parallel]] branch. That is why one branch breaker can trip on a jam while every other motor on the bus runs untouched. Do not go looking for a common cause across the lineup when one branch is down — the topology says the fault is in that branch, not the shared bus. A shared-bus problem drops several branches at once.",
      takeaway: "One parallel branch down points into that branch; several down points at the shared feed.",
    },
    {
      id: "ser-09",
      kind: "interaction",
      heading: "Knowledge check — the open in a series string",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "ser-10",
      kind: "example",
      heading: "When the two topologies combine",
      body: "A dual-speed starter mixes both: the low- and high-speed paths are [[parallel]] selectable branches, but an interlock — a normally-closed (**NC**) contact wired in **series** — drops the other path the moment one speed is selected, so both can never energize at once. Read a real print in layers: find the parallel choices, then the series interlocks that constrain them. Most machine control is exactly this blend.",
      takeaway: "Real prints layer parallel selection under series interlocks — read them in that order.",
    },
    {
      id: "ser-11",
      kind: "summary",
      heading: "Topology tells you the tool",
      body: "• You will ask \"does everything downstream stop?\" to name series versus parallel.\n• You will use the voltage-drop method on series strings and find the open under full source voltage.\n• You will treat each [[MCC]] branch as independent and look inside the branch that is down.\n• You will read combined circuits as parallel choices constrained by series interlocks.",
      takeaway: "Name the topology first — it decides whether you measure voltage drop or branch current.",
    },
  ],
};
