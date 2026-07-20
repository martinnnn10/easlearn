# EASLearn vs. Vector — Competitive Positioning Brief

*One page for the founder, the VP of Maintenance who has to sign, and the AE who has to sell. Companion docs: [`VECTOR_GAP_ANALYSIS.md`](./VECTOR_GAP_ANALYSIS.md), [`EASLEARN_BUILD_PRIORITY_MAP.md`](./EASLEARN_BUILD_PRIORITY_MAP.md).*

---

## 1. Executive summary

Vector sells two large course libraries — **474 industrial-maintenance courses (~456 hrs)** and **414 HSE courses (~316 hrs)**. Read the catalog and the model is unmistakable: every course description opens with *"designed to familiarize participants with…"* and the learning objectives are overwhelmingly **describe (1,126×), explain, identify, list** — the bottom two rungs of Bloom, delivered as video + quiz, priced by the seat-hour.

That is an **awareness and compliance** product. It proves a worker was *assigned* training. It does not prove the worker can find the fault at 2 a.m. with the line down.

EASLearn is a different category on purpose: a **competency engine** that makes a technician *demonstrate* judgment — commit to an action, defend the reasoning, fail productively on a live twin, close the work order, and emit a manager-visible competency signal. We already run the full apprenticeship loop on the skills that cause the most downtime: **VFD/drive faults, PLC I/O, motor controls, safety circuits, sensors.**

**The strategy is not to out-catalog Vector — it's to own the outcome.** Compete on verified maintenance readiness and downtime reduction; concede the compliance library; build *depth* in the broad-but-shallow, high-downtime domains where Vector can only describe (hydraulics, instrumentation, mechanical, pumps). Win the 20% of skills that cause 80% of the downtime.

## 2. What Vector is strong at

- **Breadth** — ~888 courses blanket every maintenance and safety topic a buyer can name. "One library covers everything" is a real procurement story.
- **Compliance** — OSHA, PSM, NFPA 70E, NEC, lab safety, hazwoper. Mandatory, renewable, budgeted spend, often bought by EHS, not maintenance.
- **The single biggest maintenance area is instrumentation (~108 courses)** and electrical (~176) — deep catalogs in the domains plants actually staff for.
- **LMS plumbing** — assignments, completion tracking, audit-ready reporting. Table stakes they've had for years.
- **Distribution** — established vendor, existing MSAs, incumbent switching cost.

## 3. What Vector is weak at

- **It measures the wrong thing.** Seat-hours and quiz scores, not demonstrated capability. A 100%-complete Vector transcript and a technician who guesses on the floor look identical in the report.
- **Recall, not judgment.** ~2,000 objectives lead with *describe/identify/list*; ~75 with *calculate/use/determine*. There is no productive failure, no diagnostic method, no consequence to a wrong move.
- **No hands-on troubleshooting.** No live equipment twin, no branch-on-choice root cause, no work-order closeout. "Troubleshooting" courses *describe* troubleshooting.
- **No communication or escalation skill.** ~30 "documentation/communication" courses *tell* you to communicate; none grade the handoff.
- **Nothing is manager-actionable at the individual-skill level** beyond "assigned/complete."

## 4. Where EASLearn is different

| | Vector | EASLearn |
|---|---|---|
| Unit of value | course + seat-hour | demonstrated competency |
| Cognitive tier | describe / identify | decide / diagnose / justify |
| Practice | video + quiz | live twin, productive failure |
| Wrong answer | marked incorrect | plays out, then coached |
| Communication | a topic to describe | a graded closeout + role-play |
| Manager sees | who completed | who is *ready*, with evidence |
| Business claim | training delivered | downtime reduced |

We already hold the full apprenticeship loop on the high-consequence core (VFD, PLC, motors, safety circuits, sensors) and we have the evidence layer Vector doesn't — **readiness, Skills Passport, competency signals** feeding manager capability views.

## 5. Best sales positioning

> **"Vector proves someone was assigned training. EASLearn proves someone can troubleshoot."**

> **"Use Vector for compliance breadth. Use EASLearn for the high-consequence skills that cause downtime."**

> **"Vector is a library. EASLearn is a competency engine. We don't replace every LMS course — we replace guessing on the floor."**

Sell to the **maintenance/reliability leader** whose number is downtime and MTTR, not the EHS manager whose number is completion rate. Lead with a live VFD or PLC fault the prospect's best tech would recognize; let them watch a learner *diagnose* it. Position as complementary at first ("keep your library, plug in the competency layer") to neutralize switching cost, then expand.

## 6. What NOT to compete on

- **Course count.** 888 vs 36 is a trap; the moment we argue catalog size we've adopted their scoreboard and lost.
- **The HSE compliance library (319 courses).** Different buyer, seat-time value, regulatory treadmill. Partner or integrate; never rebuild.
- **NEC / code-update recall.** Re-obsoletes every cycle. No judgment, no moat.
- **Robotics.** Zero pull (Vector has none either), OEM-specific. Wait for a funded cell.
- **"Awareness" versions of anything.** If the objective verb is *describe*, it's Vector's game.

## 7. Highest-leverage build areas

Depth where Vector is broad-but-shallow **and** downtime is high (full detail in the build map):

1. **Troubleshooting method as a named, transferable skill** — the thing Vector structurally cannot do. *(P0)*
2. **VFD energized-work / DC-bus decision gate** — harden the demo hero. *(P0)*
3. **Communication & work-order closeout as a scored, manager-visible skill.** *(P0/P1)*
4. **Hydraulic pressure-loss troubleshooting simulator** — gauge readings, root-cause branch, WO closeout. *(P1)*
5. **4–20 mA loop / calibration troubleshooting** — attack Vector's *largest* maintenance category with depth. *(P1)*
6. **Meter lab for the new electrical-fundamentals decks** — convert lesson+assessment into a full loop. *(P1)*
7. **Mechanical / pump / bearing failure diagnostics** — Vector's ~110-course white space, all recall. *(P1/P2)*

