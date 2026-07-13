import type { LessonCardDeck } from "../learningCardTypes";
import { getCuratedLessonAssessment } from "../curatedLessonAssessments";
import { curatedChoiceMcq } from "./deckHelpers";

const curated = getCuratedLessonAssessment("plc-fundamentals", "communication-faults")!;

export const COMMUNICATION_FAULTS_DECK: LessonCardDeck = {
  moduleSlug: "plc-fundamentals",
  lessonSlug: "communication-faults",
  reflection: true, // apprenticeship closeout — scenario in shared/lessonCloseouts.ts (SME-audited)
  title: "Communication Faults: EtherNet/IP & DeviceNet",
  whatYoullLearn: [
    "Diagnose EtherNet/IP faults from link LEDs and I/O tree status.",
    "Separate physical layer problems from IP configuration errors.",
    "Know when comm loss to a PowerFlex is expected to stop the motor.",
  ],
  estimatedMinutes: 14,
  previewCardCount: 2,
  cards: [
        {
      id: "cf-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **HMI**: human-machine interface\n- **VFD**: variable frequency drive\n- **PLC**: programmable logic controller\n- **IP**: Internet Protocol address\n- **EtherNet/IP**: EtherNet/Industrial Protocol",

      takeaway: "These terms come up throughout this lesson.",
    },
{
      id: "cf-01",
      kind: "concept",
      heading: "Two hours down — duplicate [[IP]]",
      body: "Line 4 lost HMI (human-machine interface) tags and the **PowerFlex 525** showed **Comm Loss** every few minutes. Two devices had **192.168.1.30** after a VFD (variable frequency drive) swap — no ladder change. The PLC (programmable logic controller) tech found it with **ping** and the **Stratix 5700** ARP table, not by rewriting motor rungs.",
      takeaway: "Comm faults start at cable, link LED, and unique IP (Internet Protocol address) — not the CPU (central processing unit).",
      visual: {
        type: "callout",
        tone: "field",
        text: "Symptom: intermittent HMI freeze + drive comm fault — suspect duplicate IP or bad crimp.",
      },
    },
    {
      id: "cf-02",
      kind: "concept",
      heading: "[[EtherNet/IP]] on Allen-Bradley plants",
      body: "**EtherNet/IP (EtherNet/Industrial Protocol)** is CIP over standard Ethernet — **explicit** TCP messages for config and **implicit** UDP for fast I/O (input/output) to **1734-AENT** adapters and **PowerFlex** drives. **DeviceNet** is legacy CAN fieldbus — different tools, terminators, and LED patterns. Know which network you are on before opening the wrong diagnostic screen.",
      takeaway: "Green link LED does not mean correct [[IP]] — it only means Layer 1 is up.",
      visual: { type: "diagram", variant: "ethernet-ip-topology" },
    },
    {
      id: "cf-05",
      kind: "interaction",
      heading: "Knowledge check — adapter [[fault]] LED",
      body: "",
      interaction: curatedChoiceMcq(curated.knowledgeChecks[0]),
    },
    {
      id: "cf-03",
      kind: "concept",
      heading: "What the [[I/O]] tree tells you",
      body: "In Studio 5000, a faulted **1734-AENT** shows yellow/red on the module icon. Module properties show **Connection Status**, **Fault Code**, and configured **IP address**. A **Major Fault** on comm loss is the CPU protecting the process — remote [[I/O]] drops to safe state when implicit connections break.",
      takeaway: "[[I/O]] tree [[fault]] code points to adapter, cable, or config — not random [[CPU]] failure.",
    },
    {
      id: "cf-04",
      kind: "example",
      heading: "Implicit messaging to a PowerFlex 525",
      body: "The [[PLC]] sends speed reference every **RPI** (often 10–20 ms) over implicit [[I/O]]. Lose the connection → drive faults **Comm Loss** or drops permissive → motor stops. That is **by design** — running blind without network reference is not safe. Restore Ethernet path before resetting the drive fault.",
      takeaway: "[[VFD]] comm loss stops motion — fix network, then clear drive [[fault]].",
    },
    {
      id: "cf-06",
      kind: "example",
      heading: "[[IP]] conflict — flapping connections",
      body: "Symptom: tags freeze, then recover, then freeze. Cause: two nodes, same [[IP]] on **192.168.1.0/24**. Diagnostic: ping from laptop; watch ARP; disconnect suspect device — ping stabilizes. Fix: assign unique [[IP]] in module config; update runbook; power-cycle adapter after change.",
      takeaway: "Duplicate [[IP]] never heals itself — assign unique address and document it.",
    },
    {
      id: "cf-07",
      kind: "example",
      heading: "Bad patch cord at the switch",
      body: "Symptom: remote [[I/O]] [[fault]] LED flashing; **OK** when wiggled. Cause: failed RJ45 crimp or wrong cable (flat vs stranded patch). Diagnostic: link LED on **Stratix** port; swap known-good cable; check port stats for errors. Fix: replace cable; verify **100 Full** duplex on industrial port.",
      takeaway: "Flashing adapter [[fault]] with good config = physical layer first.",
    },
    {
      id: "cf-08",
      kind: "example",
      heading: "DeviceNet legacy trunk [[fault]]",
      body: "Symptom: random **DeviceNet** node drops on an older line. Cause: weak terminator, low **24 VDC (volts DC)** trunk, or shield grounded at both ends. Diagnostic: meter trunk voltage; verify 121 Ω terminator at ends; compare to **1756-DNB** status LEDs. Different animal than [[EtherNet/IP]] — use DeviceNet tools.",
      takeaway: "DeviceNet troubleshooting is terminators and trunk power — not ping.",
    },
    {
      id: "cf-09",
      kind: "example",
      heading: "STP blocked port after loop",
      body: "Symptom: [[PLC]] reachable from control room but [[HMI]] at line side dead — no module [[fault]] on [[CPU]]. Cause: spanning tree blocked a switch port after an accidental loop. Diagnostic: check **Stratix** port status; look for **Blocking** state; remove loop or enable **DLR** ring correctly.",
      takeaway: "Comm loss without [[PLC]] [[fault]] can be switch topology — not processor hardware.",
    },
    {
      id: "cf-10",
      kind: "interaction",
      heading: "Knowledge check — duplicate [[IP]]",
      body: "",
      interaction: curatedChoiceMcq(curated.lessonQuizzes[0]),
    },
    {
      id: "cf-11",
      kind: "example",
      heading: "Field procedure — [[EtherNet/IP]] comm check",
      body: "1. Note [[fault]] LED on **1734-AENT** or drive. 2. Ping configured [[IP]] from maintenance laptop on same VLAN. 3. In Studio 5000 [[I/O]] tree — module properties → **Connection** tab. 4. Check **Stratix** port link/activity LEDs and error counters. 5. Swap cable before replacing [[CPU]] or adapter.",
      takeaway: "Ping + link LED + [[I/O]] tree status — in that order, every comm call.",
    },
    {
      id: "cf-12",
      kind: "example",
      heading: "Field procedure — after replacing a network module",
      body: "1. Set correct **catalog number** and **IP address** in module properties before expecting [[I/O]]. 2. Download configuration or add module to match project revision. 3. Verify **Electronic Keying** if prompted. 4. Confirm implicit connection **Run** status. 5. Update [[IP]] sticker on panel door — next swap depends on it.",
      takeaway: "Power cycle alone does not configure a new adapter — match project [[IP]] and catalog.",
    },
    {
      id: "cf-13",
      kind: "summary",
      heading: "Fix the wire before the program",
      body: "On comm faults you will check link LED and ping first, verify unique [[IP]] in the [[I/O]] tree, and know that **PowerFlex** comm loss stops the motor on purpose. Document every [[IP]] change on the panel — the next tech at 2am will thank you.",
      takeaway: "Physical layer → [[IP]] config → [[I/O]] tree — never start with ladder edits on comm loss.",
    },
  ],
};
