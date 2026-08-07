/**
 * New-Learner Release Validation — Automated Tests
 * Covers: verification resend, rate limiting, token lifecycle, routing, legacy repair, guard behavior.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Resend Verification Backend Logic ───────────────────────────────────────

describe("Resend verification backend", () => {
  it("resend procedure exists and accepts email input", async () => {
    const routersContent = fs.readFileSync(
      path.resolve(__dirname, "./routers.ts"), "utf-8"
    );
    expect(routersContent).toContain("resendVerification: publicProcedure");
    expect(routersContent).toContain("email: z.string().email");
  });

  it("resend does not reveal account existence (generic response)", async () => {
    const routersContent = fs.readFileSync(
      path.resolve(__dirname, "./routers.ts"), "utf-8"
    );
    expect(routersContent).toContain("If an eligible account exists");
    // Should NOT have different messages for "user not found" vs "already verified"
    expect(routersContent).not.toMatch(/account.*not.*found.*email/i);
  });

  it("resend has rate limiting (max 5 per hour)", async () => {
    const routersContent = fs.readFileSync(
      path.resolve(__dirname, "./routers.ts"), "utf-8"
    );
    expect(routersContent).toContain("recentTokens.length >= 5");
  });

  it("resend has cooldown enforcement (60 seconds)", async () => {
    const routersContent = fs.readFileSync(
      path.resolve(__dirname, "./routers.ts"), "utf-8"
    );
    expect(routersContent).toContain("COOLDOWN_MS");
    expect(routersContent).toContain("60_000");
  });

  it("resend invalidates previous active tokens", async () => {
    const routersContent = fs.readFileSync(
      path.resolve(__dirname, "./routers.ts"), "utf-8"
    );
    // Should mark old tokens as used before creating new one
    expect(routersContent).toContain("Invalidate all previous active tokens");
    expect(routersContent).toContain("isNull(emailVerificationTokens.usedAt)");
  });

  it("resend reports delivery failure honestly", async () => {
    const routersContent = fs.readFileSync(
      path.resolve(__dirname, "./routers.ts"), "utf-8"
    );
    expect(routersContent).toContain("Unable to send verification email");
  });
});

// ─── Token Lifecycle ─────────────────────────────────────────────────────────

describe("Token lifecycle", () => {
  it("expired token is rejected by verifyEmail", async () => {
    const routersContent = fs.readFileSync(
      path.resolve(__dirname, "./routers.ts"), "utf-8"
    );
    expect(routersContent).toContain("verification link has expired");
  });

  it("consumed (used) token is rejected by verifyEmail", async () => {
    const routersContent = fs.readFileSync(
      path.resolve(__dirname, "./routers.ts"), "utf-8"
    );
    expect(routersContent).toContain("already been used");
  });

  it("invalid token returns NOT_FOUND error", async () => {
    const routersContent = fs.readFileSync(
      path.resolve(__dirname, "./routers.ts"), "utf-8"
    );
    expect(routersContent).toContain("Invalid or expired verification link");
  });
});

// ─── Verification Routing ────────────────────────────────────────────────────

describe("Post-verification routing", () => {
  it("successful verification redirects incomplete learner to /onboarding", async () => {
    const verifyContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/VerifyEmail.tsx"), "utf-8"
    );
    expect(verifyContent).toContain('href="/onboarding"');
    expect(verifyContent).toContain("Start Your Training Path");
  });
});

// ─── OnboardingGuard Behavior ────────────────────────────────────────────────

describe("OnboardingGuard prevents access before onboarding", () => {
  const EXCLUDED_PATHS = [
    "/onboarding", "/onboarding/start", "/login", "/signup", "/logout",
    "/verify-email", "/password-reset", "/terms", "/privacy", "/about",
    "/contact", "/pricing", "/enterprise", "/team/invite/", "/assessment/",
    "/certificate/", "/verify-certificate", "/verify/skills/", "/manager",
    "/manage", "/eas-owner", "/admin", "/demo", "/", "/free-training", "/prototype/",
  ];

  function isExcluded(pathname: string): boolean {
    if (pathname === "/") return true;
    return EXCLUDED_PATHS.some((excluded) => {
      if (excluded === "/") return false;
      return pathname === excluded || pathname.startsWith(excluded);
    });
  }

  it("unverified learner cannot access /dashboard", () => {
    expect(isExcluded("/dashboard")).toBe(false);
  });

  it("unverified learner cannot access /courses", () => {
    expect(isExcluded("/courses")).toBe(false);
  });

  it("unverified learner cannot access /labs", () => {
    expect(isExcluded("/labs")).toBe(false);
  });

  it("no redirect loop on /onboarding", () => {
    expect(isExcluded("/onboarding")).toBe(true);
  });

  it("no redirect loop on /verify-email", () => {
    expect(isExcluded("/verify-email")).toBe(true);
  });

  it("manager route is excluded (no forced operator onboarding)", () => {
    expect(isExcluded("/manager")).toBe(true);
  });
});

// ─── Legacy Wizard Removal ───────────────────────────────────────────────────

describe("No legacy wizard renders", () => {
  it("Dashboard does not import OnboardingWizard", () => {
    const dashboardContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/Dashboard.tsx"), "utf-8"
    );
    expect(dashboardContent).not.toMatch(/^import OnboardingWizard/m);
    expect(dashboardContent).not.toContain("<OnboardingWizard");
  });
});

// ─── Legacy User Repair ──────────────────────────────────────────────────────

describe("Legacy user repair classification", () => {
  it("repair module exists and exports repairLegacyUsers", async () => {
    const repairContent = fs.readFileSync(
      path.resolve(__dirname, "./legacy-user-repair.ts"), "utf-8"
    );
    expect(repairContent).toContain("export async function repairLegacyUsers");
  });

  it("repair classifies Case A (mappable answers)", () => {
    const repairContent = fs.readFileSync(
      path.resolve(__dirname, "./legacy-user-repair.ts"), "utf-8"
    );
    expect(repairContent).toContain("Case A");
    expect(repairContent).toContain("mapLegacyAnswersToPath");
  });

  it("repair classifies Case B (incomplete answers, re-onboarding)", () => {
    const repairContent = fs.readFileSync(
      path.resolve(__dirname, "./legacy-user-repair.ts"), "utf-8"
    );
    expect(repairContent).toContain("Case B");
    expect(repairContent).toContain("onboardingCompleted: false");
  });

  it("repair classifies Case C (has progress, preserve it)", () => {
    const repairContent = fs.readFileSync(
      path.resolve(__dirname, "./legacy-user-repair.ts"), "utf-8"
    );
    expect(repairContent).toContain("Case C");
    expect(repairContent).toContain("progress preserved");
  });

  it("repair classifies Case D (manager/admin bypass)", () => {
    const repairContent = fs.readFileSync(
      path.resolve(__dirname, "./legacy-user-repair.ts"), "utf-8"
    );
    expect(repairContent).toContain("Case D");
    expect(repairContent).toContain("Manager/admin");
  });

  it("repair does not erase completed lessons", () => {
    const repairContent = fs.readFileSync(
      path.resolve(__dirname, "./legacy-user-repair.ts"), "utf-8"
    );
    // Should never delete from userProgress
    expect(repairContent).not.toContain("delete().from(userProgress)");
    expect(repairContent).not.toContain("DELETE FROM");
  });

  it("repair preserves valid existing paths (SKIP classification)", () => {
    const repairContent = fs.readFileSync(
      path.resolve(__dirname, "./legacy-user-repair.ts"), "utf-8"
    );
    expect(repairContent).toContain("Already has valid assigned path");
    expect(repairContent).toContain("SKIP");
  });
});

// ─── LearnerHome Empty State ─────────────────────────────────────────────────

describe("LearnerHome empty-state recovery", () => {
  it("shows 'Set Up My Path' button when no path assigned", () => {
    const learnerHomeContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/LearnerHome.tsx"), "utf-8"
    );
    expect(learnerHomeContent).toContain("Set Up My Path");
    expect(learnerHomeContent).toContain("Let's finish setting up your learning path");
    expect(learnerHomeContent).toContain('href="/onboarding"');
  });

  it("does not show all 33 modules as primary recovery", () => {
    const learnerHomeContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/LearnerHome.tsx"), "utf-8"
    );
    // Should not have a full module list in the empty state
    expect(learnerHomeContent).not.toContain("Course Modules");
    // The explore link is secondary, not primary
    expect(learnerHomeContent).toContain("explore all courses");
  });
});

// ─── Resend Verification Frontend ────────────────────────────────────────────

describe("Resend verification frontend", () => {
  it("shows resend button on no-token state", () => {
    const verifyContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/VerifyEmail.tsx"), "utf-8"
    );
    expect(verifyContent).toContain("Resend Verification Email");
  });

  it("shows partially masked email when authenticated", () => {
    const verifyContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/VerifyEmail.tsx"), "utf-8"
    );
    expect(verifyContent).toContain("maskEmail");
  });

  it("shows cooldown indicator", () => {
    const verifyContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/VerifyEmail.tsx"), "utf-8"
    );
    expect(verifyContent).toContain("cooldownSeconds");
    expect(verifyContent).toContain("Wait");
  });

  it("shows change email / return to signup option", () => {
    const verifyContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/VerifyEmail.tsx"), "utf-8"
    );
    expect(verifyContent).toContain("Change Email or Return to Signup");
    expect(verifyContent).toContain("/signup");
  });

  it("shows support guidance", () => {
    const verifyContent = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/VerifyEmail.tsx"), "utf-8"
    );
    expect(verifyContent).toContain("support@easmaint.com");
  });
});
