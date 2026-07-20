# EASLearn Build Priority Map

*Ranked next builds against the Vector gap analysis. The rule for every entry: **depth where Vector is broad-but-shallow, on skills that cause downtime or hurt people.** No awareness courses. No catalog-matching. See [`VECTOR_GAP_ANALYSIS.md`](./VECTOR_GAP_ANALYSIS.md) and [`VECTOR_COMPETITIVE_POSITIONING.md`](./VECTOR_COMPETITIVE_POSITIONING.md).*

**Priority:** P0 demo/pilot hero · P1 paid-pilot build · P2 enterprise expansion · P3 later / avoid.
**Effort:** S = reuses an existing twin/scenario · M = new scenario on the current engine · L = new domain model/twin · XL = new engine capability.
**Format legend:** L lesson · SIM simulation · CO mentor closeout · RP operator role-play · MV manager validation · SP Skills Passport signal.

---

## P0 — Sharpen the wedge (sell what we already do best)

### 1. Diagnostic Method Spine
- **Category:** Troubleshooting methodology
- **Why it matters:** It names the transferable skill Vector structurally cannot teach — half-split, signal-trace, symptom→cause reasoning that applies to *any* domain.
- **Buyer pain:** "My techs swap parts until it works; they don't have a method."
- **Downtime/safety impact:** High — method is the multiplier on every future domain.
- **Vector overlap:** ~52 "describe troubleshooting" courses — pure narration.
- **EASLearn differentiation:** Learner *runs* the method under productive failure, across two unrelated faults, and is scored on process not just answer.
- **Format:** L + SIM + SP · **Effort:** M · **Priority:** P0

### 2. VFD DC-Bus / Energized-Work Decision Gate
- **Category:** VFD/drives + safety-critical judgment
- **Why it matters:** Hardens our strongest demo with the exact moment a tech gets hurt — deciding whether/how to work a charged bus.
- **Buyer pain:** "One wrong move on a 480 V drive is a fatality and an OSHA case."
- **Downtime/safety impact:** High downtime + safety-critical.
- **Vector overlap:** Drive courses describe the bus; arc-flash courses are separate compliance videos. No one connects them in a decision.
- **EASLearn differentiation:** Wrong energized-work choice *plays out*; a hard safety gate blocks progress until the judgment is right.
- **Format:** SIM + CO + safety gate + SP · **Effort:** S (extends PowerFlex lab) · **Priority:** P0

### 3. Communication & Work-Order Closeout as a Scored Skill
- **Category:** Work orders / communication
- **Why it matters:** The handoff is where downtime recurs; it's also the most manager-legible signal we have and Vector has none of it.
- **Buyer pain:** "The fix wasn't documented, so the next shift chased the same fault."
- **Downtime/safety impact:** Medium downtime, high organizational leverage.
- **Vector overlap:** ~30 "describe documentation/communication" courses.
- **EASLearn differentiation:** We *grade the handoff* — operator role-play + WO closeout classified by the mentor, surfaced in the Skills Passport.
- **Format:** CO + RP + MV + SP · **Effort:** M · **Priority:** P0

### 4. Readiness Demo + Manager Dashboard Packaging
- **Category:** Manager-visible readiness (product)
- **Why it matters:** Converts our existing loops into a *bought outcome*: a leader sees who is ready, with evidence, not who completed.
- **Buyer pain:** "My LMS tells me training was assigned. It can't tell me who I can put on the night shift alone."
- **Downtime/safety impact:** The whole ROI story rides on this being visible.
- **Vector overlap:** Completion dashboards only.
- **EASLearn differentiation:** Competency signals + readiness per technician per skill.
- **Format:** MV + SP · **Effort:** M · **Priority:** P0

### 5. PLC Comms-Loss Guided Simulator
- **Category:** PLC / networking
- **Why it matters:** Comms is the one PLC lesson still lesson-only; comms faults are a top real-world downtime driver.
- **Buyer pain:** "Half our 'PLC' calls are really a dropped node or a bad cable."
- **Downtime/safety impact:** High downtime.
- **Vector overlap:** ~9 networking courses, all recall.
- **EASLearn differentiation:** Diagnose link/IP/duplicate-address on the live twin, confirm before touching logic.
- **Format:** SIM + CO · **Effort:** S (extends conveyor lab) · **Priority:** P0

---

## P1 — Open white-space domains with depth (paid-pilot builds)

### 6. Hydraulic Pressure-Loss Troubleshooting Simulator ⭐ flagship white-space
- **Category:** Hydraulics
- **Why it matters:** Vector's 23 hydraulic courses only *describe* components; hydraulics is a top downtime source and we have **zero** today. This is the clearest "Vector can't do this" proof.
- **Buyer pain:** "Press is slow and weak — is it the pump, the relief valve, or a bypassing cylinder? We guess."
- **Downtime/safety impact:** High downtime; high-pressure safety.
- **Vector overlap:** Broad awareness, no simulation.
- **EASLearn differentiation:** Read real gauge values, branch on root cause (pump wear vs relief setting vs internal bypass), close the work order.
- **Format:** SIM + CO + RP + SP · **Effort:** L (new hydraulic model) · **Priority:** P1

