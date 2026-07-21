# Hydraulic Pressure-Loss Diagnostic Simulator — Design Spec

**Status: DESIGN — awaiting approval before implementation.**
**Goal:** prove EASLearn expands beyond electrical/PLC/VFD into another high-downtime domain by teaching *hydraulic troubleshooting judgment* — not recall. This is the first P1 white-space build from the EASLearn competitive build-priority analysis (hydraulics: broad-but-shallow in incumbent catalogs, high downtime, zero simulation).

The bar: it must feel like a real maintenance lab, not a multiple-choice quiz in a hydraulic costume. The learner isolates a section, reads gauges, separates *verified* from *assumed*, and commits to a cause — and pays for guessing or for an unsafe move.

It reuses the existing systems, not a new stack:
- **Engine:** the V3 scenario engine (`client/src/data/scenariosV3.ts` — `ScenarioV3`, phases, measurement locations, `SystemAction`, `Fault`, `ScoringRules`, `SeniorCheckpoint`, communications). Only the *diagram* layer is electrical today; everything else is domain-agnostic.
- **Evidence:** the Assessment Spine (`shared/assessmentSpine.ts` — `EvidenceEvent → interpretEvidence → rollupDomain → deriveReadiness`). **No new scoring system.**
- **Closeout:** the closeout registry + AI operator role-play (`shared/lessonCloseouts.ts`, `shared/maintenanceMentor.ts`).

---

## 1. Simulator concept

**Machine (the twin):** a hydraulic power unit (HPU) driving a **press/clamp cylinder** on a production line. One reservoir, one pump, one system relief, a pressure filter, a solenoid directional control valve (DCV), and a work cylinder. The symptom that pages the tech: *"the press is slow / weak / won't build pressure."* Same everyday call that Vector has 23 courses *describing* and zero letting you *solve*.

**Components modeled**

| Component | Role | Learner-observable |
|---|---|---|
| Reservoir + sight glass | Fluid supply, condition | Level, foam/aeration, temperature |
| Suction strainer | Protects pump inlet | Cavitation noise when restricted |
| Pump (fixed-displacement) | Makes **flow** | Sound, outlet pressure P1, flow |
| System relief valve | Caps pressure; dumps excess to tank | Setting, return-line temperature |
| Pressure filter + ΔP indicator | Cleans oil; restriction point | Clog indicator, ΔP across it |
| Directional control valve (DCV) | Sends flow to extend/retract | Solenoid signal, spool position |
| Work cylinder (press ram) | Does the work | Speed, drift, holding pressure |
| Gauges P1/P2/P3 + flow meter | The diagnostic instruments | PSI at pump outlet / work port / tank line; GPM |

**Core teaching point:** *pressure and flow are not the same thing.* Pump makes **flow**; pressure is **resistance to flow**. Low pressure with good flow ≠ low pressure with no flow. The whole sim trains the learner to reason from **where** pressure is present vs absent — the hydraulic analog of voltage-drop troubleshooting they already learned in the electrical decks. That transfer is the wedge.

---

## 2. The diagnostic method the sim enforces

The engine's `advanceConditions` (required clues + required action) and `ScoringRules` are configured so the learner cannot brute-force it. The method is the graded object:

> **Observe → Check prints → Check pressure at the source → Isolate the section → Verify the cause → Act (safely) → Close the ticket.**

- **Observe** — symptom, sounds, sight glass, temperature, indicators. (Cheap, rewarded first.)
- **Check prints** — the hydraulic schematic; know normal pressures/flow *before* metering.
- **Check pressure at the source** — P1 at the pump outlet: is the pump even making pressure?
- **Isolate the section** — walk P1 → filter → DCV → work port. Pressure present upstream, absent downstream = the restriction/loss is between them (KVL-for-fluids).
- **Verify the cause** — distinguish look-alikes (weak pump vs relief dumping vs clogged filter) with a confirming test, not a guess.
- **Act safely** — relieve stored energy, support loads, stay within rated pressure.
- **Close** — operator explanation + work order + handoff.

Skipping observation to jump straight to "replace the pump" is *allowed* — and it plays out (wrong, costly, `unnecessaryMeasurementPenalty` / wrong-fix consequence), which is the productive-failure lesson.

---

## 3. Fault scenarios

