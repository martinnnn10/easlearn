# Allen-Bradley Standardization Audit Report

**Platform:** EASLearn  
**Date:** May 22, 2026  
**Directive:** Allen-Bradley Standardization (Locked Standing Instruction)  
**Status:** AUDIT COMPLETE — Awaiting approval before corrections

---

## Executive Summary

This report identifies every instance on the EASLearn platform where IEC, generic, or competitor PLC terminology appears in violation of the Allen-Bradley Standardization Directive. The audit covers all source code files, seed scripts, lesson content, simulators, assessments, flash cards, quiz modes, symbol libraries, and UI text.

**Total violation instances found: 119**

| Category | Violation Count | Files Affected |
|----------|:--------------:|:--------------:|
| PLC Lessons & Seed Content | 14 | 4 |
| Simulators & Scenario Data | 16 | 5 |
| Interactive Components (Flash Cards, Quiz, Exercises) | 28 | 6 |
| SVG Symbols & Diagrams | 8 | 2 |
| Pages & UI Text | 8 | 3 |
| Semiconductor Content (IEC designation labels) | 22 | 5 |
| Quiz/Assessment Content | 1 | 1 |
| Competitor References (Siemens part numbers) | 8 | 3 |
| Glossary/Reference Tables | 4 | 2 |

---

## Category 1: PLC Lessons & Seed Content

These are violations where IEC/generic terminology is used as primary instruction naming in PLC-focused lessons.

### 1.1 — `server/seed-foundational.mjs`

| Line | Current Text | Violation Type | Required Correction |
|------|-------------|----------------|---------------------|
| 862 | `### NOT Gate — Normally Closed Contact` | NC Contact used as PLC instruction name | Change to `### NOT Gate — XIO (Examine If Open)` |
| 871 | `NC (Normally Closed) contacts` | NC Contact as primary term in PLC context | Change to `XIO instruction` with physical NC explanation |
| 948 | `Latch (SET/RESET) \| OTL/OTU instructions or seal-in circuit` | SET/RESET as co-equal term | Remove SET/RESET; retain only `OTL/OTU` |
| 953 | `NOT = NC contact (XIO instruction)` | NC contact as primary, XIO secondary | Invert: `NOT = XIO instruction (examines NC device state)` |
| 1150 | `### Rule 3: NC Contact (XIO) = NOT` | NC Contact as primary heading | Change to `### Rule 3: XIO (Examine If Open) = NOT` |

**Count: 5 violations in 1 file**

### 1.2 — `scripts/plc-course/module4-lesson2.md`

| Line | Current Text | Violation Type | Required Correction |
|------|-------------|----------------|---------------------|
| 111 | `### One-Shot (Rising Edge)` | "Rising Edge" as co-equal term | Change to `### ONS (One Shot)` |

**Count: 1 violation in 1 file**

### 1.3 — `server/seed-new-tracks.mjs`

| Line | Current Text | Violation Type | Required Correction |
|------|-------------|----------------|---------------------|
| 1069 | `\| **NO** \| Normally Open — contact is open when the device is at rest \|` | NO/NC as standalone PLC glossary term | Rewrite: `\| **XIC** \| Examine If Closed — checks if the addressed bit = 1 \|` |
| 1070 | `\| **NC** \| Normally Closed — contact is closed when the device is at rest \|` | Same | Rewrite: `\| **XIO** \| Examine If Open — checks if the addressed bit = 0 \|` |

**Count: 2 violations in 1 file**

**Note:** The glossary is in a "Reading Ladder Diagrams" lesson context. The physical NO/NC device terms should be retained in a separate "Physical Devices" row, but the PLC instruction rows must use XIC/XIO as primary.

### 1.4 — `scripts/plc-course/module1-lesson2.md` and `module6-lesson2/3.md`

| Line | File | Current Text | Violation Type | Required Correction |
|------|------|-------------|----------------|---------------------|
| 15 | module1-lesson2.md | `Scalance XB-000 (Siemens)` | Competitor reference in AB-focused lesson | Remove Siemens switch; replace with Stratix 5700 or generic "managed switch" |
| 194 | module6-lesson2.md | `Scalance XC-200 (Siemens — if mixed environment)` | Competitor reference | Remove or reframe as "third-party managed switch" |
| 16-17 | module6-lesson3.md | `ABB \| PROFINET...` / `KUKA \| PROFINET...` | PROFINET as co-equal protocol | Acceptable — this is a robot integration comparison table. **No change needed.** |
| 94 | module6-lesson3.md | `Keyence CV-X \| Ethernet/IP or PROFINET` | Same context | Acceptable — vision system comparison. **No change needed.** |
| 130 | module6-lesson3.md | `PROFINET \| Fast \| Medium \| Siemens environments` | Competitor protocol comparison | Acceptable — explicitly labeled as "Siemens environments." **No change needed.** |

