# Minimum Viable Operator Path — Handoff Document

**Sprint completed:** 2026-08-05
**Verdict:** MINIMUM VIABLE OPERATOR PATH READY

---

## 1. Final Operator Path (operator_to_tech)

The path is assigned when a learner selects: Machine operator / None / Move into maintenance.

| Order | Module | Lessons | Est. Time | Status |
|-------|--------|---------|-----------|--------|
| 1 | Industrial Maintenance Orientation | 3 | 15 min | NEW — created this sprint |
| 2 | Safety Systems | 9 | 2 hr | Existing published |
| 3 | Electrical Fundamentals | 6 | 2 hr | Existing published |
| 4 | Basic Meter Usage | 5 | 50 min | NEW — created this sprint |
| 5 | Print Reading | 8 | 2 hr | Existing published |
| 6 | Motors & Motor Controls | 6 | 2 hr | Existing published |
| 7 | Guided Beginner Troubleshooting | 1 | 20 min | NEW — created this sprint |
| 8 | PLC Fundamentals | 24 | 8 hr | Existing published |

Total estimated path duration: approximately 19 hours of content.

---

## 2. Content Created

### Module 1: Industrial Maintenance Orientation (ID 200001)

Slug: `maintenance-orientation`

| Lesson | Slug | Words | Minutes | Content |
|--------|------|-------|---------|---------|
| What Maintenance Technicians Actually Do | `what-maintenance-techs-do` | ~650 | 5 | Roles, responsibilities, observation vs. assumption |
| Safety and Authorization Come First | `safety-before-troubleshooting` | ~600 | 5 | LOTO, authorization, escalation, what EASLearn does NOT authorize |
| How Technicians Think | `how-technicians-think` | ~750 | 5 | Symptoms vs. root causes, 12-step diagnostic method, verification terminology |

No lesson is empty or placeholder. All three render correctly at their routes.

### Module 2: Basic Meter Usage (ID 200002)

Slug: `basic-meter-usage`

| Lesson | Slug | Words | Minutes | Interactions |
|--------|------|-------|---------|-------------|
| Know the Meter | `know-the-meter` | ~700 | 10 | Knowledge check (meter inspection) |
| Select the Correct Function | `select-correct-function` | ~800 | 10 | Knowledge check + function selection exercise (5 scenarios) |
| Measuring Voltage | `measuring-voltage` | ~900 | 12 | Knowledge check + lead placement exercise |
| Resistance and Continuity | `resistance-and-continuity` | ~700 | 10 | Safety decision exercise (hard gate) |
| Interpret and Document the Reading | `interpret-and-document` | ~750 | 8 | Documentation exercise + knowledge check |

No lesson is empty or placeholder. All five render correctly at their routes.

### Module 3: Guided Beginner Troubleshooting (ID 200003)

Slug: `guided-beginner-troubleshooting`

| Lesson | Slug | Words | Minutes | Linked Scenario |
|--------|------|-------|---------|----------------|
| Guided Diagnosis: Motor Overload Trip | `guided-overload-trip` | ~1,400 | 20 | `overload-trip-v1` |

No lesson is empty or placeholder. Renders correctly at its route.

---

## 3. Lesson Objectives

**Orientation:**
- Understand what maintenance technicians do (not just "fix things")
- Distinguish operator, technician, controls tech, and leader roles
- Recognize that safety and authorization precede troubleshooting
- Understand observation vs. assumption
- Know when to escalate

**Meter Usage:**
- Identify all parts of a digital multimeter
- Select the correct function for each measurement type
- Measure voltage between two points and interpret the result
- Understand that software state does not prove physical voltage
- Perform resistance/continuity only on de-energized circuits (safety gate)
- Document a measurement with the 6-question framework

**Guided Troubleshooting:**
- Apply the full 12-step diagnostic method to a real fault
- Form a hypothesis before measuring
- Predict the expected result before taking the reading
- Interpret the reading using verification terminology
- Document the repair

---

## 4. Interactions

| Module | Type | Description |
|--------|------|-------------|
| Orientation | Knowledge checks (3) | Multiple-choice with correct answer and explanation |
| Meter Usage | Knowledge checks (5) | One per lesson, contextual to the topic |
| Meter Usage | Function selection exercise | 5 scenarios requiring correct function identification |
| Meter Usage | Lead placement exercise | Fuse-testing scenario with expected/actual predictions |
| Meter Usage | Safety decision exercise | Hard gate: what must happen before resistance measurement |
| Meter Usage | Documentation exercise | Complete a 6-field measurement record |
| Guided Troubleshooting | Reflection questions (3) | Open-ended, no scoring |

