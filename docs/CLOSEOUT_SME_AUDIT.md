# Closeout / Operator Role-Play SME Audit

**Scope:** technical accuracy audit of the six apprenticeship closeouts (`shared/lessonCloseouts.ts`) against the actual lesson decks. Structure tests prove the configs are complete and unique; this audit proves they are **industrially accurate** — reviewed as a senior maintenance technician, maintenance supervisor, reliability engineer, plant safety leader, and production supervisor would read them.

**Date:** 2026-07-05 · **Auditor:** internal (AI + deck cross-read). Where noted, a human SME pass is still recommended before enterprise-flagship marketing claims.

**Method:** each closeout was read against its deck's actual cards (headings, takeaways, knowledge checks) — not against the closeout's own intent. Findings were fixed directly in `shared/lessonCloseouts.ts`.

---

## 1. Motor Control Circuits (flagship)
- **Module:** `motors-controls/motor-control-circuits` · domain `motors` · persona: rushed
- **Closeout:** overload opened → tech metered the control string, **found why the overload tripped, corrected the cause**, reset → operator wants to self-reset next time.
- **Verdict:** ✅ **Approved with edits**
- **Issue found:** the scenario originally said the tech "verified the control circuit and reset it" — it did **not state the trip cause was found before reset**, contradicting the lesson's own discipline ("found the open device? Now ask *why* it's open before you reset").
- **Edit made:** scenario now explicitly includes finding and correcting the cause before reset.
- **Lesson support:** full — two-circuits, seal-in, series string, meter-the-string, meter-before-replace, and why-before-reset are all taught.
- **Employer-facing:** ready.

## 2. E-Stop & Safety Chains
- **Module:** `safety-systems/estop-circuits` · domain `safety` · persona: corner-cutting
- **Closeout:** one E-stop in the chain tripped → tech found which device, verified WHY before resetting → operator tempted to pull it back out next time.
- **Verdict:** ✅ **Approved with edits**
- **Issue found:** the deck explicitly teaches the **unexpected-restart hazard** ("assume the machine may move the instant you reset a safety — clear the area first"), but the closeout prompts didn't require it. That's a safety-communication gap.
- **Edits made:** reflection, operator, work-order, and handoff prompts now all include confirming a safe state / clear area before any reset ("machines can move the moment the chain is made").
- **Safety check:** does NOT imply an E-stop can be reset without understanding why it was pressed — the reason-before-reset requirement is explicit in scenario and prompts. Never-bypass is reinforced by the deck's own "unforgivable shortcut" card.
- **Lesson support:** full. **Employer-facing:** ready.

## 3. Motor Starter Troubleshooting
- **Module:** `motors-controls/starter-troubleshooting` · domain `motors` · persona: frustrated
- **Closeout:** starter wouldn't pull in (control-side per the deck's own split) → metered the string, found the open device, fixed the cause → operator burned by repeat downtime.
- **Verdict:** ✅ **Approved with edits**
- **Issues found:** (a) "jumpering the starter" was technically loose — clarified to "jumpering the **control circuit**"; (b) confirmed the repeat-failure framing matches the deck (intermittent no-starts = loose connections — a realistic repeat-downtime cause, not invented).
- **Anti-parts-changing check:** the deck's opening story is literally "$600 of parts, and the fuse was blown"; the closeout requires verification (readings, open device, root cause) before parts in the work order. Aligned.
- **Lesson support:** full. **Employer-facing:** ready.

## 4. PowerFlex VFD Fault Codes
- **Module:** `powerflex-vfd/fault-codes-diagnostics` · domain `vfd` · persona: rushed
- **Closeout:** drive tripped → fault queue recorded → measured toward likely cause → **corrected the condition and verified stable restarts** → operator wants to power-cycle every time.
- **Verdict:** ✅ **Approved with edits**
- **Issue found:** the scenario originally said "checked the likely cause, cleared the fault" — skipping the deck's own pre-reset sequence ("**Record, measure, correct, then reset**") and post-fix verification ("a fix is complete only when repeat cycles stay stable").
- **Edit made:** scenario now follows record → measure → correct → verify-stable-restarts.
- **Certainty check:** work order asks for "likely cause" and "whether the fault is understood or recurring" — likelihood language, not false certainty. Does NOT imply resets solve faults; requires code capture, condition awareness (load/heat/supply in the handoff), and escalation on repeats.
- **Lesson support:** full (queue history, classification, F004/F006 examples, pre-reset procedure all taught). **Employer-facing:** ready.

