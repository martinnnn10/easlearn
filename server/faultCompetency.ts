import { and, desc, eq, sql } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  faultCompetencyAttempts,
  faultCompetencyMastery,
  faultCompetencyUnits,
  faultTypes,
  lessonFcuLinks,
} from "../drizzle/schema";
import {
  domainMasteryPercent,
  resolveCareerLevel,
  tileState,
  type FaultDomain,
} from "@shared/faultMastery";
import { SCENARIO_REGISTRY } from "@shared/scenarioRegistry";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { triggerReviewsFromAttempt } from "./schedulerAutoTrigger";

type Db = MySql2Database<Record<string, unknown>>;

const SCENARIO_DOMAIN_MAP: Record<string, FaultDomain> = {
  "Safety Circuit": "safety",
  "Control Circuit": "power",
  VFD: "vfd",
  "Motor Control": "motor",
  "Machine Interlock": "integration",
  Sensors: "sensor",
  PLC: "plc",
  Networking: "network",
  "Power Distribution": "power",
};

export function scenarioCategoryToDomain(category: string): FaultDomain {
  return SCENARIO_DOMAIN_MAP[category] ?? "integration";
}

export async function recordFaultCompetencyAttempt(
  db: Db,
  input: {
    userId: number;
    scenarioSlug: string;
    lessonId?: number;
    assessmentId?: number;
    playMode?: string;
    score: number;
    maxScore: number;
    percentage: number;
    timeSeconds: number;
    methodologyScore?: number;
    safetyScore?: number;
    toolSelectionScore?: number;
    hintsUsed?: number;
    methodologyDimensions?: unknown;
    decisionLog?: unknown;
    passThreshold?: number;
  },
) {
  const [faultType] = await db
    .select()
    .from(faultTypes)
    .where(eq(faultTypes.scenarioSlug, input.scenarioSlug))
    .limit(1);

  if (!faultType) return { recorded: false as const };

  const [fcu] = await db
    .select()
    .from(faultCompetencyUnits)
    .where(
      and(
        eq(faultCompetencyUnits.faultTypeId, faultType.id),
        eq(faultCompetencyUnits.mode, "unguided"),
      ),
    )
    .limit(1);

  if (!fcu) return { recorded: false as const };

  const threshold = input.passThreshold ?? fcu.passThreshold;
  const methodology = input.methodologyScore ?? input.percentage;
  const safety = input.safetyScore ?? 100;
  const passed = methodology >= threshold && safety >= 100;

  await db.insert(faultCompetencyAttempts).values({
    userId: input.userId,
    fcuId: fcu.id,
    scenarioSlug: input.scenarioSlug,
    lessonId: input.lessonId ?? null,
    assessmentId: input.assessmentId ?? null,
    playMode: input.playMode ?? null,
    score: input.score,
    maxScore: input.maxScore,
    percentage: input.percentage,
    timeToDiagnoseSec: input.timeSeconds,
    toolSelectionScore: input.toolSelectionScore ?? null,
    methodologyScore: methodology,
    safetyScore: safety,
    hintsUsed: input.hintsUsed ?? 0,
    passed,
    methodologyDimensions: input.methodologyDimensions ?? null,
    decisionLog: input.decisionLog ?? null,
  });

  const [existing] = await db
    .select()
    .from(faultCompetencyMastery)
    .where(
      and(
        eq(faultCompetencyMastery.userId, input.userId),
        eq(faultCompetencyMastery.fcuId, fcu.id),
      ),
    )
    .limit(1);

  if (!existing) {
    await db.insert(faultCompetencyMastery).values({
      userId: input.userId,
      fcuId: fcu.id,
      bestPercentage: input.percentage,
      bestMethodology: methodology,
      attempts: 1,
      passed,
      masteredAt: passed ? new Date() : null,
    });
  } else {
    const bestPct = Math.max(existing.bestPercentage, input.percentage);
    const bestMeth = Math.max(existing.bestMethodology, methodology);
    const nowPassed = existing.passed || passed;
    await db
      .update(faultCompetencyMastery)
      .set({
        bestPercentage: bestPct,
        bestMethodology: bestMeth,
        attempts: existing.attempts + 1,
        passed: nowPassed,
        masteredAt: nowPassed && !existing.masteredAt ? new Date() : existing.masteredAt,
      })
      .where(
        and(
          eq(faultCompetencyMastery.userId, input.userId),
          eq(faultCompetencyMastery.fcuId, fcu.id),
        ),
      );
  }

  // ── Auto-trigger spaced repetition reviews ──────────────────────────────
  // Fire-and-forget: never let scheduler failure break the attempt recording.
  try {
    await triggerReviewsFromAttempt(db, {
      learnerId: input.userId,
      sourceId: input.scenarioSlug,
      sourceLabel: faultType.title,
      domain: faultType.domain,
      skill: faultType.rootCauseClass ?? undefined,
      difficulty: faultType.difficulty === "beginner" ? 1 : faultType.difficulty === "intermediate" ? 3 : 5,
      signals: {
        passed,
        rootCauseCorrect: passed, // In this flow, pass requires correct root cause
        timeToDiagnoseSec: input.timeSeconds,
        hintsUsed: input.hintsUsed ?? 0,
        methodologyScore: methodology,
        safetyScore: safety,
        firstStepCorrect: null, // Not available in this flow
      },
    });
  } catch {
    /* Scheduler must never break the attempt recording */
  }

  return { recorded: true as const, fcuId: fcu.id, passed };
}