All interactions are embedded in lesson content. No fake interactive controls disconnected from the lesson system.

---

## 5. Safety Gates

| Gate | Location | Enforcement |
|------|----------|-------------|
| "Online training does not authorize electrical work" | Orientation lesson 2 | Explicit statement + knowledge check (correct answer: C — never) |
| "De-energize before resistance/continuity" | Meter lesson 4 | Bold safety rule + safety decision exercise |
| "Verify zero energy with your own meter" | Meter lesson 4 | Exercise requires selecting verification-first answer |
| "Software state ≠ physical voltage" | Meter lesson 3 | Dedicated section + knowledge check |

---

## 6. Existing Fault Reused

The guided troubleshooting module uses the `overload_tripped` fault from the existing conveyor fault engine. No new faults were added. No modifications to the fault engine were made.

The guided lesson teaches the diagnostic process using the overload trip scenario, then directs the learner to the Conveyor PLC Lab simulator to attempt the same fault independently.

---

## 7. Assessment Evidence Mapping

Evidence captured through existing Assessment Spine patterns:

| Evidence Type | Where Captured |
|---------------|---------------|
| Reasoned answer | Knowledge checks in all 3 modules |
| Safety decision | Meter lesson 4 safety gate exercise |
| Measurement prediction | Meter lesson 3 lead placement exercise |
| Tool selection | Meter lesson 2 function selection exercise |
| Interpretation | Meter lesson 5 documentation exercise |
| Diagnosis submitted | Guided troubleshooting step 4 (hypothesis) |
| Repair verification | Guided troubleshooting step 9 |
| Reflection | Guided troubleshooting final reflection |
| Simulation completion | When learner completes the linked scenario in the lab |

No new scoring model was created. Existing Assessment Spine evidence patterns are used.

---

## 8. Desktop QA

| Check | Result |
|-------|--------|
| Orientation lesson 1 loads | PASS — renders at `/courses/maintenance-orientation/what-maintenance-techs-do` |
| Orientation lesson 2 loads | PASS — renders at `/courses/maintenance-orientation/safety-before-troubleshooting` |
| Orientation lesson 3 loads | PASS — renders at `/courses/maintenance-orientation/how-technicians-think` |
| Meter lesson 1 loads | PASS — renders at `/courses/basic-meter-usage/know-the-meter` |
| Meter lesson 2 loads | PASS — renders at `/courses/basic-meter-usage/select-correct-function` |
| Meter lesson 3 loads | PASS — renders at `/courses/basic-meter-usage/measuring-voltage` |
| Meter lesson 4 loads | PASS — renders at `/courses/basic-meter-usage/resistance-and-continuity` |
| Meter lesson 5 loads | PASS — renders at `/courses/basic-meter-usage/interpret-and-document` |
| Guided troubleshooting loads | PASS — renders at `/courses/guided-beginner-troubleshooting/guided-overload-trip` |
| Module index pages load | PASS — all 3 module landing pages render |
| Tables render correctly | PASS — markdown tables display as formatted HTML tables |
| Code blocks render | PASS — circuit diagram in guided lesson renders in code block |
| No "Module not found" errors | PASS |
| No broken navigation links | PASS |

---

## 9. Mobile QA

| Check | Result |
|-------|--------|
| Lessons readable on mobile viewport | PASS — content reflows, tables scroll horizontally |
| No horizontal page scroll | PASS |
| Navigation accessible | PASS — hamburger menu works |
| Knowledge checks readable | PASS — answer options are full-width |
| Onboarding wizard works on mobile | PASS — one decision per screen, large targets |

---

## 10. Known Remaining Gaps

| Gap | Impact | Recommendation |
|-----|--------|---------------|
| No interactive meter simulation (drag probes, see readings) | Learner reads about meter usage but cannot practice in a simulated meter UI | Build a simple meter simulator component for the meter module (future sprint) |
| Only 1 guided scenario | Learner gets one guided experience before independent practice | Add 2-3 more guided scenarios using existing faults (e_stop_open, output_on_motor_dead) |
| No progressive guidance reduction | The guided lesson is the same on first and second read | Implement a "second attempt" mode with fewer prompts (requires state tracking) |
| Knowledge checks are not gated | Learner can scroll past without answering | Wire knowledge checks to the existing KC assessment system for enforcement |
| No "Industrial Maintenance Orientation" video | Text-only orientation may not engage all learners | Consider a 5-minute video walkthrough of a real plant maintenance department |

