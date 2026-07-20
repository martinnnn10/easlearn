# Paid-Pilot vs Enterprise Plumbing Plan

**Status: DESIGN — scoping only.**
**Principle:** build the *minimum* plumbing that lets a maintenance leader run a paid pilot and see readiness. Do **not** build enterprise plumbing before a paying pilot asks for it. Every row below is gated to the revenue stage that actually needs it.

Companion: [`VECTOR_COMPETITIVE_POSITIONING.md`](./VECTOR_COMPETITIVE_POSITIONING.md), [`HYDRAULIC_SIM_DESIGN_SPEC.md`](./HYDRAULIC_SIM_DESIGN_SPEC.md).

The wedge only converts to revenue if a manager can **assign** the hydraulic lab, **watch** who becomes ready, and **export** the proof. That — and nothing heavier — is the paid-pilot bar.

---

## What already exists (do not rebuild)

The Assessment Spine already produces the hard part — per-learner, per-domain **readiness** with an audit trail, plus Skills Passport / competency signals and certificate records. The plumbing gap is not *evidence*; it's the **admin shell** around it (assign, view, export, permission, separate pilot data).

---

## Tier 1 — Paid-pilot must-haves

*Ship these before charging for a pilot. Nothing here is enterprise-grade; it's "a manager can run a 30–60 day pilot and trust the result."*

| Capability | What "done" means for a pilot | Effort | Notes |
|---|---|---|---|
| **Assign lesson/lab to learner** | A manager assigns the hydraulic lab (or a track) to named techs / a crew; learners see it queued. | M | The entry point of the whole motion. Reuses the ILU lesson→sim→assess links. |
| **Manager readiness/completion view** | A roster: per tech, per domain — readiness level + completion + last activity, from `deriveReadiness`. | M | This *is* the product's ROI surface; keep it read-only and simple. |
| **PDF / CSV report export** | One click: a readiness report (roster + per-tech evidence summary) as PDF and CSV. | M | Reuse existing print/export paths (weakspots-print, print packages). Leaders live in email + spreadsheets. |
| **Evidence audit trail** | Per readiness call, the "why": the evidence events and the safety/communication flags behind it, exportable. | S | Spine already carries the rationale; surface + export it. |
| **Team / role permissions (basic)** | Three roles — admin, manager, learner. Managers see only their team; learners see only themselves. | M | Enough to keep a pilot's data sane; not full RBAC. |
| **Demo/pilot data separation** | Pilot cohorts isolated from demo/marketing data and from each other (per-org/per-cohort scoping). | M | Non-negotiable for trust; a pilot must never see another account's people. |

**Tier-1 verdict:** assign → practice → readiness view → export, gated by basic roles, isolated per cohort. Target this as the plumbing half of the 90-day plan, in parallel with the hydraulic MVP. Estimate: **~2–3 weeks** alongside the sim, mostly UI + scoping over existing evidence.

---

## Tier 2 — Enterprise rollout (build only when a paying customer requires it)

*Do not pre-build. Each unlocks a specific enterprise gate; add it when a real deal is blocked on it.*

| Capability | Unlocks | Effort | Trigger to build |
|---|---|---|---|
| **SSO (SAML / OIDC)** | Enterprise IT sign-off | L | First customer whose security team requires it (most will). |
| **SCORM / xAPI export** | "Keep your LMS, prove competency with us" — push results into their Vector/LMS | L | **Strategic wedge** — build when a customer wants results in their system of record. Highest-leverage Tier 2 item. |
| **LMS integration (roster/grade passback)** | Deeper LMS interop beyond SCORM | L–XL | Named LMS in the contract. |
| **Procurement / security docs (SOC 2 path, DPA)** | Security review, legal | L | Enterprise procurement kicks off. |
| **Advanced reporting (trends, cohort analytics, benchmarks)** | Program-level buyers | M–L | Multi-cohort customer asking "is it working across sites?" |
| **Multi-site hierarchy** | Plant → area → crew rollups across facilities | M | Second site added. |
| **SCIM / provisioning + deprovisioning** | Scale user lifecycle | M | Hundreds of users to manage. |
| **Billing / admin controls (seats, POs, invoicing)** | Enterprise buying motion | M | Moving from pilot invoice to seat-based contract. |

**Tier-2 verdict:** SSO and SCORM/xAPI are the two that will come up first and matter most (SSO to get in the door, SCORM/xAPI as the integration wedge). Everything else is demand-driven — resist building it on spec.

---

## What NOT to build yet (explicit)

- **No SSO, SCORM/xAPI, or SOC 2 work before a pilot is signed** — these are Tier 2 by definition.
- **No advanced analytics / benchmarking** until a customer has enough cohorts to want it.
- **No multi-site hierarchy** for a single-site pilot.
- **No billing platform** — invoice the first pilots manually.
- **No net-new evidence/scoring** — the spine is done; only surface it.

---

## Sequencing against the 90-day plan

- **Days 0–30:** Tier-1 core — **assign + readiness view + PDF/CSV export**, over the existing evidence, alongside the hydraulic MVP. This makes the pilot *chargeable*.
- **Days 31–60:** finish Tier-1 — **roles + cohort isolation + audit-trail export**; harden the manager view.
- **Days 61–90:** **only if a paid pilot is in hand and asks** — start the first Tier-2 item (usually SSO), and scope SCORM/xAPI as the integration wedge.

The rule holds: **plumbing follows the sale, not the roadmap deck.**
