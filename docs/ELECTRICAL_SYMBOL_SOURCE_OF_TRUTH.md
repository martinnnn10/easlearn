# EASLearn Electrical Symbol — Source of Truth & Remediation Plan

**Status: PLANNING / FOR REVIEW. No code has been changed for this document.**
This is the Phase 1–3 remediation package requested before any implementation. It is
gated on human review and the acquisition of licensed standards; nothing here is a
certification.

---

## 0. Hard constraints (read first — they bound every claim in this doc)

1. **Licensed sources are not available to this author.** NEMA ICS 19, NFPA 79, and
   Eaton MZ081001EN are paywalled. This build environment additionally **blocks outbound
   web requests**, so even the public vendor pages (Rockwell, Schneider, Siemens,
   AutomationDirect) **cannot be fetched** here. Consequently:
   - No exact page/section citation from ICS 19 / NFPA 79 / Eaton is asserted below.
   - Any symbol whose *exact geometry* must match ICS 19 is marked **WAITING FOR SOURCE**.
   - Vendor-documented behavior (e.g. Rockwell XIC/XIO semantics, Schneider limit-switch
     NO/NC, safety-relay module architecture) is stated from established engineering
     knowledge and attributed to the primary vendor document, but flagged
     **"verify against live doc"** because it was not fetched here.
2. **No SME sign-off exists.** Every `SME` column is `PENDING`. AI review is not
   certification (your Phase 4).
3. **No "certified / official / exact" language** is used. These remain simplified
   training symbols until a licensed source + SME confirm each one.

---

## 1. Chosen EASLearn standard (locked)

- **Primary system:** North American **NEMA / JIC-style hardwired motor-control
  schematics** (relay logic).
- **PLC ladder instructions are a separate library** (Rockwell XIC/XIO/OTE/… ). They are
  *bit-evaluation instructions*, not hardwired NO/NC contacts, and must never sit in the
  hardwired section.
- **IEC** may appear later only as a **clearly labeled comparison** (per Eaton
  MZ081001EN), never mixed into the primary library unidentified.

---

## 2. Taxonomy — every symbol belongs to exactly ONE context

| ID | Context | Definition | Example members |
|----|---------|-----------|-----------------|
| **A** | `PHYSICAL_DEVICE` | The real operator/device as a pictorial, not its electrical contact | Roller-lever limit switch body; E-stop mushroom operator; guard-interlock switch body; pushbutton operator |
| **B** | `HARDWIRED_CONTROL_SCHEMATIC` | Relay-logic control-circuit elements on a NEMA/JIC elementary (ladder) diagram | NO/NC contacts, relay coil, aux contact, OL trip contact, PB NO/NC contact, LS NO/NC contact, E-stop NC contact |
| **C** | `POWER_CIRCUIT` | Symbols in the motor/load power path (three-line / elementary power) | Contactor power poles, OL thermal element, motor, fuse, disconnect blade |
| **D** | `ONE_LINE_DIAGRAM` | Single-line distribution symbols | One-line circuit breaker, one-line disconnect, one-line xfmr |
| **E** | `PLC_LADDER_INSTRUCTION` | Rockwell/IEC PLC ladder bit & timer instructions | XIC, XIO, OTE, OTL, OTU, TON, TOF, RTO |
| **F** | `FUNCTIONAL_BLOCK` | Multi-terminal functional equipment blocks, not a single glyph | Safety relay/monitoring module, VFD/drive, photoelectric sensor as a device block |
| **G** | `TRAINING_ILLUSTRATION` | Deliberate EASLearn teaching composites (device + contact together), **explicitly labeled** as such | "E-stop operator shown with its NC contact" teaching card |

**Rule:** a card in one context must not borrow geometry/labels from another without an
explicit cross-reference. A `PHYSICAL_DEVICE` illustration is never presented as its
schematic contact, and a `PLC_LADDER_INSTRUCTION` is never called a "contact."

---

## 3. Symbol record schema (proposed `shared/electricalSymbolTaxonomy.ts`)