---

## 11. Additional Scenarios Deferred

Per the sprint scope, the following were explicitly NOT built:
- Three new independent fault scenarios
- New fault engine entries
- AI-generated lessons
- Timer-based scoring
- Current measurement exercises
- Advanced multimeter theory

These remain available for a future content expansion sprint.

---

## 12. Final Recommendation

**MINIMUM VIABLE OPERATOR PATH READY**

A machine operator with no electrical experience can now:
1. Complete onboarding and receive a structured path
2. Learn what maintenance technicians do and how they think
3. Understand that safety and authorization come first
4. Learn to use a meter safely (function selection, voltage measurement, resistance/continuity with safety gate)
5. Understand that software state does not prove physical voltage
6. Walk through a complete guided diagnosis using the overload_tripped fault
7. Be directed to the simulator for independent practice

The path uses only real published content. No placeholders exist. No broken routes. No fake completion states. The content is written in plant-floor language without motivational filler or career promises.

The system is ready for a real machine operator to use as their entry point into maintenance training.

---

## HARDENING SPRINT ADDENDUM (2026-08-05)

**Updated Verdict: OPERATOR PATH HARDENED — READY FOR REAL-USER TESTING**

---

## 13. KC Enforcement Behavior

10 safety-critical knowledge check questions seeded across 5 Basic Meter Usage lessons (2 per lesson). These use the existing `lesson_assessment_questions` table and `LessonAssessmentPanel` component.

| Lesson | KC Questions | Safety-Critical Topics |
|--------|-------------|----------------------|
| Know the Meter | 2 | CAT rating verification, correct terminal identification |
| Select the Correct Function | 2 | AC vs DC selection, resistance on energized circuit danger |
| Measuring Voltage | 2 | Software state vs physical voltage, PLC ON ≠ voltage present |
| Resistance and Continuity | 2 | De-energize before continuity, continuity ≠ load capacity |
| Interpret and Document | 2 | Reading interpretation, single reading ≠ complete diagnosis |

**Blocking behavior:** The existing `buildModuleLessonGates` function prevents advancement to the next lesson until the KC is passed (80% threshold). The learner cannot skip or scroll past.

---

## 14. Remediation Behavior

The existing `LessonAssessmentPanel` already implements full remediation:

1. Incorrect answer → shows per-question feedback with the specific risk/misunderstanding
2. Highlights the correct answer with explanation
3. Shows the learner's wrong selection with strikethrough
4. Provides a "Try Again" button to reset and attempt again
5. Records each attempt in `lesson_assessment_attempts` (userId, lessonId, score, passed, answers)
6. Does NOT reveal the correct answer before the learner makes a genuine attempt
7. Does NOT award mastery from passing one knowledge check

No new remediation component was needed — the existing system already meets all requirements.

---

## 15. Interactive Meter Exercises

5 exercises embedded in the Basic Meter Usage lessons, reusing the `VirtualMultimeterLab` architecture:

| Exercise | Lesson | Interaction | Safety Gate |
|----------|--------|-------------|-------------|
| 1. Meter Setup | know-the-meter | Select function (V AC), tap test points | Blocks Ω/continuity on energized circuit |
| 2. Measure AC Voltage | select-correct-function | Place leads on coil terminals | Blocks Ω/continuity on energized circuit |
| 3. Software vs Physical | measuring-voltage | Measure PLC output terminal | Shows PLC ON but 0V physical |
| 4. Safe Continuity | resistance-and-continuity | Select continuity on de-energized circuit | Only permits after LOTO confirmed |
| 5. Interpret & Document | interpret-and-document | Measure fuse, fill 6-field form | Requires 4+ documentation fields |

---

## 16. Reused Components

| Component | Source | Reused Elements |
|-----------|--------|----------------|
| `BeginnerMeterExercise` | New (this sprint) | Architecture from `VirtualMultimeterLab` |
| `VirtualMultimeterLab` | Existing | TestPoint model, MeterSetting type, tap-to-select pattern, safety blocking |
| `LessonAssessmentPanel` | Existing | KC submission, remediation display, retry, gate enforcement |
| `lessonAssessmentQuestions` | Existing table | Question storage with options JSON, correctIndex, explanation |
| `lessonAssessmentAttempts` | Existing table | Attempt recording with score, passed, answers |
| `buildModuleLessonGates` | Existing function | Lesson progression gating |

---

## 17. Safety Gates (Hardened)

