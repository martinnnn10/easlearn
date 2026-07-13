/**
 * Accreditation support — the records and reports that real accreditation reviews
 * (ANSI/IACET 1-2018 for CEUs, ANAB ISO 17024 for the cert program) require:
 *
 *   accreditation.myTranscript      — learner's CEU / contact-hour transcript with
 *                                     standards alignment (the "competency transcript").
 *   accreditation.standardsCoverage — admin compliance matrix: clause → coverage.
 *
 * CEU math follows ANSI/IACET 1-2018 (1 CEU = 10 contact hours of assessed instruction).
 * Contact hours come from completed, published lessons; standards come from the
 * domain→clause crosswalk in shared/standardsAlignment.
 */

import { eq, and } from "drizzle-orm";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { userProgress, courseLessons, courseModules, lessonAssessmentAttempts } from "../drizzle/schema";
import { skillDomainForModule } from "@shared/competencyMatrix";
import {
  STANDARD_CLAUSES,
  DOMAIN_STANDARDS,
  clausesForDomain,
  contactHoursToCeu,
  type StandardClause,
} from "@shared/standardsAlignment";

export interface TranscriptModule {
  moduleSlug: string;
  moduleTitle: string;
  domain: string;
  lessonsCompleted: number;
  contactMinutes: number;
  ceu: number;
  clauses: StandardClause[];
}

export const accreditationRouter = router({
  myTranscript: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const completed = await db
      .select({
        moduleId: userProgress.moduleId,
        minutes: courseLessons.estimatedMinutes,
        moduleSlug: courseModules.slug,
        moduleTitle: courseModules.title,
      })
      .from(userProgress)
      .innerJoin(courseLessons, eq(userProgress.lessonId, courseLessons.id))
      .innerJoin(courseModules, eq(userProgress.moduleId, courseModules.id))
      .where(and(eq(userProgress.userId, ctx.user.id), eq(userProgress.completed, true)));

    // Passed assessments — IACET requires assessed learning to count toward CEUs.
    const passed = await db
      .select({ id: lessonAssessmentAttempts.id })
      .from(lessonAssessmentAttempts)
      .where(and(eq(lessonAssessmentAttempts.userId, ctx.user.id), eq(lessonAssessmentAttempts.passed, true)));

    const byModule = new Map<string, TranscriptModule>();
    for (const row of completed) {
      const slug = row.moduleSlug;
      const domain = skillDomainForModule(slug);
      const cur =
        byModule.get(slug) ??
        ({
          moduleSlug: slug,
          moduleTitle: row.moduleTitle,
          domain,
          lessonsCompleted: 0,
          contactMinutes: 0,
          ceu: 0,
          clauses: clausesForDomain(domain),
        } as TranscriptModule);
      cur.lessonsCompleted += 1;
      cur.contactMinutes += row.minutes ?? 0;
      byModule.set(slug, cur);
    }

    const modules = Array.from(byModule.values());
    for (const m of modules) m.ceu = contactHoursToCeu(m.contactMinutes);

    const totalContactMinutes = modules.reduce((s, m) => s + m.contactMinutes, 0);
    const distinctClauses = new Map<string, StandardClause>();
    for (const m of modules) for (const c of m.clauses) distinctClauses.set(c.id, c);

    return {
      learnerName: ctx.user.name ?? "Technician",
      issuedAt: new Date().toISOString(),
      modules,
      totals: {
        contactMinutes: totalContactMinutes,
        contactHours: Math.round((totalContactMinutes / 60) * 10) / 10,
        ceu: contactHoursToCeu(totalContactMinutes),
        lessonsCompleted: modules.reduce((s, m) => s + m.lessonsCompleted, 0),
        assessmentsPassed: passed.length,
      },
      standardsCovered: Array.from(distinctClauses.values()),
    };
  }),

  // Admin compliance matrix: every clause, with which domains/modules cover it.
  standardsCoverage: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const modules = await db
      .select({ slug: courseModules.slug, title: courseModules.title })
      .from(courseModules);

    // Build clause → covering modules.
    const coverage = new Map<string, { clause: StandardClause; modules: string[] }>();
    for (const clauseId of Object.keys(STANDARD_CLAUSES)) {
      coverage.set(clauseId, { clause: STANDARD_CLAUSES[clauseId], modules: [] });
    }
    for (const m of modules) {
      const domain = skillDomainForModule(m.slug);
      for (const clauseId of DOMAIN_STANDARDS[domain] ?? []) {
        coverage.get(clauseId)?.modules.push(m.title);
      }
    }

    return Array.from(coverage.values()).map(c => ({
      body: c.clause.body,
      ref: c.clause.ref,
      title: c.clause.title,
      moduleCount: c.modules.length,
      modules: c.modules,
      covered: c.modules.length > 0,
    }));
  }),
});