> Proposed shape only — **not yet implemented**. Build after review.

```ts
export type SymbolContext =
  | "PHYSICAL_DEVICE" | "HARDWIRED_CONTROL_SCHEMATIC" | "POWER_CIRCUIT"
  | "ONE_LINE_DIAGRAM" | "PLC_LADDER_INSTRUCTION" | "FUNCTIONAL_BLOCK"
  | "TRAINING_ILLUSTRATION";

export type SymbolStatus =
  | "APPROVED" | "REMOVE" | "REDRAW" | "MOVE_LIBRARY"
  | "WAITING_FOR_SOURCE" | "WAITING_FOR_SME";

export interface SymbolRecord {
  id: string;                       // internal ID
  name: string;                     // learner-facing name
  context: SymbolContext;           // exactly one
  represents: string;               // device or instruction represented
  normalState?: "open" | "closed" | "n/a";
  noNc?: "NO" | "NC" | "n/a";
  circuit?: "power" | "control" | "n/a";
  designation: string;              // NEMA/IEC/PLC designation (e.g. "M", "OL", "XIC")
  source: {
    org: string;                    // e.g. "NEMA", "Rockwell Automation"
    document: string;               // e.g. "ICS 19-2002 (R2022)"
    section?: string;               // page/figure — REQUIRED before APPROVED
    url?: string;
    accessStatus: "verified" | "not_accessible" | "public_not_fetched";
  };
  exampleTag?: string;              // e.g. "LS1" — labeled as EXAMPLE
  simplified: boolean;
  simplificationReason?: string;    // required if simplified
  status: SymbolStatus;
  smeReview: "PENDING" | "PASS" | "FAIL";
  smeReviewer?: string;
}
```

---

## 4. Source register (what each authority governs + access status)

| # | Source | Governs | Access in this env |
|---|--------|---------|--------------------|
| 1 | **NEMA ICS 19** — Diagrams, Device Designations & Symbols for Industrial Control | Exact hardwired control/power symbols; device designations (M, CR, OL, LS, PB…) | **Licensed — NOT ACCESSIBLE.** Must be purchased/consulted. |
| 2 | **NFPA 79 (2024)** — Electrical Standard for Industrial Machinery | Machine drawing conventions, device/component designations, safety-circuit context | **Licensed — NOT ACCESSIBLE.** |
| 3 | **Rockwell — Bit Instructions** (XIC/XIO/OTE/OTL/OTU) | PLC ladder instruction semantics; that XIC/XIO **evaluate a bit**, not a physical contact | Public page; **not fetchable here**. Content well-established → cite + "verify against live doc." |
| 4 | **Schneider — Limit Switches** | Limit-switch signal evaluation is explicitly **NO or NC** (never one generic "NO/NC") | Public; not fetchable. |
| 5 | **AutomationDirect / Schmersal roller-lever LS** | The **physical device/operator** and its separate NO and NC contacts | Public; not fetchable. |
| 6 | **Siemens SIRIUS safety relay** | Safety relay = **functional safety module** (multi input/output), not a coil | Public; not fetchable. |
| 7 | **Rockwell Guardmaster cut sheet** | Dual-channel input, safety outputs, aux output, reset, time-delay | Public; not fetchable. |
| 8 | **AutomationDirect on-delay timer relay** | Physical timer relay & operation (NOT license to invent a contact glyph) | Public; not fetchable. |
| 9 | **Eaton MZ081001EN** — NEMA vs IEC comparison | The labeled NEMA↔IEC comparison layer | **Publication — NOT ACCESSIBLE** (do not cite reposts). |

**Net effect:** the geometry authorities (1, 2, 9) are exactly the ones I cannot open.
That is why the remediation table below is dominated by `WAITING FOR SOURCE`.

---

## 5. Remediation table — current 25 symbols

Statuses only: `APPROVED` · `REMOVE` · `REDRAW` · `MOVE_LIBRARY` · `WAITING_FOR_SOURCE` · `WAITING_FOR_SME`.

