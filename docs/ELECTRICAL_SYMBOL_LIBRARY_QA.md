# Electrical Symbol Library — QA Review (EASLearn training conventions)

> **This is an internal QA review, not an external or third-party certification.**
> The symbols are **simplified EASLearn training symbols** based on common North
> American motor-control schematic conventions (NEMA ICS, JIC EGP-1, NFPA 79,
> ANSI/IEEE 315) and RSLogix ladder practice. They were reviewed against those
> published conventions and the rendered geometry — **not** validated against a
> live copyrighted standards document, and **not** certified by any standards body.
> Actual plant/OEM prints may vary. Do not describe this library as "certified,"
> "standards-certified," or an "official NEMA/JIC library."

**Scope:** every symbol in the EASLearn Electrical Symbol Library (`/symbols`).
**Convention set:** North American motor-control / NEMA ICS 1 & ICS 2, JIC EGP-1,
NFPA 79, ANSI/IEEE 315 (Y32.2); RSLogix/Studio-5000 ladder for PLC contacts;
ISO 13849/13850 for safety devices.
**Rendering source of truth:** `client/src/lib/electricalDiagramPrimitives.tsx`
(the SVG geometry) as selected by `client/src/components/standards/StandardsSymbolPreview.tsx`.
**Metadata source of truth:** `shared/electricalSymbolRegistry.ts`.

### How this audit was performed (and its limits)

This is a **code + render + standards** audit, not a guess from a picture. For each
symbol I read the exact SVG geometry that renders it, mapped it to the accepted
schematic convention, and judged the match. Every symbol was also rendered from the
live `StandardsSymbolPreview` component (with the real diagram CSS) and inspected.

Honest limitation: this environment **cannot log in to easlearn.org** and **cannot
fetch external standards PDFs/images** (egress policy blocks arbitrary web requests).
The convention checks below are therefore grounded in the documented standards and the
rendered geometry, not in a side-by-side against a live copyrighted chart. Where a
symbol is a deliberate teaching simplification, it is labeled as such rather than
claimed to be a strict schematic glyph.

### Status legend

- **PASS** — correct as rendered for its stated context.
- **PASS (relabeled/clarified)** — geometry was already correct; the label or context
  was tightened so it cannot be misread. Fix applied.
- **PASS (rendering fixed)** — geometry was changed to match the intended meaning. Fix applied.
- **PASS (simplified, documented)** — a training simplification, explicitly documented as one.

---

## Master QA table

