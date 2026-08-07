# Unified Technician Workstation — 10-Minute Buyer Demo Script

**Document version:** 1.0  
**Date:** 2026-07-23  
**Audience:** Maintenance managers, plant managers, training directors  
**Demo URL:** https://easlearn.org/labs/motor-control-workstation  
**Duration:** 10 minutes (8 min demo + 2 min Q&A transition)

---

## Opening Statement (30 seconds)

> "I want to show you something different from every other training platform you've seen. Most systems show you who completed a course. EASLearn shows you **how your technician troubleshoots** — what they tested, what they assumed, whether they proved the fault, and whether they worked safely. Let me show you exactly what that looks like."

---

## Demo Sequence

### Step 1 — Show the Machine Symptom (60 seconds)

**Action:** Open the workstation. Point to the header badge showing "OUTPUT ON / MOTOR DEAD."

**Narration:**

> "Here's the scenario your technician faces. A conveyor has stopped. The operator reported it. The PLC says the output is ON — the software thinks the motor should be running. But the belt isn't moving. Your technician needs to figure out why."

**What to highlight:**

- The machine view on the left shows the physical conveyor with components
- The symptom is clear: PLC says run, motor says no
- This is a real diagnostic challenge that happens on every plant floor

---

### Step 2 — First Test Selection (60 seconds)

**Action:** Click the contactor K1 on the machine view. Show the cross-highlight on the ladder logic.

**Narration:**

> "Watch what happens when the technician selects a component. The ladder logic highlights the relevant rung. They can see the relationship between the physical device and the program logic. Now they need to decide: where do I put my meter first?"

**What to highlight:**

- Cross-highlighting between machine view and ladder logic
- The technician must choose a measurement strategy — this is where methodology shows
- A systematic technician starts at the PLC output and works downstream
- A guessing technician jumps randomly

---

### Step 3 — PLC State vs. Field Voltage (90 seconds)

**Action:** Point to the PLC I/O Status panel. Show the distinction between software state (green "ON") and measured value ("NOT VERIFIED" or actual voltage).

**Narration:**

> "This is the most important teaching moment in industrial maintenance. See these two columns? The left side shows what the PLC software says — the output bit is ON. The right side shows what's actually measured at the terminal. These are NOT the same thing. A junior technician assumes that if the PLC says ON, there must be voltage. An experienced technician knows you have to prove it with a meter. EASLearn teaches this distinction through practice, not lecture."

**What to highlight:**

- Software state vs. measured value — explicitly separated
- The "NOT VERIFIED" badge until the learner physically measures
- This single distinction is worth the entire platform to a maintenance manager

---

### Step 4 — Place Meter Leads (60 seconds)

**Action:** Select the K1 A1–A2 probe point. Take a VDC reading. Show the result: ~24 VDC.

**Narration:**

> "The technician places their meter leads on the contactor coil terminals. They get 24 volts — the coil is energized. Now they know: control power is reaching the contactor. So why isn't the motor running? They record their interpretation and update their hypothesis."

**What to highlight:**

- Meter probe selection mimics real field work
- The reading is recorded with timestamp
- The interpretation links the reading to the hypothesis
- This is evidence of reasoning, not just a button click

---

### Step 5 — Test History and Reasoning (60 seconds)

**Action:** Show the test history panel with 2–3 measurements recorded. Point to the interpretations.

**Narration:**

> "Every measurement is recorded. Every interpretation is captured. You can see exactly what your technician tested, in what order, and what they concluded from each reading. This is the difference between EASLearn and a video course. A video shows them the answer. EASLearn shows you whether they can find it themselves."

**What to highlight:**

- Chronological test history with timestamps
- Each reading has an interpretation attached
- The sequence reveals methodology — systematic vs. random
- This data persists and is visible to the manager

---

### Step 6 — Complete the Diagnosis (60 seconds)

**Action:** Show the hypothesis being confirmed (contactor mechanical failure). Apply the corrective action. Belt starts running.

**Narration:**

> "The technician confirms the root cause: the contactor coil energizes but the mechanical linkage has failed — the power contacts don't close. They apply the corrective action, and the belt runs. But here's what matters: we didn't just record that they fixed it. We recorded HOW they found it."

**What to highlight:**

- Hypothesis confirmed based on evidence, not guessing
- Corrective action follows confirmed diagnosis (not trial-and-error)
- Machine state changes — visual confirmation of repair
- The entire reasoning chain is preserved

---

### Step 7 — Reasoning Replay (60 seconds)

**Action:** Open the Replay tab. Show the chronological timeline of the technician's diagnostic path.

