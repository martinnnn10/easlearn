import { eq } from "drizzle-orm";
import { scenarios, type CourseLesson } from "../drizzle/schema";
import {
  dbScenarioSlug,
  parseDbScenarioSlug,
  resolveLessonScenarioSlug,
  resolveSimulatorScenarioId,
} from "@shared/scenarioLinking";
import { getDb } from "./db";

export type LessonPracticeScenario = {
  /** Stable DB-oriented slug (e.g. db-30005) — safe for storage and APIs */
  dbSlug: string | null;
  /** Simulator engine id for ?scenario= URL — null if not playable in-app */
  simulatorScenarioId: string | null;
  scenarioTitle: string | null;
  hasPracticeScenario: boolean;
};

export async function resolveLessonPracticeScenario(
  lesson: Pick<CourseLesson, "linkedScenarioId" | "linkedScenarioSlug">
): Promise<LessonPracticeScenario> {
  const dbSlug = resolveLessonScenarioSlug(lesson.linkedScenarioSlug, lesson.linkedScenarioId);
  const simulatorScenarioId = resolveSimulatorScenarioId(dbSlug, lesson.linkedScenarioId);

  const scenarioDbId =
    lesson.linkedScenarioId ??
    (dbSlug ? parseDbScenarioSlug(dbSlug) : null);

  let scenarioTitle: string | null = null;
  if (scenarioDbId != null) {
    const db = await getDb();
    if (db) {
      const [row] = await db
        .select({ title: scenarios.title })
        .from(scenarios)
        .where(eq(scenarios.id, scenarioDbId))
        .limit(1);
      scenarioTitle = row?.title ?? null;
    }
  }

  return {
    dbSlug,
    simulatorScenarioId,
    scenarioTitle,
    hasPracticeScenario: simulatorScenarioId != null,
  };
}

/** Backfill helper: linkedScenarioSlug from legacy linkedScenarioId */
export function legacyIdToScenarioSlug(linkedScenarioId: number): string {
  return dbScenarioSlug(linkedScenarioId);
}
