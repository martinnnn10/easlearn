# EASLearn Learning Engine

**The educational operating system of EASLearn.**
This document specifies *how* EASLearn teaches — the reusable mechanics behind every lesson, mission, simulation, assessment, AI-mentor interaction, competency update, manager signal, certification, skills passport, and employer report.

It is a specification, not marketing. Its audience is engineers, curriculum architects, instructional designers, AI prompt engineers, simulation designers, and assessment builders. The machine-readable index of these mechanics lives in [`shared/learningEngine.ts`](../shared/learningEngine.ts); the two must stay in sync.

> **All future EASLearn lessons, simulations, assessments, and AI-mentor interactions must conform to this document.**

---

## 0. Thesis: a digital apprenticeship engine, not a lesson platform

EASLearn does not deliver content. It runs an apprenticeship. The learner should feel like they are standing beside the best maintenance technician in the plant during a real breakdown.

The mentor's job — human or AI, authored or generated — is always the same nine moves:

**observe · ask · wait · challenge assumptions · require reasoning · demonstrate · coach · step back · verify competency.**

The final goal is **not correct answers. It is independent maintenance judgment** — the point at which the learner asks themselves the same questions an experienced technician would ask, unprompted.

### The apprenticeship ladder

Every competency is climbed in four rungs. The engine's job is to move the learner up the ladder and prove they arrived.

| Rung | Learner experience | Scaffolding | Who's driving |
|---|---|---|---|
| 1 | **I watch the master** | full | mentor demonstrates |
| 2 | **I work with the master** | guided | learner acts, mentor reacts |
| 3 | **I make the call while the master watches** | light | learner decides, mentor silent unless needed |
| 4 | **I can troubleshoot independently** | none | learner alone; competency verified |

A lesson, a mission, or a whole curriculum path is well-designed only if it visibly carries the learner up these rungs. A learner who is still on rung 1 at the end has been *lectured*, not apprenticed.

---

## 1. The Learning Arc

Every competency travels a ten-stage arc. Mechanics are grouped by the stage they primarily serve. A single activity usually chains several stages.

1. **Observe** — read the machine and the situation before touching anything.
2. **Commit** — make a call before any hint or answer.
3. **Reason** — state *why*; the thinking is graded, not just the pick.
4. **Test** — gather evidence; cheapest test first.
5. **Experience consequence** — live with the result, including safe failure.
6. **Reflect** — name what happened and why; rate confidence honestly.
7. **Generalize** — transfer the method to a new fault, machine, or domain.
8. **Communicate** — explain to an operator, a work order, the next shift.
9. **Verify competency** — demonstrate the skill; update the graph; manager attests.
10. **Retain over time** — re-demonstrate before it decays; spaced reinforcement.

Cutting *vertically* across all ten stages is the **gradual-release spine** — Master Demonstration → Guided Practice → Independent Practice, governed by Progressive Scaffolding and Mentor Fade, and (in the target state) driven by the AI Mentor. The arc is *what* the learner does; the spine is *how much help* they get while doing it, decreasing as competency rises.

---

## 2. Mechanic catalog

Each mechanic is specified with sixteen fields. `status` is honest as of formalization: **implemented** (live in the flagship/engine), **partial** (exists but shallow or un-instrumented), **planned** (designed here, not built).

### Stage 1 — Observe

#### 1. Concrete Anchor · status: implemented
- **Purpose:** Open on a real breakdown with sensory detail, never an abstract definition.
- **Learning science:** Episodic/concrete anchoring; concreteness effect; emotional salience aids encoding.
- **Industrial purpose:** Techs think in war stories. A named line, a buzzing contactor, a cost-per-minute is how the trade actually transmits knowledge.
- **Cognitive skill:** Situational recall.
- **Emotional effect:** Pulled in — "this is a real call, not a textbook."
- **Use when:** Opening any lesson or mission. **Don't use when:** the learner is mid-diagnosis and needs signal, not story.
- **Relationships:** Sets up Ask Before Tell and Observation Before Action.
- **Flagship example:** "Packaging line's down… that contactor's buzzing but won't pull in — and the last guy already swapped it. Twice."
- **Future examples:** PLC I/O: "The reject gate never fired and we shipped a bad case." · VFD: "F070 tripped mid-run and the line's stacking up." · E-stop: "One mushroom in a chain of nine, and the whole cell is dead." · Sensors: "Photo-eye says blocked, but the chute's empty." · Pneumatics: "Clamp won't close and there's air at the manifold." · Hydraulics: "Press creeps down overnight." · PM/mechanical: "Bearing that screamed for a week just seized."
- **AI mentor role:** May generate a plant-appropriate anchor from the learner's stated industry.
- **Competency signals:** none (framing).
- **Manager dashboard output:** none.
- **Assessment implication:** Not assessed; sets the frame.
- **Future extension:** Personalize the anchor to the learner's own plant/equipment.

#### 2. Observation Before Action · status: partial
- **Purpose:** Force the learner to look and describe before they may act.
- **Learning science:** Expert–novice research — experts spend more time representing the problem before acting; premature action is the novice signature.
- **Industrial purpose:** "Look before you leap" prevents blown fuses, arc events, and misdiagnosis.
- **Cognitive skill:** Observation.
- **Emotional effect:** Slowed down, deliberate.
- **Use when:** Start of any diagnosis. **Don't use when:** speed is the trained skill (late-stage pressure drills).
- **Relationships:** Feeds Hypothesis Formation; precedes Environmental Awareness.
- **Flagship example:** "Don't touch anything yet. Just look at it, and think about what you'd do first."
- **Future examples:** VFD: read the keypad fault queue before clearing. · Sensors: watch the output LED before wiring changes. · Hydraulics: watch the gauge cycle before cracking a fitting.
- **AI mentor role:** Prompt "what do you notice?" and grade the completeness of the observation.
- **Competency signals:** `observationDiscipline`.
- **Manager dashboard output:** Flag technicians who consistently act before observing.
- **Assessment implication:** Score whether key observables were noted before first action.
- **Future extension:** A timed "survey the scene" mode in the simulator with scored noticing.

