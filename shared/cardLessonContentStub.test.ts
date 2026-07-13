import { describe, expect, it } from "vitest";
import { CARD_LESSON_CONTENT_STUB, isCardContentStub } from "./cardLessonContentStub";
import { getCardFormatLessonCount } from "./lessonCardContent";

describe("cardLessonContentStub", () => {
  it("defines a short deprecated marker for DB rows", () => {
    expect(CARD_LESSON_CONTENT_STUB.length).toBeLessThan(200);
    expect(isCardContentStub(CARD_LESSON_CONTENT_STUB)).toBe(true);
    expect(isCardContentStub("# Long legacy markdown")).toBe(false);
  });

  it("aligns with card lesson registry count", () => {
    expect(getCardFormatLessonCount()).toBe(31);
  });
});
