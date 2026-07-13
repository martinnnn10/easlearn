import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Subscriber procedure — requires an active subscription or active trial.
 * Admins always pass. Free users with no trial are blocked.
 */
const requireSubscriber = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Admins always have access
  if (ctx.user.role === "admin") {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  const status = ctx.user.subscriptionStatus || "none";
  const tier = ctx.user.subscriptionTier || "free";

  // Active subscription
  if (status === "active" && tier !== "free") {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  // Active trial — check if trial hasn't expired
  if (status === "trialing" && ctx.user.trialEndsAt) {
    const now = new Date();
    if (now < new Date(ctx.user.trialEndsAt)) {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }
  }

  // Past due — still allow access (Stripe will handle retries)
  if (status === "past_due") {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "SUBSCRIPTION_REQUIRED",
  });
});

export const subscriberProcedure = t.procedure.use(requireSubscriber);
