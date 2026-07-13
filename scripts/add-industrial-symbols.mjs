import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

/**
 * Add IEC 60617 SVG symbols to critical lessons identified in the audit:
 * 1. Lesson 150003 - Reading Electrical Prints Under Pressure (LS, CR, OL symbols)
 * 2. Lesson 20 - Motor Control Circuits & Schematics (full motor control symbol set)
 * 3. Lesson 120016 - Cross-Referencing Contacts and Coils (LS, CR symbols)
 * 4. Lesson 120020 - Reading Safety Circuit Schematics (E-stop, safety relay)
 */

// ============================================================
// IEC 60617 LIMIT SWITCH SVG SYMBOLS
// ============================================================
const limitSwitchSymbols = `

## Limit Switch Symbols — IEC 60617

The following symbols represent standard industrial limit switches per IEC 60617. In ladder diagrams, limit switches are designated **LS** followed by a number (e.g., LS1, LS2).

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin:1.5rem 0;">

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Limit Switch — Normally Open (NO)</p>
<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left terminal -->
  <line x1="20" y1="60" x2="70" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Right terminal -->
  <line x1="130" y1="60" x2="180" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Fixed pivot point -->
  <circle cx="70" cy="60" r="3" fill="#22c55e"/>
  <!-- Moving contact arm (open position - angled up) -->
  <line x1="70" y1="60" x2="130" y2="35" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Actuator (roller) -->
  <line x1="100" y1="20" x2="100" y2="35" stroke="#22c55e" stroke-width="1.5"/>
  <circle cx="100" cy="16" r="5" fill="none" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Terminal dots -->
  <circle cx="130" cy="60" r="3" fill="#22c55e"/>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">IEC: Contact open until actuator is engaged</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Limit Switch — Normally Closed (NC)</p>
<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left terminal -->
  <line x1="20" y1="60" x2="70" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Right terminal -->
  <line x1="130" y1="60" x2="180" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Fixed pivot point -->
  <circle cx="70" cy="60" r="3" fill="#22c55e"/>
  <!-- Moving contact arm (closed position - touching) -->
  <line x1="70" y1="60" x2="130" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Actuator (roller) -->
  <line x1="100" y1="20" x2="100" y2="45" stroke="#22c55e" stroke-width="1.5"/>
  <circle cx="100" cy="16" r="5" fill="none" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Terminal dots -->
  <circle cx="130" cy="60" r="3" fill="#22c55e"/>
  <!-- NC indicator bar -->
  <line x1="85" y1="48" x2="115" y2="48" stroke="#22c55e" stroke-width="1.5"/>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">IEC: Contact closed until actuator is engaged</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Limit Switch — Roller Lever Actuator</p>
<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left terminal -->
  <line x1="20" y1="80" x2="70" y2="80" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Right terminal -->
  <line x1="130" y1="80" x2="180" y2="80" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Fixed pivot point -->
  <circle cx="70" cy="80" r="3" fill="#22c55e"/>
  <!-- Moving contact arm -->
  <line x1="70" y1="80" x2="130" y2="55" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Lever arm extending up -->
  <line x1="100" y1="30" x2="100" y2="55" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Lever pivot -->
  <line x1="85" y1="30" x2="100" y2="30" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Roller at end of lever -->
  <circle cx="85" cy="30" r="6" fill="none" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Mounting bracket -->
  <line x1="100" y1="25" x2="100" y2="15" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="92" y1="15" x2="108" y2="15" stroke="#22c55e" stroke-width="2"/>
  <!-- Terminal dot -->
  <circle cx="130" cy="80" r="3" fill="#22c55e"/>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">Honeywell MICRO SWITCH, Allen-Bradley 802T</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Limit Switch — Plunger Actuator</p>
<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left terminal -->
  <line x1="20" y1="80" x2="70" y2="80" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Right terminal -->
  <line x1="130" y1="80" x2="180" y2="80" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Fixed pivot point -->
  <circle cx="70" cy="80" r="3" fill="#22c55e"/>
  <!-- Moving contact arm -->
  <line x1="70" y1="80" x2="130" y2="55" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Plunger (vertical rod) -->
  <line x1="100" y1="20" x2="100" y2="55" stroke="#22c55e" stroke-width="2"/>
  <!-- Plunger head (flat top) -->
  <line x1="92" y1="20" x2="108" y2="20" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Spring indication -->
  <path d="M 96 30 L 104 35 L 96 40 L 104 45" fill="none" stroke="#22c55e" stroke-width="1"/>
  <!-- Terminal dot -->
  <circle cx="130" cy="80" r="3" fill="#22c55e"/>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">Direct mechanical actuation, spring return</p>
</div>

</div>

### IEC vs NEMA Limit Switch Designation

| Standard | Symbol Designation | Contact Notation | Regional Usage |
|----------|-------------------|-----------------|----------------|
| **IEC 60617** | S + number (S1, S2) | Horizontal bar for NC | International, Europe, Asia |
| **NEMA/JIC** | LS + number (LS1, LS2) | Diagonal slash for NC | North America |

In North American industrial plants, you will encounter NEMA designation (LS1, LS2) on ladder diagrams. The contact symbol geometry is identical — only the text designator differs.
`;

