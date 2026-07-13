import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-1",
    email: "owner@company.com",
    name: "Team Owner",
    loginMethod: "manus",
    role: "user",
    stripeCustomerId: "cus_test123",
    subscriptionTier: "team",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("team.getInviteInfo", () => {
  it("returns null for invalid token", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.team.getInviteInfo({ token: "nonexistent-token-xyz" });
    expect(result).toBeNull();
  });
});

describe("team.getMyTeam", () => {
  it("returns null when user has no team", async () => {
    // Use a user ID that won't have a team
    const ctx = createAuthContext({ id: 99999 });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.team.getMyTeam();
    expect(result).toBeNull();
  });
});

describe("team.createInvite", () => {
  it("throws FORBIDDEN when user does not own a team", async () => {
    const ctx = createAuthContext({ id: 99999 });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.team.createInvite({ email: "tech@company.com" })
    ).rejects.toThrow(/don't own a team/);
  });

  it("validates email format", async () => {
    const ctx = createAuthContext({ id: 99999 });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.team.createInvite({ email: "not-an-email" })
    ).rejects.toThrow();
  });
});

describe("team.acceptInvite", () => {
  it("throws NOT_FOUND for invalid invite token", async () => {
    const ctx = createAuthContext({ id: 2 });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.team.acceptInvite({ token: "invalid-token-abc123" })
    ).rejects.toThrow(/Invalid or expired invite/);
  });
});

describe("team.removeMember", () => {
  it("throws FORBIDDEN when user does not own a team", async () => {
    const ctx = createAuthContext({ id: 99999 });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.team.removeMember({ memberId: 1 })
    ).rejects.toThrow(/don't own a team/);
  });
});

describe("team.getTeamProgress", () => {
  it("returns null when user has no team", async () => {
    const ctx = createAuthContext({ id: 99999 });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.team.getTeamProgress();
    expect(result).toBeNull();
  });
});

describe("stripe.createCheckout with team plan", () => {
  it("validates seat count minimum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // seats below minimum (5) should fail validation
    await expect(
      caller.stripe.createCheckout({ plan: "team", seats: 2 })
    ).rejects.toThrow();
  });

  it("validates seat count maximum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // seats above maximum (50) should fail validation
    await expect(
      caller.stripe.createCheckout({ plan: "team", seats: 100 })
    ).rejects.toThrow();
  });
});
