# Accreditation & Standards Strategy

> **Read this before spending a dollar chasing logos.** The six bodies you named
> do fundamentally different things. Treating them as one "approval" is the fastest
> way to waste a year. Below is what each actually does, whether it applies to
> EASLearn, and the realistic path — ranked by ROI.

## TL;DR — what's real

| Body | Accredits...? | Applies to EASLearn? | Verdict | Realistic timeline |
|---|---|---|---|---|
| **IACET** | Training providers → award **CEUs** (ANSI/IACET 1-2018) | ✅ **Directly** | **PURSUE FIRST** | 6–12 mo |
| **ANSI (ANAB)** | Certification bodies (ISO/IEC **17024**) & certificate programs (ASTM **E2659**) | ✅ Our *cert program* | **PURSUE 2ND** | 12–18 mo |
| **OSHA** | Does **not** accredit courses; only **Outreach** authorizes 10/30-hr trainers via OTI | ⚠️ Partial | Align now; Outreach later | Align: now · Outreach: 6–12 mo |
| **NEMA** | Publishes standards; **does not accredit training** | ⚠️ Alignment only | Align + seek content partnership | Align: now |
| **ICEA** | Publishes cable standards; **does not accredit training** | ⚠️ Alignment only | Align cable content | Align: now |
| **ABET** | Accredits **degree programs at institutions**, not vendors | ❌ Not directly | Partner with an ABET school | Via partner |

## Body-by-body

### IACET — pursue first (best fit, real currency)
IACET accredits *providers* to issue **CEUs** under ANSI/IACET 1-2018. A CEU (1 CEU = 10 contact hours of *assessed* instruction) is a recognized continuing-education currency employers and licensing boards accept. This is the single most achievable, most monetizable accreditation for a platform like this.
- **Requirements (and our status):** documented learning outcomes per course ✅ (`whatYoullLearn`, curriculum architecture); assessment tied to outcomes ✅ (lesson assessments, methodology scoring, open-response grading); qualified instructional design + SME review ✅ (expert-authored; now also the Authoring Studio review workflow); learner records retained ≥7 yrs ✅ (DB attempts + the new CEU transcript); CEU calculation method ✅ (`shared/standardsAlignment.ts`).
- **Gap to close:** formal IACET application, a written instructional-design process document, and an internal CEU-issuance policy. Engineering is largely done; this is documentation + process.

### ANSI / ANAB — pursue second (makes the certification credible)
ANSI's accreditation arm (ANAB) accredits **personnel certification programs to ISO/IEC 17024** and **certificate programs to ASTM E2659**. This is what turns "Master Diagnostician" from a badge into a credential a court/employer respects.
- **Best target:** ASTM E2659 (certificate accreditation) first — lower bar than 17024 and fits the current model; graduate to ISO 17024 when you run proctored, independent-of-training certification.
- **Requirements:** job/task analysis (defensible link between assessment and real work — your `faultCompetencyUnits` + methodology dimensions are exactly this), psychometric defensibility, separation of training from certification, impartiality governance.
- **Gap:** a documented job-task analysis, proctoring for the top tier, and a governance/appeals structure.

### OSHA — align now, Outreach optionally
OSHA **does not approve or endorse** training courses. The only "OSHA card" is the **Outreach Training Program** (OSHA 10/30-hour), delivered by trainers authorized through an **OTI Education Center** — online Outreach has strict rules.
- **Do now:** content alignment to 29 CFR 1910.147 (LOTO), .332/.333 (electrical work practices), .269; plus NFPA 70E (arc flash, referenced by OSHA). Already strong — see `SAFETY_COVERAGE_AUDIT_REPORT.md` and the new standards registry.
- **Later:** have a staff member become an authorized Outreach trainer to issue OSHA 10/30 cards alongside your own credential.

### NEMA & ICEA — alignment, not accreditation
Trade-association standards bodies. They license/sell standards and may do content partnerships; they do **not** accredit training. Goal: cite and align (NEMA ICS 2 control, MG-1 motors, 250 enclosures; ICEA cable specs) so your content is demonstrably standards-correct, and pursue a marketing content partnership if useful.

### ABET — only via an institutional partner
ABET accredits **degree programs** (engineering technology, etc.) at colleges. A vendor cannot be "ABET accredited." The play: partner with an ABET-accredited program so EASLearn is used *inside* their accredited curriculum, and align content to ABET Criterion 3 student outcomes.

## What the codebase now provides toward this

- **`shared/standardsAlignment.ts`** — machine-readable crosswalk: content domains → specific OSHA / NFPA / NEMA / ICEA / ANSI clauses, plus the ANSI/IACET CEU math (1 CEU = 600 min).
- **`accreditation.myTranscript`** — per-learner **CEU / contact-hour transcript** with standards alignment (the "competency transcript"), surfaced on the Skills Passport. This is the retained learner record IACET/ANAB reviews require.
- **`accreditation.standardsCoverage`** (admin) — a clause-by-clause **compliance matrix** showing which modules cover each standard: the exact artifact an accreditor or a corporate EHS buyer asks for.
- Honest UI disclaimer: the passport states alignment ≠ endorsement and that CEU issuance is pending IACET accreditation — do not display CEUs as accredited until the IACET grant lands.

## Recommended sequence
1. **Now:** finalize standards alignment + the coverage matrix (done in code); write the instructional-design process doc.
2. **Q1–Q2:** IACET application → CEU authority.
3. **Q2–Q4:** ASTM E2659 certificate accreditation via ANAB; stand up proctoring.
4. **Parallel:** OSHA-alignment marketing; one Outreach-authorized trainer on staff.
5. **Year 2:** ISO/IEC 17024 for the flagship certification; ABET-program partnership.

> Compliance/legal note: until each grant is issued, market as "aligned to" the
> standards, never "approved/accredited by." Misrepresenting accreditation is itself
> a liability and a fast way to lose enterprise trust.
