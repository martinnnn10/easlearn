# EAS Platform — Claude Code Review Summary

## Project Overview

**EASLearn** is an AI-powered industrial maintenance training platform that transforms operators into maintenance technicians through plant-floor lessons, realistic troubleshooting simulations, AI coaching, and workforce readiness tracking. The platform is deployed at [easlearn.org](https://easlearn.org).

**Stack:** React 19 + Tailwind 4 + Express 4 + tRPC 11 + Drizzle ORM + MySQL/TiDB + Manus OAuth + Stripe

---

## What Was Improved (This Session)

### 1. Stop Button Stuck Fault (`stop_stuck`)
- **Files:** `faultCatalog.ts`, `flagshipScoring.ts`, `ConveyorDiagnosticsPanel.tsx`, `types.ts`
- Full fault injection: `stopNcClosed: false` → I:1/0 de-energizes, motor won't start
- Evidence discovery rules, stop_nc meter probe
- Scoring rule in `eventToDiagnosticStep` maps stop_nc → check_start_stop

### 2. Fault-Specific Guided Walkthroughs (All 7 Faults)
- **Files:** `faultCatalog.ts`, `ConveyorGuidedPanel.tsx`, `ConveyorTroubleshootingLab.tsx`
- Each fault has 5-6 diagnostic steps guiding the learner through the exact path a senior tech would follow
- Faults covered: guard_open, stop_stuck, estop_open, overload_tripped, photoeye_stuck_on, photoeye_jam, output_on_motor_dead
- Falls back to generic GUIDED_STEPS for any unrecognized fault

### 3. Power Flow Animation on Ladder Rungs
- **Files:** `ConveyorLadderPanel.tsx`
- Animated pulses travel along wires when rungs are energized
- Blocking elements get a pulsing red ring highlighting where current stops
- Left/right power rails have vertical pulse animations with green glow when active

### 4. Diagnostic Replay Animation (Debrief)
- **Files:** `ConveyorDiagnosticReplay.tsx`, `ConveyorDebrief.tsx`, `ConveyorTroubleshootingLab.tsx`
- "Replay Path" button animates the learner's diagnostic sequence on the ladder
- Highlights each rung in sequence with proportional timing (30% of real time, max 1.5s per step)
- Uses framer-motion AnimatePresence for smooth transitions

### 5. Personal-Best Leaderboard
- **Files:** `personalBest.ts`, `ConveyorPersonalBest.tsx`, `ConveyorTroubleshootingLab.tsx`
- localStorage tracks fastest times, best scores, attempts, and streaks per fault
- Gold animated "New Personal Best" celebration banner
- Global stats: total attempts, current streak, longest streak

### 6. Contextual "Explain Why" Tooltips
- **Files:** `explainWhy.ts`, `ConveyorGuidedPanel.tsx`
- Every guided step has a "Why?" button revealing the electrical principle
- NEMA/NEC/OSHA standard references (NFPA 79, OSHA 29 CFR, NEC 430, NEMA ICS)
- Deep-links to relevant course lessons

### 7. Spaced Repetition Scheduler — Competency Durability Engine
- **Files:** `shared/reviewScheduler.ts`, `server/reviewScheduler.ts`, `drizzle/schema.ts`, `pages/ReviewQueue.tsx`
- SM-2 algorithm with safety-critical tuning (same-day for unsafe, 1d weak, 3d partial, 7d strong, 14+d repeated)
- Trigger detection from lab attempts (missed root cause, slow time, excess hints, unsafe action, weak reasoning)
- Trigger detection from mentor sessions (poor communication, vague work order, failed reflection, low confidence)
- Evidence writes back to Assessment Spine competencyEvidence table
- Manager visibility via `getTeamOverdue` procedure
- Learner-facing review queue UI at `/review-queue` with priority-coded cards
- 41 unit tests covering all scheduler logic

---

## What Has Yet to Be Improved

### High Priority (Product Gaps)
1. **Multiplayer Challenge Mode** — Two learners race to diagnose the same fault simultaneously with real-time progress bars (WebSocket-based)
2. **Competency Heat Map on Team Dashboard** — Aggregate per-fault weakness data so managers can assign targeted training
3. ~~**Scheduler Auto-Trigger Integration**~~ — **DONE** (see section 8 below)

### Medium Priority (UX Polish)
5. **Review Queue Notifications** — Badge on nav showing due count, push notification for critical safety reviews
6. **Debrief Comparison View** — Show current attempt vs. personal best side-by-side
7. **Guided Walkthrough Branching** — If learner makes a wrong step, show a "you went off-path" correction instead of linear progression
8. **Power Flow Animation Speed Control** — Let learner slow down or step through the animation manually

### Lower Priority (Platform Maturity)
9. **Offline/PWA Support** — Cache lesson content and review cards for plant-floor use without WiFi
10. **Gamification Layer** — XP system, level-up animations, team competitions
11. **Export Competency Reports** — PDF/CSV export of team competency data for compliance audits
12. **A/B Testing Framework** — Test different guided walkthrough approaches to optimize learning outcomes

---

## Architecture Notes for Reviewer

### Key Patterns
- **Assessment Spine** (`shared/assessmentSpine.ts`): Central evidence-writing system. Every learning activity writes `EvidenceEvent` objects that feed the competency graph. The scheduler writes `review_recall` evidence on each review submission.
- **Fault Catalog** (`client/src/lib/conveyorLab/faultCatalog.ts`): Single source of truth for all fault definitions, injection rules, evidence discovery, and guided steps.
- **Flagship Scoring** (`client/src/lib/conveyorLab/flagshipScoring.ts`): Maps diagnostic events to scoring dimensions. Each fault has a `correctFirstStep` and scoring rules.
- **Competency Graph** (`shared/competencyGraph.ts`): Decay model (fresh/stale/decayed) based on days since last evidence.

### Database Tables (New)
- `spaced_review_items` — The scheduler's work queue with SM-2 state per item

### Test Coverage
- **566 tests passing** (52 test files)
- Scheduler-specific: 41 tests in `server/reviewScheduler.test.ts`
- Auto-trigger integration: 39 tests in `server/schedulerAutoTrigger.test.ts`
- Spine integration: 12 tests in `shared/reviewSpine.test.ts`
- Only known flaky test: `server/email.test.ts` (network timeout to Resend API — pre-existing)

### Known Technical Debt
- The esbuild HMR error for `faultCatalog.ts:493` is a **stale log entry** — the file compiles fine with both `tsc` and `esbuild` directly. A server restart clears it.
- `drizzle-kit migrate` has intermittent issues; the `spaced_review_items` table was created via direct SQL as a workaround.
- The `personalBest.ts` uses localStorage (client-only) — should eventually sync to the server for cross-device persistence.

---

## File Map (Key New/Modified Files)

```
shared/
  reviewScheduler.ts          ← SM-2 scheduler logic, trigger detection, pure functions (NEW)
  assessmentSpine.ts          ← Evidence writing system (existing, used by scheduler)
  competencyGraph.ts          ← Decay model (existing)
  competencyMatrix.ts         ← Skill domains (existing)

server/
  reviewScheduler.ts          ← tRPC router: getDueItems, submitReview, stats, createFromAttempt, createFromMentor, getTeamOverdue (NEW)
  reviewScheduler.test.ts     ← 41 unit tests (NEW)
  routers.ts                  ← Added scheduler router registration

shared/
  reviewSpine.test.ts         ← 12 tests validating review→spine integration (NEW)
  assessmentSpine.ts          ← Added 5 new review_* EvidenceType values

drizzle/
  schema.ts                   ← Added spaced_review_items table

client/src/
  pages/ReviewQueue.tsx       ← Learner-facing review queue UI (NEW)
  App.tsx                     ← Added /review-queue route

  lib/conveyorLab/
    faultCatalog.ts           ← Added stop_stuck, FAULT_GUIDED_STEPS for all 7 faults
    flagshipScoring.ts        ← Added stop_nc scoring rule
    types.ts                  ← Added stop_stuck to FaultId union
    personalBest.ts           ← localStorage personal-best tracker (NEW)
    explainWhy.ts             ← Knowledge base mapping steps → electrical principles (NEW)

  components/interactive/conveyorLab/
    ConveyorLadderPanel.tsx   ← Power flow animation, color-coded rails
    ConveyorGuidedPanel.tsx   ← Fault-specific steps, explain-why tooltips
    ConveyorDebrief.tsx       ← Step timing summary, efficiency rating
    ConveyorDiagnosticReplay.tsx ← Replay animation component (NEW)
    ConveyorPersonalBest.tsx  ← Personal-best display component (NEW)
    ConveyorTroubleshootingLab.tsx ← Integrated all new features
```

---

## How to Test

1. **Conveyor Lab** — Navigate to `/simulator`, select "Conveyor Troubleshooting", pick any fault. The guided walkthrough, power flow animation, explain-why tooltips, and personal-best tracking are all active.
2. **Review Queue** — Navigate to `/review-queue`. Currently empty until scheduler triggers are wired into the submission flow (or items are manually inserted).
3. **Scheduler Tests** — Run `npx vitest run server/reviewScheduler.test.ts` (41 tests).
4. **Full Suite** — Run `npx vitest run` (527 tests, ~10s).

### 8. Scheduler Auto-Triggers (Wired Into Real Flows)
- **Files:** `server/schedulerAutoTrigger.ts` (NEW), `server/faultCompetency.ts`, `server/mentor.ts`, `server/review.ts`
- `triggerReviewsFromAttempt()` — called after every `recordFaultCompetencyAttempt` (catches both conveyor lab and V3 simulator)
- `triggerReviewsFromMentor()` — called after every `mentor.coach` evidence emission
- `triggerReviewFromFailedRecall()` — called on `review.submit` when lapses >= 2
- Deduplication: 24h window prevents duplicate items for same (learnerId, sourceId, reason)
- Anti-spam: max 15 pending items per learner
- 39 integration tests in `server/schedulerAutoTrigger.test.ts`

---

### Claude Code Merge (Latest)
- `reviewEvidenceType()` now maps each review item type to a specific Assessment Spine evidence type (review_fault_retry, review_reasoning_check, review_safety_recheck, review_operator_communication, review_work_order_documentation) instead of generic review_recall
- `createMentorReviews()` extracted as reusable helper
- `getTeamOverdue` uses `managedMemberIds()` for proper team scoping
- ReviewQueue has activity routing (Start button links to lab/review/simulator) and 3-button UX (Start/Mark Done/Still Weak)
- `reviewSpine.test.ts` validates that review evidence correctly integrates with the Assessment Spine (confirm on pass, needs_review on fail, never reaches mastery from review alone)