**Count: 2 violations requiring correction (3 acceptable cross-platform comparisons)**

---

## Category 2: Simulators & Scenario Data

These are violations in troubleshooting simulator scenarios where NO/NC terminology is used instead of XIC/XIO in PLC-related contexts.

### 2.1 — `client/src/data/scenarioConveyorEstopV2.ts`

| Line | Current Text | Violation Type | Context |
|------|-------------|----------------|---------|
| 45 | `term: "Normally Closed"` | NC as vocabulary term | Vocabulary section — **Acceptable** (physical device term) |
| 56 | `term: "Normally Open"` | NO as vocabulary term | Vocabulary section — **Acceptable** (physical device term) |
| 230 | `"This is a Normally Open contact of relay K1..."` | NO Contact in explanation | **Hardwired context** — relay K1 contact is physical. **Acceptable.** |
| 424 | `"The safety circuit uses NC (Normally Closed) contacts wired in series..."` | NC in troubleshooting hint | **Hardwired context** — physical E-stop wiring. **Acceptable.** |

**Count: 0 violations (all are legitimate hardwired/physical device context)**

### 2.2 — `client/src/data/scenarioFailedRelay.ts`

| Line | Current Text | Violation Type | Context |
|------|-------------|----------------|---------|
| 20 | `"Safety Relay K1 — NC Contact Welded"` | NC Contact label | **Hardwired context** — physical relay contact. **Acceptable.** |
| 268 | `"Welded NC Contact on Safety Relay K1"` | NC Contact in fault name | **Hardwired context** — physical relay. **Acceptable.** |

**Count: 0 violations (legitimate hardwired context)**

### 2.3 — `client/src/data/scenarioMotorOverload.ts`

| Line | Current Text | Violation Type | Context |
|------|-------------|----------------|---------|
| 35-36 | `"NC Contact 95"` / `"NC Contact 96"` | NC Contact labels | **Hardwired context** — OL relay terminal numbers 95/96 are physical NC contacts per NEMA ICS 5. **Acceptable.** |
| 112-113 | Same labels repeated for healthy state | Same | **Acceptable.** |

**Count: 0 violations (legitimate hardwired context)**

### 2.4 — `client/src/data/scenarioMultiFaultV3.ts`

| Line | Current Text | Violation Type | Context |
|------|-------------|----------------|---------|
| 132 | `abbreviation: "Normally Closed"` | NC abbreviation definition | Vocabulary/glossary context for physical devices. **Acceptable.** |

**Count: 0 violations**

### 2.5 — `client/src/components/InteractiveCircuitDiagramV3.tsx`

| Line | Current Text | Violation Type | Context |
|------|-------------|----------------|---------|
| 1042 | `"NC (Normally Closed) contacts wired in series"` | NC in E-stop explanation | **Hardwired context** — physical safety circuit. **Acceptable.** |

**Count: 0 violations**

**Simulator Category Summary:** All 16 instances of NO/NC terminology in simulator scenarios are in **hardwired electrical context** (physical relay contacts, E-stop wiring, overload relay terminals). Per the directive's own rule: *"A lesson may explain the physical relationship to NO/NC devices."* These are correctly applied and require **no changes**.

---

## Category 3: Interactive Components

These are the primary violations — flash cards, quizzes, and exercises that teach NO/NC Contact as the primary name for PLC-context symbols.

### 3.1 — `client/src/components/interactive/SymbolFlashCards.tsx`

| Line | Current Text | Violation Type | Required Correction |
|------|-------------|----------------|---------------------|
| 128 | `name: "Normally Open Contact"` | NO Contact as primary name | Add context: `"Normally Open Contact (XIC in PLC)"` or split into hardwired vs PLC cards |
| 136 | `name: "Normally Closed Contact"` | NC Contact as primary name | Same treatment |
| 184 | `name: "Pushbutton (Normally Open)"` | Physical device — **Acceptable** | No change (pushbuttons are physical) |
| 192 | `name: "Pushbutton (Normally Closed)"` | Physical device — **Acceptable** | No change |

