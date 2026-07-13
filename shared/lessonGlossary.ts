/**
 * Lesson Glossary — powers [[term]] tooltip highlights in lesson cards.
 * Merged from industrialGlossary.ts for comprehensive coverage.
 */
import { INDUSTRIAL_GLOSSARY } from "./industrialGlossary";

export interface GlossaryEntry {
  term: string;
  definition: string;
}

/**
 * Build LESSON_GLOSSARY from the industrial glossary source of truth.
 * Keys are both the exact term AND lowercase for case-insensitive lookup.
 */
function buildLessonGlossary(): Record<string, GlossaryEntry> {
  const map: Record<string, GlossaryEntry> = {};
  for (const entry of INDUSTRIAL_GLOSSARY) {
    const ge: GlossaryEntry = { term: entry.term, definition: entry.definition };
    map[entry.term] = ge;
    map[entry.term.toLowerCase()] = ge;
  }
  return map;
}

export const LESSON_GLOSSARY: Record<string, GlossaryEntry> = buildLessonGlossary();

/** Split text on [[term]] markers for glossary rendering. */
export function splitGlossaryMarkers(text: string): Array<{ type: "text"; value: string } | { type: "term"; value: string }> {
  const parts: Array<{ type: "text"; value: string } | { type: "term"; value: string }> = [];
  const pattern = /\[\[([^\]]+)\]\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    parts.push({ type: "term", value: match[1].trim() });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}

export const MAX_GLOSSARY_PER_CARD = 3;

/** Pick first-use glossary highlights for one card (max per card, no repeats across deck). */
export function collectGlossaryHighlights(
  texts: string[],
  seenLower: Set<string>,
  maxPerCard = MAX_GLOSSARY_PER_CARD
): Set<string> {
  const highlights = new Set<string>();
  for (const text of texts) {
    if (!text) continue;
    for (const part of splitGlossaryMarkers(text)) {
      if (part.type !== "term") continue;
      const lower = part.value.toLowerCase();
      if (seenLower.has(lower)) continue;
      if (highlights.size >= maxPerCard) continue;
      if (LESSON_GLOSSARY[lower] || LESSON_GLOSSARY[part.value]) {
        highlights.add(part.value);
        seenLower.add(lower);
      }
    }
  }
  return highlights;
}
