import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { resolveSimulatorScenarioId } from "@shared/scenarioLinking";
import {
  courseLessons,
  lessonAssessmentAttempts,
  lessonAssessmentQuestions,
  scenarioCompletions,
  userProgress,
} from "../drizzle/schema";
import {
  didPass,
  KNOWLEDGE_CHECK_PASS_PERCENT,
  LESSON_QUIZ_COOLDOWN_HOURS,
  LESSON_QUIZ_MAX_ATTEMPTS,
  LESSON_QUIZ_PASS_PERCENT,
  scorePercent,
  type AssessmentType,
} from "@shared/assessment";

type Db = MySql2Database<Record<string, unknown>>;

export type LessonGateStatus = {
  lessonId: number;
  orderIndex: number;
  unlocked: boolean;
  knowledgeCheckPassed: boolean;
  lessonQuizPassed: boolean;
  scenarioRequired: boolean;
  scenarioPassed: boolean;
  scenarioSlug: string | null;
  completed: boolean;
  lessonQuizAttemptsRemaining: number;
  lessonQuizCooldownEndsAt: string | null;
};

export async function getLessonScenarioGate(
  db: Db,
  userId: number,
  lesson: Pick<typeof courseLessons.$inferSelect, "id" | "linkedScenarioId" | "linkedScenarioSlug">,
): Promise<{ required: boolean; passed: boolean; scenarioSlug: string | null }> {
  const simId = resolveSimulatorScenarioId(
    lesson.linkedScenarioSlug,
    lesson.linkedScenarioId,
  );
  if (!simId) {
    return { required: false, passed: true, scenarioSlug: null };
  }

  const [completion] = await db
    .select({ id: scenarioCompletions.id })
    .from(scenarioCompletions)
    .where(
      and(
        eq(scenarioCompletions.userId, userId),
        eq(scenarioCompletions.scenarioSlug, simId),
      ),
    )
    .limit(1);

  return {
    required: true,
    passed: Boolean(completion),
    scenarioSlug: simId,
  };
}

export async function getPassedAttemptMap(
  db: Db,
  userId: number,
  lessonIds: number[],
): Promise<Map<string, boolean>> {
  if (lessonIds.length === 0) return new Map();
  const attempts = await db
    .select({
      lessonId: lessonAssessmentAttempts.lessonId,
      type: lessonAssessmentAttempts.type,
      passed: lessonAssessmentAttempts.passed,
    })
    .from(lessonAssessmentAttempts)
    .where(
      and(
        eq(lessonAssessmentAttempts.userId, userId),
        inArray(lessonAssessmentAttempts.lessonId, lessonIds),
        eq(lessonAssessmentAttempts.passed, true),
      ),
    );
  const map = new Map<string, boolean>();
  for (const a of attempts) {
    map.set(`${a.lessonId}:${a.type}`, true);
  }
  return map;
}

export async function getLessonQuizAttemptInfo(
  db: Db,
  userId: number,
  lessonId: number,
): Promise<{ attemptsUsed: number; cooldownEndsAt: Date | null }> {
  const cutoff = new Date(Date.now() - LESSON_QUIZ_COOLDOWN_HOURS * 60 * 60 * 1000);
  const recent = await db
    .select({
      passed: lessonAssessmentAttempts.passed,
      completedAt: lessonAssessmentAttempts.completedAt,
    })
    .from(lessonAssessmentAttempts)
    .where(
      and(
        eq(lessonAssessmentAttempts.userId, userId),
        eq(lessonAssessmentAttempts.lessonId, lessonId),
        eq(lessonAssessmentAttempts.type, "lesson_quiz"),
        sql`${lessonAssessmentAttempts.completedAt} >= ${cutoff}`,
      ),
    )
    .orderBy(desc(lessonAssessmentAttempts.completedAt));

  const failedRecent = recent.filter((r) => !r.passed);
  const attemptsUsed = failedRecent.length;
  let cooldownEndsAt: Date | null = null;
  if (attemptsUsed >= LESSON_QUIZ_MAX_ATTEMPTS && failedRecent[0]?.completedAt) {
    cooldownEndsAt = new Date(
      failedRecent[0].completedAt.getTime() + LESSON_QUIZ_COOLDOWN_HOURS * 60 * 60 * 1000,
    );
    if (cooldownEndsAt.getTime() <= Date.now()) {
      cooldownEndsAt = null;
    }
  }
  return { attemptsUsed, cooldownEndsAt };
}

