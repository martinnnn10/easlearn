# EASLearn Curriculum — Operator → Maintenance Technician

**Mission:** turn a motivated machine operator with little formal maintenance background into a job-ready industrial maintenance technician. Every lesson is practical, plant-floor real, interactive, and tied to actual maintenance work. No textbook filler.

**The bar:** `shared/lessonDecks/risk-assessment.ts` (Level 1) is the reference build — 23 cards, 7 interactive scenario checks, written in a 30-year tech's voice. Every lesson below is built to that standard, not to a word count.

> **How we teach is specified in [`docs/LEARNING_ENGINE.md`](docs/LEARNING_ENGINE.md)** — the educational operating system (the reusable apprenticeship mechanics behind every lesson, simulation, and assessment), with the machine-readable registry in [`shared/learningEngine.ts`](shared/learningEngine.ts). All curriculum work must conform to it. `docs/LEARNING_ENGINE.md` governs *how* lessons teach; this file governs *what* they cover.

---

## 1. Audit — where the content actually stands

| Content type | Count | State |
|---|---|---|
| Card-deck lessons (`shared/lessonDecks/*`) | ~32 | The good stuff — interactive, scenario-based |
| Markdown lessons (DB `content`) | ~160 | Mixed; many are thin and need the deck treatment |
| Scored simulators (V3) | ~13 | Strong — the moat |
| Interactive labs | 15+ | Strong |

**Verdict:** the *engine* is excellent; *breadth of deck-quality content* is the gap. The job is not to write new theory — it's to convert the operator-critical path into deck-quality, scenario-driven lessons. The Risk Assessment rebuild is lesson #1 of that effort.

---

## 2. Reusable lesson template (the 20 components → how they're implemented)

Each lesson is a `LessonCardDeck` in `shared/lessonDecks/`, registered in `shared/lessonCardContent.ts`, plus a curated assessment in `shared/curatedLessonAssessments*`. The 20 required components map to the build like this:

| # | Component | Where it lives in the build |
|---|---|---|
| 1 | Lesson title | `deck.title` |
| 2 | Who it's for | `deck.whatYoullLearn` framing (operator-moving-to-maintenance voice) |
| 3 | Real plant-floor scenario | Cold-open `concept` card (a real failure story) |
| 4 | Learning objectives | `deck.whatYoullLearn[]` |
| 5 | Why it matters (downtime/safety) | Stated in cold-open + summary |
| 6 | Core explanation, plain language | `concept` cards |
| 7 | Maintenance-tech mindset | Dedicated `concept` card ("how a tech thinks about this") |
| 8 | Step-by-step method | `example` card with numbered field procedure |
| 9 | Mistakes operators make | `example` card (split operator vs tech) |
| 10 | Mistakes new techs make | same card |
| 11 | Visual / simulator req | `visual` (diagram/callout) + simulator spec (§6) |
| 12 | Interactive checks | `interaction` cards via `choiceMcq()` |
| 13 | Scenario-based questions | scenario `example` + `interaction` pairs |
| 14 | Practical assessment | curated `lessonQuizzes` + linked simulator scenario |
| 15 | Competency tags | §8 mapping (SkillDomain + fault types) |
| 16 | Mastery criteria | §7 (pass thresholds + spaced-rep survival) |
| 17 | Evidence of knowledge | assessment pass + sim methodology score + free-text grade |
| 18 | Competency-graph update | scenarioCompletions / lessonAssessmentAttempts → `buildCells()` |
| 19 | AI tutor behavior | §7 (grounded coaching prompt per lesson) |
| 20 | Manager dashboard output | §9 |

**Card recipe (proven):** cold-open story → plain-English concept → tech mindset → interaction → method/checklist → interaction → 3–5 named scenarios (each example + check) → common mistakes → lesson-quiz interaction → summary. Aim 18–24 cards, `previewCardCount: 3`.

---

## 3. Curriculum map — Levels 0–10

| Level | Title | Modules (slugs) |
|---|---|---|
| **0** | Operator Foundation | how-machines-work · how-maintenance-thinks · plant-floor-orientation |
| **1** | Maintenance Safety & Plant Readiness | `safety-systems` (LOTO, **risk-assessment ✅**, stored energy, PPE, permits, hand tools, safe troubleshooting) |
| **2** | Mechanical Fundamentals | bearings · belts-chains · shafts-couplings · lubrication · alignment · fasteners · guarding |
| **3** | Electrical Fundamentals | `electrical-fundamentals` · meters · fuses-breakers · contactors-relays · overloads · `print-reading` |
| **4** | Sensors & Controls Basics | photoeyes · prox sensors · limit switches · encoders · solenoids · I/O troubleshooting (`sensors-instrumentation`) |
| **5** | Motor Controls & VFDs | `motors-controls` · starters · overloads · `powerflex-vfd` (faults, params, safe diagnosis) |
| **6** | PLC Troubleshooting | `plc-fundamentals` · ladder basics · forcing rules · fault tracing · online monitoring (no unsafe edits) |
| **7** | Fluid Power | pneumatics · hydraulics · valves · cylinders · FRLs · leaks · pressure/flow · contamination |
| **8** | Preventive Maintenance & Reliability | PM quality · inspections · lubrication · failure modes · RCA · documentation · CMMS |
| **9** | Troubleshooting Mastery | structured diagnosis · symptom vs cause · electrical/mechanical/process separation · escalation |
| **10** | Job Readiness | interview prep · maintenance communication · shift handoff · work orders · professionalism |

---

## 4. Prioritized first 50 lessons (the credible operator-to-tech spine)

Ordered so a learner is safe first, then useful, then hireable. ✅ = built to bar.

