import { describe, expect, it } from "vitest";
import {
  getLessonCardDeck,
  getCardFormatLessonCount,
  isCardFormatLesson,
  lessonDeckKey,
  getPreviewCards,
} from "./lessonCardContent";
import { LESSON_PRACTICE_MAP } from "./lessonPracticeMap";

describe("lessonCardContent", () => {
  it("loads pilot io-troubleshooting deck", () => {
    const deck = getLessonCardDeck("plc-fundamentals", "io-troubleshooting");
    expect(deck).toBeDefined();
    expect(deck?.cards).toHaveLength(13);
    expect(deck?.previewCardCount).toBe(2);
  });

  it("identifies card format lessons", () => {
    expect(isCardFormatLesson("plc-fundamentals", "io-troubleshooting")).toBe(true);
    expect(isCardFormatLesson("plc-fundamentals", "plc-architecture")).toBe(true);
    expect(isCardFormatLesson("plc-fundamentals", "ladder-logic-basics")).toBe(true);
    expect(isCardFormatLesson("plc-fundamentals", "timers-counters")).toBe(true);
    expect(isCardFormatLesson("plc-fundamentals", "communication-faults")).toBe(true);
    expect(isCardFormatLesson("plc-fundamentals", "program-troubleshooting")).toBe(true);
  });

  it("loads PLC Group 1 decks with 14 cards and 2 KC interactions", () => {
    for (const slug of [
      "ladder-logic-basics",
      "timers-counters",
      "communication-faults",
      "program-troubleshooting",
    ]) {
      const deck = getLessonCardDeck("plc-fundamentals", slug);
      expect(deck?.cards).toHaveLength(14);
      const kcCards = deck!.cards.filter((c) => c.interaction?.type === "choice" && !c.body.trim());
      expect(kcCards).toHaveLength(2);
      expect(deck!.cards.at(-1)?.kind).toBe("summary");
    }
  });

  it("registers 31 card-format lessons with zero legacy ILU units", () => {
    expect(getCardFormatLessonCount()).toBe(31);
    const legacy = LESSON_PRACTICE_MAP.flatMap((p) =>
      p.units.filter((u) => u.lessonFormat !== "cards")
    );
    expect(legacy).toHaveLength(0);
  });

  it("builds deck key", () => {
    expect(lessonDeckKey("plc-fundamentals", "io-troubleshooting")).toBe(
      "plc-fundamentals/io-troubleshooting"
    );
  });

  it("returns preview slice", () => {
    const deck = getLessonCardDeck("plc-fundamentals", "io-troubleshooting")!;
    expect(getPreviewCards(deck)).toHaveLength(2);
    // Preview starts at the first non-intro card (io-00 is intro, io-01 is first real content)
    expect(getPreviewCards(deck)[0].id).toBe("io-00");
  });

  it("leads with a question early — first interaction within the first 4 cards", () => {
    // Master-tech pedagogy: the master sets a brief scene, then ASKS before he
    // explains. So the first interaction must come early — never buried behind
    // a wall of reading — but after at least one scene-setting card.
    // With intro "New to this?" cards, the interaction may be at index 3.
    for (const path of LESSON_PRACTICE_MAP) {
      for (const unit of path.units) {
        if (!isCardFormatLesson(path.pathSlug, unit.lessonSlug)) continue;
        const deck = getLessonCardDeck(path.pathSlug, unit.lessonSlug)!;
        const firstKc = deck.cards.findIndex((c) => c.kind === "interaction");
        expect(firstKc, `${path.pathSlug}/${unit.lessonSlug}`).toBeGreaterThanOrEqual(1);
        expect(firstKc, `${path.pathSlug}/${unit.lessonSlug}`).toBeLessThanOrEqual(3);
      }
    }
  });

  it("includes early interaction on card 4", () => {
    const deck = getLessonCardDeck("plc-fundamentals", "io-troubleshooting")!;
    const card4 = deck.cards[3];
    expect(card4.kind).toBe("interaction");
    expect(card4.interaction?.type).toBe("choice");
  });

  it("splits MCQ onto dedicated card after setup", () => {
    const deck = getLessonCardDeck("plc-fundamentals", "io-troubleshooting")!;
    expect(deck.cards[8].id).toBe("io-08");
    expect(deck.cards[9].id).toBe("io-09");
    expect(deck.cards[9].interaction?.type).toBe("choice");
    expect(deck.cards[9].body).toBe("");
  });

  it("uses dedicated NPN/PNP and PowerFlex fault reference diagrams", () => {
    const prox = getLessonCardDeck("sensors-instrumentation", "proximity-photoelectric")!;
    const overview = getLessonCardDeck("sensors-instrumentation", "sensor-types-overview")!;
    const faults = getLessonCardDeck("powerflex-vfd", "fault-codes-diagnostics")!;
    expect(prox.cards.some((c) => c.visual?.type === "diagram" && c.visual.variant === "npn-pnp-wiring")).toBe(true);
    expect(overview.cards.some((c) => c.visual?.type === "diagram" && c.visual.variant === "npn-pnp-wiring")).toBe(true);
    expect(faults.cards.some((c) => c.visual?.type === "diagram" && c.visual.variant === "powerflex-fault-table")).toBe(true);
  });

  it("every card lesson includes at least one SVG diagram", () => {
    for (const path of LESSON_PRACTICE_MAP) {
      for (const unit of path.units) {
        if (!isCardFormatLesson(path.pathSlug, unit.lessonSlug)) continue;
        const deck = getLessonCardDeck(path.pathSlug, unit.lessonSlug)!;
        const hasDiagram = deck.cards.some((c) => c.visual?.type === "diagram");
        expect(hasDiagram, `${path.pathSlug}/${unit.lessonSlug}`).toBe(true);
      }
    }
  });

  it("uses Packaging Line 4 I/O addresses aligned with conveyor lab", () => {
    const deck = getLessonCardDeck("plc-fundamentals", "io-troubleshooting")!;
    const allText = deck.cards.map((c) => `${c.heading} ${c.body} ${c.takeaway ?? ""}`).join(" ");
    expect(allText).toContain("I:1/2");
    expect(allText).toContain("I:1/5");
    expect(allText).toContain("O:2/0");
    expect(allText).not.toMatch(/I:0\/\d/);
  });
});
