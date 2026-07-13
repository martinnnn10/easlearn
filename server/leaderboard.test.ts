import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(userId = 1, name = "Test User"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("leaderboard.getLeaderboard", () => {
  it("returns entries array with default params", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.getLeaderboard();
    expect(result).toHaveProperty("entries");
    expect(Array.isArray(result.entries)).toBe(true);
  });

  it("accepts period filter 'week'", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.getLeaderboard({ limit: 10, period: "week" });
    expect(result).toHaveProperty("entries");
    expect(Array.isArray(result.entries)).toBe(true);
  });

  it("accepts period filter 'month'", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.getLeaderboard({ limit: 10, period: "month" });
    expect(result).toHaveProperty("entries");
    expect(Array.isArray(result.entries)).toBe(true);
  });

  it("respects limit parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.getLeaderboard({ limit: 5, period: "all" });
    expect(result.entries.length).toBeLessThanOrEqual(5);
  });

  it("entries have correct shape when data exists", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.getLeaderboard({ limit: 20, period: "all" });
    if (result.entries.length > 0) {
      const entry = result.entries[0];
      expect(entry).toHaveProperty("rank");
      expect(entry).toHaveProperty("userId");
      expect(entry).toHaveProperty("userName");
      expect(entry).toHaveProperty("lessonsCompleted");
      expect(entry).toHaveProperty("quizzesPassed");
      expect(entry).toHaveProperty("totalXP");
      expect(entry).toHaveProperty("certLevel");
      expect(typeof entry.rank).toBe("number");
      expect(typeof entry.totalXP).toBe("number");
    }
  });
});

describe("leaderboard.getMyStats", () => {
  it("returns stats for authenticated user", async () => {
    const ctx = createAuthContext(1, "Test User");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.getMyStats();
    expect(result).not.toBeNull();
    if (result) {
      expect(result).toHaveProperty("rank");
      expect(result).toHaveProperty("totalLearners");
      expect(result).toHaveProperty("lessonsCompleted");
      expect(result).toHaveProperty("quizzesPassed");
      expect(result).toHaveProperty("quizPoints");
      expect(result).toHaveProperty("totalXP");
      expect(result).toHaveProperty("certLevel");
      expect(typeof result.rank).toBe("number");
      expect(typeof result.totalXP).toBe("number");
      expect(result.rank).toBeGreaterThanOrEqual(1);
    }
  });

  it("accepts period filter 'week'", async () => {
    const ctx = createAuthContext(1, "Test User");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.getMyStats({ period: "week" });
    expect(result).not.toBeNull();
    if (result) {
      expect(typeof result.totalXP).toBe("number");
    }
  });

  it("accepts period filter 'month'", async () => {
    const ctx = createAuthContext(1, "Test User");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaderboard.getMyStats({ period: "month" });
    expect(result).not.toBeNull();
    if (result) {
      expect(typeof result.totalXP).toBe("number");
    }
  });
});
