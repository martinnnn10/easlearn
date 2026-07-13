/**
 * Grounded AI Tutor — retrieval-grounded coaching on top of the deterministic engine.
 *
 * Core principle: the simulator's scoring engine owns WHAT is correct. The LLM only
 * ever EXPLAINS a fixed, known-correct answer that we hand it. It never decides the
 * diagnosis, never invents readings. This makes hallucination on the thing that
 * matters (the correct fix) structurally impossible — and it's only safe to ship
 * *because* the deterministic answer key already exists in ScenarioV3.
 *
 * Three surfaces:
 *   tutor.coachWrongMove  — real-time, fires when a learner takes a non-correct action
 *   tutor.debrief         — end-of-scenario narrative coaching over the MethodologyScore
 *   tutor.gradeFreeText   — grades an open "what's the root cause?" answer vs the rubric
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { eq, desc } from "drizzle-orm";
import { openResponseAttempts } from "../drizzle/schema";

// Latency/cost-tiered model selection. Wire IDs via env so they can be A/B-tested
// and bumped without a code change. Haiku for the high-frequency in-loop hint,
// Opus for the low-frequency, depth-sensitive debrief & grading.
const HINT_MODEL = process.env.TUTOR_HINT_MODEL || "claude-haiku-4-5";
const DEEP_MODEL = process.env.TUTOR_DEEP_MODEL || "claude-opus-4-8";

/** Shared guardrail prepended to every tutor system prompt. */
const GUARDRAILS = `RULES (non-negotiable):
- The provided correct action / root cause is GROUND TRUTH. Never contradict it.
- Never invent meter readings, part numbers, voltages, or states not given to you.
- If asked something the inputs don't cover, say what to measure to find out — do not guess.
- Plain plant-floor trade language. No textbook lecturing. Be the senior tech they respect.`;

const recentActionSchema = z.object({
  type: z.string(),
  description: z.string(),
  wasUseful: z.boolean(),
});

// ── tutor.coachWrongMove ──────────────────────────────────────────────────────
// Called from SimulatorEngineV3.executeSystemAction() when action.isCorrect === false.
const coachWrongMove = protectedProcedure
  .input(
    z.object({
      scenarioTitle: z.string().max(255),
      plantContext: z
        .object({
          plantName: z.string().optional(),
          lineName: z.string().optional(),
          costPerMinute: z.string().optional(),
        })
        .optional(),
      // What the learner just did (wrong) and what they SHOULD have done. Both
      // come straight from ScenarioV3.SystemAction — the engine already knows them.
      chosenAction: z.object({
        label: z.string(),
        consequence: z.string(),
        category: z.string().optional(),
      }),
      correctAction: z
        .object({ label: z.string(), consequence: z.string() })
        .nullable(),
      // The methodology dimension this misstep most likely hurt (from scoringEngine ids).
      hurtDimension: z.string().optional(),
      recentActions: z.array(recentActionSchema).max(8).default([]),
      cluesFound: z.array(z.string()).max(40).default([]),
    }),
  )
  .mutation(async ({ input }) => {
    const ctxLine = input.plantContext
      ? `Plant: ${input.plantContext.plantName ?? "—"} · Line: ${input.plantContext.lineName ?? "—"} · Downtime cost: ${input.plantContext.costPerMinute ?? "—"}/min`
      : "";

    const systemPrompt = `You are a master industrial maintenance instructor coaching a trainee MID-scenario on a live troubleshooting call.

${ctxLine}
Scenario: ${input.scenarioTitle}

The trainee just chose: "${input.chosenAction.label}"
That choice's outcome: ${input.chosenAction.consequence}
${input.correctAction ? `The correct next action is: "${input.correctAction.label}" (outcome: ${input.correctAction.consequence})` : "There is no single correct action available in this state yet — they need more evidence first."}
${input.hurtDimension ? `Methodology weakness shown: ${input.hurtDimension}.` : ""}
Recent moves: ${input.recentActions.map(a => `${a.wasUseful ? "✓" : "✗"} ${a.description}`).join(" | ") || "none"}
Clues found so far: ${input.cluesFound.join(", ") || "none"}

${GUARDRAILS}
- Do NOT hand them the answer outright. Give ONE concrete next step and the reasoning.
- 2-3 sentences. Tell them what to MEASURE or CHECK next and why.`;

    try {
      const res = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Coach me on what I just did wrong." },
        ],
        model: HINT_MODEL,
        maxTokens: 220,
      });
      const raw = res.choices[0]?.message?.content;
      const text = typeof raw === "string" ? raw : JSON.stringify(raw);
      return { coaching: text.trim(), grounded: true };
    } catch {
      // Graceful degradation: fall back to the static consequence text the
      // scenario already carries. The tutor never blocks gameplay.
      return {
        coaching:
          input.correctAction?.consequence ??
          input.chosenAction.consequence ??
          "Step back and gather more evidence before acting.",
        grounded: false,
      };
    }
  });

