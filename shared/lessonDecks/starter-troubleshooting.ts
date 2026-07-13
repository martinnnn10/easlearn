import type { LessonCardDeck } from "../learningCardTypes";
import { choiceMcq } from "./deckHelpers";

/**
 * Motor Starter Troubleshooting — the practical follow-on to Motor Control
 * Circuits, built to the Risk Assessment bar. Voice: a 30-year tech teaching an
 * operator a repeatable way to diagnose a starter instead of swapping parts.
 */
export const STARTER_TROUBLESHOOTING_DECK: LessonCardDeck = {
  moduleSlug: "motors-controls",
  lessonSlug: "starter-troubleshooting",
  reflection: true, // apprenticeship closeout — scenario in shared/lessonCloseouts.ts
  title: "Motor Starter Troubleshooting: A Method, Not a Guess",
  whatYoullLearn: [
    "Split every starter problem into control-side vs. power-side in 30 seconds.",
    "Use a simple decision path instead of swapping parts and hoping.",
    "Read the classic symptoms: won't start, won't stay, hums, trips.",
    "Know when the fault is the motor, not the starter.",
  ],
  estimatedMinutes: 15,
  previewCardCount: 3,
  cards: [
    {
      id: "st-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **E-stop**: emergency stop\n- **LOTO**: lockout/tagout\n- **seal-in**: holding circuit\n- **aux contact**: auxiliary contact",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "st-01",
      kind: "concept",
      heading: "$600 of parts, and the fuse was blown",
      body: "A line was down for a 'dead starter.' The tech swapped the contactor, then the overload block, then the start button — parts he had on the truck. Two hours, $600 in parts, still dead.\n\nThe actual fault: a blown control-circuit fuse. Thirty seconds with a meter would have found it. He was throwing parts at a symptom instead of following a method. This lesson gives you the method so you never spend two hours losing to a fifty-cent fuse.",
      takeaway: "Swapping parts is guessing with money. A method finds the [[fault]] fast — usually before you open a box of spares.",
      visual: { type: "callout", tone: "field", text: "'Parts-changer' vs. 'troubleshooter' is the difference between two hours and two minutes. Meter first, swap last." },
    },
    {
      id: "st-02",
      kind: "concept",
      heading: "First cut: is it control or power?",
      body: "Every starter problem splits into two halves (from the Motor Control lesson): the **control** side (120V — buttons, coil, safety string) and the **power** side (480V — contacts, motor).\n\nThe fastest question in all of motor-control troubleshooting: **does the contactor pull in?**\n\n• **Coil pulls in** (you hear/see it close) but motor won't run → the [[fault]] is **power-side** (contacts, fuses, motor).\n• **Coil won't pull in** → the [[fault]] is **control-side** (control power, buttons, coil, safety string).\n\nThat one observation cuts the problem in half before you touch a meter.",
      takeaway: "Does the contactor pull in? Yes → power-side [[fault]]. No → control-side [[fault]]. Split it in half first.",
    },
    {
      id: "st-03",
      kind: "interaction",
      heading: "Quick check — split the problem",
      body: "",
      interaction: choiceMcq(
        "You press Start, the contactor clunks in solidly, but the motor doesn't turn. Where's the fault?",
        [
          "Control side — check the start button",
          "Power side — the coil did its job; suspect contacts, fuses, or the motor",
          "The safety string is open",
          "The control transformer is bad",
        ],
        1,
        "Right. If the contactor pulled in, the whole control side worked. Now the fault is downstream on the power side — burned main contacts, a blown power fuse, a lost phase, or the motor itself.",
        "The contactor pulling in proves the control side is good. A motor that still won't run points to the power side: contacts, fuses, phases, or motor."
      ),
    },
    {
      id: "st-04",
      kind: "concept",
      heading: "The control-side path (coil won't pull in)",
      body: "If the contactor won't pull in, work the control circuit in order:\n\n1. **Control power present?** Meter across the control circuit (often 120V). No voltage → blown control fuse or transformer problem.\n2. **Safety string closed?** Walk the series chain — emergency stop ([[E-stop]]), [[overload]] contact, guard switches. Any one open stops it.\n3. **Start/stop buttons good?** Start makes on press; Stop passes until pressed.\n4. **Coil good?** With the path complete, meter the coil (A1-A2). Rated voltage but no pull-in → bad coil. Low voltage → control-power problem. Zero → open in the string.",
      takeaway: "Control power → safety string → buttons → coil. Meter in that order and the open device reveals itself.",
      visual: { type: "diagram", variant: "motor-starter-chain" },
    },
    {
      id: "st-05",
      kind: "concept",
      heading: "The power-side path (coil pulls in, motor won't run)",
      body: "If the contactor pulls in but the motor won't turn, work the power circuit:\n\n1. **Voltage into the contactor?** All three legs present upstream (fuses/breaker good)?\n2. **Voltage out of the contactor?** Meter the load side with it pulled in. Missing a leg out but present in → **burned/pitted main contacts**.\n3. **Voltage at the motor?** All three legs reach the motor terminals?\n4. **Motor itself?** Good voltage at the motor but it won't turn (or hums) → suspect the motor: locked rotor, open winding, bad bearing, or a mechanical bind.",
      takeaway: "In to contactor → out of contactor → at the motor → the motor. Where the voltage stops is your [[fault]].",
    },
    {
      id: "st-06",
      kind: "interaction",
      heading: "Check — reading the contacts",
      body: "",
      interaction: choiceMcq(
        "Contactor is pulled in. You read 480V on all three legs going INTO it, but only two legs coming OUT. What's wrong?",
        [
          "The motor is bad",
          "A main contact is burned/pitted open — one pole isn't passing power",
          "The coil is weak",
          "The control fuse is blown",
        ],
        1,
        "Exactly. Full voltage in, a leg missing out, with the contactor closed = a burned or pitted main contact on that pole. The motor's now single-phasing. Replace the contactor (or contacts) and find why it burned — often chatter or an overload.",
        "Voltage in but a leg missing out (contactor closed) means a main contact isn't passing — it's burned/pitted. That pole is the fault, not the motor."
      ),
    },
    {
      id: "st-07",
      kind: "example",
      heading: "The four classic symptoms — and what they mean",
      body: "Match the symptom to the likely half:\n\n• **Won't start at all, coil silent** → control-side (control power, string, button, coil).\n• **Runs only while you hold Start** → holding circuit ([[seal-in]]) auxiliary contact ([[aux contact]]) (control-side).\n• **Contactor hums/chatters, won't pull in** → low coil voltage (control-power).\n• **Coil pulls in, motor hums/trips/won't turn** → power-side (contacts, lost phase, motor).\n\nName the symptom first; it points you at the right half before you meter.",
      takeaway: "Silent coil = control. Runs-while-held = [[seal-in]]. Chatter = low coil voltage. Pulls-in-but-dead = power/motor.",
    },
    {
      id: "st-08",
      kind: "example",
      heading: "Scenario — the intermittent no-start",
      body: "A starter usually works but sometimes won't start; a good whack on the panel and it goes. Intermittent, mechanical-feeling faults are almost always a **loose connection** or a marginal contact — a lug backed off, a spade terminal barely making, a tired button.\n\n**Play:** After lockout/tagout ([[LOTO]]), check and re-torque connections in the control string. Look for discoloration or heat at terminals (a loose connection heats up). Don't 'fix' it by whacking the panel — find the loose joint. Intermittents are loose connections until proven otherwise.",
      takeaway: "Intermittent no-starts = loose connections. Find and re-torque the joint; don't rely on percussive maintenance.",
    },
    {
      id: "st-09",
      kind: "example",
      heading: "Scenario — when it's the motor, not the starter",
      body: "You've proven all three legs of 480V reach the motor terminals, the contactor's solid, controls are good — and it still won't turn, or it hums and trips. Now it's the **motor**: a locked rotor, an open or shorted winding, a seized bearing, or the driven load is jammed.\n\n**Play:** Stop swapping starter parts. [[LOTO]], turn the shaft by hand (bind? seized?), and check the motor windings (resistance/megger per your training). Confirm the driven equipment isn't jammed. The starter was innocent all along.",
      takeaway: "Good power at the motor + good starter, still dead = it's the motor or the load, not the starter.",
    },
    {
      id: "st-10",
      kind: "example",
      heading: "Mistakes that cost operators and new techs time",
      body: "**Operators moving into maintenance:** swapping the contactor first because it's the obvious big part.\n\n**New techs:** skipping the 'does it pull in?' split (so they meter the wrong half), throwing parts at symptoms, forgetting to check simple things first (control fuse!), and blaming the starter when the motor or a blown power fuse is the real [[fault]].\n\nThe method beats parts every time: split control vs. power, then meter in order. Cheap, fast, and you look like you know what you're doing — because you do.",
      takeaway: "Method over parts. Split the problem, meter in order, check the cheap stuff first.",
    },
    {
      id: "st-11",
      kind: "interaction",
      heading: "Lesson quiz — the method",
      body: "",
      interaction: choiceMcq(
        "A motor won't start. What's the single best FIRST observation to cut the problem in half?",
        [
          "Replace the contactor and see if it helps",
          "Watch/listen: does the contactor pull in when you press Start?",
          "Check the motor bearings",
          "Turn up the overload setting",
        ],
        1,
        "Right. 'Does the contactor pull in?' instantly splits the fault into control-side (won't pull in) or power-side (pulls in, motor dead). That one observation aims everything you do next. Method beats guessing.",
        "Before touching parts, make the split: does the contactor pull in? Yes = power-side fault, No = control-side. That one look saves you an hour."
      ),
    },
    {
      id: "st-12",
      kind: "summary",
      heading: "A starter is easy when you have a method",
      body: "• Always split first: **does the contactor pull in?** No = control-side, Yes = power-side.\n• **Control path:** control power → safety string → buttons → coil (meter in order).\n• **Power path:** into contactor → out of contactor → at motor → the motor.\n• Match the **symptom** to the half (silent coil / runs-while-held / chatter / pulls-in-but-dead).\n• Check the **cheap stuff first** (a control fuse), and know when it's the **motor**, not the starter.",
      takeaway: "Split control vs. power, meter in order, check the simple things — and you'll fix starters faster than anyone reaching for parts.",
    },
  ],
};