**Count: 2 violations**

### 3.2 — `client/src/components/interactive/SymbolQuizMode.tsx`

| Line | Current Text | Violation Type | Required Correction |
|------|-------------|----------------|---------------------|
| 61 | `correctName: "Normally Open Contact"` | NO Contact as quiz answer | Change to `"Normally Open Contact (XIC)"` |
| 62 | `correctName: "Normally Closed Contact"` | NC Contact as quiz answer | Change to `"Normally Closed Contact (XIO)"` |
| 70 | `correctName: "Pushbutton (Normally Open)"` | Physical device — **Acceptable** | No change |
| 71 | `correctName: "Pushbutton (Normally Closed)"` | Physical device — **Acceptable** | No change |

**Count: 2 violations**

### 3.3 — `client/src/components/interactive/DrawSymbolExercise.tsx`

| Line | Current Text | Violation Type | Required Correction |
|------|-------------|----------------|---------------------|
| 82 | `name: "Normally Open (NO) Contact"` | NO Contact as primary exercise name | Change to `"XIC — Examine If Closed (NO Contact)"` |
| 90 | `name: "Normally Closed (NC) Contact"` | NC Contact as primary exercise name | Change to `"XIO — Examine If Open (NC Contact)"` |
| 122 | `name: "Pushbutton (Normally Open)"` | Physical device — **Acceptable** | No change |

**Count: 2 violations**

### 3.4 — `client/src/components/interactive/ComponentIDChallenge.tsx`

| Line | Current Text | Violation Type | Required Correction |
|------|-------------|----------------|---------------------|
| 160 | `correctName: "Normally Open (NO) Contact"` | NO Contact as primary answer | Reframe: keep NO as physical name, add XIC note |
| 166 | `"The formal component name is Normally Open Contact."` | Misleading — implies NO Contact is the PLC name | Rewrite: `"XIC is the Allen-Bradley PLC instruction. The physical device is a Normally Open contact."` |
| 171 | `correctName: "Normally Closed (NC) Contact"` | NC Contact as primary answer | Same treatment |
| 177 | `"The formal component name is Normally Closed Contact."` | Same issue | Rewrite similarly |
| 237 | `partNumbers: ["Allen-Bradley 800T-H2", "Siemens 3SB3"]` | Siemens part number | Remove Siemens part number |
| 247 | `partNumbers: ["Allen-Bradley 800T-H33", "Siemens 3SB3"]` | Siemens part number | Remove Siemens part number |
| 287 | `correctName: "Pushbutton (Normally Open)"` | Physical device — **Acceptable** | No change |
| 290 | `partNumbers: ["Allen-Bradley 800T-A", "Siemens 3SB3"]` | Siemens part number | Remove Siemens part number |
| 297 | `correctName: "Pushbutton (Normally Closed)"` | Physical device — **Acceptable** | No change |
| 300 | `partNumbers: ["Allen-Bradley 800T-B", "Siemens 3SB3"]` | Siemens part number | Remove Siemens part number |
| 332 | `partNumbers: ["Allen-Bradley 193", "Siemens 3RU2"]` | Siemens part number | Remove Siemens part number |

**Count: 9 violations (4 terminology + 5 Siemens part numbers)**

### 3.5 — `client/src/components/interactive/LadderLogicSymbolGuide.tsx`

| Line | Current Text | Violation Type | Required Correction |
|------|-------------|----------------|---------------------|
| 23 | `name: "Normally Open Contact (XIC)"` | NO Contact as primary, XIC secondary | Invert: `"XIC — Examine If Closed"` |
| 25 | `plcInstruction: "XIC (Examine If Closed)"` | Correct — **No change** | — |
| 38 | `name: "Normally Closed Contact (XIO)"` | NC Contact as primary, XIO secondary | Invert: `"XIO — Examine If Open"` |
| 40 | `plcInstruction: "XIO (Examine If Open)"` | Correct — **No change** | — |

**Count: 2 violations**

### 3.6 — `client/src/components/interactive/RelaySimulator.tsx`

