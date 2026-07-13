import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("electrical-fundamentals", "ac-dc-theory")!;

export const AC_DC_THEORY_DECK: LessonCardDeck = {
  moduleSlug: "electrical-fundamentals",
  lessonSlug: "ac-dc-theory",
  title: "AC & DC Theory",
  whatYoullLearn: [
    "Read a meter's AC value as RMS and know the DC bus charges to the peak.",
    "Expect 24 V DC with fixed polarity on control, 480 V AC on power.",
    "Use a true-RMS meter on a drive output — a standard meter reads it low.",
  ],
  estimatedMinutes: 12,
  previewCardCount: 2,
  cards: [
    {
      id: "acd-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **AC**: alternating current — reverses direction many times a second\n- **DC**: direct current — flows one way at a steady level\n- **VFD**: variable frequency drive — converts AC to DC and back to control motor speed\n- **PLC**: programmable logic controller — the industrial computer running the machine\n- **I/O**: input/output — the PLC's field signals\n- **RMS**: root-mean-square — the AC value your meter shows and the DC-equivalent heating value",
      takeaway: "AC alternates and powers motors; DC is steady and runs control.",
    },
    {
      id: "acd-01",
      kind: "concept",
      heading: "Two voltages you meet every shift",
      body: "Walk any panel and you meet both. **480 V AC** three-phase drives the motors. **24 V DC** runs the [[PLC]] [[I/O]], the safety relays, and the sensors — steady, low, with a defined polarity that decides sinking versus sourcing. Confuse which is which — or which meter mode reads which — and every downstream measurement is suspect.",
      takeaway: "Power is AC and high; control is DC and low — and they demand different meter modes.",
    },
    {
      id: "acd-02",
      kind: "concept",
      heading: "Alternating versus steady",
      body: "**AC** rises and falls and reverses — its meter value is the [[RMS]], the steady-DC-equivalent for heating. Its [[peak voltage]] is higher: **peak = 1.414 × RMS**. **DC** holds a flat level at fixed polarity. This one fact drives a lot of field surprises: a [[rectifier]] charges a capacitor to the *peak*, so 480 V AC in becomes a [[DC bus]] near 679 V.",
      takeaway: "A meter shows AC as RMS; capacitors and DC buses charge to the higher peak.",
      visual: { type: "diagram", variant: "ac-dc-waveform" },
    },
    {
      id: "acd-03",
      kind: "interaction",
      heading: "Knowledge check — the drive's DC bus",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "acd-04",
      kind: "example",
      heading: "Control power has a polarity",
      body: "The 24 V DC that runs a [[PLC]] input card is not just \"low voltage\" — it has a **+** and a **−**, and that polarity decides whether a card sinks or sources. Land a sourcing sensor on a sinking input, or reverse the supply leads, and a perfectly good device reads dead. AC has no fixed polarity; DC control does, and the wiring has to respect it.",
      takeaway: "On DC control, polarity is part of the circuit — reversed leads look like a failed device.",
    },
    {
      id: "acd-05",
      kind: "concept",
      heading: "Why RMS and peak both matter",
      body: "[[RMS]] is the number that does work — it is why a meter and a nameplate agree on 480 V. [[peak voltage]] is the number that stresses insulation and charges the [[DC bus]]. A drive's bus sitting near 679 V from a 480 V line is not a fault; it is 1.414 × RMS behaving exactly as designed. Knowing both keeps you from \"fixing\" a healthy bus.",
      takeaway: "RMS is the working value; peak is the stress-and-storage value — both are normal.",
    },
    {
      id: "acd-06",
      kind: "interaction",
      heading: "Knowledge check — control voltage",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[1]),
    },
    {
      id: "acd-07",
      kind: "example",
      heading: "The meter mode has to match the waveform",
      body: "Put a meter on V AC across a 24 V DC sensor loop and the AC mode averages the steady DC toward a misleading number — wrong mode, wrong reading. Worse, probe a [[VFD]] (variable frequency drive) output with an ordinary meter and it usually reads low or erratic, because the output is [[PWM]] (pulse-width modulation) — chopped pulses, not a clean sine. Use a [[true RMS]], inverter-rated meter, or trust the drive keypad.",
      takeaway: "Match the mode to the waveform — and a PWM drive output needs a true-RMS meter.",
    },
    {
      id: "acd-08",
      kind: "example",
      heading: "Three-phase, 60 Hz, and rotation",
      body: "North American plant power is [[three-phase]], 60 Hz, typically 480 V (with 208/120 V systems for lighter loads). One handy consequence: swapping any two of the three phases reverses a motor's rotation — the phase sequence sets the direction of the rotating field. It does not change the voltage, the frequency, or make the motor single-phase; it just spins it the other way.",
      takeaway: "Swap two phases to reverse rotation — voltage and frequency stay put.",
    },
    {
      id: "acd-09",
      kind: "interaction",
      heading: "Knowledge check — reading a drive output",
      body: "",
      // lessonQuizzes[3] is the PWM / VFD-output item — deliberately paired with the acd-07 PWM card.
      interaction: curatedChoiceMcq(curated.lessonQuizzes[3]),
    },
    {
      id: "acd-10",
      kind: "example",
      heading: "Field procedure — checking a DC bus",
      body: "1. On a [[VFD]], find the DC bus test points in the manual — never guess terminals. 2. Meter on V DC, expect roughly 1.414 × the incoming AC line RMS. 3. A 480 V line reading near 679 V DC is healthy, not a fault. 4. A bus far below that points at a [[rectifier]] or pre-charge problem. 5. Remember the bus holds a charge after power-off — verify it has bled down before you reach in.",
      takeaway: "Compare the DC bus to 1.414 × line RMS — and confirm it discharged before touching it.",
      visual: { type: "callout", tone: "warning", text: "A VFD DC bus stays charged after power-off — verify it has bled to a safe level before servicing." },
    },
    {
      id: "acd-11",
      kind: "summary",
      heading: "Know the waveform, trust the reading",
      body: "• You will read a meter's AC number as [[RMS]] and expect the [[DC bus]] at 1.414 × that.\n• You will treat 24 V DC control as polarity-sensitive, 480 V AC power as not.\n• You will reach for a [[true RMS]] meter on a [[PWM]] drive output.\n• You will reverse a motor by swapping two phases, knowing voltage and frequency do not change.",
      takeaway: "The waveform decides the meter mode, the expected value, and the fix.",
    },
  ],
};