## 5. PLC I/O Troubleshooting
- **Module:** `plc-fundamentals/io-troubleshooting` · domain `plc` · persona: confused
- **Closeout:** input never reached the PLC → tech **started at the input card LED and worked back** through terminal strip and wiring to the field device.
- **Verdict:** ⚠️ **Needed rework — fixed**
- **Issues found (the most significant of the audit):**
  1. **Trace direction was backwards.** The config said "traced from the field device through the wiring to the input card." The deck teaches the opposite, explicitly: "Start at the input card, not the program… input card → terminal strip → device — in that order, every call." A closeout contradicting the lesson's core method would have graded learners against the wrong procedure.
  2. **Forcing nuance.** "Forcing the input" was framed as flatly unsafe. The deck's actual teaching is "meter before forcing — never force blind" — forcing is a real, controlled tool. Reworded: forcing requires **authorization and procedure** and never substitutes for fixing the wiring (the operator temptation is now "make the PLC ignore that sensor," which is the realistic operator phrasing).
- **Edits made:** scenario, reflection prompt, and work-order trace path all reversed to card-LED-first; unsafe temptation reworded per above.
- **Lesson support:** full after fixes. **Employer-facing:** ready.

## 6. Proximity & Photoelectric Sensors
- **Module:** `sensors-instrumentation/proximity-photoelectric` · domain `sensors` · persona: frustrated
- **Closeout:** phantom-jam photoeye → tech **watched the sensor's own output LED first**, found filmed lens + slight misalignment, cleaned/realigned, verified output.
- **Verdict:** ✅ **Approved with edits**
- **Issue found:** the scenario skipped the deck's first tool — "the sensor's own light is your first tool." Edited so the diagnostic order matches the lesson (LED → dirt/alignment → verify), and the cause reflects the deck's likelihood ordering (dirt/misalignment before dead sensor).
- **Safety check:** the operator's "reaching over and waving at the eye" temptation is universal plant-floor safety (never reach into a running machine), not a lesson-specific concept — acceptable for the learner to answer from general safety judgment; the tape-over-the-eye pattern is in the classifier. Not overgeneralized.
- **Lesson support:** full. **Employer-facing:** ready.

---

# Batch 2 (2026-07-05)

Closeouts written **from the decks' actual cards** (not adapted from batch 1), then audited to the same standard.

## 7. Guarding & Lockout/Tagout
- **Module:** `safety-systems/guarding-lockout` · domain `safety` · persona: corner-cutting
- **Closeout:** jam cleared under full LOTO (every energy source, stored energy released, zero verified, guard back on) → operator floats bypassing the guard switch until end of shift.
- **Verdict:** ✅ **Approved**
- **Deck support:** complete — the deck itself teaches every beat used: "isolate EVERY energy source," "verify zero," "guards… never bypassed to keep production moving," "no jam quick enough to skip LOTO," and "a tag warns; a lock protects" (quoted nearly verbatim in the operator prompt).
- **Safety check:** does not imply any bypass/authorization gray area — guard bypass is flatly refused, matching the deck's "unforgivable shortcut" stance. Restart thinking (guard reinstated before run) explicit.
- **Employer-facing:** ready.

## 8. Overload Protection
- **Module:** `motors-controls/overload-protection` · domain `motors` · persona: rushed
- **Closeout:** repeat-tripping overload → tech investigates per the deck's own sequence (turn shaft, check load, clamp amps, meter all three legs, verify setting vs nameplate FLA) → cause corrected → reset LAST. Operator asks to keep resetting **or turn the setting up** — both of the deck's cardinal sins.
- **Verdict:** ✅ **Approved**
- **Deck support:** complete — "reset eleven times, then it caught fire," the six trip causes, the investigate-before-reset procedure, and "cranking it up is sabotage" are all deck content.
- **Edit during audit:** added a classifier pattern for turn-the-overload-up advice ("defeat overload protection") so that unsafe suggestion is caught, not just discouraged.
- **Employer-facing:** ready.

