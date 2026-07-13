# Symbol & Device QA — context accuracy

Symbols are judged by whether a US controls/maintenance tech accepts them **in their context**. US standards only: NEMA / JIC / NFPA 79 (control), IEEE 315 / ANSI Y32.2 (semiconductor), ANSI/ISA 5.1 (P&ID). No IEC framing in the UI.

## The rule that governs the Machine Twin

**Machine Twin views must use physical / pictorial device representations.**
**Ladder, print, and Standards Library views use schematic symbols.**
**A physical device drawn as a contact fails QA.**

| View | What it shows | Representation |
|---|---|---|
| **Machine Twin** (`ConveyorMachineView` → `ConveyorPhysicalDevices.tsx`) | What the machine/devices look like on the floor, with live state | **Physical device icons** — motor block, red mushroom E-stop, guard door, overload relay, photo-eye, stack light |
| **Ladder** (`ConveyorLadderPanel` → `ConveyorLadderSymbol.tsx`) | How the control circuit is wired | **Schematic symbols** — NO/NC contacts, coils, timers |
| **Standards Library** (`ElectricalStandardsLibrary` / registry) | Reference for each electrical symbol | **Schematic device symbols** (motor circle-M, overload heater, limit switch, etc.) |

## Device ↔ context mapping (must never be conflated)

| Tag | Machine Twin (physical) | Ladder / print (schematic) |
|---|---|---|
| **M1** | Motor / load (motor block, DRIVE) — **never a contact** | `M1 AUX` / seal-in NC/NO contact, clearly labeled as the aux contact |
| **ES1** | Red mushroom E-stop device | NC contact in the control/safety string |
| **GS1** | Guard door + interlock switch | NC interlock contact |
| **OL1** | Overload relay / starter protection block | NC overload contact (95–96) |

## History
- **M1 as a contact** (contactor pole) in the twin → **rejected**. A motor is a load, not a contact.
- Interim: safety devices drawn as distinct schematic contacts in the twin → **still wrong**. The twin is a *physical* view; schematic contacts are the wrong medium there.
- **Current:** the Machine Twin renders physical device icons with live running/stopped/open/tripped state; all schematic contacts moved to the Ladder tab; Standards Library device symbols unchanged.

## Verification standard
Symbol/device fixes are verified against the **running app's rendered DOM / screenshot**, not the source code. Claimed-correct source is not proof.
