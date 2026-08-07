import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user?: Partial<AuthenticatedUser>): TrpcContext {
  const defaultUser: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@company.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...user,
  };
  return {
    user: defaultUser,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("Onboarding — Authorization", () => {
  it("complete rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.onboarding.complete({ persona: "operator", experience: "none", goal: "move_to_maintenance" })
    ).rejects.toThrow();
  });

  it("getMyPath rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.onboarding.getMyPath()
    ).rejects.toThrow();
  });

  it("trackEvent rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.onboarding.trackEvent({ event: "test" })
    ).rejects.toThrow();
  });
});

describe("Onboarding — Input Validation", () => {
  it("complete rejects invalid persona", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.onboarding.complete({ persona: "invalid" as any, experience: "none", goal: "move_to_maintenance" })
    ).rejects.toThrow();
  });

  it("complete rejects invalid experience level", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.onboarding.complete({ persona: "operator", experience: "invalid" as any, goal: "move_to_maintenance" })
    ).rejects.toThrow();
  });

  it("complete rejects invalid goal", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.onboarding.complete({ persona: "operator", experience: "none", goal: "invalid" as any })
    ).rejects.toThrow();
  });

  it("trackEvent rejects event longer than 60 chars", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.onboarding.trackEvent({ event: "a".repeat(61) })
    ).rejects.toThrow();
  });
});

describe("Onboarding — Path Assignment Logic", () => {
  it("operator + none + move_to_maintenance → operator_to_tech path", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.onboarding.complete({
      persona: "operator",
      experience: "none",
      goal: "move_to_maintenance",
    });
    expect(result.path).not.toBeNull();
    expect(result.path!.id).toBe("operator_to_tech");
    expect(result.path!.firstLesson.moduleSlug).toBe("maintenance-orientation");
    expect(result.redirectTo).toBeNull();
  });

  it("leader persona → redirects to /manager, no path", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.onboarding.complete({
      persona: "leader",
      experience: "experienced",
      goal: "manage_team",
    });
    expect(result.path).toBeNull();
    expect(result.redirectTo).toBe("/manager");
  });

  it("experienced_tech + improve_plc → advanced_diagnostics", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.onboarding.complete({
      persona: "experienced_tech",
      experience: "experienced",
      goal: "improve_plc",
    });
    expect(result.path).not.toBeNull();
    expect(result.path!.id).toBe("advanced_diagnostics");
  });

  it("controls_tech + any → controls_specialist", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.onboarding.complete({
      persona: "controls_tech",
      experience: "experienced",
      goal: "more_responsibility",
    });
    expect(result.path).not.toBeNull();
    expect(result.path!.id).toBe("controls_specialist");
  });

  it("new_tech + basic + build_troubleshooting → operator_to_tech", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.onboarding.complete({
      persona: "new_tech",
      experience: "basic",
      goal: "build_troubleshooting",
    });
    expect(result.path).not.toBeNull();
    expect(result.path!.id).toBe("operator_to_tech");
  });

  it("new_tech + developing → troubleshooting_builder", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.onboarding.complete({
      persona: "new_tech",
      experience: "developing",
      goal: "build_troubleshooting",
    });
    expect(result.path).not.toBeNull();
    expect(result.path!.id).toBe("troubleshooting_builder");
  });
});
