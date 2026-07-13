# Program / DB Reconciliation Report

**Date:** 2026-07-11
**Scope:** Compare what the UI shows vs what the DB contains vs what the curriculum architecture defines

---

## Architecture Overview

The platform uses three layers of content organization:

1. **Curriculum Tracks** (`shared/curriculumArchitecture.ts`) — 6 high-level learning paths, each containing multiple module slugs
2. **Course Modules** (DB `course_modules` table) — 31 published modules, each with lessons
3. **Programs/Semesters** (`client/src/config/programsSemesters.ts`) — UI display grouping into 4 semesters

---

## Findings

### Curriculum Tracks vs DB Modules

The curriculum architecture defines 6 tracks with module slugs. All module slugs referenced in the tracks exist in the DB:

| Track | Module Slugs Referenced | All in DB? |
|-------|----------------------|-----------|
| Electrical Fundamentals | electrical-fundamentals, print-reading, power-distribution | Yes |
| Digital & Control Fundamentals | digital-fundamentals, semiconductor-fundamentals, safety-systems | Yes |
| PLC / Controls | plc-fundamentals, plc-connection-fundamentals, rslinx-communication-setup, studio-5000-safe-access, industrial-networking, safe-online-edits | Yes |
| Motors, Drives & Motion | motors-controls, powerflex-vfd, drives-servo-communication | Yes |
| Sensors, Instrumentation & Process | sensor-fundamentals, instrumentation-basics, sensors-instrumentation, photoelectric-sensors, position-limit-switches, measurement-devices, process-control, calibration-troubleshooting | Yes |
| Mechanical Systems & Reliability | fluid-power, alignment, preventative-maintenance, hvac-fundamentals, industrial-troubleshooting, real-troubleshooting-workflow, real-world-fault-scenarios | Yes |

**Note:** `sensors-instrumentation-process` and `mechanical-systems-reliability` are **track IDs**, not module slugs. They are not missing from the DB — they are organizational groupings.

### DB Module Not in Curriculum Tracks

| Module Slug | In DB? | In Semester Config? | Has Lessons? | Status |
|-------------|--------|--------------------|--------------|----|
| robotics-fundamentals | Yes (8 lessons) | Yes (Semester 3) | Yes | **Not in curriculum tracks** — exists in DB and UI but not in the 6-track architecture |

**Assessment:** `robotics-fundamentals` is a standalone module that was added to the DB and semester config but not yet placed into the curriculum track system. It has 8 lessons and is fully functional. It should be added to a track (likely "PLC / Controls" or a new track) in a future curriculum revision.

### Programs/Semesters Config vs DB

All 31 module slugs in `programsSemesters.ts` exist in the DB. The fallback semester mechanism handles any unassigned modules gracefully.

---

## Dead Links / Route Issues

No dead links found. The system handles missing modules gracefully:
- `listModules` only returns published modules from the DB
- The Programs page uses `programsSemesters.ts` for display order but fetches actual data from the API
- Modules not in any semester fall into the "Additional Modules" fallback group
- The `/courses/:moduleSlug` route queries the DB dynamically — no hardcoded routes

---

## Conclusion

**No critical mismatches found.** The only discrepancy is `robotics-fundamentals` not being in the curriculum track architecture, which is cosmetic (the track system is used for the learning path recommendation, not for navigation). All modules are accessible and functional.

### Recommendations (non-blocking):
1. Add `robotics-fundamentals` to the curriculum architecture (suggest: new Track 7 "Robotics & Advanced Automation" or append to Track 3 "PLC / Controls")
2. Consider whether `mechanical-systems-reliability` track should include `robotics-fundamentals`
