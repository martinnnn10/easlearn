import { describe, expect, it } from "vitest";
import { LESSON_GLOSSARY, splitGlossaryMarkers, collectGlossaryHighlights } from "./lessonGlossary";

describe("lessonGlossary", () => {
  it("includes pilot terms", () => {
    for (const term of ["seal-in", "TON", "NO", "NC", "PRE", "ACC", "photoeye", "overload", "rung"]) {
      expect(LESSON_GLOSSARY[term]).toBeDefined();
    }
  });

  it("splits glossary markers", () => {
    const parts = splitGlossaryMarkers("Use [[NC]] on the [[photoeye]] input.");
    expect(parts).toEqual([
      { type: "text", value: "Use " },
      { type: "term", value: "NC" },
      { type: "text", value: " on the " },
      { type: "term", value: "photoeye" },
      { type: "text", value: " input." },
    ]);
  });

  it("limits first-use glossary highlights per card", () => {
    const seen = new Set<string>();
    const highlights = collectGlossaryHighlights(
      ["[[NO]] and [[NC]] and [[photoeye]] and [[overload]] and [[rung]]"],
      seen
    );
    expect(highlights.size).toBe(3);
    const again = collectGlossaryHighlights(["[[NO]] again"], seen);
    expect(again.size).toBe(0);
  });
});
