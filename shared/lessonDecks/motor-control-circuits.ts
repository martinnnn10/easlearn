import type { LessonCardDeck } from "../learningCardTypes";
import { choiceMcq, orderSteps, predict, masterAsk, reasonedAsk } from "./deckHelpers";

/**
 * Motor Control Circuits — the 3-wire start/stop, the bread and butter of
 * maintenance. Built to the Risk Assessment bar. Voice: a 30-year tech showing
 * an operator how the most common circuit on the floor actually works.
 */
export const MOTOR_CONTROL_CIRCUITS_DECK: LessonCardDeck = {
  moduleSlug: "motors-controls",
  lessonSlug: "motor-control-circuits",
  title: "Motor Control Circuits: The Start/Stop You'll Fix Most",
  reflection: true, // closes the apprenticeship loop — reference implementation
  whatYoullLearn: [
    "Read the three-wire start/stop circuit that runs most machines.",
    "See why the seal-in contact keeps a motor running after you let go.",
    "Separate control power (120V) from motor power (480V) when you troubleshoot.",
    "Meter the safety string to find the one open device stopping the motor.",
  ],
  estimatedMinutes: 15,
  previewCardCount: 3,
  cards: [
    {
      id: "mc-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **NC**: normally closed\n- **NO**: normally open\n- **E-stop**: emergency stop",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "mc-01",
      kind: "concept",
      heading: "Stand next to me — this line's down",
      body: "Walk with me. Packaging line's down, and here's the starter. Listen — that contactor's **buzzing but it won't pull in**. And before you ask: the last guy already swapped it. Twice. New contactor, same buzz.\n\nDon't touch anything yet. Just look at it, and think about what you'd do first.",
      takeaway: "A contactor that chatters and won't pull in has already fooled one person into swapping parts. Don't be the second.",
      visual: { type: "callout", tone: "field", text: "Two contactors and an hour already gone. A part that chatters isn't always a bad part — so what would you actually check?" },
    },
    {
      id: "mc-02",
      kind: "interaction",
      heading: "So — what's your first move?",
      body: "",
      interaction: masterAsk(
        "The contactor's buzzing and won't pull in. Two have already been swapped. What do you do first?",
        [
          { label: "Swap the contactor a third time", response: "That's exactly what the last guy did — twice. Still buzzing. If two new parts behave the same way, the part isn't the problem. Something's feeding it wrong. Try again." },
          { label: "Meter the coil voltage at A1–A2 with Start pressed", response: "" },
          { label: "Replace the motor", response: "The motor never even got power — the contactor didn't pull its main contacts in, so nothing reached the motor. You're at the wrong end of the circuit. Come back upstream and try again." },
          { label: "Reset it and crank the [[overload]] setting up", response: "Turning up an [[overload]] to make a problem go away is how you cook a motor and start a fire. That's never the move. Try again." },
        ],
        1,
        "That's thinking like a tech. You read a part before you condemn it. Grab your meter — let's go put it on the coil terminals together.",
      ),
    },
    {
      id: "mc-03",
      kind: "concept",
      heading: "Now watch — we meter the coil",
      body: "We put the leads on the coil terminals — **A1 and A2** — and press Start. The meter reads **95 volts** on a **120-volt** coil.\n\nThere it is. Enough voltage to make the coil hum, not enough to pull the contacts in. Nothing wrong with the contactor — the coil is **starved**. That's a *control-power* problem (a transformer tap left wrong after a repair), and control power is a completely different circuit from the power that turns the motor. Let me show you the two circuits, because mixing them up is what sent the last guy chasing his tail.",
      takeaway: "Chatter + no pull-in = meter the coil (A1–A2). Low voltage = a control-power problem, not a bad contactor.",
    },
    {
      id: "mc-03b",
      kind: "concept",
      heading: "Two circuits in one panel: control vs. power",
      body: "Every motor starter has **two** circuits, and mixing them up is the #1 rookie mistake:\n\n• **The power circuit** — the big stuff. 480V three-phase through the contactor's main contacts to the motor. This is what does the work (and what hurts you).\n• **The control circuit** — the brains. Usually 120V (from a small control transformer) running the start button, stop button, and the contactor **coil**.\n\nPush start → the control circuit energizes the coil → the coil pulls the main contacts closed → 480V reaches the motor. Small circuit controls the big one.",
      takeaway: "Control circuit (120V) energizes the coil; the coil closes the power contacts (480V) to the motor. Two circuits — know which you're metering.",
    },
    {
      id: "mc-04",
      kind: "concept",
      heading: "The three-wire start/stop — how it works",
      body: "This is the circuit on most machines. Trace the control string:\n\n**L1 → Stop button (**NC (normally closed)**) → Start button (**NO (normally open)**) → Coil → L2**\n\n• Press **Start** (normally-open): completes the path, the coil energizes, contacts pull in, motor runs.\n• But the moment you let go of Start, that path opens again... so why doesn't it stop?\n\nBecause of the **seal-in (holding circuit)** (next card). The Stop button is **normally-closed** — it's already passing power until you press it, which breaks the string and drops the coil.",
      takeaway: "Start = normally-open (press to run). Stop = normally-closed (press to break the string). The coil sits between them.",
      visual: { type: "diagram", variant: "motor-starter-chain" },
    },
    {
      id: "mc-05",
      kind: "concept",
      heading: "The [[seal-in]]: why it keeps running after you let go",
      body: "Here's the clever part. When the contactor pulls in, one of its **auxiliary contacts** (a small [[NO]] contact that moves with the main contacts) closes **in parallel with the Start button**.\n\nSo the instant the coil energizes, that **aux contact (auxiliary contact)** 'seals in' — it keeps the coil's path complete even after you release Start. The motor keeps running. Press **Stop**, the string breaks, the coil drops, the aux opens, and it stays stopped until you press Start again.\n\nThat parallel aux contact is the whole trick. Miss it on a print and the circuit makes no sense.",
      takeaway: "The [[seal-in]] is an [[aux contact]] wired parallel to Start. It latches the coil so the motor runs after you release the button.",
      visual: { type: "diagram", variant: "ladder-seal-in" },
    },
    {
      id: "mc-05x",
      kind: "example",
      heading: "Work it — the [[seal-in]], live",
      body: "Reading about the [[seal-in]] is one thing. Make it happen. Press and hold **START**: the coil pulls in and its [[aux contact]] closes. Now **let go** — it keeps running. That parallel [[aux contact]] is holding the coil's path complete. Press **STOP** to drop it, or **trip the overload** to watch the whole series string open, fail-safe.",
      visual: { type: "interactive", sim: "motor-starter-seal-in" },
      takeaway: "You just latched and released a real starter. Releasing START doesn't stop the motor — only breaking the string does.",
    },
    {
      id: "mc-06",
      kind: "interaction",
      heading: "Predict — you release the Start button",
      body: "",
      interaction: predict(
        "The contactor just pulled in. You take your finger off the Start button. Predict what the motor does.",
        [
          "Stops immediately — you let go of Start",
          "Keeps running — the seal-in aux contact holds the coil",
          "Runs a few seconds, then coasts down",
          "Trips the overload",
        ],
        1,
        "Why it keeps running",
        "The instant the coil energized, its **auxiliary contact closed in parallel with Start** and sealed in the circuit. Letting go of Start does nothing now — the aux keeps the coil's path complete. Only pressing **Stop** (breaking the normally-closed string) drops the coil and stops the motor. Flip side: if it *did* stop when you released Start, that aux contact isn't making — the classic 'won't stay running' fault.",
        "Called it — the seal-in latches the coil.",
        "Watch what the seal-in does — the outcome below is the whole trick of this circuit."
      ),
    },
    {
      id: "mc-07",
      kind: "concept",
      heading: "The safety string — everything in series",
      body: "Real machines put safety devices in **series** in that control string: **E-stop (emergency stop)**, [[overload]] contact, guard-door switch, maybe a low-air pressure switch — all normally-closed, all in a line before the coil.\n\n**One open device anywhere in the string stops the motor.** That's on purpose (fail-safe): a broken wire or a tripped device looks the same as pressing Stop — the motor drops out safely. But it also means when a motor 'won't start,' the fault could be *any* device in that series chain.",
      takeaway: "Safety devices sit in series, normally-closed. Any one open = motor stops. That's fail-safe by design.",
      visual: { type: "diagram", variant: "nc-chain" },
    },
    {
      id: "mc-08",
      kind: "example",
      heading: "How to troubleshoot 'won't start' — meter the string",
      body: "When the motor won't start, don't guess — walk the control string with your meter (control circuit is often 120V, but respect it):\n\n1. Confirm control voltage is present (L1 to L2 on the control circuit).\n2. Meter across each device in the string, or check voltage progressively down the line.\n3. The device where voltage is present on one side but the string is open past it is your culprit — a tripped [[overload]], an open [[E-stop]], an open guard switch, a broken wire.\n4. Found the open device? Now ask *why* it's open (a real [[fault]]) before you reset.",
      takeaway: "Walk the series string with a meter. The point where the path goes open is the device that stopped the motor.",
    },
    {
      id: "mc-08b",
      kind: "interaction",
      heading: "Build the procedure — 'won't start', [[control voltage]] present",
      body: "",
      interaction: orderSteps(
        "Put a tech's 'won't start' troubleshooting in the order you'd actually work it.",
        [
          { id: "s1", label: "Confirm [[control voltage]] is present (L1–L2 on the control circuit)", because: "No control voltage? The fault is upstream — the transformer or its fusing. Fix that first." },
          { id: "s2", label: "Meter down the series string, device by device", because: "You're hunting for the point where the path goes open." },
          { id: "s3", label: "Find the device with voltage on one side and 0V past it", because: "Voltage before, zero after — that device is the open. Your culprit." },
          { id: "s4", label: "Find out WHY it's open before you reset it", because: "A tripped overload or open guard tripped for a reason. Reset without a cause and it just trips again." },
        ],
        "That's the method: confirm power, walk the string, isolate the open, then find the cause. Systematic — no parts thrown at the wall.",
        "Think about what has to be true first: you confirm you HAVE control power before you go hunting for where it disappears — and you never reset a safety device before you know why it opened."
      ),
    },
    {
      id: "mc-09",
      kind: "interaction",
      heading: "Check — reading the string",
      body: "",
      interaction: choiceMcq(
        "You're metering the 120V control string. You read 120V up to the overload contact, but 0V past it. What does that tell you?",
        [
          "The control transformer is bad",
          "The overload contact is open — it tripped or failed open; that's what's stopping the motor",
          "The motor is fine, restart it",
          "The 480V power circuit is the problem",
        ],
        1,
        "Correct. Voltage present before the overload contact and gone after it means that contact is open. The overload tripped (find out why) or failed. You've isolated the exact device in the series string.",
        "Voltage before, zero after = that device is the open in the string. Here it's the overload contact. Find why it tripped before resetting."
      ),
    },
    {
      id: "mc-10",
      kind: "example",
      heading: "Scenario — the low-voltage coil (the opening story)",
      body: "Contactor buzzes, won't pull in. Instead of swapping it:\n\n**Play:** Meter the coil voltage (A1-A2 on the contactor) with Start pressed. Rated 120V coil reading ~95V? You've got a control-power problem — wrong transformer tap, an undersized transformer, a loose connection, or a partially-open device dropping voltage. Fix the voltage, not the contactor. Reads 0V? The control string is open somewhere — walk it.",
      takeaway: "Buzzing coil → meter A1-A2. Low = control-power problem. Zero = open in the string. Neither = a new contactor.",
    },
    {
      id: "mc-11",
      kind: "example",
      heading: "Scenario — runs, then drops out on its own",
      body: "A motor starts fine but randomly drops out during the run. The [[seal-in]] is working (it stays running a while), so suspect something in the series string opening intermittently: a marginal [[overload]], a loose lug heating up, a guard switch bouncing, a low-air switch chattering.\n\n**Play:** Look for the intermittent open. Wiggle-test connections (safely), watch for a device near its trip point, check for a loose terminal getting warm. Intermittent drop-outs are almost always a loose connection or a marginal safety device in the string.",
      takeaway: "Random drop-outs = an intermittent open in the series string. Hunt loose lugs and marginal devices.",
    },
    {
      id: "mc-12",
      kind: "example",
      heading: "Mistakes that trip up operators and new techs",
      body: "**Operators moving into maintenance:** swapping the contactor because it buzzes, and confusing the 120V control side with the 480V power side.\n\n**New techs:** not understanding the seal-in (so 'won't stay running' baffles them), forgetting the safety devices are in series (so they don't walk the string), resetting a tripped [[overload]] in the string without finding the cause, and metering the power circuit when the [[fault]] is in control.\n\nKnow the two circuits and the [[seal-in]], and 90% of start/stop faults become obvious.",
      takeaway: "Understand control-vs-power and the [[seal-in]], then meter the series string. That's most motor-control troubleshooting.",
    },
    {
      id: "mc-13",
      kind: "interaction",
      heading: "Your call — I'm just watching now",
      body: "",
      interaction: reasonedAsk({
        question: "A motor won't start. You meter L1–L2 on the control circuit: 120V present. What's your move?",
        actions: [
          "Replace the contactor",
          "Meter down the series control string to find the one device that's open",
          "Check the 480V motor windings first",
          "Reset and turn the overload up",
        ],
        correctActionIndex: 1,
        reasons: [
          "Control voltage is present, so the coil's supply is good — the break has to be one device open in the series string.",
          "Metering is usually the right first step.",
          "The string is the easiest place to poke around.",
        ],
        correctReasonIndex: 0,
        feedbackRightReason:
          "That's a tech's reasoning — and it's why you'll be fast. Voltage present rules out the supply, so the fault is a single open device in series. Metering down the string tells you exactly which one. You didn't guess. You reasoned.",
        feedbackWeakReason:
          "Right move — but 'metering is usually right' isn't why it's right *here*. It's right because control voltage is PRESENT: that rules out the supply and tells you the break is one open device in the series string. Keep the why, or next time you'll confidently meter the wrong circuit.",
        feedbackWrongAction:
          "Control voltage is present — so the supply's fine and the motor never got power. Swapping the contactor or chasing the 480V side is chasing your tail, and cranking the overload hides a real fault. Ask yourself what 'voltage present' already told you, then try again.",
      }),
    },
    {
      id: "mc-14",
      kind: "summary",
      heading: "From here, you don't need me over your shoulder",
      body: "You just worked that the way I would. Before I step back — here's what I actually want you to keep. Not the facts. The **questions I kept asking you**. Ask them on every call and you'll troubleshoot like a tech:\n\n1. **What changed?** It ran before — what's different now?\n2. **What have I verified, versus assumed?** (You *metered* the coil. You didn't guess it was low.)\n3. **What's the cheapest test that splits the problem in half?** (Control voltage present or not — that one reading cut the whole circuit in two.)\n4. **Is it safe?** Before you reset a tripped device, you know *why* it opened.\n\nThe circuit facts — two circuits, the [[seal-in]], the series string — you'll remember because you *worked* them, not read them. The four questions are what make you a tech.",
      takeaway: "You don't memorize troubleshooting. You ask four questions — what changed, what have I verified, what's the cheapest test, is it safe — until they're automatic.",
    },
  ],
};
