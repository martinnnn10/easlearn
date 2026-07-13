/**
 * AI Workforce Planner — the enterprise-defining feature.
 *
 * A manager describes a capital project ("adding 3 packaging lines next month")
 * and the required skills. The planner reads the DEMONSTRATED competency graph and
 * returns: who's ready, who's close, who needs training from scratch, a prioritized
 * training sequence, an LLM-written executive summary (grounded — it organizes the
 * computed roster, it never invents who's qualified), and a transparent ROI
 * projection a VP can forward to their CFO.
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { eq } from "drizzle-orm";
import { managedMemberIds } from "./competencyGraph";
import { spineCells } from "./assessment";
import { SKILL_DOMAIN_LABELS, type SkillDomain } from "@shared/competencyMatrix";
import type { ReadinessCell } from "@shared/assessmentSpine";

const PLAN_MODEL = process.env.PLANNER_MODEL || process.env.TUTOR_DEEP_MODEL || "claude-opus-4-8";
const SKILL_DOMAINS = ["vfd", "plc", "motors", "safety", "electrical", "networking", "sensors", "integration"] as const;

type Readiness = "ready" | "accelerate" | "train";

function classify(cell: ReadinessCell | undefined): Readiness {
  if (!cell || cell.attempts === 0) return "train";
  if (cell.hasSafetyViolation) return "accelerate"; // never "ready" with a safety flag on record
  if ((cell.level === "expert" || cell.level === "proficient") && cell.decay !== "decayed") return "ready";
  return "accelerate"; // has some demonstrated skill but not yet ready / has decayed
}

export const plannerRouter = router({
  plan: protectedProcedure
    .input(
      z.object({
        projectName: z.string().min(2).max(200),
        requiredDomains: z.array(z.enum(SKILL_DOMAINS)).min(1).max(8),
        targetWeeks: z.number().int().min(1).max(104).default(4),
        // Optional ROI inputs — transparent, user-supplied. No fabricated baselines.
        downtimeCostPerMin: z.number().min(0).optional(),
        currentDowntimeHoursPerMonth: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const memberIds = await managedMemberIds(db, ctx.user.id);
      if (memberIds.length === 0) return { ok: false, reason: "no_team" as const };

      const roster: {
        name: string;
        byDomain: Record<string, { readiness: Readiness; confidence: number; level: string }>;
        overallReady: boolean;
      }[] = [];

      for (const uid of memberIds) {
        const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, uid)).limit(1);
        const cells = await spineCells(db, uid);
        const byDomain: Record<string, { readiness: Readiness; confidence: number; level: string }> = {};
        for (const d of input.requiredDomains) {
          const cell = cells.find(c => c.domain === d);
          byDomain[d] = { readiness: classify(cell), confidence: cell?.confidence ?? 0, level: cell?.level ?? "not_demonstrated" };
        }
        const overallReady = input.requiredDomains.every(d => byDomain[d].readiness === "ready");
        roster.push({ name: u?.name ?? "Technician", byDomain, overallReady });
      }

      // Aggregate the gap picture per required domain.
      const gaps = input.requiredDomains.map(d => {
        const ready = roster.filter(r => r.byDomain[d].readiness === "ready").length;
        const accelerate = roster.filter(r => r.byDomain[d].readiness === "accelerate").length;
        const train = roster.filter(r => r.byDomain[d].readiness === "train").length;
        return { domain: d, label: SKILL_DOMAIN_LABELS[d as SkillDomain], ready, accelerate, train };
      });

      const fullyReady = roster.filter(r => r.overallReady).length;

      // Transparent ROI projection (only if the manager supplied real inputs).
      let roi: null | { assumptionNote: string; projectedMonthlySavings: number; basis: string } = null;
      if (input.downtimeCostPerMin && input.currentDowntimeHoursPerMonth) {
        // Conservative model: lifting the team to "ready" trims mean-time-to-repair.
        // We assume a 15% MTTR reduction at full readiness, scaled by current readiness gap.
        const readyFrac = roster.length ? fullyReady / roster.length : 0;
        const liftFrac = (1 - readyFrac) * 0.15; // upside still on the table
        const monthlyDowntimeCost = input.currentDowntimeHoursPerMonth * 60 * input.downtimeCostPerMin;
        roi = {
          projectedMonthlySavings: Math.round(monthlyDowntimeCost * liftFrac),
          basis: `${input.currentDowntimeHoursPerMonth} downtime hrs/mo × $${input.downtimeCostPerMin}/min × ${(liftFrac * 100).toFixed(1)}% projected MTTR reduction`,
          assumptionNote: "Projection from YOUR inputs and a conservative 15%-at-full-readiness MTTR model. Not a guarantee — validate against your own data.",
        };
      }

      // Grounded LLM synthesis: organize the computed roster into a plan. It must
      // not invent who is qualified — it only sequences and explains the given data.
      const systemPrompt = `You are a maintenance workforce planner. Using ONLY the data provided (do not invent technicians, scores, or qualifications), write a concise readiness plan for a capital project.

Project: ${input.projectName}
Target: ready in ${input.targetWeeks} weeks
Required skills: ${input.requiredDomains.map(d => SKILL_DOMAIN_LABELS[d as SkillDomain]).join(", ")}
Team size: ${roster.length} · Fully ready now: ${fullyReady}
Per-skill gap (ready/accelerate/train): ${gaps.map(g => `${g.label} ${g.ready}/${g.accelerate}/${g.train}`).join(" | ")}

Write: (1) a 2-sentence readiness verdict, (2) a prioritized training sequence — who/which group to train first to hit the deadline, by name where helpful, (3) the single biggest risk to the timeline. 6-9 sentences. Plain, decisive, for a maintenance VP.`;

      let summary = "";
      try {
        const res = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Roster: ${JSON.stringify(roster.map(r => ({ name: r.name, byDomain: r.byDomain })))}` },
          ],
          model: PLAN_MODEL,
          maxTokens: 600,
        });
        const raw = res.choices[0]?.message?.content;
        summary = (typeof raw === "string" ? raw : JSON.stringify(raw)).trim();
      } catch {
        summary = `${fullyReady} of ${roster.length} technicians are ready across all required skills. Prioritize training the "train-from-scratch" group in the domains with the largest gaps first, then refresh anyone whose competency has decayed. Biggest risk: domains where zero technicians are ready.`;
      }

      return {
        ok: true as const,
        projectName: input.projectName,
        targetWeeks: input.targetWeeks,
        teamSize: roster.length,
        fullyReady,
        gaps,
        roster,
        roi,
        summary,
      };
    }),
});
