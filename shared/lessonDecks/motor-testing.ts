import type { LessonCardDeck } from "../learningCardTypes";
import { choiceMcq } from "./deckHelpers";

/**
 * Motor Testing — "is the motor actually bad?" built to the Risk Assessment bar.
 * Voice: a 30-year tech teaching an operator the simple tests that prove a motor
 * good or bad before anyone hangs a new one. Includes a diagram (pinned global rule).
 */
export const MOTOR_TESTING_DECK: LessonCardDeck = {
  moduleSlug: "motors-controls",
  lessonSlug: "motor-testing",
  reflection: true, // apprenticeship closeout — scenario in shared/lessonCloseouts.ts (SME-audited)
  title: "Motor Testing: Is the Motor Actually Bad?",
  whatYoullLearn: [
    "Prove a motor good or bad before you spend a day changing it.",
    "Turn the shaft and read winding resistance to catch the obvious faults.",
    "Understand what a megger (insulation) test tells you — and the safety rules.",
    "Separate a bad motor from a bad starter, bad power, or a jammed load.",
  ],
  estimatedMinutes: 15,
  previewCardCount: 3,
  cards: [
    {
      id: "mt-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **LOTO**: lockout/tagout\n- **FLA**: full load amps\n- **Megger**: insulation resistance tester",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "mt-01",
      kind: "concept",
      heading: "A day to change a motor that was fine",
      body: "A pump 'motor' was declared dead. A crew spent most of a shift pulling it, hanging a new one, and re-coupling — hard, dirty work. The new motor did exactly the same thing: hummed and tripped.\n\nThe motor was never bad. The pump was **hydraulically locked** — jammed solid — so any motor bolted to it would stall. Ten minutes of simple testing (turn the shaft, check the load) would have saved a day of backbreaking work on the wrong part. This lesson is those ten minutes.",
      takeaway: "Prove the motor is actually bad before you change it. Swapping a good motor onto a bad load just wastes a shift.",
      visual: { type: "callout", tone: "field", text: "Changing a motor is a day of hard work. Ten minutes of testing first tells you whether it's even the right part." },
    },
    {
      id: "mt-02",
      kind: "concept",
      heading: "Rule out everything else first",
      body: "A motor that 'won't run' is usually **not** the motor. Before you condemn it, confirm the easy stuff (from the starter and power lessons):\n\n• **Power** — all three legs of voltage actually reaching the motor terminals?\n• **Starter** — contactor pulling in, contacts passing all three legs?\n• **The load** — is the driven equipment (pump, gearbox, conveyor) jammed or seized?\n\nOnly when power is good, the starter is good, and the load turns freely does the motor itself become the suspect. Most 'bad motors' are innocent.",
      takeaway: "Good power + good starter + a load that turns freely — only then is the motor the suspect.",
    },
    {
      id: "mt-03",
      kind: "interaction",
      heading: "Quick check — the wasted day",
      body: "",
      interaction: choiceMcq(
        "In the opening story, why did changing the motor not fix anything?",
        [
          "The new motor was also defective",
          "The motor was never the problem — the pump was hydraulically locked (jammed), so any motor would stall",
          "The power was too high",
          "The starter was wired wrong",
        ],
        1,
        "Right. The load was seized, so a brand-new motor stalled the same way. Turning the shaft by hand would have revealed the jam in seconds. Always prove the load turns freely before blaming the motor.",
        "The load was jammed, so any motor bolted to it would stall. The motor was fine. Ten minutes checking the load would have saved the whole job."
      ),
    },
    {
      id: "mt-04",
      kind: "example",
      heading: "Test 1 — turn the shaft by hand",
      body: "The simplest, most-skipped test. After **lockout/tagout ([[LOTO]])** and verifying zero energy:\n\n• **Uncouple** the motor from the load if you can (or at least know you're feeling both together).\n• **Turn the shaft by hand.** A healthy motor turns smoothly with a little cogging. Feel for: a hard bind or seizure (bad bearing or locked load), grinding/roughness (failing bearing), or rubbing.\n\nIf it won't turn or feels rough, you've found a mechanical fault before you ever touch a meter. If the load side is what's stuck, the motor's fine.",
      takeaway: "Turn the shaft first. Binds and roughness are bearings or a locked load — a mechanical problem, not a winding problem.",
      visual: { type: "diagram", variant: "motor-starter-chain" },
    },
    {
      id: "mt-05",
      kind: "example",
      heading: "Test 2 — winding resistance (are the coils intact?)",
      body: "With the motor de-energized and disconnected, meter the **resistance of the windings** with your ohmmeter (on a three-phase motor, between the leads: T1-T2, T2-T3, T1-T3).\n\n• **All three readings roughly equal and low** (a few ohms, per the motor) → windings look balanced and intact.\n• **One reading much higher or infinite (open)** → an open winding — that leg is broken.\n• **One reading much lower / near zero, or very unbalanced** → a shorted or damaged winding.\n\nBig imbalance between the three legs is a classic sign of winding trouble.",
      takeaway: "Three winding readings should be roughly equal and low. Open (infinite) = broken winding; badly unbalanced = shorted/damaged.",
    },
    {
      id: "mt-06",
      kind: "interaction",
      heading: "Check — reading the windings",
      body: "",
      interaction: choiceMcq(
        "You ohm a three-phase motor's windings: T1-T2 = 2.1Ω, T2-T3 = 2.2Ω, T1-T3 = infinite (open). What does that tell you?",
        [
          "The motor is fine",
          "There's an open winding on the leg shared by T1-T3 — a broken winding, the motor is bad",
          "The megger is required to know anything",
          "The power supply is bad",
        ],
        1,
        "Correct. Two legs read normal and balanced, but T1-T3 is open. That's a broken (open) winding — the motor is bad. An open winding will make the motor hum, single-phase, and trip. You've proven it with a simple resistance check.",
        "Two good, balanced readings and one open (infinite) = an open winding. That's a genuinely bad motor. No megger needed to see a dead-open winding."
      ),
    },
    {
      id: "mt-07",
      kind: "concept",
      heading: "Test 3 — the megger (insulation to ground)",
      body: "Winding resistance checks the coils to each other; a **megger** (insulation resistance tester) checks the windings **to ground** — has the insulation broken down so the motor is leaking to the frame?\n\n• It applies a high test voltage (e.g., 500–1000V) between the windings and the motor frame and reads the resistance — you want **very high** (megohms). Low resistance = insulation breaking down (moisture, age, contamination, a ground [[fault]]).\n• A motor that trips on ground [[fault]] or keeps popping breakers often meggers low.\n\n**Safety:** a megger puts out high voltage. Motor fully disconnected and de-energized, know the procedure, and discharge the windings after. If you're not trained on it, get someone who is.",
      takeaway: "Megger tests insulation to ground — want megohms. Low = insulation failure. It's high-voltage: disconnect, know the procedure, discharge after.",
    },
    {
      id: "mt-08",
      kind: "example",
      heading: "Test 4 — feel, listen, smell (and current)",
      body: "Your senses catch a lot, and a clamp meter finishes the picture:\n\n• **Feel** — a motor running much hotter than normal is overloaded, single-phasing, or failing.\n• **Listen** — growling/grinding = bearings; a loud hum without turning = single-phasing or locked rotor.\n• **Smell** — that sharp 'cooked' smell is burned insulation. A motor that smells burnt usually is.\n• **Clamp the amps** — running well above nameplate full load amps (FLA) (or badly unbalanced between legs) confirms it's working too hard or has a winding/phase problem.",
      takeaway: "Hot, growling, humming-without-turning, or a burnt smell all point at the motor. Clamp the amps to confirm.",
    },
    {
      id: "mt-09",
      kind: "example",
      heading: "Scenario — hums, won't turn, trips",
      body: "A motor just hums, doesn't come up to speed, and trips. Two prime suspects: an **open winding / lost phase** (electrical) or a **locked rotor / jammed load** (mechanical).\n\n**Play:** [[LOTO]], turn the shaft — locked or rough? That's mechanical (bearing or load). Turns free? Then ohm the windings and meter all three legs of incoming power — an open winding or a lost phase makes a motor hum and stall. Two tests (turn it, ohm it) separate mechanical from electrical fast.",
      takeaway: "Hums-and-stalls = either a locked rotor/load or an open winding/lost phase. Turn the shaft and ohm the windings to tell which.",
    },
    {
      id: "mt-10",
      kind: "example",
      heading: "Mistakes that cost operators and new techs",
      body: "**Operators moving into maintenance:** condemning a motor without any test, and skipping the free 'turn the shaft' check.\n\n**New techs:** changing a motor before ruling out power, starter, and a jammed load; meggering a motor while it's still connected or without the safety procedure; and reading one winding leg instead of comparing all three.\n\nA motor change is a full day of hard work. Ten minutes of testing — turn it, ohm it, megger it, clamp it — tells you if it's even the right part.",
      takeaway: "Never change a motor on a hunch. Turn it, ohm it, megger it, clamp it — prove it's bad first.",
    },
    {
      id: "mt-11",
      kind: "interaction",
      heading: "Lesson quiz — before you condemn it",
      body: "",
      interaction: choiceMcq(
        "A motor won't run. What's the cheapest, fastest test to do FIRST before deciding it's bad?",
        [
          "Order a replacement motor",
          "After LOTO, turn the shaft by hand and confirm the load turns freely",
          "Megger it while it's still wired up",
          "Turn up the overload",
        ],
        1,
        "Right. Turning the shaft by hand (after LOTO) instantly catches a bad bearing or a jammed load — the causes that make a good motor look dead. It's free, takes seconds, and saves you from changing a motor that's fine.",
        "Turn the shaft by hand first (after LOTO). It catches bearing and locked-load faults in seconds — the things that make a good motor stall. Don't order parts or megger it live."
      ),
    },
    {
      id: "mt-12",
      kind: "summary",
      heading: "Prove it before you pull it",
      body: "• A motor that 'won't run' is usually **not the motor** — rule out power, starter, and a jammed load first.\n• **Turn the shaft** (after [[LOTO]]): binds/roughness = bearings or locked load, not windings.\n• **Ohm the windings**: three legs roughly equal and low; open = broken winding, big imbalance = shorted.\n• **Megger** checks insulation to ground (want megohms) — high voltage, follow the procedure, discharge after.\n• **Feel/listen/smell + clamp the amps** to confirm heat, bearings, single-phasing, or burnt insulation.",
      takeaway: "Turn it, ohm it, megger it, clamp it. Ten minutes of testing beats a day of changing the wrong part.",
    },
  ],
};
