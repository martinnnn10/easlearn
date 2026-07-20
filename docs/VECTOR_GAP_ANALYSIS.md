# Vector → EASLearn Gap Analysis

**Inputs:** Vector *Industrial Maintenance Library* (474 courses, ~456 hrs) + *HSE Premium Library* (414 courses, ~316 hrs). EASLearn current curriculum: 36 card-format lessons across 8 modules, ~20 troubleshooting simulator scenarios, 6 full-loop lessons with mentor closeouts, plus a readiness / Skills Passport / competency-signal evidence layer.

**How to read this.** Vector counts are keyword-derived from the catalog exports and are **directional** (a course can hit two categories); treat them as breadth bands, not a scoreboard. EASLearn depth uses the engine's own ladder:

`none → light → lesson only → lesson + assessment → lesson + simulation → full apprenticeship loop` (lesson + sim + mentor closeout + competency signal).

**The frame this table serves:** *Vector proves someone was assigned training. EASLearn proves someone can troubleshoot.* We build depth where Vector is broad-but-shallow **and** the skill causes downtime or gets people hurt. We do **not** rebuild Vector's compliance/awareness library.

Priority key — **P0** demo/pilot hero · **P1** paid-pilot build · **P2** enterprise expansion · **P3** later / avoid.

---

## Master gap table

