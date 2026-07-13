/**
 * NMTBA EGP-1 Symbol Database Replacement Script v2
 * 
 * Fixed regex patterns to match actual HTML structure:
 * The SVGs are preceded by <p> labels INSIDE the same container div, not before it.
 * Pattern: <p style="...">Label</p>\n<svg ...>...</svg>
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════════
// NMTBA EGP-1 COMPLIANT SVG DEFINITIONS (same viewBox as originals for drop-in)
// ═══════════════════════════════════════════════════════════════════════════════

const NMTBA = {
  relayCoil: `<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="50" x2="60" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <circle cx="100" cy="50" r="28" fill="none" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="128" y1="50" x2="190" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
  </svg>`,

  contactNO: `<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="50" x2="75" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="75" y1="25" x2="75" y2="75" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="125" y1="25" x2="125" y2="75" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="125" y1="50" x2="190" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
  </svg>`,

  contactNC: `<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="50" x2="75" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="75" y1="25" x2="75" y2="75" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="125" y1="25" x2="125" y2="75" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="125" y1="50" x2="190" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="65" y1="80" x2="135" y2="20" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
  </svg>`,

  contactNOandNC: `<svg viewBox="0 0 280 120" style="max-width:300px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <!-- NO Contact -->
    <line x1="10" y1="40" x2="50" y2="40" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="50" y1="20" x2="50" y2="60" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="90" y1="20" x2="90" y2="60" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="90" y1="40" x2="130" y2="40" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <text x="70" y="80" text-anchor="middle" font-size="12" fill="oklch(0.6 0 0)">NO</text>
    <!-- NC Contact -->
    <line x1="150" y1="40" x2="190" y2="40" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="190" y1="20" x2="190" y2="60" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="230" y1="20" x2="230" y2="60" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="230" y1="40" x2="270" y2="40" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="183" y1="65" x2="237" y2="15" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
    <text x="210" y="80" text-anchor="middle" font-size="12" fill="oklch(0.6 0 0)">NC</text>
  </svg>`,

  limitSwitchNO: `<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="70" x2="70" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="70" y1="50" x2="70" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="50" x2="130" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="70" x2="190" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="100" y1="50" x2="75" y2="25" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
    <circle cx="72" cy="20" r="5" fill="none" stroke="oklch(0.85 0 0)" stroke-width="2"/>
  </svg>`,

  limitSwitchNC: `<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="70" x2="70" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="70" y1="50" x2="70" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="50" x2="130" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="70" x2="190" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="62" y1="95" x2="138" y2="45" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
    <line x1="100" y1="50" x2="75" y2="25" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
    <circle cx="72" cy="20" r="5" fill="none" stroke="oklch(0.85 0 0)" stroke-width="2"/>
  </svg>`,

  limitSwitchHeldClosed: `<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="70" x2="70" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="70" y1="50" x2="70" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="50" x2="130" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="70" x2="190" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="62" y1="95" x2="138" y2="45" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
    <line x1="100" y1="50" x2="125" y2="25" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
    <circle cx="128" cy="20" r="5" fill="none" stroke="oklch(0.85 0 0)" stroke-width="2"/>
  </svg>`,

  limitSwitchHeldOpen: `<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="70" x2="70" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="70" y1="50" x2="70" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="50" x2="130" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="70" x2="190" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="100" y1="50" x2="125" y2="25" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
    <circle cx="128" cy="20" r="5" fill="none" stroke="oklch(0.85 0 0)" stroke-width="2"/>
  </svg>`,

  pressureSwitchNO: `<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="70" x2="70" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="70" y1="50" x2="70" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="50" x2="130" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="70" x2="190" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <path d="M 80 48 A 20 20 0 0 1 120 48" fill="none" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
  </svg>`,

  temperatureSwitchNO: `<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="70" x2="70" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="70" y1="50" x2="70" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="50" x2="130" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="70" x2="190" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <path d="M 78 42 Q 88 32, 100 42 Q 112 52, 122 42" fill="none" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
  </svg>`,

  overload: `<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="60" x2="45" y2="60" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <path d="M 45 60 L 60 40 L 75 80 L 90 40 L 105 80 L 120 40 L 135 60" fill="none" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="135" y1="60" x2="190" y2="60" stroke="oklch(0.85 0 0)" stroke-width="3"/>
  </svg>`,

  overloadNCContact: `<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="50" x2="75" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="75" y1="25" x2="75" y2="75" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="125" y1="25" x2="125" y2="75" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="125" y1="50" x2="190" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="65" y1="80" x2="135" y2="20" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
    <text x="100" y="95" text-anchor="middle" font-size="11" fill="oklch(0.6 0 0)">OL</text>
  </svg>`,

  disconnectSwitch: `<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="50" x2="70" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <circle cx="73" cy="50" r="4" fill="oklch(0.85 0 0)"/>
    <line x1="73" y1="50" x2="127" y2="25" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <circle cx="130" cy="50" r="4" fill="oklch(0.85 0 0)"/>
    <line x1="130" y1="50" x2="190" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
  </svg>`,

  fuse: `<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="50" x2="60" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <rect x="60" y="35" width="80" height="30" fill="none" stroke="oklch(0.85 0 0)" stroke-width="2.5" rx="3"/>
    <line x1="75" y1="50" x2="125" y2="50" stroke="oklch(0.85 0 0)" stroke-width="2"/>
    <line x1="140" y1="50" x2="190" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
  </svg>`,

  motor: `<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="70" y1="5" x2="70" y2="25" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="5" x2="130" y2="25" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <circle cx="100" cy="65" r="38" fill="none" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <text x="100" y="75" text-anchor="middle" font-size="28" font-weight="bold" fill="oklch(0.85 0 0)">M</text>
  </svg>`,

  relayCoilFlyback: `<svg viewBox="0 0 260 140" style="max-width:280px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="50" x2="70" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <circle cx="130" cy="50" r="28" fill="none" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="158" y1="50" x2="250" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <!-- Flyback diode across coil -->
    <line x1="90" y1="95" x2="170" y2="95" stroke="oklch(0.85 0 0)" stroke-width="2"/>
    <polygon points="130,85 120,105 140,105" fill="oklch(0.85 0 0)"/>
    <line x1="90" y1="78" x2="90" y2="112" stroke="oklch(0.85 0 0)" stroke-width="2"/>
    <line x1="170" y1="78" x2="170" y2="112" stroke="oklch(0.85 0 0)" stroke-width="2"/>
    <line x1="90" y1="78" x2="90" y2="50" stroke="oklch(0.85 0 0)" stroke-width="1.5"/>
    <line x1="170" y1="78" x2="170" y2="50" stroke="oklch(0.85 0 0)" stroke-width="1.5"/>
  </svg>`,

  eStopNC: `<svg viewBox="0 0 200 120" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="70" x2="70" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="70" y1="50" x2="70" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="50" x2="130" y2="90" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="130" y1="70" x2="190" y2="70" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="62" y1="95" x2="138" y2="45" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
    <line x1="100" y1="50" x2="100" y2="30" stroke="oklch(0.85 0 0)" stroke-width="2.5"/>
    <path d="M 75 30 Q 87 15, 100 15 Q 113 15, 125 30" fill="none" stroke="oklch(0.85 0 0)" stroke-width="3"/>
  </svg>`,

  safetyRelay: `<svg viewBox="0 0 240 120" style="max-width:240px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="35" x2="55" y2="35" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <circle cx="95" cy="35" r="25" fill="none" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="120" y1="35" x2="230" y2="35" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="10" y1="85" x2="55" y2="85" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <circle cx="95" cy="85" r="25" fill="none" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <line x1="120" y1="85" x2="230" y2="85" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <text x="95" y="40" text-anchor="middle" font-size="14" fill="oklch(0.85 0 0)">K1</text>
    <text x="95" y="90" text-anchor="middle" font-size="14" fill="oklch(0.85 0 0)">K2</text>
  </svg>`,

  circuitBreaker: `<svg viewBox="0 0 200 100" style="max-width:200px;width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="50" x2="70" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <circle cx="73" cy="50" r="4" fill="oklch(0.85 0 0)"/>
    <line x1="73" y1="50" x2="120" y2="25" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <circle cx="130" cy="50" r="4" fill="oklch(0.85 0 0)"/>
    <line x1="130" y1="50" x2="190" y2="50" stroke="oklch(0.85 0 0)" stroke-width="3"/>
    <path d="M 90 30 Q 97 15, 105 30" fill="none" stroke="oklch(0.85 0 0)" stroke-width="2"/>
  </svg>`,
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPLACEMENT LOGIC — Match <p>Label</p> followed by <svg>...</svg>
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

// Replacement map: label text → new SVG
const replacementMap = [
  { label: 'Relay Coil (IEC)', svg: NMTBA.relayCoil, newLabel: 'Relay Coil (NMTBA EGP-1)' },
  { label: 'Relay Coil (NEMA/JIC)', svg: NMTBA.relayCoil, newLabel: 'Relay Coil (NMTBA EGP-1)' },
  { label: 'Relay Coil with Flyback Diode', svg: NMTBA.relayCoilFlyback, newLabel: 'Relay Coil with Flyback Diode (NMTBA EGP-1)' },
  { label: 'NO and NC Relay Contacts', svg: NMTBA.contactNOandNC, newLabel: 'NO and NC Relay Contacts (NMTBA EGP-1)' },
  { label: 'Thermal Overload Relay (IEC)', svg: NMTBA.overload, newLabel: 'Thermal Overload (NMTBA EGP-1)' },
  { label: 'Overload NC Contact (Control Circuit)', svg: NMTBA.overloadNCContact, newLabel: 'Overload NC Contact (NMTBA EGP-1)' },
  { label: 'Limit Switch — Normally Open (NO)', svg: NMTBA.limitSwitchNO, newLabel: 'Limit Switch — Normally Open (NMTBA EGP-1)' },
  { label: 'Limit Switch — Normally Closed (NC)', svg: NMTBA.limitSwitchNC, newLabel: 'Limit Switch — Normally Closed (NMTBA EGP-1)' },
  { label: 'Limit Switch — Held Closed', svg: NMTBA.limitSwitchHeldClosed, newLabel: 'Limit Switch — Held Closed (NMTBA EGP-1)' },
  { label: 'Limit Switch — Held Open', svg: NMTBA.limitSwitchHeldOpen, newLabel: 'Limit Switch — Held Open (NMTBA EGP-1)' },
  { label: 'Emergency Stop (E-Stop) — NC Mushroom Head', svg: NMTBA.eStopNC, newLabel: 'Emergency Stop (E-Stop) — NC Mushroom Head (NMTBA EGP-1)' },
  { label: 'Safety Relay (Dual-Channel)', svg: NMTBA.safetyRelay, newLabel: 'Safety Relay — Dual-Channel (NMTBA EGP-1)' },
  { label: 'Circuit Breaker', svg: NMTBA.circuitBreaker, newLabel: 'Circuit Breaker (NMTBA EGP-1)' },
  { label: 'Disconnect Switch', svg: NMTBA.disconnectSwitch, newLabel: 'Disconnect Switch (NMTBA EGP-1)' },
  { label: 'Fuse', svg: NMTBA.fuse, newLabel: 'Fuse (NMTBA EGP-1)' },
  { label: 'Motor (One-Line)', svg: NMTBA.motor, newLabel: 'Motor (NMTBA EGP-1)' },
];

for (const lesson of lessons) {
  let content = lesson.content;
  let replacements = 0;
  const originalContent = content;

  // For each replacement rule, find the label <p> + <svg> pattern and replace
  for (const rule of replacementMap) {
    // Escape special regex chars in label
    const escapedLabel = rule.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match: <p style="...">Label</p> followed by whitespace then <svg...>...</svg>
    // The </svg> may have content after it before the closing div
    const regex = new RegExp(
      `(<p[^>]*>)${escapedLabel}(</p>)\\s*<svg[^>]*>[\\s\\S]*?</svg>`,
      'g'
    );
    
    const newContent = content.replace(regex, (match, pOpen, pClose) => {
      replacements++;
      return `${pOpen}${rule.newLabel}${pClose}\n${rule.svg}`;
    });
    
    if (newContent !== content) {
      content = newContent;
    }
  }

  // Special handling for lesson 20 and 90010 which have table/grid formats
  if (lesson.id === 20 || lesson.id === 90010) {
    // Use context-based replacement for these lessons
    const svgBlockRegex = /<svg[^>]*>[\s\S]*?<\/svg>/g;
    let match;
    const svgBlocks = [];
    while ((match = svgBlockRegex.exec(content)) !== null) {
      svgBlocks.push({ index: match.index, length: match[0].length, svg: match[0] });
    }

    // Replace from end to start to preserve indices
    for (let i = svgBlocks.length - 1; i >= 0; i--) {
      const block = svgBlocks[i];
      const contextBefore = content.substring(Math.max(0, block.index - 300), block.index).toLowerCase();
      
      let replacement = null;
      
      if (contextBefore.includes('limit switch') && (contextBefore.includes('normally open') || contextBefore.includes('no'))) {
        replacement = NMTBA.limitSwitchNO;
      } else if (contextBefore.includes('limit switch') && (contextBefore.includes('normally closed') || contextBefore.includes('nc'))) {
        replacement = NMTBA.limitSwitchNC;
      } else if (contextBefore.includes('pressure') && !contextBefore.includes('normally closed')) {
        replacement = NMTBA.pressureSwitchNO;
      } else if (contextBefore.includes('temperature') && !contextBefore.includes('normally closed')) {
        replacement = NMTBA.temperatureSwitchNO;
      } else if (contextBefore.includes('relay coil') || contextBefore.includes('coil')) {
        replacement = NMTBA.relayCoil;
      }

      if (replacement) {
        content = content.substring(0, block.index) + replacement + content.substring(block.index + block.length);
        replacements++;
      }
    }
  }

  if (content !== originalContent) {
    await conn.execute(
      "UPDATE course_lessons SET content = ? WHERE id = ?",
      [content, lesson.id]
    );
    totalReplacements += replacements;
    console.log(`  ✓ Lesson ${lesson.id} (${lesson.title}): ${replacements} SVGs replaced`);
  } else {
    console.log(`  ✗ Lesson ${lesson.id} (${lesson.title}): No matches found`);
  }
}

console.log(`\n=== COMPLETE: ${totalReplacements} total SVG replacements across ${lessons.length} lessons ===`);
await conn.end();
process.exit(0);
