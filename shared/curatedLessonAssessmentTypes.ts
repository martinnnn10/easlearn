export interface CuratedMcq {
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface CuratedLessonAssessment {
  moduleSlug: string;
  lessonSlug: string;
  auditedKnowledgeCheck: number;
  auditedQuiz: number;
  knowledgeChecks: CuratedMcq[];
  lessonQuizzes: CuratedMcq[];
}

export type CuratedAssessmentKey = `${string}/${string}`;