// ============================================================
// RELAY COIL & FLYBACK DIODE SVG SYMBOLS
// ============================================================
const relayCoilSymbols = `

## Control Relay & Suppression Symbols — IEC 60617

### Control Relay Coil

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin:1.5rem 0;">

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Relay Coil (IEC)</p>
<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left lead -->
  <line x1="20" y1="50" x2="65" y2="50" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Coil rectangle -->
  <rect x="65" y="30" width="70" height="40" fill="none" stroke="#22c55e" stroke-width="2.5" rx="2"/>
  <!-- Right lead -->
  <line x1="135" y1="50" x2="180" y2="50" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Designator -->
  <text x="100" y="55" text-anchor="middle" fill="#22c55e" font-size="14" font-family="monospace">K1</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">IEC: Rectangle with designator (K prefix)</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Relay Coil (NEMA/JIC)</p>
<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left lead -->
  <line x1="20" y1="50" x2="70" y2="50" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Coil circle (NEMA style) -->
  <circle cx="100" cy="50" r="20" fill="none" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Right lead -->
  <line x1="120" y1="50" x2="180" y2="50" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Designator -->
  <text x="100" y="55" text-anchor="middle" fill="#22c55e" font-size="12" font-family="monospace">CR1</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">NEMA: Circle with CR designator</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Relay Coil with Flyback Diode</p>
<svg viewBox="0 0 260 140" style="max-width:280px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Power rails -->
  <line x1="30" y1="20" x2="30" y2="120" stroke="#22c55e" stroke-width="2" stroke-dasharray="4,4"/>
  <line x1="230" y1="20" x2="230" y2="120" stroke="#22c55e" stroke-width="2" stroke-dasharray="4,4"/>
  <!-- Top bus connection -->
  <line x1="30" y1="70" x2="80" y2="70" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Coil -->
  <rect x="80" y="50" width="60" height="40" fill="none" stroke="#22c55e" stroke-width="2.5" rx="2"/>
  <text x="110" y="75" text-anchor="middle" fill="#22c55e" font-size="12" font-family="monospace">CR1</text>
  <!-- Bottom bus connection -->
  <line x1="140" y1="70" x2="230" y2="70" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Flyback diode across coil -->
  <!-- Diode anode at bottom (right side of coil) -->
  <line x1="110" y1="95" x2="110" y2="110" stroke="#f59e0b" stroke-width="2"/>
  <line x1="80" y1="110" x2="140" y2="110" stroke="#f59e0b" stroke-width="2"/>
  <line x1="80" y1="110" x2="80" y2="95" stroke="#f59e0b" stroke-width="2"/>
  <!-- Diode triangle -->
  <polygon points="95,105 125,105 110,95" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"/>
  <!-- Cathode bar -->
  <line x1="95" y1="95" x2="125" y2="95" stroke="#f59e0b" stroke-width="2.5"/>
  <!-- Connection to coil terminals -->
  <line x1="80" y1="90" x2="80" y2="95" stroke="#f59e0b" stroke-width="1.5"/>
  <line x1="140" y1="90" x2="140" y2="110" stroke="#f59e0b" stroke-width="1.5"/>
  <line x1="140" y1="110" x2="125" y2="110" stroke="#f59e0b" stroke-width="1.5"/>
  <!-- Labels -->
  <text x="110" y="128" text-anchor="middle" fill="#f59e0b" font-size="10" font-family="monospace">Suppression Diode</text>
  <text x="30" y="15" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="10">L1</text>
  <text x="230" y="15" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="10">L2/N</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">Flyback diode (1N4004) reverse-biased across coil — clamps inductive kick to ~0.7V</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">NO and NC Relay Contacts</p>
<svg viewBox="0 0 280 120" style="max-width:300px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- NO Contact -->
  <text x="70" y="15" text-anchor="middle" fill="oklch(0.7 0 0)" font-size="11">NO Contact</text>
  <line x1="20" y1="40" x2="50" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="50" cy="40" r="3" fill="#22c55e"/>
  <line x1="50" y1="40" x2="90" y2="25" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="90" cy="40" r="3" fill="#22c55e"/>
  <line x1="90" y1="40" x2="120" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <!-- NC Contact -->
  <text x="210" y="15" text-anchor="middle" fill="oklch(0.7 0 0)" font-size="11">NC Contact</text>
  <line x1="160" y1="40" x2="190" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="190" cy="40" r="3" fill="#22c55e"/>
  <line x1="190" y1="40" x2="230" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="230" cy="40" r="3" fill="#22c55e"/>
  <line x1="230" y1="40" x2="260" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <!-- NC bar -->
  <line x1="200" y1="30" x2="220" y2="30" stroke="#22c55e" stroke-width="2"/>
  <!-- Designators -->
  <text x="70" y="65" text-anchor="middle" fill="#22c55e" font-size="10" font-family="monospace">CR1-1 (13-14)</text>
  <text x="210" y="65" text-anchor="middle" fill="#22c55e" font-size="10" font-family="monospace">CR1-2 (11-12)</text>
  <!-- Explanation -->
  <text x="140" y="95" text-anchor="middle" fill="oklch(0.55 0 0)" font-size="9">IEC terminal numbering: NO = 13/14, NC = 11/12</text>
  <text x="140" y="110" text-anchor="middle" fill="oklch(0.55 0 0)" font-size="9">NEMA: NO contact open (gap), NC contact with bar</text>
</svg>
</div>

</div>

### Relay Coil Suppression Methods

| Method | Component | Application | Clamp Voltage |
|--------|-----------|-------------|---------------|
| **Flyback Diode** | 1N4004, 1N4148 | DC coils only | V_coil + 0.7V |
| **RC Snubber** | 100Ω + 0.1µF | AC or DC coils | Gradual decay |
| **MOV (Varistor)** | V130LA2, V275LA4 | AC coils, high-energy | Clamped at rated V |
| **Zener + Diode** | 1N4004 + 1N5245 | DC coils, fast release | V_coil + V_zener |

**Why suppression matters:** When a relay coil de-energizes, the collapsing magnetic field generates a voltage spike (back-EMF) that can reach 10-40× the supply voltage. This spike damages transistor outputs, PLC output modules, and creates electrical noise that corrupts communications.
`;