#### 3. Environmental Awareness · status: partial
- **Purpose:** Notice context — energy state, LOTO, what changed, what's around you.
- **Learning science:** Situation awareness (Endsley) levels 1–3: perceive, comprehend, project.
- **Industrial purpose:** The difference between a safe tech and a statistic.
- **Cognitive skill:** Situational awareness / safety.
- **Emotional effect:** Alert.
- **Use when:** Any live-equipment task. **Don't use when:** pure conceptual instruction with no machine present.
- **Relationships:** Gate for Safety Override; part of Observe.
- **Flagship example:** Recognizing control (120 V) vs power (480 V) circuits before metering.
- **Future examples:** Every domain: confirm zero-energy state, identify stored energy (capacitors on a VFD DC bus, accumulators in hydraulics, air receivers in pneumatics).
- **AI mentor role:** Interrogate the learner's energy-source inventory before allowing a "safe to work" call.
- **Competency signals:** `safetyJudgment`.
- **Manager dashboard output:** Safety-awareness sub-score per technician.
- **Assessment implication:** Hard gate — miss a stored-energy source and the attempt is unsafe regardless of diagnosis.
- **Future extension:** LOTO/energy-isolation mini-sim per machine class.

### Stage 2 — Commit

#### 4. Ask Before Tell · status: implemented
- **Purpose:** The mentor asks the diagnostic question *before* explaining anything.
- **Learning science:** Question-before-instruction / pretesting effect — a failed retrieval attempt before instruction improves later learning.
- **Industrial purpose:** A master doesn't lecture at a breakdown; he asks "what's your first move?"
- **Cognitive skill:** Decision making.
- **Emotional effect:** On the spot, engaged.
- **Use when:** As the *opening* interaction of a lesson (index 1). **Don't use when:** the learner has zero prior exposure and no basis to guess (rare; even then a guess is useful).
- **Relationships:** Parent of Commit Before Hint; pairs with Mentor Reaction.
- **Flagship example:** Card 2 asks "So — what's your first move?" before any explanation of the circuit.
- **Future examples:** PLC I/O: "Output's dead — where do you look first, field or logic?" · VFD: "F004 undervoltage — supply or drive?" · E-stop: "Circuit's open — how do you find which button without walking all nine?"
- **AI mentor role:** Generate the opening question and withhold explanation until commitment.
- **Competency signals:** `decisionQuality`.
- **Manager dashboard output:** none directly (feeds decision-quality trend).
- **Assessment implication:** The opening call is a scored data point, not a warm-up.
- **Future extension:** Adaptive opening difficulty based on competency level.

#### 5. Commit Before Hint · status: implemented
- **Purpose:** No hint or answer is available until the learner has committed.
- **Learning science:** Generation effect; prevents the "illusion of knowing" from passive reading.
- **Industrial purpose:** On the floor there is no answer key; you commit and find out.
- **Cognitive skill:** Decision making / accountability.
- **Emotional effect:** Ownership of the call.
- **Use when:** Every interactive card and every simulator hint. **Don't use when:** demonstrating (the "I do" phase is meant to be watched).
- **Relationships:** Enforces Ask/Predict/Reason Before Verdict; measured by hint reliance.
- **Flagship example:** Choices lock the reveal until picked; the simulator only offers a hint after an attempt.
- **Future examples:** Universal — every hint in every sim is gated behind an attempt.
- **AI mentor role:** Refuse to hint until the learner states a move ("Tell me what you'd try first").
- **Competency signals:** `decisionQuality`, `hintReliance`.
- **Manager dashboard output:** Hint-reliance trend (dropping reliance = growing competence).
- **Assessment implication:** Hints taken reduce the independence score.
- **Future extension:** Escalating hint ladder (nudge → narrow → show) with graded cost.

#### 6. Predict Before Reveal · status: implemented
- **Purpose:** Learner predicts the outcome, then sees what actually happens.
- **Learning science:** Prediction is one of the strongest known encoding boosts; surprise drives memory.
- **Industrial purpose:** Builds the mental model of how the circuit *behaves*, not just what it *is*.
- **Cognitive skill:** Mental model / pattern recognition.
- **Emotional effect:** Curiosity, then correction.
- **Use when:** Teaching dynamic behavior (seal-in latch, timer done bit, VFD ramp). **Don't use when:** the outcome is trivially obvious.
- **Relationships:** Pairs with Live System Interaction (predict, then make it happen).
- **Flagship example:** "You release the Start button — predict what the motor does." → outcome reveals the seal-in.
- **Future examples:** PLC I/O: predict the output state for a given rung. · VFD: predict which fault a phase loss throws. · Sensors: predict the input LED for an NPN sensor on a sourcing card. · Hydraulics: predict pressure when the relief is set below load.
- **AI mentor role:** Ask for a prediction and probe the reasoning behind it.
- **Competency signals:** `mentalModelAccuracy`.
- **Manager dashboard output:** Mental-model accuracy by domain.
- **Assessment implication:** Prediction accuracy is a leading indicator of true understanding.
- **Future extension:** Confidence-weighted predictions feeding calibration.

#### 7. Hypothesis Formation · status: partial
- **Purpose:** State a testable hypothesis ("I think X because Y") before testing.
- **Learning science:** Hypothetico-deductive reasoning; makes thinking explicit and falsifiable.
- **Industrial purpose:** Separates a systematic troubleshooter from a parts-swapper.
- **Cognitive skill:** Root cause thinking.
- **Emotional effect:** Deliberate reasoning.
- **Use when:** Before any test/measurement. **Don't use when:** the step is purely procedural (LOTO).
- **Relationships:** Feeds Cheapest Next Test and Evidence Collection.
- **Flagship example:** The reasoning options in the capstone ("supply is good, so the break is one open device in the string").
- **Future examples:** Every diagnosis: "It's phase loss because two legs read 480 and one reads 0."
- **AI mentor role:** Require a because-clause; grade whether the hypothesis is testable.
- **Competency signals:** `hypothesisQuality`.
- **Manager dashboard output:** Reasoning-quality sub-score.
- **Assessment implication:** A correct fix with no stated hypothesis scores lower than one reasoned.
- **Future extension:** Free-text hypothesis graded by the AI mentor (see Think Aloud).

### Stage 3 — Reason

#### 8. Reason Before Verdict · status: implemented — *core mechanic*
- **Purpose:** Ask "what made you think that?" *before* revealing right/wrong; grade the reasoning, not just the pick.
- **Learning science:** Metacognition; self-explanation effect; exposes the "right answer, wrong reason" failure that answer-only assessment misses.
- **Industrial purpose:** A tech who is right by luck will be wrong next time. Judgment = right action *for the right reason*.
- **Cognitive skill:** Judgment / metacognition.
- **Emotional effect:** Held accountable for thinking, not luck.
- **Use when:** Capstone and any decision that matters. **Don't use when:** low-stakes recall.
- **Relationships:** The apex of the Commit → Reason chain; depends on Commit Before Hint.
- **Flagship example:** Capstone (mc-13): pick the action, then "what made you think that?"; right action + weak reason is *coached* ("right — but not for the reason you think"), not congratulated.
- **Future examples:** VFD: right to check supply, but because "voltage present rules out the drive," not "supply is usually the problem." · E-stop: right to meter the chain, but because series NC means one open kills all.
- **AI mentor role:** In target state, read free-text reasoning and classify it (sound / plausible-but-lucky / flawed).
- **Competency signals:** `reasoningQuality`, `rightForRightReason`.
- **Manager dashboard output:** % of correct actions backed by sound reasoning — the single best judgment metric.
- **Assessment implication:** Certification requires right-for-right-reason, not just right.
- **Future extension:** Open-ended reasoning capture (Think Aloud).

