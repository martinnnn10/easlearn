# Unified Technician Workstation — Paid Pilot Package

**Document version:** 1.0  
**Date:** 2026-07-23  
**Status:** READY FOR PRICING DECISION  
**Author:** EASLearn Product Team

---

## Pilot Scope

### Target Customer Profile

| Attribute | Specification |
|-----------|--------------|
| Industry | Manufacturing, food & beverage, automotive, logistics, utilities |
| Facility size | 50–500 employees |
| Maintenance team | 10–50 technicians |
| Pain point | Cannot verify technician readiness for independent troubleshooting |
| Current training | Vendor courses, OJT, tribal knowledge, or generic LMS |
| Decision maker | Maintenance manager, plant manager, or training director |

### Pilot Structure

| Element | Detail |
|---------|--------|
| Facility count | 1 |
| Manager accounts | 1 (with full dashboard access) |
| Technician accounts | 10–25 |
| Lab access | Motor Control Troubleshooting (2 fault scenarios) |
| Duration | 6 weeks |
| Support | Dedicated onboarding + weekly check-in |

### Pilot Timeline

| Week | Activity | Deliverable |
|------|----------|-------------|
| 0 | Onboarding: manager orientation, technician account setup | Access confirmed, baseline expectations set |
| 1 | Baseline attempt: each technician completes both scenarios cold | Baseline methodology tiers recorded |
| 2–4 | Practice period: technicians repeat scenarios, improve methodology | Progress tracked, manager can review attempts |
| 5 | Follow-up attempt: each technician completes both scenarios again | Improvement data captured |
| 6 | Pilot review: manager readiness report, evidence export, outcome discussion | Final deliverable package |

### Pilot Deliverables to Customer

1. **Manager Readiness Report** — Per-technician summary showing baseline vs. follow-up methodology tier, safety record, and readiness status
2. **Evidence Export** — Full attempt data for each technician (timeline, measurements, interpretations, methodology)
3. **Improvement Analysis** — Aggregate data showing diagnostic-method progression across the team
4. **Safety Summary** — Any safety violations flagged during the pilot period
5. **Recommendation** — Per-technician readiness assessment with manager validation prompts
6. **Pilot Outcome Review** — 30-minute meeting to discuss results and expansion decision

### What the Pilot Tracks

| Metric | Purpose |
|--------|---------|
| Diagnostic-method improvement | Did methodology tiers improve from baseline to follow-up? |
| Safety interventions | Were safety violations reduced over the practice period? |
| Repeated weak assumptions | Are specific misconceptions persistent across the team? |
| Manager validation results | Did the manager agree with the system's readiness recommendations? |
| Time to verified competency | How many attempts before a technician reaches "needs validation" status? |
| Recurring skill gaps | Which competencies are weakest across the team? |

---

## Implementation Estimate

### Phase 1: Usability Validation (Already Complete)

| Task | Effort | Status |
|------|--------|--------|
| Usability test protocol | 0 days | Done |
| Conduct tests with 3–4 technicians | 3–5 days (calendar) | Pending — requires scheduling |
| Document results, classify issues | 1 day | Pending |
| Fix P0/P1 issues | 1–3 days | Pending (depends on findings) |
| **Phase 1 total** | **5–9 calendar days** | |

### Phase 2: Production Integration

| Task | Effort | Dependencies |
|------|--------|--------------|
| Database schema (attempts, events, evidence tables) | 1 day | Gate 1 PROCEED |
| Server-side attempt management (tRPC procedures) | 2 days | Schema complete |
| Production UI shell (fork prototype, remove demo controls) | 2 days | Procedures complete |
| Methodology tier computation | 1 day | Events recording |
| Integration testing (both scenarios, both platforms) | 1 day | All above |
| **Phase 2 total** | **7 days** | |

### Phase 3: Evidence Connection

| Task | Effort | Dependencies |
|------|--------|--------------|
| Evidence generation from attempt events | 2 days | Phase 2 complete |
| Safety override logic | 1 day | Evidence generation |
| Readiness evaluation rules | 1 day | Evidence generation |
| Vitest coverage for evidence logic | 1 day | All above |
| **Phase 3 total** | **5 days** | |

### Phase 4: Manager Dashboard

| Task | Effort | Dependencies |
|------|--------|--------------|
| Attempt list view (table with filters) | 2 days | Phase 2 complete |
| Attempt detail view (timeline + evidence) | 3 days | Phase 3 complete |
| Manager actions (validate, flag, note) | 1 day | Detail view |
| Team aggregate view | 1 day | List view |
| **Phase 4 total** | **7 days** | |

### Phase 5: Skills Passport

| Task | Effort | Dependencies |
|------|--------|--------------|
| Passport competency display | 2 days | Phase 3 complete |
| Evidence accumulation logic | 1 day | Phase 3 complete |
| Notification to manager on validation-ready | 1 day | Phase 4 complete |
| **Phase 5 total** | **4 days** | |

### Phase 6: VFD Scenario (Post-Pilot Expansion)

| Task | Effort | Dependencies |
|------|--------|--------------|
| VFD fault engine design | 2 days | Phase 2 validated |
| VFD machine twin + schematic | 3 days | Design complete |
| VFD meter readings + probe points | 2 days | Engine complete |
| VFD hypothesis set + zones | 1 day | Engine complete |
| Integration testing | 1 day | All above |
| **Phase 6 total** | **9 days** | |

### Total Implementation Estimate

| Phase | Calendar Days | Parallel? |
|-------|--------------|-----------|
| Phase 1 (Usability) | 5–9 | No — gate required |
| Phase 2 (Production) | 7 | No — sequential |
| Phase 3 (Evidence) | 5 | Partially parallel with Phase 4 |
| Phase 4 (Manager) | 7 | Partially parallel with Phase 3 |
| Phase 5 (Passport) | 4 | After Phase 3+4 |
| **Pilot-ready total** | **~28–32 working days** | |
| Phase 6 (VFD) | 9 | Post-pilot |

