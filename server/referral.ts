/**
 * Referral router — invite-a-friend viral loop.
 *
 *   referral.myCode   — get (or lazily create) the caller's code + invite stats
 *   referral.attribute — a freshly-registered user claims the code that referred them
 *
 * Attribution is idempotent (referredUserId is unique) and guards against
 * self-referral. Reward policy lives in the client/milestones; this layer just
 * records the truth.
 */

import { z } from "zod";
import { eq, and, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users, referrals } from "../drizzle/schema";

async function ensureCode(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, existing: string | null) {
  if (existing) return existing;
  const code = nanoid(8);
  await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
  return code;
}

export const referralRouter = router({
  myCode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const code = await ensureCode(db, ctx.user.id, ctx.user.referralCode ?? null);
    const invited = await db
      .select({ id: referrals.id, status: referrals.status })
      .from(referrals)
      .where(eq(referrals.referrerId, ctx.user.id));
    return {
      code,
      total: invited.length,
      qualified: invited.filter(r => r.status === "qualified").length,
    };
  }),

  // Called once by a new user (post-registration) with the code that referred them.
  attribute: protectedProcedure
    .input(z.object({ code: z.string().min(4).max(32) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false, reason: "no_db" };

      // Already attributed? (unique on referredUserId)
      const [already] = await db
        .select({ id: referrals.id })
        .from(referrals)
        .where(eq(referrals.referredUserId, ctx.user.id))
        .limit(1);
      if (already) return { ok: false, reason: "already_attributed" };

      // Resolve referrer by code; cannot self-refer.
      const [referrer] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.referralCode, input.code), ne(users.id, ctx.user.id)))
        .limit(1);
      if (!referrer) return { ok: false, reason: "invalid_code" };

      await db.insert(referrals).values({
        referrerId: referrer.id,
        referredUserId: ctx.user.id,
        code: input.code,
        status: "qualified", // signup completed = qualified; tighten later if needed
      });
      return { ok: true };
    }),
});
