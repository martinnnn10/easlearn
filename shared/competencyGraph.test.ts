import { describe, it, expect } from "vitest";
import { competencyLevel, decayStatus, learningVelocity, isPromotionReady, type CompetencyCell } from "./competencyGraph";

describe("competencyGraph logic", () => {
  it("levels reflect demonstrated confidence + attempts", () => {
    expect(competencyLevel(0, 0)).toBe("not_demonstrated");
    expect(competencyLevel(40, 2)).toBe("developing");
    expect(competencyLevel(55, 2)).toBe("competent");
    expect(competencyLevel(72, 2)).toBe("proficient");
    expect(competencyLevel(90, 3)).toBe("expert");
    expect(competencyLevel(90, 1)).toBe("proficient"); // high score but too few attempts for expert
  });

  it("decay degrades without recent demonstration", () => {
    expect(decayStatus(30)).toBe("fresh");
    expect(decayStatus(200)).toBe("stale");
    expect(decayStatus(400)).toBe("decayed");
    expect(decayStatus(null)).toBe("decayed");
  });

  it("learning velocity is positive when improving", () => {
    expect(learningVelocity([40, 50, 70, 90])).toBeGreaterThan(0);
    expect(learningVelocity([90, 80, 60, 40])).toBeLessThan(0);
    expect(learningVelocity([70])).toBe(0);
  });

  it("promotion-ready needs an expert + breadth of fresh strength", () => {
    const mk = (level: CompetencyCell["level"], decay: CompetencyCell["decay"]): CompetencyCell => ({
      domain: "x", label: "X", confidence: 80, recentConfidence: 80, level, attempts: 3,
      avgTimeSeconds: 100, bestTimeSeconds: 80, lastDemonstrated: null, decay, daysSince: 10, velocity: 5, managerValidated: false,
    });
    expect(isPromotionReady([mk("expert", "fresh"), mk("proficient", "fresh"), mk("proficient", "fresh")])).toBe(true);
    expect(isPromotionReady([mk("competent", "fresh"), mk("competent", "fresh")])).toBe(false);
    expect(isPromotionReady([mk("expert", "fresh"), mk("proficient", "decayed")])).toBe(false); // not enough fresh breadth
  });
});
