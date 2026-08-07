# New-Learner Routing Hotfix

**Date:** 2026-08-06  
**Scope:** Client-side routing only. No database schema changes. No new content.

---

## 1. Root Cause

Fresh accounts created via email signup landed on `/dashboard` where the **legacy OnboardingWizard** component rendered. This wizard used a 3-step flow (experience → goals → equipment) that produced generic recommendations unrelated to the learner's actual starting point. The new `/onboarding` system (persona → experience → goal → deterministic path assignment) was never triggered because no routing logic redirected fresh accounts there.

The result: a brand-new machine operator received "Precision Alignment" and "Preventative Maintenance" as their first recommendations instead of "Industrial Maintenance Orientation."

---

## 2. Duplicate Onboarding Systems Found

| System | Location | What It Did | Status After Fix |
|--------|----------|-------------|------------------|
| Legacy OnboardingWizard | `client/src/components/OnboardingWizard.tsx` | 3-step wizard in Dashboard, used localStorage + `auth.completeOnboarding` mutation | **Removed from Dashboard** (component file retained for reference but never rendered) |
| Legacy PersonalizedRecommendations | `client/src/components/PersonalizedRecommendations.tsx` | Read `localStorage('eas-onboarding')` to show course cards | **Removed from Dashboard** |
| Legacy localStorage keys | `eas-onboarding`, `eas-onboarding-dismissed` | Persisted wizard state client-side | **No longer written** (existing values harmless) |
| Legacy `auth.completeOnboarding` mutation | `server/routers.ts` line 401 | Set `onboardingCompleted=true` without assigning a path | **Retained** (harmless, no longer called from UI) |
| New `/onboarding` page | `client/src/pages/Onboarding.tsx` | 3-step wizard with persona/experience/goal → deterministic path | **Authoritative system** |
| New `onboarding.complete` mutation | `server/onboarding.ts` | Assigns path, sets `onboardingCompleted=true`, records analytics | **Authoritative mutation** |

---

## 3. State Field Selected as Source of Truth

**Field:** `users.onboardingCompleted` (boolean, database column)

This field is:
- Set to `true` by the new `onboarding.complete` mutation after successful path assignment
- Read by the `OnboardingGuard` component via `auth.me` query (which returns the full user row)
- Never set by localStorage alone
- Checked server-side for path queries (`getMyPath`)

---

## 4. Legacy Code Removed

| File | Change |
|------|--------|
| `client/src/pages/Dashboard.tsx` | Removed `<OnboardingWizard>` JSX, removed `<PersonalizedRecommendations>` JSX, removed `showOnboarding` state, removed `completeOnboardingMutation`, removed `localDismissed` state, removed `useState` import, removed `useAnalytics` import |
| `client/src/pages/Dashboard.tsx` | Changed "Welcome back" to conditional: shows "Welcome to EASLearn" when `completedLessons === 0`, shows "Welcome back" otherwise |
| `client/src/pages/VerifyEmail.tsx` | Changed post-verification redirect from `/labs` to `/onboarding`, changed button text from "Start Learning" to "Start Your Training Path" |

---

## 5. Route-Guard Behavior

**Component:** `client/src/components/OnboardingGuard.tsx`

**Wraps:** The entire `<Router />` in `App.tsx`

**Logic:**
1. If user is not authenticated → do nothing (auth system handles)
2. If current route is excluded → do nothing
3. If user role is `admin` → do nothing (bypass)
4. If `user.onboardingCompleted === true` → do nothing (allow access)
5. If `user.emailVerified === false` → redirect to `/verify-email`
6. Otherwise → redirect to `/onboarding`

**Excluded routes (never guarded):**
- `/onboarding`, `/onboarding/start`
- `/login`, `/signup`, `/logout`, `/verify-email`, `/password-reset`
- `/terms`, `/privacy`, `/about`, `/contact`, `/pricing`, `/enterprise`
- `/team/invite/*`, `/assessment/*`, `/certificate/*`, `/verify-certificate`, `/verify/skills/*`
- `/manager`, `/manage`, `/eas-owner`, `/admin`
- `/demo`, `/`, `/free-training`, `/prototype/*`

**Redirect loop prevention:** The guard checks if the current location is already `/onboarding` or an excluded path before redirecting.

---

## 6. Email-Verification Sequence

After this fix, the sequence is:

1. Account created → signup success screen
2. User receives verification email
3. User clicks verification link → `/verify-email?token=...`
4. Verification succeeds → "Email Verified" screen with "Start Your Training Path" button
5. Button links to `/onboarding`
6. OnboardingGuard allows `/onboarding` (excluded route)
7. User completes 3-step wizard → path assigned → redirected to `/onboarding/start` or `/learn`

If the user navigates directly to `/dashboard` before verifying email, the guard redirects to `/verify-email`.

---

## 7. Existing-Account Migration Behavior

