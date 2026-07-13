/**
 * Program progress — computes a technician's journey through "Operator → Tech"
 * from real data: module lesson completion + competency graph. The outcome
 * product's progress bar.
 *
 *   program.operatorToTech — stages with per-module progress, overall %, current stage.
 */

import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { courseModules, userProgress } from "../drizzle/schema";
import { OPERATOR_TO_TECH } from "@shared/operatorToTech";
import { spineCells } from "./assessment";

export const programRouter = router({
  operatorToTech: protectedProcedure.query(async ({ ctx }) => {
    const program = OPERATOR_TO_TECH;
    const db = await getDb();
    if (!db) return { program, stages: program.stages.map(s => ({ id: s.id, progress: 0, items: s.items.map(() => 0) })), overall: 0, currentStageId: program.stages[0].id, competency: {} as Record<string, number> };

    // Module completion % by slug.
    const modules = await db.select({ id: courseModules.id, slug: courseModules.slug, totalLessons: courseModules.totalLessons }).from(courseModules);
    const bySlug = new Map(modules.map(m => [m.slug, m]));
    const completed = await db
      .select({ moduleId: userProgress.moduleId })
      .from(userProgress)
      .where(and(eq(userProgress.userId, ctx.user.id), eq(userProgress.completed, true)));
    const doneByModule = new Map<number, number>();
    for (const c of completed) doneByModule.set(c.moduleId, (doneByModule.get(c.moduleId) ?? 0) + 1);

    const modulePct = (slug: string): number => {
      const m = bySlug.get(slug);
      if (!m) return 0;
      const done = doneByModule.get(m.id) ?? 0;
      const total = m.totalLessons > 0 ? m.totalLessons : Math.max(1, done);
      return Math.min(100, Math.round((done / total) * 100));
    };

    // Competency by domain (for the domain badges on each stage) — from the spine.
    const cells = await spineCells(db, ctx.user.id);
    const competency: Record<string, number> = {};
    for (const c of cells) competency[c.domain] = c.attempts > 0 ? c.confidence : 0;

    // Per-stage progress: average over trackable items (modules; labs count as
    // "started" via any domain competency; coming-soon items are excluded).
    const stages = program.stages.map(s => {
      const itemProgress = s.items.map(it => {
        if (it.comingSoon) return -1; // not counted
        if (it.type === "module" && it.slug) return modulePct(it.slug);
        if (it.type === "lab" || it.type === "practical") {
          // Reflect practice via the stage's competency domains.
          const domScores = s.domains.map(d => competency[d] ?? 0).filter(x => x > 0);
          return domScores.length ? Math.min(100, Math.round(domScores.reduce((a, b) => a + b, 0) / domScores.length)) : 0;
        }
        return 0;
      });
      const tracked = itemProgress.filter(p => p >= 0);
      const progress = tracked.length ? Math.round(tracked.reduce((a, b) => a + b, 0) / tracked.length) : 0;
      return { id: s.id, progress, items: itemProgress };
    });

    const overall = Math.round(stages.reduce((a, s) => a + s.progress, 0) / stages.length);
    const currentStageId = (stages.find(s => s.progress < 100) ?? stages[stages.length - 1]).id;

    return { program, stages, overall, currentStageId, competency };
  }),
});