#### 9. Think Aloud · status: planned — *requires AI*
- **Purpose:** Learner articulates reasoning in their own words; the mentor responds to it.
- **Learning science:** Verbal protocol / self-explanation; the strongest form of Reason Before Verdict.
- **Industrial purpose:** Real diagnosis is narrated ("okay, I've got voltage here, none here, so…").
- **Cognitive skill:** Communication / metacognition.
- **Emotional effect:** Heard, coached.
- **Use when:** High-stakes reasoning once the AI mentor exists. **Don't use when:** no AI grader available (falls back to Reason Before Verdict's multiple-choice reasons).
- **Relationships:** Open-ended generalization of Reason Before Verdict and Hypothesis Formation.
- **Flagship example:** Not yet — today's reasons are authored multiple-choice.
- **Future examples:** Every domain, as free-text "walk me through your thinking."
- **AI mentor role:** Grade reasoning, detect misconceptions, respond as a master would.
- **Competency signals:** `reasoningQuality`, `communicationClarity`.
- **Manager dashboard output:** Reasoning transcripts and quality trend.
- **Assessment implication:** The richest competency evidence; anchor of high-stakes certification.
- **Future extension:** The core of the in-lesson AI Mentor.

#### 10. Cheapest Next Test · status: partial
- **Purpose:** Choose the single measurement that splits the problem space in half.
- **Learning science:** Information gain / binary search; expert diagnosticians minimize tests to resolution.
- **Industrial purpose:** Downtime is money; the tech who halves the problem per measurement wins.
- **Cognitive skill:** Troubleshooting methodology.
- **Emotional effect:** Efficient, clever.
- **Use when:** Any multi-step diagnosis. **Don't use when:** a single obvious test resolves it.
- **Relationships:** Consumes Hypothesis Formation; scored via Evidence Collection.
- **Flagship example:** "Control voltage present or not — that one reading cut the whole circuit in two."
- **Future examples:** PLC I/O: force the output to split field-vs-logic in one move. · VFD: measure DC bus to split supply-vs-drive.
- **AI mentor role:** Ask "what one test tells you the most right now?" and rate the choice.
- **Competency signals:** `diagnosticEfficiency`.
- **Manager dashboard output:** Average tests-to-resolution per technician.
- **Assessment implication:** Efficiency is scored separately from correctness.
- **Future extension:** Information-gain scoring in the simulator.