One twin, **six selectable fault variants** (mirrors the existing VFD lab: one drive, many fault scenarios). Each is a `Fault` (+ phase) with a distinct **gauge signature** and a **novice trap** — the wrong-but-tempting cause a shallow tech would grab. The signatures are engineered so only *isolation* separates them.

Notation: **P1** pump outlet · **P2** work-port (after filter+DCV) · flow = ram speed.

### F1 — Clogged pressure filter *(flagship teaching scenario)*
- **Symptom:** ram slow and weak; system "won't make pressure."
- **Gauge signature:** P1 **high/normal**, P2 **low**, large **ΔP across the filter**, clog indicator popped, oil warm downstream.
- **Novice trap:** "pump's weak — replace the pump."
- **Correct isolation:** pressure is *present at the pump, lost across the filter* → restriction, not a weak pump. Confirm with the ΔP / indicator.
- **Fix:** relieve pressure, replace the filter element, find why it loaded (contamination source).
- **Safety gate:** bleed system pressure and confirm **0 PSI** before opening the filter housing (trapped pressure).
- **Teaches:** pressure-present-upstream / absent-downstream = the loss is between the gauges.

### F2 — Low fluid level
- **Symptom:** erratic pressure, noisy pump, foamy oil, intermittent ram motion.
- **Gauge signature:** P1 **fluctuating/low**, sight glass **low**, aeration in reservoir, rising temperature.
- **Novice trap:** "relief valve is bad" or "pump is cavitating — replace pump."
- **Correct isolation:** *observe first* — the sight glass answers it before any gauge. Cavitation/aeration signature ≠ mechanical pump failure.
- **Fix:** top up to spec, then find the **leak** (don't just refill and walk).
- **Safety gate:** never run the pump dry; hot oil.
- **Teaches:** the cheapest observation (sight glass) often beats instrumentation; find the *why*, not just the *what*.

### F3 — Relief valve stuck open / misadjusted
- **Symptom:** whole system sluggish; "no pressure anywhere."
- **Gauge signature:** P1 **low even at deadhead**, relief **return line warm/hot** (oil dumping to tank), pump making noise/flow but pressure bleeds off.
- **Novice trap:** "pump can't build pressure — replace the pump."
- **Correct isolation:** the pump *is* making flow; the relief is dumping it. Confirm by relief-line temperature + a deadhead test + relief setting.
- **Fix:** clean/reset/replace the relief; set to spec.
- **Safety gate:** when adjusting, **never exceed rated pressure** — back off, then bring up to spec; watch the gauge.
- **Teaches:** low pressure with flow present points *past* the pump; a warm relief line is a tell.

### F4 — Pump not building pressure (internal wear / bypass) *(capstone)*
- **Symptom:** low pressure *and* low flow.
- **Gauge signature:** P1 **low**, P2 **low**, relief line **cold** (not bypassing), sight glass **OK**, filter ΔP **normal**.
- **Novice trap:** grabbing "pump" *first* (right answer, wrong method).
- **Correct isolation:** you may only conclude "pump" after eliminating level (F2), filter (F1), and relief (F3). Confirm with a flow test at rated RPM.
- **Fix:** replace/rebuild the pump.
- **Teaches:** the mentor's key case — **right answer for the wrong reason is not mastery.** Reached by elimination, "pump" is competence; grabbed first, it's a lucky guess and scored as weak reasoning.

### F5 — Directional valve not shifting *(cross-domain tie-in)*
- **Symptom:** system builds pressure, but the ram won't move (or moves one way only).
- **Gauge signature:** P1 **high** (deadheaded at relief), P2 at work port **~0**, solenoid may or may not be energized.
- **Novice trap:** "no pressure at the cylinder — hydraulic problem," missing that it's often **electrical** (no solenoid signal) vs mechanical (stuck spool).
- **Correct isolation:** split it — check the **solenoid signal** (their electrical strength!) *and* spool movement. No-signal vs stuck-spool are different fixes.
- **Fix:** repair solenoid/coil/wiring, or clean/free the spool.
- **Teaches:** connects hydraulics to the electrical/PLC skills they already have — pressure present but no motion is a *valve or signal* problem, not a pump problem.

### F6 — Actuator drift / weak holding (cylinder seal bypass)
- **Symptom:** ram creeps down under load / won't hold position; weak on the work stroke.
- **Gauge signature:** work-port pressure **bleeds off** with the DCV centered; system otherwise normal; internal bypass past the piston seal.
- **Novice trap:** "DCV is leaking" or "relief is low."
- **Correct isolation:** center the DCV and watch for drift; isolate cylinder-internal bypass vs DCV leak vs pilot-check valve. A load that drifts with the valve closed points *inside the cylinder*.
- **Fix:** reseal/replace the cylinder.
- **Safety gate — highest:** a suspended load can **drop**. Block/support the load and relieve trapped pressure **before** any work. This is the scenario that most rewards the safety habit.
- **Teaches:** "holds pressure vs makes pressure" — and stored-energy discipline.

**Fault-signature matrix** (what makes each uniquely identifiable — the anti-guessing design):

| Fault | P1 pump | P2 work port | Relief line | Sight glass | Filter ΔP | Ram |
|---|---|---|---|---|---|---|
| F1 filter | high | low | cool | OK | **high** | slow |
| F2 level | low/erratic | low | cool | **low** | OK | erratic |
| F3 relief | **low @ deadhead** | low | **warm** | OK | OK | sluggish |
| F4 pump | low | low | **cold** | OK | OK | slow+low flow |
| F5 DCV | **high** | **~0** | at setting | OK | OK | **no motion** |
| F6 cylinder | normal | **bleeds off** | OK | OK | OK | **drifts** |

---

## 4. UI flow

Reuses the V3 player shell; the only new surface is the hydraulic schematic. Screen by screen, mapped to `ScenarioPhase`:

1. **Dispatch / plant context** (`PlantContext`) — "Line 3 press is slow, quota's behind." Role select (new / experienced / senior) gates hints and checkpoints, as today.
2. **Observe** — the twin view: HPU with animated reservoir (level, foam), pump sound cue, temperature, indicator lights. Learner logs observations (clue discovery). *No gauges opened yet.*
3. **Prints** — the hydraulic schematic (new component) with normal pressures/flows labeled. Learner must consult before metering (rewarded; skipping is allowed but costs method score).
4. **Measure** — `MeasurementLocation`s = gauge ports P1/P2/P3 + flow meter + relief-line temp (thermal) + sight glass. Each returns a `SimpleReading` (value, unit PSI/GPM/°F, interpretation, `isKeyClue`). Unnecessary measurements carry `unnecessaryMeasurementPenalty`; the right sequence earns `efficiencyBonus`.
5. **Isolate & hypothesize** — a "what's your read?" commit: learner marks the suspect section (pump / relief / filter / DCV / cylinder / fluid) **and states the reason** (the reasoned-commit pattern from `reasonedAsk`). Verdict is withheld until the reason is given.
6. **Senior checkpoint** (`SeniorCheckpoint`) — for experienced/senior roles: "P1 high, P2 low, ΔP high — pump or filter?" branches on reasoning.
7. **Act** — `SystemAction`s (category `adjust`/`replace`/`lockout`/`test`) with `safetyWarning` gates. Wrong/unsafe actions play out with `consequence` + `unsafeActionPenalty`.
8. **Verify the fix** — re-measure; confirm the signature cleared. (Prevents "replaced it, didn't confirm.")
9. **Closeout** — reflection → operator role-play → work order → handoff (Section 7).
10. **Debrief** — method timeline (what you verified vs assumed), score by dimension, evidence emitted, readiness delta.

New engine bits the UI needs: a **hydraulic schematic renderer** (SVG symbols: pump, relief, DCV, filter, cylinder, reservoir, gauges) and **pressure/flow reading widgets**. Everything else is existing V3 UI.

---

## 5. Evidence mapping (into the existing Assessment Spine)

**Rule:** every graded learner action becomes an `EvidenceEvent` (`shared/assessmentSpine.ts`), interpreted by the *same* `interpretEvidence`/`deriveReadiness`. Completion ≠ mastery; safety mistakes dominate (`SAFETY_WEIGHT` 1.5, "Needs Safety Review" gate); communication is visible but never overrides the fix.

**One new domain, registered in the existing union** (not a new system):
- Add `"fluid_power"` to `SkillDomain` (`shared/competencyMatrix.ts`) + `MODULE_SKILL_DOMAIN["fluid-power"] = "fluid_power"` + a `SKILL_DOMAIN_LABELS` entry. That's the whole schema change; the spine, rollup, and readiness math are untouched.

| Learner action | `sourceType` | `evidenceType` | `domain` | Key fields |
|---|---|---|---|---|
| Log an observation / read a gauge | `simulation` | `live_interaction` | `fluid_power` | `correctness` (was it a key clue), low weight |
| Isolate a section + state reason | `simulation` | `reasoned_answer` | `fluid_power` | `reasoningQuality` (sound/weak/flawed) |
| Commit the diagnosis | `simulation` | `diagnosis_submitted` | `fluid_power` | `correctness`, `reasoningQuality`, `confidenceScore` |
| Senior checkpoint | `simulation` | `action_choice` | `fluid_power` | `correctness` |
| Finish a scored run | `simulation` | `simulation_completed` | `fluid_power` | `methodologyScore`, `methodologyTier`, `timeToDecisionMs` |
| Unsafe act (open pressurized housing, over-set relief, work under suspended load) | `simulation` | `safety_action` | `safety` | `safetyFlag: true` → **Needs Safety Review** |
| Correct safety discipline (bleed to 0 PSI, block load) | `simulation` | `safety_action` | `safety` | `correctness: correct` |
| Operator role-play (closeout) | `ai_mentor` | `ai_operator_communication` | (communication area) | mentor-classified |
| Work order (closeout) | `ai_mentor` | `ai_work_order_documentation` | (communication area) | mentor-classified |
| Reflection / root-cause (closeout) | `ai_mentor` | `ai_reflection` / `ai_root_cause_explanation` | (communication area) | mentor-classified |
| Shift handoff (closeout) | `ai_mentor` | `ai_shift_handoff` | (communication area) | mentor-classified |

**Evidence supports the six required lines** exactly:
- *Hydraulic troubleshooting* → `fluid_power` domain rollup.
- *Diagnostic method* → `methodologyScore`/`methodologyTier` on `simulation_completed` (feeds `integration`/method view).
- *Safety judgment* → `safety` domain + `safetyFlag` gate.
- *Pressure/flow reasoning* → `reasoningQuality` on `reasoned_answer`/`diagnosis_submitted`.
- *Work-order documentation* + *operator communication* → the two closeout communication areas.

**What the manager sees:** for each tech, a `fluid_power` readiness level (`Ready` / `Almost Ready` / `Needs Review` / `Needs Training` / `Needs Safety Review` / `Needs Manager Validation` / `Promotion Candidate` / `Not Demonstrated`) with the audit trail (the "why"), plus safety and communication readiness — from `deriveReadiness`, unchanged.

**What the Skills Passport shows:** a Fluid Power / Hydraulic Troubleshooting competency with demonstrated method tier, safety-cleared status, and the communication signals — the same passport surface the electrical/PLC/VFD loops already feed.

---

## 6. Safety rules (hard gates)

Stored hydraulic energy is the hazard that makes this domain safety-critical. These are `safetyWarning`s on actions and `safety_action` evidence; violating any is a `safetyFlag` that forces **Needs Safety Review** and dominates readiness.

1. **Bleed to zero, then verify.** Relieve system pressure and confirm **0 PSI on the gauge** before opening any line, filter housing, fitting, or component — the hydraulic *Live-Dead-Live*. Trapped pressure remains after the pump stops.
2. **Support suspended loads.** Before working on a holding circuit (F6), block/crib the load and relieve cylinder pressure — a load can drop when a line is cracked.
3. **Lock out the prime mover.** Electrical LOTO on the HPU motor *and* hydraulic energy isolation — both, not either.
4. **Stay within rated pressure.** Adjusting the relief: back off, then bring **up** to spec; never overshoot the rated pressure to "make it hit."
5. **Injection-injury awareness.** Never check a pinhole leak by hand; high-pressure fluid injection is a surgical emergency. (Presented as a hard-fail choice in the leak scenarios.)
6. **Hot oil.** Reservoir/return oil can burn; the low-level and relief-bypass faults run the oil hot.

Each rule appears as a *decision the learner can get wrong* — not a banner they scroll past.

---

## 7. Closeout / operator role-play plan

Adds one `LessonCloseout` entry (`shared/lessonCloseouts.ts`) for the fluid-power lesson that gates into the sim, reusing the exact structure and the AI operator (`maintenanceMentor`). Proposed:

- **deckKey:** `fluid-power/hydraulic-pressure-loss`
- **scenario:** "The press was slow and weak. The tech isolated it — pressure was fine at the pump but dropped across a clogged filter — replaced the element, found the contamination source, and confirmed full pressure at the ram. The line is back up. The operator is behind on quota and wants to know if they can just crank the relief valve up next time to make it hit pressure."
- **persona:** `rushed` (press operator behind on quota) — or `frustrated` if the press is a repeat offender.
- **operatorOpeningLine:** *"Back up? Good — next time it's slow can I just turn that pressure valve up a bit to push it through? I can't keep waiting on you guys."*
- **unsafeTemptation:** "cranking the relief valve above rated pressure to force the press to hit, instead of clearing the restriction."
- **prompts:**
  - **reflection:** "The press was weak because… I verified pressure was good at the pump but lost across… I'm still assuming…"
  - **operator:** "Plain language: why turning up the relief is dangerous (over-pressure, burst line, injection injury) and why the real fix was the restriction — no blame, calm."
  - **workOrder:** "Symptom (press slow/weak) · gauge readings P1/P2 · ΔP across filter · root cause (clogged filter + contamination source) · corrective action · follow-up (find contamination source)."
  - **handoff:** "Press state · what you verified vs assumed · contamination source found or still open · watch for the filter loading again."

This emits the operator-communication and work-order evidence (Section 5) and trains the exact unsafe temptation (over-setting relief) as a *refusal* the learner must voice.

---

## 8. Architecture reuse vs new build

**Reused as-is (~75%):** V3 phase/measurement/action/fault/advance-condition/senior-checkpoint/scoring/communication model; the player shell and role-gating; the Assessment Spine (evidence → readiness); the closeout + AI operator; the Skills Passport / manager readiness surfaces; the scenario registry pattern.

**New (the actual work):**
| Item | Type | Notes |
|---|---|---|
| `fluid_power` SkillDomain + module map + label | schema | ~½ day, additive to a closed union |
| Hydraulic schematic renderer (SVG symbols + gauges/flow) | component | the one genuinely new UI surface |
| Pressure/flow reading types + `pressure_gauge`/`flow_meter` tools | engine ext | extend `ToolId`, `MeterSetting`→units |
| Hydraulic component types (pump/relief/DCV/cylinder/filter/reservoir) | engine ext | parallels the electrical `CircuitComponent` set |
| Twin + 6 fault scenarios (authored to the signature matrix) | content | the quality-critical part |
| `fluid-power/hydraulic-pressure-loss` lesson deck (short: method + safety) | content | gates into the sim; card format |
| Closeout entry + persona wiring | content | Section 7 |
| Practice-map unit + `fluid-power` module registration | wiring | ILU: lesson → sim → assess |
| Tests (scenario validity, evidence emission, closeout registry, safety-gate) | tests | mirror existing sim/closeout tests |

---

## 9. Build estimate

Assumes one engineer + this spec; content authored to the quality bar (real signatures, not filler).

- **Demo-ready MVP** — twin + **F1 (filter)** and **F4 (pump)** as the teaching contrast + safety gates + evidence + closeout + hydraulic schematic: **~2 weeks.** Enough to demo "EASLearn does hydraulics, and it's judgment not video."
- **Full flagship** — all 6 faults, senior checkpoints, lesson deck, tests, practice-map + Skills Passport wiring: **~3–4 weeks total.**
- **Riskiest item:** the hydraulic schematic renderer + making the six signatures genuinely distinguishable (the anti-guessing design). Everything downstream of the twin is reuse.

**Recommended slice:** ship the 2-week MVP (F1 + F4 + safety + closeout + evidence) as the pilot demo, then complete F2/F3/F5/F6 in the following sprint.

---

## 10. Open decisions needing your approval

1. **Add the `fluid_power` SkillDomain?** (Recommended — clean, additive. Alternative: fold into `integration`, but that blurs the readiness view.)
2. **New module slug `fluid-power`** (matches the existing `skillTracks` "Hydraulics & Pneumatics" track, `moduleSlug: "fluid-power"`). Confirm.
3. **MVP scope = F1 + F4** for the 2-week demo, or do you want a specific fault first (e.g. F5 to show the electrical cross-over)?
4. **Machine choice:** hydraulic **press** (chosen here) vs a mobile/injection-mold/clamp unit — press reads as the clearest "slow and weak" story; confirm it matches your target buyers' floor.

**No code will be written until these are confirmed.**
