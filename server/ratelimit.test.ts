import { describe, it, expect, vi } from "vitest";

/**
 * Rate limiting tests
 * Verifies that express-rate-limit is properly configured in the server
 */

describe("rate limiting configuration", () => {
  it("express-rate-limit package is installed and importable", async () => {
    const mod = await import("express-rate-limit");
    expect(mod.rateLimit).toBeDefined();
    expect(typeof mod.rateLimit).toBe("function");
  });

  it("rate limiter can be instantiated with correct config", async () => {
    const { rateLimit } = await import("express-rate-limit");
    
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests. Please try again later." },
    });

    expect(apiLimiter).toBeDefined();
    expect(typeof apiLimiter).toBe("function");
  });

  it("strict rate limiter can be instantiated with correct config", async () => {
    const { rateLimit } = await import("express-rate-limit");
    
    const strictLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Rate limit exceeded. Please slow down." },
    });

    expect(strictLimiter).toBeDefined();
    expect(typeof strictLimiter).toBe("function");
  });

  it("server index.ts imports and uses rate limiting", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const serverCode = fs.readFileSync(
      path.resolve(__dirname, "./_core/index.ts"),
      "utf-8"
    );
    
    // Verify rate limiting is imported
    expect(serverCode).toContain('import { rateLimit } from "express-rate-limit"');
    
    // Verify limiters are applied to sensitive endpoints
    expect(serverCode).toContain("/api/trpc/contact.submit");
    expect(serverCode).toContain("/api/trpc/assessments.submitResult");
    expect(serverCode).toContain("/api/trpc/scenarios.generate");
    
    // Verify general API limiter is applied
    expect(serverCode).toContain('app.use("/api/trpc", apiLimiter)');
  });
});
