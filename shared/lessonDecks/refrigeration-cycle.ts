import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("hvac-fundamentals", "refrigeration-cycle")!;

export const REFRIGERATION_CYCLE_DECK: LessonCardDeck = {
  moduleSlug: "hvac-fundamentals",
  lessonSlug: "refrigeration-cycle",
  title: "The Refrigeration Cycle",
  whatYoullLearn: [
    "Trace heat through compressor, condenser, expansion device, and evaporator.",
    "Use superheat and subcooling readings to narrow HVAC faults.",
    "Connect pressure-temperature charts to field diagnostics.",
  ],
  estimatedMinutes: 12,
  previewCardCount: 2,
  cards: [
    {
      id: "ref-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **Refrigerant**: the fluid that moves heat through the system.\n- **Head pressure**: the high-side pressure leaving the compressor and moving into the condenser.\n- **Superheat**: how much hotter the suction vapor is than its boiling temperature at that pressure.\n- **Subcooling**: how much cooler the liquid refrigerant is than its condensing temperature.\n- **Condenser coil**: the coil that dumps heat to the outdoor air.",
      takeaway: "These terms come up throughout this lesson.",
    },
    {
      id: "ref-01",
      kind: "concept",
      heading: "Walk-in warmer — tech added refrigerant anyway",
      body: "A **Copeland** walk-in crept from **38°F to 45°F** over two days. The tech added **R-410A** without gauges. Root cause: dirty **condenser coil** — high head, normal superheat pattern wrong for low charge. After this lesson you read superheat **and** subcooling before touching the tank.",
      takeaway: "Wrong charge guess wastes refrigerant — readings first, tank second.",
      visual: {
        type: "callout",
        tone: "field",
        text: "Operator: “Box warming up — compressor never stops.”",
      },
    },
    {
      id: "ref-02",
      kind: "concept",
      heading: "The four essential components",
      body: "**[[Compressor]]** pumps [[refrigerant]] and raises pressure. **[[Condenser]]** rejects heat outdoors (gas → liquid). **Expansion device** drops pressure (**[[TXV|thermostatic expansion valve]]**, **[[EEV|electronic expansion valve]]**, or orifice). **[[Evaporator]]** absorbs space heat (liquid → gas).",
      takeaway: "Name the state change at each component before chasing electrical faults.",
      visual: { type: "diagram", variant: "refrigeration-cycle" },
    },
    {
      id: "ref-03",
      kind: "interaction",
      heading: "Knowledge check — evaporator state change",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "ref-04",
      kind: "example",
      heading: "On a rooftop unit, high head pressure",
      body: "Symptom: poor cooling, high discharge pressure. Cause: blocked **condenser** airflow or overcharge. Diagnostic: clean coil, verify fan, read **subcooling**. Fix: airflow first — not compressor swap.",
      takeaway: "High head often starts at condenser airflow — not a bad compressor guess.",
    },
    {
      id: "ref-05",
      kind: "concept",
      heading: "Superheat at the suction line",
      body: "**[[Superheat]]** = suction gas temperature minus [[saturation temperature]] at that pressure. **[[TXV]]** systems target roughly **10–15°F** superheat. Near **0°F** risks liquid at the compressor; above **30°F** suggests low charge or restricted flow.",
      takeaway: "On your gauges, superheat protects the compressor from liquid slugging.",
    },
    {
      id: "ref-06",
      kind: "concept",
      heading: "Subcooling at the liquid line",
      body: "**[[Subcooling]]** = [[saturation temperature]] at condenser pressure minus liquid line temperature. Normal range is often **10–15°F**. Low subcooling hints at low charge; high subcooling can mean overcharge or restriction.",
      takeaway: "Subcooling confirms liquid reaches the expansion device.",
    },
    {
      id: "ref-07",
      kind: "example",
      heading: "Low charge signature",
      body: "Symptom: warm box, long run times. Cause: leak or undercharge. Diagnostic: **high superheat** + **low subcooling** together. Fix: find leak, weigh charge — do not add by guess.",
      takeaway: "High superheat with low subcooling together point to charge — not one gauge alone.",
    },
    {
      id: "ref-08",
      kind: "example",
      heading: "R-410A pressure-temperature in the field",
      body: "Match manifold gauge readings to saturation temperature before adding or recovering refrigerant. Use the **pressure-temperature (P-T) table** on the unit — low-side blue band, high-side red band.",
      takeaway: "Pressure-temperature relationship is your primary field tool.",
      visual: { type: "diagram", variant: "refrigeration-pt-table" },
    },
    {
      id: "ref-09",
      kind: "interaction",
      heading: "Knowledge check — poor cooling pattern",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "ref-10",
      kind: "example",
      heading: "Field procedure — gauge setup and first reads",
      body: "1. Connect manifold to suction and discharge service ports. 2. Read suction and head pressure. 3. Calculate **superheat** at evaporator outlet. 4. Calculate **subcooling** at liquid line. 5. Compare both to expected range before charging.",
      takeaway: "Superheat and subcooling together — every call, every time.",
    },
    {
      id: "ref-11",
      kind: "example",
      heading: "Field procedure — airflow before charge",
      body: "1. Confirm thermostat calling. 2. Verify evaporator and condenser airflow — filters, coils, fan amps. 3. Then read pressures and superheat/subcooling. 4. Many callbacks end at dirty condenser — not low charge.",
      takeaway: "Airflow checks first — charge changes last.",
    },
    {
      id: "ref-12",
      kind: "summary",
      heading: "Cycle diagnostics in your toolkit",
      body: "• You will read **superheat and subcooling together** before adding **R-410A**.\n• You will clean condenser airflow before condemning a **Copeland** compressor.\n• You will use the **P-T table** with manifold gauges — not guess from box temperature alone.\n• You will treat **2°F superheat** as flooding risk — not “perfect charge.”",
      takeaway: "Heat moves out at the condenser; heat moves in at the evaporator — readings prove which side failed.",
    },
  ],
};