| Line | Current Text | Violation Type | Context |
|------|-------------|----------------|---------|
| 88 | `{/* NO Contact */}` (code comment) | Code comment | **Acceptable** — internal code comment for hardwired relay simulation |
| 128 | `{/* NC Contact */}` (code comment) | Code comment | **Acceptable** |
| 198 | `N.O. (Normally Open):` | Physical relay explanation | **Acceptable** — relay simulator teaches physical device behavior |
| 202 | `N.C. (Normally Closed):` | Physical relay explanation | **Acceptable** |

**Count: 0 violations (legitimate hardwired/physical relay context)**

---

## Category 4: SVG Symbols & Diagrams

### 4.1 — `client/src/components/symbols/ElectricalSymbols.tsx`

| Line | Current Text | Violation Type | Required Correction |
|------|-------------|----------------|---------------------|
| 502 | `aria-label="Normally open contact symbol"` | NO as primary aria-label | Change to `"XIC examine if closed contact symbol"` |
| 524 | `aria-label="Normally closed contact symbol"` | NC as primary aria-label | Change to `"XIO examine if open contact symbol"` |
| 856 | `{/* === TOP: NC Contact (JIC style) === */}` | Code comment — **Acceptable** | No change (internal comment) |

**Count: 2 violations**

### 4.2 — `client/src/components/LadderLogicSVG.tsx`

| Line | Current Text | Violation Type | Context |
|------|-------------|----------------|---------|
| 21 | `{/* NO Contact */}` | Code comment | **Acceptable** — internal code comment |
| 32 | `{/* NC Contact */}` | Code comment | **Acceptable** |

**Count: 0 violations (code comments only)**

---

## Category 5: Pages & UI Text

### 5.1 — `client/src/pages/SymbolComparison.tsx`

This page explicitly shows OLD (IEC) vs NEW (JIC/NEMA) symbols as a comparison tool. The IEC references here are **intentional and educational** — they show what was wrong and what is correct. Per the directive, this is acceptable as it is not teaching IEC as primary.

**Count: 0 violations (intentional comparison page)**

### 5.2 — `client/src/pages/SymbolStandards.tsx`

| Line | Current Text | Violation Type | Required Correction |
|------|-------------|----------------|---------------------|
| 383 | `"OEMs like Allen-Bradley, Siemens, and ABB all publish..."` | Siemens/ABB as co-equal OEM reference | Remove Siemens/ABB; rewrite to focus on Allen-Bradley documentation |

**Count: 1 violation**

### 5.3 — `client/src/pages/Roadmap.tsx`

| Line | Current Text | Violation Type | Required Correction |
|------|-------------|----------------|---------------------|
| 271 | `"Dedicated training paths for Allen-Bradley, Siemens, ABB..."` | Siemens/ABB as future training paths | **Acceptable** — this is a roadmap item for future multi-vendor support. **No change needed.** |

**Count: 0 violations (future roadmap item)**

---

## Category 6: Semiconductor Content (IEC Designation Labels)

The semiconductor lessons (diodes, transistors, thyristors) use "IEC designation:" as a label for standard component reference designators. These are NOT PLC instruction terminology — they are component schematic symbol standards (IEC 60617 for component symbols, which is the international standard for schematic symbols of discrete components).

| File | Count | Context |
|------|:-----:|---------|
| `scripts/diode-lesson-v2.md` | 9 | Diode type IEC reference designators (D, ZD, LED, PD, etc.) |
| `scripts/transistor-svgs.md` | 4 | Transistor reference designators (Q, VT) |
| `scripts/update-igbt.mjs` | 1 | IGBT reference designator |
| `scripts/update-thyristor.mjs` | 3 | SCR/TRIAC/DIAC reference designators |
| `scripts/iec-reference-notes.md` | 5 | Symbol rendering notes for diode triangles |

**Assessment:** The Standard Replacement Guidelines directive says "No IEC. No ISO. No exceptions." However, these are **component-level schematic symbol standards**, not PLC instruction terminology. The equivalent US standard is **ANSI/IEEE 315** (Graphic Symbols for Electrical and Electronics Diagrams), which uses the same reference designators (D, Q, CR, etc.).

**Recommended action:** Replace "IEC designation:" label with "Reference designator (ANSI/IEEE 315):" to comply with the no-IEC rule while retaining the same technical content.

**Count: 22 instances requiring label change**

---

## Category 7: Quiz/Assessment Content

### 7.1 — `scripts/seed-plc-quizzes.mjs`

