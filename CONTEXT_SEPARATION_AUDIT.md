# EASLearn Symbol Context Separation Audit

**Date:** May 21, 2026  
**Objective:** Identify where hardwired schematic symbols and PLC ladder logic symbols are being mixed incorrectly across the platform.

---

## Summary of Findings

The platform currently treats all electrical symbols as one undifferentiated pool. There is **no architectural separation** between:

1. **Hardwired Electrical Schematic Symbols** — used on motor control prints, elementary diagrams, machine drawings
2. **PLC Ladder Logic Symbols** — used in Studio 5000, RSLogix, Allen-Bradley programming environments
3. **Legacy / Alternate Symbol Variants** — IEC 60617, older JIC conventions

This causes confusion for students who need to understand that a **NO contact on a motor control print** (diagonal arm) is a **physical device**, while an **XIC instruction in Studio 5000** (vertical bars ─] [─) is a **software instruction** that examines a bit.

---

## Critical Context Mixing Issues

### Issue 1: LadderLogicSymbolGuide mixes PLC instructions with hardwired device

| File | Line | Problem |
|------|------|---------|
| `client/src/components/interactive/LadderLogicSymbolGuide.tsx` | 160-186 | The Overload Contact (OL) entry is placed inside a PLC ladder logic reference guide, but its own description says: "Not a PLC instruction — it's a physical device." The inline SVG shows a hardwired NC contact + heater element. |

**Impact:** Students learning PLC ladder logic are shown a hardwired device in the same symbol table as XIC, XIO, OTE, TON, TOF, CTU. This teaches them that an overload relay is a PLC instruction, which is incorrect.

**Correct approach:** OL belongs in the hardwired schematic symbol set. In PLC context, the OL contact is simply wired to a PLC input and read as an XIC/XIO instruction on that input address.

---

### Issue 2: ComponentIDChallenge accepts PLC mnemonics for hardwired symbols

| File | Line | Problem |
|------|------|---------|
| `client/src/components/interactive/ComponentIDChallenge.tsx` | 156-163 | NO Contact entry accepts "xic" as a valid answer |
| `client/src/components/interactive/ComponentIDChallenge.tsx` | 166-173 | NC Contact entry accepts "xio" as a valid answer |
| `client/src/components/interactive/ComponentIDChallenge.tsx` | 301-319 | Timer contact entries use hardwired timer-contact SVGs while listing Allen-Bradley mnemonics (TON, TOF) in acceptable answers |

**Impact:** Students are taught that a hardwired NO contact symbol = XIC instruction. While they are related, they are NOT the same thing:
- NO contact on a print = a physical relay contact or switch
- XIC in Studio 5000 = a software instruction that examines a bit (True/False)

Accepting "XIC" as a correct answer for a hardwired NO contact symbol reinforces the misconception that they are interchangeable.

---

### Issue 3: SymbolQuizMode uses one mixed pool with no context separation

| File | Line | Problem |
|------|------|---------|
| `client/src/components/interactive/SymbolQuizMode.tsx` | 48-75 | All 26 symbols (semiconductors, hardwired motor control, sensors) are in one randomized quiz pool with only a broad `category` field |

**Impact:** A student is quizzed on a relay coil (hardwired elementary diagram symbol) in the same session as a diode (semiconductor component symbol). While both are valid learning targets, the quiz provides no context about WHERE each symbol is encountered:
- Relay coil → motor control elementary diagram
- Diode → power supply schematic or VFD power stage
- NO contact → could be on a print OR represented as XIC in a PLC

---

### Issue 4: SymbolFlashCards has no context labels

| File | Line | Problem |
|------|------|---------|
| `client/src/components/interactive/SymbolFlashCards.tsx` | 37-229 | Flash cards mix semiconductor and hardwired control symbols with only `category` labels like "Industrial Control" |

**Impact:** Students study flash cards without understanding which drawing type each symbol appears on. A pressure switch symbol appears on a motor control elementary diagram — not in Studio 5000 ladder logic.

---

### Issue 5: RelaySimulator uses non-standard inline SVG (not from master library)

| File | Line | Problem |
|------|------|---------|
| `client/src/components/interactive/RelaySimulator.tsx` | 47-178 | Entire relay circuit diagram is drawn with custom inline SVG. The coil is drawn as a rectangle with wavy internal line (IEC-style), while the NO/NC contacts use the JIC diagonal-arm style. |

