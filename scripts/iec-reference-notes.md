# IEC 60617 Diode Symbol Reference Notes

Based on the reference images (IEC 60617 / ANSI Y32.2):

## Key Geometry Rules

1. **Standard Diode**: Filled/solid equilateral triangle pointing right (toward cathode). The cathode bar is a straight vertical line touching the triangle apex. Triangle is FILLED (solid black) in standard IEC representation.

2. **Zener Diode**: Same filled triangle. Cathode bar has BENT ENDS - top bends LEFT (toward anode), bottom bends RIGHT (away from anode). The bends are at approximately 45 degrees and are short (about 20-25% of bar height).

3. **Schottky Diode**: Same filled triangle. Cathode bar has S-SHAPED CURLS - top curls LEFT with a small hook, bottom curls RIGHT with a small hook. The curls are more rounded than Zener's angular bends.

4. **LED**: Same filled triangle + cathode bar. TWO ARROWS pointing AWAY from the junction (outward, upper-right direction). Arrows have proper arrowheads. Arrows originate from near the junction area.

5. **Photodiode**: Same filled triangle + cathode bar. TWO ARROWS pointing TOWARD the junction (inward, from upper-left). Arrows have proper arrowheads. Often shown enclosed in a circle.

6. **TVS (Bidirectional)**: Two triangles facing each other (back-to-back), sharing cathode bars. Each cathode bar has Zener-style bends. Forms a symmetric symbol.

7. **Bridge Rectifier**: Diamond/rhombus shape with 4 diodes placed on the sides. AC inputs at left and right vertices. DC+ at top vertex, DC- at bottom vertex. Each diode triangle points in the direction of conventional current flow (toward DC+).

8. **Flyback/Freewheeling**: Standard diode symbol placed ACROSS an inductive load (coil). Cathode connects to the positive supply rail, anode connects to the negative/ground side. The diode is reverse-biased during normal operation.

## Critical Observations from Reference Images

- In IEC standard, the triangle is FILLED (solid) not just outlined
- The triangle proportions: base height ≈ 1.2x the width (slightly taller than wide)
- Cathode bar extends slightly beyond the triangle edges (about 10-15% on each side)
- Wire leads are simple straight lines extending from anode (left of triangle base) and cathode (right of cathode bar)
- Terminal labels use single letters: A (Anode), K (Cathode)
- Line weights: main symbol elements use heavier lines than connecting wires

## What Needs Fixing in Current Implementation

1. **Triangle should be FILLED** (solid) per IEC, not just outlined with stroke
2. **Zener bends are too short** (8px vs 40px bar = 20% — borderline acceptable but should be more visible)
3. **Schottky uses quadratic curves** which is approximately correct but could be more precise
4. **Bridge rectifier triangles have wrong geometry** — the polygon points don't form proper triangles on the diamond sides
5. **Terminology "triangle-and-barrier"** must be replaced with proper terms like "junction symbol" or simply describe the cathode modification
6. **Labels should use A/K** not "ANODE (+)" / "CATHODE (−)" for professional appearance (though the full labels are acceptable for educational context)