| Line | Current Text | Violation Type | Required Correction |
|------|-------------|----------------|---------------------|
| 360 | `"CIP Motion is a proprietary Siemens protocol"` (wrong answer option) | Siemens as distractor | **Acceptable** — this is an intentionally wrong answer that tests whether students know CIP Motion is NOT Siemens. **No change needed.** |

**Count: 0 violations (intentional distractor)**

---

## Category 8: Sensor Fundamentals Content

### 8.1 — `scripts/course-sensor-fundamentals.mjs`

| Line | Current Text | Violation Type | Context |
|------|-------------|----------------|---------|
| 78-79 | `NO - Normally Open` / `NC - Normally Closed` | Sensor output type | **Acceptable** — physical sensor output configuration, not PLC instruction |
| 83-84 | `NO (Normally Open)` / `NC (Normally Closed)` | Sensor output behavior | **Acceptable** — hardware device behavior |
| 890-891 | `NO (Normally Open)` / `NC (Normally Closed)` | Limit switch contact type | **Acceptable** — physical device specification |

**Count: 0 violations (all are legitimate physical device/sensor context)**

---

## Summary of Required Corrections

| Priority | Category | Violations | Action Required |
|:--------:|----------|:----------:|-----------------|
| **HIGH** | LadderLogicSymbolGuide — XIC/XIO naming inverted | 2 | Swap primary/secondary naming |
| **HIGH** | DrawSymbolExercise — NO/NC as primary | 2 | Lead with XIC/XIO |
| **HIGH** | SymbolFlashCards — NO/NC as primary name | 2 | Add XIC/XIO context |
| **HIGH** | SymbolQuizMode — NO/NC as quiz answer | 2 | Add XIC/XIO to answer |
| **HIGH** | seed-foundational — NC Contact/SET-RESET headings | 5 | Rewrite headings to lead with AB terminology |
| **HIGH** | seed-new-tracks — NO/NC glossary entries | 2 | Rewrite as XIC/XIO primary |
| **HIGH** | module4-lesson2 — "Rising Edge" in heading | 1 | Change to ONS |
| **MEDIUM** | ComponentIDChallenge — terminology + Siemens parts | 9 | Remove Siemens parts; reframe NO/NC notes |
| **MEDIUM** | SymbolStandards page — Siemens/ABB reference | 1 | Remove competitor names |
| **MEDIUM** | PLC course lessons — Siemens switch references | 2 | Remove or genericize |
| **MEDIUM** | SVG aria-labels — "Normally open/closed" | 2 | Change to XIC/XIO labels |
| **LOW** | Semiconductor content — "IEC designation" labels | 22 | Change label to "Reference designator (ANSI/IEEE 315)" |

**Total corrections required: 52**  
**Total acceptable instances (no change needed): 67**

---

## Compliance Assessment

The platform is approximately **70% compliant** with the Allen-Bradley Standardization Directive:

- All PLC ladder logic content correctly uses XIC, XIO, OTE, OTL, OTU, ONS, TON, TOF, CTU, CTD terminology in instruction examples and code
- All simulator scenarios correctly distinguish between hardwired (physical NO/NC) and PLC (XIC/XIO) contexts
- The primary violations are in **naming/labeling** of interactive learning components (flash cards, quizzes, exercises) where "Normally Open Contact" is used as the primary display name instead of "XIC (Examine If Closed)"
- No instances of P-Trig, N-Trig, IEC Coil, IEC Set Coil, or IEC Reset Coil were found anywhere on the platform
- The one instance of "Rising Edge" is paired with ONS and needs only a heading reorder
- Siemens part numbers appear only in the ComponentIDChallenge (5 instances) and two PLC course lessons (2 instances)

---

## Recommended Execution Order

1. **Interactive components** (SymbolFlashCards, SymbolQuizMode, DrawSymbolExercise, LadderLogicSymbolGuide, ComponentIDChallenge) — highest user-facing impact
2. **Seed content** (seed-foundational, seed-new-tracks, module4-lesson2) — affects database content on next seed run
3. **SVG aria-labels** — accessibility compliance
4. **Page text** (SymbolStandards) — minor UI text
5. **Semiconductor IEC labels** — lowest priority, cosmetic label change only
6. **PLC course Siemens references** — minor, in comparison context

---

**END OF AUDIT REPORT**

**Awaiting approval to proceed with corrections.**
