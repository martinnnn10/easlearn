import type { LessonCardDeck } from "../learningCardTypes";
import { choiceMcq } from "./deckHelpers";

/**
 * Risk Assessment — flagship operator-to-tech lesson.
 * Voice: a 30-year tech explaining it to an operator moving into maintenance.
 * Plain English, plant-floor real, scenario-heavy. No corporate filler.
 */
export const RISK_ASSESSMENT_DECK: LessonCardDeck = {
  moduleSlug: "safety-systems",
  lessonSlug: "risk-assessment",
  title: "Risk Assessment: Before You Touch It",
  whatYoullLearn: [
    "Tell the difference between a hazard, a risk, and a control.",
    "Size up a job with severity × likelihood before you reach in.",
    "Spot stored energy that can bite you on a 'dead' machine.",
    "Run the Before-Touch checklist and know when to stop and escalate.",
  ],
  estimatedMinutes: 16,
  previewCardCount: 3,
  cards: [
    // ── Cold open ──────────────────────────────────────────────
    {
      id: "ra-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **VFD**: variable frequency drive\n- **DC**: direct current\n- **LOTO**: lockout/tagout\n- **PLC**: programmable logic controller\n- **HMI**: human-machine interface",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "ra-01",
      kind: "concept",
      heading: "The third jam is the one that gets you",
      body: "A carton erector jammed twice on nights. Both times an operator reached past a propped-open side guard and cleared it — machine still enabled. Third jam, same reach, the servo indexed. Two fingers, one recordable. Everybody 'knew' it was dangerous. Nobody stopped the machine first.\n\nThat's the whole reason this lesson exists: knowing a job is risky doesn't protect you. What you *do before you reach in* protects you.",
      takeaway: "Awareness doesn't save hands. Controls do.",
      visual: { type: "callout", tone: "warning", text: "Reaching into an enabled machine to clear a jam is the #1 way maintenance and operators get hurt." },
    },
    {
      id: "ra-02",
      kind: "concept",
      heading: "What 'risk assessment' actually is on the floor",
      body: "Forget the binder version. On the floor, risk assessment is the 30 seconds of thinking you do between 'the machine is down' and 'my hands are in it.'\n\nIt's answering three questions out loud: What can hurt me here? How bad and how likely? What do I put between me and it before I go in? Maintenance techs do this every single job — the good ones do it without being told.",
      takeaway: "Risk assessment is the thinking you do before the reaching. Every job, every time.",
    },
    {
      id: "ra-02b",
      kind: "interaction",
      heading: "Quick check — what actually protects you?",
      body: "",
      interaction: choiceMcq(
        "In the carton-erector story, what would have prevented the injury?",
        [
          "Reaching in more carefully",
          "Stopping and locking out the machine before clearing the jam",
          "A bigger warning sign on the guard",
          "Faster hands",
        ],
        1,
        "Right. The only thing that actually stops a servo is removing the energy — stop and lock out before your hands go in. Care, signs, and speed don't stop a machine.",
        "Awareness and being careful don't stop machines. The fix is to stop and isolate the machine before reaching in."
      ),
    },
    {
      id: "ra-03",
      kind: "concept",
      heading: "Hazard vs. Risk vs. Control — get these straight",
      body: "These three words get mixed up constantly. Keep them separate:\n\n• **Hazard** = the thing that can hurt you. (A spinning shaft. 480 volts. A raised cylinder.)\n• **Risk** = how likely it is to hurt you, and how bad. (Reaching near that shaft while it turns = high risk.)\n• **Control** = what you put in place to lower the risk. (Lock it out, guard it, verify zero energy.)\n\nThe hazard usually can't be removed — a motor has to spin to do its job. You manage the **risk** by adding **controls**.",
      takeaway: "Hazard = what can hurt you. Risk = how likely + how bad. Control = what you do about it.",
    },
    {
      id: "ra-04",
      kind: "interaction",
      heading: "Quick check — hazard or risk?",
      body: "",
      interaction: choiceMcq(
        "A 480V control panel is energized. Which of these is the HAZARD?",
        [
          "Reaching in with a metal screwdriver while it's live",
          "The 480 volts present at the terminals",
          "The chance you get shocked",
          "Wearing the wrong gloves",
        ],
        1,
        "Right. The 480V is the hazard — the energy that can hurt you. Reaching in live and the chance of shock are about RISK. Gloves are a control.",
        "Think it through: the hazard is the energy itself (480V). The reaching, the odds, and the gloves are about risk and controls."
      ),
    },
    // ── Severity × likelihood ──────────────────────────────────
    {
      id: "ra-05",
      kind: "concept",
      heading: "Sizing it up: how bad × how likely",
      body: "You don't need a fancy matrix. Every hazard gets two gut reads:\n\n• **Severity** — if it goes wrong, is it a bruise, a stitch, a hospital trip, or a funeral?\n• **Likelihood** — with what I'm about to do, is it almost certain, possible, or unlikely?\n\nHigh severity changes everything. A one-in-a-thousand chance of losing an arm still means you lock it out. When severity is 'someone dies,' likelihood barely matters — you control it hard.",
      takeaway: "When the worst case is death or amputation, low odds don't save you. Control it like it will happen.",
    },
    {
      id: "ra-06",
      kind: "interaction",
      heading: "Scenario — score it",
      body: "",
      interaction: choiceMcq(
        "You need to clear a light jam right at the infeed nip of a running conveyor. Reaching in takes 2 seconds. How do you treat this?",
        [
          "Low risk — it's only 2 seconds, just be quick",
          "High risk — a nip point can amputate; stop and isolate before reaching",
          "Medium — wear gloves and reach carefully",
          "Ask the operator to hold it steady while you reach",
        ],
        1,
        "Correct. Severity at a nip point is catastrophic (fingers/hand). 'Only 2 seconds' is exactly when people get caught. Stop it and verify zero motion first.",
        "A nip point can take a hand. High severity means you don't gamble on speed or gloves — you remove the motion first."
      ),
    },
    // ── Stored energy ──────────────────────────────────────────
    {
      id: "ra-07",
      kind: "concept",
      heading: "The trap: stored energy on a 'dead' machine",
      body: "The most dangerous words in maintenance: 'It's off, you're fine.' Off at the button is not the same as safe. Energy hides:\n\n• A **raised cylinder or Z-axis** drops when you release the air.\n• A **charged capacitor** in a VFD (variable frequency drive) holds a lethal DC (direct current) bus for minutes after power-off.\n• A **wound spring, tensioned belt, or counterweight** lets go when you pull a pin.\n• **Trapped air or hydraulic pressure** moves a cylinder even with the pump off.\n\nHitting stop removes the *command*. It does not always remove the *energy*.",
      takeaway: "Stop button ≠ zero energy. Assume something is still loaded until you prove it isn't.",
      visual: { type: "callout", tone: "warning", text: "VFD DC bus can hold a lethal charge for several minutes after disconnect. Wait and verify before touching drive terminals." },
    },
    {
      id: "ra-08",
      kind: "concept",
      heading: "The eight ways a machine can hurt you",
      body: "Walk up to any machine and scan for these eight. Each one hides differently:\n\n• **Mechanical** — spinning shafts, gears, nips, cutting.\n• **Motion / gravity** — indexing servos, raised loads that can drop.\n• **Electrical** — shock, arc flash, 480V, control voltage.\n• **Pneumatic** — trapped air, cylinders that snap out.\n• **Hydraulic** — high-pressure fluid, injection injuries, drift.\n• **Thermal** — hot motors, steam, heaters, cold lines.\n• **Chemical** — coolant, solvents, process material.\n• **Stored/spring** — tension, counterweights, capacitors.",
      takeaway: "Mechanical · motion/gravity · electrical · pneumatic · hydraulic · thermal · chemical · stored. Scan all eight.",
    },
    {
      id: "ra-09",
      kind: "interaction",
      heading: "Name the hazard",
      body: "",
      interaction: choiceMcq(
        "A vertical pick-and-place is stopped with its head raised on a pneumatic slide. You need to work under it. What's the hazard you must control FIRST?",
        [
          "Electrical — lock out the panel",
          "Gravity + pneumatic — the head can drop when air bleeds off",
          "Thermal — the motor may be hot",
          "Chemical — check for coolant",
        ],
        1,
        "Yes. A raised pneumatic axis is stored energy: bleed the air and it drops. Block it or bring it down safely BEFORE you get under it — locking the panel alone won't stop gravity.",
        "It's raised and held by air. Kill the air and gravity wins. You must block/lower the axis, not just cut electrical power."
      ),
    },
    // ── Before-touch checklist ─────────────────────────────────
    {
      id: "ra-10",
      kind: "example",
      heading: "The Before-Touch Checklist",
      body: "Run this every time, out loud if you have to. It takes under a minute and it's the difference between a tech and a statistic:\n\n1. **What am I about to do?** (Name the task and where my body goes.)\n2. **What can hurt me?** (Scan the eight hazards.)\n3. **What's still loaded?** (Air, hydraulic, springs, raised loads, caps.)\n4. **Is it isolated and verified zero?** (LOTO (lockout/tagout) applied, tested dead — not assumed.)\n5. **Can it restart or move on its own?** (Photoeye, timer, PLC (programmable logic controller), another operator.)\n6. **Do I have the right PPE and tools?**\n7. **If it goes wrong, what's my out?**",
      takeaway: "Task → hazards → stored energy → isolate & verify → restart risk → PPE → escape. Every job.",
      visual: { type: "diagram", variant: "loto-steps" },
    },
    {
      id: "ra-11",
      kind: "interaction",
      heading: "Check — the step people skip",
      body: "",
      interaction: choiceMcq(
        "Which Before-Touch step gets skipped most often and causes the most injuries?",
        [
          "Putting on gloves",
          "Verifying zero energy after applying LOTO (proving it's actually dead)",
          "Naming the task",
          "Checking your escape route",
        ],
        1,
        "Exactly. People apply the lock and assume it's dead. Verification — try-to-start, meter the terminals, bleed the air, check for drift — is the step that actually saves you. Locking without verifying is a false sense of safety.",
        "Applying a lock is not proof. The killer is skipping VERIFICATION — actually testing that the energy is gone before you commit your hands."
      ),
    },
    // ── Stop and escalate ──────────────────────────────────────
    {
      id: "ra-12",
      kind: "concept",
      heading: "When to stop and get help — no shame in it",
      body: "The best techs stop more than the reckless ones. Stop and escalate when:\n\n• You'd have to **bypass or defeat a guard or safety device** to do the job.\n• You **can't fully isolate or verify** the energy.\n• The fix needs **live troubleshooting** and you're not trained/authorized for it.\n• Something **doesn't add up** — the machine did something it shouldn't.\n• You feel **rushed, unsure, or pressured** to skip a step.\n\nStopping a line to get it right is cheap. An injury or an arc flash is not.",
      takeaway: "If the only way in is to defeat a safety device or guess — stop and escalate. That's the pro move.",
    },
    {
      id: "ra-13",
      kind: "interaction",
      heading: "Stop or proceed?",
      body: "",
      interaction: choiceMcq(
        "Your supervisor says 'just jump the door switch to keep it running while you look — we're behind.' What do you do?",
        [
          "Jump it, they're the boss and we're behind",
          "Jump it but only for a minute",
          "Stop — refuse to defeat the safety device; troubleshoot with proper controls or escalate",
          "Ask the operator to jump it instead",
        ],
        2,
        "Right answer, and it's non-negotiable. Defeating an interlock to save production is how people die and how companies get OSHA findings. Pressure from a boss doesn't change the physics. Stop and do it right.",
        "Never defeat a safety interlock for production pressure — no matter who asks. That's the exact decision the injury stories are built on."
      ),
    },
    // ── The five scenarios ─────────────────────────────────────
    {
      id: "ra-14",
      kind: "example",
      heading: "Scenario 1 — Conveyor jam",
      body: "A box is wedged at a transfer between two belts. Operators normally reach in and yank it. As the tech, your read: the belts can restart on a timer or from the HMI (human-machine interface), and the transfer is a nip point.\n\n**Play:** Stop and lock out the conveyor drive(s). Verify the belt won't move (try-to-start). *Then* clear the jam. Look for *why* it jammed — a worn guide, a skewed box, a bad photoeye — because you'll be back in an hour if you don't.",
      takeaway: "Clear the jam after isolation. Then fix the cause, not just the symptom.",
    },
    {
      id: "ra-15",
      kind: "example",
      heading: "Scenario 2 — Photoeye fault",
      body: "A machine faults 'part present' but there's no part. Tempting to reach in and wave a hand at the sensor while it runs. The hazard: the machine thinks it's clear and may index while your arm is in the zone.\n\n**Play:** Treat 'it might move on its own' as live motion. Isolate if you're going into the motion path. If you must observe it live to diagnose (authorized live work), keep your body out of every motion zone and know the stop within reach.",
      takeaway: "A sensor [[fault]] means the machine's 'eyes' are wrong — assume it can move when it shouldn't.",
    },
    {
      id: "ra-16",
      kind: "example",
      heading: "Scenario 3 — Air cylinder stuck extended",
      body: "A clamp cylinder is stuck out and won't retract. You need to free it. The trap: it's full of pressurized air. Pull the wrong fitting or free the mechanism and it can slam in — or shoot the rod — with real force.\n\n**Play:** Lock out AND bleed the pneumatic system to zero (watch the gauge hit 0, don't trust the valve). Confirm no residual pressure. Understand which way it'll move when it frees. Keep hands out of the stroke path.",
      takeaway: "Bleed pneumatic/hydraulic pressure to a verified zero — a charged cylinder is a loaded gun.",
      visual: { type: "callout", tone: "field", text: "Watch the pressure gauge drop to 0 with your own eyes. A closed valve is not a bled system." },
    },
    {
      id: "ra-17",
      kind: "example",
      heading: "Scenario 4 — The guard-bypass temptation",
      body: "You can see the problem, but the fixed guard is in the way and it's six bolts to remove. There's a gap you *could* reach through with the machine running. Every instinct under time pressure says 'just reach.'\n\n**Play:** This is the exact moment the injury stories are made. Take the six bolts out, or lock out and open the guard properly. If the design forces you to bypass a guard to do routine work, that's a finding to report — not a habit to build.",
      takeaway: "If the safe way is slower, the safe way still wins. Reaching past a guard is never worth it.",
    },
    {
      id: "ra-18",
      kind: "example",
      heading: "Scenario 5 — Motor [[overload]] trip",
      body: "A motor overload (OL) keeps tripping. The lazy move: reset it and walk away. The [[overload]] tripped for a reason — a jam, a bad bearing, a failing motor, low voltage, or a real overload. Repeated resets can cook the motor or hide a mechanical failure that's about to get worse.\n\n**Play:** Before resetting, ask why. Feel/listen for the driven load, check for a mechanical bind, look at the current draw. Isolate before you put hands on the coupling or load. Reset is the *last* step after you understand the cause — not the first.",
      takeaway: "An [[overload]] trip is information. Find the cause before you reset — or you'll reset your way into a burned motor.",
      visual: { type: "diagram", variant: "motor-starter-chain" },
    },
    {
      id: "ra-19",
      kind: "interaction",
      heading: "Scenario check — put it together",
      body: "",
      interaction: choiceMcq(
        "You're called to a jammed indexer. It's stopped, head raised on air, 480V drive in the panel, and it faulted on a photoeye. What's your FIRST move before touching anything?",
        [
          "Reach in fast and clear the jam since it's already stopped",
          "Reset the photoeye fault to see if it clears",
          "Run Before-Touch: lock out electrical, block/lower the raised axis, bleed air, verify zero — THEN work",
          "Cycle power to the drive to reset everything",
        ],
        2,
        "That's the tech mindset. Multiple energies are in play — electrical, gravity, pneumatic — and a sensor fault means it could move. You isolate and verify ALL of them before your hands go in. That's the whole lesson in one move.",
        "Stopped isn't safe. You've got electrical, a raised (gravity/air) axis, and a machine that thinks it can move. Isolate and verify every energy before touching it."
      ),
    },
    // ── Control hierarchy + mistakes ───────────────────────────
    {
      id: "ra-20",
      kind: "concept",
      heading: "Fix it with engineering, not just reminders",
      body: "When you do control a risk, some controls are far stronger than others. Strongest to weakest:\n\n1. **Eliminate / redesign** — remove the need to reach in at all.\n2. **Engineering controls** — guards, interlocks, a validated stop circuit.\n3. **Administrative** — procedures, training, signs.\n4. **PPE** — gloves, face shield (your last line, not your first).\n\nIf a job keeps hurting people, don't answer with another toolbox talk. Push for a guard, an interlock, or a redesign. Training alone fades under pressure.",
      takeaway: "Engineering controls do the heavy lifting. PPE and 'be careful' are the weakest — never the whole plan.",
    },
    {
      id: "ra-21",
      kind: "example",
      heading: "Mistakes that get operators and new techs hurt",
      body: "**Operators moving into maintenance most often:** reach into running machines to clear jams, trust the stop button as 'safe,' and bypass a guard 'just this once.'\n\n**New techs most often:** apply [[LOTO]] but skip verification, forget stored energy (raised axes, caps, air), reset faults without finding the cause, and cave to production pressure instead of stopping.\n\nEvery one of these is on this deck. If you catch yourself doing one, that's the signal to stop.",
      takeaway: "The common thread: skipping the 30 seconds of thinking because you're rushed. That's when it bites.",
    },
    {
      id: "ra-22",
      kind: "interaction",
      heading: "Lesson quiz — the judgment call",
      body: "",
      interaction: choiceMcq(
        "Which situation means you STOP and escalate rather than proceed yourself?",
        [
          "You've locked out, verified zero, and just need to swap a photoeye",
          "The only way to do the job is to defeat a guard while the machine runs",
          "You need to bleed a cylinder and you can watch the gauge hit zero",
          "You're replacing a belt after full isolation and verification",
        ],
        1,
        "Correct. Three of these are normal work you can do safely after isolation. Defeating a guard on a running machine is the line you don't cross — stop and escalate.",
        "Three of these are safe once isolated and verified. The one that requires defeating a guard on a live machine is always a stop-and-escalate."
      ),
    },
    // ── Summary ────────────────────────────────────────────────
    {
      id: "ra-23",
      kind: "summary",
      heading: "Before you touch it — every time",
      body: "• **Hazard** is what can hurt you, **risk** is how bad × how likely, **control** is what you do about it.\n• **Stop button ≠ zero energy.** Assume something's still loaded — air, hydraulic, springs, raised loads, [[VFD]] caps.\n• Scan the **eight hazards**, then run the **Before-Touch checklist** — and never skip **verification**.\n• If the only way in is to **defeat a guard** or **guess** — stop and escalate. That's the professional move.\n• Fix repeat hazards with **engineering controls**, not another reminder.",
      takeaway: "Think for 30 seconds, isolate, verify, then work. That habit is what makes you a maintenance tech.",
    },
  ],
};