| Category | Vector coverage | Vector style | EASLearn current | EASLearn advantage | EASLearn gap | Buyer priority | Downtime impact | Recommended build | Priority |
|---|---|---|---|---|---|---|---|---|---|
| **Troubleshooting methodology** | Moderate (~52 "describe troubleshooting") | Recall — *describe/explain a process* | Full loop — the diagnostic method is embedded in every sim + the maintenance mentor | We make them *do* fault isolation under productive failure; Vector narrates it | No standalone "diagnostic method" spine lesson to name the transferable skill | High | High | Name the method: half-split / signal-trace lesson + cross-domain fault drill | **P0** |
| **VFD / drives** | Broad (~31) | Recall — describe/identify | Full loop — PowerFlex diagnostic lab + 6 fault scenarios + fault-codes closeout | Live drive faults, branch-on-choice root cause, work-order closeout | 480 V / DC-bus *safety decision* scenario | High | High | Keep as demo hero; add DC-bus/energized-work judgment gate | **P0** |
| **PLC** | Broad (~30) | Recall — describe/identify | Full loop — conveyor PLC lab across 5 lessons + I/O closeout | Online monitor, forcing, I/O-to-field tracing on a live twin | Networked/multi-rack fault; comms is lesson-only | High | High | Expand conveyor lab fault library; comms troubleshooting sim | **P2** |
| **Motor controls** | Moderate (~14 + embedded) | Recall | Full loop — motor-control + starter closeouts, overload/phase sims | Seal-in/interlock reasoning, overload-trip root cause | — (strong) | High | High | Maintain; fold into reliability track | **P2** |
| **Safety circuits (E-stop / relays)** | Light in maint; safety framed as awareness | Recall / compliance | Full loop — e-stop closeout, failed-safety-relay + blown-fuse sims | Trace a safety chain, find the open device, *stop-and-escalate* judgment | Light-curtain / muting / safety-PLC scenario | High | High | Safety-chain diagnostic sim + escalation role-play | **P2** |
| **Sensors** | Light (~10) | Recall | Lesson + sim — photoeye fault + closeout, sensor overview | Photoeye false-trigger diagnosis on the twin | NPN/PNP wiring-fault sim beyond photoeye | Medium | High | Add prox/analog sensor fault scenarios | **P2** |
| **Electrical fundamentals** | **Very broad** (~176 incl. instrumentation overlap) | Recall — *describe/identify/list* | **Lesson + assessment only** (6 lessons, just built) | Ohm's/Kirchhoff *applied to a fault*, glossary, KC | **No meter simulator, no closeout** — thinnest depth vs Vector's broadest area | High | Medium | Meter-lab sim (Live-Dead-Live, voltage-drop hunt) + closeout | **P1** |
| **Instrumentation / calibration** | **Very broad** (~108 — Vector's #1 maint area) | Recall | Lesson + light sim (loop-checkout, calibration-basics) | Loop-fault diagnosis, 4–20 mA reasoning | Declared *Process Instrumentation* track is mostly empty; no calibration closeout | High | Med-High | 4–20 mA loop troubleshooting sim + calibration closeout | **P1** |
| **Hydraulics** | Broad (~23) | Recall — describe components | **None** (track declared, zero lessons) | — (white space) | **Entire domain missing** | High | High | Hydraulic pressure-loss sim: gauge readings, root-cause branch, WO closeout | **P1** |
| **Pneumatics** | Broad (~28) | Recall | **None** | — | Entire domain missing | Med-High | High | Pneumatic no-motion / air-leak diagnostic sim | **P1** |
| **Mechanical systems / alignment** | **Very broad** (~65) | Recall | **None** | — | Entire domain missing | High | High | Coupling/belt failure + shaft-alignment decision sim | **P1** |
| **Bearings** | Moderate (~11) | Recall | **None** | — | Missing | High | High | Bearing-failure signature → root-cause diagnostic | **P2** |
| **Lubrication** | Light (~7) | Recall | **None** | — | Missing | Medium | Med-High | Lubrication-failure root cause (contamination/starvation) | **P2** |
| **Pumps** | Broad (~34) | Recall | **None** | — | Missing | High | High | Pump no-flow / cavitation / seal-leak diagnostic sim | **P1** |
| **Reliability / PM / vibration** | Broad (~23) | Recall | Light (competency signals only) | Evidence/readiness layer already exists | No vibration or PM-decision content | High | High | Vibration-signature diagnosis + PM-vs-run decision | **P2** |
| **Conveyors** | Light (~4) | Recall | Full loop *as the lab vehicle* | The conveyor twin is our flagship sim surface | — | Medium | High | Reuse as the delivery vehicle for new domains | **P2** |
| **Work orders / communication** | Broad (~30 maint + ~34 HSE) | Recall — *describe documentation* | Full loop — mentor communication classifier + closeouts | We *grade the handoff*: operator role-play, WO closeout, escalation | Not surfaced as a standalone manager-visible skill | High | Medium | Communication/closeout as a scored, cross-lesson skill | **P0/P1** |
| **LOTO** | Moderate (HSE ~6) | Compliance seat-time | Lesson only (guarding-lockout, safety-lockout) + competency signal | Verification *judgment*, stored-energy reasoning | No LOTO verification sim / role-play | High (mandated) | Low | Judgment-based LOTO verification + operator role-play — **not** a compliance course | **P2** |
| **Arc flash / electrical safety** | Moderate (HSE ~20) | Compliance seat-time | Lesson only (electrical-safety-lockout) | Boundary/PPE *decision* framing | No energized-work decision scenario | High (mandated) | Med (safety-critical) | Arc-flash **decision** scenario (approach/PPE/justify); partner for the OSHA credit | **P2** |
| **HMI / SCADA** | Light (~3) | Recall | Light (comm-faults touches HMI) | — | Thin | Medium | Medium | Defer; fold HMI comms into networking sim | **P3** |
| **Industrial networking** | Light-Moderate (~9) | Recall | Lesson only (communication-faults) | EtherNet/IP topology reasoning in lesson | No comms-fault sim (link/IP/duplicate address) | Medium | Med-High | Network comms-loss diagnostic sim | **P2** |
| **Robotics** | **None** (0 in both) | — | None | — | Greenfield, OEM-specific, no Vector pull | Low-Med | Medium | Avoid until a customer funds a specific cell | **P3** |
| **HSE / compliance library** | **Vast** (~319) | **Compliance seat-time** — OSHA, hazwoper, fire, DOT, bloodborne | None (intentional) | We do *judgment* safety, not credit-hours | We will never match the library — and shouldn't | High (budget line) | Low (as awareness) | **Do not build.** Partner/integrate; build judgment-safety scenarios only | **P3 / avoid** |
| **NEC code-change courses** | Moderate (~13 "2020 NEC changes") | Regulatory recall | None | — | — | Low-Med | Low | Avoid — pure code-update recall, re-obsoletes every cycle | **P3 / avoid** |

---

## Reading the table in one breath

- **EASLearn already wins** where downtime actually happens and where we've closed the loop: **VFD/drives, PLC, motor controls, safety circuits, sensors** — plus two skills Vector can only *describe*: **troubleshooting method** and **communication/closeout**. Lead every demo here.
- **EASLearn is thin in exactly the areas buyers pay Vector for most:** **instrumentation (~108), electrical fundamentals (~176), mechanical/pumps/bearings (~110 combined), hydraulics/pneumatics (~51).** These are broad-but-shallow in Vector and **high-downtime** — the highest-leverage places to build *depth*, not breadth.
- **Do not chase:** the **319-course HSE compliance library**, NEC code-update recall, and robotics. These are either seat-time categories (partner/integrate) or greenfield with no demand signal.
- **Buckets to keep separate** (per strategy):
  - **A — Compliance seat-time** (build nothing): HSE library, NEC changes, most LOTO/arc-flash *credit*.
  - **B — Maintenance judgment** (deepen): electrical fundamentals, instrumentation, mechanical, hydraulics/pneumatics, pumps.
  - **C — High-downtime troubleshooting** (defend + extend our moat): VFD, PLC, motors, safety circuits, sensors, networking.
  - **D — Safety-critical judgment** (build the *decision*, partner the *credit*): arc-flash decisions, LOTO verification, stop-and-escalate.
  - **E — Enterprise plumbing** (unblock revenue): SSO, SCORM/xAPI export, manager reports, audit — see the build map.