export async function buildModuleLessonGates(
  db: Db,
  userId: number,
  moduleId: number,
): Promise<LessonGateStatus[]> {
  const lessons = await db
    .select({
      id: courseLessons.id,
      orderIndex: courseLessons.orderIndex,
      linkedScenarioId: courseLessons.linkedScenarioId,
      linkedScenarioSlug: courseLessons.linkedScenarioSlug,
    })
    .from(courseLessons)
    .where(and(eq(courseLessons.moduleId, moduleId), eq(courseLessons.isPublished, true)))
    .orderBy(courseLessons.orderIndex);

  const lessonIds = lessons.map((l) => l.id);
  const passedMap = await getPassedAttemptMap(db, userId, lessonIds);

  const assessmentQuestionRows = lessonIds.length
    ? await db
        .select({
          lessonId: lessonAssessmentQuestions.lessonId,
          type: lessonAssessmentQuestions.type,
        })
        .from(lessonAssessmentQuestions)
        .where(inArray(lessonAssessmentQuestions.lessonId, lessonIds))
    : [];

  const lessonsWithKc = new Set(
    assessmentQuestionRows.filter((r) => r.type === "knowledge_check").map((r) => r.lessonId),
  );
  const lessonsWithQuiz = new Set(
    assessmentQuestionRows.filter((r) => r.type === "lesson_quiz").map((r) => r.lessonId),
  );

  const progress = await db
    .select({ lessonId: userProgress.lessonId })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.moduleId, moduleId),
        eq(userProgress.completed, true),
      ),
    );
  const completedSet = new Set(progress.map((p) => p.lessonId));

  const gates: LessonGateStatus[] = [];
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const prev = i > 0 ? lessons[i - 1] : null;
    const prevAssessmentsPassed = !prev || (
      (!lessonsWithKc.has(prev.id) || (passedMap.get(`${prev.id}:knowledge_check`) ?? false)) &&
      (!lessonsWithQuiz.has(prev.id) || (passedMap.get(`${prev.id}:lesson_quiz`) ?? false))
    );
    const prevScenarioGate = prev ? await getLessonScenarioGate(db, userId, prev) : null;
    const prevScenarioOk = !prevScenarioGate?.required || prevScenarioGate.passed;
    const prevComplete = i === 0 || (prevAssessmentsPassed && prevScenarioOk);
    const knowledgeCheckPassed = passedMap.get(`${lesson.id}:knowledge_check`) ?? false;
    const lessonQuizPassed = passedMap.get(`${lesson.id}:lesson_quiz`) ?? false;
    const scenarioGate = await getLessonScenarioGate(db, userId, lesson);
    const completed = completedSet.has(lesson.id);

    const { attemptsUsed, cooldownEndsAt } = await getLessonQuizAttemptInfo(db, userId, lesson.id);
    const attemptsRemaining = Math.max(0, LESSON_QUIZ_MAX_ATTEMPTS - attemptsUsed);

    gates.push({
      lessonId: lesson.id,
      orderIndex: lesson.orderIndex,
      unlocked: prevComplete,
      knowledgeCheckPassed,
      lessonQuizPassed,
      scenarioRequired: scenarioGate.required,
      scenarioPassed: scenarioGate.passed,
      scenarioSlug: scenarioGate.scenarioSlug,
      completed,
      lessonQuizAttemptsRemaining: lessonQuizPassed ? LESSON_QUIZ_MAX_ATTEMPTS : attemptsRemaining,
      lessonQuizCooldownEndsAt: cooldownEndsAt?.toISOString() ?? null,
    });
  }
  return gates;
}

export async function scoreLessonAssessment(
  db: Db,
  lessonId: number,
  type: AssessmentType,
  answers: Array<{ questionId: number; selectedIndex: number }>,
) {
  const questions = await db
    .select()
    .from(lessonAssessmentQuestions)
    .where(
      and(
        eq(lessonAssessmentQuestions.lessonId, lessonId),
        eq(lessonAssessmentQuestions.type, type),
      ),
    )
    .orderBy(lessonAssessmentQuestions.sortOrder);

  if (questions.length === 0) {
    return null;
  }

  let correct = 0;
  const results = answers.map((answer) => {
    const question = questions.find((q) => q.id === answer.questionId);
    const isCorrect = question ? question.correctIndex === answer.selectedIndex : false;
    if (isCorrect) correct++;
    return {
      questionId: answer.questionId,
      selectedIndex: answer.selectedIndex,
      correctIndex: question?.correctIndex ?? 0,
      isCorrect,
      explanation: question?.explanation ?? "",
    };
  });

  const totalQuestions = questions.length;
  const score = scorePercent(correct, totalQuestions);
  const passed = didPass(score, type);

  return { score, totalQuestions, correct, passed, results, questions };
}

export async function allModuleLessonQuizzesPassed(
  db: Db,
  userId: number,
  moduleId: number,
): Promise<boolean> {
  const lessons = await db
    .select({ id: courseLessons.id })
    .from(courseLessons)
    .where(and(eq(courseLessons.moduleId, moduleId), eq(courseLessons.isPublished, true)));

  if (lessons.length === 0) return false;

  const lessonIds = lessons.map((l) => l.id);
  const questionCounts = await db
    .select({
      lessonId: lessonAssessmentQuestions.lessonId,
      count: sql<number>`cast(count(*) as unsigned)`.mapWith(Number),
    })
    .from(lessonAssessmentQuestions)
    .where(
      and(
        inArray(lessonAssessmentQuestions.lessonId, lessonIds),
        eq(lessonAssessmentQuestions.type, "lesson_quiz"),
      ),
    )
    .groupBy(lessonAssessmentQuestions.lessonId);

  const lessonsWithQuiz = new Set(questionCounts.filter((r) => r.count > 0).map((r) => r.lessonId));
  const lessonsRequiringQuiz = lessons.filter((l) => lessonsWithQuiz.has(l.id));

  if (lessonsRequiringQuiz.length === 0) {
    // Fallback: require all lessons marked complete if no lesson quizzes seeded yet
    const progress = await db
      .select({ lessonId: userProgress.lessonId })
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.moduleId, moduleId),
          eq(userProgress.completed, true),
        ),
      );
    return progress.length >= lessons.length;
  }

  const passedMap = await getPassedAttemptMap(
    db,
    userId,
    lessonsRequiringQuiz.map((l) => l.id),
  );
  return lessonsRequiringQuiz.every((l) => passedMap.get(`${l.id}:lesson_quiz`));
}

export { KNOWLEDGE_CHECK_PASS_PERCENT, LESSON_QUIZ_PASS_PERCENT };
