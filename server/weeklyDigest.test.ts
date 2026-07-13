import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatDigestNotification, type WeeklyDigestData } from "./weeklyDigest";

// Test the digest formatting (pure function, no DB needed)
describe("weeklyDigest", () => {
  describe("formatDigestNotification", () => {
    it("should format a complete digest with top learners", () => {
      const data: WeeklyDigestData = {
        periodStart: "2026-05-03",
        periodEnd: "2026-05-10",
        totalActiveLearners: 15,
        newUsersThisWeek: 3,
        totalLessonsCompleted: 42,
        totalQuizzesPassed: 8,
        totalScenariosCompleted: 5,
        topLearners: [
          {
            userId: 1,
            userName: "Alice Smith",
            email: "alice@example.com",
            lessonsCompleted: 12,
            quizzesPassed: 3,
            quizPoints: 85,
            scenariosCompleted: 2,
            totalXP: 340,
            rank: 1,
            rankChange: 0,
          },
          {
            userId: 2,
            userName: "Bob Jones",
            email: "bob@example.com",
            lessonsCompleted: 8,
            quizzesPassed: 2,
            quizPoints: 70,
            scenariosCompleted: 1,
            totalXP: 245,
            rank: 2,
            rankChange: 0,
          },
        ],
        mostActiveModule: "Electrical Fundamentals",
        platformTotalXP: 585,
      };

      const { title, content } = formatDigestNotification(data);

      // Check title format
      expect(title).toBe("EAS Weekly Digest: 2026-05-03 – 2026-05-10");

      // Check content includes key stats
      expect(content).toContain("Active Learners: 15");
      expect(content).toContain("New Signups: 3");
      expect(content).toContain("Lessons Completed: 42");
      expect(content).toContain("Quizzes Passed: 8");
      expect(content).toContain("Scenarios Completed: 5");
      expect(content).toContain("Total XP Earned: 585");
      expect(content).toContain("Most Active Module: Electrical Fundamentals");

      // Check top learners
      expect(content).toContain("Alice Smith");
      expect(content).toContain("340 XP");
      expect(content).toContain("Bob Jones");
      expect(content).toContain("245 XP");

      // Check medal emojis
      expect(content).toContain("🥇");
      expect(content).toContain("🥈");
    });

    it("should handle empty learner list gracefully", () => {
      const data: WeeklyDigestData = {
        periodStart: "2026-05-03",
        periodEnd: "2026-05-10",
        totalActiveLearners: 0,
        newUsersThisWeek: 0,
        totalLessonsCompleted: 0,
        totalQuizzesPassed: 0,
        totalScenariosCompleted: 0,
        topLearners: [],
        mostActiveModule: null,
        platformTotalXP: 0,
      };

      const { title, content } = formatDigestNotification(data);

      expect(title).toContain("EAS Weekly Digest");
      expect(content).toContain("Active Learners: 0");
      expect(content).toContain("(No activity this week)");
      // Should not contain module line when null
      expect(content).not.toContain("Most Active Module");
    });

    it("should limit top learners display to 5", () => {
      const topLearners = Array.from({ length: 10 }, (_, i) => ({
        userId: i + 1,
        userName: `Learner ${i + 1}`,
        email: `learner${i + 1}@example.com`,
        lessonsCompleted: 10 - i,
        quizzesPassed: 5 - Math.floor(i / 2),
        quizPoints: 100 - i * 10,
        scenariosCompleted: 3 - Math.floor(i / 3),
        totalXP: 500 - i * 50,
        rank: i + 1,
        rankChange: 0,
      }));

      const data: WeeklyDigestData = {
        periodStart: "2026-05-03",
        periodEnd: "2026-05-10",
        totalActiveLearners: 10,
        newUsersThisWeek: 0,
        totalLessonsCompleted: 55,
        totalQuizzesPassed: 30,
        totalScenariosCompleted: 15,
        topLearners,
        mostActiveModule: "VFD Programming",
        platformTotalXP: 2750,
      };

      const { content } = formatDigestNotification(data);

      // Should show first 5 learners
      expect(content).toContain("Learner 1");
      expect(content).toContain("Learner 5");
      // Should NOT show learner 6+
      expect(content).not.toContain("Learner 6");
    });
  });
});

// Test the digest tRPC procedures via router
describe("digest router", () => {
  it("should require admin access for getWeeklyDigest", async () => {
    const { appRouter } = await import("./routers");

    // Public caller (no user)
    const publicCaller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: { clearCookie: vi.fn() } as any,
    });

    await expect(publicCaller.digest.getWeeklyDigest()).rejects.toThrow();
  });

  it("should require admin access for sendWeeklyDigest", async () => {
    const { appRouter } = await import("./routers");

    // Regular user caller
    const userCaller = appRouter.createCaller({
      user: { id: 1, openId: "test", name: "Test", role: "user" } as any,
      req: {} as any,
      res: { clearCookie: vi.fn() } as any,
    });

    await expect(userCaller.digest.sendWeeklyDigest()).rejects.toThrow();
  });
});
