/**
 * Workforce Intelligence — the data-network moat + the platform key layer.
 *
 * The compounding asset: aggregate, anonymized analytics over the verified
 * competency graph that employers, OEMs, insurers and workforce planners pay for
 * (skill-gap, benchmarks, supply/demand). Plus predictive learn→hire
 * recommendations that close the loop, and API-key management for the public API.
 *
 *   intelligence.benchmarks        — competency distribution per skill domain (data product)
 *   intelligence.supplyDemand      — qualified-talent supply vs open-job demand per domain
 *   intelligence.myRecommendations — "you're X% from qualifying for N jobs" (technician)
 *   intelligence.createApiKey / listApiKeys / revokeApiKey — platform integration layer
 */

import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import { nanoid } from "nanoid";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { scenarioCompletions, jobPostings, users, apiKeys } from "../drizzle/schema";
import { buildCompetencyProfile } from "./competency";
import { SKILL_DOMAIN_LABELS, type SkillDomain } from "@shared/competencyMatrix";

const DOMAINS = Object.keys(SKILL_DOMAIN_LABELS) as SkillDomain[];
const POOL_CAP = 500; // v1: aggregate over the active learner pool

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

/** Build profiles for the active learner pool (users with practice data). */
async function poolProfiles(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const ids = (await db.selectDistinct({ userId: scenarioCompletions.userId }).from(scenarioCompletions)).slice(0, POOL_CAP);
  const profiles = [];
  for (const { userId } of ids) {
    const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
    profiles.push(await buildCompetencyProfile(db, userId, u?.name ?? "Technician"));
  }
  return profiles;
}

function domainScoreOf(p: Awaited<ReturnType<typeof buildCompetencyProfile>>, d: string): number {
  return p.domains.find(x => x.domain === d)?.masteryPercent ?? 0;
}

export const intelligenceRouter = router({
  // Anonymized competency distribution per domain — the benchmark data product.
  benchmarks: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const profiles = await poolProfiles(db);
    return DOMAINS.map(d => {
      const scores = profiles.map(p => domainScoreOf(p, d)).filter(s => s > 0).sort((a, b) => a - b);
      const avg = scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : 0;
      return {
        domain: d,
        label: SKILL_DOMAIN_LABELS[d],
        learners: scores.length,
        avg,
        p50: pct(scores, 50),
        p75: pct(scores, 75),
        p90: pct(scores, 90),
      };
    });
  }),

  // Qualified-talent supply vs open-job demand — the workforce-planning signal.
  supplyDemand: protectedProcedure
    .input(z.object({ threshold: z.number().min(0).max(100).default(70) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const threshold = input?.threshold ?? 70;
      const profiles = await poolProfiles(db);
      const openJobs = await db.select().from(jobPostings).where(eq(jobPostings.status, "open"));
      return DOMAINS.map(d => {
        const supply = profiles.filter(p => domainScoreOf(p, d) >= threshold).length;
        const demand = openJobs.filter(j => j.requiredDomain === d).length;
        return {
          domain: d,
          label: SKILL_DOMAIN_LABELS[d],
          supply,
          demand,
          ratio: demand === 0 ? null : Math.round((supply / demand) * 100) / 100,
        };
      });
    }),

  // Technician predictive nudge: jobs you're *close* to qualifying for.
  myRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { almost: [], suggestDomain: null as string | null };
    const profile = await buildCompetencyProfile(db, ctx.user.id, ctx.user.name ?? "Technician");
    const openJobs = await db.select().from(jobPostings).where(eq(jobPostings.status, "open")).limit(200);

    const almost = openJobs
      .map(j => {
        const score = domainScoreOf(profile, j.requiredDomain);
        return { job: j, score, gap: j.minCompetency - score };
      })
      .filter(x => x.gap > 0 && x.gap <= 20) // within reach
      .sort((a, b) => a.gap - b.gap)
      .slice(0, 10);

    // The domain that unlocks the most jobs if improved.
    const byDomain = new Map<string, number>();
    for (const a of almost) byDomain.set(a.job.requiredDomain, (byDomain.get(a.job.requiredDomain) ?? 0) + 1);
    let suggestDomain: string | null = null;
    let best = 0;
    for (const [d, n] of Array.from(byDomain.entries())) if (n > best) { best = n; suggestDomain = d; }

    return {
      almost: almost.map(a => ({
        jobId: a.job.id,
        title: a.job.title,
        company: a.job.company,
        domain: a.job.requiredDomain,
        domainLabel: SKILL_DOMAIN_LABELS[a.job.requiredDomain as SkillDomain] ?? a.job.requiredDomain,
        yourScore: a.score,
        needed: a.job.minCompetency,
        gap: a.gap,
      })),
      suggestDomain,
    };
  }),

  // ── Public API key management (platform layer) ──────────────────────────────
  createApiKey: protectedProcedure
    .input(z.object({ label: z.string().min(1).max(120), scopes: z.array(z.enum(["verify", "talent", "jobs"])).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const plaintext = `eas_live_${nanoid(32)}`;
      const keyHash = crypto.createHash("sha256").update(plaintext).digest("hex");
      const keyPrefix = plaintext.slice(0, 16);
      await db.insert(apiKeys).values({
        ownerId: ctx.user.id,
        label: input.label,
        keyHash,
        keyPrefix,
        scopes: input.scopes.join(","),
      });
      // Plaintext returned ONCE — never stored, never retrievable again.
      return { key: plaintext, prefix: keyPrefix };
    }),

  listApiKeys: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({ id: apiKeys.id, label: apiKeys.label, keyPrefix: apiKeys.keyPrefix, scopes: apiKeys.scopes, active: apiKeys.active, lastUsedAt: apiKeys.lastUsedAt, createdAt: apiKeys.createdAt })
      .from(apiKeys)
      .where(eq(apiKeys.ownerId, ctx.user.id))
      .orderBy(desc(apiKeys.createdAt));
  }),

  revokeApiKey: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(apiKeys).set({ active: false }).where(and(eq(apiKeys.id, input.id), eq(apiKeys.ownerId, ctx.user.id)));
      return { ok: true };
    }),
});
