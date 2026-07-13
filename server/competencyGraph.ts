/**
 * Competency Graph router — derives the living per-competency capability profile
 * from DEMONSTRATED performance (scenario_completions), merges manager validations,
 * and rolls it up for managers.
 *
 *   competencyGraph.myGraph    — the technician's own rich competency cells
 *   competencyGraph.teamGraph  — every team member's cells + decision rollups (manager)
 *   competencyGraph.validate   — a manager attests a competency (human ground truth)
 *
 * One source of truth: reuses the faultTypes domain mapping from competency.ts.
 */

import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { scenarioCompletions, faultTypes, teamMembers, users, competencyValidations } from "../drizzle/schema";
import { FAULT_DOMAIN_TO_SKILL } from "./competency";
import { SKILL_DOMAIN_LABELS, type SkillDomain } from "@shared/competencyMatrix";
import {
  competencyLevel,
  decayStatus,
  learningVelocity,
  isPromotionReady,
  type CompetencyCell,
} from "@shared/competencyGraph";

const DOMAINS = Object.keys(SKILL_DOMAIN_LABELS) as SkillDomain[];
const DAY_MS = 24 * 60 * 60 * 1000;

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Active member userIds across teams the caller manages (owner/admin/manager). */
export async function managedMemberIds(db: Db, managerId: number): Promise<number[]> {
  const managed = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, managerId), inArray(teamMembers.role, ["owner", "admin", "manager"])));
  if (managed.length === 0) return [];
  const teamIds = managed.map(m => m.teamId);
  const members = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(and(inArray(teamMembers.teamId, teamIds), eq(teamMembers.status, "active")));
  return Array.from(new Set(members.map(m => m.userId).filter((x): x is number => x != null)));
}

export async function slugDomainMap(db: Db): Promise<Map<string, SkillDomain>> {
  const fts = await db.select({ slug: faultTypes.scenarioSlug, domain: faultTypes.domain }).from(faultTypes);
  const m = new Map<string, SkillDomain>();
  for (const f of fts) if (f.slug) m.set(f.slug, FAULT_DOMAIN_TO_SKILL[f.domain] ?? "integration");
  return m;
}

/**
 * @deprecated Scenario-only cells. The spine's `readinessCells` (server: `spineCells`)
 * is the source of truth and unifies all evidence. Only the deprecated myGraph/teamGraph
 * procedures still call this. `managedMemberIds` and `slugDomainMap` below are NOT
 * deprecated — the spine reuses them.
 */
export async function buildCells(db: Db, userId: number, slugDomain: Map<string, SkillDomain>): Promise<CompetencyCell[]> {
  const completions = await db
    .select({
      scenarioSlug: scenarioCompletions.scenarioSlug,
      score: scenarioCompletions.score,
      maxScore: scenarioCompletions.maxScore,
      methodologyScore: scenarioCompletions.methodologyScore,
      timeSeconds: scenarioCompletions.timeSeconds,
      completedAt: scenarioCompletions.completedAt,
    })
    .from(scenarioCompletions)
    .where(eq(scenarioCompletions.userId, userId));

  const validations = await db
    .select({ domain: competencyValidations.domain })
    .from(competencyValidations)
    .where(eq(competencyValidations.userId, userId));
  const validated = new Set(validations.map(v => v.domain));

  // Group completions by domain, chronologically.
  const byDomain = new Map<SkillDomain, { pct: number; time: number; at: Date }[]>();
  for (const c of completions) {
    const domain = slugDomain.get(c.scenarioSlug) ?? "integration";
    const pct = c.methodologyScore ?? (c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0);
    const arr = byDomain.get(domain) ?? [];
    arr.push({ pct, time: c.timeSeconds, at: new Date(c.completedAt) });
    byDomain.set(domain, arr);
  }

  const now = Date.now();
  return DOMAINS.map(domain => {
    const rows = (byDomain.get(domain) ?? []).sort((a, b) => a.at.getTime() - b.at.getTime());
    const attempts = rows.length;
    const confidence = attempts ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / attempts) : 0;
    const recentConfidence = attempts ? rows[rows.length - 1].pct : 0;
    const times = rows.map(r => r.time).filter(t => t > 0);
    const avgTimeSeconds = times.length ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : null;
    const bestTimeSeconds = times.length ? Math.min(...times) : null;
    const last = attempts ? rows[rows.length - 1].at : null;
    const daysSince = last ? Math.floor((now - last.getTime()) / DAY_MS) : null;
    return {
      domain,
      label: SKILL_DOMAIN_LABELS[domain],
      confidence,
      recentConfidence,
      level: competencyLevel(confidence, attempts),
      attempts,
      avgTimeSeconds,
      bestTimeSeconds,
      lastDemonstrated: last ? last.toISOString() : null,
      decay: decayStatus(daysSince),
      daysSince,
      velocity: learningVelocity(rows.map(r => r.pct)),
      managerValidated: validated.has(domain),
    } satisfies CompetencyCell;
  });
}

