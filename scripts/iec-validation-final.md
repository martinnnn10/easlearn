# IEC 60617 / IEEE 315 Symbol Validation Report

**Generated:** 2026-05-20T00:07:48.615Z

## Validation Criteria

| # | Rule | Standard | Pass Condition |
|---|------|----------|----------------|
| 1 | No filled polygons | IEC 60617 | All polygon elements use fill="none" |
| 2 | Stroke weight range | Drafting practice | 0.8-3.0px (no ultra-thin <0.5) |
| 3 | Terminal indicators | IEC 60617 | Filled circles only at junction nodes |
| 4 | Typography | Drafting practice | Monospace for designators, ≥9px font |
| 5 | Label spacing | Drafting practice | Labels offset from geometry |

## React Component SVGs

⚠️ **client/src/pages/SemiconductorReference.tsx** — 1 issue(s)
  - ⚠️ 3 small font(s) (<8px) — may be illegible on mobile

✅ **client/src/components/interactive/ComponentIDChallenge.tsx** — PASS (all checks)

⚠️ **client/src/components/interactive/MotorStarterSimulator.tsx** — 1 issue(s)
  - ⚠️ 8 small font(s) (<8px) — may be illegible on mobile

✅ **client/src/components/interactive/TransistorTestingLab.tsx** — PASS (all checks)

✅ **client/src/components/interactive/ThyristorTestingLab.tsx** — PASS (all checks)

✅ **client/src/components/interactive/DiodeTestingLab.tsx** — PASS (all checks)

✅ **client/src/components/interactive/GuidedVFDWalkthrough.tsx** — PASS (all checks)

## Database Lesson SVGs

Found 14 lessons with SVG content.

⚠️ Lesson 60010 (Ladder Logic: Reading & Writing Basic Programs): 1 small font(s) (<8px)
⚠️ Lesson 60013 (Diodes: Rectification & Protection): 18 filled polygon(s)
⚠️ Lesson 60014 (Transistors: Switching & Amplification): 4 filled polygon(s)
⚠️ Lesson 60015 (IGBTs & Power Electronics): 2 filled polygon(s)
⚠️ Lesson 60017 (Industrial Power Supply Circuits): 5 filled polygon(s)
⚠️ Lesson 60020 (HVAC Motor Controls & Starters): 1 filled polygon(s)
⚠️ Lesson 90011 (Panel Layout Drawings & Wire Tracing Techniques): 1 filled polygon(s)
⚠️ Lesson 120016 (Cross-Referencing Contacts and Coils Across Pages): 1 filled polygon(s)
⚠️ Lesson 150003 (Reading Electrical Prints Under Pressure): 1 filled polygon(s)

**Database Results:** 5 passed, 9 with issues

## Summary

| Metric | Value |
|--------|-------|
| Total files/lessons checked | 21 |
| Passed (all checks) | 10 |
| Total issues found | 11 |
| Compliance rate | 48% |

### ⚠️ 11 ISSUES REQUIRE ATTENTION

Review the issues above and apply corrections.
