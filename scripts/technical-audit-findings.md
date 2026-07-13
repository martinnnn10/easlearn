# Technical Audit Findings — Current Diode SVG Symbols

## Issues Identified

### 1. Standard Rectifier Diode
- SVG geometry: Triangle points RIGHT (correct for current flow direction)
- Triangle: points="70,20 70,60 110,40" — this is a right-pointing triangle (correct)
- Barrier line: x1=110 y1=20 to x1=110 y2=60 — vertical line at cathode (correct)
- ISSUE: Triangle is NOT equilateral — it's 40px tall (20 to 60) but only 40px wide (70 to 110). Per IEC 60617, the triangle should be equilateral or slightly wider than tall.
- ISSUE: viewBox is 200x80 but symbol only uses 70-110 range (40px of 200px = 20% of width). Poor use of space.
- ISSUE: Text "ANODE (+)" at x=40 but the anode wire starts at x=10 and ends at x=70. Label is misaligned with terminal.
- ISSUE: Text "CATHODE (−)" at x=150 but cathode wire goes from x=110 to x=190. Label is misaligned.

### 2. Zener Diode
- Same base triangle as standard (correct)
- Bent ends: line from (110,20) to (102,20) — top bends LEFT (toward anode) ✓
- Bent ends: line from (110,60) to (118,60) — bottom bends RIGHT (away from anode) ✓
- ISSUE: The Zener "Z" shape should have the bends going in OPPOSITE directions per IEC 60617. Top goes LEFT, bottom goes RIGHT — this IS correct for IEC.
- ISSUE: The bent segments are only 8px long — too short relative to the 40px barrier. Should be ~25% of barrier height minimum for readability.

### 3. Schottky Diode
- Need to check: Should have S-shaped curls at barrier ends
- Per IEC 60617: Top curls toward anode (left), bottom curls away from anode (right)
- Need to verify the actual SVG paths

### 4. LED
- Should have two arrows pointing OUTWARD (away from junction) at ~45°
- Need to verify arrow positioning and direction

### 5. Photodiode
- Should have two arrows pointing INWARD (toward junction)
- Need to verify arrow positioning and direction

### 6. TVS (Bidirectional)
- Should show two diodes back-to-back with Zener-style cathode bars
- Need to verify topology

### 7. Fast Recovery
- Should be visually identical to standard rectifier (differentiated by part number only)
- Need to verify

### 8. Bridge Rectifier
- Should show diamond/rhombus topology with 4 diodes
- Need to verify correct orientation of each diode in the bridge

### 9. Flyback/Freewheeling
- Should show diode in correct orientation relative to inductive load
- Need to verify polarity

## Terminology Issues Found
- "triangle-and-barrier" — used in Zener description. MUST REMOVE.
- "Same triangle-and-barrier as a standard diode" — non-professional language
- Need to check all 9 sections for similar issues

## Drafting Standards Issues
- All symbols use same viewBox="0 0 200 80" — may be too cramped for complex symbols
- Line weight 2.5px — acceptable but should be consistent
- Green color (#22c55e) — acceptable for dark theme educational context
- Label font-size 11px — may be too small on mobile
- No current flow direction indicators on any symbol
