/**
 * Standard lesson structure — every card-format lesson should include these elements.
 * Used for authoring validation and manager dashboard copy.
 */
export const LESSON_STANDARD_SECTIONS = [
  "plantScenario",
  "learningObjective",
  "whyItMatters",
  "maintenanceMindset",
  "stepByStepMethod",
  "commonMistakes",
  "interactiveCheck",
  "practicalAssessment",
  "competencyTags",
  "managerDashboardOutput",
  "aiCoachPrompt",
  "nextRecommendedLesson",
] as const;

export type LessonStandardSection = (typeof LESSON_STANDARD_SECTIONS)[number];

export const LESSON_STANDARD_LABELS: Record<LessonStandardSection, string> = {
  plantScenario: "Plant-floor scenario",
  learningObjective: "Learning objective",
  whyItMatters: "Why it matters",
  maintenanceMindset: "Maintenance mindset",
  stepByStepMethod: "Step-by-step method",
  commonMistakes: "Common mistakes",
  interactiveCheck: "Interactive check",
  practicalAssessment: "Practical assessment",
  competencyTags: "Competency tags",
  managerDashboardOutput: "Manager dashboard output",
  aiCoachPrompt: "AI coach prompt",
  nextRecommendedLesson: "Next recommended lesson",
};
