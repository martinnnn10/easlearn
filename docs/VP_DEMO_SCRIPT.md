# VP Demo Script — EASLearn Live Walkthrough

> **Duration:** 12–15 minutes
> **Audience:** VP Maintenance, VP Operations, Plant Manager, Training Director
> **Domain:** easlearn.org (production)
> **Demo accounts:** Pre-seeded, all lessons unlocked, subscription active

---

## Opening Statement (30 seconds)

> "What you're about to see is not a slide deck about training. This is a live platform where your technicians make real troubleshooting decisions, an AI mentor evaluates their reasoning — not just their answers — and you see exactly who is ready, who needs coaching, and who is a safety risk. No multiple-choice guessing. No seat-time metrics. Competency evidence from actual fault diagnosis."

---

## Act 1: The Learner Experience (7 minutes)

### Step 1 — Login as Demo Learner

| Field | Value |
|-------|-------|
| URL | `easlearn.org/login` |
| Email | `demo.tech@easlearn.demo` |
| Password | `demo1234` |
| Name | Marcus Doyle (Maintenance Technician) |

After login, you land on the **Dashboard** — shows 193 lessons across 7 modules, quick actions, and competency progress.

### Step 2 — Open the Flagship Lesson

Navigate to: **Courses → Motors & Motor Controls → Motor Control Circuits & Schematics**

Direct URL: `easlearn.org/courses/motors-controls/motor-control-circuits`

**What to point out:**
- "Your Path" progression bar (Lesson → Practice → Troubleshoot → Assess)
- 17-card deck with sidebar navigation
- The lesson opens with a scenario: *"Stand next to me — this line's down"*

### Step 3 — Work Through the Lesson (2–3 cards)

**Card 1** (Scenario intro): Read aloud — *"A contactor is buzzing and won't pull in. Two have already been swapped. It's still buzzing."*

**Card 2** (Interaction — "So — what's your first move?"):

> **Correct answer:** "Meter the coil voltage at A1–A2 with Start pressed"
>
> **Talking point:** "Notice — this isn't 'select the right answer.' The wrong answers get real feedback explaining WHY they're wrong. A tech who picks 'swap it again' hears: 'That's exactly what the last guy did — twice. If two new parts behave the same way, the part isn't the problem.' That's coaching, not grading."

### Step 4 — Engage the AI Mentor

After answering the interaction card, click **"Ask the mentor"** (collapsible panel below the card).

Click **"Explain your reasoning"** and type:

> `I metered the coil because two new contactors did the same thing. If the part isn't the problem, the voltage feeding it must be. 95V on a 120V coil explains the buzz — not enough to pull in.`

**What to point out:**
- The mentor evaluates reasoning QUALITY (strong/partial/weak/unsafe)
- Shows a badge: "strong reasoning"
- Shows: "✓ recorded to your competency"
- Microcopy: "The mentor coaches your thinking — it won't just hand you the answer."

### Step 5 — Navigate to Summary Card (Card 17)

Use the sidebar to jump to the last card: **"From here, you don't need me over your shoulder"**

**What to point out:** The summary reinforces the four diagnostic questions, not facts.

### Step 6 — Close the Ticket (Reflection)

Below the summary card, the **"Close the ticket"** section appears with 4 blocks:

**Block 1 — "What happened — and what did you verify vs. assume?"**

Type:

> `The conveyor stopped because the overload opened. I metered the control string and found 95V at the coil — a control-power problem, not a bad contactor. I verified voltage at A1-A2 rather than assuming the part was bad like the previous tech did. I'm still assuming the transformer tap is the root cause — I need to verify that next.`

**What to point out after submission:**
- Mentor evaluates communication quality
- Shows "strong communication" badge
- Shows "✓ recorded to your competency"
- Microcopy: "Each response generates competency evidence. Your manager sees readiness update on the Manager Dashboard."

**Block 2 — "Explain it to the operator"**

Type:

> `The overload tripped because the contactor couldn't pull in — it was getting low voltage from the control transformer, not because it was broken. You can't just reset the overload yourself because if it trips again, there's a reason — resetting without finding the cause risks burning the motor or hiding a real fault. Always call maintenance.`

**Block 3 — "Write the work order note"**

Type:

> `Symptom: Conveyor stopped, overload tripped. Tests: Metered coil voltage A1-A2, read 95V on 120V rated coil. Evidence: Low control voltage causing contactor chatter. Cause: Control transformer tap set incorrectly after previous repair. Action: Corrected transformer tap, verified 120V at coil, reset overload, confirmed motor runs. Follow-up: Check other starters on same transformer for similar issue.`