### 7. 4–20 mA Loop & Calibration Troubleshooting Simulator
- **Category:** Instrumentation / calibration
- **Why it matters:** Instrumentation is Vector's **single largest** maintenance category (~108). Beating their strength with *depth* is a statement.
- **Buyer pain:** "Transmitter reads wrong — is it the sensor, the loop power, the wiring, or the calibration?"
- **Downtime/safety impact:** Medium-high; drives bad process control.
- **Vector overlap:** ~108 recall courses.
- **EASLearn differentiation:** Inject loop faults (open, ground, span/zero drift), reason from mA readings, calibrate, close out.
- **Format:** SIM + CO + SP · **Effort:** L · **Priority:** P1

### 8. Meter Lab — Electrical Fundamentals Loop-Closer
- **Category:** Electrical fundamentals
- **Why it matters:** The 6 new electrical decks are lesson+assessment only — our thinnest depth against Vector's broadest area. A meter lab converts them to a full loop.
- **Buyer pain:** "They passed the quiz but can't run Live-Dead-Live or hunt a voltage drop."
- **Downtime/safety impact:** Medium downtime, foundational safety (verification).
- **Vector overlap:** ~176 electrical courses, all recall.
- **EASLearn differentiation:** Virtual meter: pick mode, probe points, Live-Dead-Live, find the open by voltage drop.
- **Format:** SIM + CO + SP · **Effort:** M · **Priority:** P1

