/**
 * Final QA Tests — Production Readiness Validation
 * 
 * Covers: simulator scenarios, onboarding, search, courses, play modes,
 * methodology scoring, dashboard permissions, roadmap transparency
 */
import { describe, it, expect, vi } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// === 1. Simulator Scenarios ===

describe("Simulator Scenarios", () => {
  it("should define scenarios.list procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("scenarios.list");
  });

  it("should define scenarioProgression.recordCompletion procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("scenarioProgression.recordCompletion");
  });

  it("should define scenarioProgression.getHistory procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("scenarioProgression.getHistory");
  });

  it("should define scenarioProgression.getRecommendation procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("scenarioProgression.getRecommendation");
  });

  it("should define scenarioProgression.getMethodologyProgress procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("scenarioProgression.getMethodologyProgress");
  });

  it("should define scenarioProgression.getCareerStats procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("scenarioProgression.getCareerStats");
  });
});

// === 2. Onboarding Flow ===

describe("Onboarding Flow", () => {
  it("should define auth.getOnboardingStatus procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("auth.getOnboardingStatus");
  });

  it("should define auth.completeOnboarding procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("auth.completeOnboarding");
  });
});

// === 3. Dashboard Permissions ===

describe("Dashboard Permissions", () => {
  it("should define auth.me procedure for role checking", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("auth.me");
  });

  it("should define scenarios.listAll (admin) procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("scenarios.listAll");
  });

  it("should define assessments.list (admin) procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("assessments.list");
  });

  it("should define team.getMyTeam procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("team.getMyTeam");
  });
});

// === 4. Search Functionality ===

describe("Search Functionality", () => {
  it("should define courses.searchIndex procedure for CommandPalette", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("courses.searchIndex");
  });

  it("should define courses.listModules for course browsing", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("courses.listModules");
  });
});

// === 5. All New Courses ===

describe("Course Modules", () => {
  it("should define courses.getModule procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("courses.getModule");
  });

  it("should define courses.getLesson procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("courses.getLesson");
  });

  it("should define courses.markLessonComplete procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("courses.markLessonComplete");
  });

  it("should define courses.getProgress procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("courses.getProgress");
  });

  it("should define courses.getDashboard procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("courses.getDashboard");
  });
});

// === 6. Play Modes (Modular Scenario Architecture) ===

