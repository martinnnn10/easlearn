# CURSOR HANDOFF: EASLearn World-Class Conversion

**Date:** June 16, 2026
**Purpose:** Detailed instructions for Cursor to execute the full EASLearn quality prompt against the current codebase.

---

## CURRENT STATE SUMMARY

| Metric | Value |
|--------|-------|
| Total published modules | 31 |
| Total published lessons | 193 |
| Lessons with card deck files | 31 |
| Lessons marked `contentFormat: "cards"` in DB | 20 |
| Lessons still rendering as legacy markdown | 173 |
| Curated assessment lessons (full pedagogy) | 56 |
| Diagram variants available | 14 |
| KC cards per lesson | 2 (at positions 3 and 9-11) |
| Card 1 = failure scenario (all 31 decks) | YES |
| `expertMcq` usage (full wrong-answer pedagogy) | 340 questions across 56 lessons |

---

## WHAT IS ALREADY DONE (DO NOT REDO)

These items from the prompt are **already complete** in production:

1. **Card 1 = real failure scenario** — All 31 existing deck files open with a real brand, real equipment, real failure heading. Verified via grep.

2. **Interaction within 3 cards** — All 31 decks have KC at card position 3 (first interaction). Second KC at position 9-11.

3. **Summary card is final card** — All 31 decks end with `kind: "summary"`.

4. **2 KC cards per lesson** — All 31 decks have exactly 2 interaction cards pulling from curated assessments.

5. **Diagram on every lesson** — All 31 decks have at least 1 SVG diagram variant. Some have 2-3.

6. **Full wrong-answer pedagogy** — All 56 curated lessons use `expertMcq()` which generates: "Correct: [explanation]" + "If you chose [option]: [why wrong]" for every distractor.

7. **Card player infrastructure** — Swipe navigation, progress bar, card counter, KC blocking, summary card CTA, completion gating (summaryReached + assessmentsPassed).

8. **contentFormat DB column** — Migration 0029 applied, 20 lessons marked as `cards`.

---

## WHAT CURSOR NEEDS TO DO

### STEP 1: AUDIT & FIX EXISTING 31 CARD LESSONS

The 31 deck files exist but need content quality review against the prompt's 6 audit checks.

#### 1A. Card 1 Kind Label (Cosmetic Fix)

**Current:** All Card 1 entries use `kind: "concept"` even though they contain failure scenarios.
**Prompt requires:** Card 1 should be identifiable as a scenario opener.
**Action:** This is a **non-issue** — the `LessonCardKind` type only supports `"concept" | "example" | "interaction" | "summary"`. There is no `"scenario"` kind. The content IS a failure scenario; the kind label is correct as `"concept"`. **No change needed.**

#### 1B. Card 1 Body Quality Audit

**Current:** All 31 Card 1 bodies follow the format: "[Brand] [equipment] [failure]. Tech [action]. Root cause: [topic]. After this lesson [outcome]."
**Prompt requires:** Max 4 sentences. Real brand names. No academic language. No passive voice. No learning objectives.
**Action:** Cursor must read each Card 1 body and verify:
- [ ] Real brand name present (Allen-Bradley, PowerFlex, ControlLogix, etc.)
- [ ] Real failure with consequence
- [ ] No passive voice ("was observed" → "showed")
- [ ] No learning objectives ("In this lesson you will learn..." → DELETE)
- [ ] Max 4 sentences

**Files:** `shared/lessonDecks/*.ts` — check the first card's `body` field in each file.

**Likely issues:** Some Card 1 bodies may be slightly generic. Rewrite any that say "a PLC" instead of "a ControlLogix 5580" or "a drive" instead of "a PowerFlex 525".

#### 1C. Summary Card Tone Audit

**Current:** Summary cards exist on all 31 lessons.
**Prompt requires:** 3-5 takeaways written as "You will now do X differently on the floor." NOT "You learned about X."
**Action:** Cursor must grep all summary card bodies for:
- Phrases like "you learned", "this lesson covered", "we discussed" → REWRITE
- Replace with action-oriented: "Before changing any timer preset, verify the backup date matches the last production run."

**Command to find violations:**
```bash
cd shared/lessonDecks
grep -l "you learned\|this lesson covered\|we discussed\|you now understand\|key concepts" *.ts
```

#### 1D. Diagram Quality Verification

