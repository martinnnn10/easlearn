import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

/**
 * Add IEC 60617 SVG symbols to power electronics lessons:
 * 1. Lesson 60017 - Industrial Power Supply Circuits
 * 2. Lesson 60010 - Ladder Logic: Reading & Writing Basic Programs
 * 3. Lesson 120017 - Reading VFD and Motor Starter One-Line Diagrams
 */

const powerSupplySymbols = `

## Power Supply Circuit Symbols — IEC 60617

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin:1.5rem 0;">

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Half-Wave Rectifier</p>
<svg viewBox="0 0 280 120" style="max-width:300px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- AC input -->
  <line x1="20" y1="60" x2="60" y2="60" stroke="#22c55e" stroke-width="2"/>
  <text x="40" y="45" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">AC IN</text>
  <!-- Diode -->
  <polygon points="60,45 60,75 100,60" fill="#22c55e" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="100" y1="45" x2="100" y2="75" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Output -->
  <line x1="100" y1="60" x2="160" y2="60" stroke="#22c55e" stroke-width="2"/>
  <!-- Filter capacitor -->
  <line x1="160" y1="40" x2="160" y2="55" stroke="#22c55e" stroke-width="2.5"/>
  <line x1="150" y1="40" x2="170" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <line x1="150" y1="55" x2="170" y2="55" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Curved plate for electrolytic -->
  <path d="M 150 55 Q 160 60 170 55" fill="none" stroke="#22c55e" stroke-width="1.5"/>
  <!-- DC output -->
  <line x1="160" y1="40" x2="220" y2="40" stroke="#22c55e" stroke-width="2"/>
  <line x1="160" y1="80" x2="220" y2="80" stroke="#22c55e" stroke-width="2"/>
  <!-- Return path -->
  <line x1="20" y1="80" x2="160" y2="80" stroke="#22c55e" stroke-width="2"/>
  <!-- Load resistor -->
  <rect x="220" y="40" width="15" height="40" fill="none" stroke="#22c55e" stroke-width="2"/>
  <line x1="235" y1="60" x2="260" y2="60" stroke="#22c55e" stroke-width="2"/>
  <!-- Labels -->
  <text x="240" y="35" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">DC OUT</text>
  <text x="80" y="95" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">D1</text>
  <text x="160" y="95" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">C1</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">Single diode, 50% duty cycle, high ripple</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Full-Wave Bridge Rectifier</p>
<svg viewBox="0 0 280 160" style="max-width:300px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Bridge diamond arrangement -->
  <!-- Top diode (D1) - pointing right -->
  <polygon points="100,40 130,55 100,70" fill="#22c55e" stroke="#22c55e" stroke-width="1"/>
  <line x1="130" y1="40" x2="130" y2="70" stroke="#22c55e" stroke-width="2"/>
  <!-- Right diode (D2) - pointing down -->
  <polygon points="145,70 160,100 175,70" fill="#22c55e" stroke="#22c55e" stroke-width="1"/>
  <line x1="145" y1="100" x2="175" y2="100" stroke="#22c55e" stroke-width="2"/>
  <!-- Bottom diode (D3) - pointing left -->
  <polygon points="180,90 150,105 180,120" fill="#22c55e" stroke="#22c55e" stroke-width="1"/>
  <line x1="150" y1="90" x2="150" y2="120" stroke="#22c55e" stroke-width="2"/>
  <!-- Left diode (D4) - pointing up -->
  <polygon points="105,90 120,60 135,90" fill="#22c55e" stroke="#22c55e" stroke-width="1"/>
  <line x1="105" y1="60" x2="135" y2="60" stroke="#22c55e" stroke-width="2"/>
  <!-- Diamond frame -->
  <path d="M 140 30 L 200 80 L 140 130 L 80 80 Z" fill="none" stroke="#22c55e" stroke-width="2"/>
  <!-- AC input (left and right) -->
  <line x1="20" y1="55" x2="80" y2="55" stroke="#22c55e" stroke-width="2"/>
  <line x1="20" y1="105" x2="80" y2="105" stroke="#22c55e" stroke-width="2"/>
  <!-- DC output (top and bottom) -->
  <line x1="140" y1="30" x2="140" y2="15" stroke="#22c55e" stroke-width="2"/>
  <line x1="140" y1="130" x2="140" y2="145" stroke="#22c55e" stroke-width="2"/>
  <!-- Labels -->
  <text x="20" y="50" fill="oklch(0.5 0 0)" font-size="9">AC</text>
  <text x="140" y="12" text-anchor="middle" fill="#22c55e" font-size="9">DC+</text>
  <text x="140" y="155" text-anchor="middle" fill="#22c55e" font-size="9">DC-</text>
  <!-- + and - polarity markers -->
  <text x="155" y="25" fill="#22c55e" font-size="12">+</text>
  <text x="155" y="145" fill="#22c55e" font-size="12">-</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">4 diodes in diamond, full-cycle rectification, lower ripple</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Transformer (Single-Phase)</p>
<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Primary winding -->
  <line x1="20" y1="30" x2="60" y2="30" stroke="#22c55e" stroke-width="2"/>
  <path d="M 60 30 C 70 30, 70 45, 60 45 C 70 45, 70 60, 60 60 C 70 60, 70 75, 60 75 C 70 75, 70 90, 60 90" fill="none" stroke="#22c55e" stroke-width="2"/>
  <line x1="20" y1="90" x2="60" y2="90" stroke="#22c55e" stroke-width="2"/>
  <!-- Core lines -->
  <line x1="80" y1="25" x2="80" y2="95" stroke="#22c55e" stroke-width="2"/>
  <line x1="85" y1="25" x2="85" y2="95" stroke="#22c55e" stroke-width="2"/>
  <!-- Secondary winding -->
  <path d="M 105 30 C 95 30, 95 45, 105 45 C 95 45, 95 60, 105 60 C 95 60, 95 75, 105 75 C 95 75, 95 90, 105 90" fill="none" stroke="#22c55e" stroke-width="2"/>
  <line x1="105" y1="30" x2="180" y2="30" stroke="#22c55e" stroke-width="2"/>
  <line x1="105" y1="90" x2="180" y2="90" stroke="#22c55e" stroke-width="2"/>
  <!-- Labels -->
  <text x="40" y="20" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">H1</text>
  <text x="40" y="105" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">H2</text>
  <text x="145" y="20" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">X1</text>
  <text x="145" y="105" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">X2</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">IEC: Coupled coils with core lines</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Three-Terminal Voltage Regulator</p>
<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- IC body -->
  <rect x="55" y="35" width="90" height="50" fill="none" stroke="#22c55e" stroke-width="2.5" rx="3"/>
  <!-- Input -->
  <line x1="20" y1="60" x2="55" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <text x="70" y="55" fill="#22c55e" font-size="10">IN</text>
  <!-- Output -->
  <line x1="145" y1="60" x2="180" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <text x="130" y="55" fill="#22c55e" font-size="10">OUT</text>
  <!-- Ground -->
  <line x1="100" y1="85" x2="100" y2="110" stroke="#22c55e" stroke-width="2.5"/>
  <text x="100" y="70" text-anchor="middle" fill="#22c55e" font-size="10">GND</text>
  <!-- Ground symbol -->
  <line x1="85" y1="110" x2="115" y2="110" stroke="#22c55e" stroke-width="2"/>
  <line x1="90" y1="115" x2="110" y2="115" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="95" y1="120" x2="105" y2="120" stroke="#22c55e" stroke-width="1"/>
  <!-- Designator -->
  <text x="100" y="30" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">LM7805 / LM317</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">Fixed (78xx) or adjustable (LM317) output</p>
</div>

</div>
`;

