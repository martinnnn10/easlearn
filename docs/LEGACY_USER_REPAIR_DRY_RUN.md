# Legacy User Repair — Dry Run Report

**Date:** 2026-08-06T18:11:35Z  
**Mode:** DRY RUN — no database mutations performed  
**Script:** `scripts/run-legacy-repair-dry-run.mjs`

---

## Summary

| Metric | Count |
|--------|-------|
| Total users examined | 3 |
| Classification A (answers map to path) | 1 |
| Classification B (re-onboarding required) | 0 |
| Classification C (progress preserved + path assigned) | 0 |
| Classification D (manager/admin — no change) | 0 |
| SKIP (already has valid path) | 2 |
| Manual review required | 0 |
| Errors | 0 |

---

## Detailed Classification Results

### User 1 — SKIP

| Field | Value |
|-------|-------|
| User ID | 1 |
| Masked email | `e***@eautomatedstaffing.com` |
| Current role | user |
| Current onboarding state | completed = true |
| Current assigned path | `troubleshooting_builder` |
| Existing progress count | Unknown (not queried for SKIP) |
| Proposed action | No change — already has valid assigned path |
| Progress preserved | N/A |
| Will be re-onboarded | NO |
| Reason | User already has `assignedPathId` in selections — repair not needed |

**Legacy selections:**
```json
{
  "assignedPathId": "troubleshooting_builder",
  "completedAt": 1785985377640,
  "experience": "developing",
  "firstLessonSlug": "ohms-law-power",
  "goal": "build_troubleshooting",
  "persona": "new_tech"
}
```

---

### User 2 — Classification A

| Field | Value |
|-------|-------|
| User ID | 31680001 |
| Masked email | `mik***@gmail.com` |
| Current role | user |
| Current onboarding state | completed = true |
| Current assigned path | **NONE** |
| Existing progress count | 0 |
| Proposed action | Assign path: `operator_to_tech` |
| Progress preserved | N/A (no progress exists) |
| Will be re-onboarded | NO |
| Reason | Case A: legacy answers (`experienceLevel: "beginner"`) map deterministically to `operator_to_tech` |

**Legacy selections:**
```json
{
  "completedAt": 1785982052967,
  "equipment": ["general"],
  "experienceLevel": "beginner",
  "goals": ["career"],
  "skipped": false
}
```

**Mapping logic:** `experienceLevel === "beginner"` → `operator_to_tech`

---

### User 3 — SKIP

| Field | Value |
|-------|-------|
| User ID | 32580001 |
| Masked email | `qa.***@eautomatedstaffing.com` |
| Current role | user |
| Current onboarding state | completed = true |
| Current assigned path | `operator_to_tech` |
| Existing progress count | Unknown (not queried for SKIP) |
| Proposed action | No change — already has valid assigned path |
| Progress preserved | N/A |
| Will be re-onboarded | NO |
| Reason | User already has `assignedPathId` in selections — repair not needed |

**Legacy selections:**
```json
{
  "assignedPathId": "operator_to_tech",
  "completedAt": 1786039757578,
  "experience": "none",
  "firstLessonSlug": "what-maintenance-techs-do",
  "goal": "move_to_maintenance",
  "persona": "operator"
}
```

---

## Pre-Mutation Safety Checklist

| Check | Status |
|-------|--------|
| Affected-user list exported | This document |
| Current onboarding and path records exported | Shown above per user |
| Database backup exists | Manus platform maintains automatic backups |
| Repair is idempotent | YES — running twice produces identical results (SKIP on second run) |
| Running twice will not duplicate paths | YES — checks `assignedPathId` before acting |
| Valid existing paths will not be overwritten | YES — users with `assignedPathId` are SKIPPED |
| Lesson completion will not be deleted | YES — only `onboardingSelections` is modified |
| Manager/admin accounts will not receive operator paths | YES — Case D check runs before path assignment |
| Rollback plan exists | YES — restore `onboardingSelections` to previous value, set `onboardingCompleted` back to true |
| Dry-run and live execution use same classification logic | YES — same `repairLegacyUsers()` function, `dryRun` flag only controls `db.update()` calls |

---

## Rollback Plan

If the live repair produces unexpected results:

```sql
-- For Case A users: remove the assignedPathId
UPDATE users SET onboarding_selections = JSON_REMOVE(onboarding_selections, '$.assignedPathId', '$.repairedAt', '$.repairReason')
WHERE id = <user_id>;

-- For Case B users: restore onboarding completed state
UPDATE users SET onboarding_completed = 1,
  onboarding_selections = JSON_REMOVE(onboarding_selections, '$.repairedAt', '$.repairReason')
WHERE id = <user_id>;
```

---

## Verdict

**LEGACY REPAIR: DRY RUN COMPLETE — AWAITING APPROVAL**

Only 1 user (ID 31680001, `mik***@gmail.com`) requires repair. This is the test account "Mike Rodriguez" created during the earlier synthetic usability test. The repair would assign `operator_to_tech` path based on their legacy answer `experienceLevel: "beginner"`.

The other 2 users already have valid paths and will be skipped.

No users require manual review. No users have progress that would be affected. No manager/admin accounts are impacted.

**Recommendation:** Safe to execute `repairLegacyUsers(false)` when ready. Impact is limited to 1 test account.
