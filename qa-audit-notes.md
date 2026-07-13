# QA Audit Working Notes

## P0 #1 — Quizzes
- Quiz feature DOES exist: Quiz.tsx page, quiz router in routers.ts, quizQuestions + quizAttempts tables
- 100 quiz questions across 10 modules (10 each)
- Quiz page at /courses/:moduleSlug/quiz works
- Decision: Quizzes exist and work — no stripping needed. The audit was wrong about quizzes not existing.
- BUT: Need to verify the "Quizzes Passed" counter on dashboard is pulling real data, not hardcoded.

## P0 #2 — Onboarding persistence
- users table HAS onboardingCompleted field (boolean, default false)
- Server HAS getOnboardingStatus + completeOnboarding procedures
- Dashboard calls completeOnboardingMutation.mutate() on dismiss
- ISSUE: OnboardingWizard only saves to localStorage, does NOT save selections (experienceLevel, goals, equipment) to DB
- ISSUE: The wizard only shows when completedLessons === 0 AND onboardingCompleted === false, which is correct
- FIX NEEDED: Save onboarding selections to user record in DB (add columns or JSON field)

## P0 #3 — Content counts
- Need to grep for hardcoded numbers across pages