**Block 4 — "Hand off to the next shift"**

Type:

> `Machine running, conveyor back in production. Verified control voltage now 120V at coil. Root cause was wrong transformer tap. Watch for: repeat overload trips on this or adjacent starters — if it happens, re-verify control voltage before swapping parts.`

### Step 7 — Operator Role-Play

Below the reflection, the **"Talk to the operator"** section appears.

The operator (persona: "rushed") says: *"Is it fixed? I've got a quota — can I just reset it myself if it trips again?"*

**Your response (type):**

> `It's fixed and running. The overload tripped because of a voltage problem we corrected — not because the motor is bad. If it trips again, don't reset it yourself. An overload trips for a reason — resetting it repeatedly without finding the cause can burn the motor or hide a safety issue. Call maintenance and we'll find the actual cause.`

**What to point out:**
- The operator has a PERSONA (rushed, unsafe, skeptical) — not generic
- The mentor evaluates whether the tech held the line on safety
- Unsafe advice ("yeah just reset it") would trigger a safety intervention
- Shows: "✓ recorded to your competency" with quality badge
- Microcopy: "Unsafe advice triggers a safety intervention visible to your manager."

---

## Act 2: The Manager Experience (4 minutes)

### Step 8 — Login as Manager

| Field | Value |
|-------|-------|
| URL | `easlearn.org/login` |
| Email | `demo.manager@easlearn.demo` |
| Password | `demo1234` |
| Name | Dana Reyes (Maintenance Manager) |

### Step 9 — Manager Dashboard

Navigate to: `easlearn.org/manager`

**What to point out:**
- **Readiness quadrant chart** — plots team members by confidence level
- Marcus Doyle appears with 53% overall confidence ("Developing Technician")
- Domain breakdown: Electrical Troubleshooting, Safety Systems, Motor Controls, PLC/Automation, Operator Communication
- Each domain shows evidence count and confidence percentage

**Talking points:**
> "This isn't seat-time. This is competency evidence from actual troubleshooting decisions. You can see WHO is ready, which DOMAINS they're strong in, and where the gaps are — before they're alone on a call at 2 AM."

### Step 10 — Communication Readiness

**What to point out:**
- Operator Communication domain shows evidence from the role-play
- Safety interventions would appear in red if the tech gave unsafe advice
- Manager can see the QUALITY of communication, not just "completed a module"

### Step 11 — Validate Competency (if available)

If the attestation button is visible:
> "As a manager, you can validate or challenge evidence. If Marcus's reflection was weak, you'd see it here and could require re-demonstration."

### Step 12 — Skills Passport

Navigate to: `easlearn.org/skills-passport` (as Marcus, or show the preview)

**What to point out:**
- Shows verified competency domains with confidence levels
- Evidence trail — not just "passed a test"
- Methodology tier: "Developing Technician" → "Competent Technician" → "Senior Technician"
- Manager validations appear as attestations

---

## Closing Pitch (60 seconds)

> "Three things make this different from every other training platform:
>
> 1. **The learner makes decisions** — not passive video watching. They troubleshoot, they reason, they explain.
>
> 2. **The AI evaluates reasoning quality** — not just right/wrong answers. A tech who gets the right answer for the wrong reason gets coached, not passed.
>
> 3. **You see competency evidence, not completion certificates.** You know who can actually diagnose a fault, communicate safely to production, and close a ticket properly.
>
> This is how you reduce repeat failures, identify safety risks before incidents, and prove your team's capability to operations and insurance."

---

## Emergency Fallbacks

| Issue | Recovery |
|-------|----------|
| Lesson shows loading | Refresh the page — auth resolves in 1–2 seconds |
| Mentor doesn't respond | Say "The AI mentor evaluates asynchronously — let me show you what the response looks like" and point to an existing mentor response |
| Manager Dashboard empty | Navigate to `/manager` directly — the dashboard loads team data on mount |
| Page won't scroll | This is fixed — but if it happens, use the sidebar card navigation |

---

## Key Numbers to Cite

- 193 lessons across 7 industrial domains
- 17-card scenario-based lesson format
- 4-section closeout (reflection, operator communication, work order, shift handoff)
- AI mentor evaluates 5 quality levels (strong, partial, weak, unsafe, unclear)
- Competency evidence feeds directly to manager dashboard
- No seat-time metrics — only demonstrated reasoning
