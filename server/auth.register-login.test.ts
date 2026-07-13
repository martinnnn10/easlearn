import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onDuplicateKeyUpdate: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByEmail: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  createContactSubmission: vi.fn(),
  getContactSubmissions: vi.fn(),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock SDK
vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-jwt-token"),
    authenticateRequest: vi.fn().mockResolvedValue(null),
    verifySession: vi.fn().mockResolvedValue(null),
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
  compare: vi.fn().mockImplementation((plain: string, hashed: string) => {
    // Simulate correct password check
    return Promise.resolve(plain === "correctpassword");
  }),
}));

// Mock email service
vi.mock("./email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true, messageId: "mock-msg-id" }),
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true, messageId: "mock-msg-id" }),
  sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true, messageId: "mock-msg-id" }),
}));

function createMockContext(user: TrpcContext["user"] = null): TrpcContext {
  const cookies: Record<string, unknown> = {};
  return {
    req: {
      headers: { cookie: "" },
      protocol: "https",
      hostname: "localhost",
    } as any,
    res: {
      cookie: vi.fn((name: string, value: unknown, opts: unknown) => {
        cookies[name] = { value, opts };
      }),
      clearCookie: vi.fn(),
    } as any,
    user,
  };
}

describe("auth.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register a new user with valid input", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.register({
      name: "Test User",
      email: "test@example.com",
      password: "securepassword123",
    });

    expect(result.success).toBe(true);
    expect(result.name).toBe("Test User");
    // Should set session cookie
    expect(ctx.res.cookie).toHaveBeenCalledWith(
      "app_session_id",
      "mock-jwt-token",
      expect.objectContaining({
        httpOnly: true,
        path: "/",
      })
    );
  });

  it("should reject registration with existing email", async () => {
    const { getUserByEmail } = await import("./db");
    (getUserByEmail as any).mockResolvedValueOnce({
      id: 1,
      openId: "existing-uuid",
      email: "test@example.com",
      name: "Existing User",
      passwordHash: "$2a$12$existing",
    });

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        name: "Test User",
        email: "test@example.com",
        password: "securepassword123",
      })
    ).rejects.toThrow("An account with this email already exists");
  });

  it("should reject registration with short password", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        name: "Test User",
        email: "test@example.com",
        password: "short",
      })
    ).rejects.toThrow();
  });

  it("should reject registration with invalid email", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        name: "Test User",
        email: "not-an-email",
        password: "securepassword123",
      })
    ).rejects.toThrow();
  });
});

describe("auth.requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return success for non-existent email (prevent enumeration)", async () => {
    const { getUserByEmail } = await import("./db");
    (getUserByEmail as any).mockResolvedValueOnce(undefined);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.requestPasswordReset({
      email: "nonexistent@example.com",
    });

    expect(result.success).toBe(true);
  });

  it("should send reset email for OAuth-only user (no passwordHash)", async () => {
    const { getUserByEmail } = await import("./db");
    (getUserByEmail as any).mockResolvedValueOnce({
      id: 1,
      openId: "oauth-user-uuid",
      email: "oauth@example.com",
      name: "OAuth User",
      passwordHash: null,
      role: "admin",
    });

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.requestPasswordReset({
      email: "oauth@example.com",
    });

    expect(result.success).toBe(true);
  });

  it("should send reset email for email+password user", async () => {
    const { getUserByEmail } = await import("./db");
    (getUserByEmail as any).mockResolvedValueOnce({
      id: 2,
      openId: "email-user-uuid",
      email: "user@example.com",
      name: "Email User",
      passwordHash: "$2a$12$existinghash",
      role: "user",
    });

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.requestPasswordReset({
      email: "user@example.com",
    });

    expect(result.success).toBe(true);
  });
});

describe("auth.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should login with valid credentials", async () => {
    const { getUserByEmail } = await import("./db");
    (getUserByEmail as any).mockResolvedValueOnce({
      id: 1,
      openId: "user-uuid-123",
      email: "test@example.com",
      name: "Test User",
      passwordHash: "$2a$12$hashedpassword",
      role: "user",
    });

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      email: "test@example.com",
      password: "correctpassword",
    });

    expect(result.success).toBe(true);
    expect(result.name).toBe("Test User");
    expect(ctx.res.cookie).toHaveBeenCalledWith(
      "app_session_id",
      "mock-jwt-token",
      expect.objectContaining({
        httpOnly: true,
        path: "/",
      })
    );
  });

  it("should reject login with wrong password", async () => {
    const { getUserByEmail } = await import("./db");
    (getUserByEmail as any).mockResolvedValueOnce({
      id: 1,
      openId: "user-uuid-123",
      email: "test@example.com",
      name: "Test User",
      passwordHash: "$2a$12$hashedpassword",
      role: "user",
    });

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "test@example.com",
        password: "wrongpassword",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should reject login with non-existent email", async () => {
    const { getUserByEmail } = await import("./db");
    (getUserByEmail as any).mockResolvedValueOnce(undefined);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "nonexistent@example.com",
        password: "somepassword",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should reject login for OAuth-only user (no password hash)", async () => {
    const { getUserByEmail } = await import("./db");
    (getUserByEmail as any).mockResolvedValueOnce({
      id: 1,
      openId: "oauth-user-uuid",
      email: "oauth@example.com",
      name: "OAuth User",
      passwordHash: null,
      role: "user",
    });

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "oauth@example.com",
        password: "anypassword",
      })
    ).rejects.toThrow("Invalid email or password");
  });
});