### 9. Pneumatic No-Motion / Air-Leak Diagnostic
- **Category:** Pneumatics
- **Why it matters:** ~28 Vector courses describe pneumatics; actuator-won't-move is an everyday line-down call; we have zero.
- **Buyer pain:** "Cylinder won't stroke — supply, valve, seal, or signal?"
- **Downtime/safety impact:** High downtime.
- **Vector overlap:** Broad awareness.
- **EASLearn differentiation:** Trace air path + control signal on the twin, isolate leak vs valve vs actuator.
- **Format:** SIM + CO · **Effort:** M (reuses fluid-model harness from #6) · **Priority:** P1

### 10. Pump No-Flow / Cavitation / Seal-Leak Diagnostic
- **Category:** Pumps
- **Why it matters:** ~34 Vector courses; pumps are a reliability workhorse and a top failure mode; we have zero.
- **Buyer pain:** "No flow or it's cavitating — suction, impeller, air-bind, or VFD speed?"
- **Downtime/safety impact:** High downtime.
- **Vector overlap:** Broad awareness.
- **EASLearn differentiation:** Read suction/discharge pressures + amps, branch to root cause, tie to the drive.
- **Format:** SIM + CO + SP · **Effort:** L · **Priority:** P1

### 11. Coupling/Belt Failure + Shaft-Alignment Decision
- **Category:** Mechanical systems
- **Why it matters:** Vector's ~65 mechanical courses are its second-broadest area; misalignment is a leading cause of premature failure; we have zero.
- **Buyer pain:** "It keeps eating couplings/bearings — align it or run it?"
- **Downtime/safety impact:** High downtime (repeat failures).
- **Vector overlap:** Broad awareness incl. alignment.
- **EASLearn differentiation:** Read alignment/vibration indicators, make the run-vs-fix call, justify it.
- **Format:** SIM + CO + SP · **Effort:** L · **Priority:** P1

### 12. LOTO Verification Judgment + Operator Role-Play
- **Category:** LOTO (safety-critical judgment — **not** compliance)
- **Why it matters:** Everyone has the OSHA video; almost no one trains the *verification judgment* and the operator pushback that gets people hurt.
- **Buyer pain:** "They know the LOTO policy and still skip the try-out step under production pressure."
- **Downtime/safety impact:** Safety-critical.
- **Vector overlap:** ~6 compliance seat-time courses — we do **not** rebuild these.
- **EASLearn differentiation:** Verify zero energy, resist the operator's "just do it live," stop-and-escalate.
- **Format:** SIM + RP + CO + SP · **Effort:** M · **Priority:** P1

### 13. Arc-Flash Decision Scenario
- **Category:** Arc flash / electrical safety (safety-critical judgment)
- **Why it matters:** The *decision* — approach boundary, PPE category, is energized work justified — not the credit-hour.
- **Buyer pain:** "They can recite 70E and still open a panel they shouldn't."
- **Downtime/safety impact:** Safety-critical.
- **Vector overlap:** ~20 HSE arc-flash courses (compliance). **Partner for the credit; we build the judgment.**
- **EASLearn differentiation:** Choose boundary/PPE, justify or refuse energized work, hard safety gate.
- **Format:** SIM + safety gate + SP · **Effort:** M · **Priority:** P1

---

## P2 — Enterprise expansion (broaden the moat)

### 14. Bearing-Failure Signature → Root Cause
- **Category:** Bearings · **Vector overlap:** ~11 recall · **Pain:** "It failed again in 3 months — why?"
- **Differentiation:** From symptom (noise/heat/vibration) to cause (load, lube, install, misalignment). **Format:** SIM + CO · **Effort:** M · **P2**

### 15. Vibration-Signature Diagnosis + PM-vs-Run Decision
- **Category:** Reliability / PM · **Vector overlap:** ~23 recall · **Pain:** "Our PM is calendar-based; we over- and under-maintain."
- **Differentiation:** Read a spectrum, decide intervene-now vs monitor, justify. **Format:** SIM + CO + MV · **Effort:** L · **P2**

### 16. Network Comms-Loss Diagnostic (EtherNet/IP)
- **Category:** Industrial networking · **Vector overlap:** ~9 recall · **Pain:** "A duplicate IP took the cell down for a shift."
- **Differentiation:** Isolate link/IP/duplicate-address/switch faults on the twin. **Format:** SIM + CO · **Effort:** M · **P2**

### 17. Safety-Chain: Light-Curtain / Muting / Safety-PLC
- **Category:** Safety circuits · **Vector overlap:** framed as awareness · **Pain:** "The guard trips intermittently and they bypass it."
- **Differentiation:** Diagnose the safety chain, resist the bypass, escalate. **Format:** SIM + RP + CO · **Effort:** M · **P2**

### 18. Prox/Analog Sensor NPN-PNP Wiring-Fault
- **Category:** Sensors · **Vector overlap:** ~10 recall · **Pain:** "Replaced the sensor, still dead — it's the commoning."
- **Differentiation:** Match sourcing/sinking to the input card before swapping hardware. **Format:** SIM + CO · **Effort:** S · **P2**

### 19. Lubrication-Failure Root Cause
- **Category:** Lubrication · **Vector overlap:** ~7 recall · **Pain:** "Right grease, wrong amount/contaminated — bearings keep dying."
- **Differentiation:** Contamination vs starvation vs wrong-lube reasoning. **Format:** L + SIM · **Effort:** M · **P2**

### 20. Three-Phase Power & Phase-Loss Deepening
- **Category:** Motor controls / power · **Vector overlap:** embedded recall · **Pain:** "Single-phasing cooked another motor."
- **Differentiation:** Extends existing phase-diagnostic sim to power-quality root cause. **Format:** SIM + CO · **Effort:** S · **P2**

---

## P3 — Later / avoid

- **21. HMI/SCADA operation** — thin buyer pull; fold HMI comms into #16. **Avoid standalone for now.**
- **22. Robotics cell troubleshooting** — Vector has none, OEM-specific, no signal. **Build only when a customer funds a specific cell.**
- **23. HSE compliance library (~319 courses)** — seat-time, different buyer, regulatory treadmill. **Do not build. Partner/integrate; SCORM-in their credits, competency-out ours.**
- **24. NEC / code-update recall (~13 courses)** — re-obsoletes each cycle, zero judgment. **Avoid.**

---

## Enterprise plumbing gap (table-stakes to get paid)

Vector has years of LMS plumbing; we need enough to charge, then to scale. Ranked by the revenue stage it unblocks. (Current state: readiness / Skills Passport / competency signals + certificates exist; SCORM/xAPI and SSO/SAML are stubs at best.)

| Capability | Pilot (free) | Paid pilot | Enterprise rollout | Notes |
|---|---|---|---|---|
| Assignments (assign lesson/track to user/team) | **Required** | Required | Required | Baseline of "a manager runs this." |
| Manager reports (readiness by person/skill) | **Required** | Required | Required | This *is* the product's ROI surface. |
| Completion & competency records | **Required** | Required | Required | Evidence, not seat-time. |
| CSV / PDF export | **Required** | Required | Required | Leaders live in spreadsheets and audits. |
| Certificate records | Nice-to-have | **Required** | Required | Already partially present. |
| Team hierarchy / org structure | Basic | **Required** | Required | Manager → crew rollups. |
| Role permissions (admin/manager/learner) | Basic | **Required** | Required | Gate reports and assignments. |
| SSO (SAML/OIDC) | — | **Required** | Required | Hard blocker for most enterprise IT. |
| Audit logs | — | **Required** | Required | Safety-critical training must be auditable. |
| SCORM / xAPI export | — | Strong-plus | **Required** | **Strategic wedge:** push our competency results *into* their existing LMS — "keep Vector, prove readiness with us." |
| SCIM / user provisioning | — | Nice | **Required** | Deprovision at scale. |
| Data retention / privacy (SOC 2 path) | — | Nice | **Required** | Procurement/security review gate. |
| Billing / procurement support (MSA, POs) | — | Nice | **Required** | Enterprise buying motion. |

**Plumbing verdict:** the pilot needs **assign → practice → manager report → export**. The paid pilot adds **SSO + role permissions + audit**. Enterprise rollout is gated on **SCORM/xAPI** (also our integration wedge) and **security/procurement**. Do not gold-plate plumbing ahead of the stage you're selling into.