#### 11. Mentor Reaction · status: implemented
- **Purpose:** Respond to the *specific* wrong move, not a generic red X.
- **Learning science:** Elaborative, targeted feedback; feedback specificity drives correction.
- **Industrial purpose:** A master reacts to *what you did* ("that's what the last guy did — twice").
- **Cognitive skill:** Pattern recognition (of one's own error).
- **Emotional effect:** Seen, guided — not judged.
- **Use when:** Any authored choice with known misconceptions. **Don't use when:** the wrong options carry no instructive misconception.
- **Relationships:** Enables Productive Failure and Second-Chance Reasoning.
- **Flagship example:** "Swap the contactor a third time" → "that's exactly what the last guy did — twice."
- **Future examples:** Every domain encodes the classic wrong moves and the master's reaction to each.
- **AI mentor role:** Generalize to react to *any* move, including unanticipated ones.
- **Competency signals:** `misconceptionSignature` (which wrong models a learner holds).
- **Manager dashboard output:** Common misconceptions across a team (targeted training).
- **Assessment implication:** Misconception patterns inform remediation, not scoring alone.
- **Future extension:** Misconception library per domain feeding adaptive remediation.

### Stage 4 — Test

#### 12. Evidence Collection · status: implemented
- **Purpose:** Build a case from readings and prints before committing to a diagnosis.
- **Learning science:** Case-based reasoning; externalizing evidence reduces cognitive load and confirmation bias.
- **Industrial purpose:** "Show me your evidence" is how a lead validates a diagnosis.
- **Cognitive skill:** Troubleshooting methodology.
- **Emotional effect:** Methodical.
- **Use when:** Simulator scenarios and any multi-clue diagnosis. **Don't use when:** single-reading faults.
- **Relationships:** Downstream of Cheapest Next Test; input to Root Cause Explanation.
- **Flagship example:** The lesson primes it; the simulator's clue/evidence log realizes it.
- **Future examples:** Every scenario accumulates prints, readings, and observations into a case file.
- **AI mentor role:** Challenge weak or missing evidence before accepting a diagnosis.
- **Competency signals:** `evidenceQuality`.
- **Manager dashboard output:** Evidence-discipline sub-score.
- **Assessment implication:** A guess with no evidence trail cannot certify.
- **Future extension:** Structured evidence board shared into the debrief and work order.

#### 13. Meter Before Replace · status: implemented — *signature discipline*
- **Purpose:** Measure a component before condemning it; parts-changing is the anti-pattern.
- **Learning science:** Habit formation against a strong novice default (swap-and-pray).
- **Industrial purpose:** Directly attacks the #1 cost driver: unnecessary part swaps and repeat calls.
- **Cognitive skill:** Troubleshooting discipline.
- **Emotional effect:** Restraint, professionalism.
- **Use when:** Any "is this part bad?" decision. **Don't use when:** the component is known-failed by direct evidence.
- **Relationships:** Special case of Cheapest Next Test; violated by parts-changer behavior.
- **Flagship example:** The entire opening — meter the coil (95 V) instead of swapping the contactor a third time.
- **Future examples:** VFD: meter the bus before replacing the drive. · Sensors: meter the output before replacing the sensor. · Motors: megger before condemning windings.
- **AI mentor role:** Block a "replace" call that has no measurement behind it.
- **Competency signals:** `partsChangerPenalty`, `measurementDiscipline`.
- **Manager dashboard output:** Parts-changer index per technician — a direct downtime/cost proxy.
- **Assessment implication:** Replacing without measuring is a scored fault even if the part was bad.
- **Future extension:** Tie to real parts-cost data for ROI reporting.

#### 14. Live System Interaction · status: implemented — *strongest differentiator*
- **Purpose:** Manipulate a real, responsive circuit/twin inside the lesson — cause and observe.
- **Learning science:** Embodied, active learning; agency and immediate feedback outperform exposition by a wide margin.
- **Industrial purpose:** You learn a circuit by working it, not reading it.
- **Cognitive skill:** Systems understanding.
- **Emotional effect:** Agency — "I made it do that."
- **Use when:** Any dynamic behavior worth internalizing. **Don't use when:** static reference material (tables, symbol lookups).
- **Relationships:** The physical substrate for Predict Before Reveal, Guided/Independent Practice.
- **Flagship example:** `MotorStarterInteractive` — hold Start, release, watch the seal-in latch; trip the overload, watch the string open fail-safe.
- **Future examples:** PLC I/O: live rung with forceable inputs/outputs. · VFD: parameter/fault twin. · E-stop: interactive series chain. · Pneumatics/hydraulics: live valve/actuator schematic.
- **AI mentor role:** Narrate or question the learner's manipulations ("why did it stay running?").
- **Competency signals:** `systemsUnderstanding`.
- **Manager dashboard output:** none directly (feeds understanding scores).
- **Assessment implication:** Can host "make the circuit do X" performance tasks.
- **Future extension:** A shared interactive-primitive library (one engine, many machines) — the moat.

### Stage 5 — Experience consequence

#### 15. Productive Failure · status: implemented
- **Purpose:** Let the wrong move play out safely; the mistake is the teaching moment.
- **Learning science:** Productive failure (Kapur); struggling before instruction improves transfer.
- **Industrial purpose:** Better to swap the wrong part in a sim than on a live $400/min line.
- **Cognitive skill:** Resilience / learning from error.
- **Emotional effect:** Safe to be wrong.
- **Use when:** Reversible decisions. **Don't use when:** the modeled action is a safety violation (use Safety Override instead).
- **Relationships:** Enabled by Mentor Reaction; leads to Second-Chance Reasoning.
- **Flagship example:** A wrong pick isn't a red X — the mentor reacts and hands the card back to try again.
- **Future examples:** Every domain lets the learner take the tempting wrong path and see it dead-end.
- **AI mentor role:** Let failure unfold, then coach — never pre-empt the learnable mistake.
- **Competency signals:** `recoveryFromError`.
- **Manager dashboard output:** none directly.
- **Assessment implication:** Recovery quality can be scored; first-try-perfect is not the only mastery signal.
- **Future extension:** Track error→recovery trajectories over time.

#### 16. Second-Chance Reasoning · status: partial
- **Purpose:** After a miss, the learner reasons again rather than being handed the answer.
- **Learning science:** Retrieval practice with feedback; a second effortful attempt cements more than being told.
- **Industrial purpose:** The floor gives second chances; you re-think and re-test.
- **Cognitive skill:** Metacognition.
- **Emotional effect:** Encouraged to think, not told.
- **Use when:** After Productive Failure. **Don't use when:** repeated failure signals a missing prerequisite (branch to remediation).
- **Relationships:** Follows Productive Failure; escalates to remediation if it stalls.
- **Flagship example:** "Think it through again" after a wrong capstone action, rather than revealing the answer.
- **Future examples:** Universal retry-with-reasoning on missed decisions.
- **AI mentor role:** Offer a narrower question on the second pass, not the answer.
- **Competency signals:** `reasoningRecovery`.
- **Manager dashboard output:** none directly.
- **Assessment implication:** Attempts-to-mastery is a competency signal.
- **Future extension:** Adaptive branch to a prerequisite micro-lesson after N misses.

#### 17. Safety Override · status: partial — *non-negotiable*
- **Purpose:** An unsafe action halts everything and forces a safety reckoning, regardless of progress.
- **Learning science:** Strong aversive salience for genuinely dangerous errors (used sparingly).
- **Industrial purpose:** Safety is not one score among many; it is a gate.
- **Cognitive skill:** Safety judgment.
- **Emotional effect:** Gravity — this is non-negotiable.
- **Use when:** Any modeled action that would injure or kill (working live, skipping LOTO, ignoring stored energy). **Don't use when:** the error is merely inefficient.
- **Relationships:** Overrides Productive Failure; depends on Environmental Awareness.
- **Flagship example:** "Is it safe?" is the fourth internalized question; the sim gates LOTO/arc-flash.
- **Future examples:** Every domain: stored energy, live work, PPE, permit-required steps.
- **AI mentor role:** Stop the scenario and require the learner to state the correct safe procedure.
- **Competency signals:** `safetyJudgment`, `safetyViolation`.
- **Manager dashboard output:** Any safety violation is surfaced immediately, per technician.
- **Assessment implication:** A safety violation fails the attempt outright — no partial credit.
- **Future extension:** Per-machine energy-isolation checklists as hard gates.

#### 18. Decision Under Pressure · status: implemented
- **Purpose:** Decide with a running clock and cost of downtime, like a real line-down call.
- **Learning science:** Contextual interference; performing under realistic stress improves transfer to the floor.
- **Industrial purpose:** Competence that collapses under pressure isn't competence.
- **Cognitive skill:** Confidence under pressure.
- **Emotional effect:** Stakes, focus.
- **Use when:** Later rungs (Independent Practice), once the method is known. **Don't use when:** first exposure — pressure before competence induces flailing.
- **Relationships:** Amplifies every Test/Reason mechanic; late-rung only.
- **Flagship example:** The "LIVE DEMO · LINE DOWN · $400/min" framing; the simulator timer.
- **Future examples:** Timed fault-clear challenges per domain with downtime cost.
- **AI mentor role:** Introduce time pressure only after competency thresholds are met.
- **Competency signals:** `timeToSolve`, `compositureUnderPressure`.
- **Manager dashboard output:** Performance-under-pressure trend.
- **Assessment implication:** Certification scenarios are timed.
- **Future extension:** Escalating pressure tiers gated by competency.

### Stage 6 — Reflect

#### 19. Reflection · status: partial
- **Purpose:** Name what happened and why immediately after the attempt.
- **Learning science:** Reflective consolidation; retrieval + elaboration during debrief.
- **Industrial purpose:** The post-job "so what actually happened" is where techs level up.
- **Cognitive skill:** Metacognition.
- **Emotional effect:** Consolidation.
- **Use when:** End of every mission/scenario. **Don't use when:** mid-task (breaks flow).
- **Relationships:** Consumes the whole attempt; feeds Question Internalization and Spaced Reinforcement.
- **Flagship example:** The methodology debrief and the closing "four questions" card.
- **Future examples:** Every scenario ends with a structured reflect step.
- **AI mentor role:** Ask "what would you do differently?" and compare to the ideal path.
- **Competency signals:** `reflectionDepth`.
- **Manager dashboard output:** none directly.
- **Assessment implication:** Reflection quality distinguishes proficient from expert.
- **Future extension:** Reflection prompts seed the spaced-review queue.

#### 20. Root Cause Explanation · status: partial — *AI-strengthened*
- **Purpose:** Explain *why* the fault occurred before resetting — cause, not just symptom.
- **Learning science:** Deep vs surface explanation; causal reasoning predicts transfer.
- **Industrial purpose:** Reset without root cause and it trips again — the definition of a bad fix.
- **Cognitive skill:** Root cause thinking.
- **Emotional effect:** Depth, closure.
- **Use when:** Before any reset/return-to-service. **Don't use when:** cause is externally known and documented.
- **Relationships:** Consumes Evidence Collection; feeds Work Order Documentation.
- **Flagship example:** "Find out WHY it's open before you reset it."
- **Future examples:** VFD: why the bus sagged (supply, not drive). · Bearing: why it failed (lubrication, alignment, load).
- **AI mentor role:** Grade the causal chain in the learner's explanation.
- **Competency signals:** `rootCauseDepth`.
- **Manager dashboard output:** Root-cause rigor score — predicts repeat-failure rate.
- **Assessment implication:** A fix without a stated root cause is incomplete.
- **Future extension:** 5-Whys / fishbone tool with AI grading.

#### 21. Confidence Rating · status: planned
- **Purpose:** Rate certainty; calibrate confidence against actual correctness over time.
- **Learning science:** Metacognitive calibration; overconfidence is a measurable, trainable defect.
- **Industrial purpose:** A tech who knows the limits of their certainty knows when to escalate.
- **Cognitive skill:** Calibrated confidence.
- **Emotional effect:** Self-honesty.
- **Use when:** After a diagnosis, before the reveal. **Don't use when:** it would add friction to low-stakes recall.
- **Relationships:** Cross-checks every decision mechanic; feeds Career Readiness.
- **Flagship example:** Not yet implemented.
- **Future examples:** Every diagnosis captures a confidence value.
- **AI mentor role:** Reflect calibration back ("you were sure and wrong three times on VFD supply faults").
- **Competency signals:** `confidenceCalibration`.
- **Manager dashboard output:** Over/under-confidence flag — who escalates too late.
- **Assessment implication:** Calibration is a distinct, reportable competency.
- **Future extension:** Confidence-weighted scoring across the platform.

### Stage 7 — Generalize

#### 22. Scenario Variation · status: partial
- **Purpose:** Same fault class, different surface features — break rote pattern-matching.
- **Learning science:** Variability of practice; varied examples build schema, not memorized answers.
- **Industrial purpose:** No two breakdowns look identical; the method must survive the difference.
- **Cognitive skill:** Pattern recognition.
- **Emotional effect:** Tested, not coasting.
- **Use when:** After a fault type is first mastered. **Don't use when:** first exposure.
- **Relationships:** Precondition for Fault Transfer.
- **Flagship example:** The scenario cards (runs-then-drops-out vs won't-start) vary the same series-string logic.
- **Future examples:** Systematically vary machine, symptom, and root cause within one fault class.
- **AI mentor role:** Generate novel-surface variants of a mastered fault.
- **Competency signals:** `transferAccuracy`.
- **Manager dashboard output:** Robustness of a competency (does it survive variation?).
- **Assessment implication:** Certify on unseen variants, not the practiced instance.
- **Future extension:** Procedural scenario generator parameterized by fault class.

#### 23. Fault Transfer · status: partial — *deep moat*
- **Purpose:** Apply a method learned on one machine to a genuinely different machine/domain.
- **Learning science:** Far transfer — the hardest and most valuable learning outcome.
- **Industrial purpose:** A real tech walks up to unfamiliar equipment and still diagnoses it.
- **Cognitive skill:** Far transfer of methodology.
- **Emotional effect:** Mastery — "I can do this anywhere."
- **Use when:** Late in a path, across domains. **Don't use when:** fundamentals aren't yet solid.
- **Relationships:** Builds on Scenario Variation and Question Internalization.
- **Flagship example:** The four questions are explicitly framed as method that transfers beyond motor control.
- **Future examples:** Series-string logic from E-stop → safety relays → interlocks; "meter before replace" everywhere.
- **AI mentor role:** Present an unfamiliar machine and coach method application, not machine facts.
- **Competency signals:** `transferAccuracy`, `methodologyGeneralization`.
- **Manager dashboard output:** Methodology score independent of machine familiarity — the truest competence signal.
- **Assessment implication:** The gold-standard certification: diagnose a never-seen machine by method.
- **Future extension:** Cross-domain transfer assessments as capstones.

#### 24. Question Internalization · status: implemented — *the success condition*
- **Purpose:** Hand the learner the questions a tech asks so they ask them unprompted.
- **Learning science:** Self-questioning / internalized cognitive strategy; the endpoint of cognitive apprenticeship.
- **Industrial purpose:** The mentor's real gift isn't answers; it's the questions.
- **Cognitive skill:** Self-directed methodology.
- **Emotional effect:** Ownership — "these are mine now."
- **Use when:** As a path/lesson closes. **Don't use when:** before the learner has experienced the questions in action.
- **Relationships:** The payoff of Reflection and Reason Before Verdict; enables independence.
- **Flagship example:** mc-14: "keep the questions I kept asking you — what changed / verified vs assumed / cheapest test / is it safe."
- **Future examples:** Each domain contributes its own tech-questions to a growing personal checklist.
- **AI mentor role:** Fade to only asking the internalized questions, then to silence.
- **Competency signals:** `selfQuestioning`.
- **Manager dashboard output:** Whether a technician self-initiates the method (independence indicator).
- **Assessment implication:** True mastery = the learner asks the questions without being prompted.
- **Future extension:** A living "your troubleshooting playbook" per learner.

### Stage 8 — Communicate

#### 25. Operator Communication · status: planned — *missing today, requires AI*
- **Purpose:** Explain the fault and fix to a machine operator in plain, correct terms.
- **Learning science:** Learning-by-teaching / the protégé effect; explaining forces understanding.
- **Industrial purpose:** Techs who can't communicate cause repeat failures and mistrust.
- **Cognitive skill:** Communication.
- **Emotional effect:** Professional competence.
- **Use when:** After a fix, as the closing beat. **Don't use when:** no AI grader (would be un-assessable).
- **Relationships:** Consumes Root Cause Explanation; sibling of Shift Handoff and Work Order.
- **Flagship example:** Not present — an identified gap ("the line's back up; explain to the operator what happened").
- **Future examples:** Every scenario ends with an explain-to-operator step.
- **AI mentor role:** Play the operator; grade clarity, accuracy, and tone.
- **Competency signals:** `communicationClarity`.
- **Manager dashboard output:** Communication sub-score — often the promotion blocker.
- **Assessment implication:** Communication is a certifiable competency, not an afterthought.
- **Future extension:** Role-play conversations with the AI operator.

#### 26. Shift Handoff · status: planned — *requires AI*
- **Purpose:** Summarize state, findings, and open items for the next shift.
- **Learning science:** Synthesis and audience-tailoring; retrieval into a new format.
- **Industrial purpose:** Bad handoffs cause re-work and missed intermittent faults.
- **Cognitive skill:** Communication / synthesis.
- **Emotional effect:** Responsibility.
- **Use when:** Unresolved or long-running faults. **Don't use when:** the task fully closed within the session.
- **Relationships:** Consumes Evidence Collection and Reflection.
- **Flagship example:** Not present — a gap.
- **Future examples:** Intermittent-fault scenarios that must be handed off with a hypothesis.
- **AI mentor role:** Grade completeness against what the next shift needs.
- **Competency signals:** `handoffCompleteness`.
- **Manager dashboard output:** Handoff-quality score.
- **Assessment implication:** Tests synthesis under incomplete resolution.
- **Future extension:** Handoff templates aligned to plant standards.

#### 27. Work Order Documentation · status: planned — *requires AI*
- **Purpose:** Write the fault, cause, and corrective action into a work-order record.
- **Learning science:** Structured articulation; documentation cements causal understanding.
- **Industrial purpose:** CMMS data quality drives reliability programs; sloppy work orders poison the data.
- **Cognitive skill:** Communication / documentation.
- **Emotional effect:** Closure, accountability.
- **Use when:** Closing any repair. **Don't use when:** diagnosis-only exercises.
- **Relationships:** Consumes Root Cause Explanation.
- **Flagship example:** Not present — a gap.
- **Future examples:** CMMS-style work-order authoring per scenario.
- **AI mentor role:** Grade against fault/cause/action completeness and clarity.
- **Competency signals:** `documentationQuality`.
- **Manager dashboard output:** Documentation-quality score — ties to reliability-program value.
- **Assessment implication:** A repair isn't complete until it's documented.
- **Future extension:** Integrations that export practice work orders to real CMMS formats.

### Stage 9 — Verify competency

#### 28. Competency Update · status: implemented (lesson→graph wiring partial)
- **Purpose:** Every demonstrated action updates the competency graph — demonstrated, not declared.
- **Learning science:** Evidence-centered assessment; competency inferred from performance, not completion.
- **Industrial purpose:** Managers need to know who can actually do the work.
- **Cognitive skill:** (system) competency measurement.
- **Emotional effect:** Progress is real and earned.
- **Use when:** Every scored performance. **Don't use when:** pure exploration with no performance.
- **Relationships:** Fed by every Test/Reason mechanic; feeds Manager Validation and Career Readiness.
- **Flagship example:** Simulator methodology scoring + the competency graph; lesson→graph wiring is the next build.
- **Future examples:** Every lesson mastery event and sim run updates domain confidence and methodology tier.
- **AI mentor role:** Convert free-form performance into structured competency evidence.
- **Competency signals:** `domainConfidence`, `methodologyTier`.
- **Manager dashboard output:** The competency matrix itself.
- **Assessment implication:** The graph *is* the assessment system of record.
- **Future extension:** Unify lesson, sim, and review signals into one competency update pipeline (**the assessment spine**).

#### 29. Manager Validation · status: implemented — *requires manager*
- **Purpose:** A supervisor attests a competency on the plant floor, raising its trust weight.
- **Learning science:** Social proof + authentic assessment; human attestation anchors the digital signal to reality.
- **Industrial purpose:** No VP trusts a purely self-reported skill; a lead's signature carries weight.
- **Cognitive skill:** (system) verification.
- **Emotional effect:** Recognized by a human who matters.
- **Use when:** For competencies that gate promotion or high-risk work. **Don't use when:** low-stakes practice.
- **Relationships:** Raises the trust weight of Competency Update; gates Career Readiness.
- **Flagship example:** `competencyGraph.validate` + the Manager Dashboard "attest" control.
- **Future examples:** Every promotion-gating competency requires a manager attestation.
- **AI mentor role:** Surface which competencies are demonstrated-but-unvalidated and prompt the manager.
- **Competency signals:** `managerValidated`.
- **Manager dashboard output:** Validated vs demonstrated-only per technician.
- **Assessment implication:** Highest-trust competency tier requires human sign-off.
- **Future extension:** On-the-floor validation via a mobile attest flow.

#### 30. Career Readiness · status: implemented — *requires manager for top tier*
- **Purpose:** Roll verified competency into a shareable, employer-verifiable readiness signal.
- **Learning science:** Goal-gradient motivation; a visible destination sustains effort.
- **Industrial purpose:** The whole promise — operator becomes a hireable/promotable tech.
- **Cognitive skill:** (system) credentialing.
- **Emotional effect:** Pride, employability.
- **Use when:** As competencies accumulate. **Don't use when:** it would over-claim (readiness must be earned).
- **Relationships:** Aggregates Competency Update + Manager Validation.
- **Flagship example:** Skills Passport, `promotionReady`, employer-verifiable link.
- **Future examples:** Domain-specific readiness (VFD-ready, PLC-ready) rolling into an overall tech-ready signal.
- **AI mentor role:** Coach the learner on the shortest path to the next readiness milestone.
- **Competency signals:** `promotionReady`, `jobReadiness`.
- **Manager dashboard output:** Promotion-ready list; employer report.
- **Assessment implication:** Readiness is a defensible, evidence-backed claim.
- **Future extension:** Employer-facing verified hiring marketplace.

### Stage 10 — Retain over time

#### 31. Knowledge Decay · status: implemented
- **Purpose:** Competency confidence decays if not re-demonstrated — honesty about freshness.
- **Learning science:** Forgetting curve; skills atrophy without use.
- **Industrial purpose:** A cert from three years ago on a machine you haven't touched is not competence.
- **Cognitive skill:** (system) retention modeling.
- **Emotional effect:** Motivation to keep sharp.
- **Use when:** Continuously, per competency. **Don't use when:** never — but decay rates should vary by skill criticality.
- **Relationships:** Triggers Spaced Reinforcement; flags on the dashboard.
- **Flagship example:** Competency graph decay (stale at 180 days, decayed at 365).
- **Future examples:** Faster decay for rarely-used, high-risk skills.
- **AI mentor role:** Proactively schedule a refresh before a critical skill decays.
- **Competency signals:** `decayState`, `daysSinceDemonstrated`.
- **Manager dashboard output:** "Needs refresh / recert" list.
- **Assessment implication:** Recertification is required, not optional.
- **Future extension:** Risk-weighted decay curves per competency.

#### 32. Spaced Reinforcement · status: implemented (auto-enroll pending)
- **Purpose:** Resurface key facts on an SM-2 schedule so knowledge sticks.
- **Learning science:** Spacing effect + SM-2 scheduling — among the most robust findings in learning science.
- **Industrial purpose:** One-time exposure doesn't survive to the next breakdown.
- **Cognitive skill:** (system) durable retention.
- **Emotional effect:** Habit, steady mastery.
- **Use when:** For every key fact and decision rule. **Don't use when:** for one-off trivia not worth retaining.
- **Relationships:** Driven by Knowledge Decay and Reflection.
- **Flagship example:** `/review` SM-2 scheduler (auto-enrollment from lessons is the next build).
- **Future examples:** Every lesson's key facts auto-enroll; sim faults resurface as review items.
- **AI mentor role:** Choose what's worth reinforcing and phrase the review prompt.
- **Competency signals:** `retentionStrength`.
- **Manager dashboard output:** Team retention health.
- **Assessment implication:** Retention is measured, not assumed at course end.
- **Future extension:** Review items generated from a learner's own mistakes.

### The gradual-release spine (spans the whole arc)

#### 33. Master Demonstration · status: implemented
- **Purpose:** The mentor shows the move once, narrated — the "I do."
- **Learning science:** Cognitive apprenticeship (modeling); worked-example effect.
- **Industrial purpose:** "Watch how I do this" is how the trade is transmitted.
- **Cognitive skill:** Modeling / observation.
- **Emotional effect:** Shown, not lectured.
- **Use when:** First exposure to a technique. **Don't use when:** the learner can already perform it (skip to practice).
- **Relationships:** Rung 1 of the ladder; precedes Guided Practice.
- **Flagship example:** "Now watch — we meter the coil… 95 volts on a 120-volt coil."
- **Future examples:** A narrated first pass of any new procedure per domain.
- **AI mentor role:** Demonstrate with rationale, then step back.
- **Competency signals:** none (modeling).
- **Manager dashboard output:** none.
- **Assessment implication:** Not assessed; enables later assessment.
- **Future extension:** Recorded expert playthroughs as demonstrations.

#### 34. Guided Practice · status: implemented
- **Purpose:** The learner acts with the mentor's support and immediate reactions — the "we do."
- **Learning science:** Scaffolding within the zone of proximal development.
- **Industrial purpose:** "Now you try it, I've got you."
- **Cognitive skill:** Scaffolded performance.
- **Emotional effect:** Supported.
- **Use when:** Rung 2, after demonstration. **Don't use when:** the learner is ready to go solo.
- **Relationships:** Uses Mentor Reaction, Live System Interaction; between Demonstration and Independent Practice.
- **Flagship example:** `masterAsk` with reactions; the live circuit with hints available.
- **Future examples:** Assisted diagnosis in every domain with hints on request.
- **AI mentor role:** Provide the minimum support needed; withdraw as success grows.
- **Competency signals:** `assistedPerformance`.
- **Manager dashboard output:** none directly.
- **Assessment implication:** Assisted performance is a rung, not a certification.
- **Future extension:** Support level auto-tuned by competency.

#### 35. Independent Practice · status: partial
- **Purpose:** The learner performs unaided while the mentor watches — the "you do."
- **Learning science:** Retrieval + performance without support; the true test of learning.
- **Industrial purpose:** "Your call — I'm just watching."
- **Cognitive skill:** Independent performance.
- **Emotional effect:** Trusted, on their own.
- **Use when:** Rung 3, once guided practice is solid. **Don't use when:** fundamentals are shaky (regress to guided).
- **Relationships:** Precedes independence; primary source of certification evidence.
- **Flagship example:** The capstone ("your call — I'm just watching now").
- **Future examples:** Solo scenarios per domain with no hints and full scoring.
- **AI mentor role:** Stay silent unless a safety line is crossed; debrief after.
- **Competency signals:** `independentPerformance`.
- **Manager dashboard output:** Independent-performance rate — the promotion signal.
- **Assessment implication:** This is where certification evidence is generated.
- **Future extension:** Proctored, timed, unseen-variant capstones.

#### 36. Progressive Scaffolding · status: partial — *requires AI/competency signal*
- **Purpose:** Support decreases as demonstrated competency rises — help is earned down, not fixed.
- **Learning science:** Adaptive fading of scaffolds; the mechanism of the whole ladder.
- **Industrial purpose:** A good mentor gives less help as you get better, exactly when you're ready.
- **Cognitive skill:** (system) adaptivity.
- **Emotional effect:** Growing autonomy.
- **Use when:** Across a path, driven by the competency graph. **Don't use when:** signals are too sparse to adapt reliably.
- **Relationships:** Governs Demonstration → Guided → Independent; realized by Mentor Fade.
- **Flagship example:** Within-lesson fade (heavy scaffolding at open, none at capstone).
- **Future examples:** *Cross-lesson* fade — later lessons open with less help as the learner's domain confidence rises.
- **AI mentor role:** Read the competency graph and set the scaffold level per activity.
- **Competency signals:** `scaffoldLevel`.
- **Manager dashboard output:** none directly.
- **Assessment implication:** Ensures certification happens at low scaffold.
- **Future extension:** Fully competency-driven adaptive difficulty (**a top build priority**).

#### 37. Mentor Fade · status: implemented (within-lesson)
- **Purpose:** The mentor visibly steps back as the learner becomes capable — the end state of apprenticeship.
- **Learning science:** Scaffold removal; independence as the explicit goal.
- **Industrial purpose:** "You don't need me over your shoulder anymore."
- **Cognitive skill:** Autonomy.
- **Emotional effect:** "I can do this without him."
- **Use when:** As competency is demonstrated. **Don't use when:** prematurely (abandonment, not fading).
- **Relationships:** The visible expression of Progressive Scaffolding; end of the ladder.
- **Flagship example:** "From here, you don't need me over your shoulder."
- **Future examples:** The mentor's voice literally diminishes across a path.
- **AI mentor role:** Reduce intervention frequency as competency crosses thresholds.
- **Competency signals:** `autonomyReached`.
- **Manager dashboard output:** Who has reached autonomy per domain.
- **Assessment implication:** Autonomy is the terminal competency state.
- **Future extension:** Re-engage automatically if performance regresses.

#### 38. AI Mentor Intervention · status: partial — *requires AI; the generalizer*
- **Purpose:** An AI mentor reads the learner's actual moves/words and coaches in-context, generalizing every authored mechanic to open-ended reality.
- **Learning science:** Intelligent tutoring; one-to-one human tutoring is the 2-sigma benchmark this chases.
- **Industrial purpose:** A real mentor responds to *any* move, not just anticipated ones.
- **Cognitive skill:** (system) adaptive coaching.
- **Emotional effect:** "A mentor who truly responds to me."
- **Use when:** Everywhere authored mechanics fall short of open reality (free-text reasoning, novel moves, communication). **Don't use when:** a deterministic authored mechanic is sufficient and cheaper.
- **Relationships:** The open-ended generalization of Ask/Reason/Reaction/Communication mechanics; governed by Progressive Scaffolding.
- **Flagship example:** Today only in the post-scenario debrief (`TutorDebrief` via the LLM gateway); not yet reactive *inside* a lesson.
- **Future examples:** In-lesson coaching across every domain; the operator/handoff role-plays.
- **AI mentor role:** Is the role — observe, ask, wait, challenge, require reasoning, demonstrate, coach, fade, and emit competency evidence.
- **Competency signals:** `coachingResponsiveness` and (indirectly) all reasoning/communication signals.
- **Manager dashboard output:** AI-observed competency evidence feeding the graph.
- **Assessment implication:** Enables high-stakes open-ended assessment at scale.
- **Future extension:** The central nervous system of the engine — turns a fixed script into a living apprenticeship.

---

## 3. Cross-cutting systems

These are not mechanics but the shared machinery mechanics plug into. Every mechanic that emits a competency signal must route it here.

- **Competency graph** ([`shared/competencyGraph.ts`](../shared/competencyGraph.ts)): per-domain confidence, level (not_demonstrated → developing → competent → proficient → expert), decay, velocity, manager validation, promotion-readiness. "Demonstrated, not declared."
- **Skill domains** ([`shared/competencyMatrix.ts`](../shared/competencyMatrix.ts)): vfd, plc, motors, safety, electrical, networking, sensors, integration.
- **Methodology tiers** ([`client/src/lib/scoringEngine.ts`](../client/src/lib/scoringEngine.ts)): Master Diagnostician (≥85) · Systematic Troubleshooter (≥65) · Developing Technician (≥40) · Needs Methodology Training. Scored on *method*, not completion.
- **Spaced repetition** ([`client/src/pages/Review.tsx`](../client/src/pages/Review.tsx)): SM-2 scheduler at `/review`.
- **Simulator** (`SimulatorEngineV3`, `ConveyorTroubleshootingLab`): evidence, measurements, consequence engine, methodology scoring.
- **Manager dashboard / Skills Passport / employer report**: the read-out surfaces for the signals above.
- **Interaction & visual model** ([`shared/learningCardTypes.ts`](../shared/learningCardTypes.ts)): `reveal · choice · sequence · predict · reasoned`; per-choice `response`; visual `interactive` sims. Helpers in [`shared/lessonDecks/deckHelpers.ts`](../shared/lessonDecks/deckHelpers.ts): `masterAsk · predict · orderSteps · reasonedAsk · choiceMcq`.

**Signal contract:** every scored mechanic emits one or more competency signals → the competency graph updates the relevant domain(s) and methodology tier → the manager dashboard, skills passport, and employer report render those updates → decay and spaced reinforcement keep them honest over time. A mechanic that generates no signal is a teaching move, not an assessment move, and must be labeled as such.

---

## 4. Conformance rules (authoring checklist)

Every new lesson, mission, simulation, assessment, and AI-mentor interaction must:

1. **Ask before it tells.** The first interaction leads within the first three cards, after at most one scene-setting card. No wall of reading.
2. **Require commitment before any hint or answer.**
3. **Grade reasoning, not just the pick,** on any decision that matters (`reasoned`).
4. **Let mistakes play out** with a reaction to the *specific* move, and a path to try again — never a bare red X.
5. **Make the learner do, not read,** wherever behavior can be shown on a live system.
6. **Climb the ladder:** demonstrate → guide → release, with visibly decreasing scaffolding.
7. **Gate safety hard.** An unsafe action fails the attempt regardless of diagnosis.
8. **Close with reflection and internalized questions,** then hand the method over.
9. **Emit competency signals** to the graph for every scored action.
10. **Feed retention:** enroll key facts into spaced review; respect decay.
11. **Reference mechanics by their `LearningMechanicId`** from `shared/learningEngine.ts` so coverage is auditable.

A lesson that is entertaining but violates these is rejected. Engagement is not the objective; **judgment** is.

---

## 5. Roadmap (build order rationale)

The mechanics divide cleanly by dependency:

- **Ready now (authored, deterministic):** finish independent-practice conversions, reflection, confidence rating — cheap, no new infra.
- **Blocked on the assessment spine:** competency update from lessons, progressive/cross-lesson scaffolding — need the lesson→graph signal pipeline unified first.
- **Blocked on the AI mentor:** think-aloud, operator communication, shift handoff, work-order documentation, open-ended reason-before-verdict — need the in-lesson reactive AI mentor.

Recommended sequence: **(1) assessment spine** (unify lesson + sim + review signals into the competency graph) → **(2) in-lesson AI mentor** (generalizes half the catalog) → **(3) communication mechanics** on top of the mentor → **(4)** only then return to hand-authoring more flagship content, now that it can be measured and generalized.

---

## 6. Honest critique

See the accompanying report for the full analysis. In brief:

- **Strong today:** Ask/Predict/Reason Before Verdict, Mentor Reaction, Productive Failure, Meter Before Replace, Live System Interaction, Master Demonstration, Mentor Fade, Question Internalization, Knowledge Decay, Spaced Reinforcement, Manager Validation.
- **Weak (exists but shallow):** Think Aloud (multiple-choice, not free-text), Reflection, Confidence Rating, Progressive Scaffolding (within-lesson only), Independent Practice, Scenario Variation, Fault Transfer.
- **Missing:** Operator Communication, Shift Handoff, Work Order Documentation, in-lesson AI Mentor Intervention.
- **Most enterprise value:** Competency Update + Manager Validation + Career Readiness (measurable, verifiable workforce readiness is what a VP buys).
- **Strongest educational moat:** Reason Before Verdict + Fault Transfer + Mentor Fade, verified by the competency graph — transferable *judgment* that content and UI cannot copy.

---

*This document is the source of truth for how EASLearn teaches. Change it deliberately; keep [`shared/learningEngine.ts`](../shared/learningEngine.ts) in sync.*