## 9. Motor Testing
- **Module:** `motors-controls/motor-testing` · domain `motors` · persona: curious
- **Closeout:** suspected-bad motor **proved good** by the deck's four tests (shaft turn, winding resistance, megger with the motor disconnected, clamp amps) — real fault was a binding load. Operator: "is the motor bad or not?"
- **Verdict:** ✅ **Approved**
- **Deck support:** complete — mirrors the deck's opening story ("a day to change a motor that was fine") and its "prove it before you pull it" method. Megger isolation/discharge safety is carried into the work-order prompt.
- **Certainty check:** verdict-with-evidence framing; no symptom-only guessing rewarded.
- **Employer-facing:** ready.

## 10. Communication Faults (EtherNet/IP)
- **Module:** `plc-fundamentals/communication-faults` · domain `plc` · persona: rushed
- **Closeout:** dropping adapter → physical layer first (link LED, patch cord) → ping → I/O tree fault code → **duplicate IP found, unique address assigned and documented**. Operator wants to power-cycle the panel every time.
- **Verdict:** ✅ **Approved**
- **Deck support:** complete — the check order is the deck's own field procedure ("ping + link LED + I/O tree status — in that order"), the duplicate-IP cause is the deck's opening story, "a duplicate IP never heals itself" and "power cycle alone does not configure" are deck takeaways.
- **Safety framing check:** power-cycling flagged for the right reasons (uncontrolled restart + masks cause), not overgeneralized; no hardware-swap-first behavior implied — matches the "fix the wire before the program" discipline.
- **Employer-facing:** ready.

## 11. Sensor Types Overview
- **Module:** `sensors-instrumentation/sensor-types-overview` · domain `sensors` · persona: confused
- **Closeout:** replacement sensor didn't work — output type (NPN) mismatched the input card (PNP); card LED checked first; correct type fitted and verified. Operator has been hand-triggering the sensor to keep the machine cycling.
- **Verdict:** ✅ **Approved (kept intentionally introductory)**
- **Deck support:** complete for the level — NPN/PNP-vs-card-type ("confirm output style and input card type before termination") and card-LED-first ("fast truth checks") are the deck's own content. The closeout deliberately does NOT use the deck's analog/4–20 mA material — the discrete-swap scenario stays within what an intro learner practiced.
- **Safety framing check:** hand-triggering is framed as masking a fault **and** a hand-near-moving-equipment risk (universal plant safety, not overreach); the reach-into-machine classifier pattern covers the hard case.
- **Employer-facing:** ready.

---

## Cross-cutting findings
- **Domains verified:** all six map correctly (`safety`, `motors` ×2, `vfd`, `plc`, `sensors`) via `MODULE_SKILL_DOMAIN`.
- **No concept leakage:** no closeout asks the learner to explain something its deck doesn't teach. The two near-misses (E-stop restart hazard, VFD verify-stable-restarts) were concepts the decks DO teach that the closeouts under-used — fixed by strengthening the closeouts, no lesson edits needed.
- **No exaggerated temptations:** every unsafe temptation is a documented real-world behavior (self-resetting overloads, pulling E-stops back out, power-cycling drives, asking to ignore sensors, waving at photoeyes) — nothing invented for drama.
- **Certainty discipline:** all work-order prompts use "likely cause" / "whether understood or recurring" language where the lesson supports likelihood, not certainty.

## Verdicts summary
| Lesson | Verdict | Employer-facing |
|---|---|---|
| Motor Control (flagship) | Approved with edits | ✅ |
| E-stop circuits | Approved with edits | ✅ |
| Starter troubleshooting | Approved with edits | ✅ |
| VFD fault codes | Approved with edits | ✅ |
| PLC I/O | Needed rework — fixed | ✅ |
| Photoeye/prox | Approved with edits | ✅ |
| Guarding/LOTO | Approved | ✅ |
| Overload protection | Approved | ✅ |
| Motor testing | Approved | ✅ |
| Communication faults | Approved | ✅ |
| Sensor types overview | Approved (intro-level) | ✅ |

## Remaining assumptions (honest)
- This audit was performed by cross-reading the closeouts against the decks' actual content, applying standard industrial practice (NFPA 70E-adjacent safety discipline, standard PLC I/O and drive troubleshooting method). **A 15-minute pass by a human senior technician remains recommended** before these six are cited in enterprise sales claims — particularly the VFD fault-code specifics and any plant-specific reset/authorization policies, which vary by site.
- Closeouts intentionally note when something is plant-specific (forcing authorization, reset procedures); the mentor's system prompt also instructs it to say so.

*Update this document whenever a closeout is added or edited. A deck may not enable `reflection: true` without passing this audit.*