**Current:** 14 diagram variants exist. Each lesson uses 1-3.
**Prompt requires per subject:**
- PLC: I/O wiring OR ladder rung → ✅ Have: `io-terminal`, `ladder-seal-in`, `scan-cycle`, `ethernet-ip-topology`
- VFD: VFD block diagram OR fault table → ✅ Have: `vfd-stages`, `powerflex-fault-table`
- Motor: control circuit OR nameplate → ✅ Have: `motor-starter-chain`
- Sensor: NPN/PNP OR 4-20mA loop → ✅ Have: `npn-pnp-wiring`, `photoeye-loop`
- Safety: E-stop loop OR safety relay → ✅ Have: `nc-chain`, `loto-steps`
- Print Reading: ladder rung OR wire numbering OR P&ID → ⚠️ Only has: `ladder-seal-in` (shared from PLC)

**Action needed:**
- [ ] Add `wire-numbering-convention` diagram variant for print-reading lessons
- [ ] Add `pid-symbol-table` diagram variant for pid-symbols lesson
- [ ] Verify each diagram renders at 375px without overflow (check `DIAGRAM_STANDARD.md`)

**New diagram variants to create in `LessonCardVisual.tsx`:**
1. `wire-numbering-convention` — Wire number format, terminal strip labeling
2. `pid-symbol-table` — P&ID symbols (valve, transmitter, controller) in SVG table format

#### 1E. Wrong-Answer Pedagogy Verification

**Current:** All 56 curated lessons use `expertMcq()` which generates structured explanations.
**Prompt requires:** WHY-PICK, WHY-WRONG, EVIDENCE, CORRECT-REASONING per distractor.
**Current format:** `expertMcq` produces: "Correct: [note]" + "If you chose [option]: [explanation]"
**Gap:** The current format combines WHY-PICK and WHY-WRONG into one sentence per distractor. It does NOT have a separate EVIDENCE field (what meter/HMI/fault log would show).

**Action:** For each of the 56 curated lessons, Cursor must review the `wrongNotes` array in each `expertMcq()` call and ensure each note answers:
1. Why a real tech would pick this (WHY-PICK)
2. Why it's wrong in this specific scenario (WHY-WRONG)
3. What evidence would disprove it (EVIDENCE)

**This is the largest content task.** 56 lessons × ~6 questions each × 3 distractors = ~1,008 wrong-answer explanations to review.

**Files:** `shared/curatedLessonAssessmentsBatch1.ts`, `Batch2.ts`, `Batch3.ts`, `ILU7.ts`

#### 1F. Mobile 375px Verification

**Current:** No automated mobile QA exists.
**Action:** Cursor must create a verification script:

```bash
# File: scripts/verify-mobile-375.mjs
# Uses Playwright/Puppeteer headless at 375px viewport
# For each of the 31 card lessons:
# 1. Navigate to /courses/{module}/{lesson}
# 2. Set viewport to 375x667
# 3. Check: no horizontal overflow (scrollWidth <= clientWidth)
# 4. Check: all text >= 14px (getComputedStyle)
# 5. Check: all interactive elements >= 44px tap target
# 6. Screenshot each lesson
```

**Note:** The card player already uses responsive Tailwind classes. Issues are unlikely but must be verified.

---

### STEP 2: CONVERT REMAINING 173 LEGACY LESSONS TO CARD FORMAT

This is the **massive content task**. The prompt only lists 25 lessons to convert (Groups 1-6), but the platform has 173 legacy lessons across 31 modules. The prompt's 25 are a subset — the ones with deck files already created but not yet matching DB slugs.

#### 2A. The 11 Lessons With Deck Files But Wrong DB Slugs

These 11 lessons have deck files ready but the DB lesson slugs don't match:

| Deck File Slug | Actual DB Slug | Module |
|---|---|---|
| `sensors-instrumentation/sensor-types-overview` | `sensors-instrumentation/proximity-sensors-photoeyes` | Sensors |
| `sensors-instrumentation/proximity-photoelectric` | `sensors-instrumentation/analog-signals-4-20ma` | Sensors |
| `sensors-instrumentation/temperature-pressure` | `sensors-instrumentation/temperature-rtd-thermocouple` | Sensors |
| `sensors-instrumentation/calibration-basics` | `sensors-instrumentation/level-flow-measurement` | Sensors |
| `sensors-instrumentation/loop-checkout` | `sensors-instrumentation/signal-conditioning-isolation` | Sensors |
| `safety-systems/risk-assessment` | `safety-systems/machine-safety-fundamentals` | Safety |
| `safety-systems/estop-circuits` | `safety-systems/safety-devices-wiring` | Safety |
| `safety-systems/guarding-lockout` | `safety-systems/safety-plc-programming` | Safety |
| `print-reading/ladder-diagram-conventions` | `print-reading/electrical-schematic-basics` | Print Reading |
| `print-reading/wiring-diagrams` | `print-reading/panel-layout-wire-tracing` | Print Reading |
| `print-reading/pid-symbols` | `print-reading/three-phase-power-prints` | Print Reading |