**Level 1 — Safety (1–8):** 1) Risk Assessment ✅ · 2) LOTO Step-by-Step · 3) Stored Energy Deep-Dive · 4) Verify Zero Energy · 5) PPE & Arc-Flash Basics · 6) Hand & Power Tools Safely · 7) Permits & Confined Space Awareness · 8) Safe Live-Troubleshooting Rules.

**Level 3 — Electrical (9–18):** 9) Voltage/Current/Resistance on the Floor · 10) Reading a Multimeter · 11) AC vs DC, 1φ vs 3φ · 12) Fuses vs Breakers · 13) Contactors & Coils · 14) Control Relays · 15) Overload Relays · 16) The 3-Wire Start/Stop Circuit · 17) Reading a Ladder/Print · 18) Tracing a Dead Circuit.

**Level 2 — Mechanical (19–28):** 19) Bearings: Fail Signs · 20) Belts & Sheaves · 21) Chains & Sprockets · 22) Shafts & Couplings · 23) Alignment Basics · 24) Lubrication Done Right · 25) Fasteners & Torque · 26) Guarding · 27) Vibration You Can Feel · 28) Mechanical Bind vs Electrical Fault.

**Level 4 — Sensors/Controls (29–35):** 29) Photoeyes · 30) Proximity Sensors (NPN/PNP) · 31) Limit Switches · 32) Encoders (aware) · 33) Solenoids · 34) PLC Inputs vs Outputs · 35) Troubleshooting a Dead Input.

**Level 5 — Motors/VFDs (36–41):** 36) Motor Basics & Nameplate · 37) Starter Troubleshooting · 38) Overload Trips (why, before reset) · 39) VFD Fault Codes · 40) VFD Parameter Awareness · 41) Safe VFD Diagnosis (DC bus).

**Level 6 — PLC (42–45):** 42) What a PLC Actually Does · 43) Reading Ladder Live (online) · 44) Forcing Rules & Dangers · 45) Fault Tracing I/O to Field.

**Level 7 — Fluid Power (46–48):** 46) Pneumatics & FRLs · 47) Cylinders & Valves · 48) Hydraulics & Pressure Safety.

**Levels 8–10 — Reliability & Readiness (49–50):** 49) Troubleshooting Methodology (gather→isolate→act) · 50) Work Orders, Handoff & Talking to Operators.

---

## 5. Build status & batch plan
- **Built to bar:** #1 Risk Assessment (this release). ~31 other decks exist and are strong; they map into the levels above.
- **Batch plan:** produce 5–8 lessons per batch at the Risk Assessment bar (each ~18–24 cards, scenario-driven, with curated assessment + competency tags). Batching keeps quality high — mass-generating 50 at once recreates the thin-content problem this whole effort exists to fix.

---

## 6. Simulator requirements (per technical lesson)
Each technical lesson links to a practice scenario (`deck` → `linkedScenarioSlug`). Requirements pattern:
- **Deterministic fault** with a single correct root cause and a known-good reasoning path (feeds trustworthy scoring).
- **Realistic instruments** (meter readings, fault codes, HMI states) matching the lesson.
- **Methodology scoring** on the 8 dimensions (already in `scoringEngine.ts`).
- **Safety gates** — unsafe actions (defeat guard, work live) penalized, matching the lesson's rules.
- Examples to build: LOTO-verify sim, dead-input trace, overload-cause diagnosis, VFD DC-bus-safe diagnosis, cylinder-bleed sequence.

---

## 7. Assessment logic & mastery
- **Formative:** in-lesson `interaction` cards (immediate feedback). Must answer to advance (dual-gate).
- **Summative:** curated `lessonQuizzes` (end-of-lesson) + the linked simulator methodology score.
- **Mastery criteria:** lesson quiz ≥ 80% AND (for technical lessons) linked-sim methodology ≥ "Systematic Troubleshooter." Concept then enters **spaced repetition** (`concept_reviews`) and must survive to the 21-day interval to count as durably mastered.
- **AI tutor behavior (per lesson):** grounded coaching only — on a wrong scenario answer, the tutor references the lesson's known-correct action and asks a Socratic nudge ("what would you verify before you reach in?"), never hands the answer, never invents readings. Debrief narrates over the deterministic score.

---

## 8. Competency graph tags (SkillDomain)
Each lesson tags one primary domain so completions roll into `buildCells()` / the competency graph:

| Level | Primary SkillDomain |
|---|---|
| 1 Safety | `safety` |
| 2 Mechanical | `motors` (mechanical proxy) |
| 3 Electrical | `electrical` |
| 4 Sensors/Controls | `sensors` |
| 5 Motors/VFD | `motors`, `vfd` |
| 6 PLC | `plc` |
| 7 Fluid Power | `motors` (mechanical/fluid) |
| 8–10 Reliability/Readiness | `integration` |

*(A future migration can add finer fault-type tags; domain-level is the working spine today.)*

---

## 9. Manager dashboard outputs (per lesson)
Every completed lesson/scenario emits data the Manager Dashboard already consumes:
- **Per learner:** competency confidence in the lesson's domain, attempts, time-to-solve, last-demonstrated, decay status.
- **Rollups:** who's promotion-ready, who's strongest per domain, who's stale/needs recert, who's struggling (high attempts / low confidence).
- **Workforce Planner:** whether the team is ready for a project requiring that lesson's domain.
- **Evidence trail:** lesson-quiz attempts + open-response grades retained for accreditation (`open_response_attempts`).

---

*Next batch to build at the bar: Level 1 #2–4 (LOTO, Stored Energy, Verify Zero Energy) — they complete the safety foundation an operator needs before touching anything.*
