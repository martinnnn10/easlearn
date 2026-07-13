import { describe, expect, it } from "vitest";
import { getLessonCardDeck, isCardFormatLesson } from "./lessonCardContent";
import { LESSON_CARD_DECK_ALIASES, resolveCardDeckKey } from "./lessonSlugAliases";

describe("lessonSlugAliases", () => {
  it("maps production DB slugs to canonical deck keys", () => {
    expect(resolveCardDeckKey("sensors-instrumentation", "proximity-sensors-photoeyes")).toBe(
      "sensors-instrumentation/proximity-photoelectric"
    );
    expect(resolveCardDeckKey("print-reading", "electrical-schematic-basics")).toBe(
      "print-reading/ladder-diagram-conventions"
    );
  });

  it("loads card decks via DB slug aliases", () => {
    expect(getLessonCardDeck("sensors-instrumentation", "proximity-sensors-photoeyes")).toBeDefined();
    expect(isCardFormatLesson("sensors-instrumentation", "proximity-sensors-photoeyes")).toBe(true);
  });

  it("covers handoff PDF slug mismatches", () => {
    expect(Object.keys(LESSON_CARD_DECK_ALIASES).length).toBeGreaterThanOrEqual(11);
  });
});
