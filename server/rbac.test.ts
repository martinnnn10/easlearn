import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@eas.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      stripeCustomerId: null,
      subscriptionTier: "free",
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

function createStandardUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "standard-user",
      email: "user@test.com",
      name: "Standard User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      stripeCustomerId: null,
      subscriptionTier: "free",
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

describe("RBAC — Admin Access Control", () => {
  describe("Standard user CANNOT access admin procedures", () => {
    const caller = appRouter.createCaller(createStandardUserContext());

    it("rejects scenarios.listAll", async () => {
      await expect(caller.scenarios.listAll()).rejects.toThrow(/permission/i);
    });

    it("rejects scenarios.generate", async () => {
      await expect(
        caller.scenarios.generate({
          prompt: "test",
          difficulty: "beginner",
          category: "Motor Control",
        })
      ).rejects.toThrow(/permission/i);
    });

    it("rejects scenarios.publish", async () => {
      await expect(
        caller.scenarios.publish({ id: "fake-id" })
      ).rejects.toThrow(/permission/i);
    });

    it("rejects scenarios.unpublish", async () => {
      await expect(
        caller.scenarios.unpublish({ id: "fake-id" })
      ).rejects.toThrow(/permission/i);
    });

    it("rejects scenarios.delete", async () => {
      await expect(
        caller.scenarios.delete({ id: "fake-id" })
      ).rejects.toThrow(/permission/i);
    });

    it("rejects assessments.create", async () => {
      await expect(
        caller.assessments.create({
          candidateName: "Test",
          candidateEmail: "test@test.com",
          scenarioIds: ["conveyor-estop"],
          timeLimitMinutes: 60,
          expiresInDays: 7,
        })
      ).rejects.toThrow(/permission/i);
    });

    it("rejects assessments.list", async () => {
      await expect(caller.assessments.list()).rejects.toThrow(/permission/i);
    });

    it("rejects digest.getWeeklyDigest", async () => {
      await expect(caller.digest.getWeeklyDigest()).rejects.toThrow(/permission/i);
    });

    it("rejects digest.sendWeeklyDigest", async () => {
      await expect(caller.digest.sendWeeklyDigest()).rejects.toThrow(/permission/i);
    });
  });

  describe("Unauthenticated user CANNOT access admin procedures", () => {
    const caller = appRouter.createCaller(createUnauthenticatedContext());

    it("rejects scenarios.listAll", async () => {
      await expect(caller.scenarios.listAll()).rejects.toThrow();
    });

    it("rejects assessments.list", async () => {
      await expect(caller.assessments.list()).rejects.toThrow();
    });

    it("rejects scenarios.generate", async () => {
      await expect(
        caller.scenarios.generate({
          prompt: "test",
          difficulty: "beginner",
          category: "Motor Control",
        })
      ).rejects.toThrow();
    });
  });

  describe("Admin user CAN access admin procedures", () => {
    const caller = appRouter.createCaller(createAdminContext());

    it("allows scenarios.listAll", async () => {
      // Should not throw — may return empty array or data
      const result = await caller.scenarios.listAll();
      expect(Array.isArray(result)).toBe(true);
    });

    it("allows assessments.list", async () => {
      const result = await caller.assessments.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