| Current ID | Current context (as shipped) | What is wrong | Correct context | Action | SME |
|---|---|---|---|---|---|
| `timer_contact` | "Control Contact · timed" (custom canopy+arrow) | **Custom, unsourced glyph**; also conflates an electromechanical timer-relay contact with a PLC TON. Not an ICS 19 figure. | B (timer-relay contact family) **and** E (TON/TOF) — separate | **REMOVE now**, re-add full family from ICS 19 later | PENDING |
| `safety_relay` | "Safety Circuit · coil" | A modern safety relay is a **functional module**, not a coil; the coil symbol misrepresents it | F `FUNCTIONAL_BLOCK` | **REMOVE from foundational**, remodel as module block | PENDING |
| `plc_input` | "PLC/Sensors" I/O block | Custom block; not a ladder instruction; conflated with field sensor | E `PLC_LADDER_INSTRUCTION` (+ separate field-device) | **MOVE_LIBRARY** + REDRAW | PENDING |
| `plc_output` | "PLC/Sensors" I/O block | Same as above | E | **MOVE_LIBRARY** + REDRAW | PENDING |
| `vfd` (VFD Fault Contact) | "Schematic contact · drive output" (NO contact + "VFD FLT") | Open-vs-close-on-fault **unspecified & unsourced**; terminal designation not confirmed | B (fault-relay contact) or F (drive block) | **REDRAW — WAITING_FOR_SOURCE** (confirm NO/NC + fault behavior) | PENDING |
| `limit_switch` | "Physical field device" (single glyph) | One glyph conflates the **physical device** with its **NO/NC contacts**; "NC/NO" is ambiguous | Split A + B + B | **REDRAW / SPLIT into 3** | PENDING |
| `estop` | "Physical operator device" (mushroom + NC hybrid) | Hybrid device+contact in one glyph, not labeled as an illustration | Split A + B (or G if kept combined) | **REDRAW / SPLIT** | PENDING |
| `guard_switch` | "Schematic contact" (NC) | Missing the **physical device**; contact geometry unverified | B (keep) + add A | **REDRAW/ADD device — WAITING_FOR_SOURCE** | PENDING |
| `pb_no` | "Physical operator device" (contact+button hybrid) | Same device/contact conflation as limit switch | Split A + B | **REDRAW / SPLIT** | PENDING |
| `pb_nc` | "Physical operator device" | Same | Split A + B | **REDRAW / SPLIT** | PENDING |
| `selector_switch` | "Physical operator device" | Device vs contact conflation; # positions not defined | Split A + B | **REDRAW / SPLIT** | PENDING |
| `breaker` | "Power · Device symbol · simplified" (box-with-X) | A drawout/one-line box-with-X is presented as the universal breaker | Split D (one-line) + C (power poles) | **SPLIT / RECLASSIFY — WAITING_FOR_SOURCE** | PENDING |
| `overload_heater` | "Power · element · simplified" (resistor zigzag) | Zigzag may **not** be the ICS 19 thermal-OL element; unverified | C `POWER_CIRCUIT` | **REDRAW — WAITING_FOR_SOURCE** | PENDING |
| `contactor_power` | "Contact · power pole" (single blade) | Reads as a generic switch; single pole not clearly framed vs the 3 linked poles | C `POWER_CIRCUIT` | **REDRAW/RENAME** ("One Contactor Power Pole" or 3-pole) — WAITING_FOR_SOURCE | PENDING |
| `terminal` | "Wiring / junction point" (filled dot) | One dot conflates **terminal point**, **connected junction**, and **crossing (not connected)** | B/D wiring | **SPLIT into 3** | PENDING |
| `contact_no` | "Schematic contact" (vertical bars) | Base NO contact; exact ICS 19 geometry unverified | B | **KEEP — WAITING_FOR_SOURCE** (verify geometry) | PENDING |
| `contact_nc` | "Schematic contact" (bars + slash) | Base NC contact; geometry unverified | B | **KEEP — WAITING_FOR_SOURCE** | PENDING |
| `coil` | "Schematic coil" (circle) | Relay/starter coil; geometry/designation unverified | B | **KEEP — WAITING_FOR_SOURCE** | PENDING |
| `contactor_aux` | "Schematic contact" (NO + M) | Aux contact; verify designation convention | B | **KEEP — WAITING_FOR_SOURCE** | PENDING |
| `overload_nc` | "Schematic contact" (NC + 95-96) | OL trip contact; verify 95-96 + geometry | B | **KEEP — WAITING_FOR_SOURCE** | PENDING |
| `fuse` | "Power · Device symbol" | Verify ICS 19/one-line form | C/D | **KEEP — WAITING_FOR_SOURCE** | PENDING |
| `transformer` | "Power · Device symbol" | Control transformer; verify form | C/D | **KEEP — WAITING_FOR_SOURCE** | PENDING |
| `motor` | "Load / machine symbol" (circle + M) | Verify ICS 19 motor form / 3-phase notation | C | **KEEP — WAITING_FOR_SOURCE** | PENDING |
| `disconnect` | "Power · Device symbol" (knife blade) | Verify power vs one-line form | C/D | **KEEP — WAITING_FOR_SOURCE** | PENDING |
| `photoeye` | "Field device · simplified" (block) | Sensor block; classify device vs functional block | A or F | **RECLASSIFY — WAITING_FOR_SOURCE** | PENDING |