**Impact:** The simulator mixes IEC coil representation with JIC contact representation in the same diagram. Additionally, these SVGs are duplicates — they don't reference the master symbol library.

---

### Issue 6: MotorStarterSimulator uses non-standard inline SVG

| File | Line | Problem |
|------|------|---------|
| `client/src/components/interactive/MotorStarterSimulator.tsx` | 371-425 | Motor starter elementary diagram drawn with custom inline SVG. Stop/Start pushbuttons are drawn as two parallel horizontal lines (IEC style), not the NEMA/JIC pushbutton symbols. The coil is correctly drawn as a circle. |

**Impact:** Same diagram has IEC pushbuttons and NEMA coil — inconsistent within one context.

---

### Issue 7: WiringDiagramLab uses custom inline rendering

| File | Line | Problem |
|------|------|---------|
| `client/src/components/interactive/WiringDiagramLab.tsx` | 62-144 | One-line MCC and three-line starter diagrams are rendered with a custom `renderComponent` function that draws breakers, contactors, overloads, motors with its own SVG primitives |

**Impact:** Symbols are duplicated outside the master library. If the master library is updated, these diagrams won't reflect the changes.

---

### Issue 8: SymbolComparison.tsx contains duplicate hardcoded SVGs

| File | Line | Problem |
|------|------|---------|
| `client/src/pages/SymbolComparison.tsx` | 10-100 | Contains 7 hardcoded "Old" symbol SVGs that are duplicates and labeled as "IEC 60617 / Incorrect" |

**Impact:** This is a temporary review page that should be removed. It violates the one-master-per-symbol rule and labels IEC symbols as "incorrect" — which contradicts the educational goal of teaching students to recognize multiple standards.

---

## Lesson Context Classification (MIXED lessons requiring attention)

These lessons were flagged as having significant content from BOTH hardwired and PLC contexts:

| Module | Lesson | PLC Keywords | Hardwired Keywords | Assessment |
|--------|--------|:---:|:---:|------|
| fluid-power | Reading Hydraulic & Pneumatic Schematics | 4 | 4 | **Legitimate dual-context** — fluid power schematics reference both PLC control and hardwired valves |
| fluid-power | Valve Types & Troubleshooting | 6 | 5 | **Legitimate dual-context** — valves are controlled by both solenoids (hardwired) and PLC outputs |
| semiconductor-fundamentals | Diodes: Rectification & Protection | 42 | 23 | **Legitimate dual-context** — diodes appear in both VFD power stages (PLC-controlled) and hardwired protection circuits |
| semiconductor-fundamentals | Transistors: Switching & Amplification | 23 | 12 | **Legitimate dual-context** — transistors switch relay coils in both contexts |
| semiconductor-fundamentals | Thyristors & SCRs: Phase Control | 6 | 7 | **Legitimate dual-context** — SCRs are triggered by both hardwired and PLC-based firing circuits |
| hvac-fundamentals | HVAC Motor Controls & Starters | 15 | 29 | **Legitimate dual-context** — HVAC uses both hardwired contactors AND PLC/BAS control |
| print-reading | Three-Phase Power Distribution Prints | 9 | 5 | **Legitimate dual-context** — power prints reference both physical devices and PLC monitoring |
| print-reading | Cross-Referencing Contacts and Coils | 25 | 24 | **Legitimate dual-context** — cross-referencing applies to both hardwired and PLC-mapped contacts |
| safety-systems | Safety Devices: E-Stops, Light Curtains | 7 | 13 | **Legitimate dual-context** — safety devices are hardwired but monitored by safety PLCs |
| power-distribution | Industrial Power Systems | 12 | 8 | **Legitimate dual-context** — power distribution is physical but monitored/controlled by PLCs |

**Assessment:** All 10 "MIXED" lessons are **legitimately dual-context** — they teach topics where both hardwired and PLC systems interact. The issue is NOT that these lessons exist, but that the platform provides no visual/textual cue to help students understand which symbol system applies to which part of the content.

---

## Duplicate Symbol Implementations (violates one-master-per-symbol rule)

