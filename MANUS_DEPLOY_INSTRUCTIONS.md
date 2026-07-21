# MANUS DEPLOY — Hydraulic Pressure-Loss MVP + `fluid_power` domain

> # ⛔ THIS FILE SUPERSEDES ALL PREVIOUS MANUS INSTRUCTIONS
> It replaces and overrides `DEPLOYMENT_NOTES.md` and any notes under `.manus/`.
> Where they conflict, **follow this file.** The most important change from the
> previous deploy notes: **database migrations ARE required now** (the old notes
> said "migrations: No" — that no longer applies).

**What this deploys:** the Hydraulic Pressure-Loss Simulator MVP (F1 clogged filter,
F4 pump wear) at `/labs/hydraulic`, a Labs featured card + tab, and a new
`fluid_power` Assessment-Spine domain ("Hydraulic Troubleshooting") that flows into
the Manager Dashboard and Skills Passport.

**Source:** branch `claude/hydraulic-pressure-loss-mvp` (PR #1). This package is that
branch's tree with build artifacts and secrets stripped.

---

## 0. Secrets (read first)

This package contains **no** `.env`, `.env.local`, or `.project-config.json`.
Configure all secrets in **Manus only** (they are already set on the Manus project:
`DATABASE_URL`, `JWT_SECRET`, Stripe, Resend, Forge, etc.).

> Security: `.project-config.json` in the git history holds live secrets. Rotate the
> `DATABASE_URL`, AWS git-backend keys, `JWT_SECRET`, and Stripe keys, and add the
> file to `.gitignore`. Do **not** ship secrets inside a deploy package.

---

## 1. Prerequisites

| Item | Required for THIS deploy | Notes |
|---|---|---|
| `DATABASE_URL` in Manus | **Yes** (already set) | MySQL/TiDB. |
| **Migration `0037_competency_evidence.sql`** | **YES** | The Assessment-Spine evidence ledger the sim writes to. |
| **Migration `0038_rate_limit_events.sql`** | **YES** | Required by the API rate limiter. |
| Seed scripts | No | — |
| `course_modules` / lesson / quiz edits | No | The MVP adds a lab + domain, not catalog rows. |

If `0037`/`0038` are already applied on the live DB, the migrate step is a no-op.

---

## 2. Deploy steps (import → migrate → build → publish)

```bash
# In the Manus app workspace (default path /home/ubuntu/eas-platform)
cd /home/ubuntu/eas-platform

pnpm install
pnpm run check          # tsc --noEmit — must PASS

# Apply pending migrations (creates competency_evidence + rate_limit_events if absent)
pnpm run db:push        # = drizzle-kit generate && drizzle-kit migrate
                        # (or apply drizzle/0037_*.sql and drizzle/0038_*.sql manually)

pnpm run build          # vite build + esbuild server bundle — must PASS
```

Then **Publish** in Manus.

> Prefer a **preview/staging publish first**, run the post-publish checklist (§3),
> and only then promote to production.

---

## 3. Post-publish verification (the live checklist)

Full detail and expected results: **`docs/HYDRAULIC_MVP_LIVE_QA.md`**.

**A. Persistence smoke test** (server shell, with `DATABASE_URL` set):
```bash
npx tsx scripts/hydraulic-mvp-smoke.mts --user=<demoLearnerId> --persist
```
Confirm it inserts and reads back `competency_evidence` rows, and prints readiness.
Evidence types expected: `live_interaction`, `reasoned_answer`, `diagnosis_submitted`,
`simulation_completed`, `safety_action`, `ai_operator_communication`,
`ai_work_order_documentation`, `ai_shift_handoff`, `ai_reflection`.
Domains: `fluid_power` and `safety`.

**B. Browser QA:**
- `/labs` → **Hydraulic Pressure Loss Lab** featured card + flagship tab; CTA → `/labs/hydraulic`.
- `/labs/hydraulic` → run **F1 clogged filter**, **F4 pump wear**, one **unsafe action**
  (stored-energy warning fires), one **closeout**. Mobile 375px: no horizontal scroll.

**C. Manager Dashboard** (as manager): **Hydraulic Troubleshooting** row appears;
clean run → *Needs Manager Validation*; unsafe run → *Needs Safety Review*; audit
rationale visible; one run is not fake mastery.

**D. Skills Passport** (as learner): Hydraulic Troubleshooting row, recent evidence,
safety status after the unsafe path, no fake mastery.

Only after A–D pass is this MVP **pilot-ready**. Until then treat it as preview only.

---

## 4. Rollback

This deploy is additive (new lab, new domain, two idempotent migrations). To roll
back the application, re-publish the previous package. The `competency_evidence` /
`rate_limit_events` tables are harmless to leave in place if you roll back the app.

---

## 5. Verified before packaging (in CI/sandbox, no DB)

- `pnpm run check` (tsc) — PASS
- `npx vitest run` — **289 tests PASS** (incl. 22 hydraulic + the end-to-end loop test)
- `pnpm run build` (vite + esbuild) — PASS
- Local browser QA of the built client — sim flow, unsafe modal, mobile, discovery — PASS
- **NOT verifiable without a live DB:** `competency_evidence` persistence, Manager
  Dashboard, Skills Passport → that is exactly what §3 closes out on Manus.
