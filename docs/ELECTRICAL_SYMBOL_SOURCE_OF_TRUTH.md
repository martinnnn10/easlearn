# EASLearn Electrical Symbol — Source of Truth & Remediation Plan (rev 2)

**Status: PLANNING / FOR REVIEW. No code changed for this document.**
Phase 1–3 remediation package. Gated on human SME review and, for *exact glyph geometry
only*, on licensed NEMA ICS 19. This is not a certification.

---

## 0. What is resolvable now vs what is genuinely blocked

Earlier revision over-used a single "WAITING_FOR_SOURCE" state. Corrected. Three things
are separable per symbol:

1. **Semantic meaning** — what the device/instruction *is* and does.
2. **Circuit/context** — power vs control vs one-line vs PLC vs functional block.
3. **Exact glyph geometry** — the precise NEMA/JIC line-art.

**(1) and (2) are resolvable now** from official public material (NEMA ICS 19 scope
listing; NFPA 79 structure/designations via NFPA LiNK preview; Rockwell instruction
documentation; Schneider limit-switch/NO-NC documentation; Siemens SIRIUS safety-relay
documentation). **(3) — exact NEMA line-art — needs licensed ICS 19** for the hardwired
symbols (PLC and functional-block geometry are set by vendor docs, not ICS 19).

Honesty note: this build environment could not fetch those pages **live** (outbound
fetch blocked), so no page/figure number is asserted below. Where a state is
`SOURCE_CONFIRMED` it means the meaning/context is the documented, non-disputed function
per the named public source — not a fabricated page citation. Every symbol still needs
**SME sign-off** (Phase 4); no SME has reviewed this set.

---

## 1. Chosen EASLearn standard (locked)

- **Primary:** North American **NEMA / JIC hardwired motor-control schematics** (relay logic).
- **PLC ladder instructions are a separate library** (bit/timer instructions).
- **IEC** only later, as a **clearly labeled comparison** (Eaton MZ081001EN), never mixed in unidentified.

---

## 2. Taxonomy — one context per symbol

| ID | Context | Definition | Members |
|----|---------|-----------|---------|
| **A** | `PHYSICAL_DEVICE` | The real operator/device as a pictorial, not its contact | Roller-lever LS body; E-stop mushroom operator; guard-interlock body; pushbutton/selector operators |
| **B** | `HARDWIRED_CONTROL_SCHEMATIC` | NEMA/JIC relay-logic control-circuit elements | NO/NC contacts; relay/contactor coil; aux contact; OL trip contact; PB-NO/NC; LS-NO/NC; E-stop NC; guard NC monitoring; timer-relay coil + timed contacts |
| **C** | `POWER_CIRCUIT` | Motor/load power-path symbols | Contactor power poles; OL thermal element; motor; fuse; disconnect blade |
| **D** | `ONE_LINE_DIAGRAM` | Single-line distribution symbols | One-line breaker; one-line disconnect; one-line xfmr/fuse |
| **E** | `PLC_LADDER_INSTRUCTION` | **Bit/timer instructions only** — evaluate/act on a bit | XIC, XIO, OTE, OTL, OTU, TON, TOF, RTO |
| **F** | `FUNCTIONAL_BLOCK` | Multi-terminal functional blocks (incl. **PLC hardware**) | Safety-relay/monitoring module; VFD/drive; photoelectric sensor; **PLC digital input module; PLC digital output module; PLC rack/module; physical terminals/channels** |
| **G** | `TRAINING_ILLUSTRATION` | Deliberate EASLearn composites (device + contact), **explicitly labeled** | "E-stop operator shown with its NC contact" teaching card |

**Correction locked in:** PLC **I/O modules** are hardware → **F (FUNCTIONAL_BLOCK / PLC
hardware)**. PLC **instructions** (XIC/XIO/OTE/…) → **E**. They are not the same thing; a
PLC input module is a physical block with terminals, while XIC is a bit-evaluation
instruction on a rung.

