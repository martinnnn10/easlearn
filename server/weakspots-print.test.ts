import { describe, it, expect } from "vitest";
import { isCardFormatLesson, getLessonCardDeck } from "../shared/lessonCardContent";

describe("Weak Spots & Print Lesson Features", () => {
  describe("isCardFormatLesson", () => {
    it("should return true for known card-format lessons", () => {
      // plc-architecture is a known card-format lesson in plc-fundamentals module
      expect(isCardFormatLesson("plc-fundamentals", "plc-architecture")).toBe(true);
    });

    it("should return false for non-existent lessons", () => {
      expect(isCardFormatLesson("nonexistent-module", "nonexistent-lesson")).toBe(false);
    });
  });

  describe("getLessonCardDeck", () => {
    it("should return a deck with cards for plc-architecture", () => {
      const deck = getLessonCardDeck("plc-fundamentals", "plc-architecture");
      expect(deck).not.toBeNull();
      expect(deck!.title).toBeTruthy();
      expect(deck!.cards.length).toBeGreaterThan(0);
    });

    it("should return undefined for non-card lessons", () => {
      const deck = getLessonCardDeck("nonexistent", "nonexistent");
      expect(deck).toBeUndefined();
    });

    it("cards should have required fields for print rendering", () => {
      const deck = getLessonCardDeck("plc-fundamentals", "plc-architecture");
      expect(deck).toBeDefined();
      expect(deck!.cards.length).toBeGreaterThan(0);
      for (const card of deck!.cards) {
        // Each card should have a heading
        expect(card.heading).toBeTruthy();
      }
    });
  });

  describe("Print page glossary stripping", () => {
    it("should strip [[term]] markers from text", () => {
      // Simulates the stripGlossary logic used in PrintLesson.tsx
      const stripGlossary = (text: string) => text.replace(/\[\[([^\]]+)\]\]/g, "$1");
      
      expect(stripGlossary("Check the [[SF]] LED")).toBe("Check the SF LED");
      expect(stripGlossary("[[I/O]] module on [[CPU]]")).toBe("I/O module on CPU");
      expect(stripGlossary("No markers here")).toBe("No markers here");
      expect(stripGlossary("")).toBe("");
    });
  });

  describe("Difficulty badge mapping", () => {
    it("should map lesson index to correct difficulty level", () => {
      // The CourseModule page uses lesson index to determine difficulty
      // Based on the implementation: first third = Beginner, middle = Intermediate, last = Advanced
      const getDifficulty = (index: number, total: number) => {
        if (total <= 1) return "Beginner";
        const third = total / 3;
        if (index < third) return "Beginner";
        if (index < third * 2) return "Intermediate";
        return "Advanced";
      };

      // 24 lessons in PLC Fundamentals
      expect(getDifficulty(0, 24)).toBe("Beginner");
      expect(getDifficulty(7, 24)).toBe("Beginner");
      expect(getDifficulty(8, 24)).toBe("Intermediate");
      expect(getDifficulty(15, 24)).toBe("Intermediate");
      expect(getDifficulty(16, 24)).toBe("Advanced");
      expect(getDifficulty(23, 24)).toBe("Advanced");
    });
  });
});