**Decision needed from user:** Either:
- **Option A:** Rename the deck files to match existing DB slugs (rename `sensor-types-overview.ts` → `proximity-sensors-photoeyes.ts` and update content to match that lesson's topic)
- **Option B:** Rename the DB lesson slugs to match the deck files (requires DB UPDATE + URL redirects)
- **Option C:** Create new DB lessons with the deck file slugs (adds 11 new lessons to those modules)

**Recommended:** Option A — rename deck files and adapt content. The DB slugs represent what's actually taught; the deck content should match.

#### 2B. The Remaining 162 Legacy Lessons (No Deck Files)

These modules have ZERO card lessons and need full conversion:

| Module | Lessons | Status |
|--------|---------|--------|
| alignment | 5 | All legacy |
| calibration-troubleshooting | 5 | All legacy |
| digital-fundamentals | 6 | All legacy |
| drives-servo-communication | 6 | All legacy |
| fluid-power | 6 | All legacy |
| industrial-networking | 6 | All legacy |
| industrial-troubleshooting | 6 | All legacy |
| instrumentation-basics | 6 | All legacy |
| measurement-devices | 6 | All legacy |
| photoelectric-sensors | 5 | All legacy |
| plc-connection-fundamentals | 6 | All legacy |
| position-limit-switches | 5 | All legacy |
| power-distribution | 6 | All legacy |
| preventative-maintenance | 6 | All legacy |
| process-control | 6 | All legacy |
| robotics-fundamentals | 6 | All legacy |
| semiconductor-fundamentals | 6 | All legacy |
| welding-fundamentals | 6 | All legacy |

Plus partial modules (some lessons already converted):
| Module | Total | Already Cards | Remaining Legacy |
|--------|-------|---------------|-----------------|
| electrical-fundamentals | 6 | 1 | 5 |
| hvac-fundamentals | 6 | 1 | 5 |
| plc-fundamentals | 6 | 6 | 0 ✅ |
| powerflex-vfd | 6 | 6 | 0 ✅ |
| motors-controls | 6 | 6 | 0 ✅ |
| sensors-instrumentation | 8 | 0 (deck exists, slug mismatch) | 8 |
| safety-systems | 9 | 0 (deck exists, slug mismatch) | 9 |
| print-reading | 8 | 0 (deck exists, slug mismatch) | 8 |

**For each legacy lesson, Cursor must:**

1. Read the existing markdown content from the DB (via `getLesson` API or direct SQL)
2. Create a new deck file following the exact card structure from the prompt:
   - Card 1: Failure scenario (real brand, real failure)
   - Cards 2-3: Core concept (one concept per card, field-observable)
   - Card 4: Field example (real equipment, real scenario)
   - Card 5: Knowledge Check 1 (from curated assessments)
   - Cards 6-7: Failure modes (symptom → cause → diagnostic → fix)
   - Card 8: Diagram card (SVG variant)
   - Cards 9-10: Field procedure (numbered steps, specific tools)
   - Card 11: Knowledge Check 2
   - Card 12+: Additional if needed (max 14 total)
   - Final card: Summary (action takeaways)
3. Register in `shared/lessonCardContent.ts`
4. Set `lessonFormat: "cards"` in `shared/lessonPracticeMap.ts`
5. Run `pnpm run check` after each group

**Critical:** Each lesson needs curated assessments FIRST. If a lesson doesn't have curated assessments yet, Cursor must create them in the appropriate batch file using `expertMcq()`.

#### 2C. New Curated Assessments Needed

**Current coverage:** 56 lessons have curated assessments.
**Needed:** All 193 lessons need curated assessments for card KC cards.
**Gap:** 137 lessons need new curated assessments.

For each missing lesson, create in a new batch file (`curatedLessonAssessmentsBatch4.ts`, etc.):
```typescript
expertMcq(
  "Application-level question testing the most critical concept",
  ["Correct answer with specifics", "Plausible wrong 1", "Plausible wrong 2", "Plausible wrong 3"],
  0,
  "Why correct: specific technical reasoning with evidence",
  [
    "Why wrong 1: why a tech would pick this + what evidence disproves it",
    "Why wrong 2: why a tech would pick this + what evidence disproves it",
    "Why wrong 3: why a tech would pick this + what evidence disproves it",
  ]
)
```

Minimum per lesson: 2 KC + 4 quiz = 6 questions × 4 options = 24 answer explanations.

---

### STEP 3: PLATFORM CONSISTENCY PASS

#### 3A. Terminology Standardization

Run these searches and replace across ALL deck files:

```bash
# In shared/lessonDecks/*.ts:
grep -rn "rung logic\|ladder line" → replace with "ladder rung"
grep -rn "input module\|input rack" → replace with "input card"
grep -rn "output bit\|output tag" → replace with "output coil" (unless teaching tag addressing)
grep -rn "NC contact" → replace with "normally closed" in explanatory text
grep -rn "fault number\|error code" → replace with "fault code"
grep -rn "drive setting\|configuration value" → replace with "parameter"
grep -rn '"meter"\|"DMM"' → replace with "multimeter" in procedures
grep -rn '"lockout"' → replace with "LOTO procedure" (when referring to the full procedure)
```

Also run in curated assessment files (`shared/curatedLessonAssessments*.ts`).

#### 3B. ILU Navigation Links

**Current:** `lessonPracticeMap.ts` has 34 entries but 0 `simulatorSlug` or `labSlug` fields.
**Prompt requires:** Every lesson links to: Lesson → Practice lab → Troubleshoot sim → Assess

**Action:** For each card lesson, add practice/simulator links where available. The `scenarioLinking.ts` file has URL aliases for simulator scenarios. Cross-reference with the DB `linkedScenarioSlug` column on `course_lessons`.

#### 3C. Mobile Chrome Consistency

Verify every card lesson has identical UI chrome:
- Progress bar at top ✅ (built into LessonCardPlayer)
- Card counter visible ✅ (built into LessonCardPlayer)
- Previous/Next navigation at bottom ✅ (swipe + buttons)
- ILU strip below card player — **needs verification per lesson**

---

### STEP 4: NEW DIAGRAM VARIANTS NEEDED

For the 162 new card lessons, Cursor will need additional diagram variants beyond the current 14. Estimate:

| Subject Area | New Variants Needed | Examples |
|---|---|---|
| Fluid Power | 2-3 | `hydraulic-circuit-iso1219`, `pneumatic-frl-circuit` |
| Alignment | 1-2 | `dial-indicator-setup`, `laser-alignment-targets` |
| Robotics | 1-2 | `robot-axes-diagram`, `teach-pendant-layout` |
| Power Distribution | 1-2 | `three-phase-transformer`, `breaker-coordination-curve` |
| Welding | 1-2 | `mig-circuit-diagram`, `weld-joint-types` |
| Process Control | 1-2 | `pid-loop-diagram`, `cascade-control-block` |
| Industrial Networking | 1 | `ethernet-ip-topology` (already exists) |
| Preventive Maintenance | 1 | `vibration-spectrum-chart` |

**Total new variants estimated:** 12-18 additional SVG diagrams in `LessonCardVisual.tsx`

Each new variant must follow `DIAGRAM_STANDARD.md`:
- Min 13px font
- CSS variables for colors
- 375px viewport safe
- Touch targets ≥ 44px

---

### STEP 5: DB MIGRATION AFTER CONVERSION

After all lessons are converted:

```sql
-- Mark all converted lessons
UPDATE course_lessons SET contentFormat = 'cards' 
WHERE moduleId IN (SELECT id FROM course_modules WHERE slug IN (...));
```

Or use the existing `migrate-card-lesson-content.mjs` script (update its lesson list).

---

### STEP 6: VERIFICATION SCRIPTS

Create or update these scripts:

1. **`verify-curated-assessments.mjs`** — Check all lessons have curated assessments, all use `expertMcq`, all have full pedagogy markers.

2. **`verify-platform-domain.mjs`** — 12 domain checks (terminology, navigation, mobile, etc.)

3. **`verify-lesson-cards-pilot.mjs`** — For each card lesson: loads, Card 1 is scenario, first interaction ≤ card 3, summary is final card, no overflow at 375px.

4. **`verify-mobile-375.mjs`** — Headless browser test at 375px for all card lessons.

---

## EXECUTION ORDER FOR CURSOR

```
Phase 1: Fix existing 31 lessons (Steps 1B-1F)          ~4 hours
Phase 2: Resolve 11 slug mismatches (Step 2A)            ~2 hours  
Phase 3: Create curated assessments for 137 lessons      ~20 hours
Phase 4: Convert 162 legacy lessons to cards             ~80 hours
Phase 5: Create 12-18 new diagram variants               ~12 hours
Phase 6: Terminology standardization pass                ~2 hours
Phase 7: ILU navigation links                            ~4 hours
Phase 8: Mobile QA verification                          ~4 hours
Phase 9: Full platform QA scripts                        ~4 hours
Phase 10: Expert panel review                            ~2 hours
```

**Total estimated:** ~130 hours of Cursor work

---

## FILE REFERENCE

| File | Purpose |
|------|---------|
| `shared/lessonDecks/*.ts` | Card deck definitions (one per lesson) |
| `shared/lessonCardContent.ts` | Registry: maps module/lesson slugs to deck imports |
| `shared/lessonPracticeMap.ts` | ILU config: card count, format, practice links |
| `shared/learningCardTypes.ts` | TypeScript types for cards, diagram variants |
| `shared/curatedLessonAssessments*.ts` | Assessment questions with full pedagogy |
| `shared/curatedMcqHelpers.ts` | `expertMcq()` helper for structured wrong-answer notes |
| `shared/lessonDecks/DIAGRAM_STANDARD.md` | SVG diagram requirements |
| `client/src/components/lessons/LessonCardVisual.tsx` | SVG diagram React components |
| `client/src/components/lessons/LessonCardPlayer.tsx` | Card player UI (swipe, progress, nav) |
| `client/src/components/LessonAssessmentPanel.tsx` | KC/Quiz gating panel |
| `client/src/pages/Lesson.tsx` | Main lesson page (card vs legacy routing) |
| `server/routers.ts` | API: getLesson returns card stub for card-format lessons |
| `server/migrate-card-lesson-content.mjs` | DB migration script for contentFormat |
| `drizzle/schema.ts` | DB schema (contentFormat column on course_lessons) |

---

## CRITICAL RULES (DO NOT VIOLATE)

1. **React hooks rule:** `summaryLabCtas` useMemo MUST stay before all early returns in `Lesson.tsx` (line 247). Never move it after an `if` that returns.

2. **Completion logic:** Lesson completes ONLY when BOTH `summaryReached === true` AND `cardAssessmentsSatisfied === true`. Do not change this dual-gate.

3. **No new architecture:** Do not add new simulators, hubs, modules, or routing. Only convert existing content.

4. **expertMcq format:** All new assessments MUST use `expertMcq()` — never raw objects with just `explanation` strings.

5. **Diagram CSS variables:** Never hardcode hex colors in SVG diagrams. Use `var(--color-diagram-*)`.

6. **Card limit:** Maximum 14 cards per lesson. Minimum 10.

7. **KC positions:** First KC at card 3. Second KC at card 9-11. Never later than card 11.

8. **Build gates:** `pnpm run check` and `pnpm run build` must pass after every group of conversions.

9. **Test count:** Tests must remain at 352+ (never decrease). New tests welcome.

10. **No fake content:** Every failure scenario must name real equipment (Allen-Bradley, PowerFlex, ControlLogix, Siemens, FANUC, etc.). No "a PLC" or "a drive."

---

## QUICK START FOR CURSOR

```bash
# 1. Verify current state
cd /home/ubuntu/eas-platform
pnpm run check    # Should pass
pnpm run build    # Should pass  
pnpm test         # Should show 352 passed

# 2. Start with Step 1 audit
cd shared/lessonDecks
# Audit Card 1 bodies, summary cards, diagram coverage

# 3. After fixes, verify
pnpm run check && pnpm run build && pnpm test

# 4. Then move to Step 2 conversions (one group at a time)
```
