/**
 * Update semiconductor SVGs in database lessons to use ANSI/IEEE compliant symbols.
 * 
 * Target lessons: 60013, 60014, 60015, 60016, 60017 (semiconductor module 30003)
 * Also check: 60020, 120017 (may have VFD-related semiconductor symbols)
 * 
 * DO NOT TOUCH: 60010 (PLC), 90011, 120016, 120020, 150003 (hardwired context)
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ═══════════════════════════════════════════════════════════════════════════
// ANSI/IEEE SEMICONDUCTOR SVG REPLACEMENTS
// Clean black/white line diagrams, no filled green icons, no oversized triangles
// ═══════════════════════════════════════════════════════════════════════════

const SVGS = {
  // Standard Rectifier Diode
  diode: `<svg viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:120px;height:auto"><line x1="10" y1="25" x2="40" y2="25" stroke="currentColor" stroke-width="2.5"/><polygon points="40,12 40,38 70,25" fill="currentColor"/><line x1="70" y1="12" x2="70" y2="38" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="25" x2="110" y2="25" stroke="currentColor" stroke-width="2.5"/><text x="25" y="47" font-size="8" fill="currentColor" text-anchor="middle">A</text><text x="90" y="47" font-size="8" fill="currentColor" text-anchor="middle">K</text></svg>`,

  // Zener Diode (bent cathode bar)
  zener: `<svg viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:120px;height:auto"><line x1="10" y1="25" x2="40" y2="25" stroke="currentColor" stroke-width="2.5"/><polygon points="40,12 40,38 70,25" fill="currentColor"/><line x1="70" y1="12" x2="70" y2="38" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="12" x2="64" y2="8" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="38" x2="76" y2="42" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="25" x2="110" y2="25" stroke="currentColor" stroke-width="2.5"/><text x="25" y="47" font-size="8" fill="currentColor" text-anchor="middle">A</text><text x="90" y="47" font-size="8" fill="currentColor" text-anchor="middle">K</text></svg>`,

  // LED (diode + two outward arrows)
  led: `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:120px;height:auto"><line x1="10" y1="30" x2="40" y2="30" stroke="currentColor" stroke-width="2.5"/><polygon points="40,17 40,43 70,30" fill="currentColor"/><line x1="70" y1="17" x2="70" y2="43" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="30" x2="110" y2="30" stroke="currentColor" stroke-width="2.5"/><line x1="55" y1="14" x2="62" y2="4" stroke="currentColor" stroke-width="1.5"/><polygon points="62,4 58,9 63,9" fill="currentColor"/><line x1="62" y1="14" x2="69" y2="4" stroke="currentColor" stroke-width="1.5"/><polygon points="69,4 65,9 70,9" fill="currentColor"/><text x="25" y="55" font-size="8" fill="currentColor" text-anchor="middle">A</text><text x="90" y="55" font-size="8" fill="currentColor" text-anchor="middle">K</text></svg>`,

  // Photodiode (diode + two inward arrows)
  photodiode: `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:120px;height:auto"><line x1="10" y1="30" x2="40" y2="30" stroke="currentColor" stroke-width="2.5"/><polygon points="40,17 40,43 70,30" fill="currentColor"/><line x1="70" y1="17" x2="70" y2="43" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="30" x2="110" y2="30" stroke="currentColor" stroke-width="2.5"/><line x1="48" y1="4" x2="55" y2="14" stroke="currentColor" stroke-width="1.5"/><polygon points="55,14 51,9 56,9" fill="currentColor"/><line x1="55" y1="4" x2="62" y2="14" stroke="currentColor" stroke-width="1.5"/><polygon points="62,14 58,9 63,9" fill="currentColor"/><text x="25" y="55" font-size="8" fill="currentColor" text-anchor="middle">A</text><text x="90" y="55" font-size="8" fill="currentColor" text-anchor="middle">K</text></svg>`,

  // Schottky Diode (S-shaped cathode bar)
  schottky: `<svg viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:120px;height:auto"><line x1="10" y1="25" x2="40" y2="25" stroke="currentColor" stroke-width="2.5"/><polygon points="40,12 40,38 70,25" fill="currentColor"/><path d="M 64,12 L 70,12 L 70,38 L 76,38" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="25" x2="110" y2="25" stroke="currentColor" stroke-width="2.5"/><text x="25" y="47" font-size="8" fill="currentColor" text-anchor="middle">A</text><text x="90" y="47" font-size="8" fill="currentColor" text-anchor="middle">K</text></svg>`,

  // TVS Bidirectional (two opposing Zener diodes)
  tvs_bidirectional: `<svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:120px;height:auto"><line x1="60" y1="5" x2="60" y2="20" stroke="currentColor" stroke-width="2.5"/><polygon points="45,20 75,20 60,38" fill="currentColor"/><line x1="45" y1="38" x2="75" y2="38" stroke="currentColor" stroke-width="2.5"/><line x1="45" y1="38" x2="42" y2="35" stroke="currentColor" stroke-width="2"/><line x1="75" y1="38" x2="78" y2="41" stroke="currentColor" stroke-width="2"/><polygon points="45,50 75,50 60,32" fill="currentColor"/><line x1="45" y1="32" x2="75" y2="32" stroke="currentColor" stroke-width="2.5"/><line x1="45" y1="32" x2="42" y2="29" stroke="currentColor" stroke-width="2"/><line x1="75" y1="32" x2="78" y2="35" stroke="currentColor" stroke-width="2"/><line x1="60" y1="50" x2="60" y2="65" stroke="currentColor" stroke-width="2.5"/><text x="30" y="10" font-size="8" fill="currentColor">1</text><text x="30" y="63" font-size="8" fill="currentColor">2</text></svg>`,

  // SCR (Silicon Controlled Rectifier)
  scr: `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:120px;height:auto"><line x1="10" y1="25" x2="40" y2="25" stroke="currentColor" stroke-width="2.5"/><polygon points="40,12 40,38 70,25" fill="currentColor"/><line x1="70" y1="12" x2="70" y2="38" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="25" x2="110" y2="25" stroke="currentColor" stroke-width="2.5"/><line x1="55" y1="35" x2="55" y2="52" stroke="currentColor" stroke-width="2.5"/><text x="25" y="10" font-size="8" fill="currentColor" text-anchor="middle">A</text><text x="90" y="10" font-size="8" fill="currentColor" text-anchor="middle">K</text><text x="55" y="58" font-size="8" fill="currentColor" text-anchor="middle">G</text></svg>`,

  // TRIAC (two anti-parallel SCRs)
  triac: `<svg viewBox="0 0 120 65" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:120px;height:auto"><line x1="10" y1="28" x2="40" y2="28" stroke="currentColor" stroke-width="2.5"/><polygon points="40,15 40,41 65,28" fill="currentColor"/><polygon points="90,15 90,41 65,28" fill="currentColor"/><line x1="65" y1="12" x2="65" y2="44" stroke="currentColor" stroke-width="2.5"/><line x1="90" y1="28" x2="110" y2="28" stroke="currentColor" stroke-width="2.5"/><line x1="65" y1="38" x2="65" y2="55" stroke="currentColor" stroke-width="2.5"/><text x="25" y="10" font-size="8" fill="currentColor" text-anchor="middle">MT1</text><text x="100" y="10" font-size="8" fill="currentColor" text-anchor="middle">MT2</text><text x="65" y="62" font-size="8" fill="currentColor" text-anchor="middle">G</text></svg>`,

  // IGBT
  igbt: `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:100px;height:auto"><line x1="10" y1="40" x2="30" y2="40" stroke="currentColor" stroke-width="2.5"/><line x1="30" y1="25" x2="30" y2="55" stroke="currentColor" stroke-width="2.5"/><line x1="34" y1="25" x2="34" y2="55" stroke="currentColor" stroke-width="2.5"/><line x1="40" y1="28" x2="40" y2="52" stroke="currentColor" stroke-width="2.5"/><line x1="40" y1="32" x2="70" y2="15" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="15" x2="70" y2="5" stroke="currentColor" stroke-width="2.5"/><line x1="40" y1="48" x2="60" y2="60" stroke="currentColor" stroke-width="2.5"/><polygon points="56,55 60,60 54,60" fill="currentColor"/><line x1="60" y1="60" x2="70" y2="60" stroke="currentColor" stroke-width="2"/><line x1="70" y1="60" x2="70" y2="75" stroke="currentColor" stroke-width="2.5"/><text x="10" y="55" font-size="8" fill="currentColor">G</text><text x="75" y="12" font-size="8" fill="currentColor">C</text><text x="75" y="72" font-size="8" fill="currentColor">E</text></svg>`,

  // NPN BJT Transistor
  npn: `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:100px;height:auto"><line x1="10" y1="40" x2="35" y2="40" stroke="currentColor" stroke-width="2.5"/><line x1="35" y1="20" x2="35" y2="60" stroke="currentColor" stroke-width="3"/><line x1="35" y1="30" x2="70" y2="10" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="10" x2="70" y2="5" stroke="currentColor" stroke-width="2.5"/><line x1="35" y1="50" x2="70" y2="70" stroke="currentColor" stroke-width="2.5"/><polygon points="62,63 70,70 63,67" fill="currentColor"/><line x1="70" y1="70" x2="70" y2="75" stroke="currentColor" stroke-width="2.5"/><text x="10" y="55" font-size="8" fill="currentColor">B</text><text x="75" y="12" font-size="8" fill="currentColor">C</text><text x="75" y="72" font-size="8" fill="currentColor">E</text></svg>`,

  // PNP BJT Transistor
  pnp: `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:100px;height:auto"><line x1="10" y1="40" x2="35" y2="40" stroke="currentColor" stroke-width="2.5"/><line x1="35" y1="20" x2="35" y2="60" stroke="currentColor" stroke-width="3"/><line x1="35" y1="30" x2="70" y2="10" stroke="currentColor" stroke-width="2.5"/><polygon points="42,24 35,30 40,29" fill="currentColor"/><line x1="70" y1="10" x2="70" y2="5" stroke="currentColor" stroke-width="2.5"/><line x1="35" y1="50" x2="70" y2="70" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="70" x2="70" y2="75" stroke="currentColor" stroke-width="2.5"/><text x="10" y="55" font-size="8" fill="currentColor">B</text><text x="75" y="12" font-size="8" fill="currentColor">E</text><text x="75" y="72" font-size="8" fill="currentColor">C</text></svg>`,

  // N-Channel MOSFET (Enhancement)
  nmosfet: `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:100px;height:auto"><line x1="10" y1="40" x2="28" y2="40" stroke="currentColor" stroke-width="2.5"/><line x1="28" y1="20" x2="28" y2="60" stroke="currentColor" stroke-width="2.5"/><line x1="32" y1="20" x2="32" y2="60" stroke="currentColor" stroke-width="2.5"/><line x1="36" y1="20" x2="36" y2="30" stroke="currentColor" stroke-width="2.5"/><line x1="36" y1="35" x2="36" y2="45" stroke="currentColor" stroke-width="2.5"/><line x1="36" y1="50" x2="36" y2="60" stroke="currentColor" stroke-width="2.5"/><line x1="36" y1="25" x2="70" y2="25" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="25" x2="70" y2="5" stroke="currentColor" stroke-width="2.5"/><line x1="36" y1="55" x2="70" y2="55" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="55" x2="70" y2="75" stroke="currentColor" stroke-width="2.5"/><line x1="36" y1="40" x2="50" y2="40" stroke="currentColor" stroke-width="2.5"/><line x1="50" y1="40" x2="70" y2="40" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="25" x2="70" y2="55" stroke="currentColor" stroke-width="2.5"/><polygon points="50,36 50,44 56,40" fill="currentColor"/><text x="10" y="55" font-size="8" fill="currentColor">G</text><text x="75" y="12" font-size="8" fill="currentColor">D</text><text x="75" y="72" font-size="8" fill="currentColor">S</text></svg>`,

  // Bridge Rectifier (diamond configuration with 4 diodes)
  bridge_rectifier: `<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:140px;height:auto"><line x1="70" y1="10" x2="70" y2="25" stroke="currentColor" stroke-width="2.5"/><polygon points="60,25 80,25 70,45" fill="currentColor"/><line x1="60" y1="45" x2="80" y2="45" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="45" x2="70" y2="55" stroke="currentColor" stroke-width="2"/><line x1="70" y1="55" x2="30" y2="70" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="55" x2="110" y2="70" stroke="currentColor" stroke-width="2.5"/><polygon points="30,60 30,80 50,70" fill="currentColor"/><line x1="50" y1="60" x2="50" y2="80" stroke="currentColor" stroke-width="2.5"/><polygon points="110,60 110,80 90,70" fill="currentColor"/><line x1="90" y1="60" x2="90" y2="80" stroke="currentColor" stroke-width="2.5"/><line x1="30" y1="70" x2="10" y2="70" stroke="currentColor" stroke-width="2.5"/><line x1="110" y1="70" x2="130" y2="70" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="85" x2="30" y2="70" stroke="currentColor" stroke-width="2"/><line x1="70" y1="85" x2="110" y2="70" stroke="currentColor" stroke-width="2"/><polygon points="60,95 80,95 70,85" fill="currentColor"/><line x1="60" y1="85" x2="80" y2="85" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="95" x2="70" y2="110" stroke="currentColor" stroke-width="2.5"/><polygon points="60,110 80,110 70,130" fill="currentColor"/><line x1="60" y1="130" x2="80" y2="130" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="130" x2="70" y2="140" stroke="currentColor" stroke-width="2.5"/><text x="70" y="8" font-size="8" fill="currentColor" text-anchor="middle">DC+</text><text x="70" y="148" font-size="8" fill="currentColor" text-anchor="middle">DC−</text><text x="5" y="68" font-size="8" fill="currentColor">AC</text><text x="118" y="68" font-size="8" fill="currentColor">AC</text></svg>`,

  // Flyback / Freewheeling Diode (proportional diode across coil)
  flyback: `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:100px;height:auto"><rect x="25" y="20" width="30" height="40" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="32" y1="28" x2="48" y2="52" stroke="currentColor" stroke-width="2"/><line x1="40" y1="10" x2="40" y2="20" stroke="currentColor" stroke-width="2.5"/><line x1="40" y1="60" x2="40" y2="70" stroke="currentColor" stroke-width="2.5"/><line x1="65" y1="10" x2="65" y2="70" stroke="currentColor" stroke-width="2"/><line x1="40" y1="10" x2="65" y2="10" stroke="currentColor" stroke-width="2.5"/><line x1="40" y1="70" x2="65" y2="70" stroke="currentColor" stroke-width="2.5"/><polygon points="58,50 72,50 65,35" fill="currentColor"/><line x1="58" y1="35" x2="72" y2="35" stroke="currentColor" stroke-width="2"/><text x="40" y="8" font-size="7" fill="currentColor" text-anchor="middle">V+</text><text x="40" y="78" font-size="7" fill="currentColor" text-anchor="middle">V−</text><text x="80" y="45" font-size="7" fill="currentColor">D</text></svg>`,

  // Fast Recovery Diode
  fast_recovery: `<svg viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:120px;height:auto"><line x1="10" y1="25" x2="40" y2="25" stroke="currentColor" stroke-width="2.5"/><polygon points="40,12 40,38 70,25" fill="currentColor"/><line x1="70" y1="12" x2="70" y2="38" stroke="currentColor" stroke-width="2.5"/><line x1="70" y1="25" x2="110" y2="25" stroke="currentColor" stroke-width="2.5"/><text x="25" y="47" font-size="8" fill="currentColor" text-anchor="middle">A</text><text x="90" y="47" font-size="8" fill="currentColor" text-anchor="middle">K</text></svg>`,
};

// ═══════════════════════════════════════════════════════════════════════════
// REPLACEMENT PATTERNS
// Match old SVGs by their distinctive features and replace with ANSI/IEEE versions
// ═══════════════════════════════════════════════════════════════════════════

const replacements = [
  // Bridge Rectifier - old version had green filled triangles in a decorative diamond
  {
    name: 'Bridge Rectifier',
    // Match any SVG that contains "Bridge Rectifier" or "bridge" in nearby context with fill="#22c55e" or similar green
    pattern: /<svg[^>]*>[\s\S]*?(?:fill="#22c55e"|fill="#16a34a"|fill="green")[\s\S]*?<\/svg>/gi,
    contextMatch: /bridge\s*rectifier|full[- ]wave\s*bridge/i,
    replacement: SVGS.bridge_rectifier,
  },
  // TVS Bidirectional - old version had oversized green triangles
  {
    name: 'TVS Bidirectional',
    pattern: /<svg[^>]*>[\s\S]*?(?:fill="#22c55e"|fill="#16a34a"|fill="green")[\s\S]*?<\/svg>/gi,
    contextMatch: /TVS|bidirectional|transient\s*voltage/i,
    replacement: SVGS.tvs_bidirectional,
  },
  // Flyback Diode - old version had huge green triangle
  {
    name: 'Flyback Diode',
    pattern: /<svg[^>]*>[\s\S]*?(?:fill="#22c55e"|fill="#16a34a"|fill="green")[\s\S]*?<\/svg>/gi,
    contextMatch: /flyback|freewheeling|snubber/i,
    replacement: SVGS.flyback,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

// Semiconductor lessons to update
const SEMICONDUCTOR_LESSONS = [60013, 60014, 60015, 60016, 60017];
// Lessons that may have VFD/semiconductor context
const CHECK_LESSONS = [60020, 120017];

let totalReplacements = 0;

for (const lessonId of [...SEMICONDUCTOR_LESSONS, ...CHECK_LESSONS]) {
  const [rows] = await conn.execute('SELECT id, title, content FROM course_lessons WHERE id = ?', [lessonId]);
  if (rows.length === 0) continue;
  
  const lesson = rows[0];
  let content = lesson.content;
  let lessonReplacements = 0;
  
  // Find all SVGs in the content
  const svgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
  let match;
  const svgsFound = [];
  
  while ((match = svgRegex.exec(content)) !== null) {
    svgsFound.push({ svg: match[0], index: match.index });
  }
  
  if (svgsFound.length === 0) {
    console.log(`[${lessonId}] ${lesson.title} — No SVGs found`);
    continue;
  }
  
  console.log(`[${lessonId}] ${lesson.title} — ${svgsFound.length} SVGs found`);
  
  // Check each SVG for green fills (old decorative style)
  for (const svgInfo of svgsFound) {
    const svg = svgInfo.svg;
    const hasGreenFill = /fill="#22c55e"|fill="#16a34a"|fill="green"|fill="#4ade80"|fill="#10b981"|fill="#059669"/i.test(svg);
    
    if (!hasGreenFill) {
      // Check if it's already using currentColor (already correct)
      if (/fill="currentColor"/i.test(svg)) {
        console.log(`  ✓ SVG at index ${svgInfo.index} already uses currentColor (correct)`);
      } else {
        console.log(`  ? SVG at index ${svgInfo.index} — no green fill, checking further...`);
      }
      continue;
    }
    
    // Get surrounding context (200 chars before and after)
    const contextStart = Math.max(0, svgInfo.index - 200);
    const contextEnd = Math.min(content.length, svgInfo.index + svg.length + 200);
    const context = content.substring(contextStart, contextEnd);
    
    // Determine what type of symbol this is based on context
    let replacementSvg = null;
    let symbolName = 'unknown';
    
    if (/bridge\s*rectifier|full[- ]?wave\s*bridge|bridge\s*circuit/i.test(context)) {
      replacementSvg = SVGS.bridge_rectifier;
      symbolName = 'Bridge Rectifier';
    } else if (/TVS|bidirectional|transient\s*voltage\s*suppress/i.test(context)) {
      replacementSvg = SVGS.tvs_bidirectional;
      symbolName = 'TVS Bidirectional';
    } else if (/flyback|freewheeling|snubber\s*diode/i.test(context)) {
      replacementSvg = SVGS.flyback;
      symbolName = 'Flyback Diode';
    } else if (/SCR|silicon\s*controlled|thyristor/i.test(context)) {
      replacementSvg = SVGS.scr;
      symbolName = 'SCR';
    } else if (/TRIAC|triac/i.test(context)) {
      replacementSvg = SVGS.triac;
      symbolName = 'TRIAC';
    } else if (/IGBT|insulated\s*gate\s*bipolar/i.test(context)) {
      replacementSvg = SVGS.igbt;
      symbolName = 'IGBT';
    } else if (/NPN|npn\s*transistor/i.test(context)) {
      replacementSvg = SVGS.npn;
      symbolName = 'NPN Transistor';
    } else if (/PNP|pnp\s*transistor/i.test(context)) {
      replacementSvg = SVGS.pnp;
      symbolName = 'PNP Transistor';
    } else if (/MOSFET|N-channel|NMOS/i.test(context)) {
      replacementSvg = SVGS.nmosfet;
      symbolName = 'N-Channel MOSFET';
    } else if (/Zener|zener/i.test(context)) {
      replacementSvg = SVGS.zener;
      symbolName = 'Zener Diode';
    } else if (/LED|light[- ]emitting/i.test(context)) {
      replacementSvg = SVGS.led;
      symbolName = 'LED';
    } else if (/photodiode|photo[- ]diode/i.test(context)) {
      replacementSvg = SVGS.photodiode;
      symbolName = 'Photodiode';
    } else if (/Schottky|schottky/i.test(context)) {
      replacementSvg = SVGS.schottky;
      symbolName = 'Schottky Diode';
    } else if (/fast\s*recovery/i.test(context)) {
      replacementSvg = SVGS.fast_recovery;
      symbolName = 'Fast Recovery Diode';
    } else if (/diode|rectifier/i.test(context)) {
      replacementSvg = SVGS.diode;
      symbolName = 'Standard Diode';
    }
    
    if (replacementSvg) {
      content = content.replace(svg, replacementSvg);
      lessonReplacements++;
      totalReplacements++;
      console.log(`  ✓ Replaced: ${symbolName} (green icon → ANSI/IEEE schematic)`);
    } else {
      console.log(`  ✗ Could not identify symbol type from context at index ${svgInfo.index}`);
    }
  }
  
  // Update the database if changes were made
  if (lessonReplacements > 0) {
    await conn.execute('UPDATE course_lessons SET content = ? WHERE id = ?', [content, lessonId]);
    console.log(`  → Updated lesson ${lessonId}: ${lessonReplacements} replacements saved`);
  }
}

console.log(`\n═══ COMPLETE ═══`);
console.log(`Total replacements: ${totalReplacements}`);

await conn.end();
