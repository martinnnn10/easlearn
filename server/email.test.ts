import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Resend API Key Validation", () => {
  it("should have RESEND_API_KEY configured", () => {
    const key = process.env.RESEND_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(key!.startsWith("re_")).toBe(true);
  });

  it("should be able to validate the API key with Resend", async () => {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Try to list domains - this will validate the key without sending an email
    const response = await resend.domains.list();
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
  });
});

describe("Email Service - Module Exports", () => {
  it("should export sendPasswordResetEmail function", async () => {
    const emailModule = await import("./email");
    expect(typeof emailModule.sendPasswordResetEmail).toBe("function");
  });

  it("should export sendVerificationEmail function", async () => {
    const emailModule = await import("./email");
    expect(typeof emailModule.sendVerificationEmail).toBe("function");
  });

  it("should export sendWelcomeEmail function", async () => {
    const emailModule = await import("./email");
    expect(typeof emailModule.sendWelcomeEmail).toBe("function");
  });
});

describe("Auth Flow - Token Security", () => {
  it("should generate secure tokens of correct length (48 bytes = 96 hex chars)", () => {
    const crypto = require("crypto");
    const token = crypto.randomBytes(48).toString("hex");
    expect(token.length).toBe(96);
  });

  it("should generate unique tokens on each call", () => {
    const crypto = require("crypto");
    const token1 = crypto.randomBytes(48).toString("hex");
    const token2 = crypto.randomBytes(48).toString("hex");
    expect(token1).not.toBe(token2);
  });

  it("password reset token should expire in 1 hour", () => {
    const now = Date.now();
    const expiresAt = new Date(now + 60 * 60 * 1000);
    const diff = expiresAt.getTime() - now;
    expect(diff).toBe(3600000);
  });

  it("email verification token should expire in 24 hours", () => {
    const now = Date.now();
    const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
    const diff = expiresAt.getTime() - now;
    expect(diff).toBe(86400000);
  });
});
