/**
 * Fault of the Day router — the daily viral loop.
 *
 * Reuses scenario_completions (the simulator already writes there on debrief), so
 * no engine changes: a learner solves today's fault in the normal simulator, and
 * these endpoints read that completion to build ranking + the shareable card.
 *
 *   daily.getToday     — today's challenge + global participation (public)
 *   daily.myResult     — the caller's result + percentile for the share card (protected)
 *   daily.leaderboard  — today's top diagnosticians (public)
 */

import { z } from "zod";
import { eq, and, gte, desc } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { scenarioCompletions, users } from "../drizzle/schema";
import { pickDailyChallenge, getDateKey, startOfUtcDay } from "@shared/dailyChallenge";

function tierFor(pct: number): string {
  if (pct >= 85) return "Master Diagnostician";
  if (pct >= 65) return "Systematic Troubleshooter";
  if (pct >= 40) return "Developing Technician";
  return "Rookie";
}

export const dailyRouter = router({
  getToday: publicProcedure.query(async () => {
    const dateKey = getDateKey();
    const challenge = pickDailyChallenge(dateKey);
    if (!challenge) return null;

    let solversToday = 0;
    const db = await getDb();
    if (db) {
      const rows = await db
        .select({ id: scenarioCompletions.id })
        .from(scenarioCompletions)
        .where(
          and(
            eq(scenarioCompletions.scenarioSlug, challenge.id),
            gte(scenarioCompletions.completedAt, startOfUtcDay(dateKey)),
          ),
        );
      solversToday = rows.length;
    }

    return {
      dateKey,
      id: challenge.id,
      title: challenge.title,
      difficulty: challenge.difficulty,
      equipmentType: challenge.equipmentType,
      duration: challenge.duration,
      route: `/simulator?scenario=${challenge.id}`,
      solversToday,
    };
  }),

  myResult: protectedProcedure.query(async ({ ctx }) => {
    const dateKey = getDateKey();
    const challenge = pickDailyChallenge(dateKey);
    if (!challenge) return null;
    const db = await getDb();
    if (!db) return null;

    const start = startOfUtcDay(dateKey);
    const todays = await db
      .select({
        userId: scenarioCompletions.userId,
        methodologyScore: scenarioCompletions.methodologyScore,
        score: scenarioCompletions.score,
        maxScore: scenarioCompletions.maxScore,
      })
      .from(scenarioCompletions)
      .where(
        and(
          eq(scenarioCompletions.scenarioSlug, challenge.id),
          gte(scenarioCompletions.completedAt, start),
        ),
      );

    const pctOf = (r: { methodologyScore: number | null; score: number; maxScore: number }) =>
      r.methodologyScore ?? (r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0);

    const mine = todays.find(r => r.userId === ctx.user.id);
    if (!mine) return { solved: false, dateKey };

    const myPct = pctOf(mine);
    const total = todays.length;
    const beat = todays.filter(r => pctOf(r) < myPct).length;
    const percentile = total > 1 ? Math.round((beat / (total - 1)) * 100) : null;

    return {
      solved: true,
      dateKey,
      methodologyPercent: myPct,
      tier: tierFor(myPct),
      percentile,
      total,
    };
  }),

  leaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
    .query(async ({ input }) => {
      const dateKey = getDateKey();
      const challenge = pickDailyChallenge(dateKey);
      if (!challenge) return [];
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select({
          name: users.name,
          methodologyScore: scenarioCompletions.methodologyScore,
          score: scenarioCompletions.score,
          maxScore: scenarioCompletions.maxScore,
          timeSeconds: scenarioCompletions.timeSeconds,
        })
        .from(scenarioCompletions)
        .innerJoin(users, eq(scenarioCompletions.userId, users.id))
        .where(
          and(
            eq(scenarioCompletions.scenarioSlug, challenge.id),
            gte(scenarioCompletions.completedAt, startOfUtcDay(dateKey)),
          ),
        )
        .orderBy(desc(scenarioCompletions.methodologyScore))
        .limit(input?.limit ?? 10);

      return rows.map((r, i) => ({
        rank: i + 1,
        name: r.name ?? "Anonymous",
        methodologyPercent: r.methodologyScore ?? (r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0),
        timeSeconds: r.timeSeconds,
      }));
    }),
});