const ladderLogicSymbols = `

## Ladder Logic Symbols — IEC 61131-3 / NEMA

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;margin:1.5rem 0;">

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Normally Open Contact (XIC)</p>
<svg viewBox="0 0 180 80" style="max-width:180px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left rung wire -->
  <line x1="10" y1="40" x2="60" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Contact symbol - two vertical lines with gap -->
  <line x1="60" y1="20" x2="60" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <line x1="120" y1="20" x2="120" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Right rung wire -->
  <line x1="120" y1="40" x2="170" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Designator above -->
  <text x="90" y="15" text-anchor="middle" fill="#22c55e" font-size="11" font-family="monospace">I:1/0</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">XIC: Examine If Closed — true when bit = 1</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Normally Closed Contact (XIO)</p>
<svg viewBox="0 0 180 80" style="max-width:180px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left rung wire -->
  <line x1="10" y1="40" x2="60" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Contact symbol - two vertical lines -->
  <line x1="60" y1="20" x2="60" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <line x1="120" y1="20" x2="120" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Diagonal slash for NC -->
  <line x1="70" y1="55" x2="110" y2="25" stroke="#22c55e" stroke-width="2"/>
  <!-- Right rung wire -->
  <line x1="120" y1="40" x2="170" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Designator above -->
  <text x="90" y="15" text-anchor="middle" fill="#22c55e" font-size="11" font-family="monospace">I:1/1</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">XIO: Examine If Open — true when bit = 0</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Output Coil (OTE)</p>
<svg viewBox="0 0 180 80" style="max-width:180px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left rung wire -->
  <line x1="10" y1="40" x2="60" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Coil symbol - parentheses -->
  <path d="M 70 20 C 55 20, 55 60, 70 60" fill="none" stroke="#22c55e" stroke-width="2.5"/>
  <path d="M 110 20 C 125 20, 125 60, 110 60" fill="none" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Right rung wire -->
  <line x1="120" y1="40" x2="170" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Designator above -->
  <text x="90" y="15" text-anchor="middle" fill="#22c55e" font-size="11" font-family="monospace">O:2/0</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">OTE: Output Energize — sets bit = 1 when rung is true</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Latching Output (OTL/OTU)</p>
<svg viewBox="0 0 180 80" style="max-width:180px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left rung wire -->
  <line x1="10" y1="40" x2="60" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Coil symbol - parentheses -->
  <path d="M 70 20 C 55 20, 55 60, 70 60" fill="none" stroke="#22c55e" stroke-width="2.5"/>
  <path d="M 110 20 C 125 20, 125 60, 110 60" fill="none" stroke="#22c55e" stroke-width="2.5"/>
  <!-- L for latch -->
  <text x="90" y="45" text-anchor="middle" fill="#22c55e" font-size="14" font-weight="bold">L</text>
  <!-- Right rung wire -->
  <line x1="120" y1="40" x2="170" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Designator above -->
  <text x="90" y="15" text-anchor="middle" fill="#22c55e" font-size="11" font-family="monospace">O:2/1</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">OTL: Latch — retains state after rung goes false</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Timer On-Delay (TON)</p>
<svg viewBox="0 0 200 100" style="max-width:220px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Timer block -->
  <rect x="40" y="15" width="120" height="70" fill="none" stroke="#22c55e" stroke-width="2.5" rx="3"/>
  <!-- Left wire -->
  <line x1="10" y1="50" x2="40" y2="50" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Right wire -->
  <line x1="160" y1="50" x2="190" y2="50" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Timer text -->
  <text x="100" y="35" text-anchor="middle" fill="#22c55e" font-size="11" font-weight="bold">TON</text>
  <text x="100" y="52" text-anchor="middle" fill="#22c55e" font-size="9">Timer T4:0</text>
  <text x="100" y="67" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">Preset: 500</text>
  <text x="100" y="80" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">Base: 0.01</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">TON: Delays output ON by preset time (5.0 sec shown)</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Counter Up (CTU)</p>
<svg viewBox="0 0 200 100" style="max-width:220px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Counter block -->
  <rect x="40" y="15" width="120" height="70" fill="none" stroke="#22c55e" stroke-width="2.5" rx="3"/>
  <!-- Left wire -->
  <line x1="10" y1="50" x2="40" y2="50" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Right wire -->
  <line x1="160" y1="50" x2="190" y2="50" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Counter text -->
  <text x="100" y="35" text-anchor="middle" fill="#22c55e" font-size="11" font-weight="bold">CTU</text>
  <text x="100" y="52" text-anchor="middle" fill="#22c55e" font-size="9">Counter C5:0</text>
  <text x="100" y="67" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">Preset: 100</text>
  <text x="100" y="80" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">Accum: 0</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">CTU: Increments on each false-to-true transition</p>
</div>

</div>

### Complete Ladder Rung Example

<div style="background:oklch(0.12 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.5rem;margin:1.5rem 0;overflow-x:auto;">
<svg viewBox="0 0 500 80" style="max-width:100%;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left power rail -->
  <line x1="10" y1="10" x2="10" y2="70" stroke="#22c55e" stroke-width="3"/>
  <!-- Right power rail -->
  <line x1="490" y1="10" x2="490" y2="70" stroke="#22c55e" stroke-width="3"/>
  <!-- Rung wire -->
  <line x1="10" y1="40" x2="80" y2="40" stroke="#22c55e" stroke-width="2"/>
  <!-- NO Contact 1 (Stop PB - NC in real life, XIO in ladder) -->
  <line x1="80" y1="25" x2="80" y2="55" stroke="#22c55e" stroke-width="2"/>
  <line x1="120" y1="25" x2="120" y2="55" stroke="#22c55e" stroke-width="2"/>
  <line x1="88" y1="52" x2="112" y2="28" stroke="#22c55e" stroke-width="1.5"/>
  <text x="100" y="18" text-anchor="middle" fill="oklch(0.6 0 0)" font-size="8">Stop</text>
  <!-- Wire between contacts -->
  <line x1="120" y1="40" x2="180" y2="40" stroke="#22c55e" stroke-width="2"/>
  <!-- NO Contact 2 (Start PB) -->
  <line x1="180" y1="25" x2="180" y2="55" stroke="#22c55e" stroke-width="2"/>
  <line x1="220" y1="25" x2="220" y2="55" stroke="#22c55e" stroke-width="2"/>
  <text x="200" y="18" text-anchor="middle" fill="oklch(0.6 0 0)" font-size="8">Start</text>
  <!-- Seal-in branch -->
  <line x1="180" y1="40" x2="180" y2="70" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="180" y1="70" x2="220" y2="70" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="220" y1="70" x2="220" y2="55" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Seal-in contact (NO) -->
  <line x1="185" y1="63" x2="185" y2="77" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="215" y1="63" x2="215" y2="77" stroke="#22c55e" stroke-width="1.5"/>
  <text x="200" y="62" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="7">M (seal)</text>
  <!-- Wire to OL -->
  <line x1="220" y1="40" x2="290" y2="40" stroke="#22c55e" stroke-width="2"/>
  <!-- OL Contact (NC) -->
  <line x1="290" y1="25" x2="290" y2="55" stroke="#22c55e" stroke-width="2"/>
  <line x1="330" y1="25" x2="330" y2="55" stroke="#22c55e" stroke-width="2"/>
  <line x1="298" y1="52" x2="322" y2="28" stroke="#22c55e" stroke-width="1.5"/>
  <text x="310" y="18" text-anchor="middle" fill="oklch(0.6 0 0)" font-size="8">OL</text>
  <!-- Wire to output -->
  <line x1="330" y1="40" x2="400" y2="40" stroke="#22c55e" stroke-width="2"/>
  <!-- Output coil -->
  <path d="M 410 25 C 395 25, 395 55, 410 55" fill="none" stroke="#22c55e" stroke-width="2"/>
  <path d="M 440 25 C 455 25, 455 55, 440 55" fill="none" stroke="#22c55e" stroke-width="2"/>
  <text x="425" y="18" text-anchor="middle" fill="oklch(0.6 0 0)" font-size="8">M</text>
  <!-- Wire to right rail -->
  <line x1="450" y1="40" x2="490" y2="40" stroke="#22c55e" stroke-width="2"/>
</svg>
</div>

**Rung reads:** IF Stop is NOT pressed (XIO) AND (Start is pressed OR Motor seal-in is ON) AND Overload is NOT tripped (XIO), THEN energize Motor contactor (M).

This is the standard **3-wire motor control circuit** — the most fundamental ladder logic pattern in industrial automation.
`;