---

## 3. Source-state vocabulary (per axis) + record schema

Per-symbol states (a symbol carries one per axis):

- **SOURCE_CONFIRMED** — meaning and/or context established by an official public source.
- **GEOMETRY_PENDING_LICENSED_STANDARD** — meaning/context confirmed; exact NEMA glyph still needs ICS 19.
- **SME_REVIEW_PENDING** — needs qualified human sign-off (applies to all public symbols).
- **REMOVE** — remove from the public library.
- **REDRAW** — geometry must be redrawn to the sourced form.
- **MOVE_TO_DIFFERENT_LIBRARY** — currently in the wrong context.

```ts
// proposed shared/electricalSymbolTaxonomy.ts — NOT yet implemented
export interface SymbolRecord {
  id: string;
  name: string;
  context: SymbolContext;            // exactly one (A–G)
  represents: string;
  noNc?: "NO" | "NC" | "n/a";
  normalState?: "open" | "closed" | "n/a";
  circuit?: "power" | "control" | "one_line" | "plc" | "n/a";
  designation: string;               // M, CR, OL, LS, PB, XIC, TON…
  meaning: "SOURCE_CONFIRMED" | "PENDING";
  contextConfirmed: "SOURCE_CONFIRMED" | "PENDING";
  geometry: "SOURCE_CONFIRMED" | "GEOMETRY_PENDING_LICENSED_STANDARD";
  publicSource?: { org: string; document: string; url?: string; fetchedLive: boolean };
  licensedGeometrySource?: string;   // e.g. "NEMA ICS 19 figure (TBD)"
  smeReview: "SME_REVIEW_PENDING" | "PASS" | "FAIL";
  action: "KEEP" | "REDRAW" | "REMOVE" | "MOVE_TO_DIFFERENT_LIBRARY" | "SPLIT";
  simplified: boolean;
  simplificationReason?: string;
  exampleTag?: string;               // labeled EXAMPLE
}
```

---

## 4. Source register — what each authority resolves + access

| # | Source | Resolves | Access |
|---|--------|----------|--------|
| 1 | **NEMA ICS 19** | **Exact hardwired glyph geometry**; device designations | Scope/listing public; **full standard licensed — geometry not fetched here** |
| 2 | **NFPA 79 (2024)** (NFPA LiNK preview) | Machine doc structure, device/component **designations**, safety-circuit context | Preview/structure public; full text licensed |
| 3 | **Rockwell — Bit Instructions** | **XIC/XIO/OTE/OTL/OTU semantics + ladder geometry** (bit evaluation, not physical contacts) | Public (not fetched live); definitions established |
| 4 | **Schneider — Limit Switches** | Limit-switch signal is **explicitly NO or NC**; operation | Public; definitions established |
| 5 | **AutomationDirect / Schmersal roller-lever LS** | **Physical device** + separate NO and NC contacts | Public product docs |
| 6 | **Siemens SIRIUS safety relay** | Safety relay = **functional module** (inputs, reset/monitor, safety outputs, aux) | Public; definitions established |
| 7 | **Rockwell Guardmaster cut sheet** | Dual-channel input, safety outputs, aux output, reset, time-delay | Public product doc |
| 8 | **AutomationDirect on-delay timer relay** | Physical timer relay & operation (not license to invent a glyph) | Public product doc |
| 9 | **Eaton MZ081001EN** | Labeled NEMA↔IEC comparison layer | Publication — not fetched; do not cite reposts |

**Bottom line:** meaning/context is resolvable from 1(scope)–8 now; **exact hardwired
geometry is the one thing gated on licensed ICS 19 (source 1).** PLC (3) and functional-block
(6,7) geometry are set by vendor docs, so those are not ICS-19-gated.

---

## 5. Remediation table — current 25 symbols

