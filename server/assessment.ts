/**
 * Assessment Spine router — the trust layer's persistence + rollup surface.
 *
 *   assessment.recordEvidence — persist one EvidenceEvent from any source.
 *   assessment.myReadiness    — the learner's per-domain readiness, rolled up from
 *                               ALL evidence (explicit events + simulator completions
 *                               + manager validations) through shared/assessmentSpine.
 *   assessment.teamReadiness  — the same, for every member a manager manages.
 *
 * This does NOT create a parallel competency system: it unifies the existing
 * sources (scenario_completions, competency_validations) with the new evidence
 * ledger and interprets them with one shared, tested rule set.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { competencyEvidence, scenarioCompletions, competencyValidations, users } from "../drizzle/schema";
import { SKILL_DOMAIN_LABELS, type SkillDomain } from "@shared/competencyMatrix";
import { managedMemberIds, slugDomainMap } from "./competencyGraph";
import {
  interpretEvidence,
  rollupDomain,
  deriveReadiness,
  readinessCells,
  simulationEvidence,
  managerValidationEvidence,
  methodologyTierFromConfidence,
  overallConfidence,
  hasAnyEvidence,
  communicationReadiness,
  COMMUNICATION_VALIDATION_OPTIONS,
  type EvidenceEvent,
  type ReadinessCell,
  type CommunicationReadiness,
  type CompetencySignal,
  type ReadinessSignal,
  type Correctness,
  type ReasoningQuality,
  type SourceType,
  type EvidenceType,
} from "@shared/assessmentSpine";

const DOMAINS = Object.keys(SKILL_DOMAIN_LABELS) as SkillDomain[];

/** A readiness signal enriched for display: domain label + the recent audit trail. */
export interface EnrichedReadiness extends ReadinessSignal {
  label: string;
  recentAudit: { reason: string; direction: CompetencySignal["direction"]; sourceType: SourceType; at: string }[];
}

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const evidenceInput = z.object({
  sourceType: z.enum(["lesson", "simulation", "review", "ai_mentor", "manager_validation"]),
  evidenceType: z.string().max(40),
  mechanicId: z.string().max(48).optional(),
  domain: z.string().max(40),
  skill: z.string().max(80).optional(),
  lessonId: z.string().max(120).optional(),
  courseId: z.string().max(120).optional(),
  competencyId: z.string().max(120).optional(),
  actionTaken: z.string().max(255).optional(),
  correctness: z.enum(["correct", "incorrect", "partial"]).optional(),
  reasoningQuality: z.enum(["sound", "weak", "flawed", "none"]).optional(),
  methodologyScore: z.number().int().min(0).max(100).optional(),
  confidenceScore: z.number().int().min(0).max(100).optional(),
  safetyFlag: z.boolean().optional(),
  attemptNumber: z.number().int().optional(),
  timeToDecisionMs: z.number().int().optional(),
});

/**
 * Spine-based competency cells for a learner — the single competency computation
 * used across the server (planner, program), replacing legacy scenario-only
 * buildCells. One evidence model, one truth.
 */
export async function spineCells(db: Db, userId: number): Promise<ReadinessCell[]> {
  const events = await gatherEvidence(db, userId);
  return readinessCells(events);
}

/** Pull every evidence event for a learner from all unified sources. */
export async function gatherEvidence(db: Db, userId: number): Promise<EvidenceEvent[]> {
  const rows = await db.select().from(competencyEvidence).where(eq(competencyEvidence.learnerId, userId));
  const explicit: EvidenceEvent[] = rows.map((r) => ({
    sourceType: r.sourceType as SourceType,
    evidenceType: r.evidenceType as EvidenceType,
    mechanicId: (r.mechanicId ?? undefined) as EvidenceEvent["mechanicId"],
    domain: r.domain as SkillDomain,
    skill: r.skill ?? undefined,
    lessonId: r.lessonId ?? undefined,
    courseId: r.courseId ?? undefined,
    competencyId: r.competencyId ?? undefined,
    correctness: (r.correctness as Correctness) ?? undefined,
    reasoningQuality: (r.reasoningQuality as ReasoningQuality) ?? undefined,
    methodologyScore: r.methodologyScore ?? undefined,
    confidenceScore: r.confidenceScore ?? undefined,
    safetyFlag: r.safetyFlag,
    attemptNumber: r.attemptNumber ?? undefined,
    timeToDecisionMs: r.timeToDecisionMs ?? undefined,
    detail: (r.detail as Record<string, unknown> | null) ?? undefined,
    createdAt: new Date(r.createdAt).toISOString(),
  }));

  const slugDomain = await slugDomainMap(db);
  const comps = await db
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
  const sim = comps.map((c) =>
    simulationEvidence({
      domain: slugDomain.get(c.scenarioSlug) ?? "integration",
      scenarioSlug: c.scenarioSlug,
      methodologyScore: c.methodologyScore ?? (c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0),
      timeSeconds: c.timeSeconds,
      createdAt: new Date(c.completedAt).toISOString(),
    }),
  );

  const vals = await db
    .select({ domain: competencyValidations.domain, at: competencyValidations.validatedAt })
    .from(competencyValidations)
    .where(eq(competencyValidations.userId, userId));
  const man = vals.map((v) => managerValidationEvidence({ domain: v.domain as SkillDomain, createdAt: new Date(v.at).toISOString() }));

  return [...explicit, ...sim, ...man];
}