### 5a. Remove **immediately** from the public foundational library
1. **`timer_contact`** — custom unsourced glyph; remove now, do not replace with another custom glyph.
2. **`safety_relay` (coil)** — misrepresents a functional safety module as a coil.
3. **`plc_input` / `plc_output`** — move out of the hardwired/foundational set into a separate PLC Ladder Instructions library (to be built).

### 5b. Target inventory after remediation (illustrative — pending source + SME)

- **Hardwired Control Schematic (B):** NO contact, NC contact, relay/contactor coil, contactor aux contact, OL trip (NC) contact, PB-NO contact, PB-NC contact, LS-NO contact, LS-NC contact, E-stop NC contact, guard-interlock NC monitoring contact, timer-relay contact family (NOTC, NOTO, NCTO, NCTC) + timer-relay coil.
- **Power Circuit (C):** contactor power pole(s), OL thermal element, motor, fuse, disconnect blade, power-schematic breaker/poles.
- **One-Line (D):** one-line circuit breaker, one-line disconnect, one-line transformer, one-line fuse.
- **Physical Devices (A):** roller-lever limit switch, E-stop mushroom operator, guard-interlock switch, pushbutton operator, selector operator.
- **PLC Ladder Instructions (E):** XIC, XIO, OTE, OTL, OTU, TON, TOF, RTO (Rockwell names) — with the explicit note that XIC/XIO **evaluate a bit**, not a physical contact.
- **Functional Blocks (F):** safety relay/monitoring module, VFD/drive, photoelectric sensor.
- **Wiring (B/D):** terminal point, connected junction, crossing-not-connected.
- **Training Illustrations (G):** any device+contact composite, explicitly labeled.

---

## 6. Phase 2 problem-symbol dispositions (per your list)

1. **Timer** → REMOVE now. Re-add the *complete* electromechanical timer-relay family
   (coil; NO timed-closed / NO timed-open / NC timed-open / NC timed-closed) from ICS 19,
   each with behavior, initial state, timed transition, citation, example circuit — and
   keep it distinct from PLC **TON/TOF/RTO** in library E.
2. **Limit switch** → 3 cards: Roller-Lever LS (A), LS-NO contact (B), LS-NC contact (B).
3. **E-stop** → 2 cards: Mushroom operator (A), E-stop NC contact (B). Combined view only
   as a labeled G illustration.
4. **Guard interlock** → 2 cards: device (A), NC monitoring contact (B).
5. **Safety relay** → model as F module (safety inputs, reset/monitor, safety outputs,
   aux output). Do **not** ship as a coil.
6. **PLC** → separate E library with Rockwell names; state XIC/XIO evaluate bit state.
   Rename the hardwired section "Hardwired Control Schematic," never "ladder logic."
