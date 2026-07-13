/**
 * Authoring platform — draft → review → publish workflow for lesson decks and
 * simulator scenarios. Replaces hand-edited .ts content files so supply scales
 * past a single author.
 *
 * The publish step validates the JSON payload against the SAME structural
 * invariants the runtime relies on (mirrors shared/learningCardTypes &
 * data/scenariosV3). A draft can only go live if it would actually render.
 *
 * AI-assisted authoring (the force multiplier) reuses the grounded tutor pattern:
 * the human supplies the war story + answer key; an LLM drafts cards/distractors;
 * the human approves. That flow lives client-side and writes drafts through
 * `upsertDeckDraft` — the human always owns the answer key. See server/tutor.ts.
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { deckDrafts, scenarioDrafts } from "../drizzle/schema";

const DECK_DRAFT_MODEL = process.env.AUTHORING_MODEL || process.env.TUTOR_DEEP_MODEL || "claude-opus-4-8";

// ── Publish-time validators (mirror the runtime types) ───────────────────────

const lessonCardSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["concept", "example", "interaction", "summary"]),
  heading: z.string().min(1),
  body: z.string(),
  takeaway: z.string().optional(),
  visual: z.record(z.string(), z.unknown()).optional(),
  interaction: z
    .object({
      type: z.enum(["reveal", "choice"]),
      prompt: z.string().min(1),
      choices: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
      correctChoiceId: z.string().optional(),
    })
    .optional(),
});

export const deckPublishSchema = z
  .object({
    moduleSlug: z.string().min(1),
    lessonSlug: z.string().min(1),
    title: z.string().min(1),
    whatYoullLearn: z.array(z.string()).min(1),
    estimatedMinutes: z.number().int().positive(),
    previewCardCount: z.number().int().nonnegative(),
    cards: z.array(lessonCardSchema).min(1),
  })
  .superRefine((deck, ctx) => {
    // Every "choice" interaction must declare a correct answer that exists.
    deck.cards.forEach((card, i) => {
      const it = card.interaction;
      if (it?.type === "choice") {
        if (!it.correctChoiceId || !it.choices?.some(c => c.id === it.correctChoiceId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Card ${i} (${card.id}): choice interaction has no valid correctChoiceId`,
          });
        }
      }
    });
    if (deck.previewCardCount > deck.cards.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "previewCardCount exceeds number of cards" });
    }
  });

// ScenarioV3 is large; validate the invariants that determine renderability +
// scoring correctness rather than every field.
export const scenarioPublishSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    plantContext: z.object({ plantName: z.string(), lineName: z.string() }).passthrough(),
    systemStates: z.record(
      z.string(),
      z.object({
        availableActions: z
          .array(z.object({ id: z.string(), isCorrect: z.boolean() }).passthrough())
          .default([]),
      }).passthrough(),
    ),
    faults: z.array(z.object({ id: z.string(), correctFixId: z.string() }).passthrough()).min(1),
    phases: z.array(z.object({ initialStateId: z.string() }).passthrough()).min(1),
  })
  .superRefine((s, ctx) => {
    // Every reachable system state with actions must have exactly one correct action,
    // or the scoring engine has no ground truth to coach against.
    for (const [stateId, state] of Object.entries(s.systemStates) as [string, any][]) {
      const actions: any[] = state.availableActions ?? [];
      if (actions.length > 0) {
        const correct = actions.filter((a: any) => a.isCorrect).length;
        if (correct !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `State "${stateId}" must have exactly one correct action (found ${correct})`,
          });
        }
      }
    }
    // Each fault's correctFixId must reference a real action somewhere.
    const allActionIds = new Set(
      Object.values(s.systemStates as Record<string, any>).flatMap((st: any) =>
        (st.availableActions ?? []).map((a: any) => a.id),
      ),
    );
    for (const f of s.faults) {
      if (!allActionIds.has(f.correctFixId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Fault "${f.id}" correctFixId "${f.correctFixId}" matches no action`,
        });
      }
    }
  });

// ── Router ───────────────────────────────────────────────────────────────────

export const authoringRouter = router({
  // --- AI-assisted authoring (the force multiplier) ---
  // The human supplies the war story + the answer key (takeaways). The LLM only
  // DRAFTS the card prose + plausible distractors. The human always reviews and
  // owns the correct answer before publish — same grounding contract as the tutor.
  aiDraftCards: adminProcedure
    .input(
      z.object({
        moduleSlug: z.string(),
        lessonSlug: z.string(),
        title: z.string(),
        warStory: z.string().min(20).max(4000),
        keyTakeaways: z.array(z.string().min(3)).min(1).max(8),
        cardCount: z.number().int().min(3).max(10).default(5),
      }),
    )
    .mutation(async ({ input }) => {
      const systemPrompt = `You are a master industrial-maintenance instructor authoring a micro-lesson card deck.

Lesson: ${input.title}
Required takeaways (GROUND TRUTH — every one must be covered, never contradicted):
${input.keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Draft ${input.cardCount} cards as JSON. Card kinds: "concept" | "example" | "interaction" | "summary".
- Include at least one "interaction" card: a multiple-choice knowledge check with 3-4 choices,
  exactly one correct, plus feedbackCorrect/feedbackIncorrect.
- Ground every claim in the war story / takeaways. Invent NO part numbers or readings
  not implied by the source. Plain plant-floor language.
Return ONLY JSON: {"cards":[{"id","kind","heading","body","takeaway",
  "interaction"?:{"type":"choice","prompt","choices":[{"id","label"}],"correctChoiceId",
  "feedbackCorrect","feedbackIncorrect"}}]}`;

      try {
        const res = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.warStory },
          ],
          model: DECK_DRAFT_MODEL,
          maxTokens: 2500,
          responseFormat: { type: "json_object" },
        });
        const raw = res.choices[0]?.message?.content;
        const textOut = typeof raw === "string" ? raw : JSON.stringify(raw);
        const parsed = JSON.parse(textOut);
        return { ok: true, cards: parsed.cards ?? [], error: "" };
      } catch (e) {
        return { ok: false, cards: [], error: e instanceof Error ? e.message : "AI drafting failed" };
      }
    }),

  // --- Decks ---
  listDeckDrafts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(deckDrafts).orderBy(deckDrafts.updatedAt);
  }),

  upsertDeckDraft: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        moduleSlug: z.string(),
        lessonSlug: z.string(),
        title: z.string(),
        deck: z.record(z.string(), z.unknown()), // free-form while drafting; validated on publish
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (input.id) {
        await db
          .update(deckDrafts)
          .set({ moduleSlug: input.moduleSlug, lessonSlug: input.lessonSlug, title: input.title, deck: input.deck, status: "draft" })
          .where(eq(deckDrafts.id, input.id));
        return { id: input.id };
      }
      const res = await db.insert(deckDrafts).values({
        moduleSlug: input.moduleSlug,
        lessonSlug: input.lessonSlug,
        title: input.title,
        deck: input.deck,
        authorId: ctx.user.id,
      });
      return { id: Number((res as any).insertId) };
    }),

  publishDeckDraft: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [row] = await db.select().from(deckDrafts).where(eq(deckDrafts.id, input.id));
      if (!row) throw new Error("Draft not found");

      // Gate: must pass the same invariants the runtime depends on.
      const parsed = deckPublishSchema.safeParse(row.deck);
      if (!parsed.success) {
        return { ok: false, errors: parsed.error.issues.map(i => i.message) };
      }
      // Promotion to live: this flips status to 'published'. The deck becomes
      // live on the next build via `pnpm db:export-decks`, which materializes
      // published drafts into shared/lessonDecks/_published.generated.ts (merged
      // over the static bundle in lessonCardContent.ts, keyed by module/lesson).
      await db
        .update(deckDrafts)
        .set({ status: "published", reviewerId: ctx.user.id, publishedAt: new Date() })
        .where(eq(deckDrafts.id, input.id));
      return { ok: true, errors: [] as string[] };
    }),

  // --- Scenarios ---
  listScenarioDrafts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(scenarioDrafts).orderBy(scenarioDrafts.updatedAt);
  }),

  upsertScenarioDraft: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        slug: z.string(),
        title: z.string(),
        category: z.string(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        scenario: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (input.id) {
        await db
          .update(scenarioDrafts)
          .set({ slug: input.slug, title: input.title, category: input.category, difficulty: input.difficulty, scenario: input.scenario, status: "draft" })
          .where(eq(scenarioDrafts.id, input.id));
        return { id: input.id };
      }
      const res = await db.insert(scenarioDrafts).values({
        slug: input.slug,
        title: input.title,
        category: input.category,
        difficulty: input.difficulty,
        scenario: input.scenario,
        authorId: ctx.user.id,
      });
      return { id: Number((res as any).insertId) };
    }),

  publishScenarioDraft: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [row] = await db.select().from(scenarioDrafts).where(eq(scenarioDrafts.id, input.id));
      if (!row) throw new Error("Draft not found");

      const parsed = scenarioPublishSchema.safeParse(row.scenario);
      if (!parsed.success) {
        return { ok: false, errors: parsed.error.issues.map(i => i.message) };
      }
      await db
        .update(scenarioDrafts)
        .set({ status: "published", reviewerId: ctx.user.id, publishedAt: new Date() })
        .where(eq(scenarioDrafts.id, input.id));
      return { ok: true, errors: [] as string[] };
    }),
});
