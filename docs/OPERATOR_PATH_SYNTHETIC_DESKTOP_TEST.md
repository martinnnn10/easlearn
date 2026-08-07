# Operator Path Synthetic Desktop Test

**Test Date:** 2026-08-05  
**Browser:** Chromium (sandbox), approximately 1440x900 viewport  
**Account:** Fresh email signup (mike.rodriguez.operator.test@gmail.com)  
**Persona:** Machine operator, no electrical experience, wants to move into maintenance  
**Test Mode:** Live production (https://easlearn.org)  
**Test Infrastructure Exception:** Email verification bypassed via database (finding recorded as P1)

---

## 1. Test Account State

- User ID: 31680001
- Name: Mike Rodriguez
- Email: mike.rodriguez.operator.test@gmail.com
- Email verified: Yes (manually, after recording the friction finding)
- Onboarding completed: Yes (via OLD dashboard wizard, NOT the new /onboarding system)
- Selections: New to the Trade / Career Advancement / General Maintenance
- Prior data: None (fresh account)

---

## 2. Browser and Viewport

- Engine: Chromium (stable, sandbox)
- Viewport: approximately 1440x900
- Device: Desktop
- Connection: Standard broadband

---

## 3. Complete Journey Log

| Step | Action | Result | Screenshot |
|------|--------|--------|------------|
| 1 | Visit https://easlearn.org | Homepage loads. Clear headline. Two CTAs visible. | easlearn_org_2026-08-06_01-44-57_9283.webp |
| 2 | Click "Log in" | Login page with email/password form and "Create New Account" link | easlearn_org_2026-08-06_01-45-39_1278.webp |
| 3 | Click "Create New Account" | Signup form with name, email, password, terms checkbox | easlearn_org_2026-08-06_01-46-08_7544.webp |
| 4 | Submit signup form | "ACCOUNT CREATED" — email verification required | easlearn_org_2026-08-06_01-46-56_3998.webp |
| 5 | Login after verification | Dashboard loads with onboarding banner + full content | easlearn_org_2026-08-06_02-04-13_3712.webp |
| 6 | Click "Get Started" | OLD wizard Step 1: Experience Level (3 options) | easlearn_org_2026-08-06_02-04-48_5148.webp |
| 7 | Select "New to the Trade" | OLD wizard Step 2: Goals (4 options) | easlearn_org_2026-08-06_02-05-17_4549.webp |
| 8 | Select "Career Advancement" + Continue | OLD wizard Step 3: Equipment (6 options) | easlearn_org_2026-08-06_02-05-54_3036.webp |
| 9 | Select "General Maintenance" + See Recommendations | WRONG recommendations: Precision Alignment, Preventative Maintenance, Electrical Fundamentals, Safety Systems | easlearn_org_2026-08-06_02-06-33_7005.webp |
| 10 | Dismiss wizard | "Recommended Next Steps" shows correct first lesson (Industrial Maintenance Orientation) | easlearn_org_2026-08-06_02-07-22_4400.webp |
| 11 | Click "Start now" on Recommended Next Steps | First lesson loads correctly: "What Maintenance Technicians Actually Do" | easlearn_org_2026-08-06_02-08-09_3680.webp |

---

## 4. Onboarding Findings

### P0: New Onboarding System Not Triggered

The `/onboarding` page (3-step wizard with persona/experience/goal that assigns the operator_to_tech path) is **never triggered** for fresh accounts created via email signup. Instead, the OLD dashboard-embedded wizard runs. This means:

- The operator_to_tech path is never assigned
- The correct 8-module sequence (Orientation → Safety → Electrical → Meter → Print Reading → Motors → Guided Troubleshooting → PLC) is never activated
- The learner receives generic recommendations instead of a structured path
- The "Continue Your Path" resume system has no assigned path to track

**Root cause hypothesis:** The new onboarding system was built to trigger at `/onboarding` but no routing logic redirects fresh accounts there. The email signup flow sends users to `/dashboard` where the old `OnboardingWizard` component detects `onboardingCompleted === false` and shows itself.

**Required fix:** After login, if `onboardingCompleted === false`, redirect to `/onboarding` instead of `/dashboard`. Or replace the old dashboard wizard with the new system.

### P1: Wrong Recommendations for Complete Beginners

The old wizard recommends Precision Alignment and Preventative Maintenance to a user who selected "New to the Trade" + "Career Advancement" + "General Maintenance." These are intermediate/advanced topics. A complete beginner needs Orientation → Safety → Electrical Fundamentals → Meter Usage.

### P1: No "Move Into Maintenance" Goal Option

The old wizard's goal options (Earn Certifications, Better Troubleshooting, Career Advancement, Safety & Compliance) do not include the exact target persona: "Move from operations into maintenance." The closest match is "Career Advancement" which is too generic.

---

## 5. Navigation Findings

| Nav Item | Purpose Obvious? | Clear Primary Action? | Beginner Understands? | Competes with Path? |
|----------|-----------------|----------------------|----------------------|-------------------|
| Home | Partially — goes to /learn, not dashboard | No — shows all courses | No — overwhelming | Yes |
| My Path | Unclear — goes to /become-a-tech | Somewhat — shows stages | No — uses "pathway" jargon | No |
| Practice | Clear — goes to /labs | Yes — shows simulators | Partially — "labs" is jargon | Yes |
| Skills Passport | Unclear to beginners | No — empty for new users | No — "passport" is jargon | No |
| Explore | Clear — goes to /courses | Yes — browse courses | Yes | Yes |

**Key finding:** Multiple nav items compete with the assigned path. A beginner who clicks "Practice" or "Explore" will leave their structured path with no clear way back.

---

## 6. Knowledge-Check Findings

The first lesson ("What Maintenance Technicians Actually Do") contains a knowledge check in the lesson content markdown, but it renders as **static text** with the correct answer visible ("*Correct answer: B*"). The interactive `LessonAssessmentPanel` with blocking/remediation behavior was NOT observed on this lesson.

**Hypothesis:** The KC questions seeded in the hardening sprint are for Basic Meter Usage lessons only. The orientation lessons may not have KC questions in the `lesson_assessment_questions` table, so the panel doesn't render.

**Impact:** The orientation module can be completed without demonstrating understanding. This is acceptable for orientation (low-stakes content) but would be a problem if it occurs on safety-critical meter lessons.

---

## 7. Meter-Exercise Findings

Not tested in this session (would require completing orientation and safety modules first to reach Basic Meter Usage). The exercises exist in the codebase and render on the lesson pages based on the `moduleSlug === 'basic-meter-usage'` condition.

---

## 8. Guided-Scenario Findings

Not tested in this session (requires completing prior modules). The guided troubleshooting lesson exists at `/courses/guided-beginner-troubleshooting/guided-overload-trip`.

---

## 9. Resume-State Findings

Not tested (requires completing at least one lesson and logging out/in). The "Continue Learning" and "Recommended Next Steps" cards on the dashboard do correctly identify the first lesson, suggesting the resume system works for the default state.

---

## 10. Terminology Findings

| Term | Where Used | Explained at First Use? | Beginner Would Understand? |
|------|-----------|------------------------|---------------------------|
| PLC | Homepage, lessons, nav | No (homepage) / Yes (lesson 1 table) | No at first encounter |
| VFD | Nav ("VFD Hub") | No | No |
| I/O | Labs page | No | No |
| LOTO | Safety Systems description | No | No |
| Competency | Dashboard cards, nav | No | No |
| Skills Passport | Nav item | No | No |
| Methodology | Dashboard "My Methodology" | No | No |
| Readiness | Manager dashboard | No | No |

**Key finding:** The homepage and navigation use unexplained technical terms. The lesson content itself does a much better job of explaining terms (e.g., lesson 1 explains "PLCs (Programmable Logic Controllers)"). The problem is the navigation layer, not the content layer.

---

## 11. P0/P1/P2/P3 Issue Table

| ID | Severity | Route/Page | Step | Visible Behavior | Expected Behavior | Why Beginner Struggles | Recommended Fix | Blocks Real Test? |
|----|----------|-----------|------|-----------------|-------------------|----------------------|-----------------|-------------------|
| 1 | **P0** | /dashboard | 5-9 | OLD onboarding wizard runs | NEW /onboarding system should trigger | Wrong path assigned, wrong recommendations | Redirect fresh accounts to /onboarding before showing dashboard | **YES** |
| 2 | P1 | /dashboard | 9 | Precision Alignment recommended | Industrial Maintenance Orientation should be first | "This platform doesn't understand me" — trust destroyed | Fix by triggering new onboarding OR fix old wizard's recommendation algorithm | YES |
| 3 | P1 | /signup | 4 | Email verification required before any access | Allow browsing limited content immediately | Operator on plant floor may not have email access | Consider delayed verification or immediate limited access | Partially |
| 4 | P1 | /dashboard | 5 | "Welcome back" on first login | "Welcome" (no "back") | System appears confused about whether user is new | Change copy to "Welcome" when no prior activity exists | No |
| 5 | P1 | /dashboard | 5 | ALL 33 modules visible before onboarding | Only assigned path visible until onboarding complete | Paralysis of choice — beginner has no idea where to start | Hide full module list for users who haven't completed onboarding | No |
| 6 | P2 | /signup | 3 | "7-day free trial" subtitle | Match homepage promise ("Operators start free") | Trust conflict — will I be charged? | Remove "7-day free trial" or clarify what's free vs paid | No |
| 7 | P2 | /dashboard | 5 | 8 quick-link cards with jargon | Simplified cards for new users | "Fault of the Day", "Competency", "Weak Spots" are meaningless | Show only relevant cards based on onboarding state | No |
| 8 | P2 | /dashboard | 5 | "Manager Hub" card visible to non-manager | Only show to users with manager role | Confusing — "I'm not a manager, why is this here?" | Conditionally render based on role | No |
| 9 | P2 | /dashboard | 9 | Wizard recommendations contradict dashboard "Continue Learning" | Single consistent recommendation | Two competing suggestions confuse the learner | Remove old wizard or make it consistent with assigned path | No |
| 10 | P2 | /dashboard | 8 | Equipment question assumes maintenance experience | Offer "I don't know yet" option | Operator doesn't know what equipment they'll work with | Add "Not sure yet" option that defaults to general path | No |
| 11 | P3 | / | 1 | Two "Start Diagnosing Free" buttons above fold | Single clear CTA per section | Minor confusion about which to click | Differentiate visually or consolidate | No |
| 12 | P3 | / | 1 | "Manufacturing Competency Intelligence" subtitle | Plain language | Corporate jargon | Remove or simplify | No |
| 13 | P3 | /dashboard | 5 | "0 / 202 lessons" counter | Hide or show only assigned path count | Intimidating number for a beginner | Show assigned path lesson count only | No |

---

## 12. Concepts Supported by the Experience

| Concept | Verdict | Evidence |
|---------|---------|----------|
| What a maintenance technician does | SUPPORTED | Lesson 1 clearly explains with relatable examples and role comparison table |
| Why method matters more than speed | SUPPORTED | "The difference is not intelligence. It is method." + knowledge check |
| The 5 areas of industrial maintenance | SUPPORTED | Clear table with concrete examples |
| Operator vs. Technician vs. Controls vs. Leader | SUPPORTED | Role comparison table with primary responsibilities |

---

## 13. Concepts Only Partially Supported

| Concept | Verdict | Gap |
|---------|---------|-----|
| Where to start learning | PARTIALLY SUPPORTED | Dashboard shows correct first lesson but wizard gives wrong recommendations — conflicting signals |
| What the full path looks like | PARTIALLY SUPPORTED | "My Path" nav goes to /become-a-tech which shows stages, but it's not connected to the assigned path |
| How progress is tracked | PARTIALLY SUPPORTED | Progress stats visible (0%) but no clear "you are here" indicator in the path |

---

## 14. Concepts Not Supported (in this session)

| Concept | Verdict | Reason |
|---------|---------|--------|
| Safety before troubleshooting | NOT TESTED | Did not reach Safety Systems module |
| Meter usage and safety gates | NOT TESTED | Did not reach Basic Meter Usage module |
| Guided troubleshooting method | NOT TESTED | Did not reach Guided Beginner Troubleshooting |

---

## 15. Exact Fixes Required Before a Human Test

### Must Fix (P0 — blocks the test)

1. **Route fresh accounts to /onboarding instead of /dashboard.** When `onboardingCompleted === false` and the user logs in, redirect to `/onboarding`. This triggers the new 3-step wizard (persona/experience/goal) which assigns the correct operator_to_tech path.

### Should Fix (P1 — will cause repeated confusion)

2. **Remove or hide the old dashboard OnboardingWizard.** It conflicts with the new system and gives wrong recommendations.
3. **Hide the full 33-module list for users who haven't completed onboarding.** Show only the assigned path modules.
4. **Change "Welcome back" to "Welcome" for first-time users.**
5. **Consider allowing immediate limited access before email verification** (at minimum, let them browse the homepage and course descriptions).

### Nice to Fix (P2 — reduces friction)

6. Remove "7-day free trial" from signup page or clarify what's free.
7. Hide "Manager Hub" card for non-managers.
8. Add "I don't know yet" option to equipment question (if old wizard is kept).

---

## 16. What Still Requires Actual Human Validation

Even after fixing the P0/P1 issues above, a real human test is still needed to validate:

1. Whether the lesson language resonates with an actual plant-floor operator (not just technically correct)
2. Whether the knowledge check remediation actually teaches the concept or just frustrates
3. Whether the meter exercises feel realistic or feel like a toy
4. Whether the guided troubleshooting scenario feels like real work or feels scripted
5. Whether the 6-field documentation exercise is understandable without prior training
6. Whether the operator can navigate back to their path after exploring other pages
7. Whether the mobile experience works on an actual phone (plant-floor use case)
8. Whether the resume behavior is trustworthy (does the operator believe their progress is saved?)
9. Whether the overall tone feels respectful or condescending to someone who works with their hands

---

## 17. Final Verdict

### REVISE — SYNTHETIC TEST FOUND SPECIFIC P0/P1 ISSUES

The core beginner journey **can** be completed (the correct first lesson loads, content quality is excellent, the lesson structure is clear), but the **routing to the new onboarding system is broken**. A fresh account goes through the old wizard which gives wrong recommendations and does not assign the structured operator path.

**The content is ready. The routing is not.**

Fix #1 (redirect to /onboarding) unblocks the entire operator path. Without it, a real operator will receive Precision Alignment as their first recommendation and immediately lose trust in the platform.

**Estimated fix effort:** 1-2 hours (add redirect logic in the authenticated route handler or the dashboard page component).

**After the fix:** Re-run this synthetic test to confirm the new onboarding triggers, assigns the correct path, and launches Industrial Maintenance Orientation as the first lesson. Then proceed to real-user testing.