| Location | Symbols Duplicated | Uses Master Library? |
|----------|-------------------|:---:|
| `ElectricalSymbols.tsx` (master) | All 26 symbols | ✅ IS the master |
| `LadderLogicSymbolGuide.tsx` | OL contact, XIC, XIO, OTE, OTL, OTU, TON, TOF, CTU | ❌ Own inline SVGs |
| `RelaySimulator.tsx` | Relay coil, NO contact, NC contact | ❌ Own inline SVGs |
| `MotorStarterSimulator.tsx` | Pushbutton NO, Pushbutton NC, OL contact, Relay coil | ❌ Own inline SVGs |
| `WiringDiagramLab.tsx` | Fuse, contactor, overload, motor, disconnect | ❌ Own inline SVGs |
| `CircuitFlowAnimator.tsx` | Switch (generic), load resistor | ❌ Own inline SVGs |
| `SymbolComparison.tsx` | 7 "old" versions of NO, NC, limit, pressure, temp, OL, timer | ❌ Hardcoded duplicates |
| `SymbolStandards.tsx` | Diode, LED, NPN (drafting examples) | ❌ Own inline SVGs |

**Total duplicate symbol implementations: 8 files with ~30 duplicate SVGs**

---

## Recommendations (NO CHANGES MADE — awaiting approval)

### Architecture Changes

1. **Create three symbol context categories in the master library:**
   - `HardwiredSymbols` — for motor control prints, elementary diagrams
   - `PLCLadderSymbols` — for Allen-Bradley/Rockwell ladder logic (XIC, XIO, OTE, etc.)
   - `ComponentSymbols` — for semiconductors, sensors, power devices (context-neutral)

2. **Add context metadata to every symbol:**
   ```typescript
   context: "hardwired" | "plc-ladder" | "component" | "dual-context"
   whereEncountered: string  // e.g., "Motor control elementary diagrams"
   ```

3. **Refactor interactive labs to use master library symbols:**
   - RelaySimulator, MotorStarterSimulator, WiringDiagramLab, CircuitFlowAnimator should import from the master library
   - LadderLogicSymbolGuide should have its own PLC-specific symbol set (rectangles with XIC/XIO/OTE labels)

4. **Add context labels to assessments:**
   - SymbolQuizMode: Add filter by context (quiz on hardwired only, PLC only, or mixed)
   - ComponentIDChallenge: Remove PLC mnemonics from hardwired symbol acceptable answers
   - SymbolFlashCards: Add "Where you'll see this" field

5. **Remove SymbolComparison.tsx** — temporary review page with duplicate SVGs

### Educational Changes

6. **Add a "Symbol Standards Comparison" lesson** that explicitly teaches:
   - NEMA/NFPA 79 hardwired symbols (what's on the machine print)
   - Allen-Bradley PLC ladder symbols (what's in Studio 5000)
   - IEC 60617 symbols (what's on European/imported machine prints)
   - When and where each is encountered

7. **For dual-context lessons**, add visual callouts:
   - "On the print, this is shown as [hardwired symbol]"
   - "In Studio 5000, this input is read with [XIC instruction]"

---

## Summary Table

| Issue # | Severity | Type | Location | Description |
|:---:|:---:|---|---|---|
| 1 | HIGH | Context bleed | LadderLogicSymbolGuide | Hardwired OL device in PLC instruction table |
| 2 | HIGH | Context bleed | ComponentIDChallenge | XIC/XIO accepted as answers for hardwired NO/NC |
| 3 | MEDIUM | Missing context | SymbolQuizMode | No context separation in quiz pool |
| 4 | MEDIUM | Missing context | SymbolFlashCards | No "where encountered" labels |
| 5 | MEDIUM | Duplicate + mixed | RelaySimulator | IEC coil + JIC contacts in same diagram |
| 6 | MEDIUM | Duplicate + mixed | MotorStarterSimulator | IEC pushbuttons + NEMA coil in same diagram |
| 7 | LOW | Duplicate | WiringDiagramLab | Custom rendering bypasses master library |
| 8 | LOW | Duplicate/stale | SymbolComparison.tsx | Temporary page with hardcoded old SVGs |

---

## No Changes Made

This report is for review only. No symbols, code, or content has been modified.

Awaiting approval before proceeding with any corrections.
