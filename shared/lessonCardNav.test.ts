import { describe, expect, it } from "vitest";
import { clampCardIndex } from "./lessonCardNav";

describe("lessonCardNav", () => {
  it("clamps card index within bounds", () => {
    expect(clampCardIndex(-1, 11)).toBe(0);
    expect(clampCardIndex(0, 11)).toBe(0);
    expect(clampCardIndex(5, 11)).toBe(5);
    expect(clampCardIndex(10, 11)).toBe(10);
    expect(clampCardIndex(99, 11)).toBe(10);
  });
});
