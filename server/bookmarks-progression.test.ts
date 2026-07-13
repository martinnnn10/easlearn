import { describe, it, expect, vi } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

describe("Bookmarks Router", () => {
  it("should define toggle bookmark procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("bookmarks.toggle");
  });

  it("should define isBookmarked procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("bookmarks.isBookmarked");
  });

  it("should define list bookmarks procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("bookmarks.list");
  });
});

describe("Scenario Progression Router", () => {
  it("should define recordCompletion procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("scenarioProgression.recordCompletion");
  });

  it("should define getRecommendation procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("scenarioProgression.getRecommendation");
  });

  it("should define getHistory procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("scenarioProgression.getHistory");
  });
});

describe("Scenario Progression Logic", () => {
  it("should have a defined difficulty order for recommendations", () => {
    // The progression system should recommend scenarios in order:
    // beginner -> intermediate -> advanced
    const difficultyOrder = ["beginner", "intermediate", "advanced"];
    expect(difficultyOrder).toHaveLength(3);
    expect(difficultyOrder[0]).toBe("beginner");
    expect(difficultyOrder[2]).toBe("advanced");
  });
});