7. **VFD fault** → approved NO/NC contact tagged VFD-FLT (or terminal designation), state
   open/close-on-fault — pending drive fault-relay source.
8. **Circuit breaker** → separate one-line (D) vs power-schematic breaker/poles (C).
9. **Overload element** → verify exact NEMA thermal-OL element; keep power-circuit element
   (C) separate from control OL trip contact (B).
10. **Contactor power pole** → show 3 mechanically-linked poles, or label "One Contactor
    Power Pole."
11. **Terminal/junction** → 3 cards: terminal point; connected junction; crossing-not-connected.

---

## 7. SME review checklist (Phase 4 — human, not AI)

Reviewer role (one of): industrial controls engineer · electrical engineer (industrial
machinery) · senior controls technician · licensed electrician (motor-control schematics).

For **each** public symbol, the SME initials each:
- [ ] Symbol shape matches the cited source figure
- [ ] Symbol meaning is correct
- [ ] Circuit context (power vs control vs one-line vs PLC) is correct
- [ ] NO/NC (and normal/initial state) is correct
- [ ] Device-vs-contact distinction is correct
- [ ] NEMA/JIC consistency (no unlabeled IEC mixing)
- [ ] PLC instructions are separated from hardwired contacts
- [ ] Example print tag is labeled as an example
- [ ] Simplifications are declared and justified

Sign-off block: reviewer name · credential/license · date · symbols reviewed · exceptions.

---

## 8. Estimated work by phase (engineering estimate, excludes source procurement + SME calendar time)

| Phase | Work | Est. |
|---|---|---|
| 0 | Procure licensed ICS 19 + NFPA 79 (+ Eaton pub); assign SME | **External / blocking** |
| 1 | Implement `electricalSymbolTaxonomy.ts` + migrate registry to the record schema; split libraries (A–G) | 2–3 d |
| 2a | Remove-now items (timer, safety-relay-coil, PLC blocks) + reroute UI | 0.5 d |
| 2b | Redraw/split symbols against sourced geometry (LS×3, E-stop×2, guard×2, PB×2, selector×2, breaker split, OL element, terminal×3, contactor poles) | 4–6 d (source-gated) |
| 2c | Build PLC Ladder Instruction library (XIC/XIO/OTE/OTL/OTU/TON/TOF/RTO) | 2–3 d |
| 2d | Functional-block models (safety relay, VFD, photoeye) | 2–3 d |
| 3 | Remediation-table verification pass + SME cycle + fixes | 2 d + SME |
| — | **Total (excl. source/SME wait)** | **~13–18 dev-days** |

---

## 9. Risks & unresolved standards questions

- **R1 (blocking):** No licensed ICS 19 / NFPA 79 / Eaton access here → exact geometry
  cannot be verified in this environment. Someone with a licensed copy must supply the
  figures, or approve a documented deviation.
- **R2:** Copyright — ICS 19/NFPA figures cannot be copied; symbols must be *redrawn* to
  match the standard's geometry, which still requires seeing the licensed figure.
- **R3:** VFD fault relay is often **Form C**; "fault contact" NO-vs-NC depends on
  fail-safe wiring — needs a decision + drive-doc citation.
- **R4:** Timer family scope — do we teach all four timed-contact variants + coil, or
  defer timers entirely until sourced? (Recommend defer from foundational now.)
- **R5:** Pushbutton/selector — confirm whether EASLearn wants device+contact split for
  *all* operators (consistent) or only the high-risk ones (LS, E-stop, guard).
- **R6:** Motor 3-phase notation and one-line vs three-line breaker forms need explicit
  scope decisions.
- **R7:** IEC comparison layer (Eaton) — in scope now or a later phase?

---

## 10. Verdict

**NOT APPROVED — unresolved symbols.** No public symbol is source-verified against a
licensed authority in this environment, and no SME has reviewed the set. The set cannot
be called source-traceable or approved until Phase 0 (licensed sources + SME) is done.
The remediation path above is ready to execute on approval.
