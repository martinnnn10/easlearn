# VP of Maintenance — Live Demo Walkthrough (10 minutes)

**The one sentence:** *EASLearn doesn't just teach lessons — it measures maintenance judgment: troubleshooting, reasoning, safety, communication, documentation, and handoff — as evidence a manager can trust.*

---

## Before the demo (5 minutes, once)

1. **Verify the environment** (idempotent, safe to re-run):
   ```
   node scripts/verify-demo-readiness.mjs
   ```
   Must print `ALL CHECKS PASSED`. This applies/verifies migrations 0036/0037/0038 and proves evidence persistence against the live DB. *(Verified 2026-07-05: all pass; a legacy-shaped empty `competency_validations` was preserved as `competency_validations_legacy_20260705` and recreated to the app schema.)*
2. **Reset the demo baseline** (run before EVERY demo — it's the reset button):
   ```
   node scripts/seed-demo.mjs
   ```
   Creates/refreshes:
   - **Manager:** `demo.manager@easlearn.demo` / `demo1234` (owner of "Demo Plant Maintenance")
   - **Learner:** `demo.tech@easlearn.demo` / `demo1234` (Marcus Doyle)
   - Baseline (honest, no fake mastery — verified live via `npx tsx scripts/demo-status.mts`):
     - Motor Control **62% · Almost Ready** ← the demo pushes this up live
     - Safety Circuits **72% · Needs Manager Validation** ← the attest moment
     - PLC **25% · Needs Review** · Work Order Documentation **30% · Needs Review** ← the coaching story
3. Two browser windows: **A = learner**, **B = manager**. Log both in.

---

## Opening positioning (30 seconds, window B on /manager)

> "Every training platform can show you completions. Completions don't fix machines. I'm going to show you how EASLearn measures whether Marcus can actually troubleshoot, stay safe, and explain a fault — and how you'd trust that evidence."

Point at the dashboard: Marcus is **Almost Ready** in Motor Control, **Needs Review** on PLC, and the communication card shows **needs work-order coaching**. *"None of this is self-reported. Every number traces to evidence — you'll watch him create some right now."*

## Step 1 — The lesson asks before it tells (window A, 2 min)

- Go to **`/courses/motors-controls/motor-control-circuits`**.
- Card 2: *"So — what's your first move?"* **Deliberately pick the wrong answer** — "Swap the contactor a third time."
- **What they see:** no red X. The mentor reacts to the specific move: *"That's exactly what the last guy did — twice…"* and hands it back. Pick the right one (meter the coil at A1–A2).
- **Say:** "It never rewards guessing. It reacts to what he actually did — like a senior tech would."

## Step 2 — Reasoning before verdict + the AI mentor (2 min)

- Continue to the live seal-in circuit (press & hold START, release — it keeps running). *"He's working the real circuit, not reading about it."*
- On the capstone (*"Your call — I'm just watching now"*): pick the right action, then when asked *"what made you think that?"* pick the weak reason ("metering is usually right"). **What they see:** *"Right call — but not for the reason you think."*
- **Say:** "Right answer, wrong reason is recorded as coached — not mastery. That's the difference between measuring answers and measuring judgment."
- Optional: open **Ask the mentor → Explain your reasoning**, type: `I verified 120V control voltage, so the break has to be one open device in the series string` → mentor affirms, chip shows **strong reasoning · recorded to your competency**.

## Step 3 — Close the ticket (2 min)

On the summary card, the closeout appears. Type these (they're calibrated):

- **Work order:** `Symptom: conveyor stopped, overload tripped. Tested the control string and metered the coil at 95V. Verified the cause before resetting. Corrective: corrected control voltage. Follow-up: monitor for repeat trips.` → **strong communication · recorded**.
- **Operator explanation:** `The overload tripped to protect the motor. I verified the control circuit before resetting it. If it trips again, don't keep resetting it — call maintenance, repeated trips mean something else is wrong.` → **strong**.
- **Say:** "A technician isn't done when the machine runs — they're done when the next person understands what happened. We measure that."

## Step 4 — Talk to the operator (1.5 min)

The role-play opens: a rushed operator asks *"Can I just reset it myself if it trips again?"*
- Answer in plain language (same style as above). The operator pushes back in character; the mentor then grades the exchange.
- **Optional safety moment (very effective):** answer `Sure, just keep resetting it` instead → the role-play STOPS, the mentor delivers a direct safety correction, and a **safety flag** is recorded. *(If you show this, re-run the seed after the demo.)*

## Step 5 — Watch the evidence land (window B, 2 min)

Refresh **/manager**:
- Motor Control confidence moved up from the live evidence; hover a matrix cell → **the rationale** ("Right action for the right reason — mastery-grade reasoning", or "Escalated by mentor review: …" when the AI reviewer tightened a grade).
- The communication card updates (strong work order → coaching flag clears over time).
- **Safety Circuits shows "Needs Manager Validation"** → use **Attest communication skill / attest…** with a required note: `Watched him explain the overload trip to the operator — clear, no blame, safe follow-up.` → status strengthens. **Say:** "AI assesses digitally. You validate on the floor. Validation strengthens evidence — it can never erase a safety flag."

## Step 6 — The proof object (1 min)

Window A → **/skills-passport**: methodology tier, verified competencies with evidence rationale, **Maintenance Communication** (fault explanation, operator communication, work order, handoff — with the manager's attestation, name and note), and the employer-verifiable share link.

> **Close:** "That's the loop. He made decisions, a mentor challenged his reasoning, he explained the fault, the system recorded evidence, you saw readiness change, and this passport proves it to anyone. We measure whether people can fix machines *and* explain them — that's what reduces your downtime."

---

## Recovery & reliability notes
- **AI is not required for the demo to work.** Every mentor/operator call has a deterministic fallback; reasoning/communication grading is deterministic (the LLM can only escalate severity). If the model is slow, the chips and evidence still behave correctly.
- If anything looks stale, hard-refresh window B (queries cache briefly).
- **Always re-run `node scripts/seed-demo.mjs` between demos** — it resets Marcus to the baseline.
- Rate limit is 30 mentor calls/min/user — a normal demo uses ~8.

## QA status (2026-07-05)
| Check | Status |
|---|---|
| Migrations 0036/0037/0038 on live DB | ✅ applied + verified (`verify-demo-readiness.mjs`) |
| Evidence persists (insert→read→delete, live) | ✅ |
| Rate-limit events persist (live) | ✅ |
| Seed → readiness pipeline (live data through real spine code) | ✅ (`demo-status.mts` output above) |
| Lesson→mentor→closeout→role-play→dashboard in the browser | ⚠ **must be clicked through once on the deployed instance before the first external demo** — server logic is live-verified; the UI path is verified by build + tests, not yet by a human on prod |
