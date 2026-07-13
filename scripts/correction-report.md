# Semiconductor Symbol Curriculum — Correction Report

**Date:** May 19, 2026  
**Scope:** Complete rewrite of diode lesson SVG symbols and educational content  
**Standard:** IEC 60617 / ANSI Y32.2  

---

## Summary of Corrections

The entire diode lesson (Lesson ID 7, "Diodes: Rectification & Protection") was rebuilt from scratch. All ASCII/text-based pseudo-diagrams were replaced with proper inline SVG vector graphics conforming to IEC 60617 and ANSI Y32.2 electrical drafting standards.

---

## Corrected Symbols (9 Total)

| # | Diode Type | Previous Issue | Correction Applied |
|---|-----------|----------------|-------------------|
| 1 | Standard Rectifier (1N4007, 1N5408, 6A10) | Outlined triangle, inconsistent proportions | Solid filled equilateral triangle, straight vertical cathode bar, 2px consistent stroke, current direction arrow |
| 2 | Zener (1N4733A, 1N5231B, BZX84C5V1) | Incorrect Z-bend angles | Proper angular bends per IEC: upper end deflects toward anode, lower end deflects away from anode |
| 3 | Schottky Barrier (1N5819, BAT54, MBR2045) | Incorrect curl direction | Proper S-shaped curls per IEC: upper end curls toward anode (left), lower end curls away (right) |
| 4 | LED | Missing emission arrows | Two arrows pointing outward at 45° from junction, representing photon emission |
| 5 | Photodiode (BPW34, SFH206K, VEMD1060X01) | Missing incident light arrows | Two arrows pointing inward toward junction, visual inverse of LED |
| 6 | TVS Bidirectional (SMBJ24CA, P6KE36CA, 1.5KE440CA) | Single symbol shown | Proper back-to-back topology with two triangles facing each other, LINE 1/LINE 2 labels |
| 7 | Fast Recovery (UF4007, MUR1560, RHRP860) | Incorrectly differentiated from standard | Identical symbol to standard rectifier (correct per IEC), differentiated by t_rr annotation |
| 8 | Bridge Rectifier (KBU810, KBPC3510, GBJ2510) | Flat layout | Proper diamond (rhombus) topology with 4 diodes, DC+/DC-/AC/AC terminal labels at correct vertices |
| 9 | Flyback/Freewheeling | Standalone symbol | Application context diagram showing relay coil with diode in reverse bias, V+/V- labels |

---

## Terminology Corrections

| Removed (Non-Professional) | Replaced With (IEC Standard) |
|---------------------------|------------------------------|
| "triangle + bar" | "solid equilateral triangle with cathode bar" |
| "hooked line" | "angular bends" (Zener) or "S-shaped curls" (Schottky) |
| "curved bar" | "cathode bar with rounded terminal curls" |
| "triangle direction" | "conventional current flow direction (Anode to Cathode)" |
| "simple diode" | "standard silicon rectifier" |

---

## Educational Content Per Symbol

Each of the 9 diode types now includes:

1. **IEC designation** — proper reference designator (D, ZD, DS, PD, etc.)
2. **Operating principle** — physics of operation in professional engineering language
3. **Industrial applications** — specific real-world uses in plant maintenance context
4. **Failure modes** — how each type fails and symptoms observed in the field
5. **Multimeter verification** — exact test procedure with expected readings

---

## Mobile Rendering Validation

CSS rules added to `client/src/index.css`:
- `max-width: 100%` on all prose SVGs
- `overflow: visible` to prevent clipping
- `min-height: 60px` for SVG containers
- Mobile breakpoint (480px): reduced table font-size, word-break on cells
- SVG viewBox-based scaling ensures proportional rendering at any width

---

## Audit of Other Semiconductor/Electronics Lessons

All 18 semiconductor and electronics lessons were audited:

| Lesson | Status | Notes |
|--------|--------|-------|
| Diode Fundamentals | FIXED | Complete SVG rebuild |
| Transistor Fundamentals (BJT/MOSFET) | CLEAN | Text-based descriptions, no malformed diagrams |
| IGBT & Power Electronics | CLEAN | Accurate technical content |
| Thyristors & SCR | CLEAN | Correct terminology |
| Motor Control Circuits | CLEAN | Proper ladder logic references |
| Ohm's Law & Circuit Analysis | CLEAN | No ASCII diagrams |
| AC/DC Theory | CLEAN | Correct waveform descriptions |
| Sensor Technology | CLEAN | Accurate specifications |
| PLC I/O Troubleshooting | CLEAN | Proper addressing notation |
| VFD Parameter Programming | CLEAN | Correct parameter references |
| All remaining lessons (8) | CLEAN | No symbol or terminology issues |

---

## Files Modified

1. `client/src/index.css` — Added responsive SVG styling rules
2. Database: `course_lessons` table, ID 7 — Complete content replacement
3. `scripts/diode-lesson-v2.md` — Source content file with all SVG symbols

---

## Validation Results

- TypeScript: 0 errors (confirmed via `npx tsc --noEmit`)
- Tests: 231 passing (confirmed via `pnpm test`)
- Visual: All 9 symbols verified rendering correctly in browser
- Mobile CSS: Responsive rules applied for 480px breakpoint
- Terminology: Zero instances of banned terms in rendered content
