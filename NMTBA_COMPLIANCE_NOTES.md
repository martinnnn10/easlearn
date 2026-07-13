# NMTBA EGP-1 Compliance Notes

## Context Separation Decisions

### Inline SVG Symbols in Simulators (NOT replaced)

The following components have inline SVG contact/coil rendering that is **animated/interactive**
and serves a different purpose than static schematic symbols:

1. **RelaySimulator.tsx** — Animated relay with spring-physics contact arm movement.
   The contact arm animates between open/closed positions. This is a **simulator**, not a
   schematic reference. The geometry (horizontal arm pivoting) is intentionally simplified
   for animation clarity.

2. **LadderLogicSVG.tsx** — Decorative animated ladder logic diagram on the homepage.
   Uses the correct NMTBA relay contact style (two vertical plates for NO, diagonal slash for NC).
   This is already compliant with NMTBA EGP-1 relay contact notation.

3. **InteractiveCircuitDiagramV3.tsx** — Troubleshooting simulator with fault injection.
   Uses dashed lines for broken wires (fault visualization), not for contact symbols.

### Decision: These simulators use inline SVG for animation purposes and are NOT
schematic reference material. They should NOT be replaced with static library symbols.

## Files Updated (Phase 2)

- `client/src/components/symbols/NMTBA_EGP1_SymbolLibrary.tsx` — NEW: Single source of truth
- `client/src/components/symbols/index.ts` — UPDATED: Routes to NMTBA library
- `client/src/pages/SymbolComparison.tsx` — UPDATED: Import from barrel export

## Files NOT Changed (correct as-is)

- `client/src/components/interactive/SymbolQuizMode.tsx` — Already imports from barrel
- `client/src/components/interactive/SymbolFlashCards.tsx` — Already imports from barrel
- `client/src/components/interactive/ComponentIDChallenge.tsx` — Already imports from barrel
- `client/src/components/interactive/DrawSymbolExercise.tsx` — Already imports from barrel
- `client/src/pages/SemiconductorReference.tsx` — Uses only Group C symbols
- `client/src/components/LadderLogicSVG.tsx` — Decorative, already uses correct relay notation
- `client/src/components/interactive/RelaySimulator.tsx` — Animated simulator, not reference