// ============================================================
// OVERLOAD RELAY SYMBOL
// ============================================================
const overloadSymbol = `

## Overload Relay Symbol — IEC 60617

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;margin:1.5rem 0;">

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Thermal Overload Relay (IEC)</p>
<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left lead -->
  <line x1="20" y1="60" x2="60" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Heater element (zigzag) -->
  <polyline points="60,60 70,45 80,75 90,45 100,75 110,45 120,75 130,60" fill="none" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Right lead -->
  <line x1="130" y1="60" x2="180" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Bimetallic trip indicator -->
  <line x1="95" y1="80" x2="95" y2="100" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="95" y="115" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">Trip</text>
  <!-- Designator -->
  <text x="95" y="30" text-anchor="middle" fill="#22c55e" font-size="12" font-family="monospace">OL</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">Heater element (zigzag) in power circuit</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Overload NC Contact (Control Circuit)</p>
<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left lead -->
  <line x1="20" y1="50" x2="60" y2="50" stroke="#22c55e" stroke-width="2.5"/>
  <!-- NC contact -->
  <circle cx="60" cy="50" r="3" fill="#22c55e"/>
  <line x1="60" y1="50" x2="140" y2="50" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="140" cy="50" r="3" fill="#22c55e"/>
  <!-- NC bar -->
  <line x1="85" y1="38" x2="115" y2="38" stroke="#22c55e" stroke-width="2"/>
  <!-- Right lead -->
  <line x1="140" y1="50" x2="180" y2="50" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Thermal link indicator -->
  <line x1="100" y1="55" x2="100" y2="75" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="100" y="88" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">From heater</text>
  <!-- Designator -->
  <text x="100" y="25" text-anchor="middle" fill="#22c55e" font-size="12" font-family="monospace">OL (95-96)</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">NC contact opens on thermal trip (IEC terminals 95-96)</p>
</div>

</div>
`;

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  
  // 1. Add limit switch + relay symbols to lesson 150003 (Reading Electrical Prints Under Pressure)
  try {
    const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 150003');
    if (rows.length > 0) {
      const content = rows[0].content;
      // Append the symbol sections
      const updated = content + '\n\n---\n' + limitSwitchSymbols + '\n' + relayCoilSymbols + '\n' + overloadSymbol;
      await conn.execute('UPDATE course_lessons SET content = ? WHERE id = 150003', [updated]);
      console.log('✅ Lesson 150003: Added limit switch, relay coil, and overload SVG symbols');
    }
  } catch (e) {
    console.error('Error updating lesson 150003:', e.message);
  }
  
  // 2. Add relay/overload symbols to lesson 120016 (Cross-Referencing Contacts and Coils)
  try {
    const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 120016');
    if (rows.length > 0) {
      const content = rows[0].content;
      const updated = content + '\n\n---\n' + relayCoilSymbols;
      await conn.execute('UPDATE course_lessons SET content = ? WHERE id = 120016', [updated]);
      console.log('✅ Lesson 120016: Added relay coil and contact SVG symbols');
    }
  } catch (e) {
    console.error('Error updating lesson 120016:', e.message);
  }
  
  // 3. Add limit switch symbols to lesson 120020 (Reading Safety Circuit Schematics)
  try {
    const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 120020');
    if (rows.length > 0) {
      const content = rows[0].content;
      // Add safety-specific symbols
      const safetySymbols = `

## Safety Circuit Symbols — IEC 60617 / ISO 13849

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin:1.5rem 0;">

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Emergency Stop (E-Stop) — NC Mushroom Head</p>
<svg viewBox="0 0 220 130" style="max-width:240px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left terminal -->
  <line x1="20" y1="80" x2="70" y2="80" stroke="#ef4444" stroke-width="2.5"/>
  <!-- Right terminal -->
  <line x1="150" y1="80" x2="200" y2="80" stroke="#ef4444" stroke-width="2.5"/>
  <!-- NC contact (closed) -->
  <circle cx="70" cy="80" r="3" fill="#ef4444"/>
  <line x1="70" y1="80" x2="150" y2="80" stroke="#ef4444" stroke-width="2.5"/>
  <circle cx="150" cy="80" r="3" fill="#ef4444"/>
  <!-- NC bar -->
  <line x1="95" y1="68" x2="125" y2="68" stroke="#ef4444" stroke-width="2"/>
  <!-- Mushroom head actuator -->
  <line x1="110" y1="68" x2="110" y2="45" stroke="#ef4444" stroke-width="2"/>
  <!-- Mushroom cap -->
  <path d="M 85 45 Q 85 25 110 25 Q 135 25 135 45 Z" fill="none" stroke="#ef4444" stroke-width="2.5"/>
  <!-- Latch indicator (maintained) -->
  <line x1="105" y1="55" x2="115" y2="55" stroke="#ef4444" stroke-width="1.5"/>
  <line x1="105" y1="55" x2="105" y2="60" stroke="#ef4444" stroke-width="1.5"/>
  <!-- Labels -->
  <text x="110" y="105" text-anchor="middle" fill="#ef4444" font-size="10" font-family="monospace">E-STOP (NC, maintained)</text>
  <text x="110" y="120" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">IEC terminals: 11-12 (NC)</text>
</svg>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Safety Relay (Dual-Channel)</p>
<svg viewBox="0 0 240 140" style="max-width:260px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Safety relay box -->
  <rect x="50" y="20" width="140" height="100" fill="none" stroke="#f59e0b" stroke-width="2.5" rx="4"/>
  <!-- Channel 1 input -->
  <line x1="20" y1="45" x2="50" y2="45" stroke="#22c55e" stroke-width="2"/>
  <text x="60" y="48" fill="oklch(0.7 0 0)" font-size="9">CH1</text>
  <!-- Channel 2 input -->
  <line x1="20" y1="75" x2="50" y2="75" stroke="#22c55e" stroke-width="2"/>
  <text x="60" y="78" fill="oklch(0.7 0 0)" font-size="9">CH2</text>
  <!-- Reset input -->
  <line x1="20" y1="105" x2="50" y2="105" stroke="#22c55e" stroke-width="2"/>
  <text x="60" y="108" fill="oklch(0.7 0 0)" font-size="9">RST</text>
  <!-- Safety outputs -->
  <line x1="190" y1="45" x2="220" y2="45" stroke="#ef4444" stroke-width="2"/>
  <text x="170" y="48" fill="oklch(0.7 0 0)" font-size="9">S13</text>
  <line x1="190" y1="75" x2="220" y2="75" stroke="#ef4444" stroke-width="2"/>
  <text x="170" y="78" fill="oklch(0.7 0 0)" font-size="9">S23</text>
  <!-- Aux output -->
  <line x1="190" y1="105" x2="220" y2="105" stroke="#22c55e" stroke-width="2"/>
  <text x="170" y="108" fill="oklch(0.7 0 0)" font-size="9">AUX</text>
  <!-- Internal designation -->
  <text x="120" y="70" text-anchor="middle" fill="#f59e0b" font-size="11" font-family="monospace">SAFETY</text>
  <text x="120" y="85" text-anchor="middle" fill="#f59e0b" font-size="11" font-family="monospace">RELAY</text>
  <!-- Category label -->
  <text x="120" y="135" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">Pilz PNOZ, Allen-Bradley 440R</text>
</svg>
</div>

</div>
`;
      const updated = content + '\n\n---\n' + safetySymbols + '\n' + limitSwitchSymbols;
      await conn.execute('UPDATE course_lessons SET content = ? WHERE id = 120020', [updated]);
      console.log('✅ Lesson 120020: Added safety circuit SVG symbols (E-stop, safety relay, limit switches)');
    }
  } catch (e) {
    console.error('Error updating lesson 120020:', e.message);
  }
  
  // 4. Add motor control symbols to lesson 20 (Motor Control Circuits & Schematics)
  try {
    const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 20');
    if (rows.length > 0) {
      const content = rows[0].content;
      const motorSymbols = `

## Motor Control Schematic Symbols — IEC 60617

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;margin:1.5rem 0;">

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Three-Phase Motor</p>
<svg viewBox="0 0 160 160" style="max-width:160px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Motor circle -->
  <circle cx="80" cy="80" r="35" fill="none" stroke="#22c55e" stroke-width="2.5"/>
  <!-- M designation -->
  <text x="80" y="85" text-anchor="middle" fill="#22c55e" font-size="20" font-family="serif">M</text>
  <!-- 3~ indicator -->
  <text x="80" y="100" text-anchor="middle" fill="#22c55e" font-size="10">3~</text>
  <!-- Three-phase leads -->
  <line x1="55" y1="20" x2="55" y2="45" stroke="#22c55e" stroke-width="2"/>
  <line x1="80" y1="15" x2="80" y2="45" stroke="#22c55e" stroke-width="2"/>
  <line x1="105" y1="20" x2="105" y2="45" stroke="#22c55e" stroke-width="2"/>
  <!-- Terminal labels -->
  <text x="55" y="14" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">T1</text>
  <text x="80" y="10" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">T2</text>
  <text x="105" y="14" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">T3</text>
  <!-- Ground -->
  <line x1="80" y1="115" x2="80" y2="135" stroke="#22c55e" stroke-width="2"/>
  <line x1="65" y1="135" x2="95" y2="135" stroke="#22c55e" stroke-width="2"/>
  <line x1="70" y1="140" x2="90" y2="140" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="75" y1="145" x2="85" y2="145" stroke="#22c55e" stroke-width="1"/>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">IEC: Circle with M, 3~ for three-phase</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Contactor (Main Contacts)</p>
<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Three-phase power contacts -->
  <!-- Phase A -->
  <line x1="40" y1="20" x2="40" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="40" cy="40" r="3" fill="#22c55e"/>
  <line x1="40" y1="40" x2="40" y2="55" stroke="#22c55e" stroke-width="2.5"/>
  <line x1="40" y1="55" x2="50" y2="65" stroke="#22c55e" stroke-width="2.5" stroke-dasharray="4,2"/>
  <circle cx="40" cy="70" r="3" fill="#22c55e"/>
  <line x1="40" y1="70" x2="40" y2="100" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Phase B -->
  <line x1="100" y1="20" x2="100" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="100" cy="40" r="3" fill="#22c55e"/>
  <line x1="100" y1="40" x2="100" y2="55" stroke="#22c55e" stroke-width="2.5"/>
  <line x1="100" y1="55" x2="110" y2="65" stroke="#22c55e" stroke-width="2.5" stroke-dasharray="4,2"/>
  <circle cx="100" cy="70" r="3" fill="#22c55e"/>
  <line x1="100" y1="70" x2="100" y2="100" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Phase C -->
  <line x1="160" y1="20" x2="160" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="160" cy="40" r="3" fill="#22c55e"/>
  <line x1="160" y1="40" x2="160" y2="55" stroke="#22c55e" stroke-width="2.5"/>
  <line x1="160" y1="55" x2="170" y2="65" stroke="#22c55e" stroke-width="2.5" stroke-dasharray="4,2"/>
  <circle cx="160" cy="70" r="3" fill="#22c55e"/>
  <line x1="160" y1="70" x2="160" y2="100" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Mechanical link (dashed line between contacts) -->
  <line x1="40" y1="55" x2="160" y2="55" stroke="#22c55e" stroke-width="1" stroke-dasharray="3,3"/>
  <!-- Labels -->
  <text x="40" y="14" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">L1</text>
  <text x="100" y="14" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">L2</text>
  <text x="160" y="14" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">L3</text>
  <text x="40" y="112" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">T1</text>
  <text x="100" y="112" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">T2</text>
  <text x="160" y="112" text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">T3</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">IEC designation: K (e.g., K1, KM1 for motor contactor)</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Pushbutton — NO (Start)</p>
<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left lead -->
  <line x1="20" y1="60" x2="70" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Right lead -->
  <line x1="130" y1="60" x2="180" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Contact gap (NO) -->
  <circle cx="70" cy="60" r="3" fill="#22c55e"/>
  <line x1="70" y1="60" x2="130" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="130" cy="60" r="3" fill="#22c55e"/>
  <!-- Pushbutton actuator -->
  <line x1="100" y1="25" x2="100" y2="40" stroke="#22c55e" stroke-width="2"/>
  <line x1="88" y1="25" x2="112" y2="25" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Designator -->
  <text x="100" y="85" text-anchor="middle" fill="#22c55e" font-size="10" font-family="monospace">PB1 (Start)</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">Momentary NO — closes only while pressed</p>
</div>

<div style="background:oklch(0.14 0.004 250);border:1px solid oklch(0.22 0.006 250);border-radius:8px;padding:1.25rem;text-align:center;">
<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Pushbutton — NC (Stop)</p>
<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Left lead -->
  <line x1="20" y1="60" x2="70" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Right lead -->
  <line x1="130" y1="60" x2="180" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Contact (NC - closed) -->
  <circle cx="70" cy="60" r="3" fill="#22c55e"/>
  <line x1="70" y1="60" x2="130" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="130" cy="60" r="3" fill="#22c55e"/>
  <!-- NC bar -->
  <line x1="90" y1="48" x2="110" y2="48" stroke="#22c55e" stroke-width="2"/>
  <!-- Pushbutton actuator -->
  <line x1="100" y1="35" x2="100" y2="48" stroke="#22c55e" stroke-width="2"/>
  <line x1="88" y1="35" x2="112" y2="35" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Designator -->
  <text x="100" y="85" text-anchor="middle" fill="#ef4444" font-size="10" font-family="monospace">PB2 (Stop)</text>
</svg>
<p style="color:oklch(0.6 0 0);font-size:0.8rem;margin-top:0.5rem;">Momentary NC — opens only while pressed (fail-safe)</p>
</div>

</div>
`;
      const updated = content + '\n\n---\n' + motorSymbols + '\n' + overloadSymbol + '\n' + limitSwitchSymbols;
      await conn.execute('UPDATE course_lessons SET content = ? WHERE id = 20', [updated]);
      console.log('✅ Lesson 20: Added motor, contactor, pushbutton, overload, and limit switch SVG symbols');
    }
  } catch (e) {
    console.error('Error updating lesson 20:', e.message);
  }
  
  // 5. Add symbols to lesson 60020 (HVAC Motor Controls & Starters)
  try {
    const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 60020');
    if (rows.length > 0) {
      const content = rows[0].content;
      const updated = content + '\n\n---\n' + overloadSymbol + '\n' + relayCoilSymbols;
      await conn.execute('UPDATE course_lessons SET content = ? WHERE id = 60020', [updated]);
      console.log('✅ Lesson 60020: Added overload and relay coil SVG symbols');
    }
  } catch (e) {
    console.error('Error updating lesson 60020:', e.message);
  }
  
  // 6. Add symbols to lesson 90011 (Panel Layout Drawings & Wire Tracing)
  try {
    const [rows] = await conn.execute('SELECT content FROM course_lessons WHERE id = 90011');
    if (rows.length > 0) {
      const content = rows[0].content;
      const updated = content + '\n\n---\n' + relayCoilSymbols + '\n' + overloadSymbol;
      await conn.execute('UPDATE course_lessons SET content = ? WHERE id = 90011', [updated]);
      console.log('✅ Lesson 90011: Added relay coil and overload SVG symbols');
    }
  } catch (e) {
    console.error('Error updating lesson 90011:', e.message);
  }
  
  await conn.end();
  console.log('\n✅ All industrial symbol updates complete.');
}

main().catch(console.error);
