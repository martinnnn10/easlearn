/**
 * Competency System of Record — the moat.
 *
 * Aggregates the behavioral data the platform already captures (scenario
 * completions with methodology scores, fault-competency mastery, open-response
 * reasoning grades, certification level) into a per-domain competency vector for
 * a single human. This is the asset competitors can't clone: a measured profile
 * of whether someone can actually diagnose, not just whether they watched a video.
 *
 *   competency.myProfile       — the learner's own Skills Passport (protected)
 *   competency.publicProfile   — employer-verifiable snapshot by code (public)
 *
 * The public profile is the viral object: a technician shares it, every hiring
 * manager who opens it sees the platform.
 */

import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  scenarioCompletions,
  faultCompetencyMastery,
  faultCompetencyUnits,
  faultTypes,
  openResponseAttempts,
  certificationLevels,
  users,
} from "../drizzle/schema";
import { SKILL_DOMAIN_LABELS, type SkillDomain } from "@shared/competencyMatrix";

// faultTypes.domain enum → SkillDomain taxonomy (they differ slightly).
export const FAULT_DOMAIN_TO_SKILL: Record<string, SkillDomain> = {
  power: "electrical",
  motor: "motors",
  safety: "safety",
  sensor: "sensors",
  plc: "plc",
  vfd: "vfd",
  network: "networking",
  integration: "integration",
};

const TIER_RANK: Record<string, number> = { apprentice: 1, journeyman: 2, specialist: 3, master: 4 };

export interface DomainCompetency {
  domain: SkillDomain;
  label: string;
  /** 0-100 measured competency in this domain (avg of methodology signals). */
  masteryPercent: number;
  /** Number of scored attempts contributing to the domain. */
  attempts: number;
}

export interface CompetencyProfile {
  name: string;
  /** Public verification code for the shareable Skills Passport link (best cert). */
  verificationCode: string | null;
  domains: DomainCompetency[];
  overall: {
    competencyPercent: number;
    reasoningScore: number | null; // avg open-response grade, or null if none
    tier: string | null; // highest certification level
    scenariosCompleted: number;
    openResponses: number;
  };
}

/**
 * Core aggregation, shared by the private and public endpoints + the marketplace.
 *
 * SCOPE NOTE (single-source-of-truth): per-learner READINESS is owned by the
 * Assessment Spine (assessment.myReadiness / docs/LEARNING_ENGINE.md). This profile
 * is retained as (a) the aggregate market-intelligence data product (anonymized
 * domain distributions, supply/demand — server/intelligence.ts) and (b) the
 * public skills-verification record keyed by verificationCode. It is NOT shown
 * alongside spine readiness as a competing per-learner readiness verdict.
 * TODO: migrate the public verification + intelligence aggregates onto spine
 * evidence so even these derive from one model.
 */
export async function buildCompetencyProfile(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  name: string,
): Promise<CompetencyProfile> {
  // 1. scenarioSlug → SkillDomain map (from faultTypes catalog).
  const fts = await db
    .select({ slug: faultTypes.scenarioSlug, domain: faultTypes.domain })
    .from(faultTypes);
  const slugDomain = new Map<string, SkillDomain>();
  for (const f of fts) {
    if (f.slug) slugDomain.set(f.slug, FAULT_DOMAIN_TO_SKILL[f.domain] ?? "integration");
  }

  // Accumulator per domain.
  const acc = new Map<SkillDomain, { sum: number; n: number }>();
  const add = (d: SkillDomain, pct: number) => {
    const cur = acc.get(d) ?? { sum: 0, n: 0 };
    cur.sum += pct;
    cur.n += 1;
    acc.set(d, cur);
  };

  // 2. Scenario completions → domain via slug map; use methodology when present.
  const completions = await db
    .select()
    .from(scenarioCompletions)
    .where(eq(scenarioCompletions.userId, userId));
  for (const c of completions) {
    const domain = slugDomain.get(c.scenarioSlug) ?? "integration";
    const pct =
      c.methodologyScore ??
      (c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0);
    add(domain, pct);
  }

  // 3. Fault-competency mastery (cleanly domained) → reinforce per-domain signal.
  const mastery = await db
    .select({
      domain: faultTypes.domain,
      bestMethodology: faultCompetencyMastery.bestMethodology,
      bestPercentage: faultCompetencyMastery.bestPercentage,
    })
    .from(faultCompetencyMastery)
    .innerJoin(faultCompetencyUnits, eq(faultCompetencyMastery.fcuId, faultCompetencyUnits.id))
    .innerJoin(faultTypes, eq(faultCompetencyUnits.faultTypeId, faultTypes.id))
    .where(eq(faultCompetencyMastery.userId, userId));
  for (const m of mastery) {
    const domain = FAULT_DOMAIN_TO_SKILL[m.domain] ?? "integration";
    add(domain, m.bestMethodology || m.bestPercentage || 0);
  }

  // Build domain list across the full taxonomy (zero where no data).
  const domains: DomainCompetency[] = (Object.keys(SKILL_DOMAIN_LABELS) as SkillDomain[]).map(d => {
    const a = acc.get(d);
    return {
      domain: d,
      label: SKILL_DOMAIN_LABELS[d],
      masteryPercent: a && a.n > 0 ? Math.round(a.sum / a.n) : 0,
      attempts: a?.n ?? 0,
    };
  });

  // Overall competency = avg across domains that actually have data.
  const active = domains.filter(d => d.attempts > 0);
  const competencyPercent =
    active.length > 0 ? Math.round(active.reduce((s, d) => s + d.masteryPercent, 0) / active.length) : 0;

  // Reasoning score = avg of open-response grades.
  const responses = await db
    .select({ score: openResponseAttempts.score })
    .from(openResponseAttempts)
    .where(eq(openResponseAttempts.userId, userId));
  const reasoningScore =
    responses.length > 0
      ? Math.round(responses.reduce((s, r) => s + r.score, 0) / responses.length)
      : null;

  // Highest certification tier (+ its verification code for the shareable link).
  const certs = await db
    .select({ level: certificationLevels.level, code: certificationLevels.verificationCode })
    .from(certificationLevels)
    .where(eq(certificationLevels.userId, userId));
  let tier: string | null = null;
  let verificationCode: string | null = null;
  let bestRank = 0;
  for (const c of certs) {
    const r = TIER_RANK[c.level] ?? 0;
    if (r > bestRank) {
      bestRank = r;
      tier = c.level;
      verificationCode = c.code;
    }
  }

  return {
    name,
    verificationCode,
    domains,
    overall: {
      competencyPercent,
      reasoningScore,
      tier,
      scenariosCompleted: completions.length,
      openResponses: responses.length,
    },
  };
}

export const competencyRouter = router({
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    return buildCompetencyProfile(db, ctx.user.id, ctx.user.name ?? "Technician");
  }),

  // Public, verifiable snapshot. Resolves the holder by their certification
  // verification code so the URL is shareable and tamper-evident.
  publicProfile: publicProcedure
    .input(z.object({ code: z.string().min(4).max(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [cert] = await db
        .select({ userId: certificationLevels.userId })
        .from(certificationLevels)
        .where(eq(certificationLevels.verificationCode, input.code))
        .orderBy(desc(certificationLevels.earnedAt))
        .limit(1);
      if (!cert) return null;
      const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, cert.userId)).limit(1);
      return buildCompetencyProfile(db, cert.userId, u?.name ?? "Verified Technician");
    }),
});
