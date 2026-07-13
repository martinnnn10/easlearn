/**
 * Hiring marketplace — the employment-transaction lever (the part that adds zeros).
 *
 * Fuses the learning side to the hiring side: employers search the VERIFIED
 * competency graph (not résumés), and jobs are gated by demonstrated skill. A
 * placement is worth orders of magnitude more than a training seat — this is the
 * structural reason the platform can be large.
 *
 *   employer.postJob / myJobs / closeJob   — employer posts roles
 *   employer.searchTalent                  — search the competency graph by skill
 *   jobs.list / jobs.apply / jobs.myApplications — technician-facing, competency-gated
 *
 * Reuses the verified competency aggregation (buildCompetencyProfile) so a single
 * source of truth backs the credential, the passport, and hiring qualification.
 */

import { z } from "zod";
import { eq, and, desc, inArray } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { jobPostings, jobApplications, users, scenarioCompletions } from "../drizzle/schema";
import { buildCompetencyProfile } from "./competency";

const SKILL_DOMAINS = ["vfd", "plc", "motors", "safety", "electrical", "networking", "sensors", "integration"] as const;

function domainScore(profile: Awaited<ReturnType<typeof buildCompetencyProfile>>, domain: string): number {
  return profile.domains.find(d => d.domain === domain)?.masteryPercent ?? 0;
}

export const employerRouter = router({
  postJob: protectedProcedure
    .input(
      z.object({
        title: z.string().min(2).max(255),
        company: z.string().min(1).max(255),
        location: z.string().max(255).optional(),
        remote: z.boolean().default(false),
        description: z.string().min(10),
        requiredDomain: z.enum(SKILL_DOMAINS),
        minCompetency: z.number().int().min(0).max(100).default(60),
        salaryMin: z.number().int().optional(),
        salaryMax: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const res = await db.insert(jobPostings).values({
        employerId: ctx.user.id,
        title: input.title,
        company: input.company,
        location: input.location ?? null,
        remote: input.remote,
        description: input.description,
        requiredDomain: input.requiredDomain,
        minCompetency: input.minCompetency,
        salaryMin: input.salaryMin ?? null,
        salaryMax: input.salaryMax ?? null,
      });
      return { id: Number((res as any).insertId) };
    }),

  myJobs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.employerId, ctx.user.id))
      .orderBy(desc(jobPostings.createdAt));
  }),

  closeJob: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(jobPostings)
        .set({ status: "closed" })
        .where(and(eq(jobPostings.id, input.id), eq(jobPostings.employerId, ctx.user.id)));
      return { ok: true };
    }),

  // Search the verified competency graph for qualified technicians.
  searchTalent: protectedProcedure
    .input(z.object({ domain: z.enum(SKILL_DOMAINS), minCompetency: z.number().min(0).max(100).default(60), limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      // Candidate pool = anyone with practice data.
      const candidates = await db
        .selectDistinct({ userId: scenarioCompletions.userId })
        .from(scenarioCompletions);
      const results: { userId: number; name: string; domainPercent: number; overallPercent: number; verificationCode: string | null }[] = [];
      for (const c of candidates) {
        const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, c.userId)).limit(1);
        const profile = await buildCompetencyProfile(db, c.userId, u?.name ?? "Technician");
        const dScore = domainScore(profile, input.domain);
        if (dScore >= input.minCompetency) {
          results.push({
            userId: c.userId,
            name: profile.name,
            domainPercent: dScore,
            overallPercent: profile.overall.competencyPercent,
            verificationCode: profile.verificationCode,
          });
        }
      }
      results.sort((a, b) => b.domainPercent - a.domainPercent);
      return results.slice(0, input.limit);
    }),
});

export const jobsRouter = router({
  // Technician-facing board with a "you qualify" flag from verified competency.
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const open = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.status, "open"))
      .orderBy(desc(jobPostings.createdAt))
      .limit(100);
    if (open.length === 0) return [];

    const profile = await buildCompetencyProfile(db, ctx.user.id, ctx.user.name ?? "Technician");
    // Which of these has the viewer already applied to?
    const applied = await db
      .select({ jobId: jobApplications.jobId })
      .from(jobApplications)
      .where(eq(jobApplications.userId, ctx.user.id));
    const appliedSet = new Set(applied.map(a => a.jobId));

    return open.map(j => {
      const yourScore = domainScore(profile, j.requiredDomain);
      return {
        ...j,
        yourCompetency: yourScore,
        qualifies: yourScore >= j.minCompetency,
        applied: appliedSet.has(j.id),
      };
    });
  }),

  applyToJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, input.jobId)).limit(1);
      if (!job || job.status !== "open") return { ok: false, reason: "closed" };

      const profile = await buildCompetencyProfile(db, ctx.user.id, ctx.user.name ?? "Technician");
      const yourScore = domainScore(profile, job.requiredDomain);
      if (yourScore < job.minCompetency) {
        return { ok: false, reason: "underqualified", yourCompetency: yourScore, required: job.minCompetency };
      }

      // Idempotent on (jobId, userId).
      const [existing] = await db
        .select({ id: jobApplications.id })
        .from(jobApplications)
        .where(and(eq(jobApplications.jobId, input.jobId), eq(jobApplications.userId, ctx.user.id)))
        .limit(1);
      if (existing) return { ok: true, already: true };

      await db.insert(jobApplications).values({
        jobId: input.jobId,
        userId: ctx.user.id,
        competencySnapshot: {
          domain: job.requiredDomain,
          domainPercent: yourScore,
          overallPercent: profile.overall.competencyPercent,
          capturedAt: new Date().toISOString(),
        },
      });
      return { ok: true };
    }),

  myApplications: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const apps = await db
      .select({
        id: jobApplications.id,
        status: jobApplications.status,
        createdAt: jobApplications.createdAt,
        jobId: jobApplications.jobId,
      })
      .from(jobApplications)
      .where(eq(jobApplications.userId, ctx.user.id))
      .orderBy(desc(jobApplications.createdAt));
    if (apps.length === 0) return [];
    const jobIds = apps.map(a => a.jobId);
    const jobs = await db.select().from(jobPostings).where(inArray(jobPostings.id, jobIds));
    const jobMap = new Map(jobs.map(j => [j.id, j]));
    return apps.map(a => ({ ...a, job: jobMap.get(a.jobId) ?? null }));
  }),
});