function readinessForDomains(events: EvidenceEvent[]): EnrichedReadiness[] {
  return DOMAINS.map((d) => {
    const signals = events.filter((e) => e.domain === d).map(interpretEvidence);
    const readiness = deriveReadiness(rollupDomain(d, signals));
    const recentAudit = signals
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((s) => ({ reason: s.reason, direction: s.direction, sourceType: s.sourceType, at: s.createdAt }));
    return { ...readiness, label: SKILL_DOMAIN_LABELS[d], recentAudit };
  });
}

export const assessmentRouter = router({
  recordEvidence: protectedProcedure.input(evidenceInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    // Interpret regardless of DB so the client always gets the audit line (offline-safe).
    const signal = interpretEvidence({ ...input, domain: input.domain as SkillDomain } as EvidenceEvent);
    if (db) {
      await db.insert(competencyEvidence).values({
        learnerId: ctx.user.id,
        sourceType: input.sourceType,
        evidenceType: input.evidenceType,
        mechanicId: input.mechanicId ?? null,
        domain: input.domain,
        skill: input.skill ?? null,
        lessonId: input.lessonId ?? null,
        courseId: input.courseId ?? null,
        competencyId: input.competencyId ?? null,
        actionTaken: input.actionTaken ?? null,
        correctness: input.correctness ?? null,
        reasoningQuality: input.reasoningQuality ?? null,
        methodologyScore: input.methodologyScore ?? null,
        confidenceScore: input.confidenceScore ?? null,
        safetyFlag: input.safetyFlag ?? false,
        attemptNumber: input.attemptNumber ?? null,
        timeToDecisionMs: input.timeToDecisionMs ?? null,
      });
    }
    return { ok: !!db, signal };
  }),

  myReadiness: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const events = await gatherEvidence(db, ctx.user.id);
    const readiness = readinessForDomains(events);
    const overall = overallConfidence(readiness);

    // Communication manager-validation detail (validator + date + note) for display.
    const labelByKey = new Map(COMMUNICATION_VALIDATION_OPTIONS.map((o) => [o.key, o.label]));
    const vals = await db
      .select({ domain: competencyValidations.domain, note: competencyValidations.note, at: competencyValidations.validatedAt, managerId: competencyValidations.managerId })
      .from(competencyValidations)
      .where(eq(competencyValidations.userId, ctx.user.id));
    const commRows = vals.filter((v) => typeof v.domain === "string" && v.domain.startsWith("comm:"));
    const nameById = new Map<number, string>();
    for (const mid of Array.from(new Set(commRows.map((r) => r.managerId)))) {
      const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, mid)).limit(1);
      nameById.set(mid, u?.name ?? "Manager");
    }
    const communicationValidations = commRows.map((r) => {
      const key = (r.domain as string).slice("comm:".length);
      return { area: key, label: labelByKey.get(key) ?? key, note: r.note ?? null, at: new Date(r.at).toISOString(), validator: nameById.get(r.managerId) ?? "Manager" };
    });

    return {
      name: ctx.user.name ?? "Technician",
      readiness,
      hasEvidence: hasAnyEvidence(readiness),
      overallConfidence: overall,
      methodologyTier: methodologyTierFromConfidence(overall),
      promotionReady: readiness.some((r) => r.level === "Promotion Candidate"),
      communication: communicationReadiness(events),
      communicationValidations,
    };
  }),

  teamReadiness: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { isManager: false, members: [] as TeamReadinessMember[] };
    const ids = await managedMemberIds(db, ctx.user.id);
    if (ids.length === 0) return { isManager: false, members: [] as TeamReadinessMember[] };
    const members: TeamReadinessMember[] = [];
    for (const uid of ids) {
      const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, uid)).limit(1);
      const events = await gatherEvidence(db, uid);
      const readiness = readinessForDomains(events);
      const overall = overallConfidence(readiness);
      members.push({
        userId: uid,
        name: u?.name ?? "Technician",
        readiness,
        overallConfidence: overall,
        methodologyTier: methodologyTierFromConfidence(overall),
        hasEvidence: hasAnyEvidence(readiness),
        communication: communicationReadiness(events),
      });
    }
    return { isManager: true, members };
  }),
});

interface TeamReadinessMember {
  userId: number;
  name: string;
  readiness: EnrichedReadiness[];
  overallConfidence: number;
  methodologyTier: string;
  hasEvidence: boolean;
  communication: CommunicationReadiness;
}