| Gate | Enforcement | Behavior |
|------|-------------|----------|
| Resistance/continuity on energized circuit | Exercise blocks action | Red alert: "UNSAFE — Action Blocked" with explanation |
| Wrong meter function (non-dangerous) | Exercise shows hint | Amber feedback: "Not quite. Consider the circuit type." |
| KC: resistance on live circuit | Assessment blocks advancement | Must answer correctly (80%) to proceed to next lesson |
| KC: software state ≠ voltage | Assessment blocks advancement | Must demonstrate understanding before meter exercises |
| KC: continuity ≠ load capacity | Assessment blocks advancement | Must understand limitations before guided troubleshooting |

---

## 18. Mobile Behavior

| Requirement | Implementation |
|-------------|---------------|
| Tap-to-select test points | Grid of buttons (2-col mobile, 3-col desktop) — no drag |
| Large touch targets | Full-width buttons with padding, min 44px height |
| Selected points visible | Color-coded border + label display above grid |
| Meter function visible | Persistent 2x2 grid of function buttons |
| Reading not hidden | Result displayed inline after probe confirmation |
| No horizontal overflow | Grid layout with responsive columns |
| Unsafe messages readable | Full-width alert card with icon + explanation |
| Reset available | "Reset" button in exercise header |

---

## 19. Evidence Captured

| Evidence Type | Where Recorded | System |
|---------------|---------------|--------|
| KC attempt (correct/incorrect) | `lesson_assessment_attempts` | Existing KC system |
| KC score per lesson | `lesson_assessment_attempts.score` | Existing KC system |
| KC pass/fail | `lesson_assessment_attempts.passed` | Existing KC system |
| Meter function selection | Exercise component (client-side) | Local state |
| Test point selection | Exercise component (client-side) | Local state |
| Safe/unsafe decision | Exercise component (client-side) | Local state |
| Documentation response | Exercise component (client-side) | Local state |

Note: Interactive exercise evidence is currently client-side only. The KC system provides the server-side assessment record. A future sprint could persist exercise attempts to the database for richer evidence.

---

## 20. Deferred: `estop_open` Scenario

The second guided scenario using fault `estop_open` (not `e_stop_open`) is deferred. It will only be added after a real machine operator completes the current path and demonstrates that another guided scenario is needed.

---

## 21. Real-User Testing Instructions

### Setup
1. Create a fresh account (or use a test account with no prior progress)
2. Navigate to https://easlearn.org/onboarding
3. Select: Machine operator → None yet → Move from operations into maintenance

### Verification Checklist
1. Path assigns correctly (8 modules starting with Industrial Maintenance Orientation)
2. First lesson launches: "What Maintenance Technicians Actually Do"
3. Complete orientation lessons (3 lessons, ~15 min)
4. Safety Systems module follows (existing content)
5. After Safety Systems, Electrical Fundamentals follows
6. After Electrical Fundamentals, Basic Meter Usage launches
7. KC questions appear at the bottom of each meter lesson
8. Incorrect safety answers show explanation and require retry
9. Meter exercises appear between content and KC panel
10. Exercise 3 shows PLC ON but requires physical measurement
11. Exercise 4 blocks continuity on energized circuit with red alert
12. Exercise 5 requires documentation (4+ fields)
13. After meter module, Print Reading follows
14. After Motors & Motor Controls, Guided Beginner Troubleshooting launches
15. Guided troubleshooting uses overload_tripped fault
16. Path progress updates in "Continue Your Path"
17. Logging out and returning shows resume card
18. Mobile: all exercises work with tap (no drag)
19. No placeholder content or broken routes

### Known Limitations for Testers
- Exercise evidence is client-side only (not persisted to database)
- KC questions use the existing 80% pass threshold (both questions must be correct)
- The guided troubleshooting lesson is text-based (not interactive simulator)
- Only 1 guided scenario exists (overload_tripped)

---

## 22. Final Verdict

**OPERATOR PATH HARDENED — READY FOR REAL-USER TESTING**

A machine operator with no electrical experience can now:
1. Complete onboarding and receive a structured 8-module path
2. Learn what maintenance technicians do (orientation)
3. Understand safety and authorization requirements
4. Learn to use a meter with interactive exercises that block unsafe actions
5. Demonstrate understanding through safety-critical knowledge checks that gate progression
6. Receive remediation with specific explanations when answers are incorrect
7. Walk through a complete guided diagnosis
8. Be directed to independent practice in the simulator

The path is frozen for real-user testing. No further content or interaction changes until a real operator completes the path and provides feedback.
