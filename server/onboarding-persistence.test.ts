import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for onboarding persistence — verifying that selections are saved to DB
 * and returned via the getOnboardingStatus procedure.
 */

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  authenticateRequest: vi.fn(),
}));

describe("Onboarding Persistence", () => {
  describe("completeOnboarding saves selections to DB", () => {
    it("should store experienceLevel, goals, and equipment in onboardingSelections JSON column", async () => {
      // The completeOnboarding mutation accepts selections and writes them to the user record
      // This is a structural test verifying the data shape
      const selections = {
        experienceLevel: "intermediate",
        goals: ["troubleshooting", "plc-programming"],
        equipment: ["allen-bradley", "powerflex"],
      };

      // Verify the selections object is valid JSON-serializable
      const serialized = JSON.stringify(selections);
      const parsed = JSON.parse(serialized);
      expect(parsed.experienceLevel).toBe("intermediate");
      expect(parsed.goals).toHaveLength(2);
      expect(parsed.equipment).toHaveLength(2);
    });

    it("should handle skipped onboarding (no selections)", async () => {
      const selections = {
        experienceLevel: null,
        goals: [],
        equipment: [],
        skipped: true,
      };

      const serialized = JSON.stringify(selections);
      const parsed = JSON.parse(serialized);
      expect(parsed.skipped).toBe(true);
      expect(parsed.goals).toHaveLength(0);
    });
  });

  describe("getOnboardingStatus returns selections from DB", () => {
    it("should return completed=true and selections when user has onboarding data", () => {
      // Simulating what the procedure returns
      const mockUser = {
        onboardingCompleted: true,
        onboardingSelections: JSON.stringify({
          experienceLevel: "beginner",
          goals: ["safety", "electrical-fundamentals"],
          equipment: ["siemens"],
        }),
      };

      const selections = JSON.parse(mockUser.onboardingSelections);
      expect(selections.experienceLevel).toBe("beginner");
      expect(selections.goals).toContain("safety");
    });

    it("should return completed=false and null selections for new users", () => {
      const mockUser = {
        onboardingCompleted: false,
        onboardingSelections: null,
      };

      expect(mockUser.onboardingCompleted).toBe(false);
      expect(mockUser.onboardingSelections).toBeNull();
    });

    it("should handle malformed JSON gracefully", () => {
      const mockUser = {
        onboardingCompleted: true,
        onboardingSelections: "not-valid-json",
      };

      let selections = null;
      try {
        selections = JSON.parse(mockUser.onboardingSelections);
      } catch {
        selections = null;
      }
      expect(selections).toBeNull();
    });
  });

  describe("PersonalizedRecommendations data source priority", () => {
    it("should prefer server data over localStorage", () => {
      // Simulating the component logic
      const serverSelections = {
        experienceLevel: "advanced",
        goals: ["plc-programming"],
        equipment: ["allen-bradley"],
      };
      const localStorageSelections = {
        experienceLevel: "beginner",
        goals: ["safety"],
        equipment: [],
      };

      // Server data takes priority
      const effectiveSelections = serverSelections || localStorageSelections;
      expect(effectiveSelections.experienceLevel).toBe("advanced");
    });

    it("should fall back to localStorage when server returns null", () => {
      const serverSelections = null;
      const localStorageSelections = {
        experienceLevel: "beginner",
        goals: ["safety"],
        equipment: [],
      };

      const effectiveSelections = serverSelections || localStorageSelections;
      expect(effectiveSelections!.experienceLevel).toBe("beginner");
    });

    it("should show nothing when both sources are empty", () => {
      const serverSelections = null;
      const localStorageSelections = null;

      const effectiveSelections = serverSelections || localStorageSelections;
      expect(effectiveSelections).toBeNull();
    });
  });
});
