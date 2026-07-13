# Spaced Repetition Scheduler - Implementation Notes

## EXISTING SYSTEM (concept-level review only)
- `conceptReviews` table: per-question SM-2 scheduling (ease, intervalDays, reps, lapses, dueAt)
- `shared/spacedRepetition.ts`: SM-2-lite with binary grading (correct/incorrect + fast bonus)
- `server/review.ts`: backfill, getDue, submit, stats procedures
- `shared/assessmentSpine.ts`: EvidenceEvent → CompetencySignal → ReadinessSignal
- `competencyEvidence` table: persisted evidence (sourceType, evidenceType, domain, correctness, reasoningQuality, safetyFlag, etc.)

## WHAT'S NEEDED (per user spec)
A BROADER scheduler that covers:
- Fault retry (from conveyor lab / simulator)
- Concept review (existing)
- Simulation repeat
- Operator communication practice
- Work order documentation practice
- Safety decision review

Triggers:
- missed root cause → review fault
- slow diagnostic → review method
- excess hints → review concept
- unsafe action → HIGH PRIORITY safety recheck
- failed reflection → review reasoning
- poor operator explanation → communication practice
- vague work order → documentation practice
- low confidence → reinforce concept
- knowledge decay → resurface

Intervals: same-day (unsafe), 1d (weak reasoning), 3d (partial), 7d (strong), 14+d (repeated success)

## KEY TABLES TO CREATE
- `spaced_review_items`: broader review queue (not just questions - faults, scenarios, skills)

## KEY EXISTING MODULES
- `shared/competencyMatrix.ts` - SkillDomain, skillDomainForModule
- `shared/competencyGraph.ts` - competencyLevel, decayStatus
- `shared/assessmentSpine.ts` - reviewEvidence(), EvidenceEvent
- `shared/learningEngine.ts` - LearningMechanicId

## EVIDENCE TYPES ALREADY DEFINED
- review_recall, review_fault_retry (not yet used), review_reasoning_check (not yet used)
- review_safety_recheck (not yet used), review_operator_communication (not yet used)
- review_work_order_documentation (not yet used)
- These are defined in assessmentSpine.ts EvidenceType union but not yet implemented

## ROUTER STRUCTURE
- server/routers.ts merges all sub-routers
- review.ts is already a sub-router
- Need to extend or create new router for broader scheduler