// ── tutor.debrief ─────────────────────────────────────────────────────────────
// Called once at scenario end with the already-computed MethodologyScore summary.
const debrief = protectedProcedure
  .input(
    z.object({
      scenarioTitle: z.string().max(255),
      overallPercentage: z.number().min(0).max(100),
      methodologyTier: z.string(),
      strengths: z.array(z.string()).max(5).default([]),
      improvements: z.array(z.string()).max(5).default([]),
      coachingTips: z.array(z.string()).max(8).default([]),
    }),
  )
  .mutation(async ({ input }) => {
    const systemPrompt = `You are a master maintenance instructor writing a short, motivating post-call debrief for a trainee.

Scenario: ${input.scenarioTitle}
Overall methodology: ${input.overallPercentage}% (${input.methodologyTier})
Strengths: ${input.strengths.join("; ") || "—"}
Top improvements: ${input.improvements.join("; ") || "—"}

${GUARDRAILS}
- Open by naming one real strength. Then name the SINGLE habit costing them most and one drill to fix it.
- Describe briefly how a master would have run this exact call.
- 4-6 sentences. Direct, encouraging, specific.`;

    try {
      const res = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Give me my debrief." },
        ],
        model: DEEP_MODEL,
        maxTokens: 400,
      });
      const raw = res.choices[0]?.message?.content;
      const text = typeof raw === "string" ? raw : JSON.stringify(raw);
      return { debrief: text.trim(), grounded: true };
    } catch {
      // Fall back to the deterministic tips we already computed.
      return { debrief: input.coachingTips.join(" "), grounded: false };
    }
  });

// ── tutor.gradeFreeText ───────────────────────────────────────────────────────
// Grades an open "what's the root cause and what do you check next?" answer
// against the scenario's known root cause. Returns 0-100 + rationale so it can
// flow into methodologyDimensions unchanged.
const gradeFreeText = protectedProcedure
  .input(
    z.object({
      faultName: z.string().max(255),
      correctRootCause: z.string().max(2000), // Fault.rootCause — ground truth
      learnerAnswer: z.string().min(1).max(2000),
      // Optional context — when present, the graded attempt is persisted to the
      // accreditation trail (open_response_attempts).
      scenarioSlug: z.string().max(120).optional(),
      lessonId: z.number().int().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const systemPrompt = `You grade a trainee's free-text root-cause diagnosis against a known-correct root cause.

Fault: ${input.faultName}
CORRECT root cause (ground truth): ${input.correctRootCause}

${GUARDRAILS}
Return ONLY JSON: {"score": <0-100 integer>, "rationale": "<1-2 sentences>", "missed": "<key thing they missed, or empty>"}.
Award credit for correct reasoning even if wording differs. Penalize confidently-wrong causes hard.`;

    try {
      const res = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.learnerAnswer },
        ],
        model: DEEP_MODEL,
        maxTokens: 250,
        responseFormat: { type: "json_object" },
      });
      const raw = res.choices[0]?.message?.content;
      const text = typeof raw === "string" ? raw : JSON.stringify(raw);
      const parsed = JSON.parse(text);
      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
      const rationale = String(parsed.rationale ?? "");
      const missed = String(parsed.missed ?? "");

      // Persist as an accreditation record. Best-effort: a storage failure must
      // not lose the learner's grade, so we swallow and still return the result.
      try {
        const db = await getDb();
        if (db) {
          await db.insert(openResponseAttempts).values({
            userId: ctx.user.id,
            scenarioSlug: input.scenarioSlug ?? null,
            lessonId: input.lessonId ?? null,
            prompt: input.faultName,
            answer: input.learnerAnswer,
            score,
            rationale,
            missed,
            gradedBy: DEEP_MODEL,
          });
        }
      } catch {
        /* non-fatal: grade is still returned to the learner */
      }

      return { score, rationale, missed, graded: true };
    } catch {
      // If grading fails, do not silently pass — flag for human review.
      return { score: 0, rationale: "Automatic grading unavailable — flagged for review.", missed: "", graded: false };
    }
  });

// ── tutor.myOpenResponses ─────────────────────────────────────────────────────
// The learner's own graded free-text history — the open-response competency trail.
const myOpenResponses = protectedProcedure.query(async ({ ctx }) => {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(openResponseAttempts)
    .where(eq(openResponseAttempts.userId, ctx.user.id))
    .orderBy(desc(openResponseAttempts.createdAt));
});

export const tutorRouter = router({
  coachWrongMove,
  debrief,
  gradeFreeText,
  myOpenResponses,
});
