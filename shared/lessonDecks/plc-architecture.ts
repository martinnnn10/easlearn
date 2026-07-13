import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("plc-fundamentals", "plc-architecture")!;

export const PLC_ARCHITECTURE_DECK: LessonCardDeck = {
  moduleSlug: "plc-fundamentals",
  lessonSlug: "plc-architecture",
  title: "PLC Architecture & Hardware Components",
  whatYoullLearn: [
    "Map field devices to input and output modules.",
    "Explain the four phases of the PLC scan cycle.",
    "Relate scan time to troubleshooting lag and response.",
  ],
  estimatedMinutes: 12,
  previewCardCount: 2,
  cards: [
    {
      id: "plc-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **PLC**: programmable logic controller — the industrial computer running the machine\n- **CPU**: central processing unit\n- **I/O**: input/output\n- **VDC**: volts DC\n- **HMI**: human-machine interface",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "plc-01",
      kind: "concept",
      heading: "[[SF]] LED on the wrong module",
      body: "A **ControlLogix 5580** on Packaging Line 2 showed a solid **SF (Status Fault)** LED on slot 3 while the belt would not start. Every **I/O (input/output)** module has an SF LED — when it turns solid red, that specific card has a problem. The night tech assumed the **CPU (central processing unit)** was bad and swapped it — but the fault stayed red on the **1756-IB16** input card. Root cause: open **24 VDC (volts DC)** common on that input card, not a dead processor. After this lesson you check module status and field power before you touch the [[CPU]].",
      takeaway: "A solid SF (Status Fault) LED points to that specific card's slot — not the [[CPU]]. Check field power first.",
    },
    {
      id: "plc-02",
      kind: "concept",
      heading: "Five core hardware blocks",
      body: "**Power supply** feeds 24 [[VDC]] internals. **CPU** executes the program. **Input cards** read field devices. **Output cards** drive loads. **Communication** links **HMIs (human-machine interfaces)**, **PowerFlex** drives, and **1734-AENT** remote [[I/O]].",
      takeaway: "Field wiring lands on input cards and output cards — not directly on the [[CPU]].",
    },
    {
      id: "plc-03",
      kind: "interaction",
      heading: "Knowledge check — where inputs are read",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "plc-04",
      kind: "concept",
      heading: "The scan cycle loop",
      body: "Each scan: read all inputs into the **input image table**, execute ladder rungs top-to-bottom using that snapshot, write outputs from the **output image table**, then housekeeping and communications. In **Studio 5000** online monitor, bit states update once per scan — typically 2–10 ms on **CompactLogix**.",
      takeaway: "Logic never sees live inputs mid-rung — only the image table from this scan.",
      visual: { type: "diagram", variant: "scan-cycle" },
    },
    {
      id: "plc-05",
      kind: "example",
      heading: "Field devices to [[I/O]] types on Line 2",
      body: "On a **Allen-Bradley** panel: pushbuttons and **Turck** proxes → discrete inputs. **Rosemount** 4–20 mA transmitters → analog input cards. Contactor coils → digital output coils. **PowerFlex 525** speed reference → network command or analog output.",
      takeaway: "Match device signal type to the correct input card or output card.",
    },
    {
      id: "plc-06",
      kind: "example",
      heading: "Scan time in milliseconds",
      body: "**Micro850** might scan in 5–20 ms. **CompactLogix 5380** often 2–10 ms. **ControlLogix** 1–5 ms on large programs. A 10 ms scan means an input change may not appear in logic for up to 10 ms — not instant.",
      takeaway: "You will see one-scan delay after an input changes — that is normal.",
    },
    {
      id: "plc-07",
      kind: "concept",
      heading: "Tags vs fixed addresses",
      body: "Modern Logix uses named tags (BOOL, REAL, DINT). Older **SLC 500** / **PLC-5** use **I:1/5**, **O:2/0**, **T4:0**. Prints and online monitor must match the platform you are standing in front of.",
      takeaway: "In Studio 5000 this tag shows the same bit as the print address — verify both.",
    },
    {
      id: "plc-08",
      kind: "example",
      heading: "Module [[SF]] — symptom to fix",
      body: "Symptom: solid **SF (Status Fault)** LED on **1756-IB16**, inputs dead. Likely cause: missing field common or miswired **24 VDC**. Diagnostic: module properties in [[I/O]] tree → compare field voltage at terminal to spec. Fix: restore common, reseat module — swap card only after power and wiring verified.",
      takeaway: "Most input card faults are power, wiring, or configuration — not failed silicon.",
      visual: { type: "callout", tone: "tip", text: "Verify field 24 VDC common before replacing an input card." },
    },
    {
      id: "plc-09",
      kind: "interaction",
      heading: "Knowledge check — scan cycle troubleshooting",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[2]),
    },
    {
      id: "plc-10",
      kind: "example",
      heading: "Field procedure — verify a faulted input card",
      body: "1. Open **Studio 5000** → [[I/O]] tree → faulted module. 2. Read module status and [[fault]] code. 3. Meter **24 VDC** at field power feed for that card. 4. Check one input terminal with device made and released. 5. Document findings before ordering a replacement **1756-IB16**.",
      takeaway: "Module diagnostics plus field voltage — before any [[CPU]] or card swap.",
    },
    {
      id: "plc-11",
      kind: "example",
      heading: "Field procedure — trace one [[I/O]] point",
      body: "1. Pick one input from the print (**I:1/5** photoeye). 2. Online monitor that bit while toggling the field device. 3. Compare LED on the input card to monitor state. 4. If they disagree, meter at the terminal strip — not the program first.",
      takeaway: "Input card LED and monitor must agree before you edit ladder logic.",
    },
    {
      id: "plc-12",
      kind: "summary",
      heading: "Architecture before ladder edits",
      body: "• You will check **SF (Status Fault)** LEDs on the faulted input card, not swap the [[CPU]] first.\n• You will read the input image table knowing outputs update once per scan.\n• You will meter **24 VDC** field power before condemning an [[I/O]] module.\n• You will match print addresses to **Studio 5000** tags before forcing anything.",
      takeaway: "Read inputs → solve logic → write outputs — every scan, same order.",
    },
  ],
};
