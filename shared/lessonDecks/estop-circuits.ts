import type { LessonCardDeck } from "../learningCardTypes";
import { choiceMcq } from "./deckHelpers";

/**
 * E-Stop Circuits & Safety Chains — Level 1 safety, built to the Risk Assessment
 * bar. Voice: a 30-year tech explaining why the stop chain is wired the "backwards"
 * way it is, and why you never defeat it.
 */
export const ESTOP_CIRCUITS_DECK: LessonCardDeck = {
  moduleSlug: "safety-systems",
  lessonSlug: "estop-circuits",
  reflection: true, // apprenticeship closeout — scenario in shared/lessonCloseouts.ts
  title: "E-Stop & Safety Chains: Why They're Wired to Fail Safe",
  whatYoullLearn: [
    "Understand why E-stops and guards are wired normally-closed (fail-safe).",
    "Trace a series safety chain and find the one open device.",
    "Know why a broken wire must stop the machine — and never bypass that.",
    "Reset an E-stop the right way, without creating an unexpected restart.",
  ],
  estimatedMinutes: 14,
  previewCardCount: 3,
  cards: [
    {
      id: "es-01",
      kind: "concept",
      heading: "The E-stop (emergency stop) that did nothing",
      body: "An operator slapped the **E-stop (emergency stop)** when a robot arm swung wrong. The machine kept moving. It turned out a previous 'fix' had **jumped out** a flaky [[E-stop]] contact to stop nuisance trips — so the button was wired to do nothing. Somebody decided a false trip was more annoying than a real stop. They were wrong, and it nearly cost someone.\n\nAn E-stop is only as good as the chain behind it. This lesson is about why that chain is built the way it is, and why you never, ever defeat it.",
      takeaway: "An [[E-stop]] you can't trust is worse than no [[E-stop]] — people rely on it. Never bypass a safety contact.",
      visual: { type: "callout", tone: "warning", text: "Jumping out an E-stop or guard contact to stop 'nuisance trips' turns a life-saving device into a decoration. It's one of the most dangerous shortcuts on the floor." },
    },
    {
      id: "es-02",
      kind: "concept",
      heading: "Why safety devices are wired 'backwards' (normally-closed)",
      body: "Here's something that confuses new techs: an [[E-stop]] button, when everything's fine and you're *not* pressing it, is **closed** (passing power). Press it and it **opens**. That feels backwards — but it's the whole point.\n\nIt's called **normally-closed (NC)** and **fail-safe**. Because the device passes power when healthy and breaks it when actuated, anything that goes wrong — a pressed button, a broken wire, a corroded contact, a cut cable — all do the same thing: **open the circuit and stop the machine.** Failure defaults to safe.",
      takeaway: "Safety devices are normally-closed so that ANY fault (press, break, corrosion) stops the machine. Fail-safe by design.",
    },
    {
      id: "es-03",
      kind: "interaction",
      heading: "Quick check — the point of [[NC]] wiring",
      body: "",
      interaction: choiceMcq(
        "Why are E-stops and guard switches wired normally-closed instead of normally-open?",
        [
          "It uses less wire",
          "So a broken wire or failed contact stops the machine instead of silently disabling the safety",
          "So the machine runs faster",
          "It's just tradition",
        ],
        1,
        "Right. With NC/fail-safe wiring, a broken wire opens the circuit and stops the machine — the failure is safe. If it were normally-open, a broken wire would just quietly disable the E-stop and you'd never know until you needed it.",
        "The reason is fail-safe: NC wiring means a broken wire or bad contact STOPS the machine. Normally-open would let a fault silently disable the safety — exactly what you don't want."
      ),
    },
    {
      id: "es-04",
      kind: "concept",
      heading: "The safety chain — all in series",
      body: "Machines string their safety devices in **series**: E-stop(s), guard-door switches, safety mats, light-curtain contacts, sometimes a safety relay — all normally-closed, all in one line feeding the machine's stop logic.\n\nBecause they're in series, **any single open device breaks the whole chain and stops the machine.** Press any [[E-stop]], open any guard door, and it all drops. That's what you want for safety — and it's also why 'the machine won't run' can be *any* device in a long chain.",
      takeaway: "Safety devices are in series. One open anywhere = machine stops. Great for safety, so you meter the chain to find the open.",
      visual: { type: "diagram", variant: "nc-chain" },
    },
    {
      id: "es-05",
      kind: "example",
      heading: "How to find the open device in the chain",
      body: "'Machine won't start, and it's a safety fault.' Walk the chain:\n\n1. Identify the safety string on the print ([[E-stop]]s, guards, mats, in series).\n2. With power on (respect the voltage), meter progressively down the chain.\n3. Voltage present up to a device but gone after it → that device is open.\n4. Common opens: a not-fully-reset [[E-stop]], a guard door not latched, a misaligned door switch, a tripped light curtain, a broken wire, or a loose terminal.\n5. Found it? Confirm *why* it's open — don't just reset a device that opened for a real reason.",
      takeaway: "Meter down the series safety chain; the spot where voltage disappears is your open device.",
    },
    {
      id: "es-06",
      kind: "interaction",
      heading: "Check — reading the chain",
      body: "",
      interaction: choiceMcq(
        "A machine won't start. You meter the safety chain and get voltage through the E-stops but 0V after the guard-door switch. What's most likely?",
        [
          "The E-stops are bad",
          "The guard door isn't closed/latched, or its switch is open/misaligned — that's breaking the chain",
          "The motor is bad",
          "The control transformer failed",
        ],
        1,
        "Exactly. Voltage present before the guard switch and gone after it means that device is open — the door is ajar, unlatched, or the switch is misaligned/failed. That open is what's stopping the machine.",
        "Voltage before, zero after the guard switch points right at it — the door isn't made or the switch is open. That's the break in the series chain."
      ),
    },
    {
      id: "es-07",
      kind: "concept",
      heading: "The unforgivable shortcut: jumping a safety contact",
      body: "When a safety device nuisance-trips, the lazy 'fix' is to jumper across it so it stops interrupting the chain. **Never do this.** You've just told the machine that a life-saving device is permanently 'OK' — the [[E-stop]] won't stop, the guard won't protect.\n\nIf a safety device trips falsely, the answer is to **fix the device** — realign the switch, replace the worn contact, repair the wiring, adjust the mounting. A nuisance trip is a maintenance job, not a reason to defeat the safety.",
      takeaway: "Never jumper out a safety contact to stop nuisance trips. Fix the device. Defeating it can kill someone.",
    },
    {
      id: "es-08",
      kind: "example",
      heading: "Scenario — [[E-stop]] won't reset",
      body: "Someone pressed an [[E-stop]]; now the machine won't restart even though the button looks out. Many [[E-stop]]s **twist or pull to release**, and the safety logic often needs a separate **reset** after the button clears.\n\n**Play:** Confirm the actual button is fully released (twist/pull as designed) — a half-released button still holds the chain open. Then perform the required reset (a reset button or power cycle per the machine). And before you reset: make sure whatever caused the [[E-stop]] is resolved and nobody's in the danger zone.",
      takeaway: "[[E-stop]] stuck? Fully release the button (twist/pull), then do the machine's reset — after confirming it's safe to restart.",
    },
    {
      id: "es-09",
      kind: "example",
      heading: "Scenario — the reset that caused a surprise restart",
      body: "A tech reset a safety chain and the machine immediately lurched — a conveyor jumped, startling a nearby worker. The machine had been left with its run command active, so clearing the safety let it go instantly.\n\n**Play:** Before you reset any safety, treat the machine as if it will move the moment you do. Clear people from motion zones, make sure the machine is in a safe state (not commanded to run), and warn anyone nearby. A safety reset should never be a surprise.",
      takeaway: "Assume the machine may move the instant you reset a safety. Clear the area and confirm a safe state first.",
    },
    {
      id: "es-10",
      kind: "example",
      heading: "Mistakes that get operators and new techs in trouble",
      body: "**Operators moving into maintenance:** thinking an [[E-stop]] is a normal 'stop' button (it's an emergency device), and not realizing a half-released [[E-stop]] keeps the chain open.\n\n**New techs:** jumping out a nuisance-tripping safety contact (never), not understanding [[NC]]/fail-safe wiring, not walking the series chain to find the open, and resetting a safety without clearing the area first.\n\nThe safety chain protects people. You maintain it and you trust it — you never defeat it.",
      takeaway: "Respect the chain, meter it to fix it, and never bypass it. That's the line that separates a pro from a hazard.",
    },
    {
      id: "es-11",
      kind: "interaction",
      heading: "Lesson quiz — the judgment call",
      body: "",
      interaction: choiceMcq(
        "A guard-door switch nuisance-trips because it's slightly misaligned. What's the correct fix?",
        [
          "Jumper across the switch so it stops tripping",
          "Realign or replace the switch so it works reliably — never bypass it",
          "Turn off the guard monitoring in the PLC",
          "Tape the door shut and leave the switch",
        ],
        1,
        "Correct. A nuisance-tripping safety device is a maintenance job: realign or replace it. The three wrong answers all defeat the protection — never acceptable, no matter how annoying the trips are.",
        "Never defeat the safety (jumper, disable monitoring, tape it). Fix the actual device — realign or replace the switch so it protects reliably."
      ),
    },
    {
      id: "es-12",
      kind: "summary",
      heading: "The chain that protects people",
      body: "• Safety devices are **normally-closed / fail-safe**: any [[fault]] — press, break, corrosion — **opens the circuit and stops the machine.**\n• They're wired **in series**, so one open anywhere stops everything. Meter down the chain to find the open device.\n• **Never jumper out or bypass a safety contact** to stop nuisance trips — fix the device instead.\n• A stuck [[E-stop]] usually needs the button **fully released** plus a **reset**.\n• Before any safety reset: **clear the area and confirm a safe state** — assume it may move.",
      takeaway: "Understand fail-safe, meter the chain, fix the device, never defeat it. That's how you keep the [[E-stop]] worth trusting.",
    },
  ],
};