| # | Symbol (final label) | Internal ID | Category | Intended context | Rendering | Standards / convention check | Pass / Fix | Change applied | Example tag |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Disconnect Switch | `disconnect` | Power Devices | Power circuit (isolation/LOTO) | Hinged knife blade, open, between fixed contacts | ANSI/IEEE 315 disconnector = open knife blade. Matches. | **PASS** | — | DISC |
| 2 | Fuse | `fuse` | Power Devices | Power/control protection | Rectangle with fusible element line | IEC 60617 / ANSI fuse = rectangle with element. Matches. | **PASS** | — | F1 |
| 3 | Circuit Breaker | `breaker` | Power Devices | Power circuit | Rectangle enclosing an "×" | ANSI/IEEE 315 **drawout / one-line circuit breaker** symbol. Valid one-line form; not the three-line thermal-magnetic glyph. | **PASS (simplified, documented)** | Documented as the drawout/one-line CB symbol; distinct from the plain disconnect | CB1 |
| 4 | Control Transformer | `transformer` | Power Devices | Power → control (e.g. 480→120 V) | Two windings (three bumps each) over a laminated core | IEEE 315 transformer = two coupled windings + core. Matches. | **PASS** | — | CPT1 |
| 5 | Contactor Power Pole | `contactor_power` | Power Devices | Power circuit (motor current) | Heavy NO blade pivoting off a terminal, open; terminal dots | NEMA ICS 2 contactor pole = a heavy NO power contact, one pole. Matches. | **PASS (clarified)** | Description now states "one pole of a three-pole contactor" | M1 |
| 6 | Overload Heater Element | `overload_heater` | Power Devices | Power circuit (motor current path) | Resistive zigzag element with leads | NEMA ICS 2 OL heater is a resistive/thermal element. Zigzag is the accepted training representation of that element. | **PASS (simplified, documented)** | Documented as the resistive-element form of the OL heater | OL1 |
| 7 | Three-Phase Motor | `motor` | Power Devices | Power circuit (the load) | Circle with "M" + leads | ANSI/IEEE 315 & NEMA MG 1 motor = circle + letter. Matches. Three-phase is conveyed by the 3-conductor power connection on the print. | **PASS** | — | MTR |
| 8 | Normally Open (NO) Contact | `contact_no` | Control Contacts | Control circuit / ladder logic | Two vertical bars, gap ( `-\| \|-` ) | NEMA/JIC & RSLogix XIC. Matches. | **PASS** | — | CR1 |
| 9 | Normally Closed (NC) Contact | `contact_nc` | Control Contacts | Control circuit / ladder logic | Two vertical bars + diagonal slash ( `-\|/\|-` ) | NEMA/JIC & RSLogix XIO. Matches. | **PASS** | — | CR2 |
| 10 | Relay / Contactor Coil | `coil` | Control Contacts | Control circuit | Circle with leads | NEMA ICS 1 relay/starter coil = circle (device letter added on prints). Matches. | **PASS** | — | CR1 |
| 11 | Contactor Auxiliary Contact | `contactor_aux` | Control Contacts | Control circuit (seal-in/status) | NO contact ( `-\| \|-` ) tagged **M** | NEMA ICS 2 aux contact = a control NO/NC contact carrying the contactor tag. Matches. | **PASS** | — | M-aux |
| 12 | Overload NC Monitoring Contact | `overload_nc` | Control Contacts | Control circuit (trip logic) | NC contact ( `-\|/\|-` ) tagged **OL / 95-96** | NEMA ICS 2 OL contact 95-96 in the control string. Matches, and is visibly different from the power-circuit heater (#6). | **PASS** | — | 95-96 |
| 13 | Timer Contact — NO, On-Delay (NOTC) | `timer_contact` | Control Contacts | Control circuit (timed) | NO contact + on-delay "parachute" canopy, tagged **TR** | NEMA ICS 1 time-delay contact. It is a **normally-open, timed-closed, on-delay** contact — now stated explicitly. | **PASS (clarified)** | Label → "Timer Contact — NO, On-Delay"; note declares NOTC (not instantaneous, not timed-NC) | TR1 |
| 14 | Pushbutton — Normally Open | `pb_no` | Pushbuttons & Switches | Physical operator (control input) | Fixed contacts + movable bar held **open** + button cap | NEMA ICS 1 momentary NO pushbutton. Matches. | **PASS** | — | PB1 |
| 15 | Pushbutton — Normally Closed | `pb_nc` | Pushbuttons & Switches | Physical operator | Fixed contacts + movable bar **bridging** + button cap | NEMA ICS 1 momentary NC pushbutton. Matches. | **PASS** | — | PB2 |
| 16 | Selector Switch | `selector_switch` | Pushbuttons & Switches | Physical operator (maintained) | Pivoting blade + detent arc + positions 1/2 | NEMA ICS 1 selector. Two-position shown. | **PASS (simplified, documented)** | Documented as a 2-position selector (HOA etc. are 3-position) | SS1 |
| 17 | Limit Switch (Roller Lever) | `limit_switch` | Pushbuttons & Switches | Physical device (position) | Pivoting blade + operating lever + **filled** roller, held open | NEMA ICS 1 / ANSI Y32.2 roller-lever limit switch; actuator roller is a **filled** circle. Matches. Shown as held-open (NO). | **PASS** | — | LS1 |
| 18 | Emergency Stop Pushbutton | `estop` | Safety Devices | Physical operator (with NC contact) | Mushroom-head dome + stem + NC bridging contact | ISO 13850 / NFPA 79 E-stop **operator**; its NC contact opens the safety string. | **PASS (relabeled/clarified)** | Label → "Emergency Stop Pushbutton"; note states it is the operator and its NC contact opens the safety circuit | ES1 |
| 19 | Guard Interlock NC Contact | `guard_switch` | Safety Devices | Control/safety circuit (contact) | NC contact ( `-\|/\|-` ) tagged **GS** | The rendering is the **NC monitoring contact** in the safety string, not the physical switch body. | **PASS (relabeled)** | Label → "Guard Interlock NC Contact"; note states control/safety-circuit NC contact | GS1 |
| 20 | Safety Relay Coil | `safety_relay` | Safety Devices | Control circuit (coil element) | Relay coil (circle) tagged **SR** | The rendering is a **coil**, not the module block or its output contact. | **PASS (relabeled)** | Label → "Safety Relay Coil"; note states the physical device is a dual-channel module | SR1 |
| 21 | PLC Digital Input | `plc_input` | PLC, Sensors, & Drives | Device / I/O block | I/O block with "IN" badge + leads | Not a strict schematic glyph — an EASLearn device-block representation of a PLC input module. | **PASS (simplified, documented)** | Documented as an EASLearn I/O-block representation | I:1/0 |
| 22 | PLC Digital Output | `plc_output` | PLC, Sensors, & Drives | Device / I/O block | I/O block with "OUT" badge + leads | EASLearn device-block representation of a PLC output module. | **PASS (simplified, documented)** | Documented as an EASLearn I/O-block representation | O:2/0 |
| 23 | Photoelectric Sensor | `photoeye` | PLC, Sensors, & Drives | Sensor / device block | Housing + lens + beam arrow + "PE" | No single strict NEMA glyph; an EASLearn field-device block. | **PASS (simplified, documented)** | Documented as an EASLearn sensor-block representation | PE1 |
| 24 | VFD Fault Contact | `vfd` | PLC, Sensors, & Drives | Control circuit (drive fault output) | **NO contact tagged "VFD FLT"** | Represents the drive's **fault-relay contact/output**, not the whole drive. | **PASS (rendering fixed)** | Rendering changed from a drive block to a NO contact + "VFD FLT" tag; the drive block (`DiagramVFD`) is retained only for the simulators, where it correctly depicts the drive | VFD1-FLT |
| 25 | Terminal / Junction | `terminal` | Wiring & Connection Points | Wiring / terminal | Filled junction dot on a conductor | IEEE 315 filled dot = a **connected junction**. Matches for "junction". | **PASS (documented)** | Documented: filled dot = connected junction; an open circle would denote a terminal-block landing | TB1 |

---

## High-risk symbol resolutions

**1. Emergency Stop — resolved.** The glyph draws the mushroom-head **operator** plus
its NC contact. It is therefore the *physical operator*, and is now labeled **"Emergency
Stop Pushbutton"** with a note that its NC contact opens the safety circuit. It is not
left as a bare "Emergency Stop."

**2. Guard Interlock — resolved.** The glyph is a plain **NC contact** (no device body),
i.e. the monitoring contact in the safety string. Labeled **"Guard Interlock NC Contact."**

**3. Overload Heater vs Overload NC Contact — clearly different.**
Heater (`overload_heater`) = resistive zigzag, **power circuit**, tag OL1, note "Used in
the power circuit." NC contact (`overload_nc`) = `-|/|-` with **95-96**, **control
circuit**, note "Used in the control circuit. Opens when the overload trips." Different
glyph, different section, different tag, different note.

**4. Contactor Power Pole vs Auxiliary Contact — clearly different.**
Power pole (`contactor_power`) = heavy open NO blade + terminal dots, **power circuit**,
now described as "one pole of a three-pole contactor," note "Carries motor/load current."
Aux (`contactor_aux`) = light `-| |-` tagged **M**, **control circuit**, note "Used for
seal-in / status logic."

**5. VFD Fault Contact — resolved.** No longer drawn as the drive block in the library.
It is a **NO contact tagged "VFD FLT"**, labeled "VFD Fault Contact," with a note that it
represents a drive fault output/contact, not the entire drive. (Physical drives usually
provide a Form-C fault relay; wire the NO or NC leg per your print / fail-safe design.)

**6. Timer Contact — type is explicit.** Labeled **"Timer Contact — NO, On-Delay"**;
description/note state **normally-open, timed-closed (NOTC), on-delay** — not
instantaneous and not a timed-NC contact.

**7. Safety Relay — context is explicit.** The glyph is a **coil**, so it is labeled
**"Safety Relay Coil"** with a note that the physical device is a dual-channel safety
module. It is not presented as an unexplained abstract symbol.

---

## Documented training simplifications

These are intentional EASLearn teaching simplifications, called out so no one mistakes
them for strict, unique schematic glyphs:

- **Circuit Breaker** — drawn as the drawout / one-line box-with-× (valid one-line
  symbol); a three-line thermal-magnetic breaker is drawn with thermal + magnetic elements.
- **Overload Heater** — drawn as a resistive zigzag element.
- **Selector Switch** — drawn as a 2-position selector.
- **Three-Phase Motor** — circle + M; the three-phase nature is shown by the 3-conductor
  power connection on the print.
- **PLC Digital Input / Output** and **Photoelectric Sensor** — device/I/O blocks, not
  strict single-glyph schematic symbols.
- **Terminal / Junction** — filled dot (connected junction); an open circle denotes a
  terminal-block landing.

---

## Acceptance-standard checklist

| Requirement | Met? | Evidence |
|---|---|---|
| No physical device confused with a control contact | ✅ | E-stop = "…Pushbutton" (operator); Guard = "…NC Contact"; Limit/PB labeled as devices; Motor note "not a contact" |
| No power-circuit symbol confused with a control-circuit symbol | ✅ | OL heater vs OL NC; contactor power pole vs aux — separated by glyph, section, and note |
| Overload heater and overload NC contact clearly different | ✅ | Zigzag/power vs `-\|/\|-`+95-96/control |
| Contactor power pole and auxiliary contact clearly different | ✅ | Heavy blade+dots/power (one-pole) vs `-\| \|-`+M/control |
| VFD fault contact not mislabeled as the full VFD | ✅ | Rendered as a contact + "VFD FLT"; labeled "VFD Fault Contact" with note |
| Emergency stop context explicit | ✅ | "Emergency Stop Pushbutton" + operator/NC note |
| Guard interlock context explicit | ✅ | "Guard Interlock NC Contact" |
| Timer contact type explicit | ✅ | "Timer Contact — NO, On-Delay (NOTC)" |
| Safety relay context explicit | ✅ | "Safety Relay Coil" + module note |
| Every label learner-facing | ✅ | No developer IDs surfaced; human names throughout |
| Every symbol has a short explanation | ✅ | `description` on every entry; `contextNote` on every confusable one |
| Every questionable simplification documented | ✅ | See "Documented training simplifications" |

---

## Final verdict

**QA-REVIEWED against EASLearn training conventions — approved for learner-facing use.**

(Internal review only — not an external standards certification.)
