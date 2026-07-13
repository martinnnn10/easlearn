/**
 * Single source of truth for skill certification levels.
 * UI and claimLevel API must stay aligned.
 */

export type CertificationLevelId = "apprentice" | "journeyman" | "specialist" | "master";

export interface CertificationRequirement {
  modules: number;
  scenarios: number;
  quizzes: number;
}

export const CERTIFICATION_REQUIREMENTS: Record<CertificationLevelId, CertificationRequirement> = {
  apprentice: { modules: 1, scenarios: 1, quizzes: 1 },
  journeyman: { modules: 3, scenarios: 4, quizzes: 3 },
  specialist: { modules: 5, scenarios: 8, quizzes: 5 },
  master: { modules: 6, scenarios: 12, quizzes: 6 },
};

export const CERTIFICATION_LEVEL_ORDER: CertificationLevelId[] = [
  "apprentice",
  "journeyman",
  "specialist",
  "master",
];

export interface CertificationLevelDisplay {
  id: CertificationLevelId;
  title: string;
  description: string;
  requirements: string[];
}

export const CERTIFICATION_LEVELS: CertificationLevelDisplay[] = [
  {
    id: "apprentice",
    title: "EAS Certified Apprentice",
    description:
      "Foundation certification proving you completed core training and cleared at least one troubleshooting scenario.",
    requirements: [
      "Complete 1 course module (all lessons + lesson quizzes)",
      "Pass 1 troubleshooting simulator scenario",
      "Pass 1 module capstone quiz",
    ],
  },
  {
    id: "journeyman",
    title: "EAS Certified Journeyman",
    description:
      "Intermediate certification demonstrating multi-module progress and growing diagnostic competency.",
    requirements: [
      "Earn Apprentice certification first",
      "Complete 3 course modules",
      "Pass 4 distinct troubleshooting scenarios",
      "Pass 3 module capstone quizzes",
    ],
  },
  {
    id: "specialist",
    title: "EAS Certified Specialist",
    description:
      "Advanced certification for technicians handling complex integration and cross-discipline faults.",
    requirements: [
      "Earn Journeyman certification first",
      "Complete 5 course modules",
      "Pass 8 distinct troubleshooting scenarios",
      "Pass 5 module capstone quizzes",
    ],
  },
  {
    id: "master",
    title: "EAS Certified Master Troubleshooter",
    description:
      "Highest EAS certification — broad module completion and extensive scenario mastery.",
    requirements: [
      "Earn Specialist certification first",
      "Complete 6 course modules",
      "Pass 12 distinct troubleshooting scenarios",
      "Pass 6 module capstone quizzes",
    ],
  },
];

export function formatRequirementMessage(
  level: CertificationLevelId,
  counts: { modules: number; scenarios: number; quizzes: number },
): string | null {
  const req = CERTIFICATION_REQUIREMENTS[level];
  if (counts.modules < req.modules) {
    return `Requires ${req.modules} completed course modules (you have ${counts.modules})`;
  }
  if (counts.scenarios < req.scenarios) {
    return `Requires ${req.scenarios} passed troubleshooting scenarios (you have ${counts.scenarios})`;
  }
  if (counts.quizzes < req.quizzes) {
    return `Requires ${req.quizzes} passed module quizzes (you have ${counts.quizzes})`;
  }
  return null;
}