Legend: **M**=meaning, **Cx**=context, **G**=geometry. ✅ = SOURCE_CONFIRMED · ⛔ =
GEOMETRY_PENDING_LICENSED_STANDARD. **All rows are additionally SME_REVIEW_PENDING.**

| Current ID | Target context | M | Cx | G | Public source (meaning/context) | Action |
|---|---|:--:|:--:|:--:|---|---|
| `contact_no` | B | ✅ | ✅ | ⛔ | Schneider NO/NC; NEMA ICS 19 scope; NFPA 79 designations | **KEEP** · redraw to ICS 19 glyph when available |
| `contact_nc` | B | ✅ | ✅ | ⛔ | Schneider NO/NC | **KEEP** · geometry pending |
| `coil` | B | ✅ | ✅ | ⛔ | NEMA/JIC relay-coil convention | **KEEP** · geometry pending |
| `contactor_aux` | B | ✅ | ✅ | ⛔ | NEMA ICS 2/19 aux-contact convention | **KEEP** · geometry pending |
| `overload_nc` | B | ✅ | ✅ | ⛔ | OL trip-contact function; **designation 95-96 is IEC — confirm NEMA form** | **KEEP** · verify designation + geometry |
| `pb_no` | **split A + B** | ✅ | ✅ | ⛔ | Operator vs contact (Schneider) | **SPLIT** (PB operator = A; PB-NO contact = B) |
| `pb_nc` | **split A + B** | ✅ | ✅ | ⛔ | same | **SPLIT** |
| `selector_switch` | **split A + B** | ✅ | ✅ | ⛔ | Operator vs contact; # positions to define | **SPLIT** |
| `limit_switch` | **split A + B + B** | ✅ | ✅ | ⛔ | Schneider (explicit NO/NC) + Schmersal/ADC (device) | **SPLIT into 3** (roller-lever device = A; LS-NO = B; LS-NC = B) |
| `estop` | **split A + B** | ✅ | ✅ | ⛔ | NFPA 79 / ISO 13850 (NC in safety string) | **SPLIT** (mushroom operator = A; E-stop NC contact = B); combined only as labeled G |
| `guard_switch` | B (+ add A) | ✅ | ✅ | ⛔ | Guard-interlock NC monitoring | **KEEP contact + ADD device (A)** |
| `timer_contact` | B (family) + E (separate) | ✅ | ✅ | ⛔ | Timer-relay behaviors (ADC timer relay); TON/TOF (Rockwell) | **REMOVE custom glyph now**; rebuild timer-relay family from ICS 19; keep separate from PLC TON |
| `contactor_power` | C | ✅ | ✅ | ⛔ | Contactor power pole (NEMA ICS 2/19) | **REDRAW/RENAME** (3 linked poles, or "One Contactor Power Pole") |
| `overload_heater` | C | ✅ | ✅ | ⛔ | Thermal-OL element in power path; **zigzag likely wrong** | **REDRAW** to ICS 19 thermal-element form |
| `motor` | C | ✅ | ✅ | ⛔ | Motor symbol (circle + M); 3-phase notation | **KEEP** · confirm 3-phase form |
| `fuse` | C/D | ✅ | ✅ | ⛔ | Fuse function | **KEEP** · confirm NEMA vs IEC rectangle |
| `disconnect` | C/D | ✅ | ✅ | ⛔ | Knife/isolator | **KEEP** · confirm power vs one-line form |
| `transformer` | C/D | ✅ | ✅ | ⛔ | Control transformer | **KEEP** · geometry pending |
| `breaker` | **split D + C** | ✅ | ✅ | ⛔ | Box-with-X = drawout/one-line only | **SPLIT** (one-line = D; power-schematic breaker/poles = C) |
| `terminal` | **split** (B/D wiring) | ✅ | ✅ | ⛔ | Connected junction vs crossing conventions (IEEE 315 widely used) | **SPLIT into 3** (terminal point; connected junction; crossing-not-connected) |
| `plc_input` | **F (PLC hardware)** | ✅ | ✅ | ✅ | Rockwell I/O module = hardware block (NOT an instruction) | **KEEP in F** · rename "PLC Digital Input Module" |
| `plc_output` | **F (PLC hardware)** | ✅ | ✅ | ✅ | same | **KEEP in F** · rename "PLC Digital Output Module" |
| `photoeye` | F (or A) | ✅ | ✅ | ✅ | Photoelectric sensor device block | **KEEP** · classify F/A; block geometry ok |
| `vfd` | F (block) **or** B (fault contact) | ✅ | ⏳ | ⛔ | Drive fault-relay is often **Form C**; NO/NC + open/close-on-fault undecided | **REDRAW/DECIDE** — split "VFD/drive block" (F) from "VFD fault contact" (B) |
| `safety_relay` | **F (module)** | ✅ | ✅ | ✅ | Siemens SIRIUS / Guardmaster — functional module | **REDRAW as module (F)**; a coil glyph may appear **only** where a hardwired coil is genuinely drawn, never for the whole module |

