import type { LessonCardDeck } from "../learningCardTypes";
import { choiceMcq } from "./deckHelpers";

/**
 * Motor Overloads — Level 3/5, built to the Risk Assessment bar.
 * Voice: a 30-year tech teaching an operator why a tripped overload is
 * information, not an inconvenience. Plain English, plant-floor real.
 */
export const OVERLOAD_PROTECTION_DECK: LessonCardDeck = {
  moduleSlug: "motors-controls",
  lessonSlug: "overload-protection",
  reflection: true, // apprenticeship closeout — scenario in shared/lessonCloseouts.ts (SME-audited)
  title: "Overloads: Why Motors Trip (and Why You Don't Just Reset)",
  whatYoullLearn: [
    "Understand what an overload relay protects and how it trips.",
    "Read a trip as information — find the cause before you reset.",
    "Recognize the real causes: bind, bearing, low voltage, lost phase, wrong size.",
    "Reset safely, once you know why it tripped.",
  ],
  estimatedMinutes: 15,
  previewCardCount: 3,
  cards: [
    {
      id: "ol-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **LOTO**: lockout/tagout\n- **FLA**: full-load amps",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "ol-01",
      kind: "concept",
      heading: "They reset it eleven times. Then it caught fire.",
      body: "A pump motor kept tripping its [[overload]] on day shift. The fix everybody used: walk over, push reset, walk away. By afternoon it had been reset about eleven times. Nobody asked *why*.\n\nThe pump was binding on a failing bearing, pulling high current every time it loaded up. The overload was doing its job — protecting the motor. Each reset overrode that protection. Eventually the windings cooked and the motor burned up. A $40 bearing turned into a $2,000 motor and a half-day of downtime.",
      takeaway: "An [[overload]] that keeps tripping is trying to tell you something. Resetting it without asking why is how you kill motors.",
      visual: { type: "callout", tone: "warning", text: "Repeatedly resetting a tripping overload defeats the exact protection that's keeping a motor from burning up." },
    },
    {
      id: "ol-02",
      kind: "concept",
      heading: "What an [[overload]] actually protects",
      body: "A motor [[overload]] relay protects the **motor** from overheating by watching how much current it draws over time. Too much current for too long = too much heat = burned windings. The [[overload]] trips before that happens.\n\nDon't confuse it with a fuse or breaker. Those protect the **wiring** from a dead short — a fast, huge fault. The [[overload]] protects the **motor** from running too hard for too long — a slower, thermal problem. Different jobs, different devices.",
      takeaway: "Overload = protects the motor from heat (too much current, too long). Fuse/breaker = protects the wire from a short.",
    },
    {
      id: "ol-03",
      kind: "interaction",
      heading: "Quick check — what killed the pump motor?",
      body: "",
      interaction: choiceMcq(
        "In the pump story, what actually burned up the motor?",
        [
          "The overload relay was faulty",
          "Repeated resets let it keep running while a bearing bind pulled high current",
          "The motor was just old",
          "The fuse was the wrong size",
        ],
        1,
        "Right. The overload worked perfectly — it kept trying to protect the motor. The resets overrode it and let the binding pump cook the windings. The root cause was mechanical (bearing), never found because nobody looked past the reset button.",
        "The overload wasn't faulty — it was doing its job. The resets let a binding pump keep drawing high current until the windings overheated. The real cause was the bearing."
      ),
    },
    {
      id: "ol-04",
      kind: "concept",
      heading: "The tech mindset: a trip is information",
      body: "This is the mental shift from operator to maintenance tech. An operator sees a trip as 'the machine stopped, un-stop it.' A tech sees a trip as 'the machine is telling me something is wrong — what?'\n\nEvery [[overload]] trip has a cause. Your job isn't to reset it. Your job is to find out *why the motor drew too much current*, fix that, and *then* reset. Reset is the last step, not the first.",
      takeaway: "Operators reset. Techs ask why. Be the one who asks why.",
    },
    {
      id: "ol-05",
      kind: "concept",
      heading: "The real reasons an [[overload]] trips",
      body: "When a motor pulls too much current, it's almost always one of these:\n\n• **Mechanical bind or jam** — the motor's fighting something (seized bearing, jammed load, tight belt).\n• **Failing bearing** — friction climbs, current climbs.\n• **Low voltage** — a motor pulls *more* current when voltage sags to make the same power.\n• **Lost phase (single-phasing)** — a three-phase motor loses one leg and the other two overheat fast.\n• **Overloaded process** — genuinely too much material/load.\n• **Wrong [[overload]] size** — set too low (nuisance trips) or too high (no protection).",
      takeaway: "Bind · bearing · low voltage · lost phase · real [[overload]] · wrong setting. One of these is always behind it.",
    },
    {
      id: "ol-06",
      kind: "example",
      heading: "How to investigate before you reset",
      body: "Work it like a tech, safely:\n\n1. **Look & listen** — after lockout/tagout ([[LOTO]]), turn the shaft by hand. Does it bind, grind, feel rough? Check the belt/coupling.\n2. **Check the load** — is the driven equipment jammed or overloaded?\n3. **Measure the current** — with a clamp meter, compare running amps to the motor's nameplate full-load amps (FLA). High = working too hard.\n4. **Check the voltage** — all three legs present and near rated? A missing or low leg is a big tell.\n5. **Check the [[overload]] setting** — sized to the nameplate FLA?\n\nNow you know why. *Then* reset.",
      takeaway: "Turn the shaft, check the load, clamp the amps, meter the voltage, verify the setting — then reset.",
      visual: { type: "diagram", variant: "motor-starter-chain" },
    },
    {
      id: "ol-07",
      kind: "interaction",
      heading: "Check — first move on a repeat trip",
      body: "",
      interaction: choiceMcq(
        "A conveyor motor has tripped its overload three times this shift. What's your first move?",
        [
          "Reset it again and watch it",
          "Turn the overload setting up so it stops tripping",
          "Lock it out and investigate the cause — check for bind, measure amps and voltage",
          "Swap the motor",
        ],
        2,
        "Correct. Three trips in a shift is the motor shouting at you. Isolate it and find the cause — bind, bearing, low voltage, lost phase. Never turn the setting up to stop trips; that just removes the protection.",
        "Don't reset-and-watch or turn the setting up (that defeats the protection). Lock out and find WHY it's pulling high current — bind, bearing, voltage, or a lost phase."
      ),
    },
    {
      id: "ol-08",
      kind: "concept",
      heading: "Never 'fix' a trip by turning it up",
      body: "The worst thing you can do — and people do it — is raise the [[overload]] setting so the nuisance trips stop. That doesn't fix anything. It just blinds the protection so the motor can overheat unnoticed.\n\nThe [[overload]] should be set to the motor's nameplate FLA, adjusted for service factor per the setup. If it trips at the correct setting, the motor really is drawing too much — that's a real problem to solve, not a setting to raise.",
      takeaway: "Setting the [[overload]] to nameplate FLA is protection. Cranking it up to stop trips is sabotage.",
    },
    // ── Scenarios ──────────────────────────────────────────────
    {
      id: "ol-09",
      kind: "example",
      heading: "Scenario — the slow bearing death",
      body: "A fan motor trips maybe once a day, more often lately. Reset and it runs fine for hours. Classic failing-bearing pattern: friction rises as the bearing degrades, current creeps up, and on a warm afternoon it tips over the [[overload]].\n\n**Play:** [[LOTO]], spin the shaft by hand — you'll likely feel roughness or drag. Clamp the running amps next chance: creeping above nameplate FLA confirms it. Replace the bearing before it seizes and takes the motor (or the shaft) with it.",
      takeaway: "Occasional trips that get more frequent = something wearing out. Catch it before it seizes.",
    },
    {
      id: "ol-10",
      kind: "example",
      heading: "Scenario — single-phasing (lost a leg)",
      body: "A three-phase motor hums, struggles, gets hot, and trips — or won't start and trips fast. One of the three legs is gone: a blown fuse, a loose lug, a bad contact. The motor tries to run on two legs, drawing way too much current on those two.\n\n**Play:** Meter all three legs (L1-L2, L2-L3, L1-L3) — a missing or low leg jumps out. Track down the open: fuse, connection, contactor pole, or upstream. Single-phasing cooks motors fast, so don't keep resetting into it.",
      takeaway: "Hums, struggles, overheats, trips = suspect a lost phase. Meter all three legs.",
      visual: { type: "callout", tone: "field", text: "A three-phase motor running on two legs draws heavy current and overheats in minutes. Find the lost leg before resetting again." },
    },
    {
      id: "ol-11",
      kind: "example",
      heading: "Scenario — low voltage in the afternoon",
      body: "A motor trips reliably in the hot part of the day when the whole plant is loaded and voltage sags. Motors are constant-power: when voltage drops, current rises to compensate — and can nudge past the [[overload]].\n\n**Play:** Measure voltage at the motor under load, especially at peak times. If it's low, the problem isn't the motor or the [[overload]] — it's supply (loading, undersized feeders, a utility issue). That's an escalation, not a reset.",
      takeaway: "Trips that track with plant load and heat often mean low voltage — a supply problem, not a motor problem.",
    },
    {
      id: "ol-12",
      kind: "example",
      heading: "Scenario — the nuisance trip that wasn't",
      body: "A brand-new install trips on startup every time. Everyone calls it a 'nuisance trip' and wants the setting raised. But you check: the [[overload]] was set to a generic default, not this motor's nameplate FLA — it's set too low for this motor.\n\n**Play:** Set the [[overload]] to the actual nameplate FLA for the installed motor. Now it protects correctly and stops nuisance-tripping. 'Nuisance trip' is often just a wrong setting — verify before you blame the relay.",
      takeaway: "Before calling it a nuisance trip, confirm the [[overload]] is sized to THIS motor's nameplate.",
    },
    {
      id: "ol-13",
      kind: "interaction",
      heading: "Scenario check — put it together",
      body: "",
      interaction: choiceMcq(
        "A 480V three-phase motor hums, won't come up to speed, gets hot fast, and trips. Highest-priority thing to check?",
        [
          "Turn up the overload so it stops tripping",
          "Meter all three legs for a lost/low phase before anything else",
          "Reset it a few more times to see if it clears",
          "Replace the overload relay",
        ],
        1,
        "Exactly. Hum + struggle + fast heat + trip is the textbook signature of single-phasing. Meter L1-L2, L2-L3, L1-L3 and find the missing leg. Resetting into single-phasing burns the motor fast.",
        "Those symptoms scream lost phase. Meter all three legs first — don't reset into it and don't touch the setting."
      ),
    },
    {
      id: "ol-14",
      kind: "example",
      heading: "Mistakes that get operators and new techs in trouble",
      body: "**Operators moving into maintenance:** reset and walk away, or call every trip a 'nuisance.'\n\n**New techs:** turn the setting up to stop trips (defeats protection), reset into a single-phasing motor (cooks it), skip clamping the actual amps, and never turn the shaft by hand to feel for a bind.\n\nEvery real [[overload]] trip is a bind, a bearing, low voltage, a lost phase, a real [[overload]], or a wrong setting. Match the trip to a cause before you touch reset.",
      takeaway: "The trap is treating the reset button as the fix. The reset is the last step, never the first.",
    },
    {
      id: "ol-15",
      kind: "interaction",
      heading: "Lesson quiz — the judgment call",
      body: "",
      interaction: choiceMcq(
        "Which action is ALWAYS wrong when a motor keeps tripping its overload?",
        [
          "Locking it out to turn the shaft and check for a bind",
          "Clamping the running current and comparing to nameplate FLA",
          "Raising the overload setting so it stops tripping",
          "Metering all three legs for a lost phase",
        ],
        2,
        "Correct. Three of these are exactly how you find the cause. Raising the setting to stop trips removes the motor's protection and lets it overheat unseen — never do it.",
        "Three of these are good diagnosis. Turning the setting up to stop trips defeats the protection and risks a burned motor — that's the one you never do."
      ),
    },
    {
      id: "ol-16",
      kind: "summary",
      heading: "A trip is a question, not a nuisance",
      body: "• The [[overload]] protects the **motor** from overheating — a fuse/breaker protects the **wire**.\n• A trip means the motor drew too much current. **Find out why before you reset.**\n• Real causes: **bind, bearing, low voltage, lost phase, real [[overload]], wrong setting.**\n• Investigate: turn the shaft, check the load, **clamp the amps**, meter the **three legs**, verify the **setting**.\n• **Never** raise the setting to stop nuisance trips — that removes the protection.",
      takeaway: "Ask why the motor pulled too much current, fix that, then reset. That's the tech's job.",
    },
  ],
};