| Case | Condition | Behavior |
|------|-----------|----------|
| A | New account, `onboardingCompleted = false` | Guard redirects to `/onboarding` |
| B | Existing account, `onboardingCompleted = true` (completed new onboarding) | Guard allows access normally |
| C | Existing account, `onboardingCompleted = true` (completed via legacy wizard), has assigned path | Guard allows access — path is valid |
| D | Existing account, `onboardingCompleted = true` (completed via legacy wizard), NO assigned path | Guard allows access — user sees `RecommendedNextStep` component which shows correct first lesson based on server-side logic |
| E | Manager/admin account | Guard bypasses — admin role check returns early |

**No bulk migration needed.** Existing users who completed the old wizard have `onboardingCompleted = true` and are not forced through onboarding again. They may not have an assigned path, but the `RecommendedNextStep` component provides correct guidance.

---

## 8. Automated Tests

**File:** `server/new-learner-routing.test.ts` — 20 tests

| Test Category | Count | Status |
|---------------|-------|--------|
| Route exclusion (guarded routes redirect) | 3 | PASS |
| Route exclusion (/onboarding not self-redirecting) | 1 | PASS |
| Route exclusion (manager/admin bypass) | 1 | PASS |
| Route exclusion (auth routes) | 1 | PASS |
| Route exclusion (legal routes) | 1 | PASS |
| Route exclusion (invite routes) | 1 | PASS |
| Route exclusion (homepage) | 1 | PASS |
| Route exclusion (prototype) | 1 | PASS |
| Path assignment integrity | 2 | PASS |
| Legacy wizard removal (import check) | 1 | PASS |
| Legacy recommendations removal | 1 | PASS |
| First-login language conditional | 2 | PASS |
| Existing account migration (3 cases) | 3 | PASS |
| Email verification redirect | 1 | PASS |

**Full suite:** 658 tests pass (60 test files).

---

## 9. Desktop QA

**Browser session:** Logged in as "Mike" (existing account, `onboardingCompleted = true` from legacy wizard)

| Check | Result |
|-------|--------|
| Legacy OnboardingWizard renders | NO — removed |
| Legacy PersonalizedRecommendations renders | NO — removed |
| RecommendedNextStep shows correct first lesson | YES — "What Maintenance Technicians Actually Do" |
| Dashboard loads without errors | YES |
| Navigation works (all links) | YES |
| Full module catalog still visible (Case D user) | YES — correct for existing completed user |

**Fresh account test limitation:** Cannot create a new OAuth session in the sandbox browser. The guard logic is verified by automated tests (20 pass). A real fresh-account test requires creating a new account via the signup flow and verifying the email — recommended for the user's manual QA.

---

## 10. Mobile QA

Not performed in this session (desktop browser only). The OnboardingGuard is a logic component with no UI — it uses `window.location.href` for redirects which works identically on mobile. The `/onboarding` page was already verified as mobile-friendly in prior sprints.

---

## 11. Final Fresh-Account Journey (Expected)

After this fix, a fresh account's journey should be:

1. Visit https://easlearn.org → homepage
2. Click "Start Diagnosing Free" or "Log in" → login/signup
3. Create account → "Account Created" screen
4. Verify email → "Email Verified" screen → "Start Your Training Path" button
5. Click button → `/onboarding` (guard allows, excluded route)
6. Step 1: Select persona (Machine Operator)
7. Step 2: Select experience (None yet)
8. Step 3: Select goal (Move into maintenance)
9. Submit → `onboarding.complete` assigns `operator_to_tech` path
10. Redirect to `/onboarding/start` → "Start First Lesson" button
11. Click → `/courses/maintenance-orientation/what-maintenance-techs-do`
12. Lesson loads correctly

**If the user navigates to `/dashboard` or `/courses` before completing onboarding:**
- Guard fires → redirects to `/onboarding`
- No legacy wizard appears
- No full catalog is shown

---

## 12. Remaining Issues

| Issue | Severity | Description | Fix Effort |
|-------|----------|-------------|------------|
| "Recommended for You" still shows for Case D users | P3 | Existing users who completed the old wizard see the `RecommendedNextStep` component which shows generic recommendations. Not harmful — correct first lesson is still surfaced. | Low (could hide for users without assigned path) |
| Full catalog visible for Case D users | P3 | Existing completed users see all 33 modules. This is correct behavior — they already completed onboarding. New users will be redirected before seeing the catalog. | None needed |
| "Welcome back" for Case D users with 0 lessons | P3 | The conditional checks `completedLessons > 0` but some Case D users have `onboardingCompleted = true` with 0 lessons. They see "Welcome to EASLearn" which is acceptable. | None needed |
| Cannot verify fresh-account redirect in sandbox | Limitation | Sandbox browser has an existing OAuth session. Fresh-account test requires manual QA. | User must test manually |

---

## Final Verdict

**NEW-LEARNER ROUTING FIXED — READY FOR REAL-USER TESTING**

The OnboardingGuard is deployed, the legacy wizard is removed, the email verification flow redirects to `/onboarding`, path assignment has a fail-safe, and 658 tests pass. The remaining step is a manual fresh-account test by the user to confirm the redirect fires in production.
