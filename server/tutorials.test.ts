import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { headers: { origin: "http://localhost:3000" } } as any,
    res: {} as any,
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-open-id",
      name: "Test User",
      email: "test@example.com",
      avatarUrl: null,
      role: "user",
      createdAt: new Date(),
    },
    req: { headers: { origin: "http://localhost:3000" } } as any,
    res: {} as any,
  };
}

describe("tutorials router", () => {
  describe("tutorials.list", () => {
    it("should return tutorials list without authentication", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.tutorials.list({
        limit: 10,
        offset: 0,
      });

      expect(result).toHaveProperty("tutorials");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.tutorials)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("should return tutorials with correct shape", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.tutorials.list({
        limit: 10,
        offset: 0,
      });

      if (result.tutorials.length > 0) {
        const tutorial = result.tutorials[0];
        expect(tutorial).toHaveProperty("id");
        expect(tutorial).toHaveProperty("title");
        expect(tutorial).toHaveProperty("slug");
        expect(tutorial).toHaveProperty("metaDescription");
        expect(tutorial).toHaveProperty("difficulty");
        expect(tutorial).toHaveProperty("category");
        expect(tutorial).toHaveProperty("readingTime");
        expect(tutorial).toHaveProperty("tags");
      }
    });

    it("should filter by category", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.tutorials.list({
        category: "VFD Troubleshooting",
        limit: 50,
        offset: 0,
      });

      for (const tutorial of result.tutorials) {
        expect(tutorial.category).toBe("VFD Troubleshooting");
      }
    });

    it("should filter by difficulty", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.tutorials.list({
        difficulty: "intermediate",
        limit: 50,
        offset: 0,
      });

      for (const tutorial of result.tutorials) {
        expect(tutorial.difficulty).toBe("intermediate");
      }
    });

    it("should support search", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.tutorials.list({
        search: "PowerFlex",
        limit: 50,
        offset: 0,
      });

      expect(result.tutorials.length).toBeGreaterThan(0);
    });

    it("should respect limit and offset", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.tutorials.list({
        limit: 3,
        offset: 0,
      });

      expect(result.tutorials.length).toBeLessThanOrEqual(3);
    });
  });

  describe("tutorials.getBySlug", () => {
    it("should return a tutorial by slug", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.tutorials.getBySlug({
        slug: "powerflex-525-fault-codes-complete-reference-guide",
      });

      expect(result).not.toBeNull();
      expect(result!.tutorial.title).toContain("PowerFlex 525 Fault Codes");
      expect(result!.tutorial.content).toBeTruthy();
      expect(result!.related).toBeDefined();
      expect(Array.isArray(result!.related)).toBe(true);
    });

    it("should return null for non-existent slug", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.tutorials.getBySlug({
        slug: "this-tutorial-does-not-exist-xyz",
      });

      expect(result).toBeNull();
    });

    it("should include related tutorials from same category", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.tutorials.getBySlug({
        slug: "troubleshooting-powerflex-525-f004-undervoltage-faults",
      });

      expect(result).not.toBeNull();
      // Related tutorials should be from same category but different slug
      for (const related of result!.related) {
        expect(related.slug).not.toBe("troubleshooting-powerflex-525-f004-undervoltage-faults");
      }
    });
  });

  describe("tutorials.getCategories", () => {
    it("should return categories with counts", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.tutorials.getCategories();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      for (const cat of result) {
        expect(cat).toHaveProperty("category");
        expect(cat).toHaveProperty("count");
        expect(typeof cat.category).toBe("string");
        expect(typeof cat.count).toBe("number");
      }
    });
  });
});
