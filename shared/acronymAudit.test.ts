import { describe, expect, it } from "vitest";
import { LESSON_PRACTICE_MAP } from "./lessonPracticeMap";
import { getLessonCardDeck, isCardFormatLesson } from "./lessonCardContent";
import { HIGH_RISK_ACRONYMS } from "./industrialGlossary";

/**
 * Content Audit Test — Unexpanded Acronyms
 *
 * Flags any lesson deck where a high-risk acronym appears in card body/takeaway
 * text WITHOUT being expanded (parenthetical definition) on its first occurrence.
 *
 * Expansion patterns accepted:
 *   - "programmable logic controller (PLC)"
 *   - "PLC (programmable logic controller)"
 *   - "**PLC (programmable logic controller)**"
 *   - "**programmable logic controller (PLC)**"
 *
 * The test allows acronyms that appear ONLY inside an intro "New to this?" card
 * since those cards ARE the expansion.
 */

/** Check if an acronym is expanded somewhere in the text (case-insensitive parenthetical). */
function isExpandedInText(acronym: string, text: string): boolean {
  // Pattern 1: "full name (ACRONYM)" — acronym in parens
  const escapedAcronym = acronym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern1 = new RegExp(`\\(${escapedAcronym}\\)`, "i");
  if (pattern1.test(text)) return true;

  // Pattern 2: "ACRONYM (full name)" — expansion in parens after acronym
  // Match ACRONYM followed by parenthetical with 2+ words
  const pattern2 = new RegExp(
    `\\*{0,2}${escapedAcronym}\\*{0,2}\\s*\\(\\s*[a-zA-Z][a-zA-Z /\\-]+\\)`,
    "i"
  );
  if (pattern2.test(text)) return true;

  return false;
}

/** Check if an acronym appears in text at all (as a standalone word). */
function acronymAppearsInText(acronym: string, text: string): boolean {
  const escapedAcronym = acronym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Match as standalone word (not inside another word)
  const pattern = new RegExp(`(?<![a-zA-Z])${escapedAcronym}(?![a-zA-Z])`, "");
  return pattern.test(text);
}

describe("acronymAudit", () => {
  it("every high-risk acronym is expanded on first use in each lesson deck", () => {
    const violations: string[] = [];

    for (const path of LESSON_PRACTICE_MAP) {
      for (const unit of path.units) {
        if (!isCardFormatLesson(path.pathSlug, unit.lessonSlug)) continue;
        const deck = getLessonCardDeck(path.pathSlug, unit.lessonSlug);
        if (!deck) continue;

        for (const acronym of HIGH_RISK_ACRONYMS) {
          // Collect all text from all cards
          const allCardTexts = deck.cards.map(
            (c) => `${c.heading ?? ""} ${c.body ?? ""} ${c.takeaway ?? ""}`
          );
          const fullText = allCardTexts.join(" ");

          // Skip if acronym doesn't appear at all
          if (!acronymAppearsInText(acronym, fullText)) continue;

          // Check if it's expanded anywhere in the deck
          if (isExpandedInText(acronym, fullText)) continue;

          // Check if the intro card defines it (intro cards use "- **TERM**: definition" format)
          const introCard = deck.cards.find(
            (c) => c.heading === "New to this?" || c.id.endsWith("-00")
          );
          if (introCard) {
            const introText = `${introCard.body ?? ""} ${introCard.takeaway ?? ""}`;
            if (introText.includes(`**${acronym}**`) || introText.includes(`**${acronym}:`)) {
              continue;
            }
          }

          violations.push(
            `${path.pathSlug}/${unit.lessonSlug}: "${acronym}" used but never expanded`
          );
        }
      }
    }

    if (violations.length > 0) {
      // Report up to 20 violations for readability
      const report = violations.slice(0, 20).join("\n  ");
      const suffix = violations.length > 20 ? `\n  ... and ${violations.length - 20} more` : "";
      expect.fail(
        `Found ${violations.length} unexpanded acronym(s):\n  ${report}${suffix}`
      );
    }
  });

  it("no lesson deck is missing cards", () => {
    for (const path of LESSON_PRACTICE_MAP) {
      for (const unit of path.units) {
        if (!isCardFormatLesson(path.pathSlug, unit.lessonSlug)) continue;
        const deck = getLessonCardDeck(path.pathSlug, unit.lessonSlug);
        expect(deck, `${path.pathSlug}/${unit.lessonSlug}`).toBeDefined();
        expect(
          deck!.cards.length,
          `${path.pathSlug}/${unit.lessonSlug} has no cards`
        ).toBeGreaterThan(0);
      }
    }
  });

  it("intro cards follow the correct format when present", () => {
    for (const path of LESSON_PRACTICE_MAP) {
      for (const unit of path.units) {
        if (!isCardFormatLesson(path.pathSlug, unit.lessonSlug)) continue;
        const deck = getLessonCardDeck(path.pathSlug, unit.lessonSlug);
        if (!deck) continue;

        const introCard = deck.cards.find((c) => c.heading === "New to this?");
        if (!introCard) continue;

        // Intro card should be first
        expect(
          deck.cards[0].heading,
          `${path.pathSlug}/${unit.lessonSlug}: intro card not first`
        ).toBe("New to this?");

        // Intro card should be kind "concept"
        expect(introCard.kind).toBe("concept");

        // Intro card body should contain term definitions (bullet list)
        expect(introCard.body).toContain("- **");
      }
    }
  });
});