export const competencyGraphRouter = router({
  /**
   * @deprecated Scenario-only competency. The Assessment Spine is the source of
   * truth — use `assessment.myReadiness` (unifies lessons, simulations, review,
   * manager validation, decay, safety). Kept temporarily for backward compatibility;
   * NO EASLearn UI consumes this anymore. Do not build new features on it.
   */
  myGraph: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const map = await slugDomainMap(db);
    const cells = await buildCells(db, ctx.user.id, map);
    return { name: ctx.user.name ?? "Technician", cells, promotionReady: isPromotionReady(cells) };
  }),

  /**
   * @deprecated Scenario-only team competency. Use `assessment.teamReadiness`
   * (the Assessment Spine) — it is the source of truth across the Manager
   * Dashboard, Manager Hub, and workforce planning. Kept temporarily for
   * backward compatibility; no UI consumes it. `validate` below is NOT deprecated.
   */
  teamGraph: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    // Teams where the caller is owner/admin/manager.
    const managed = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, ctx.user.id), inArray(teamMembers.role, ["owner", "admin", "manager"])));
    if (managed.length === 0) return { isManager: false, members: [] as any[] };

    const teamIds = managed.map(m => m.teamId);
    const members = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(and(inArray(teamMembers.teamId, teamIds), eq(teamMembers.status, "active")));
    const memberIds = Array.from(new Set(members.map(m => m.userId).filter((x): x is number => x != null)));
    if (memberIds.length === 0) return { isManager: true, members: [] as any[] };

    const map = await slugDomainMap(db);
    const out = [];
    for (const uid of memberIds) {
      const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, uid)).limit(1);
      const cells = await buildCells(db, uid, map);
      out.push({
        userId: uid,
        name: u?.name ?? "Technician",
        cells,
        promotionReady: isPromotionReady(cells),
        overall: Math.round(cells.filter(c => c.attempts > 0).reduce((s, c) => s + c.confidence, 0) / Math.max(1, cells.filter(c => c.attempts > 0).length)),
      });
    }
    return { isManager: true, members: out };
  }),

  /**
   * NOT deprecated — the manager-attestation WRITE path. It inserts into
   * competency_validations, which the Assessment Spine reads (manager validation
   * strengthens, but never fabricates, readiness). Keep.
   */
  validate: protectedProcedure
    .input(z.object({ userId: z.number(), domain: z.string().max(40), note: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Must manage a team the target belongs to.
      const managed = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(and(eq(teamMembers.userId, ctx.user.id), inArray(teamMembers.role, ["owner", "admin", "manager"])));
      if (managed.length === 0) throw new Error("Not a manager");
      await db.insert(competencyValidations).values({
        managerId: ctx.user.id,
        userId: input.userId,
        domain: input.domain,
        note: input.note ?? null,
      });
      return { ok: true };
    }),
});
