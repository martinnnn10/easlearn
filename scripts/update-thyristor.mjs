import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

const svgSection = `

## Schematic Symbols — IEC 60617

The following symbols conform to IEC 60617 standards for thyristor-family devices. Each symbol builds on the basic diode triangle-and-bar, with additional terminals and modifications indicating the specific device type.

### 1. SCR (Silicon Controlled Rectifier)

<div style="text-align:center;margin:2rem 0;">
<svg viewBox="0 0 280 200" style="max-width:320px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Anode lead -->
  <line x1="40" y1="100" x2="100" y2="100" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Triangle (anode) - solid filled -->
  <polygon points="100,70 100,130 150,100" fill="#22c55e" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Cathode bar -->
  <line x1="150" y1="70" x2="150" y2="130" stroke="#22c55e" stroke-width="3"/>
  <!-- Cathode lead -->
  <line x1="150" y1="100" x2="220" y2="100" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Gate lead - angled from cathode bar -->
  <line x1="150" y1="130" x2="180" y2="165" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Gate arrow -->
  <polygon points="175,158 180,165 172,163" fill="#22c55e"/>
  <!-- Terminal labels -->
  <text x="30" y="95" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">A</text>
  <text x="225" y="95" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">K</text>
  <text x="185" y="172" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">G</text>
  <!-- Current direction arrow -->
  <line x1="60" y1="55" x2="90" y2="55" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4,3"/>
  <polygon points="88,51 95,55 88,59" fill="#22c55e"/>
  <text x="55" y="48" fill="#4ade80" font-family="monospace" font-size="10">I (when triggered)</text>
</svg>
</div>

**IEC designation:** Thyristor, reverse-blocking (SCR). Reference designator **V** or **SCR** on prints.

**Terminal identification:** Anode (A) connects to the positive supply through the load. Cathode (K) connects to the return path. Gate (G) receives the trigger pulse from the firing circuit. The gate is positioned at the cathode end of the symbol, indicating that the gate-cathode junction is the control input.

**Operating principle:** Forward-biased (A positive to K) but non-conducting until a gate pulse is applied. Once triggered, the device latches ON and conducts like a standard diode (0.7–1.5V forward drop). Turns off only when anode current drops below holding current (I_H), typically at the AC zero-crossing.

### 2. TRIAC (Triode for Alternating Current)

<div style="text-align:center;margin:2rem 0;">
<svg viewBox="0 0 280 220" style="max-width:320px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- MT1 lead -->
  <line x1="40" y1="100" x2="90" y2="100" stroke="#22c55e" stroke-width="2.5"/>
  <!-- First triangle (MT1 to MT2 direction) -->
  <polygon points="90,75 90,125 130,100" fill="#22c55e" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Second triangle (MT2 to MT1 direction) - antiparallel -->
  <polygon points="170,75 170,125 130,100" fill="#22c55e" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Cathode bars on both sides -->
  <line x1="130" y1="75" x2="130" y2="125" stroke="#22c55e" stroke-width="3"/>
  <!-- MT2 lead -->
  <line x1="170" y1="100" x2="230" y2="100" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Gate lead -->
  <line x1="130" y1="125" x2="155" y2="160" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Gate arrow -->
  <polygon points="150,153 155,160 148,158" fill="#22c55e"/>
  <!-- Terminal labels -->
  <text x="22" y="95" fill="#22c55e" font-family="monospace" font-size="13" font-weight="bold">MT1</text>
  <text x="232" y="95" fill="#22c55e" font-family="monospace" font-size="13" font-weight="bold">MT2</text>
  <text x="158" y="168" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">G</text>
  <!-- Bidirectional current arrows -->
  <line x1="60" y1="55" x2="85" y2="55" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4,3"/>
  <polygon points="83,51 90,55 83,59" fill="#22c55e"/>
  <line x1="200" y1="55" x2="175" y2="55" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4,3"/>
  <polygon points="177,51 170,55 177,59" fill="#22c55e"/>
  <text x="90" y="48" fill="#4ade80" font-family="monospace" font-size="10">Bidirectional</text>
</svg>
</div>

**IEC designation:** Bidirectional triode thyristor (TRIAC). Reference designator **V** or **TR** on prints.

**Terminal identification:** Main Terminal 1 (MT1), Main Terminal 2 (MT2), and Gate (G). Unlike an SCR, a TRIAC has no distinct anode or cathode because it conducts in both directions. The gate is referenced to MT1.

**Operating principle:** Conducts in both directions when triggered. Equivalent to two antiparallel SCRs sharing a common gate. Can be triggered by positive or negative gate pulses relative to MT1. Used for full-wave AC power control. Commutates (turns off) at each AC zero-crossing.

### 3. DIAC (Diode for Alternating Current)

<div style="text-align:center;margin:2rem 0;">
<svg viewBox="0 0 280 180" style="max-width:320px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Terminal 1 lead -->
  <line x1="40" y1="90" x2="90" y2="90" stroke="#22c55e" stroke-width="2.5"/>
  <!-- First triangle -->
  <polygon points="90,65 90,115 130,90" fill="#22c55e" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Second triangle (antiparallel) -->
  <polygon points="170,65 170,115 130,90" fill="#22c55e" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Center bar -->
  <line x1="130" y1="65" x2="130" y2="115" stroke="#22c55e" stroke-width="3"/>
  <!-- Terminal 2 lead -->
  <line x1="170" y1="90" x2="230" y2="90" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Terminal labels -->
  <text x="30" y="85" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">T1</text>
  <text x="233" y="85" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">T2</text>
  <!-- No gate - key distinction -->
  <text x="85" y="145" fill="#4ade80" font-family="monospace" font-size="11">No gate terminal</text>
  <text x="75" y="160" fill="#4ade80" font-family="monospace" font-size="11">Triggers on voltage</text>
</svg>
</div>

**IEC designation:** Bidirectional diode thyristor (DIAC). Reference designator **V** or **D** on prints.

**Terminal identification:** Terminal 1 (T1) and Terminal 2 (T2) only. A DIAC has NO gate terminal — this is the key visual distinction from a TRIAC. The symbol looks like a TRIAC without the gate lead.

**Operating principle:** Conducts in either direction when the voltage across its terminals exceeds the breakover voltage (V_BO), typically 28–36V. Once triggered, it conducts until current drops below holding current. Used almost exclusively as a trigger device for TRIACs in phase-control circuits. The DIAC ensures symmetric firing in both half-cycles.

---

### Identification on Electrical Prints

| Device | Symbol Key Feature | Terminals | Reference Designator |
|--------|-------------------|-----------|---------------------|
| SCR | Single triangle + bar + gate lead at cathode | A, K, G | V, SCR |
| TRIAC | Two antiparallel triangles + center bar + gate | MT1, MT2, G | V, TR |
| DIAC | Two antiparallel triangles + center bar, NO gate | T1, T2 | V, D |

`;

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  
  // Insert SVG section after "### Gate Triggering and Latching" section intro
  // We'll insert before "### Commutation" since that's after the SCR terminals are described
  const [rows] = await conn.execute(
    "SELECT content FROM course_lessons WHERE id = 60016"
  );
  
  let content = rows[0].content;
  
  // Insert the SVG section before "### Commutation" 
  const insertPoint = content.indexOf('### Commutation');
  if (insertPoint === -1) {
    console.error('Could not find insertion point');
    await conn.end();
    process.exit(1);
  }
  
  const newContent = content.slice(0, insertPoint) + svgSection + '\n\n' + content.slice(insertPoint);
  
  await conn.execute(
    "UPDATE course_lessons SET content = ? WHERE id = 60016",
    [newContent]
  );
  
  console.log('Thyristor lesson updated with SVG symbols. New length:', newContent.length);
  await conn.end();
}

main().catch(console.error);