**New library to build — E `PLC_LADDER_INSTRUCTION`** (geometry SOURCE_CONFIRMED via Rockwell, SME pending):
| Item | M | Cx | G | Source |
|---|:--:|:--:|:--:|---|
| XIC, XIO | ✅ | ✅ | ✅ | Rockwell — bit instructions (evaluate a bit; **not** physical NO/NC) |
| OTE, OTL, OTU | ✅ | ✅ | ✅ | Rockwell |
| TON, TOF, RTO | ✅ | ✅ | ✅ | Rockwell (distinct from electromechanical timer-relay contacts) |

### 5a. Act now
- **REMOVE the custom `timer_contact` glyph** (do not replace with another custom glyph); rebuild the timer-relay family from ICS 19 later.
- **REDRAW `safety_relay` as a functional module (F)** — stop representing the whole module as a coil.
- **Do NOT move `plc_input`/`plc_output` into the instruction library** (that was the earlier error) — keep them as **F PLC-hardware** blocks and rename to "…Module"; **build a separate E library** for XIC/XIO/OTE/OTL/OTU/TON/TOF/RTO.
- **SPLIT** limit switch (×3), E-stop (×2), guard (+device), pushbuttons (×2 each), selector (×2), breaker (one-line vs power), terminal (×3).

### 5b. What is already resolved vs still blocked
- **Resolved now (meaning + context, SOURCE_CONFIRMED):** every row's M and Cx columns above — the taxonomy, device meanings, NO/NC behavior, PLC-instruction-vs-hardware separation, limit-switch NO/NC separation, and safety-relay-as-module are all settled.
- **Blocked on licensed ICS 19 (geometry only, ⛔):** exact hardwired glyph line-art for the B/C/D symbols.
- **Not ICS-19-blocked (geometry SOURCE_CONFIRMED):** PLC instructions (E, Rockwell) and functional blocks (F: safety module, PLC I/O modules, VFD, photoeye).
- **Blocked on SME:** all public symbols (Phase 4).

---

## 6. Phase 2 problem-symbol dispositions (corrected)

1. **PLC I/O vs instructions** → I/O modules = **F (PLC hardware)**, renamed "…Module";
   XIC/XIO/OTE/OTL/OTU/TON/TOF/RTO = **E**. XIC/XIO evaluate a bit; they are not physical contacts.
2. **Safety relay** → primary form = **F module** (safety inputs, reset/monitor, safety
   outputs, aux). A **coil** glyph is valid **only** in a genuine hardwired coil context, and
   never stands for the whole module.
3. **Limit switch** → 3 cards: roller-lever device (A), LS-NO contact (B), LS-NC contact
   (B). No combined "NO/NC" card; no physical actuator used as the contact.
