/**
 * NMTBA EGP-1 Symbol Database Replacement Script
 * 
 * This script replaces all non-compliant hardwired schematic SVGs in the database
 * with NMTBA EGP-1 compliant versions.
 * 
 * CONTEXT RULES:
 * - Lessons 60010-60020: PLC context → DO NOT TOUCH
 * - All other lessons with SVGs: Hardwired schematic context → REPLACE
 * 
 * SOURCE OF TRUTH: NMTBA EGP-1 reference charts (user-uploaded)
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════════
// NMTBA EGP-1 COMPLIANT SVG DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const NMTBA = {
  // Relay Coil — circle with parentheses notation
  relayCoil: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" width="120" height="60">
    <line x1="0" y1="30" x2="30" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="60" cy="30" r="18" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <line x1="78" y1="30" x2="120" y2="30" stroke="currentColor" stroke-width="2.5"/>
  </svg>`,

  // NO Contact — two vertical plates with gap (capacitor style)
  contactNO: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" width="120" height="60">
    <line x1="0" y1="30" x2="45" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="15" x2="45" y2="45" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="15" x2="75" y2="45" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="30" x2="120" y2="30" stroke="currentColor" stroke-width="2.5"/>
  </svg>`,

  // NC Contact — two vertical plates with diagonal slash
  contactNC: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" width="120" height="60">
    <line x1="0" y1="30" x2="45" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="15" x2="45" y2="45" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="15" x2="75" y2="45" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="30" x2="120" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="40" y1="48" x2="80" y2="12" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  // Limit Switch NO — contact plates + angled actuator arm with roller
  limitSwitchNO: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="60" y1="35" x2="45" y2="15" stroke="currentColor" stroke-width="2"/>
    <circle cx="42" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  // Limit Switch NC — contact plates + diagonal slash + angled actuator arm with roller
  limitSwitchNC: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="40" y1="68" x2="80" y2="32" stroke="currentColor" stroke-width="2"/>
    <line x1="60" y1="35" x2="45" y2="15" stroke="currentColor" stroke-width="2"/>
    <circle cx="42" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  // Limit Switch Held Closed — NC with actuator pushed past center
  limitSwitchHeldClosed: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="40" y1="68" x2="80" y2="32" stroke="currentColor" stroke-width="2"/>
    <line x1="60" y1="35" x2="75" y2="15" stroke="currentColor" stroke-width="2"/>
    <circle cx="78" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  // Limit Switch Held Open — NO with actuator pushed past center
  limitSwitchHeldOpen: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="60" y1="35" x2="75" y2="15" stroke="currentColor" stroke-width="2"/>
    <circle cx="78" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  // Pressure Switch NO — contact plates + semicircle actuator
  pressureSwitchNO: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <path d="M 50 35 A 10 10 0 0 1 70 35" fill="none" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  // Pressure Switch NC — contact plates + diagonal + semicircle actuator
  pressureSwitchNC: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="40" y1="68" x2="80" y2="32" stroke="currentColor" stroke-width="2"/>
    <path d="M 50 35 A 10 10 0 0 1 70 35" fill="none" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  // Temperature Switch NO — contact plates + bimetallic wavy actuator
  temperatureSwitchNO: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <path d="M 50 30 Q 55 25, 60 30 Q 65 35, 70 30" fill="none" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  // Temperature Switch NC — contact plates + diagonal + bimetallic wavy actuator
  temperatureSwitchNC: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="40" y1="68" x2="80" y2="32" stroke="currentColor" stroke-width="2"/>
    <path d="M 50 30 Q 55 25, 60 30 Q 65 35, 70 30" fill="none" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  // Flow Switch NO — contact plates + diamond actuator
  flowSwitchNO: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <polygon points="60,18 68,28 60,38 52,28" fill="none" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  // Level Switch NO — contact plates + horizontal bar actuator
  levelSwitchNO: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="48" y1="28" x2="72" y2="28" stroke="currentColor" stroke-width="2"/>
    <line x1="60" y1="28" x2="60" y2="35" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  // Overload — zigzag heater element with NC contact
  overload: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" width="120" height="60">
    <line x1="0" y1="30" x2="25" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <path d="M 25 30 L 35 20 L 45 40 L 55 20 L 65 40 L 75 20 L 85 30" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <line x1="85" y1="30" x2="120" y2="30" stroke="currentColor" stroke-width="2.5"/>
  </svg>`,

  // Overload NC Contact (control circuit) — same as NC contact
  overloadNCContact: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" width="120" height="60">
    <line x1="0" y1="30" x2="45" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="15" x2="45" y2="45" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="15" x2="75" y2="45" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="30" x2="120" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="40" y1="48" x2="80" y2="12" stroke="currentColor" stroke-width="2"/>
    <text x="60" y="58" text-anchor="middle" font-size="8" fill="currentColor">OL</text>
  </svg>`,

  // Disconnect Switch — hinged blade
  disconnectSwitch: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" width="120" height="60">
    <line x1="0" y1="30" x2="40" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="42" cy="30" r="3" fill="currentColor"/>
    <line x1="42" y1="30" x2="78" y2="12" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="80" cy="30" r="3" fill="currentColor"/>
    <line x1="80" y1="30" x2="120" y2="30" stroke="currentColor" stroke-width="2.5"/>
  </svg>`,

  // Fuse — S-curve body
  fuse: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" width="120" height="60">
    <line x1="0" y1="30" x2="35" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <rect x="35" y="22" width="50" height="16" fill="none" stroke="currentColor" stroke-width="2" rx="2"/>
    <line x1="45" y1="30" x2="75" y2="30" stroke="currentColor" stroke-width="1.5"/>
    <line x1="85" y1="30" x2="120" y2="30" stroke="currentColor" stroke-width="2.5"/>
  </svg>`,

  // Motor — circle with M
  motor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="40" y1="0" x2="40" y2="15" stroke="currentColor" stroke-width="2.5"/>
    <line x1="80" y1="0" x2="80" y2="15" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="60" cy="45" r="28" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <text x="60" y="52" text-anchor="middle" font-size="20" font-weight="bold" fill="currentColor">M</text>
  </svg>`,

  // Pushbutton NO — contact plates + button actuator (line pressing down)
  pushbuttonNO: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="60" y1="35" x2="60" y2="18" stroke="currentColor" stroke-width="2"/>
    <circle cx="60" cy="15" r="4" fill="currentColor"/>
  </svg>`,

  // Pushbutton NC — contact plates + diagonal + button actuator
  pushbuttonNC: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="40" y1="68" x2="80" y2="32" stroke="currentColor" stroke-width="2"/>
    <line x1="60" y1="35" x2="60" y2="18" stroke="currentColor" stroke-width="2"/>
    <circle cx="60" cy="15" r="4" fill="currentColor"/>
  </svg>`,

  // E-Stop (NC Mushroom Head) — NC contact + mushroom head actuator
  eStopNC: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="40" y1="68" x2="80" y2="32" stroke="currentColor" stroke-width="2"/>
    <line x1="60" y1="35" x2="60" y2="20" stroke="currentColor" stroke-width="2"/>
    <path d="M 45 20 Q 52 10, 60 10 Q 68 10, 75 20" fill="none" stroke="currentColor" stroke-width="2.5"/>
  </svg>`,

  // Timer TDAE NO (Time Delay After Energize, Normally Open)
  timerTDAE_NO: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <path d="M 50 30 A 10 10 0 0 1 70 30" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="60" y1="30" x2="68" y2="22" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  // Timer TDDE NO (Time Delay After De-Energize, Normally Open)
  timerTDDE_NO: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="50" x2="45" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <line x1="45" y1="35" x2="45" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="35" x2="75" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="75" y1="50" x2="120" y2="50" stroke="currentColor" stroke-width="2.5"/>
    <path d="M 50 30 A 10 10 0 0 0 70 30" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="60" y1="30" x2="68" y2="22" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  // Circuit Breaker — two terminals with arc
  circuitBreaker: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" width="120" height="60">
    <line x1="0" y1="30" x2="40" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="42" cy="30" r="3" fill="currentColor"/>
    <line x1="42" y1="30" x2="72" y2="12" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="80" cy="30" r="3" fill="currentColor"/>
    <line x1="80" y1="30" x2="120" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <path d="M 55 18 Q 60 8, 65 18" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  // Safety Relay (Dual-Channel) — two coils in parallel
  safetyRelay: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 80" width="140" height="80">
    <line x1="0" y1="25" x2="30" y2="25" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="60" cy="25" r="18" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <line x1="78" y1="25" x2="140" y2="25" stroke="currentColor" stroke-width="2.5"/>
    <line x1="0" y1="55" x2="30" y2="55" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="60" cy="55" r="18" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <line x1="78" y1="55" x2="140" y2="55" stroke="currentColor" stroke-width="2.5"/>
    <text x="60" y="29" text-anchor="middle" font-size="10" fill="currentColor">K1</text>
    <text x="60" y="59" text-anchor="middle" font-size="10" fill="currentColor">K2</text>
  </svg>`,

  // Transformer — two coils with core lines
  transformer: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <path d="M 30 15 Q 40 15, 40 25 Q 40 35, 30 35 Q 40 35, 40 45 Q 40 55, 30 55 Q 40 55, 40 65" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <path d="M 90 15 Q 80 15, 80 25 Q 80 35, 90 35 Q 80 35, 80 45 Q 80 55, 90 55 Q 80 55, 80 65" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <line x1="55" y1="12" x2="55" y2="68" stroke="currentColor" stroke-width="2"/>
    <line x1="65" y1="12" x2="65" y2="68" stroke="currentColor" stroke-width="2"/>
    <line x1="0" y1="15" x2="30" y2="15" stroke="currentColor" stroke-width="2.5"/>
    <line x1="0" y1="65" x2="30" y2="65" stroke="currentColor" stroke-width="2.5"/>
    <line x1="90" y1="15" x2="120" y2="15" stroke="currentColor" stroke-width="2.5"/>
    <line x1="90" y1="65" x2="120" y2="65" stroke="currentColor" stroke-width="2.5"/>
  </svg>`,

  // Relay Coil with Flyback Diode — coil + diode across it
  relayCoilFlyback: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
    <line x1="0" y1="30" x2="30" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="60" cy="30" r="18" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <line x1="78" y1="30" x2="120" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="42" y1="55" x2="78" y2="55" stroke="currentColor" stroke-width="1.5"/>
    <polygon points="60,50 55,60 65,60" fill="currentColor" stroke="currentColor" stroke-width="1"/>
    <line x1="42" y1="48" x2="42" y2="62" stroke="currentColor" stroke-width="1.5"/>
    <line x1="78" y1="48" x2="78" y2="62" stroke="currentColor" stroke-width="1.5"/>
    <line x1="42" y1="48" x2="42" y2="30" stroke="currentColor" stroke-width="1"/>
    <line x1="78" y1="48" x2="78" y2="30" stroke="currentColor" stroke-width="1"/>
  </svg>`,
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE UPDATE LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get all hardwired schematic lessons (NOT PLC lessons 60010-60020)
const [lessons] = await conn.execute(
  `SELECT id, slug, title, content FROM course_lessons 
   WHERE content LIKE '%<svg%' 
   AND id NOT BETWEEN 60010 AND 60020
   ORDER BY id`
);

console.log(`Found ${lessons.length} lessons with hardwired schematic SVGs to update`);

let totalReplacements = 0;

for (const lesson of lessons) {
  let content = lesson.content;
  let replacements = 0;
  const originalContent = content;

  // Strategy: Find each SVG block and its preceding label, then replace with NMTBA version
  // The SVGs in the database are preceded by <p> tags with descriptive labels

  // Replace Relay Coil (IEC) — rectangle style → NMTBA circle style
  // The IEC coil is a rectangle, replace with NMTBA circle
  const iecCoilRegex = /<p[^>]*>Relay Coil \(IEC\)<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (iecCoilRegex.test(content)) {
    content = content.replace(iecCoilRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Relay Coil (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.relayCoil}</div>`;
    });
  }

  // Replace Relay Coil (NEMA/JIC) — keep but ensure NMTBA geometry
  const nemaCoilRegex = /<p[^>]*>Relay Coil \(NEMA\/JIC\)<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (nemaCoilRegex.test(content)) {
    content = content.replace(nemaCoilRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Relay Coil (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.relayCoil}</div>`;
    });
  }

  // Replace Relay Coil with Flyback Diode
  const flybackRegex = /<p[^>]*>Relay Coil with Flyback Diode<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (flybackRegex.test(content)) {
    content = content.replace(flybackRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Relay Coil with Flyback Diode (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.relayCoilFlyback}</div>`;
    });
  }

  // Replace NO and NC Relay Contacts
  const contactsRegex = /<p[^>]*>NO and NC Relay Contacts<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (contactsRegex.test(content)) {
    content = content.replace(contactsRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">NO and NC Relay Contacts (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;display:flex;justify-content:space-around;align-items:center;gap:2rem;">
<div style="text-align:center;"><p style="font-size:0.75rem;color:oklch(0.6 0 0);margin-bottom:0.5rem;">NO Contact</p>${NMTBA.contactNO}</div>
<div style="text-align:center;"><p style="font-size:0.75rem;color:oklch(0.6 0 0);margin-bottom:0.5rem;">NC Contact</p>${NMTBA.contactNC}</div>
</div>`;
    });
  }

  // Replace Thermal Overload Relay (IEC) → NMTBA overload
  const overloadIECRegex = /<p[^>]*>Thermal Overload Relay \(IEC\)<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (overloadIECRegex.test(content)) {
    content = content.replace(overloadIECRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Thermal Overload (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.overload}</div>`;
    });
  }

  // Replace Overload NC Contact (Control Circuit)
  const overloadNCRegex = /<p[^>]*>Overload NC Contact \(Control Circuit\)<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (overloadNCRegex.test(content)) {
    content = content.replace(overloadNCRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Overload NC Contact (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.overloadNCContact}</div>`;
    });
  }

  // Replace Limit Switch NO
  const limitNORegex = /<p[^>]*>Limit Switch — Normally Open \(NO\)<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (limitNORegex.test(content)) {
    content = content.replace(limitNORegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Limit Switch — Normally Open (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.limitSwitchNO}</div>`;
    });
  }

  // Replace Limit Switch NC
  const limitNCRegex = /<p[^>]*>Limit Switch — Normally Closed \(NC\)<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (limitNCRegex.test(content)) {
    content = content.replace(limitNCRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Limit Switch — Normally Closed (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.limitSwitchNC}</div>`;
    });
  }

  // Replace Limit Switch Held Closed
  const limitHeldClosedRegex = /<p[^>]*>Limit Switch — Held Closed<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (limitHeldClosedRegex.test(content)) {
    content = content.replace(limitHeldClosedRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Limit Switch — Held Closed (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.limitSwitchHeldClosed}</div>`;
    });
  }

  // Replace Limit Switch Held Open
  const limitHeldOpenRegex = /<p[^>]*>Limit Switch — Held Open<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (limitHeldOpenRegex.test(content)) {
    content = content.replace(limitHeldOpenRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Limit Switch — Held Open (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.limitSwitchHeldOpen}</div>`;
    });
  }

  // Replace E-Stop NC Mushroom Head
  const eStopRegex = /<p[^>]*>Emergency Stop \(E-Stop\) — NC Mushroom Head<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (eStopRegex.test(content)) {
    content = content.replace(eStopRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Emergency Stop (E-Stop) — NC Mushroom Head (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.eStopNC}</div>`;
    });
  }

  // Replace Safety Relay (Dual-Channel)
  const safetyRelayRegex = /<p[^>]*>Safety Relay \(Dual-Channel\)<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (safetyRelayRegex.test(content)) {
    content = content.replace(safetyRelayRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Safety Relay — Dual-Channel (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.safetyRelay}</div>`;
    });
  }

  // Replace Circuit Breaker
  const cbRegex = /<p[^>]*>Circuit Breaker<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (cbRegex.test(content)) {
    content = content.replace(cbRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Circuit Breaker (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.circuitBreaker}</div>`;
    });
  }

  // Replace Disconnect Switch
  const disconnectRegex = /<p[^>]*>Disconnect Switch<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (disconnectRegex.test(content)) {
    content = content.replace(disconnectRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Disconnect Switch (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.disconnectSwitch}</div>`;
    });
  }

  // Replace Fuse
  const fuseRegex = /<p[^>]*>Fuse<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (fuseRegex.test(content)) {
    content = content.replace(fuseRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Fuse (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.fuse}</div>`;
    });
  }

  // Replace Motor (One-Line)
  const motorRegex = /<p[^>]*>Motor \(One-Line\)<\/p>\s*<div[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>/g;
  if (motorRegex.test(content)) {
    content = content.replace(motorRegex, (match) => {
      replacements++;
      return `<p style="color:oklch(0.85 0 0);font-weight:600;margin-bottom:0.75rem;">Motor (NMTBA EGP-1)</p>
<div style="background:oklch(0.13 0.005 250);border:1px solid oklch(0.22 0.008 250);border-radius:8px;padding:1.5rem;text-align:center;">
${NMTBA.motor}</div>`;
    });
  }

  // Now handle lesson 20 which has a different format (table with inline SVGs)
  // and lesson 90010 which has a power components table
  // These need special handling — we'll do them separately below

  if (content !== originalContent) {
    // Update the database
    await conn.execute(
      "UPDATE course_lessons SET content = ? WHERE id = ?",
      [content, lesson.id]
    );
    totalReplacements += replacements;
    console.log(`  Lesson ${lesson.id} (${lesson.title}): ${replacements} SVGs replaced`);
  } else {
    console.log(`  Lesson ${lesson.id} (${lesson.title}): No regex matches (may need special handling)`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIAL HANDLING: Lesson 20 (switch symbols table) and 90010 (power components)
// These have different HTML structures
// ═══════════════════════════════════════════════════════════════════════════════

// Lesson 20: Contains a table with switch symbols
const [lesson20] = await conn.execute(
  "SELECT id, content FROM course_lessons WHERE id = 20"
);

if (lesson20.length > 0) {
  let content = lesson20[0].content;
  const originalContent = content;
  let replacements = 0;

  // In lesson 20, SVGs are inside table cells. We need to find and replace them.
  // The SVGs represent: limit switch NO, limit switch NC, pressure switch, temp switch, etc.
  // Let's find all SVG blocks and replace based on surrounding context
  
  // Generic approach: find all <svg...>...</svg> blocks and replace based on what they contain
  const svgBlockRegex = /<svg[^>]*>[\s\S]*?<\/svg>/g;
  let match;
  const svgBlocks = [];
  while ((match = svgBlockRegex.exec(content)) !== null) {
    svgBlocks.push({ index: match.index, length: match[0].length, svg: match[0] });
  }

  // For lesson 20, look at context before each SVG to determine what it is
  for (let i = svgBlocks.length - 1; i >= 0; i--) {
    const block = svgBlocks[i];
    const contextBefore = content.substring(Math.max(0, block.index - 200), block.index).toLowerCase();
    
    let replacement = null;
    
    if (contextBefore.includes('limit switch') && contextBefore.includes('normally open')) {
      replacement = NMTBA.limitSwitchNO;
      replacements++;
    } else if (contextBefore.includes('limit switch') && contextBefore.includes('normally closed')) {
      replacement = NMTBA.limitSwitchNC;
      replacements++;
    } else if (contextBefore.includes('pressure') && contextBefore.includes('normally open')) {
      replacement = NMTBA.pressureSwitchNO;
      replacements++;
    } else if (contextBefore.includes('pressure') && contextBefore.includes('normally closed')) {
      replacement = NMTBA.pressureSwitchNC;
      replacements++;
    } else if (contextBefore.includes('temperature') && contextBefore.includes('normally open')) {
      replacement = NMTBA.temperatureSwitchNO;
      replacements++;
    } else if (contextBefore.includes('temperature') && contextBefore.includes('normally closed')) {
      replacement = NMTBA.temperatureSwitchNC;
      replacements++;
    } else if (contextBefore.includes('flow') && contextBefore.includes('normally open')) {
      replacement = NMTBA.flowSwitchNO;
      replacements++;
    } else if (contextBefore.includes('level') && contextBefore.includes('normally open')) {
      replacement = NMTBA.levelSwitchNO;
      replacements++;
    } else if (contextBefore.includes('foot') && contextBefore.includes('normally open')) {
      replacement = NMTBA.limitSwitchNO; // foot switch uses same base contact
      replacements++;
    } else if (contextBefore.includes('relay') && contextBefore.includes('coil')) {
      replacement = NMTBA.relayCoil;
      replacements++;
    } else if (contextBefore.includes('no contact') || (contextBefore.includes('normally open') && contextBefore.includes('contact'))) {
      replacement = NMTBA.contactNO;
      replacements++;
    } else if (contextBefore.includes('nc contact') || (contextBefore.includes('normally closed') && contextBefore.includes('contact'))) {
      replacement = NMTBA.contactNC;
      replacements++;
    }

    if (replacement) {
      content = content.substring(0, block.index) + replacement + content.substring(block.index + block.length);
    }
  }

  if (content !== originalContent) {
    await conn.execute("UPDATE course_lessons SET content = ? WHERE id = ?", [content, 20]);
    totalReplacements += replacements;
    console.log(`  Lesson 20 (special handling): ${replacements} SVGs replaced`);
  }
}

// Lesson 90010: Power components table
const [lesson90010] = await conn.execute(
  "SELECT id, content FROM course_lessons WHERE id = 90010"
);

if (lesson90010.length > 0) {
  let content = lesson90010[0].content;
  const originalContent = content;
  let replacements = 0;

  const svgBlockRegex = /<svg[^>]*>[\s\S]*?<\/svg>/g;
  let match;
  const svgBlocks = [];
  while ((match = svgBlockRegex.exec(content)) !== null) {
    svgBlocks.push({ index: match.index, length: match[0].length, svg: match[0] });
  }

  for (let i = svgBlocks.length - 1; i >= 0; i--) {
    const block = svgBlocks[i];
    const contextBefore = content.substring(Math.max(0, block.index - 300), block.index).toLowerCase();
    
    let replacement = null;
    
    if (contextBefore.includes('relay coil') || contextBefore.includes('coil')) {
      replacement = NMTBA.relayCoil;
      replacements++;
    } else if (contextBefore.includes('limit switch')) {
      replacement = NMTBA.limitSwitchNO;
      replacements++;
    } else if (contextBefore.includes('pressure switch') || contextBefore.includes('pressure')) {
      replacement = NMTBA.pressureSwitchNO;
      replacements++;
    }

    if (replacement) {
      content = content.substring(0, block.index) + replacement + content.substring(block.index + block.length);
    }
  }

  if (content !== originalContent) {
    await conn.execute("UPDATE course_lessons SET content = ? WHERE id = ?", [content, 90010]);
    totalReplacements += replacements;
    console.log(`  Lesson 90010 (special handling): ${replacements} SVGs replaced`);
  }
}

console.log(`\n=== COMPLETE: ${totalReplacements} total SVG replacements across all lessons ===`);
await conn.end();