## 8. Recommended 90-day roadmap

**Guiding rule:** each sprint must ship something *demoable* that a maintenance leader recognizes as their real 2 a.m. problem.

**Days 0–30 — Sharpen the wedge (P0, sell what we have).**
- Package the existing VFD + PLC + safety-circuit loops into a **"Readiness Demo"** with a manager dashboard view.
- Build the **diagnostic-method spine lesson** + one cross-domain fault drill (names the transferable skill).
- Add the **VFD DC-bus/energized-work decision gate** to the drive lab.
- Ship **communication/closeout as a scored skill** surfaced in the Skills Passport.
- Plumbing: **manager report + CSV/PDF export + assignments** to survive a pilot.

**Days 31–60 — Open one white-space domain with depth (P1).**
- Build the **hydraulic pressure-loss simulator** (gauge readings, root-cause branching, WO closeout, operator role-play) — the flagship "Vector can't do this" proof.
- Deepen electrical fundamentals with the **meter lab** (Live-Dead-Live, voltage-drop hunt) to close its loop.
- Plumbing: **SSO (SAML) + role permissions + audit log** for the paid pilot.

**Days 61–90 — Attack Vector's biggest maintenance category (P1) + integration wedge.**
- Build the **4–20 mA loop / calibration troubleshooting sim** — depth into instrumentation, Vector's ~108-course strength.
- Ship **SCORM/xAPI export** so EASLearn results flow *into* the customer's existing LMS ("keep Vector, prove competency with us") — turns the incumbent into a channel, not a wall.
- Start **mechanical/pump failure diagnostics** as the next domain.

**Sequencing call (see final line of the build map):** the next build is **simulator depth in one high-downtime white-space domain (hydraulics)**, run in parallel with the **minimum enterprise plumbing (assign / report / export / SSO)** needed to charge for a pilot. Curriculum breadth stays deliberately frozen — depth and evidence are what win against a breadth incumbent.

---

## 9. Sales collateral

### Website copy

**Hero:**
> **Vector proves someone was assigned training. EASLearn proves they can troubleshoot.**
> The competency engine for maintenance teams — technicians diagnose real faults on a live equipment twin, and you see who's ready for the night shift alone.

**Section — how we're different:**
> An LMS logs seat-hours. EASLearn logs judgment. Your techs commit to a fix, defend the reasoning, and work a real fault to closeout — and your dashboard shows readiness per person, per skill, backed by evidence.

**Section — where to use us:**
> Keep your compliance library for the credit-hours. Bring in EASLearn for the high-consequence skills that cause downtime: drive faults, PLC I/O, motor controls, hydraulics, safety circuits. We don't replace every LMS course — we replace guessing on the floor.

**CTA:** *See a technician diagnose a live VFD fault →*

### LinkedIn post angle

> Your LMS says 100% of your maintenance team completed "VFD Troubleshooting."
> Then the drive faults at 2 a.m., the line's down, and they're swapping parts hoping one sticks.
>
> Completion isn't competence. "Assigned" isn't "able."
>
> We built EASLearn because a training transcript should answer one question a maintenance manager actually loses sleep over: *who can I put on this fault, alone, tonight?*
>
> Not who watched the video. Who can diagnose it.
>
> [demo of a learner working a live drive fault → closeout]

### Sales call talking points

1. **Open on their number, not ours:** "What does an hour of unplanned downtime on your worst line cost?" Everything ladders to that.
2. **Concede breadth immediately:** "If you need 800 compliance titles, keep your library — we're not that, and we're not trying to be."
3. **Reframe the metric:** "Your current tool measures completion. Can it tell you which specific tech can isolate a DC-bus fault? Ours can, with evidence."
4. **Show, don't tell:** run a live fault in the demo; let their senior tech watch a learner reason through it.
5. **De-risk with complementarity:** "Start beside your LMS on five high-downtime skills. Measure MTTR. Expand from proof."
6. **Close on readiness:** "In 60 days you'll have a readiness map of your crew you've never had before."

### Objection handling

**"We already have Vector."**
> Good — keep it for compliance breadth. Those are different jobs. Vector proves training was delivered; we prove a tech can diagnose a fault. Most of our customers run us *beside* their library on the 15–20 skills that actually cause downtime. We can even push our competency results back into your LMS via SCORM/xAPI, so your system of record stays intact.

**"Your catalog is smaller."**
> On purpose. 888 awareness courses is a different product than proven competency on the faults that stop your line. We went deep where it pays: your tech doesn't watch a drive-fault video, they *clear the fault* and close the work order. Course count is the wrong scoreboard — downtime and readiness are the right ones.

**"Do you cover compliance?"**
> We don't rebuild the OSHA/PSM/NEC library — that's seat-time, and your current tool does it fine; we integrate with it. Where we *do* play in safety is judgment: arc-flash approach decisions, LOTO verification under production pressure, stop-and-escalate. That's the safety training that actually changes behavior, and it's the part awareness videos miss.

**"How do we prove ROI?"**
> Pick your worst line. Baseline MTTR and repeat-fault rate. Put your team through the drive/PLC/hydraulic loops. In 60 days we show readiness per tech and you measure the downtime delta. The pilot is designed to make the ROI a number you can take to your CFO — not a completion percentage.