4. **E-stop** → mushroom operator (A) + E-stop NC contact (B); combined view only as labeled G.
5. **Guard interlock** → device (A) + NC monitoring contact (B).
6. **VFD fault** → decide NO/NC + open/close-on-fault (drive fault relay often Form C); split
   drive block (F) from fault contact (B).
7. **Circuit breaker** → one-line (D) vs power-schematic breaker/poles (C).
8. **Overload element** → power-circuit thermal element (C, redraw to ICS 19) vs control OL
   trip contact (B) — kept separate.
9. **Contactor power pole** → 3 linked poles or "One Contactor Power Pole" (C).
10. **Terminal/junction** → terminal point; connected junction; crossing-not-connected.
11. **Timer** → remove custom glyph; rebuild timer-relay family (coil; NO timed-closed/open;
    NC timed-open/closed) from ICS 19; keep separate from PLC TON/TOF/RTO.

---

## 7. SME review checklist (Phase 4 — human)

Reviewer (one of): industrial controls engineer · electrical engineer (industrial
machinery) · senior controls technician · licensed electrician (motor-control schematics).
Per symbol, initials each: shape matches cited figure · meaning correct · circuit context
correct · NO/NC + normal state correct · device-vs-contact correct · NEMA/JIC consistency
(no unlabeled IEC) · PLC instructions separated from hardwired contacts · example tag
labeled as example · simplifications declared. Sign-off: name · credential · date ·
symbols reviewed · exceptions.

---

## 8. Estimated work by phase

| Phase | Work | Est. |
|---|---|---|
| 0 | Acquire licensed ICS 19 (geometry only) + assign SME | External / partial-block |
| 1 | Implement `electricalSymbolTaxonomy.ts` (record schema w/ per-axis states); migrate registry; split libraries A–G | 2–3 d |
| 2a | Act-now: remove timer glyph; safety-relay→module; rename PLC I/O modules; stand up E instruction library (geometry already sourced) | 1.5 d |
| 2b | Splits + redraws for B/C/D (geometry-gated on ICS 19): LS×3, E-stop×2, guard, PB×2, selector, breaker, OL element, terminal×3, contactor poles | 4–6 d (geometry-gated) |
| 2c | Functional blocks (F): safety module, PLC I/O modules, VFD, photoeye (geometry sourced) | 2–3 d |
| 3 | Remediation-table verification + SME cycle + fixes | 2 d + SME |
| — | **Total (excl. ICS-19/SME wait)** | **~12–16 dev-days** |

Note: 2a, 2c and the E library are **not** ICS-19-gated and can proceed first.

---

## 9. Risks & unresolved questions

- **R1 (partial block):** Exact **hardwired glyph geometry** (B/C/D) needs licensed ICS 19.
  Everything else — taxonomy, meaning, context, PLC/functional-block geometry — is resolvable now.
- **R2:** Copyright — redraw to match ICS 19 geometry; still need to see the licensed figure.
- **R3:** VFD fault relay Form-C — decide the taught NO/NC + fail-safe behavior + designation.
- **R4:** Timer scope — rebuild the full timer-relay family now (defer geometry) or defer entirely?
- **R5:** Operator device-vs-contact split for **all** operators (PB, selector, LS, E-stop, guard) — confirm consistency.
- **R6:** Motor 3-phase notation; one-line vs three-line breaker scope.
- **R7:** IEC comparison layer (Eaton) — scope now or later.

---

## 10. Verdict

**NOT APPROVED — exact geometry and SME review pending.**

But the blocked scope is now precise, not total: **meaning, context, taxonomy, PLC
instruction-vs-hardware separation, limit-switch NO/NC separation, and safety-relay-as-module
are RESOLVED (SOURCE_CONFIRMED)**. What remains: (a) exact hardwired glyph geometry from
licensed ICS 19 for the B/C/D symbols, and (b) qualified human SME sign-off across the set.
The act-now items and the PLC/functional-block work are not geometry-blocked and can start
on approval.
