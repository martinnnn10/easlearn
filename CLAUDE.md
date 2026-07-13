# EASLearn — repository guidance

EASLearn is a **digital apprenticeship engine**, not a lesson platform or LMS. It turns machine operators into maintenance technicians and helps manufacturers reduce downtime by building verified workforce competency. The learner should feel like they are standing beside the best maintenance technician in the plant. The goal is not correct answers — it is **independent maintenance judgment**.

## The Learning Engine is the source of truth for how we teach

**All future EASLearn lessons, simulations, assessments, and AI-mentor interactions must conform to [`docs/LEARNING_ENGINE.md`](docs/LEARNING_ENGINE.md).**

Before building or changing any lesson, mission, simulation, assessment, competency signal, or mentor interaction:

1. Read `docs/LEARNING_ENGINE.md` (the educational operating system) and consult the machine-readable mechanic registry in [`shared/learningEngine.ts`](shared/learningEngine.ts).
2. Compose from the documented mechanics; reference them by their `LearningMechanicId`.
3. Meet the conformance checklist (ask before tell · commit before hint · reason before verdict · productive failure · do-don't-read · climb the demonstrate→guide→release ladder · hard safety gate · reflect and internalize · emit competency signals · feed retention).
4. If you introduce a new mechanic, document it in `docs/LEARNING_ENGINE.md` **and** add it to `shared/learningEngine.ts` in the same change.

Engagement is not the objective; judgment is. A lesson that is entertaining but violates the engine is rejected.

## Verification (run before declaring work done)

- Typecheck: `npx tsc --noEmit`
- Tests: `npx vitest run <files>` (server/* integration tests need a live DB + secrets; content/shared tests do not)
- Build: `npx vite build && npx esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