**Narration:**

> "After completion, you get the full reasoning replay. Every measurement, every hypothesis change, every decision — in order, with timestamps. You can see whether they followed a logical isolation sequence or whether they were guessing. This is what traditional training can never show you."

**What to highlight:**

- Timeline with elapsed time for each action
- Hypothesis status changes annotated
- Corrective action event marked
- This is the evidence that proves (or disproves) competency

---

### Step 8 — Manager Attempt View (90 seconds)

**Action:** Switch to the Manager Dashboard (or show the design mockup). Show the attempt detail for this technician.

**Narration:**

> "Now here's what you see as the manager. Every attempt by every technician, with methodology tier, safety status, and reasoning quality. You can drill into any attempt and see the full timeline. You can answer the question every maintenance manager asks: 'Is this person ready for independent troubleshooting?' Not based on a quiz score. Based on what they actually did when faced with a real fault."

**What to highlight:**

- Methodology tier: Systematic / Guided / Exploratory / Random
- Safety status: Clean or violations
- Evidence summary: what competencies were demonstrated
- Manager can validate readiness or request more practice
- No vanity scores — just facts about what happened

---

### Step 9 — Readiness and Safety Evidence (60 seconds)

**Action:** Show the Skills Passport view for the technician.

**Narration:**

> "The technician's Skills Passport shows demonstrated competencies — not course completions. Motor Control Troubleshooting: demonstrated. Electrical Diagnostic Method: demonstrated. Safety Judgment: clean. PLC Output Verification: demonstrated. These aren't awarded from watching a video. They're earned by performing systematic diagnosis under realistic conditions, verified by their manager."

**What to highlight:**

- Competencies earned through performance, not completion
- Manager validation required for readiness
- Safety overrides positive signals
- One lucky guess does not create readiness

---

### Step 10 — Closing Value Statement (30 seconds)

> "Traditional training shows who completed a course. EASLearn shows how they troubleshoot. You see what they tested, what they assumed, and whether they proved the fault. Stop guessing who is ready for independent troubleshooting. The workstation produces manager-visible competency evidence — not just a completion record."

---

## Transition to Q&A

> "That's the product. I'd like to hear what questions you have, and whether this matches the problems you're seeing with your current training approach."

---

## Anticipated Buyer Questions

| Question | Response |
|----------|----------|
| "How many scenarios do you have?" | "We're launching with Motor Control Troubleshooting — two fault scenarios that cover the most critical diagnostic distinction in industrial maintenance. We're adding VFD troubleshooting next. Quality over quantity — each scenario must teach a meaningful diagnostic skill." |
| "Can my technicians use this on their phones?" | "Yes. The workstation is fully responsive. The mobile version uses a tabbed interface with the same diagnostic workflow. We recommend desktop for the best experience, but mobile works for practice on the floor." |
| "How long does each scenario take?" | "An experienced technician completes a scenario in 3–5 minutes. A developing technician might take 8–10 minutes. The system doesn't penalize time — it evaluates methodology." |
| "What if they cheat or look up the answer?" | "The workstation records their reasoning sequence. Even if they know the answer, the methodology tier reveals whether they followed a systematic process or jumped to the conclusion. A manager can see the difference." |
| "How is this different from a CBT or e-learning course?" | "A course shows them the answer and asks them to repeat it. EASLearn puts them in the situation and records what they do. The evidence shows whether they can troubleshoot — not whether they can pass a quiz." |
| "What does it cost?" | "We offer a paid pilot for one facility: one manager, 10–25 technicians, one flagship lab. Baseline attempt, assigned practice, follow-up attempt, and a manager readiness report. I can send you the pilot scope." |

---

## Demo Environment Preparation

Before the demo, ensure:

1. Workstation loads cleanly at the demo URL
2. Scenario `output_on_motor_dead` is selected
3. No previous test history is visible (fresh state)
4. Desktop browser at 1920×1080 or higher
5. PLC I/O panel is visible in the right column
6. Replay tab is accessible in the bottom drawer

---

## Key Phrases to Use

- "Shows how they troubleshoot, not just that they finished"
- "Manager-visible competency evidence"
- "PLC software state is not the same as field voltage"
- "Methodology, not just result"
- "Earned through performance, not completion"
- "Stop guessing who is ready"

## Key Phrases to Avoid

- "AI-powered" (unless specifically asked about the technology)
- "Gamification" or "badges"
- "100% pass rate" or any completion metrics
- "Guaranteed downtime reduction" (until customer data supports it)
- "Replace your current training" (position as complement, not replacement)
