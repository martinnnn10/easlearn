import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  normalizeAssessmentScenarioId,
  validateAssessmentScenarioIds,
} from "@shared/scenarioRegistry";

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

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@test.com",
      name: "Regular User",
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

describe("assessments", () => {
  describe("scenario registry (Q-05)", () => {
    it("normalizes legacy admin scenario ids for existing assessments", () => {
      expect(normalizeAssessmentScenarioId("motor-starter-chatter")).toBe("starter-chatter");
      expect(validateAssessmentScenarioIds(["motor-starter-chatter"]).valid).toBe(true);
    });

    it("accepts V3 scenario ids for new assessments", () => {
      expect(
        validateAssessmentScenarioIds(["plc-io-fault-v3", "failed-safety-relay"]).valid
      ).toBe(true);
    });
  });

  describe("assessments.create", () => {
    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.assessments.create({
          candidateName: "John Doe",
          candidateEmail: "john@example.com",
          scenarioIds: ["conveyor-estop"],
          timeLimitMinutes: 60,
          expiresInDays: 7,
        })
      ).rejects.toThrow();
    });

    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.assessments.create({
          candidateName: "John Doe",
          candidateEmail: "john@example.com",
          scenarioIds: ["conveyor-estop"],
          timeLimitMinutes: 60,
          expiresInDays: 7,
        })
      ).rejects.toThrow();
    });
  });

  describe("assessments.getByToken", () => {
    it("throws error for non-existent token", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.assessments.getByToken({ token: "nonexistent-token-123" })
      ).rejects.toThrow();
    });
  });

  describe("assessments.start", () => {
    it("throws error for non-existent token", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.assessments.start({ token: "nonexistent-token-456" })
      ).rejects.toThrow();
    });
  });

  describe("assessments.listScenarios", () => {
    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(caller.assessments.listScenarios()).rejects.toThrow();
    });

    it("returns unified registry for admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const scenarios = await caller.assessments.listScenarios();
      expect(scenarios.length).toBeGreaterThanOrEqual(20);
      expect(scenarios.some((s) => s.engineVersion === "v1")).toBe(true);
      expect(scenarios.some((s) => s.engineVersion === "v2")).toBe(true);
      expect(scenarios.some((s) => s.engineVersion === "v3")).toBe(true);
    });
  });

  describe("assessments.list", () => {
    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(caller.assessments.list()).rejects.toThrow();
    });

    it("returns array for admin users", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.assessments.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("assessments.submitResult", () => {
    it("throws error for non-existent assessment token", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.assessments.submitResult({
          token: "nonexistent-token-789",
          scenarioId: "conveyor-estop",
          scenarioTitle: "Conveyor E-Stop Chain Open",
          score: 85,
          maxScore: 100,
          percentage: 85,
          grade: "B",
          timeSeconds: 120,
        })
      ).rejects.toThrow();
    });
  });
});
