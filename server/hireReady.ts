import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  assessments,
  assessmentResults,
  assessmentCompetencyScores,
  hireReadyPacks,
  teamMembers,
  teams,
} from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { validateAssessmentScenarioIds } from "@shared/scenarioRegistry";
import { notifyOwner } from "./_core/notification";

async function assertTeamAdmin(db: Awaited<ReturnType<typeof getDb>>, userId: number) {
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const [owned] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.ownerId, userId), eq(teams.isActive, true)))
    .limit(1);
  if (owned) return owned;

  const [adminMembership] = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.userId, userId),
        eq(teamMembers.role, "admin"),
        eq(teamMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!adminMembership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Team admin access required" });
  }

  const [team] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, adminMembership.teamId), eq(teams.isActive, true)))
    .limit(1);

  if (!team) throw new TRPCError({ code: "FORBIDDEN", message: "No active team found" });
  return team;
}

export const hireReadyRouter = router({
  listPacks: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(hireReadyPacks);
  }),

  listForTeam: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const team = await assertTeamAdmin(db, ctx.user.id);
    const rows = await db
      .select()
      .from(assessments)
      .where(eq(assessments.teamId, team.id))
      .orderBy(desc(assessments.createdAt));

    const withResults = await Promise.all(
      rows.map(async (a) => {
        const results = await db
          .select()
          .from(assessmentResults)
          .where(eq(assessmentResults.assessmentId, a.id));
        return { ...a, results };
      }),
    );
    return withResults;
  }),

  createFromPack: protectedProcedure
    .input(
      z.object({
        packSlug: z.string(),
        candidateName: z.string().min(1),
        candidateEmail: z.string().email(),
        company: z.string().optional(),
        position: z.string().optional(),
        expiresInDays: z.number().default(7),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const team = await assertTeamAdmin(db, ctx.user.id);

      const [pack] = await db
        .select()
        .from(hireReadyPacks)
        .where(eq(hireReadyPacks.slug, input.packSlug))
        .limit(1);

      if (!pack) {
        throw new TRPCError({ code: "NOT_FOUND", message: "HireReady pack not found" });
      }

      const rawIds = (pack.scenarioIds as string[]) ?? [];
      const { valid, normalized, invalid } = validateAssessmentScenarioIds(rawIds);
      if (!valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid scenarios in pack: ${invalid.join(", ")}`,
        });
      }

      const token = nanoid(32);
      const remediationToken = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      await db.insert(assessments).values({
        token,
        createdBy: ctx.user.id,
        candidateName: input.candidateName,
        candidateEmail: input.candidateEmail,
        company: input.company ?? null,
        position: input.position ?? null,
        scenarioIds: normalized,
        timeLimitMinutes: pack.timeLimitMin,
        expiresAt,
        packSlug: pack.slug,
        teamId: team.id,
        remediationToken,
      });

      await notifyOwner({
        title: `HireReady: ${pack.title} for ${input.candidateName}`,
        content: `Team: ${team.name}\nPack: ${pack.title}\nCandidate: ${input.candidateName}\nLink token: ${token}`,
      });

      return { success: true, token, remediationToken, assessmentUrl: `/assessment/${token}` };
    }),

  getResult: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      await assertTeamAdmin(db, ctx.user.id);

      const [assessment] = await db
        .select()
        .from(assessments)
        .where(eq(assessments.id, input.assessmentId))
        .limit(1);

      if (!assessment) return null;

      const results = await db
        .select()
        .from(assessmentResults)
        .where(eq(assessmentResults.assessmentId, assessment.id));

      const competency = await db
        .select()
        .from(assessmentCompetencyScores)
        .where(eq(assessmentCompetencyScores.assessmentId, assessment.id));

      const avg =
        results.length > 0
          ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
          : 0;

      let pack = null;
      if (assessment.packSlug) {
        const [p] = await db
          .select()
          .from(hireReadyPacks)
          .where(eq(hireReadyPacks.slug, assessment.packSlug))
          .limit(1);
        pack = p ?? null;
      }

      const threshold = pack?.passThreshold ?? 75;
      const hireRecommendation =
        assessment.hireRecommendation ??
        (avg >= threshold + 10 ? "hire" : avg >= threshold ? "hold" : "no_hire");

      return {
        assessment,
        results,
        competency,
        averageScore: avg,
        hireRecommendation,
        pack,
      };
    }),
});
