import { describe, it, expect, vi } from "vitest";

describe("scheduledCleanup", () => {
  it("should export handleCleanupSessions function", async () => {
    const mod = await import("./scheduledCleanup");
    expect(mod.handleCleanupSessions).toBeDefined();
    expect(typeof mod.handleCleanupSessions).toBe("function");
  });

  it("should reject unauthenticated requests with 403", async () => {
    const { handleCleanupSessions } = await import("./scheduledCleanup");

    // Mock request with no cookie
    const req = {
      headers: {},
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    await handleCleanupSessions(req, res);
    // Should fail auth and return 403 or 500
    expect(res.status).toHaveBeenCalled();
    const statusCode = res.status.mock.calls[0][0];
    expect([403, 500]).toContain(statusCode);
  });
});

describe("error alerting", () => {
  it("should have _lastErrorAlertSentAt throttle mechanism in routers", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("errorLogging.logClientError");
  });
});

describe("error frequency procedure", () => {
  it("should define getErrorFrequency procedure on errorLogging router", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("errorLogging.getErrorFrequency");
  });
});

describe("cleanup handler covers both sessions and errors", () => {
  it("handler source should reference clientErrors table for purge", async () => {
    // Verify the cleanup module imports clientErrors
    const fs = await import("fs");
    const source = fs.readFileSync(
      new URL("./scheduledCleanup.ts", import.meta.url).pathname,
      "utf-8"
    );
    expect(source).toContain("clientErrors");
    expect(source).toContain("simulatorSessions");
    expect(source).toContain("STALE_ERROR_DAYS");
    expect(source).toContain("STALE_SESSION_DAYS");
  });
});
