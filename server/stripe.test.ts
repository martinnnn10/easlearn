import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createUnauthContext(): TrpcContext {
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

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("stripe.getSubscription", () => {
  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stripe.getSubscription()).rejects.toThrow("Please login");
  });

  it("returns subscription info for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stripe.getSubscription();
    expect(result).toHaveProperty("tier");
    expect(result).toHaveProperty("hasActiveSubscription");
    expect(result.tier).toBe("free");
    expect(result.hasActiveSubscription).toBe(false);
  });
});

describe("stripe.createCheckout", () => {
  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.stripe.createCheckout({ plan: "pro" })
    ).rejects.toThrow("Please login");
  });
});

describe("stripe.getPlans", () => {
  it("returns plans without stripe price IDs for public access", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stripe.getPlans();
    expect(result).toHaveProperty("free");
    expect(result).toHaveProperty("pro");
    expect(result).toHaveProperty("team");
    // stripePriceId should be removed for public
    expect(result.pro.stripePriceId).toBeUndefined();
    expect(result.team.stripePriceId).toBeUndefined();
  });
});

describe("scenarios.list", () => {
  it("returns an array for public access", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.scenarios.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("scenarios.listAll", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.scenarios.listAll()).rejects.toThrow();
  });

  it("rejects non-admin users", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.scenarios.listAll()).rejects.toThrow("permission");
  });

  it("returns array for admin users", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.scenarios.listAll();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("scenarios.generate", () => {
  it("rejects non-admin users", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.scenarios.generate({
        prompt: "Test scenario about a VFD fault",
        difficulty: "beginner",
        category: "Motor Control",
      })
    ).rejects.toThrow("permission");
  });
});
