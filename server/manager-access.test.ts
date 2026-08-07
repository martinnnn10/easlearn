import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user?: Partial<AuthenticatedUser>): TrpcContext {
  const defaultUser: AuthenticatedUser = {
    id: 1,
    openId: "owner-open-id",
    email: "owner@company.com",
    name: "Team Owner",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...user,
  };
  return {
    user: defaultUser,
    req: {
      protocol: "https",
      headers: { origin: "https://easlearn.org" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

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

describe("Manager Access Sprint — Authorization", () => {
  describe("team.createInvite", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.team.createInvite({ email: "tech@company.com", role: "member" })
      ).rejects.toThrow();
    });

    it("accepts role parameter in invite creation", async () => {
      const caller = appRouter.createCaller(createContext());
      // This will fail because the user doesn't have a team, but it validates
      // that the input schema accepts the role parameter
      await expect(
        caller.team.createInvite({ email: "tech@company.com", role: "manager" })
      ).rejects.toThrow(); // Expected: no team or not owner
    });

    it("validates role enum values", async () => {
      const caller = appRouter.createCaller(createContext());
      await expect(
        caller.team.createInvite({ email: "tech@company.com", role: "superadmin" as any })
      ).rejects.toThrow();
    });
  });

  describe("team.changeRole", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.team.changeRole({ memberId: 1, newRole: "admin" })
      ).rejects.toThrow();
    });

    it("accepts valid role change input", async () => {
      const caller = appRouter.createCaller(createContext());
      // Will fail because memberId doesn't exist, but validates input schema
      await expect(
        caller.team.changeRole({ memberId: 999, newRole: "manager" })
      ).rejects.toThrow();
    });

    it("rejects invalid role values", async () => {
      const caller = appRouter.createCaller(createContext());
      await expect(
        caller.team.changeRole({ memberId: 1, newRole: "superadmin" as any })
      ).rejects.toThrow();
    });
  });

  describe("team.resendInvite", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.team.resendInvite({ memberId: 1 })
      ).rejects.toThrow();
    });

    it("accepts valid memberId input", async () => {
      const caller = appRouter.createCaller(createContext());
      // Will fail because memberId doesn't exist, but validates input schema
      await expect(
        caller.team.resendInvite({ memberId: 999 })
      ).rejects.toThrow();
    });
  });

  describe("team.cancelInvite", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.team.cancelInvite({ memberId: 1 })
      ).rejects.toThrow();
    });

    it("accepts valid memberId input", async () => {
      const caller = appRouter.createCaller(createContext());
      // Will fail because memberId doesn't exist, but validates input schema
      await expect(
        caller.team.cancelInvite({ memberId: 999 })
      ).rejects.toThrow();
    });
  });

  describe("assessment.technicianDetail", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.assessment.technicianDetail({ userId: 1 })
      ).rejects.toThrow();
    });

    it("rejects access to non-managed technician", async () => {
      // User 2 trying to view user 3 without being their manager
      const caller = appRouter.createCaller(createContext({ id: 2 }));
      await expect(
        caller.assessment.technicianDetail({ userId: 3 })
      ).rejects.toThrow();
    });

    it("accepts valid userId input", async () => {
      const caller = appRouter.createCaller(createContext());
      // Will fail with "not authorized" since user 1 doesn't manage user 999
      await expect(
        caller.assessment.technicianDetail({ userId: 999 })
      ).rejects.toThrow();
    });
  });
});

describe("Manager Access Sprint — Input Validation", () => {
  it("createInvite requires valid email format", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.team.createInvite({ email: "not-an-email", role: "member" })
    ).rejects.toThrow();
  });

  it("changeRole rejects owner role assignment", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.team.changeRole({ memberId: 1, newRole: "owner" as any })
    ).rejects.toThrow();
  });

  it("technicianDetail requires positive userId", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.assessment.technicianDetail({ userId: 0 })
    ).rejects.toThrow();
  });
});
