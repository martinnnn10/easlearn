# EASLearn — App-Only Deploy (Programs Loading UX)

**Package type:** Application deploy only — import into Manus and publish.

## What changed

- `client/src/pages/Programs.tsx` — loading skeleton cards + error/retry while `courses.listModules` resolves
- `client/src/config/programsSemesters.ts` — semester placement by module `slug` (unchanged)
- `client/src/config/programsPresentation.ts` — icons, colors, topics (unchanged)

## Programs behavior

- Renders **all published modules** from `courses.listModules` (31 modules today)
- While the catalog query is in flight: skeleton cards + stats show `…` (not empty grid or `—`)
- On fetch failure: error banner with **Retry** button
- Semester tabs and Program Progression unchanged

## What is NOT required for this deploy

| Item | Required? |
|------|-----------|
| Database migrations | **No** |
| Seed scripts | **No** |
| `DATABASE_URL` changes | **No** |
| `course_modules` edits | **No** |
| Lesson / quiz / scenario changes | **No** |

## Manus deploy steps

```bash
cd /home/ubuntu/eas-platform
pnpm install
pnpm run check
pnpm run build
```

Then **Publish** in Manus.

## Post-publish smoke test

| Check | Expected |
|-------|----------|
| `/programs` (brief load) | Skeleton cards, then real modules |
| `/programs` hero | **31 Published Modules**, live lesson count |
| Semester counts | **8 / 8 / 8 / 7** module cards |
| `/courses` | Still **31** published modules |
| Simulate offline | Error banner + Retry (optional manual test) |

## Verification before upload

- `pnpm run check` — PASS
- `pnpm run build` — PASS

## Secrets

This package contains **no** `.env`, `.env.local`, or `DATABASE_URL`. Configure secrets in Manus only.