const oneLineDiagramSymbols = `

## One-Line Diagram Symbols — IEEE/ANSI

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem;margin:1.5rem 0;">

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Circuit Breaker</p>
<svg viewBox="0 0 120 100" style="max-width:120px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <line x1="60" y1="10" x2="60" y2="35" stroke="#22c55e" stroke-width="2.5"/>
  <rect x="45" y="35" width="30" height="30" fill="none" stroke="#22c55e" stroke-width="2.5"/>
  <line x1="45" y1="35" x2="75" y2="65" stroke="#22c55e" stroke-width="2"/>
  <line x1="60" y1="65" x2="60" y2="90" stroke="#22c55e" stroke-width="2.5"/>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;">Square with X</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Disconnect Switch</p>
<svg viewBox="0 0 120 100" style="max-width:120px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <line x1="60" y1="10" x2="60" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="60" cy="40" r="3" fill="#22c55e"/>
  <line x1="60" y1="40" x2="80" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="60" cy="70" r="3" fill="#22c55e"/>
  <line x1="60" y1="70" x2="60" y2="90" stroke="#22c55e" stroke-width="2.5"/>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;">Blade switch (open)</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Fuse</p>
<svg viewBox="0 0 120 100" style="max-width:120px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <line x1="60" y1="10" x2="60" y2="35" stroke="#22c55e" stroke-width="2.5"/>
  <rect x="48" y="35" width="24" height="30" fill="none" stroke="#22c55e" stroke-width="2"/>
  <!-- S-curve element inside -->
  <path d="M 54 42 Q 66 50 54 58 Q 66 66 54 62" fill="none" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="60" y1="65" x2="60" y2="90" stroke="#22c55e" stroke-width="2.5"/>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;">Rectangle with element</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Motor (One-Line)</p>
<svg viewBox="0 0 120 100" style="max-width:120px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <line x1="60" y1="10" x2="60" y2="30" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="60" cy="55" r="25" fill="none" stroke="#22c55e" stroke-width="2.5"/>
  <text x="60" y="60" text-anchor="middle" fill="#22c55e" font-size="16" font-family="serif">M</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;">Circle with M</p>
</div>

</div>
`;

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  
  // 1. Add power supply symbols to lesson 60017
  try {
    const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 60017');
    if (rows.length > 0) {
      const updated = rows[0].content + '\n\n---\n' + powerSupplySymbols;
      await conn.execute('UPDATE course_lessons SET content = ? WHERE id = 60017', [updated]);
      console.log('✅ Lesson 60017: Added power supply circuit SVG symbols');
    }
  } catch (e) {
    console.error('Error updating lesson 60017:', e.message);
  }
  
  // 2. Add ladder logic symbols to lesson 60010
  try {
    const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 60010');
    if (rows.length > 0) {
      const updated = rows[0].content + '\n\n---\n' + ladderLogicSymbols;
      await conn.execute('UPDATE course_lessons SET content = ? WHERE id = 60010', [updated]);
      console.log('✅ Lesson 60010: Added ladder logic SVG symbols');
    }
  } catch (e) {
    console.error('Error updating lesson 60010:', e.message);
  }
  
  // 3. Add one-line diagram symbols to lesson 120017
  try {
    const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 120017');
    if (rows.length > 0) {
      const updated = rows[0].content + '\n\n---\n' + oneLineDiagramSymbols;
      await conn.execute('UPDATE course_lessons SET content = ? WHERE id = 120017', [updated]);
      console.log('✅ Lesson 120017: Added one-line diagram SVG symbols');
    }
  } catch (e) {
    console.error('Error updating lesson 120017:', e.message);
  }
  
  await conn.end();
  console.log('\n✅ All power electronics symbol updates complete.');
}

main().catch(console.error);
