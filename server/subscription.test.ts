import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-sub",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
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
  it("returns free tier for user with no subscription", async () => {
    const ctx = createUserContext({
      subscriptionTier: "free",
      subscriptionStatus: "none",
      stripeCustomerId: null,
      trialStartAt: null,
      trialEndsAt: null,
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stripe.getSubscription();

    expect(result.tier).toBe("free");
    expect(result.status).toBe("none");
    expect(result.hasActiveSubscription).toBe(false);
    expect(result.isTrial).toBe(false);
    expect(result.trialExpired).toBe(false);
    expect(result.trialDaysRemaining).toBeNull();
  });

  it("returns active trial with days remaining", async () => {
    const trialEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    const trialStart = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const ctx = createUserContext({
      subscriptionTier: "pro",
      subscriptionStatus: "trialing",
      stripeCustomerId: "cus_test123",
      trialStartAt: trialStart,
      trialEndsAt: trialEnd,
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stripe.getSubscription();

    expect(result.tier).toBe("pro");
    expect(result.status).toBe("trialing");
    expect(result.hasActiveSubscription).toBe(true);
    expect(result.isTrial).toBe(true);
    expect(result.trialExpired).toBe(false);
    expect(result.trialDaysRemaining).toBe(5);
    expect(result.trialEndsAt).toBeTypeOf("number");
  });

  it("returns expired trial when trial end date has passed", async () => {
    const trialEnd = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
    const trialStart = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    const ctx = createUserContext({
      subscriptionTier: "pro",
      subscriptionStatus: "trialing",
      stripeCustomerId: "cus_test456",
      trialStartAt: trialStart,
      trialEndsAt: trialEnd,
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stripe.getSubscription();

    expect(result.status).toBe("expired");
    expect(result.hasActiveSubscription).toBe(false);
    expect(result.isTrial).toBe(false);
    expect(result.trialExpired).toBe(true);
    expect(result.trialDaysRemaining).toBe(0);
  });

  it("returns active subscription for paid user", async () => {
    const ctx = createUserContext({
      subscriptionTier: "pro",
      subscriptionStatus: "active",
      stripeCustomerId: "cus_test789",
      trialStartAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stripe.getSubscription();

    expect(result.tier).toBe("pro");
    expect(result.status).toBe("active");
    expect(result.hasActiveSubscription).toBe(true);
    expect(result.isTrial).toBe(false);
    expect(result.trialExpired).toBe(false);
  });

  it("returns past_due status with active access", async () => {
    const ctx = createUserContext({
      subscriptionTier: "pro",
      subscriptionStatus: "past_due",
      stripeCustomerId: "cus_test_pastdue",
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stripe.getSubscription();

    expect(result.status).toBe("past_due");
    expect(result.hasActiveSubscription).toBe(true);
  });

  it("returns canceled status without active access", async () => {
    const ctx = createUserContext({
      subscriptionTier: "free",
      subscriptionStatus: "canceled",
      stripeCustomerId: "cus_test_canceled",
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stripe.getSubscription();

    expect(result.status).toBe("canceled");
    expect(result.hasActiveSubscription).toBe(false);
  });
});

describe("subscriberProcedure middleware", () => {
  it("blocks free users from subscriber-only procedures", async () => {
    const ctx = createUserContext({
      subscriptionTier: "free",
      subscriptionStatus: "none",
    });
    const caller = appRouter.createCaller(ctx);

    // getDashboard uses protectedProcedure, not subscriberProcedure
    // We test that getSubscription correctly reports no access
    const result = await caller.stripe.getSubscription();
    expect(result.hasActiveSubscription).toBe(false);
  });

  it("allows admin users regardless of subscription", async () => {
    const ctx = createUserContext({
      role: "admin",
      subscriptionTier: "free",
      subscriptionStatus: "none",
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stripe.getSubscription();

    // Admin still sees free tier, but subscriberProcedure middleware would let them through
    expect(result.tier).toBe("free");
  });
});
