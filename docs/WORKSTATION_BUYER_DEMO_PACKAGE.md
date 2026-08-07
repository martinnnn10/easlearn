# EASLearn Unified Technician Workstation — Complete Buyer-Demo Package

**Document version:** 2.0  
**Date:** 2026-07-23  
**Target audience:** Maintenance Manager, Plant Manager, VP of Maintenance  
**Demo URL:** https://easlearn.org/prototype/workstation  
**Presenter:** Martin Aguilar Jr.

---

## Table of Contents

1. [10-Minute Presenter Script (Word-for-Word)](#10-minute-presenter-script)
2. [3-Minute Executive Version](#3-minute-executive-version)
3. [15-Minute Technical Version](#15-minute-technical-version)
4. [Presenter Cheat Sheet](#presenter-cheat-sheet)
5. [Objection Responses](#objection-responses)
6. [Paid-Pilot Close](#paid-pilot-close)
7. [Failure-Proof Backup Flow](#failure-proof-backup-flow)
8. [Demo-Environment Checklist](#demo-environment-checklist)
9. [Follow-Up Email Template](#follow-up-email-template)

---

## 10-Minute Presenter Script

### Timing Overview

| Time | Section | What You Show | What the Buyer Understands |
|------|---------|---------------|---------------------------|
| 0:00–0:45 | The business problem | Nothing — just talk | Course completion does not prove troubleshooting readiness |
| 0:45–1:30 | Machine-down scenario | Workstation loads, header badge visible | This looks like a real maintenance call |
| 1:30–4:30 | Workstation diagnosis | Machine view → cross-highlight → meter → interpretation | Machine, print, meter, PLC state, and reasoning stay connected |
| 4:30–5:30 | PLC bit vs. field voltage | PLC I/O panel, "NOT VERIFIED" badge | Software "ON" does not prove voltage exists |
| 5:30–6:30 | Diagnosis and corrective action | Confirm hypothesis → apply repair → belt runs | The learner must prove the fault rather than guess |
| 6:30–7:30 | Diagnostic Reasoning Replay | Open Replay tab in bottom drawer | You can see exactly how the technician thought |
| 7:30–8:45 | Manager evidence/readiness | Navigate to /manager (logged-out preview) | The attempt becomes something a manager can act on |
| 8:45–9:30 | Paid-pilot scope | Verbal — no screen change needed | Low-risk way to test it with one team |
| 9:30–10:00 | Close | Nothing — eye contact | Book the pilot planning call |

---

### 0:00–0:45 — The Business Problem

**[Do not open the workstation yet. Look at the buyer.]**

> "Let me start with the question every maintenance leader eventually faces.
>
> A line goes down at 2:00 in the morning. You have several technicians on shift — but do you actually know who can diagnose the fault systematically, who is going to guess, and who may create a safety risk?
>
> Traditional training tells you who completed a course. EASLearn shows you **how** the technician troubleshoots: what they checked, what they measured, what they assumed, whether they worked safely, and whether they proved the cause.
>
> I'm going to show you that in one live maintenance call. This takes about eight minutes."

**[Now open the browser. Navigate to https://easlearn.org/prototype/workstation]**

---

### 0:45–1:30 — Machine-Down Scenario

**[The workstation loads. Scenario: "Output ON / Motor Dead" should already be selected.]**

**CLICK PATH:**
1. Page loads → header shows scenario badge: **"OUTPUT ON / MOTOR DEAD"**
2. Point to the left panel (Machine View) — animated conveyor, components visible
3. Point to the center panel (Print/Schematic) — ladder logic rungs

**SAY:**

> "Here's the scenario. A conveyor has stopped. The operator reported it. The PLC says the output is ON — the software thinks the motor should be running. But the belt isn't moving.
>
> On the left, you see the physical machine — the conveyor, motor, contactor, overload. In the center, the ladder logic. On the right, the diagnostic bench where the technician takes measurements and manages their hypotheses.
>
> Your technician needs to figure out why the PLC says 'run' but the motor says 'no.' This is a real diagnostic challenge that happens on every plant floor."

---

### 1:30–4:30 — Workstation Diagnosis (Core Demo)

**CLICK PATH:**
1. **Click the contactor (K1)** on the machine view → ladder logic highlights rung 6
2. Point out the cross-highlighting: "Physical device and program logic are linked"
3. **Click the Meter tab** on the right panel (or it may already be visible)
4. **Select probe point: "K1 A1–A2 (Coil Voltage)"**
5. **Select mode: VDC**
6. **Click "Take Reading"**
7. Result appears: **~24 VDC (coil energized)**
8. **Type interpretation:** "Control power reaches coil — coil is energized"
9. Point to the Test History showing the recorded measurement
10. **Select probe point: "K1 Aux 13–14 (Auxiliary Contact)"**
11. **Select mode: Continuity**
12. **Click "Take Reading"**
13. Result appears: **OPEN**
14. **Type interpretation:** "Contactor did not pull in mechanically despite coil being energized"

**SAY (while clicking):**

> "Watch what happens when the technician selects a component."

**[Click K1]**

> "The ladder logic highlights the relevant rung. They can see the relationship between the physical device and the program logic. Now they need to decide: where do I put my meter first?
>
> A systematic technician starts at the PLC output and works downstream. A guessing technician jumps randomly. The system records which path they take."

**[Take the K1 A1–A2 reading]**

> "They place their meter leads on the contactor coil terminals. Twenty-four volts — the coil is energized. Control power is reaching the contactor. So why isn't the motor running?
>
> They record their interpretation. This is evidence of reasoning, not just a button click."

**[Take the K1 Aux 13–14 reading]**

> "Now they check the auxiliary contacts. Open. The contactor coil is energized, but the mechanical linkage has failed — the contacts did not close. They've isolated the fault in two measurements."

**[Point to Test History]**

> "Every measurement is recorded with a timestamp and interpretation. You can see exactly what they tested, in what order, and what they concluded. This is the difference between EASLearn and a video course. A video shows them the answer. EASLearn shows you whether they can find it themselves."

---

### 4:30–5:30 — PLC Bit vs. Field Voltage

**CLICK PATH:**
1. **Point to the PLC I/O Status sub-panel** on the right side (below or within the diagnostic bench)
2. Point to the "Software State" column — shows "Logic Command: ON," "Output Instruction: ON"
3. Point to the "Measured Value" column — shows "NOT VERIFIED" or actual voltage after measurement
4. **If not yet measured:** Select probe point "PLC Output Terminal (O:2/0)" → Mode: VDC → Take Reading
5. Result: voltage reading appears, "NOT VERIFIED" badge changes to actual value

**SAY:**

> "This is the most important teaching moment in industrial maintenance.
>
> See these two columns? The left side shows what the PLC software says — the output bit is ON. The right side shows what's actually measured at the terminal.
>
> These are NOT the same thing.
>
> A junior technician assumes that if the PLC says ON, there must be voltage at the terminal. An experienced technician knows you have to prove it with a meter. The badge says 'NOT VERIFIED' until the learner physically measures it.
>
> EASLearn teaches this distinction through practice, not lecture. This single concept is worth the entire platform to a maintenance manager — because this assumption is what causes extended downtime."

---

### 5:30–6:30 — Diagnosis and Corrective Action

**CLICK PATH:**
1. **In the Hypothesis panel:** Find "Contactor mechanical failure" → click to cycle status to **"Confirmed"**
2. **Click the corrective action button** on the Machine View (wrench icon or "Replace Contactor" button)
3. Belt starts running — visual confirmation of repair
4. Header badge changes to show fault cleared

**SAY:**

> "The technician confirms the root cause: the contactor coil energizes but the mechanical linkage has failed — the power contacts don't close. They apply the corrective action."

**[Click corrective action]**

> "Belt runs. Fault cleared. But here's what matters: we didn't just record that they fixed it. We recorded HOW they found it. Two measurements, logical sequence, evidence-based confirmation before repair. That's systematic. Compare that to a technician who takes eight random measurements, never updates their hypothesis, and eventually guesses the right answer. Both 'pass' — but only one is ready for independent work."

---

### 6:30–7:30 — Diagnostic Reasoning Replay

**CLICK PATH:**
1. **Click the bottom drawer expand arrow** (ChevronUp) to open the drawer
2. **Click the "Replay" tab** in the drawer tab bar
3. Point to the chronological timeline showing each action with elapsed time

**SAY:**

> "After completion, you get the full reasoning replay. Every measurement, every hypothesis change, every decision — in order, with timestamps.
>
> [Point to timeline entries]
>
> At twelve seconds they selected the contactor. At thirty-five seconds they took their first reading. At forty-two seconds they recorded their interpretation. At sixty-eight seconds they confirmed the root cause.
>
> You can see whether they followed a logical isolation sequence or whether they were guessing. This is what traditional training can never show you. A quiz tells you they know the answer. This tells you they can find it."

---

### 7:30–8:45 — Manager Evidence and Readiness

**CLICK PATH:**
1. **Open a new tab** → Navigate to https://easlearn.org/manager
2. The logged-out preview shows sample team data with decision cards and readiness matrix
3. Point to: Promotion-ready, Needs validation, Needs training, Safety risk cards
4. Point to the Team Readiness Matrix with per-domain confidence scores

**SAY:**

> "Now here's what you see as the manager. This is the Manager Dashboard — it shows your team's demonstrated competency from one evidence model.
>
> [Point to decision cards]
>
> Four categories: Who is promotion-ready. Who needs your validation. Who needs more training. Who has a safety risk. These aren't based on course completions — they're based on what the technician actually did when faced with a real fault.
>
> [Point to matrix]
>
> The team readiness matrix shows every technician across every competency domain. You can see at a glance who is strong, who is developing, and who has a safety flag that needs your attention.
>
> The system recommends readiness. You confirm it. No algorithm decides who is ready for independent work — you do, based on evidence you can actually see."

**[Pause. Let them absorb.]**

> "This is what a $400-per-minute line-down decision should be based on. Not a completion certificate from six months ago."

---

### 8:45–9:30 — Paid-Pilot Scope

**[No screen change needed. Look at the buyer.]**

> "Here's how you can test this with your team without any risk.
>
> We run a six-week pilot at one facility. One manager account — that's you. Ten to twenty-five technician accounts. Two motor-control fault scenarios.
>
> Week one: each technician runs both scenarios cold. That's your baseline — you see their current methodology tier.
>
> Weeks two through four: they practice. You can watch their attempts improve.
>
> Week five: they run both scenarios again. You see the improvement.
>
> Week six: I deliver a readiness report showing who improved, who is ready for validation, and where your team's gaps are.
>
> The pilot is twenty-five hundred dollars. That covers onboarding, weekly check-ins, and the final readiness report. If it doesn't show you something useful about your team that you didn't already know, I'll refund it."

---

### 9:30–10:00 — Close

**[Eye contact. No screen.]**

> "That's the product. I'd like to schedule a thirty-minute pilot planning call where we set up your accounts, choose your first cohort, and pick a start date. Does next [Tuesday/Thursday] work?"

**If they hesitate:**

> "No commitment beyond the planning call. We'll walk through the scenarios together so you can see exactly what your technicians will experience. If it's not a fit, you'll know in thirty minutes."

---

## 3-Minute Executive Version

Use this when you have 3 minutes in an elevator, a hallway, or a short meeting slot. No laptop required — verbal only. If you do have a screen, open the workstation and show only the PLC I/O panel distinction (Step 4 from the full script).

### Script

> "I built a troubleshooting simulator for maintenance technicians. It's not a video course — it's a realistic diagnostic workstation where the technician places meter leads, takes readings, records interpretations, and proves the fault before repairing it.
>
> The difference from everything else on the market: you can see exactly how they troubleshoot. Not just that they finished. You see what they measured, what they assumed, and whether they proved the cause or guessed.
>
> The system scores their methodology — systematic, guided, exploratory, or random — and surfaces safety violations. As the manager, you get a readiness dashboard that answers one question: who is ready for independent troubleshooting?
>
> We're running six-week pilots at one facility, ten to twenty-five technicians, twenty-five hundred dollars. I deliver a readiness report at the end showing you something about your team you didn't already know.
>
> Can I show you the live simulator? It takes eight minutes."

---

## 15-Minute Technical Version

Use this for controls engineers, reliability managers, or maintenance leaders who want to see the technical depth. This version adds the following segments to the standard 10-minute script:

### Additional Segment A — Ladder Logic Deep Dive (Insert after Step 2, adds 2 minutes)

**CLICK PATH:**
1. Click individual rungs in the Print panel — show rung state (energized/de-energized)
2. Point to the seal-in circuit (Rung 4) — explain how it holds the RUN bit
3. Show how the fault breaks the logic chain: OL NC contact → seal-in drops → output drops
4. But in Scenario B, the logic chain is COMPLETE — the fault is downstream of the PLC

**SAY:**

> "For your controls people — let me show you the logic depth. This isn't a cartoon. Each rung evaluates based on the actual PLC state. The seal-in circuit, the interlocks, the output instruction — all live.
>
> In Scenario B, the logic chain is complete. Every rung evaluates TRUE. The output instruction is energized. The PLC has done its job. The fault is downstream — in the physical world between the output terminal and the motor. That's what makes this scenario powerful: it forces the technician to leave the software and go measure reality."

### Additional Segment B — Safety Enforcement (Insert after Step 5, adds 1.5 minutes)

**CLICK PATH:**
1. Attempt to take a continuity reading on an energized circuit (if the system blocks it, show the warning)
2. Point to the safety violation counter in the header

**SAY:**

> "Safety is enforced, not assumed. If a technician attempts to measure continuity on an energized circuit, the system flags it as a safety violation. That violation is recorded, visible to the manager, and it overrides positive evidence.
>
> A technician who diagnoses correctly but works unsafely does not get a 'ready' recommendation. Two or more safety violations in one attempt nullify all positive evidence from that attempt. This is how you catch the technician who gets the right answer the wrong way."

### Additional Segment C — Methodology Tier Computation (Insert after Step 6, adds 1.5 minutes)

**SAY:**

> "Let me explain how methodology is scored. Four dimensions: sequence logic, hypothesis discipline, measurement efficiency, and safety. Each scored zero to three.
>
> Sequence logic: did they follow a logical isolation path? Half-split, upstream-to-downstream, or random?
>
> Hypothesis discipline: did they update hypotheses after each reading, or ignore the evidence?
>
> Measurement efficiency: how many readings to confirm? Two is optimal for this scenario. Eight means guessing.
>
> Safety: zero violations is full marks.
>
> Total determines the tier. Ten to twelve is systematic. Seven to nine is guided. Four to six is exploratory. Below four is random. The tier modifies the weight of all evidence from that attempt. A correct diagnosis from a random methodology produces almost no evidence value — because a lucky guess doesn't prove competency."

---

## Presenter Cheat Sheet

### Timing Marks

| Mark | Time | Cue |
|------|------|-----|
| START | 0:00 | "Let me start with the question…" |
| OPEN BROWSER | 0:45 | Navigate to workstation |
| FIRST CLICK | 1:30 | Click K1 on machine view |
| FIRST READING | 2:30 | Take K1 A1–A2 VDC reading |
| SECOND READING | 3:30 | Take K1 Aux 13–14 continuity |
| PLC PANEL | 4:30 | Point to PLC I/O Status |
| CONFIRM + REPAIR | 5:30 | Confirm hypothesis, apply corrective action |
| REPLAY | 6:30 | Open bottom drawer → Replay tab |
| MANAGER | 7:30 | New tab → /manager |
| PILOT PITCH | 8:45 | Look at buyer, no screen |
| CLOSE | 9:30 | Ask for planning call |

### Key Phrases (Use These Exact Words)

- "Shows how they troubleshoot, not just that they finished"
- "Manager-visible competency evidence"
- "PLC software state is not the same as field voltage"
- "Methodology, not just result"
- "Earned through performance, not completion"
- "Stop guessing who is ready"
- "A lucky guess does not prove competency"
- "Two measurements, logical sequence, evidence-based confirmation"
- "The system recommends readiness — you confirm it"

### Phrases to NEVER Use

- "AI-powered" (unless they ask about technology)
- "Gamification" or "badges" or "leaderboard"
- "100% pass rate" or any completion metrics
- "Guaranteed downtime reduction" (until customer data supports it)
- "Replace your current training" (position as complement)
- "Our algorithm decides who is ready" (the manager decides)
- "Perfect" or "fully automated" or "no human oversight needed"

### Body Language Cues

- **At 0:00–0:45:** Stand. Make eye contact. Do not touch the laptop.
- **At 0:45:** Sit or move to the laptop naturally. "Let me show you."
- **At 4:30 (PLC panel):** Slow down. This is the money moment. Let silence land.
- **At 6:30 (Replay):** Point physically at the screen. "See this timeline."
- **At 8:45 (Pilot):** Stand again or lean back. Signal transition from demo to business.
- **At 9:30 (Close):** Direct eye contact. Specific date. Silence after the ask.

---

## Objection Responses

### "We already use Vector / Interplay / ToolingU / another vendor."

> "Good — those are solid content libraries. EASLearn isn't replacing your content. It's answering a question those platforms can't: did the technician actually troubleshoot systematically, or did they just watch the video and pass the quiz?
>
> Vector tells you who completed the course. EASLearn tells you who can find the fault. They're complementary — you keep your content library and add diagnostic verification on top."

### "Your catalog is smaller."

> "You're right — we have fewer scenarios than a content library. That's intentional. Each scenario is a full diagnostic simulation with meter readings, hypothesis management, and methodology scoring. One EASLearn scenario produces more evidence about a technician's capability than fifty completed videos.
>
> We're launching with Motor Control Troubleshooting — two fault scenarios that cover the most critical diagnostic distinction in industrial maintenance. VFD troubleshooting is next. Quality over quantity — each scenario must teach a meaningful diagnostic skill."

### "How does this improve downtime?"

> "I won't promise a specific downtime number until we have your data. What I can promise: after the pilot, you'll know which technicians can isolate a fault systematically and which ones are guessing. The ones who guess create extended downtime, repeat failures, and safety incidents.
>
> The pilot gives you a baseline. If your team's methodology improves from 'exploratory' to 'systematic' over six weeks, that translates directly to faster fault isolation. But I want to show you the data, not make a claim I can't back up yet."

### "How is this different from normal simulation?"

> "Most simulations are scenario-based quizzes: click the right answer, get a checkmark. EASLearn is an open diagnostic environment. There is no 'right answer' button. The technician must decide where to measure, interpret the reading, form a hypothesis, and prove the fault before repairing it.
>
> The system doesn't tell them what to do. It records what they choose to do. That's the difference — it captures methodology, not just the final answer."

### "How do you know the technician didn't guess?"

> "The reasoning replay shows the full diagnostic path. Even if they know the answer, the methodology tier reveals whether they followed a systematic process or jumped to the conclusion.
>
> A technician who guesses correctly takes one measurement, immediately confirms a hypothesis, and applies the repair. A systematic technician takes targeted measurements, eliminates alternatives, and confirms based on evidence. The timeline makes this obvious — you can see it in thirty seconds.
>
> And the methodology tier modifies evidence weight. A correct diagnosis from a 'random' methodology produces almost no evidence value. You can't game your way to readiness."

### "This seems expensive for what it is."

> "Twenty-five hundred dollars for six weeks, ten to twenty-five technicians, and a readiness report. That's less than one hour of unplanned downtime on most lines. If the pilot shows you even one technician who isn't ready — someone you would have sent to a line-down call — it's paid for itself.
>
> And if it doesn't show you anything useful, I'll refund it. I'm that confident in what the data reveals."

### "We don't have time for another training platform."

> "This isn't another platform to manage. Each scenario takes three to five minutes. A technician can do one during a break or at shift start. There's no curriculum to schedule, no classroom to book, no instructor to coordinate.
>
> Your role is to review the readiness dashboard once a week — five minutes. The system tells you who needs attention and who is ready for validation. That's it."

---

## Paid-Pilot Close

### The Offer (Verbal)

> "Six-week pilot. One facility. One manager account. Ten to twenty-five technician accounts. Two motor-control fault scenarios. Twenty-five hundred dollars.
>
> You get: a baseline methodology assessment for every technician, six weeks of tracked practice, a follow-up assessment showing improvement, and a final readiness report I deliver personally.
>
> If it doesn't show you something useful about your team that you didn't already know, I refund it."

### Pilot Deliverables (What They Receive)

| Deliverable | When | Format |
|-------------|------|--------|
| Account setup + onboarding | Week 0 | 30-min call + email with login links |
| Baseline methodology report | End of Week 1 | PDF: per-technician tier + safety status |
| Weekly progress summary | Weeks 2–4 | Email: attempts completed, methodology trends |
| Follow-up methodology report | End of Week 5 | PDF: improvement from baseline |
| Final readiness report | Week 6 | PDF + 30-min review call: who is ready, who needs more, where gaps are |

### Pricing

| Item | Price |
|------|-------|
| Pilot (6 weeks, 1 facility, 10–25 technicians) | $2,500 |
| Additional technicians beyond 25 | $50/technician |
| Extended pilot (additional 4 weeks) | $1,000 |
| Post-pilot annual subscription (if they convert) | Negotiated based on team size |

### Next Action

> "Can I schedule a thirty-minute pilot planning call for [specific day]? We'll set up your accounts, choose your first cohort, and pick a start date."

If they say yes: send calendar invite within 24 hours.

If they say "let me think about it": send the follow-up email (Section 9) within 4 hours.

If they say "not now": ask "What would need to be true for this to be worth testing?" — listen, note the objection, follow up in 2 weeks.

---

## Failure-Proof Backup Flow

### Scenario 1: Live Site Is Down

**Detection:** Page does not load or shows error.

**Recovery:**
1. Say: "Let me pull up the backup." (Do not apologize excessively.)
2. Open pre-recorded screen recording (MP4) on your laptop — 3 minutes showing the full diagnosis flow.
3. Narrate over the recording using the same script.
4. After the recording: "That's the live product. I'll send you a link to try it yourself after this meeting."

**Preparation:** Record a 3-minute screen capture of yourself completing Scenario B (output_on_motor_dead) with narration. Save to your laptop desktop. Test playback before every demo.

### Scenario 2: Login Required and Fails

**Detection:** Redirected to login page or OAuth error.

**Recovery:**
1. The prototype at `/prototype/workstation` does NOT require login. If you're seeing a login wall, you navigated to the wrong URL.
2. Correct URL: `https://easlearn.org/prototype/workstation`
3. If even the prototype requires login (unexpected): use the backup recording.

**Prevention:** Always use the prototype URL, never the production lab URL (which does not exist yet).

### Scenario 3: Simulator Misbehaves (Wrong Reading, Broken UI)

**Detection:** Meter returns unexpected value, UI element is missing, or layout is broken.

**Recovery:**
1. Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R).
2. If still broken: "Let me restart the scenario." Click the scenario dropdown and re-select "Output ON / Motor Dead."
3. If still broken: switch to the backup recording.

**Prevention:** Run through the full demo click path 30 minutes before the meeting. If anything is broken, use the recording from the start.

### Scenario 4: Buyer's Screen Share / Projector Issues

**Detection:** They can't see your screen, resolution is wrong, or colors are washed out.

**Recovery:**
1. Zoom in browser to 125% for projector visibility.
2. If screen share fails: "I'll walk you through it verbally and send you the link to try yourself." Use the 3-minute executive version.
3. Offer to send the demo link immediately so they can follow along on their own device.

### Backup Materials Checklist

| Item | Location | Format |
|------|----------|--------|
| Screen recording of full demo | Laptop desktop | MP4, 3 min |
| Screenshot: PLC I/O panel distinction | Laptop desktop | PNG |
| Screenshot: Reasoning replay timeline | Laptop desktop | PNG |
| Screenshot: Manager dashboard preview | Laptop desktop | PNG |
| One-page value prop (printable) | Laptop desktop | PDF |
| Demo URL written on paper | Notebook | Handwritten backup |

---

## Demo-Environment Checklist

Run this checklist **30 minutes before every demo.** Every item must pass.

### Before the Demo

| # | Check | Pass? |
|---|-------|-------|
| 1 | Navigate to https://easlearn.org/prototype/workstation — page loads in < 3 seconds | |
| 2 | Scenario dropdown shows "Output ON / Motor Dead" — select it | |
| 3 | Header badge displays "OUTPUT ON / MOTOR DEAD" clearly | |
| 4 | Machine View shows conveyor with visible components (motor, contactor, overload) | |
| 5 | Print panel shows ladder logic rungs (at least 6 rungs visible) | |
| 6 | Click K1 on machine view → ladder logic highlights rung 6 | |
| 7 | Meter tab is accessible — probe dropdown shows options | |
| 8 | Take a test reading (K1 A1–A2, VDC) — returns ~24 VDC | |
| 9 | PLC I/O panel is visible — shows "NOT VERIFIED" for unmeasured values | |
| 10 | Bottom drawer opens when clicking expand arrow | |
| 11 | Replay tab is present in the drawer tab bar | |
| 12 | No browser popups, cookie banners, or notification prompts visible | |
| 13 | No "PROTOTYPE" badge or debug controls that would confuse the buyer | |
| 14 | Browser zoom is set to 100% (or 125% for projector) | |
| 15 | No other tabs open that could distract or reveal internal tools | |
| 16 | Navigate to https://easlearn.org/manager — preview loads with sample data | |
| 17 | No error messages or broken images on any visible page | |
| 18 | Internet connection is stable (test with speed check) | |
| 19 | Backup recording is accessible on laptop desktop | |
| 20 | Browser bookmarks bar is hidden | |

### Items That Should NOT Be Visible

| Item | Why | How to Hide |
|------|-----|-------------|
| Scenario selector dropdown | Buyer should not see "choose your scenario" — it looks like a test, not a real call | Accept it — the prototype shows it. Say "In production, the scenario is assigned by the lab" if asked |
| Feedback form tab | Internal testing artifact | It's in the bottom drawer — don't open that tab |
| Any URL with "prototype" in it | Sounds unfinished | Address directly: "This is our validation build — the production version records to your team's dashboard" |
| Other prototype routes (/prototype/hydraulic, etc.) | Unrelated, potentially confusing | Don't navigate there |
| Internal admin pages | Confidential | Don't navigate there |

### What to Say If the Buyer Notices "Prototype"

> "Good eye. This is our validation build — we test with real technicians before integrating into production. The production version connects to your team's identity and records every attempt to the manager dashboard. The diagnostic experience is identical."

---

## Follow-Up Email Template

**Subject:** EASLearn Workstation — Pilot Planning Next Steps

**Send within:** 4 hours of the demo meeting

---

Hi [First Name],

Thank you for taking the time today. I wanted to follow up with the key points and next steps.

**What you saw:**

The Unified Technician Workstation records exactly how a technician troubleshoots — what they measured, what they assumed, whether they proved the fault, and whether they worked safely. The system scores their methodology (systematic, guided, exploratory, or random) and surfaces the evidence to you as the manager.

**The distinction:**

Traditional training shows who completed a course. EASLearn shows how they troubleshoot. You get a readiness dashboard that answers: "Who is ready for independent troubleshooting?"

**The pilot:**

- 6 weeks, 1 facility, 10–25 technicians
- 2 motor-control fault scenarios
- Baseline → practice → follow-up → readiness report
- $2,500 (refundable if it doesn't show you something useful)

**Try it yourself:**

You can run through the diagnostic scenario right now — no login required:  
https://easlearn.org/prototype/workstation

Select "Output ON / Motor Dead" and try to isolate the fault. It takes about 5 minutes.

**Next step:**

I'd like to schedule a 30-minute pilot planning call to set up your accounts and choose your first cohort. Would [Day 1] or [Day 2] work?

Looking forward to it.

Best,  
Martin Aguilar Jr.  
EASLearn — Manufacturing Competency Intelligence  
815-999-6417  
andrewright1@msn.com

---

**If no response after 3 business days, send:**

**Subject:** Re: EASLearn Workstation — Pilot Planning Next Steps

Hi [First Name],

Just following up on the workstation demo. If you had a chance to try the simulator yourself, I'd love to hear what you thought.

The pilot planning call is 30 minutes — we'd walk through the scenarios together and decide if it's a fit for your team. No commitment beyond the call.

Would [Day 1] or [Day 2] work this week?

Best,  
Martin

---

**If no response after 7 business days, send final follow-up:**

**Subject:** Re: EASLearn Workstation — One Last Check

Hi [First Name],

I'll keep this short. If the timing isn't right, no problem at all. I'll check back in [60/90] days when you might be planning next quarter's training.

In the meantime, the simulator is always available if you want to show it to your team:  
https://easlearn.org/prototype/workstation

Best,  
Martin