**Realistic calendar estimate:** 6–8 weeks from Gate 1 PROCEED to pilot-ready, assuming full-time development focus.

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Methodology tier computation produces incorrect assessments | Medium | High | Validate against manual expert assessment for 20+ attempts before launch |
| Event recording creates performance issues on mobile | Low | Medium | Batch events, debounce rapid actions, test on low-end devices |
| Database schema changes break existing features | Low | High | Additive-only schema changes; no modifications to existing tables |
| Evidence weight calibration is wrong | Medium | Medium | Start conservative (lower weights), adjust based on pilot data |
| PLC state vs. field voltage distinction confuses learners | Low | Low | Already validated in prototype; usability testing will confirm |

### Commercial Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Pilot customer expects more scenarios than available | Medium | Medium | Set expectations clearly: 2 scenarios (Motor Control), VFD coming post-pilot |
| Manager does not engage with dashboard during pilot | Medium | High | Weekly check-in calls; show manager value in onboarding |
| Technicians do not practice between baseline and follow-up | Medium | Medium | Manager assigns practice; system sends progress reminders |
| Customer expects downtime reduction proof from pilot | Low | High | Explicitly state: pilot measures diagnostic improvement, not downtime |
| Competitor launches similar product during pilot | Low | Low | First-mover advantage in evidence-based diagnostic training |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Usability testing reveals architectural problems (REJECT verdict) | Low | High | Prototype has been designed with real technician input; architecture is sound |
| Scheduling usability testers takes too long | Medium | Medium | Start recruiting now; offer compensation; use professional network |
| Pilot customer churns before completion | Low | High | 6-week duration is short; weekly engagement maintains momentum |

---

## Pricing Considerations

### Pilot Pricing Options

| Option | Price | Includes | Rationale |
|--------|-------|----------|-----------|
| **A: Free pilot** | $0 | Full pilot scope, 6 weeks | Removes friction; risks devaluing the product |
| **B: Subsidized pilot** | $500–$1,000 | Full pilot scope, 6 weeks | Shows commitment from customer; covers minimal costs |
| **C: Paid pilot** | $2,000–$5,000 | Full pilot scope + dedicated support + custom report | Validates willingness to pay; filters serious buyers |
| **D: Per-seat pilot** | $50–$100/technician/month | Scales with team size | Establishes per-seat pricing model early |

**Recommendation:** Option C ($2,500) for the first pilot. This validates willingness to pay, filters tire-kickers, and establishes that the product has commercial value. The custom report and dedicated support justify the price and create a premium experience.

### Post-Pilot Pricing Model

| Tier | Price | Includes |
|------|-------|----------|
| Per technician/month | $25–$50 | All workstation labs, Skills Passport, evidence recording |
| Manager seat | $75–$100/month | Dashboard, readiness reports, team analytics |
| Facility license | $500–$1,500/month | Unlimited technicians, 1 manager, all labs |

These are starting points. Pilot data will inform final pricing based on demonstrated value.

---

## Go/No-Go Decision Framework

### Prerequisites for GO

All of the following must be true:

1. **Gate 1 verdict is PROCEED** — Technicians can use the workstation without coaching
2. **Production integration is complete** — Real identity, real data, real evidence
3. **Manager dashboard shows useful information** — A manager can answer "who is ready?"
4. **At least one pilot customer has expressed interest** — Verbal or written commitment
5. **Pilot scope is agreed** — Customer understands what they get and what it costs
6. **Support capacity exists** — Someone can run weekly check-ins for 6 weeks

### NO-GO Triggers

Any of the following blocks launch:

1. Gate 1 verdict is REJECT — fundamental usability failure
2. Evidence generation produces obviously wrong assessments
3. No customer interest after 5+ demos
4. Technical debt makes the system unreliable under real usage
5. Safety violation logic has false positives that frustrate learners

---

## Final Decision Questions

At completion of the full roadmap, answer:

| Question | Expected Answer for "READY FOR PAID PILOT" |
|----------|---------------------------------------------|
| Is the workstation easier for technicians to use? | Yes — usability testing confirms (Gate 1 PROCEED) |
| Does it create useful manager evidence? | Yes — methodology tier + timeline + safety status |
| Is it visually strong enough to sell? | Yes — 10-minute demo creates immediate buyer understanding |
| Can it support a paid pilot? | Yes — production integration records real data |
| What exact feature should be built next? | VFD troubleshooting scenario (Phase 6) |
| What should remain deferred? | Hydraulic curriculum, additional dashboards, AI operator chat, time penalties |

---

## Current Verdict

**STATUS: NOT YET READY — Gate 1 pending**

The prototype is frozen and architecturally sound. All technical foundations exist. The roadmap is defined. The next action is to conduct structured usability testing with real technicians and issue the Gate 1 verdict.

Once Gate 1 returns PROCEED, the estimated timeline to pilot-ready is 6–8 weeks of focused development.

---

## Immediate Next Actions

| Priority | Action | Owner | Timeline |
|----------|--------|-------|----------|
| 1 | Schedule 3–4 technicians for usability testing | Martin | This week |
| 2 | Conduct usability sessions (both scenarios, uncoached) | Martin | Next 5–9 days |
| 3 | Document results in WORKSTATION_COMMERCIAL_USABILITY_RESULTS.md | Martin | Same day as sessions |
| 4 | Issue Gate 1 verdict | Martin | After all sessions complete |
| 5 | If PROCEED: begin Phase 2 production integration | Development | Immediately after verdict |