export async function getUserMasteryMap(db: Db, userId: number) {
  const types = await db
    .select()
    .from(faultTypes)
    .where(eq(faultTypes.isPublished, true));

  const masteryRows = await db
    .select()
    .from(faultCompetencyMastery)
    .where(eq(faultCompetencyMastery.userId, userId));

  const masteryByFcu = new Map(masteryRows.map((m) => [m.fcuId, m]));

  const fcus = await db.select().from(faultCompetencyUnits);
  const fcuByFault = new Map<number, typeof fcus>();
  for (const fcu of fcus) {
    const list = fcuByFault.get(fcu.faultTypeId) ?? [];
    list.push(fcu);
    fcuByFault.set(fcu.faultTypeId, list);
  }

  const tiles = types.map((ft) => {
    const units = fcuByFault.get(ft.id) ?? [];
    const unguided = units.find((u) => u.mode === "unguided");
    const mastery = unguided ? masteryByFcu.get(unguided.id) : undefined;
    const attempts = mastery?.attempts ?? 0;
    const passed = mastery?.passed ?? false;

    return {
      slug: ft.slug,
      title: ft.title,
      domain: ft.domain as FaultDomain,
      difficulty: ft.difficulty,
      scenarioSlug: ft.scenarioSlug,
      state: tileState(passed, attempts, true),
      bestMethodology: mastery?.bestMethodology ?? null,
      attempts,
    };
  });

  const byDomain = new Map<FaultDomain, { total: number; mastered: number }>();
  for (const t of tiles) {
    const cur = byDomain.get(t.domain) ?? { total: 0, mastered: 0 };
    cur.total++;
    if (t.state === "mastered") cur.mastered++;
    byDomain.set(t.domain, cur);
  }

  const domainStats = Array.from(byDomain.entries()).map(([domain, stats]) => ({
    domain,
    total: stats.total,
    mastered: stats.mastered,
    percent: domainMasteryPercent(stats.mastered, stats.total),
  }));

  const fcusMastered = tiles.filter((t) => t.state === "mastered").length;
  const domainsWithMastery = domainStats.filter((d) => d.mastered > 0).length;
  const careerLevel = resolveCareerLevel(fcusMastered, domainsWithMastery);

  return { tiles, domainStats, careerLevel, fcusMastered };
}

/** Seed fault types from scenario registry when table empty */
export function buildFaultTypeSeedRows() {
  return SCENARIO_REGISTRY.filter((s) => s.assessmentEligible).map((s) => ({
    slug: s.id,
    title: s.title,
    domain: scenarioCategoryToDomain(s.category),
    difficulty:
      s.difficultyLabel === "Beginner"
        ? ("beginner" as const)
        : s.difficultyLabel === "Advanced"
          ? ("advanced" as const)
          : ("intermediate" as const),
    scenarioSlug: s.id,
  }));
}

export async function getLessonFcuRequirements(db: Db, lessonId: number) {
  return db
    .select({
      fcuId: lessonFcuLinks.fcuId,
      required: lessonFcuLinks.required,
      scenarioSlug: faultTypes.scenarioSlug,
      title: faultTypes.title,
    })
    .from(lessonFcuLinks)
    .innerJoin(faultCompetencyUnits, eq(faultCompetencyUnits.id, lessonFcuLinks.fcuId))
    .innerJoin(faultTypes, eq(faultTypes.id, faultCompetencyUnits.faultTypeId))
    .where(eq(lessonFcuLinks.lessonId, lessonId));
}

export const faultCompetencyRouter = router({
  getUserMastery: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    return getUserMasteryMap(db, ctx.user.id);
  }),

  recordAttempt: protectedProcedure
    .input(
      z.object({
        scenarioSlug: z.string(),
        lessonId: z.number().optional(),
        playMode: z.string().optional(),
        score: z.number(),
        maxScore: z.number(),
        percentage: z.number(),
        timeSeconds: z.number(),
        methodologyScore: z.number().optional(),
        safetyScore: z.number().optional(),
        toolSelectionScore: z.number().optional(),
        hintsUsed: z.number().optional(),
        methodologyDimensions: z.any().optional(),
        decisionLog: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return recordFaultCompetencyAttempt(db, {
        userId: ctx.user.id,
        scenarioSlug: input.scenarioSlug,
        lessonId: input.lessonId,
        playMode: input.playMode,
        score: input.score,
        maxScore: input.maxScore,
        percentage: input.percentage,
        timeSeconds: input.timeSeconds,
        methodologyScore: input.methodologyScore,
        safetyScore: input.safetyScore,
        toolSelectionScore: input.toolSelectionScore,
        hintsUsed: input.hintsUsed,
        methodologyDimensions: input.methodologyDimensions,
        decisionLog: input.decisionLog,
      });
    }),
});
