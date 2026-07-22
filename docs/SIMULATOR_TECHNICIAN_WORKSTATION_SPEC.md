# EASLearn Simulator — Technician Workstation IA (Redesign Spec)

**Status: PLANNING / FOR REVIEW. No simulator code changed.** This is the
information-architecture spec requested before implementation.

> Note: the "free motor troubleshooting simulator" screenshot referenced in the request
> was **not attached to this turn**, so this spec is written to the described information
> architecture (machine + print + meter + procedure + controls + fault context, all
> visible together), **not** by copying any third-party design or assets.

---

## 1. Problem with the current EASLearn sims (IA, not cosmetics)

The current hydraulic/electrical sims present a **linear stack of large cards**
(brief → investigate → diagnose → act → closeout). The learner must **hold state in
their head** across screens: the symptom is on one card, the print on another, the meter
reading somewhere else, the reasoning at the end. That is the opposite of how a
technician actually works — at a real machine everything is in view at once.

**Goal:** one **coherent troubleshooting station** where machine state, the print, the
tools, the measurements, and the procedure are visible together and cross-linked.

---

## 2. Desktop layout — three panes + a bottom drawer

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│  ▸ Scenario: Motor won't start (F-03)   Safety: LOCKED OUT ✔   Time  Score ▓▓▓░░  [Exit] │  ← status bar (fault + safety + score always visible)
├───────────────────────┬───────────────────────────────┬─────────────────────────────────┤
│  LEFT — MACHINE TWIN  │  CENTER — SCHEMATIC / LADDER   │  RIGHT — DIAGNOSTIC WORKSPACE    │
│  (physical equipment) │  (hardwired control schematic) │  (tools + reasoning)            │
│                       │                                │                                 │
│   [ disconnect ]      │   L1 ─[FU]─┬─[ OL ]─( M )─ L2  │  ┌── MULTIMETER ──────────────┐ │
│   [ contactor  ]◀─────┼──cross-────┤ START  STOP        │  │ Mode: VAC ▼   Range: auto  │ │
│   [ overload   ]      │  highlight │  ├─┤├──┤/├─┐        │  │ Leads: TP3 ── TP4          │ │
│   [ START | STOP ]    │            │  M aux ─┤├─┘        │  │ Reading: 0.0 V             │ │
│   [ motor  ⚙ idle ]   │   clickable test points ●TP1..  │  │ [place leads] [measure]    │ │
│   [ sensors    ]      │   wire #s, tags, live path hi   │  └────────────────────────────┘ │
│                       │                                │  Observed: TP3–TP4 = 0.0 V      │
│   machine status:     │   (clicking a device here      │  Expected: 120 VAC              │
│   ● NOT RUNNING       │    highlights it in the twin,  │  Hypothesis: STOP contact open? │
│   fault visible ✔     │    and vice-versa)             │  Evidence: verified ✔ / assumed │
│                       │                                │  Next action: [test TP4–L2]     │
├───────────────────────┴───────────────────────────────┴─────────────────────────────────┤
│  DRAWER ▸  [ Work Order ] [ Operator ] [ Shift Handoff ] [ Methodology / Evidence ]      │  ← collapsible
└───────────────────────────────────────────────────────────────────────────────────────┘
```

**Pane responsibilities**
- **LEFT — Machine Twin (A `PHYSICAL_DEVICE`):** motor, contactor, overload, pushbuttons,
  sensors, machine status, and **visible motion/fault state** (motor idle/spinning,
  tripped OL flag, indicator lamps).
- **CENTER — Schematic/Ladder (B `HARDWIRED_CONTROL_SCHEMATIC`):** live conductor state
  (energized/dead), **clickable test points**, component tags, wire numbers, and a
  **highlighted current path**. A selected component is **cross-highlighted in the Twin**.
- **RIGHT — Diagnostic Workspace:** multimeter (mode, range, lead placement), the
  **observed value beside the selected test points**, safety state, test history,
  hypothesis, **verified-vs-assumed** flags, and the next diagnostic action.
- **BOTTOM DRAWER:** work order, operator conversation, shift handoff, methodology/evidence
  score (kept out of the way but one click away).

---

## 3. Required behaviors (acceptance-level)

1. Clicking a **physical component** highlights it on the **schematic** (and vice-versa).
2. Meter leads are **placed on valid test points**; invalid points are rejected with a reason.
3. The **reading appears beside the selected test points** (not on a separate screen).
4. The **machine state visibly changes** after a valid action (start attempt, reset, repair).
5. Symptom, print, measurement, and reasoning are **on screen together**.
6. **Unsafe actions are blocked or explicitly escalated** (e.g. measuring VAC on a
   circuit that must be locked out → hard stop + escalation, consistent with the
   Assessment Spine safety gate).
7. The layout reads as a **troubleshooting station**, not a marketing page.

---

## 4. Mobile layout — 5 tabs (no endless card stack)

```
┌───────────────────────────────┐
│  F-03 · Motor won't start      │  ← persistent context bar:
│  Safety: LOCKED OUT ✔          │     fault + safety + selected TP + last reading
│  TP3–TP4 = 0.0 V               │     stay visible across ALL tabs
├───────────────────────────────┤
│                                │
│   [ active tab content ]       │
│                                │
├───────────────────────────────┤
│ [Machine][Print][Meter][Diag][Closeout] │  ← tab bar
└───────────────────────────────┘
```

- **Machine** — the Twin + status/fault.
- **Print** — schematic/ladder, clickable test points + tags + wire #s.
- **Meter** — multimeter + lead placement + reading.
- **Diagnosis** — hypothesis, verified-vs-assumed, test history, next action.
- **Closeout** — work order, operator, shift handoff, evidence/score.

**Rule:** the **current fault, selected test point, and last measurement stay visible**
in the context bar while switching tabs. Do **not** stack five giant cards into one
endless scroll.

---

## 5. Cross-highlight & data model (implementation note for later)

A single scenario model keys every entity by an ID shared across panes:
- `component.id` links Twin pictorial ↔ schematic glyph ↔ work-order line.
- `testPoint.id` links a schematic node ↔ the meter's valid-probe set ↔ the reading.
- `conductor.id` carries live state (energized/dead) → drives path highlight + Twin state.
This is what makes "click here, highlight there" and "reading beside the test points"
work without special-casing each scenario.

---

## 6. No demo data (hard rule)

- No fake learner records, competency evidence, completion scores presented as real, fake
  plant assets, fake manager data, placeholder measurements, or decorative random values.
- **Scenario values are allowed only** when they are part of a clearly identified training
  fault and are **produced by the simulator model** (e.g. "TP3–TP4 = 0.0 V because the
  STOP contact is open in fault F-03"). Every displayed value must trace to the model, not
  to a hard-coded prop.

---

## 7. Build phases (after symbol remediation + this spec are approved)

| Phase | Work | Est. |
|---|---|---|
| S0 | Scenario data model (components, test points, conductors, faults, valid probes) | 2–3 d |
| S1 | Desktop 3-pane shell + cross-highlight (Twin ↔ schematic) | 3–4 d |
| S2 | Meter interaction (lead placement, valid points, reading beside points) + live path | 3–4 d |
| S3 | Diagnostic workspace (hypothesis, verified-vs-assumed, history, next action) + safety gate | 2–3 d |
| S4 | Bottom drawer (work order / operator / handoff / methodology) wired to Assessment Spine | 2 d |
| S5 | Mobile 5-tab layout + persistent context bar | 3 d |
| S6 | Port one existing scenario (e.g. motor-won't-start) end-to-end; QA desktop + mobile | 2–3 d |
| — | **Total** | **~17–22 dev-days** for the framework + 1 scenario |

---

## 8. Risks & open questions

- **SR1:** The schematic pane needs the **remediated symbol set** (this spec depends on the
  symbol Source-of-Truth work landing first) — otherwise the print reuses ambiguous glyphs.
- **SR2:** Which scenario is the reference build? (Recommend the free motor-start fault so
  it maps to the described sim.)
- **SR3:** Test-point realism — do we model real terminal numbers/wire numbers per NFPA 79
  (needs the licensed source) or use clearly-labeled training tags?
- **SR4:** Meter model fidelity — VAC/VDC/ohms/continuity only, or add clamp-on current?
- **SR5:** Existing sims (hydraulic, conveyor, motor-starter) — migrate onto the new shell
  or run in parallel during transition?

---

## 9. Deliverable status vs your required list

| # | Required deliverable | Where |
|---|---|---|
| 1 | Full symbol remediation table | `ELECTRICAL_SYMBOL_SOURCE_OF_TRUTH.md` §5 |
| 2 | Proposed final taxonomy | that doc §2–§3 |
| 3 | Symbols to remove immediately | that doc §5a |
| 4 | Source citation for every retained symbol | that doc §4 + §5 (status = mostly WAITING_FOR_SOURCE — see constraints) |
| 5 | Before/after simulator wireframe | this doc §1–§2, §4 |
| 6 | Desktop technician-workstation layout | this doc §2 |
| 7 | Mobile tab layout | this doc §4 |
| 8 | SME review checklist | source doc §7 |
| 9 | Estimated work by phase | source doc §8 + this doc §7 |
| 10 | Risks & unresolved standards questions | source doc §9 + this doc §8 |

**Overall verdict: NOT APPROVED — unresolved symbols and simulator gaps remain.**
Blocking items: licensed ICS 19 / NFPA 79 access, an SME reviewer, and the source/SME
decisions in the risk lists. No implementation should start until these deliverables are
reviewed and Phase 0 (sources + SME) is unblocked.
