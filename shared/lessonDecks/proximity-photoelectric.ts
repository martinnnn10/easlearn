import type { LessonCardDeck } from "../learningCardTypes";
import { choiceMcq } from "./deckHelpers";

/**
 * Proximity & Photoelectric Sensors — the sensors that stop the line most,
 * built to the Risk Assessment bar. Voice: a 30-year tech teaching an operator to
 * diagnose the little devices that fail more than anything else on a machine.
 * Keeps the npn-pnp-wiring diagram (pinned + genuinely essential here).
 */
export const PROXIMITY_PHOTOELECTRIC_DECK: LessonCardDeck = {
  moduleSlug: "sensors-instrumentation",
  lessonSlug: "proximity-photoelectric",
  reflection: true, // apprenticeship closeout — scenario in shared/lessonCloseouts.ts
  title: "Prox & Photo Sensors: The Eyes That Stop the Line",
  whatYoullLearn: [
    "Tell a proximity sensor from a photoeye and know what each detects.",
    "Read the sensor's own indicator light before you touch anything else.",
    "Understand NPN vs. PNP (sinking/sourcing) so you wire and swap them right.",
    "Diagnose the classic faults: misalignment, dirt, dead sensor, broken wire.",
  ],
  estimatedMinutes: 15,
  previewCardCount: 3,
  cards: [
    {
      id: "px-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **PLC**: programmable logic controller\n- **NPN**: sinking output\n- **PNP**: sourcing output\n- **I/O**: input/output",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "px-01",
      kind: "concept",
      heading: "The line that died over a dirty lens",
      body: "A packaging line kept faulting 'part not present.' Two techs chased the **programmable logic controller ([[PLC]])** program for an hour. The culprit: a **photoeye** with a filmy lens — dust and mist had built up until the beam couldn't make it back reliably. A wipe with a clean rag and it ran.\n\nSensors fail more than any other part on a machine — they're small, exposed, and take abuse. Learn to check the sensor first and you'll fix half your 'the machine won't run' calls in two minutes.",
      takeaway: "Sensors are the most common failure on a machine. Check the sensor before you blame the [[PLC]].",
      visual: { type: "callout", tone: "field", text: "A dirty lens, a bumped bracket, or a chewed cable causes more line stops than any electrical fault. Look at the sensor first." },
    },
    {
      id: "px-02",
      kind: "concept",
      heading: "Two families: proximity and photoelectric",
      body: "You'll meet two main types on the floor:\n\n• **Proximity sensors** detect something **close** without touching it. *Inductive* prox sensors sense **metal only** (a few millimeters away) — great for detecting a metal target, a cam, a shaft. *Capacitive* prox can sense non-metals too.\n\n• **Photoelectric sensors (photoeyes)** use a **light beam**. The target breaks or reflects the beam. Types: *through-beam* (separate emitter and receiver), *retroreflective* (bounces off a reflector), and *diffuse* (bounces off the target itself).\n\nKnow which type you've got — it tells you what should trigger it and how to test it.",
      takeaway: "Inductive prox = metal, up close. Photoeyes = a light beam broken or reflected. Different tests for each.",
    },
    {
      id: "px-03",
      kind: "interaction",
      heading: "Quick check — what actually failed?",
      body: "",
      interaction: choiceMcq(
        "In the opening story, why was the line faulting 'part not present'?",
        [
          "The PLC program had a bug",
          "A photoeye's lens was dirty, so the beam couldn't return reliably",
          "The motor was bad",
          "The part sensor was the wrong type",
        ],
        1,
        "Right. A filmy lens weakened the photoeye's beam until it stopped reading reliably. Cleaning it fixed the 'fault.' The PLC was innocent — the sensor was the problem, as it usually is.",
        "It wasn't the program or the motor — a dirty photoeye lens was blocking the beam. Sensors and their lenses are the usual suspects. Check the sensor first."
      ),
    },
    {
      id: "px-04",
      kind: "concept",
      heading: "The sensor's own light is your first tool",
      body: "Almost every prox sensor and [[photoeye]] has a small **indicator LED** on the body (often two: power and output). That light is your fastest diagnostic — you don't even need a meter yet.\n\n• Present the target (put metal in front of a prox, break a [[photoeye]]'s beam). Watch the **output LED** on the sensor.\n• **LED changes correctly** with the target → the sensor is sensing fine; your problem is downstream (wiring or the input card).\n• **LED doesn't change** → the sensor isn't detecting: misaligned, too far, dirty, wrong target, or dead.\n\nThat one LED splits 'sensor problem' from 'wiring/[[PLC]] problem' in seconds.",
      takeaway: "Watch the sensor's output LED while you present the target. Reacts right = sensor's good; no reaction = it's the sensor.",
      visual: { type: "diagram", variant: "photoeye-loop" },
    },
    {
      id: "px-05",
      kind: "concept",
      heading: "[[NPN]] vs. [[PNP]] — [[sinking]] and [[sourcing]]",
      body: "Three-wire DC sensors come in two flavors, and mixing them up means the sensor won't work or won't wire in:\n\n• **PNP ([[sourcing]] output)** — the output wire **supplies +** (sources current) to the load when active. Most common in North American [[PLC input]]s.\n• **NPN ([[sinking]] output)** — the output wire **provides a path to −** (sinks current) when active.\n\nThe brown wire is +V, blue is common (−), and black is the output. Whether black switches to + ([[PNP]]) or to − ([[NPN]]) has to match what your [[PLC]] input expects. Swap a [[PNP]] sensor for an [[NPN]] one and it simply won't register.",
      takeaway: "[[PNP]] sources + on the output; [[NPN]] sinks to −. The replacement must match the [[PLC input]] type (usually [[PNP]] here).",
      visual: { type: "diagram", variant: "npn-pnp-wiring" },
    },
    {
      id: "px-06",
      kind: "interaction",
      heading: "Check — the swap that won't work",
      body: "",
      interaction: choiceMcq(
        "A PNP prox sensor fails. You grab an NPN sensor from the crib and wire it in the same way. What happens?",
        [
          "It works fine — NPN and PNP are interchangeable",
          "It won't register correctly — NPN sinks to (−) while the PLC input expects a sourcing (PNP) signal",
          "It damages the PLC instantly",
          "It works but reads backwards",
        ],
        1,
        "Correct. NPN and PNP switch opposite directions. A PLC input set up for PNP (sourcing) won't see an NPN (sinking) output correctly. Match the sensor type to the input — check the old sensor's label before you swap.",
        "NPN and PNP aren't interchangeable — they switch opposite ways. An NPN sensor won't be read right by a PNP input. Always match the replacement to the original type."
      ),
    },
    {
      id: "px-07",
      kind: "example",
      heading: "The classic faults — in order of likelihood",
      body: "When a sensor 'isn't working,' it's almost always one of these, roughly most-common first:\n\n1. **Misaligned / bumped** — a bracket got knocked; the beam or target is off.\n2. **Dirty** — dust, mist, or product film on a [[photoeye]] lens.\n3. **Too far / wrong range** — target beyond the sensing distance.\n4. **Wiring** — a loose terminal, a chewed cable, a broken wire.\n5. **Dead sensor** — actually failed (least common, but it happens).\n\nWork them in that order and you'll rarely reach 'replace the sensor.'",
      takeaway: "Misalignment and dirt cause most sensor 'failures.' Check those first; a truly dead sensor is last on the list.",
    },
    {
      id: "px-08",
      kind: "example",
      heading: "Scenario — the intermittent [[photoeye]]",
      body: "A [[photoeye]] works most of the time but occasionally misses, causing random faults. Intermittent optical problems are usually **marginal signal**: a lens getting dirty, a reflector slightly off, vibration shifting alignment, or the target barely within range.\n\n**Play:** Watch the output LED over several cycles — does it flicker or come on weakly? Clean the lens and reflector, confirm solid alignment, and check the sensing distance has margin (the target should trip it well within range, not right at the edge). Marginal is worse than dead because it's harder to catch.",
      takeaway: "Intermittent = marginal signal. Clean, realign, and make sure the target trips well within range, not at the edge.",
      visual: { type: "callout", tone: "tip", text: "A sensor working 'right at the edge' of its range will fail intermittently. Build in margin — mount closer or use a stronger reflector." },
    },
    {
      id: "px-09",
      kind: "example",
      heading: "Scenario — LED reacts, machine doesn't",
      body: "You present the target and the **sensor's output LED changes correctly** — but the machine still says the part isn't there. The sensor is sensing fine, so the fault is **downstream**: the wiring to the input card, the terminal, or the [[PLC input]] itself.\n\n**Play:** Now go to the [[PLC]] **input/output ([[I/O]])** troubleshooting method — watch that **input LED on the module** while the sensor's LED is on. Sensor LED on but input LED off = broken/loose wire between them. Both on but program doesn't react = addressing/logic. The sensor did its job; follow the signal to where it stops.",
      takeaway: "Sensor LED reacts but machine doesn't = the [[fault]] is downstream. Follow the signal to the input card next.",
    },
    {
      id: "px-10",
      kind: "example",
      heading: "Mistakes that trip up operators and new techs",
      body: "**Operators moving into maintenance:** blaming the [[PLC]] or the program when a [[photoeye]] is just dirty or bumped, and not knowing the sensor has its own LED.\n\n**New techs:** swapping an [[NPN]] for a PNP (or vice versa) and wondering why it won't read, mounting a sensor right at the edge of its range (intermittent forever), and replacing a sensor before checking alignment, dirt, and wiring.\n\nCheck the sensor's LED, respect [[NPN]]/[[PNP]], and rule out the cheap causes before you condemn the sensor.",
      takeaway: "LED first, match [[NPN]]/[[PNP]], rule out dirt/alignment/wiring — then, and only then, replace the sensor.",
    },
    {
      id: "px-11",
      kind: "interaction",
      heading: "Lesson quiz — first move",
      body: "",
      interaction: choiceMcq(
        "A machine faults because it isn't detecting a part at a photoeye. What's the best FIRST move?",
        [
          "Open the PLC program and look for a bug",
          "Present the target and watch the sensor's own output LED",
          "Replace the sensor",
          "Replace the input card",
        ],
        1,
        "Right. Present the target and watch the sensor's output LED. Reacts correctly → the sensor's fine, look downstream (wiring/PLC). Doesn't react → clean it, realign it, check its range. Either way, that one look aims everything you do next — for free.",
        "Start at the sensor: present the target and watch its output LED. That instantly tells you whether the sensor or the downstream wiring/PLC is the problem. Don't open code or swap parts first."
      ),
    },
    {
      id: "px-12",
      kind: "summary",
      heading: "Check the eyes before you blame the brain",
      body: "• Sensors fail more than anything else on a machine — **check the sensor first.**\n• **Inductive prox** senses metal up close; **photoeyes** use a light beam (through-beam, retro, or diffuse).\n• The sensor's own **output LED** is your first tool — present the target and watch it react.\n• **NPN vs. PNP** matters — a replacement must match the [[PLC input]] type (usually [[PNP]] here).\n• Rule out **misalignment, dirt, range, and wiring** before condemning the sensor. LED reacts but machine doesn't = look downstream.",
      takeaway: "Watch the sensor's LED, match [[NPN]]/[[PNP]], and check the cheap causes. Most '[[PLC]] problems' are really a bumped or dirty sensor.",
    },
  ],
};
