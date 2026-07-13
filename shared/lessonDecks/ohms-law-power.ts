import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("electrical-fundamentals", "ohms-law-power")!;

export const OHMS_LAW_POWER_DECK: LessonCardDeck = {
  moduleSlug: "electrical-fundamentals",
  lessonSlug: "ohms-law-power",
  title: "Ohm's Law & Power",
  whatYoullLearn: [
    "Rearrange V = I × R to solve for whatever the meter cannot read directly.",
    "Use P = I² × R to explain why a loose connection runs hot.",
    "Read voltage-present / no-current as an open path, not a dead supply.",
  ],
  estimatedMinutes: 11,
  previewCardCount: 2,
  cards: [
    {
      id: "ohm-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **V**: volts — electrical pressure\n- **A**: amps — current, the flow\n- **Ω**: ohms — resistance, the opposition\n- **OL**: on a meter, over-limit / open — more resistance than the range can read\n- **FLA**: full-load amps — a motor's nameplate running current\n- **LOTO**: lockout/tagout — the zero-energy safety procedure before you touch a conductor",
      takeaway: "Voltage pushes, current flows, resistance opposes — that is the whole game.",
    },
    {
      id: "ohm-01",
      kind: "concept",
      heading: "Voltage is present, so why won't it run?",
      body: "A **480 V** feeder motor is commanded to run. You meter 478 V right at the terminals — nominal. But the [[clamp meter]] reads 0 A and the machine sits dead. New techs stop here: \"voltage's good, must be the motor.\" [[Ohm's Law]] tells you more. Voltage with no current means the path is broken somewhere — [[resistance]] has gone effectively infinite.",
      takeaway: "Good voltage plus zero current is not \"power is fine\" — it is an open circuit.",
    },
    {
      id: "ohm-02",
      kind: "concept",
      heading: "One relationship, three ways to solve it",
      body: "[[Ohm's Law]] is **V = I × R**. Cover the value you want and read the rest: **I = V ÷ R**, **R = V ÷ I**. Power rides on top of it — **P = V × I**, and the two you will actually use in the field, **P = I² × R** (heat in a connection) and **P = V² ÷ R** (heat in a load). Learn to rearrange, not memorize four equations.",
      takeaway: "If you know any two of V, I, R, you can solve the third — and then the power.",
      visual: { type: "diagram", variant: "ohms-law-wheel" },
    },
    {
      id: "ohm-03",
      kind: "interaction",
      heading: "Knowledge check — voltage but no current",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[1]),
    },
    {
      id: "ohm-04",
      kind: "example",
      heading: "Why a loose lug cooks itself",
      body: "A termination should measure a few milliohms. Let one work loose to 0.5 Ω while it carries 15 A and the heat is **P = I² × R = 15² × 0.5 ≈ 112 W** — concentrated at one lug the size of your thumbnail. That is why a loose connection discolors, then chars the insulation, long before a breaker sees anything wrong. Current squared is the reason a small resistance becomes a real problem under load.",
      takeaway: "Heat at a connection climbs with the *square* of current — small [[resistance]], big consequences.",
      visual: { type: "callout", tone: "warning", text: "Discolored lugs and baked insulation are I²R heat — re-torque or replace before it opens under load." },
    },
    {
      id: "ohm-05",
      kind: "concept",
      heading: "Which form for which unknown",
      body: "Chasing an open or a bad joint, you know voltage and current but need [[resistance]]: **R = V ÷ I**. Sizing expected heat in an element, you know voltage and resistance: **P = V² ÷ R**. Predicting draw before you clamp, you know voltage and resistance: **I = V ÷ R**. The skill is picking the rearrangement that uses the two values you can actually measure.",
      takeaway: "Measure the two you can reach, solve for the one you can't.",
    },
    {
      id: "ohm-06",
      kind: "interaction",
      heading: "Knowledge check — heat at a bad termination",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "ohm-07",
      kind: "example",
      heading: "A heater element proves the math",
      body: "A 240 V heater element measures 20 Ω cold. Expected power is **P = V² ÷ R = 240² ÷ 20 = 2,880 W** — kilowatt-class heat from a part that looks like a coil of wire. Read 40 Ω instead and the element has degraded: half the power, a cold zone, a process that runs out of spec. The nameplate wattage and your ohmmeter should agree.",
      takeaway: "A resistive load's wattage is fixed by V² ÷ R — a rising [[resistance]] means falling output.",
    },
    {
      id: "ohm-08",
      kind: "example",
      heading: "Field procedure — find the open with Ohm's Law",
      body: "1. Confirm source voltage at the line side of the starter. 2. With the contactor closed, meter line-side to motor terminals — full [[voltage drop]] across a closed contactor means an open in that path. 3. De-energize, apply [[LOTO]], then meter [[resistance]] end to end. 4. **OL** (over-limit) on the ohmmeter across a winding or a run of wire is your open. 5. Fix the break — do not raise the supply voltage chasing current that cannot flow.",
      takeaway: "Voltage present, 0 A, and an OL resistance reading triangulate the open every time.",
    },
    {
      id: "ohm-09",
      kind: "example",
      heading: "Three-phase power needs the √3 factor",
      body: "For a [[three-phase]] load, the volts-times-amps product needs a **1.73 (√3)** factor. Work a 480 V branch pulling 22.5 A: **480 × 22.5 × 1.73 ≈ 18.7 kVA** of **apparent power** (kilovolt-amps) — the total the branch draws. **Real power** in kW is that apparent power times the [[power factor]], so a motor near 0.85 works out around **15.9 kW**. Either way, 22.5 A sustained on a 20 A device is an overload — judge it by current against the breaker and the motor **FLA**, not by the voltage.",
      takeaway: "On three-phase use the 1.73 factor — real kW is apparent kVA × power factor — and judge overload by current against the breaker and FLA.",
      visual: { type: "callout", tone: "tip", text: "Sustained current above a device's rating is an overload even before it trips — clamp and compare to the breaker and motor FLA." },
    },
    {
      id: "ohm-10",
      kind: "interaction",
      heading: "Knowledge check — reading a three-phase branch",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "ohm-11",
      kind: "summary",
      heading: "Ohm's Law is your first move, not your last resort",
      body: "• You will read voltage-present / no-current as an open path and go find the break.\n• You will rearrange **V = I × R** to solve for whatever the meter cannot reach.\n• You will use **P = I² × R** to explain a hot lug and **P = V² ÷ R** to check a heating element.\n• You will judge a [[three-phase]] branch by current against its rating and FLA, using the 1.73 factor.",
      takeaway: "Two knowns, one unknown, one equation — before you condemn a single part.",
    },
  ],
};
