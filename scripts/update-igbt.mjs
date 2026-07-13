import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

const svgSection = `

## Schematic Symbols — IEC 60617

### IGBT (Insulated Gate Bipolar Transistor)

<div style="text-align:center;margin:2rem 0;">
<svg viewBox="0 0 300 240" style="max-width:340px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- Collector lead -->
  <line x1="150" y1="20" x2="150" y2="60" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Collector arrow (current direction into collector) -->
  <polygon points="145,55 150,42 155,55" fill="#22c55e"/>
  <!-- Vertical channel line -->
  <line x1="150" y1="60" x2="150" y2="160" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Emitter lead -->
  <line x1="150" y1="160" x2="150" y2="220" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Gate insulation line (vertical, offset left) - the MOSFET gate -->
  <line x1="100" y1="80" x2="100" y2="140" stroke="#22c55e" stroke-width="3"/>
  <!-- Gate oxide gap (insulation indicator) -->
  <line x1="110" y1="80" x2="110" y2="140" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="0"/>
  <!-- Gate lead (horizontal) -->
  <line x1="40" y1="110" x2="100" y2="110" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Connection from channel to collector -->
  <line x1="110" y1="85" x2="150" y2="85" stroke="#22c55e" stroke-width="2"/>
  <!-- Connection from channel to emitter -->
  <line x1="110" y1="135" x2="150" y2="135" stroke="#22c55e" stroke-width="2"/>
  <!-- Emitter arrow (BJT-style, pointing outward) -->
  <polygon points="140,145 150,160 130,155" fill="#22c55e"/>
  <!-- Integrated freewheeling diode (antiparallel) -->
  <line x1="175" y1="90" x2="175" y2="130" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4,3"/>
  <polygon points="165,105 185,105 175,125" fill="none" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="165" y1="125" x2="185" y2="125" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Terminal labels -->
  <text x="155" y="18" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">C</text>
  <text x="155" y="232" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">E</text>
  <text x="22" y="115" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">G</text>
  <!-- Freewheeling diode label -->
  <text x="192" y="115" fill="#4ade80" font-family="monospace" font-size="10">FWD</text>
</svg>
</div>

**IEC designation:** Insulated Gate Bipolar Transistor. Reference designator **Q** or **IGBT** on prints.

**Terminal identification:**
- **Gate (G):** Voltage-controlled input. Requires +15V (relative to Emitter) to turn ON, 0V or −8V to turn OFF. Draws virtually zero steady-state current — controlled by voltage, not current.
- **Collector (C):** High-voltage terminal connected to the DC bus (positive rail in upper devices, load in lower devices).
- **Emitter (E):** Return terminal. The arrow on the emitter indicates conventional current flow direction (out of the device when conducting).

**Integrated Freewheeling Diode (FWD):** Shown dashed in the symbol. In VFD IGBT modules, an antiparallel fast-recovery diode is co-packaged with each IGBT. This diode provides a path for inductive motor current during PWM dead-time and regenerative braking. When testing an IGBT module with a multimeter in diode mode, you will measure this diode (approximately 0.4–0.5V forward drop from E to C).

### IGBT Module — Six-Pack Configuration (3-Phase Inverter)

<div style="text-align:center;margin:2rem 0;">
<svg viewBox="0 0 400 280" style="max-width:420px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
  <!-- DC Bus + rail -->
  <line x1="30" y1="40" x2="370" y2="40" stroke="#22c55e" stroke-width="2.5"/>
  <text x="375" y="45" fill="#22c55e" font-family="monospace" font-size="12" font-weight="bold">DC+</text>
  <!-- DC Bus - rail -->
  <line x1="30" y1="240" x2="370" y2="240" stroke="#22c55e" stroke-width="2.5"/>
  <text x="375" y="245" fill="#22c55e" font-family="monospace" font-size="12" font-weight="bold">DC−</text>
  <!-- Phase U -->
  <line x1="100" y1="40" x2="100" y2="90" stroke="#22c55e" stroke-width="2"/>
  <rect x="85" y="90" width="30" height="40" fill="none" stroke="#22c55e" stroke-width="2" rx="3"/>
  <text x="95" y="115" fill="#22c55e" font-family="monospace" font-size="10">Q1</text>
  <line x1="100" y1="130" x2="100" y2="150" stroke="#22c55e" stroke-width="2"/>
  <circle cx="100" cy="150" r="4" fill="#22c55e"/>
  <line x1="100" y1="150" x2="100" y2="170" stroke="#22c55e" stroke-width="2"/>
  <rect x="85" y="170" width="30" height="40" fill="none" stroke="#22c55e" stroke-width="2" rx="3"/>
  <text x="95" y="195" fill="#22c55e" font-family="monospace" font-size="10">Q2</text>
  <line x1="100" y1="210" x2="100" y2="240" stroke="#22c55e" stroke-width="2"/>
  <!-- Phase U output -->
  <line x1="100" y1="150" x2="100" y2="150" stroke="#22c55e" stroke-width="2"/>
  <line x1="100" y1="150" x2="55" y2="150" stroke="#22c55e" stroke-width="2"/>
  <text x="30" y="155" fill="#4ade80" font-family="monospace" font-size="12" font-weight="bold">U</text>
  <!-- Phase V -->
  <line x1="200" y1="40" x2="200" y2="90" stroke="#22c55e" stroke-width="2"/>
  <rect x="185" y="90" width="30" height="40" fill="none" stroke="#22c55e" stroke-width="2" rx="3"/>
  <text x="195" y="115" fill="#22c55e" font-family="monospace" font-size="10">Q3</text>
  <line x1="200" y1="130" x2="200" y2="150" stroke="#22c55e" stroke-width="2"/>
  <circle cx="200" cy="150" r="4" fill="#22c55e"/>
  <line x1="200" y1="150" x2="200" y2="170" stroke="#22c55e" stroke-width="2"/>
  <rect x="185" y="170" width="30" height="40" fill="none" stroke="#22c55e" stroke-width="2" rx="3"/>
  <text x="195" y="195" fill="#22c55e" font-family="monospace" font-size="10">Q4</text>
  <line x1="200" y1="210" x2="200" y2="240" stroke="#22c55e" stroke-width="2"/>
  <!-- Phase V output -->
  <line x1="200" y1="150" x2="200" y2="150" stroke="#22c55e" stroke-width="2"/>
  <line x1="200" y1="150" x2="155" y2="150" stroke="#22c55e" stroke-width="2" stroke-dasharray="4,3"/>
  <text x="140" y="155" fill="#4ade80" font-family="monospace" font-size="12" font-weight="bold">V</text>
  <!-- Phase W -->
  <line x1="300" y1="40" x2="300" y2="90" stroke="#22c55e" stroke-width="2"/>
  <rect x="285" y="90" width="30" height="40" fill="none" stroke="#22c55e" stroke-width="2" rx="3"/>
  <text x="295" y="115" fill="#22c55e" font-family="monospace" font-size="10">Q5</text>
  <line x1="300" y1="130" x2="300" y2="150" stroke="#22c55e" stroke-width="2"/>
  <circle cx="300" cy="150" r="4" fill="#22c55e"/>
  <line x1="300" y1="150" x2="300" y2="170" stroke="#22c55e" stroke-width="2"/>
  <rect x="285" y="170" width="30" height="40" fill="none" stroke="#22c55e" stroke-width="2" rx="3"/>
  <text x="295" y="195" fill="#22c55e" font-family="monospace" font-size="10">Q6</text>
  <line x1="300" y1="210" x2="300" y2="240" stroke="#22c55e" stroke-width="2"/>
  <!-- Phase W output -->
  <line x1="300" y1="150" x2="345" y2="150" stroke="#22c55e" stroke-width="2"/>
  <text x="350" y="155" fill="#4ade80" font-family="monospace" font-size="12" font-weight="bold">W</text>
  <!-- Labels -->
  <text x="130" y="270" fill="#4ade80" font-family="monospace" font-size="11">3-Phase IGBT Inverter Bridge</text>
</svg>
</div>

**Six-Pack Module:** In VFDs, six IGBTs are arranged in three half-bridge legs (U, V, W). Each leg has an upper device (connected to DC+) and a lower device (connected to DC−). The midpoint of each leg connects to one motor phase. The gate driver board fires each IGBT in a specific PWM pattern to synthesize three-phase AC from the DC bus.

**Maintenance significance:** When a drive faults on "IGBT Desaturation" or "Overcurrent," you need to identify which of the six IGBTs has failed. Testing is done with the drive powered down using a multimeter in diode mode, checking the C-E path and the integrated freewheeling diode of each device individually.

---

### Multimeter Testing Procedure for IGBT Modules

| Test | Probe Placement | Expected (Healthy) | Failed Short | Failed Open |
|------|----------------|--------------------|--------------|----|
| FWD Forward | Red→E, Black→C | 0.3–0.6V | 0.000V (short) | OL |
| FWD Reverse | Red→C, Black→E | OL | 0.000V (short) | OL |
| Gate-Emitter | Red→G, Black→E | OL (both directions) | 0.000V | OL |
| Gate-Collector | Red→G, Black→C | OL (both directions) | 0.000V | OL |

**Critical note:** Before testing, discharge the DC bus capacitors and verify 0VDC with a meter. IGBT modules store lethal energy even after power is removed.

`;

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  
  const [rows] = await conn.execute(
    "SELECT content FROM course_lessons WHERE id = 60015"
  );
  
  let content = rows[0].content;
  
  // Insert after "### Switching Characteristics" section - find the next ## heading after it
  const switchingIdx = content.indexOf('### Switching Characteristics');
  if (switchingIdx === -1) {
    console.error('Could not find Switching Characteristics section');
    await conn.end();
    process.exit(1);
  }
  
  // Find the next ## heading after Switching Characteristics
  const afterSwitching = content.indexOf('\n## ', switchingIdx + 30);
  let insertPoint;
  if (afterSwitching !== -1) {
    insertPoint = afterSwitching;
  } else {
    // Insert before the end
    insertPoint = content.length;
  }
  
  const newContent = content.slice(0, insertPoint) + '\n' + svgSection + '\n' + content.slice(insertPoint);
  
  await conn.execute(
    "UPDATE course_lessons SET content = ? WHERE id = 60015",
    [newContent]
  );
  
  console.log('IGBT lesson updated with SVG symbols. New length:', newContent.length);
  await conn.end();
}

main().catch(console.error);
