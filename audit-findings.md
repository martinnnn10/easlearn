# EASLearn Production QA Audit — Findings Log

Audit started: 2026-05-17
Target: https://easlearn.org (production)

## Issues Found

<!-- Each issue gets: severity, route, description, status -->

### ISSUE-001: Claim Certification button returns 500 error
- **Severity**: P1 Major
- **Route**: /certifications
- **Reproduction**: Click "Claim Certification" on Level 1 (Apprentice) when requirements aren't met
- **Expected**: Toast/error message saying "Requirements not met" or button should be disabled
- **Actual**: 500 server error in console, no user feedback
- **Business Impact**: Users clicking the button get no feedback; silent failure undermines trust

### ISSUE-002: Homepage count inconsistencies
- **Severity**: P1 Major
- **Route**: / (homepage)
- **Description**: Three different course counts on the same page:
  - "Six comprehensive modules" (COURSE MODULES section)
  - "8+ Structured Courses" (BUILT FOR THE PLANT FLOOR section)
  - "all 18 course modules" (START TRAINING TODAY section)
- **Expected**: Consistent count matching the actual 18 modules (or 14 active + 4 expanding)
- **Actual**: Three contradictory numbers
- **Business Impact**: Destroys credibility; enterprise buyers will notice inconsistency

### ISSUE-003: "Verify a Certificate" link on /certifications goes to wrong route
- **Severity**: P2 Moderate
- **Route**: /certifications → "Verify a Certificate" button
- **Reproduction**: Click "Verify a Certificate" on the certifications page
- **Expected**: Should navigate to /certificate/verify (which exists and works)
- **Actual**: Need to verify where the link actually goes — /verify gives 404
- **Note**: /certificate/verify DOES work (shows "Certificate Not Found" for invalid codes — correct behavior)
- **Business Impact**: Employers trying to verify certificates may hit a dead end

### ISSUE-003 CONFIRMED: "Verify a Certificate" link goes to /verify (404)
- The link on /certifications navigates to /verify which is a 404
- The correct route is /certificate/verify which works properly
- Fix: Change the link href from /verify to /certificate/verify

### ISSUE-004: Roadmap page shows "3 Live Courses | 3 In Development | 4 Planned"
- **Severity**: P2 Moderate
- **Route**: /roadmap
- **Description**: Roadmap header says "3 Live Courses" but /courses shows 14 active courses. The roadmap page also references `trpc.courses.contentCounts` which is a TS error (procedure doesn't exist).
- **Expected**: Counts should match reality or be removed
- **Actual**: Hardcoded or broken count showing "3 Live Courses"
- **Related TS Error**: `Property 'contentCounts' does not exist` in Home.tsx and Roadmap.tsx

### ISSUE-005: Course detail page /courses/plc-fundamentals shows blank content
- **Severity**: P1 Critical
- **Route**: /courses/plc-fundamentals
- **Description**: The course detail page renders only skeleton loading bars and footer. No course content, lessons, or module info is displayed. The page appears to be stuck in a loading state.
- **Expected**: Full course detail with lesson list, module description, and start button
- **Actual**: Blank page with loading skeletons that never resolve

### ISSUE-005 UPDATE: Course page loads correctly on fresh navigation
- The blank page was likely a transient loading issue from navigating via the dashboard's course list
- On fresh navigation to /courses/plc-fundamentals, the page loads correctly with all 24 lessons
- Course shows: title, description, 24 lessons, ~10h total, 0 of 24 complete (0%)
- All lesson titles and estimated times display correctly
- **Downgrading to P3 — may be a race condition on first load from dashboard**

### ISSUE-006: Quiz route /quiz/electrical-fundamentals returns 404
- **Severity**: P1 Critical
- **Route**: /quiz/electrical-fundamentals
- **Description**: Navigating to a quiz URL shows the 404 page. Need to check how quizzes are routed and whether the slug is correct.

### ISSUE-006 UPDATE: Quiz route is /courses/:moduleSlug/quiz, not /quiz/:slug
- The correct quiz URL is /courses/electrical-fundamentals/quiz
- The /quiz/electrical-fundamentals URL was wrong — no such route exists
- Need to verify the correct route works

### ISSUE-006 CONTINUED: Quiz route is caught by lesson route, shows "Lesson not found"
- **Severity**: P2 High
- **Route**: /courses/electrical-fundamentals/quiz
- **Description**: The route /courses/:moduleSlug/quiz is defined in App.tsx, but it shows "Lesson not found" instead of a quiz. The route pattern /courses/:moduleSlug/:lessonSlug may be matching first, treating "quiz" as a lesson slug. Need to check route ordering in App.tsx.

### ISSUE-007: 8 TypeScript errors in watcher (contentCounts, simulatorSession, onboarding input type)
- **Severity**: P2 High
- **Files affected**: Home.tsx (contentCounts), Roadmap.tsx (contentCounts), Simulator.tsx (simulatorSession), and onboarding input type mismatch
- **Description**: The TS watcher reports 8 errors. These are real type errors that should be fixed even if tsc --noEmit exits clean (may be a config difference).

## Consolidated Fix Plan

| # | Issue | Fix |
|---|-------|-----|
| 1 | Claim Certification 500 error | The procedure logic looks correct — it should return `{success: false, message}` not 500. Need to check if the error is from the mutation call itself or a DB issue. The button is also enabled for Level 1 even though `prevEarned` is true for first level. |
| 2 | Homepage count inconsistencies | Replace "Six comprehensive modules" with "18 course modules", replace "8+ Structured Courses" with "18 Structured Courses", keep "all 18 course modules" |
| 3 | Verify Certificate link wrong route | Change href from /verify to /certificate/verify in Certifications.tsx |
| 4 | Roadmap hardcoded counts | Remove contentCounts query, use actual module data or hardcode correct counts |
| 5 | Course page blank on dashboard nav | Investigate race condition — may be transient |
| 6 | Quiz route ordering | Move quiz route BEFORE lesson route in App.tsx |
| 7 | TS errors | Fix contentCounts references, simulatorSession reference, onboarding input type |