describe("Play Modes — Modular Scenario Architecture", () => {
  it("should export 4 play modes from scenarioModular", async () => {
    const { PLAY_MODES } = await import("../client/src/lib/scenarioModular");
    const modes = Object.keys(PLAY_MODES);
    expect(modes).toContain("standard");
    expect(modes).toContain("timed");
    expect(modes).toContain("guided");
    expect(modes).toContain("minimal_hints");
    expect(modes).toHaveLength(4);
  });

  it("should export 6 difficulty modifiers from scenarioModular", async () => {
    const { DIFFICULTY_MODIFIERS } = await import("../client/src/lib/scenarioModular");
    const modifiers = Object.keys(DIFFICULTY_MODIFIERS);
    expect(modifiers).toContain("standard");
    expect(modifiers).toContain("reduced_tools");
    expect(modifiers).toContain("time_pressure");
    expect(modifiers).toContain("cascading_faults");
    expect(modifiers).toContain("no_prints");
    expect(modifiers).toContain("degraded_readings");
    expect(modifiers).toHaveLength(6);
  });

  it("should have scenario variants registered for at least one scenario", async () => {
    const { SCENARIO_VARIANTS } = await import("../client/src/lib/scenarioModular");
    const scenarioIds = Object.keys(SCENARIO_VARIANTS);
    expect(scenarioIds.length).toBeGreaterThanOrEqual(1);
    
    // Each variant should have availableModes, availableModifiers, and faultVariants
    for (const id of scenarioIds) {
      const config = SCENARIO_VARIANTS[id];
      expect(config.availableModes).toBeDefined();
      expect(config.availableModifiers).toBeDefined();
      expect(config.faultVariants.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("timed mode should have a countdown timer", async () => {
    const { PLAY_MODES } = await import("../client/src/lib/scenarioModular");
    const timedConfig = PLAY_MODES.timed;
    expect(timedConfig.timedCountdown).toBe(true);
    expect(timedConfig.timeLimitMultiplier).toBeDefined();
    expect(timedConfig.timeLimitMultiplier).toBeGreaterThan(0);
  });

  it("guided mode should allow hints", async () => {
    const { PLAY_MODES } = await import("../client/src/lib/scenarioModular");
    const guidedConfig = PLAY_MODES.guided;
    expect(guidedConfig.hintsEnabled).toBe(true);
  });
});

// === 7. Methodology Scoring ===

describe("Methodology Scoring — Integration", () => {
  it("should export calculateMethodologyScore from scoringEngine", async () => {
    const { calculateMethodologyScore } = await import("../client/src/lib/scoringEngine");
    expect(typeof calculateMethodologyScore).toBe("function");
  });

  it("scoring engine should return 8 dimensions", async () => {
    const { calculateMethodologyScore } = await import("../client/src/lib/scoringEngine");
    
    // Minimal input for a quick test
    const result = calculateMethodologyScore({
      actions: [],
      discoveredClues: [],
      hintsUsed: 0,
      timeSeconds: 600,
      faultsFixed: 1,
      totalFaults: 1,
      role: "experienced",
      scenario: {
        id: "test",
        title: "Test",
        type: "Test",
        version: 3,
        estimatedMinutes: { new: 15, experienced: 10, senior: 7 },
        description: "Test",
        faults: [{ id: "f1", name: "Test", category: "electrical", difficulty: "intermediate", description: "Test", rootCause: "Test", symptoms: [], requiredClues: [], fixAction: "fix", fixDescription: "Fix", verificationStep: "Verify" }],
        plantContext: { plantName: "P", lineName: "L", lineNumber: "1", shift: "Day", shiftTime: "7AM", downstreamImpact: "N", waitingOn: "M", productionRate: "100", costPerMinute: "$50", downSince: "30m" },
        faultLog: [],
        glossary: [],
        tools: [{ id: "multimeter", name: "Fluke", icon: "Gauge", description: "DMM", availableFor: ["experienced"], meterSettings: ["vac"] }],
        diagram: { components: [], connections: [], labels: [], viewBox: "0 0 800 600" },
        systemStates: {},
        phases: [{ id: "p1", title: "Phase 1", description: "D", objectives: [], availableTools: [], components: [], terminalMeasurements: [], checkpoints: [], unlockConditions: [] }],
        timePressure: [],
        communications: [],
        scoring: { clueDiscovery: 15, efficiencyBonus: 10, unnecessaryMeasurementPenalty: -3, seniorCheckpointCorrect: 10, hintPenalty: -5, wrongSettingPenalty: -5, unsafeActionPenalty: -10, communicationBonus: 5, optimalOrderBonus: 10, timeBonuses: [], maxScore: 100, passingScore: 60 },
        ambientAnimations: [],
      } as any,
      consequenceLog: [],
      communicationsUsed: [],
    });

    expect(result.dimensions).toHaveLength(8);
    expect(result.overallPercentage).toBeGreaterThanOrEqual(0);
    expect(result.overallPercentage).toBeLessThanOrEqual(100);
    expect(result.methodologyTier).toBeDefined();
    expect(result.coachingTips.length).toBeGreaterThanOrEqual(0);
  });
});

// === 8. Roadmap Transparency ===

describe("Roadmap Transparency", () => {
  it("should not have fabricated testimonials in the codebase", async () => {
    // We verify that the Home page doesn't contain fake testimonial names
    // This is a structural check — the actual content was replaced with honest stats
    const fs = await import("fs");
    const homePage = fs.readFileSync("client/src/pages/Home.tsx", "utf-8");
    expect(homePage).not.toContain("Sarah Johnson");
    expect(homePage).not.toContain("Mike Chen");
    expect(homePage).not.toContain("testimonial");
  });

  it("certificates should have honest disclaimer language", async () => {
    const fs = await import("fs");
    const certPage = fs.readFileSync("client/src/pages/Certificate.tsx", "utf-8");
    // Should not claim industry-recognized
    expect(certPage.toLowerCase()).not.toContain("industry-recognized");
    // Should include a disclaimer about internal certification
    expect(certPage.toLowerCase()).toContain("internal skill-validation certificate");
    expect(certPage.toLowerCase()).toContain("not accredited");
  });
});

// === 9. Streak Tracking ===

describe("Streak Tracking", () => {
  it("should define streaks.getMyStreak procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("streaks.getMyStreak");
  });

  it("should define streaks.recordActivity procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("streaks.recordActivity");
  });
});

// === 10. Leaderboard ===

describe("Leaderboard", () => {
  it("should define leaderboard.getLeaderboard procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("leaderboard.getLeaderboard");
  });

  it("should define leaderboard.getMyStats procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("leaderboard.getMyStats");
  });
});
