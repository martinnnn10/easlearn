import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
config();

/**
 * Platform-wide symbol audit
 * Scans all course_lessons for:
 * 1. Text used as symbols (LS, CR, OL, etc. without SVG context)
 * 2. Missing SVG symbols where they should exist
 * 3. Lessons about electrical components that lack proper schematic representations
 * 4. ASCII art or text-based diagrams that should be SVG
 */

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  
  const [lessons] = await conn.execute(
    'SELECT id, title, moduleId, content FROM course_lessons WHERE isPublished = 1 ORDER BY moduleId, orderIndex'
  );
  
  console.log(`Auditing ${lessons.length} published lessons...\n`);
  
  const issues = [];
  
  // Categories of lessons that MUST have SVG symbols
  const symbolRequiredTopics = [
    'limit switch', 'relay', 'contactor', 'motor', 'overload', 'sensor',
    'diode', 'transistor', 'thyristor', 'scr', 'triac', 'igbt',
    'capacitor', 'resistor', 'inductor', 'transformer',
    'fuse', 'circuit breaker', 'disconnect',
    'push button', 'selector switch', 'pilot light',
    'schematic', 'symbol', 'ladder', 'print reading'
  ];
  
  // Text patterns that indicate text-as-symbol usage
  const textAsSymbolPatterns = [
    // Limit switch text abbreviations without SVG context
    { pattern: /\bLS\d?\b(?![\w-])/g, desc: 'Limit switch text abbreviation (LS)' },
    // Control relay without SVG
    { pattern: /\bCR\d?\b(?![\w-])/g, desc: 'Control relay text abbreviation (CR)' },
    // Overload text
    { pattern: /\bOL\d?\b(?![\w-])/g, desc: 'Overload text abbreviation (OL)' },
    // ASCII art patterns
    { pattern: /[─│┌┐└┘├┤┬┴┼]/g, desc: 'ASCII box-drawing characters' },
    { pattern: /\|[-─]+\|/g, desc: 'ASCII horizontal line pattern' },
    { pattern: /--\[\/\]--/g, desc: 'ASCII NO contact representation' },
    { pattern: /--\[\\\/\]--/g, desc: 'ASCII NC contact representation' },
    { pattern: /---\(\s*\)---/g, desc: 'ASCII coil representation' },
    { pattern: /-{3,}\s*[A-Z]{1,3}\s*-{3,}/g, desc: 'ASCII component between dashes' },
    // Text diagrams
    { pattern: /\+-{3,}\+/g, desc: 'ASCII box corners' },
  ];
  
  for (const lesson of lessons) {
    const content = lesson.content;
    const hasSVG = content.includes('<svg');
    const hasTable = content.includes('<table') || content.includes('|');
    const title = lesson.title.toLowerCase();
    
    // Check if this lesson's topic requires symbols
    const requiresSymbols = symbolRequiredTopics.some(topic => 
      title.includes(topic) || content.toLowerCase().includes(`## ${topic}`) || 
      content.toLowerCase().includes(`### ${topic}`)
    );
    
    // Check for text-as-symbol patterns
    for (const { pattern, desc } of textAsSymbolPatterns) {
      pattern.lastIndex = 0;
      const matches = content.match(pattern);
      if (matches && matches.length > 3) {
        // Only flag if there are many instances (likely used as symbols, not just references)
        // And the lesson doesn't already have SVG
        if (!hasSVG) {
          issues.push({
            lessonId: lesson.id,
            title: lesson.title,
            moduleId: lesson.moduleId,
            type: 'TEXT_AS_SYMBOL',
            detail: `${desc} — found ${matches.length} instances without SVG context`,
            severity: 'HIGH'
          });
        }
      }
    }
    
    // Check for lessons about symbols/schematics that lack SVG
    if (requiresSymbols && !hasSVG) {
      // Check if it's a lesson that teaches about these components (not just mentions them)
      const isTeachingLesson = title.includes('symbol') || title.includes('schematic') || 
        title.includes('reading') || title.includes('fundamentals') ||
        content.includes('## Symbol') || content.includes('## Schematic');
      
      if (isTeachingLesson) {
        issues.push({
          lessonId: lesson.id,
          title: lesson.title,
          moduleId: lesson.moduleId,
          type: 'MISSING_SVG_SYMBOLS',
          detail: 'Teaching lesson about electrical components lacks SVG schematic symbols',
          severity: 'CRITICAL'
        });
      }
    }
    
    // Check for relay/flyback content specifically
    if ((title.includes('relay') || title.includes('suppression') || title.includes('flyback')) && 
        content.includes('diode') && !content.includes('<svg')) {
      issues.push({
        lessonId: lesson.id,
        title: lesson.title,
        moduleId: lesson.moduleId,
        type: 'RELAY_FLYBACK_NO_SVG',
        detail: 'Relay/flyback content mentions diode suppression but has no SVG diagram',
        severity: 'HIGH'
      });
    }
    
    // Check for limit switch content
    if (title.includes('limit') || (content.toLowerCase().includes('limit switch') && content.includes('LS'))) {
      if (!content.includes('<svg') || !content.toLowerCase().includes('limit switch')) {
        // Has limit switch references but may lack proper SVG
        const lsCount = (content.match(/\bLS\b/g) || []).length;
        if (lsCount > 2 && !hasSVG) {
          issues.push({
            lessonId: lesson.id,
            title: lesson.title,
            moduleId: lesson.moduleId,
            type: 'LIMIT_SWITCH_TEXT_ONLY',
            detail: `Uses "LS" text ${lsCount} times without SVG limit switch symbol`,
            severity: 'HIGH'
          });
        }
      }
    }
    
    // Check for motor symbols
    if (title.includes('motor') && !hasSVG) {
      if (content.includes('(M)') || content.includes('circle') || content.includes('Motor symbol')) {
        issues.push({
          lessonId: lesson.id,
          title: lesson.title,
          moduleId: lesson.moduleId,
          type: 'MOTOR_TEXT_SYMBOL',
          detail: 'Motor lesson uses text description instead of SVG motor symbol',
          severity: 'MEDIUM'
        });
      }
    }
  }
  
  // Also check for lessons that DO have SVG but might have issues
  const svgLessons = lessons.filter(l => l.content.includes('<svg'));
  console.log(`Found ${svgLessons.length} lessons with SVG content.`);
  console.log(`Found ${issues.length} potential issues.\n`);
  
  // Sort by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  // Generate report
  let report = '# Platform-Wide Symbol Audit Report\n\n';
  report += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  report += `**Total lessons audited:** ${lessons.length}\n`;
  report += `**Lessons with SVG symbols:** ${svgLessons.length}\n`;
  report += `**Issues found:** ${issues.length}\n\n`;
  
  report += '## SVG-Enabled Lessons (Already Compliant)\n\n';
  for (const l of svgLessons) {
    const svgCount = (l.content.match(/<svg/g) || []).length;
    report += `- **[${l.id}]** ${l.title} — ${svgCount} SVG element(s)\n`;
  }
  
  report += '\n## Issues Requiring Attention\n\n';
  
  if (issues.length === 0) {
    report += 'No issues found. All symbols appear to be properly implemented.\n';
  } else {
    for (const issue of issues) {
      report += `### [${issue.severity}] Lesson ${issue.lessonId}: ${issue.title}\n`;
      report += `- **Type:** ${issue.type}\n`;
      report += `- **Module:** ${issue.moduleId}\n`;
      report += `- **Detail:** ${issue.detail}\n\n`;
    }
  }
  
  // List lessons about schematics/symbols for manual review
  report += '\n## Lessons Requiring Manual Symbol Review\n\n';
  report += 'These lessons teach about electrical components and should be manually verified for symbol accuracy:\n\n';
  
  const manualReviewLessons = lessons.filter(l => {
    const t = l.title.toLowerCase();
    return t.includes('schematic') || t.includes('symbol') || t.includes('print reading') ||
      t.includes('ladder') || t.includes('diagram') || t.includes('circuit');
  });
  
  for (const l of manualReviewLessons) {
    const hasSvg = l.content.includes('<svg') ? '✅ Has SVG' : '❌ No SVG';
    report += `- **[${l.id}]** ${l.title} — ${hasSvg}\n`;
  }
  
  writeFileSync('/home/ubuntu/eas-platform/scripts/symbol-audit-report.md', report);
  console.log('Report written to scripts/symbol-audit-report.md');
  console.log('\n--- SUMMARY ---');
  console.log(`CRITICAL: ${issues.filter(i => i.severity === 'CRITICAL').length}`);
  console.log(`HIGH: ${issues.filter(i => i.severity === 'HIGH').length}`);
  console.log(`MEDIUM: ${issues.filter(i => i.severity === 'MEDIUM').length}`);
  
  await conn.end();
}

main().catch(console.error);
