/**
 * Maintenance Mentor router — the server side of the in-lesson AI mentor.
 *
 *   mentor.coach — one coaching turn. Reads the learner's spine readiness for the
 *   domain, classifies their reasoning DETERMINISTICALLY (safety backstop), asks
 *   the LLM gateway for plant-floor coaching PROSE, and writes ai_mentor evidence
 *   back into the Assessment Spine. Never dumps answers; safety always wins.
 *
 * Reuses the existing LLM gateway (invokeLLM) — no parallel AI system. Reasoning
 * classification and evidence are deterministic (shared/maintenanceMentor.ts) so
 * competency evidence is trustworthy and the safety net never depends on model
 * output.
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { triggerReviewsFromMentor } from "./schedulerAutoTrigger";
import { competencyEvidence } from "../drizzle/schema";
import { SKILL_DOMAIN_LABELS, type SkillDomain } from "@shared/competencyMatrix";
import { gatherEvidence } from "./assessment";
import { checkRate, RATE_LIMIT_MESSAGE } from "./rateLimit";
import { readinessCells, interpretEvidence, recentEvidenceSummary } from "@shared/assessmentSpine";
import {
  classifyReasoning,
  classifyCommunication,
  mentorEvidence,
  crossCheckClassification,
  assessmentFromCrossCheck,
  parseCoachJson,
  buildMentorSystemPrompt,
  buildMentorUserPrompt,
  fallbackMentorMessage,
  buildOperatorSystemPrompt,
  buildOperatorUserPrompt,
  fallbackOperatorLine,
  pickOperatorPersona,
  MENTOR_MODES,
  COMMUNICATION_MODES,
  OPERATOR_PERSONAS,
  type MentorContext,
  type MentorMode,
  type OperatorPersona,
} from "@shared/maintenanceMentor";

const MENTOR_MODEL = process.env.MENTOR_MODEL || process.env.TUTOR_MODEL || undefined;
const DOMAIN_VALUES = Object.keys(SKILL_DOMAIN_LABELS) as [SkillDomain, ...SkillDomain[]];

export const mentorRouter = router({
  coach: protectedProcedure
    .input(
      z.object({
        mode: z.enum(MENTOR_MODES as [MentorMode, ...MentorMode[]]),
        lessonTitle: z.string().max(200),
        cardHeading: z.string().max(200).optional(),
        mechanicId: z.string().max(48).optional(),
        domain: z.enum(DOMAIN_VALUES),
        learnerAction: z.string().max(500).optional(),
        learnerReasoning: z.string().max(2000).optional(),
        hintLevel: z.number().int().min(0).max(3).optional(),
        // Operator role-play provenance (merged into the evidence audit detail).
        persona: z.string().max(24).optional(),
        scenarioTag: z.string().max(80).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      // Distributed (DB-backed) rate limit; in-memory fallback for local/dev; fail-open.
      if (!(await checkRate(db, ctx.user.id, "mentor.coach"))) {
        return {
          message: RATE_LIMIT_MESSAGE,
          mode: input.mode,
          quality: "unclear" as const,
          unsafe: false,
          evidenceEmitted: null,
          rateLimited: true,
        };
      }
      let cell: ReturnType<typeof readinessCells>[number] | undefined;
      let summary = { recentStrengths: [] as string[], recentWeaknesses: [] as string[], safetyCount: 0 };
      let hintCount = 0;
      if (db) {
        try {
          const events = await gatherEvidence(db, ctx.user.id);
          cell = readinessCells(events).find((c) => c.domain === input.domain);
          const signals = events.filter((e) => e.domain === input.domain).map(interpretEvidence);
          summary = recentEvidenceSummary(signals);
          hintCount = events.filter((e) => e.domain === input.domain && e.evidenceType === "ai_hint_used").length;
        } catch {
          /* readiness context is best-effort — never block coaching */
        }
      }

      // Closeout/communication modes evaluate a WRITTEN explanation; live modes evaluate reasoning.
      const assessment = COMMUNICATION_MODES.includes(input.mode)
        ? classifyCommunication(input.learnerReasoning ?? "")
        : classifyReasoning(input.learnerReasoning ?? "");

      const mentorCtx: MentorContext = {
        lessonTitle: input.lessonTitle,
        cardHeading: input.cardHeading,
        mechanicId: input.mechanicId,
        domain: input.domain,
        mode: input.mode,
        hintLevel: input.hintLevel,
        readinessLevel: cell?.readinessLevel,
        domainConfidence: cell?.confidence,
        hasSafetyFlag: cell?.hasSafetyViolation,
        needsReview: cell ? cell.decay !== "fresh" : undefined,
        managerValidated: cell?.managerValidated,
        recentStrengths: summary.recentStrengths,
        recentWeaknesses: summary.recentWeaknesses,
        recentSafetyCount: summary.safetyCount,
        recentHintCount: hintCount,
        learnerAction: input.learnerAction,
        learnerReasoning: input.learnerReasoning,
      };

      // Prompt in the deterministic-safety framing, then let the LLM cross-check.
      const promptMode: MentorMode = assessment.unsafe ? "safety_override" : input.mode;
      const promptCtx: MentorContext = { ...mentorCtx, mode: promptMode };

      let llmMessage: string | null = null;
      let llmClass = null as ReturnType<typeof parseCoachJson>["llm"];
      try {
        const res = await invokeLLM({
          messages: [
            { role: "system", content: buildMentorSystemPrompt() },
            { role: "user", content: buildMentorUserPrompt(promptCtx) },
          ],
          model: MENTOR_MODEL,
          maxTokens: 320,
        });
        const raw = res.choices[0]?.message?.content;
        const parsed = parseCoachJson(typeof raw === "string" ? raw : JSON.stringify(raw));
        llmMessage = parsed.message;
        llmClass = parsed.llm;
      } catch {
        /* LLM failure never blocks the lesson — fall through to deterministic. */
      }

      // Safety-escalate-only merge: deterministic is the floor; LLM can only escalate.
      const cross = crossCheckClassification(assessment, llmClass);
      const finalAssessment = assessmentFromCrossCheck(assessment, cross);
      const effectiveMode: MentorMode = finalAssessment.unsafe ? "safety_override" : input.mode;

      // Message: on unsafe, force a hard safety stop (prefer the LLM's own correction).
      let message: string;
      if (finalAssessment.unsafe) {
        message = cross.suggestedMentorResponse
          || (assessment.unsafe && llmMessage ? llmMessage : "")
          || fallbackMentorMessage({ ...mentorCtx, mode: "safety_override" }, finalAssessment);
      } else {
        message = llmMessage || fallbackMentorMessage(promptCtx, finalAssessment);
      }

      // Emit ai_mentor evidence using the (possibly escalated) final assessment.
      let evidenceEmitted: { evidenceType: string; quality: string; unsafe: boolean; escalatedByLlm: boolean } | null = null;
      if (finalAssessment.unsafe || input.mode !== "ask") {
        const ev = mentorEvidence(mentorCtx, finalAssessment);
        if (db) {
          try {
            await db.insert(competencyEvidence).values({
              learnerId: ctx.user.id,
              sourceType: "ai_mentor",
              evidenceType: ev.evidenceType,
              mechanicId: ev.mechanicId ?? null,
              domain: input.domain,
              correctness: ev.correctness ?? null,
              reasoningQuality: ev.reasoningQuality ?? null,
              safetyFlag: ev.safetyFlag ?? false,
              lessonId: input.lessonTitle,
              detail: {
                ...((ev.detail as Record<string, unknown>) ?? {}),
                ...(input.persona ? { persona: input.persona } : {}),
                ...(input.scenarioTag ? { scenario: input.scenarioTag } : {}),
                // Cross-check audit trail (why the final classification is what it is).
                deterministicClassification: cross.deterministic,
                llmClassification: cross.llm,
                finalClassification: cross.final,
                escalatedByLlm: cross.escalatedByLlm,
                llmReason: cross.llmReason,
                detectedIssues: cross.detectedIssues,
              },
            });
          } catch {
            /* telemetry must never break the mentor */
          }
        }
                evidenceEmitted = { evidenceType: ev.evidenceType, quality: finalAssessment.quality, unsafe: finalAssessment.unsafe, escalatedByLlm: cross.escalatedByLlm };
      }

      // ── Auto-trigger spaced repetition reviews from mentor signals ──────────
      // Only trigger when evidence was emitted (meaning the interaction was substantive).
      if (evidenceEmitted && db) {
        try {
          await triggerReviewsFromMentor(db as any, {
            learnerId: ctx.user.id,
            sourceId: `${input.domain}/${input.mechanicId}`,
            sourceLabel: `${input.lessonTitle} — ${input.cardHeading}`,
            domain: input.domain,
            skill: input.mechanicId,
            signals: {
              operatorCommunicationScore: null,
              workOrderScore: null,
              reflectionScore: finalAssessment.quality === "strong" ? 90 : finalAssessment.quality === "partial" ? 60 : 30,
              confidenceScore: null,
              safetyIssue: finalAssessment.unsafe,
            },
          });
        } catch {
          /* Scheduler must never break the mentor */
        }
      }

      return { message, mode: effectiveMode, quality: finalAssessment.quality, unsafe: finalAssessment.unsafe, evidenceEmitted };
    }),

  /**
   * The AI OPERATOR's turn in a role-play (separate from the mentor). Plays a
   * production operator in a persona; never teaches or evaluates. If the learner's
   * last message is unsafe, it STOPS the role-play (stop=true) so the client can
   * hand off to the mentor's safety correction. Emits NO evidence — evaluation and
   * evidence come from mentor.coach(operator_communication).
   */
  operator: protectedProcedure
    .input(
      z.object({
        scenario: z.string().max(600),
        persona: z.enum(OPERATOR_PERSONAS as [OperatorPersona, ...OperatorPersona[]]).optional(),
        turn: z.number().int().min(0).max(5),
        learnerMessage: z.string().max(2000).optional(),
        history: z.array(z.object({ from: z.enum(["operator", "learner"]), text: z.string().max(2000) })).max(8).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const persona: OperatorPersona = input.persona ?? pickOperatorPersona(ctx.user.id * 7 + input.turn);

      // Safety first: an unsafe learner instruction stops the role-play immediately.
      if (input.learnerMessage && classifyCommunication(input.learnerMessage).unsafe) {
        return { message: "", persona, learnerUnsafe: true, stop: true, rateLimited: false };
      }
      // Distributed (DB-backed) rate limit — a separate bucket from mentor.coach.
      const db = await getDb();
      if (!(await checkRate(db, ctx.user.id, "mentor.operator"))) {
        return { message: RATE_LIMIT_MESSAGE, persona, learnerUnsafe: false, stop: false, rateLimited: true };
      }

      const octx = { scenario: input.scenario, persona, turn: input.turn, learnerMessage: input.learnerMessage, history: input.history };
      let message: string;
      try {
        const res = await invokeLLM({
          messages: [
            { role: "system", content: buildOperatorSystemPrompt() },
            { role: "user", content: buildOperatorUserPrompt(octx) },
          ],
          model: MENTOR_MODEL,
          maxTokens: 120,
        });
        const raw = res.choices[0]?.message?.content;
        message = (typeof raw === "string" ? raw : JSON.stringify(raw)).trim() || fallbackOperatorLine(octx);
      } catch {
        message = fallbackOperatorLine(octx);
      }
      return { message, persona, learnerUnsafe: false, stop: false, rateLimited: false };
    }),
});
