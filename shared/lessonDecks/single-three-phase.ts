import type { LessonCardDeck } from "../learningCardTypes";
import { choiceMcq } from "./deckHelpers";

/**
 * Power on the Plant Floor — electrical foundation, built to the Risk Assessment bar.
 * Voice: a 30-year tech getting an operator comfortable with voltage, current,
 * and the single-phase / three-phase power they'll meter every day.
 */
export const SINGLE_THREE_PHASE_DECK: LessonCardDeck = {
  moduleSlug: "motors-controls",
  lessonSlug: "single-three-phase",
  title: "Power on the Plant Floor: Single-Phase vs Three-Phase",
  whatYoullLearn: [
    "Picture voltage and current in plain terms — no math degree needed.",
    "Tell single-phase from three-phase power and know where each shows up.",
    "Know the voltages you'll meter (120/240 vs 480) and what's normal.",
    "Understand why losing one leg of three-phase wrecks motors.",
  ],
  estimatedMinutes: 14,
  previewCardCount: 3,
  cards: [
    {
      id: "sp-01",
      kind: "concept",
      heading: "The reading that didn't make sense",
      body: "A new tech metered a dead 480V motor circuit and read 480 between two legs but near zero on the third. He figured his meter was bad and reset the starter. The motor hummed, got hot, and tripped in under a minute.\n\nHe wasn't reading a bad meter — he was reading a **lost phase**. If he'd understood what three-phase power should look like, that weird reading would have told him exactly what was wrong before he cooked the motor.",
      takeaway: "You can't spot a wrong reading until you know what a right one looks like. That's what this lesson is for.",
      visual: { type: "callout", tone: "field", text: "A meter reading only looks 'weird' when you don't yet know what normal is. Learn normal, and faults announce themselves." },
    },
    {
      id: "sp-02",
      kind: "concept",
      heading: "Voltage and current, in plain English",
      body: "You don't need a math degree — just a working picture:\n\n• **Voltage** is electrical *pressure* — how hard the electricity is pushed. Measured in volts (V).\n• **Current** is the *flow* — how much electricity is actually moving. Measured in amps (A).\n\nThink water: voltage is the pressure in the pipe, current is the gallons per minute flowing. A motor needs both — pressure to push and flow to do work. When you meter, you're checking the pressure (voltage) is there and, with a clamp, how much flow (current) the motor is pulling.",
      takeaway: "Voltage = pressure (push). Current = flow (how much is moving). A motor needs both.",
    },
    {
      id: "sp-03",
      kind: "interaction",
      heading: "Quick check — voltage vs current",
      body: "",
      interaction: choiceMcq(
        "You clamp a running motor and read 22 amps. What did you just measure?",
        [
          "The electrical pressure (voltage)",
          "The flow — how much current the motor is pulling",
          "The motor's speed",
          "The resistance of the windings",
        ],
        1,
        "Right. Amps is current — the flow. A [[clamp meter]] reads how much current the motor is drawing. Compare it to the nameplate [[FLA|full-load amps]] to see if the motor's working too hard.",
        "Amps measures current — the flow of electricity. Voltage (the pressure) is what you'd read with the probes across two points."
      ),
    },
    {
      id: "sp-04",
      kind: "concept",
      heading: "Single-phase power — the simple kind",
      body: "**[[Single-phase]]** is one alternating voltage — think of your house. In a plant you'll see it on lighting, receptacles, small controls, and small equipment.\n\nCommon single-phase voltages: **120V** (controls, outlets) and **240V** (some single-phase equipment). Single-phase is fine for small loads, but it doesn't spin big motors efficiently. That's where [[three-phase]] comes in.",
      takeaway: "Single-phase = one voltage, like your house. You'll meet it at 120V (controls/outlets) and 240V.",
    },
    {
      id: "sp-05",
      kind: "concept",
      heading: "Three-phase power — what runs the plant",
      body: "**[[Three-phase]]** is three alternating voltages, staggered so their peaks come one after another. That staggering gives a smooth, constant push — perfect for motors, which is why nearly every production motor is three-phase.\n\nThe most common industrial three-phase voltage is **480V** (measured between any two of the three legs — L1, L2, L3). You'll also see 208V and 240V three-phase. Three legs, roughly equal voltage between any two — that's healthy three-phase.",
      takeaway: "Three-phase = three staggered voltages = smooth power for motors. Plant standard is 480V between legs.",
      visual: { type: "diagram", variant: "motor-starter-chain" },
    },
    {
      id: "sp-06",
      kind: "interaction",
      heading: "Check — which is which?",
      body: "",
      interaction: choiceMcq(
        "You're at a 480V three-phase motor. Roughly what should you read between any two of the three legs (L1-L2, L2-L3, L1-L3)?",
        [
          "About 120V on each",
          "About 480V on each, all three roughly equal",
          "480V on one pair, 0V on the others",
          "It doesn't matter what you read",
        ],
        1,
        "Correct. Healthy three-phase reads roughly the same voltage — about 480V — between each pair of legs. If one pair reads low or zero, you've lost a leg.",
        "On healthy 480V three-phase you read ~480V between each pair of legs, all three roughly equal. A low or zero reading on one pair means a lost leg."
      ),
    },
    {
      id: "sp-07",
      kind: "concept",
      heading: "Why a motor pulls more when voltage drops",
      body: "Here's a fact that trips people up: a motor doing the same work needs the same *power*. Power comes from voltage × current. So if the **voltage sags**, the **current climbs** to make up for it.\n\nThat's why low voltage overheats motors and trips overloads — the motor pulls extra current to keep doing its job. When you see a motor drawing high amps, low supply voltage is one of the first things to check.",
      takeaway: "Voltage down → current up (same work). Low voltage makes motors run hot and trip.",
    },
    // ── Scenarios ──────────────────────────────────────────────
    {
      id: "sp-08",
      kind: "example",
      heading: "Scenario — the lost leg (single-phasing)",
      body: "A three-phase motor hums, won't come up to speed, and heats fast. You meter the three legs: L1-L2 reads 480, but L2-L3 and L1-L3 read low or zero. One leg is gone — a blown fuse, loose lug, or bad contact.\n\n**Play:** The motor is trying to run on two legs, pulling heavy current on those two — it'll cook in minutes. Isolate, find the open leg (fuse, connection, contactor pole), fix it. Don't keep energizing a single-phasing motor.",
      takeaway: "Two legs good, one leg low/zero = single-phasing. Find the lost leg before it burns the motor.",
      visual: { type: "callout", tone: "warning", text: "A three-phase motor running on two legs overheats fast. If one leg reads low/zero, stop and find the open." },
    },
    {
      id: "sp-09",
      kind: "example",
      heading: "Scenario — 120V control, 480V motor, same panel",
      body: "You open a panel and there's 480V three-phase feeding the motor and 120V single-phase running the controls (via a small control transformer). New techs sometimes assume everything in the panel is one voltage.\n\n**Play:** Know what you're touching. The motor terminals are 480V three-phase; the control circuit (start/stop, relays, programmable logic controller (PLC)) is often 120V single-phase. Meter to confirm before you assume — and respect that 480V will hurt you a lot faster than 120V.",
      takeaway: "One panel often has two voltages: 480V power and 120V control. Know which is which before you probe.",
    },
    {
      id: "sp-10",
      kind: "example",
      heading: "Scenario — the afternoon trip",
      body: "A motor runs fine all morning, then trips overloads every afternoon when the whole plant is running. You meter voltage under load at peak and it's sagging well below 480.\n\n**Play:** Low voltage is making the motor pull extra current. The motor and overload are innocent — the issue is supply (heavy plant loading, undersized feeders, or utility). This is an escalation to your electrical lead, not a motor swap.",
      takeaway: "Trips that track with plant load = suspect low voltage. Meter it under load before blaming the motor.",
    },
    {
      id: "sp-11",
      kind: "interaction",
      heading: "Scenario check — put it together",
      body: "",
      interaction: choiceMcq(
        "A three-phase motor won't start and heats up. You meter the disconnect: L1-L2 = 480V, L2-L3 = 480V, but L1-L3 = 0V. What's wrong?",
        [
          "Normal readings — check the motor bearings",
          "A lost/failing leg between L1 and L3 — single-phasing; find the open",
          "The meter is broken",
          "Too much voltage — turn it down",
        ],
        1,
        "Exactly. Two pairs read a healthy ~480V, but L1-L3 reads 0V — one of those legs has an open upstream (blown fuse, loose lug, or bad contactor pole). That's single-phasing. Isolate and find the fault before energizing again.",
        "Two pairs are healthy (~480V) but L1-L3 reads 0V. That points to a lost leg on L1 or L3 — single-phasing. Find the open connection upstream (fuse, lug, contactor pole)."
      ),
    },
    {
      id: "sp-12",
      kind: "example",
      heading: "Mistakes that trip up operators and new techs",
      body: "**Operators moving into maintenance:** assuming a whole panel is 'just electricity' at one voltage, and treating 480V with the same casualness as 120V.\n\n**New techs:** not knowing what a healthy three-phase reading looks like (so they can't spot a lost leg), forgetting that low voltage raises current, and energizing a single-phasing motor repeatedly.\n\nLearn what normal looks like — three roughly-equal legs, the right voltage for the circuit — and abnormal jumps right out at you.",
      takeaway: "Know normal cold. Then a lost leg or a voltage sag tells you the fault before you've even opened the machine.",
    },
    {
      id: "sp-13",
      kind: "interaction",
      heading: "Lesson quiz — the fundamentals",
      body: "",
      interaction: choiceMcq(
        "Which statement is TRUE?",
        [
          "When supply voltage drops, a loaded motor draws less current",
          "When supply voltage drops, a loaded motor draws more current and runs hotter",
          "Three-phase and single-phase are the same thing",
          "480V is safer to work on than 120V",
        ],
        1,
        "Correct. A motor needs the same power to do the same work, so when voltage sags the current rises — and the motor heats up. That's why low voltage causes overload trips.",
        "A loaded motor draws MORE current when voltage drops (same work, less pressure → more flow), which makes it run hotter. And 480V is far more dangerous than 120V."
      ),
    },
    {
      id: "sp-14",
      kind: "summary",
      heading: "Know what normal looks like",
      body: "• **Voltage** is pressure (push); **current** is flow (how much moves). A motor needs both.\n• **Single-phase** (120V/240V) runs controls and small loads; **three-phase** (usually 480V) runs the motors.\n• Healthy three-phase = roughly equal voltage between all three legs. One low/zero pair = a **lost leg** (single-phasing).\n• **Low voltage makes motors pull more current** and run hot — check supply voltage on high-amp trips.\n• One panel often carries **two voltages** (480V power, 120V control). Know which you're touching.",
      takeaway: "Learn normal, respect 480V, and meter the three legs. That's the foundation everything electrical builds on.",
    },
  ],
};
