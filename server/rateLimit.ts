/**
 * Rate limiting for AI endpoints (mentor.coach, mentor.operator).
 *
 * Production: DB-backed sliding window in `rate_limit_events`, shared across app
 * instances — protects against rapid repeated submits, cost spikes, role-play
 * abuse, and runaway LLM usage.
 * Local/dev fallback: in-memory per-instance window when the DB is unavailable.
 * Failure policy: FAIL-OPEN — a broken rate-limit store must never crash a lesson;
 * the request is allowed and the error swallowed. (Cost protection degrades, the
 * learner experience does not.)
 */
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { rateLimitEvents } from "../drizzle/schema";
import type { getDb } from "./db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Store interface so the sliding-window logic is unit-testable without a DB. */
export interface RateStore {
  countSince(userId: number, bucket: string, since: Date): Promise<number>;
  record(userId: number, bucket: string, at: Date): Promise<void>;
}

/** In-memory store — the local/dev fallback (per-instance only). */
export class MemoryRateStore implements RateStore {
  private hits = new Map<string, number[]>();
  async countSince(userId: number, bucket: string, since: Date): Promise<number> {
    const key = `${userId}:${bucket}`;
    const arr = (this.hits.get(key) ?? []).filter((t) => t >= since.getTime());
    this.hits.set(key, arr);
    return arr.length;
  }
  async record(userId: number, bucket: string, at: Date): Promise<void> {
    const key = `${userId}:${bucket}`;
    const arr = this.hits.get(key) ?? [];
    arr.push(at.getTime());
    this.hits.set(key, arr);
  }
}

/** DB-backed store — the shared, distributed window. */
export function dbRateStore(db: Db): RateStore {
  return {
    async countSince(userId, bucket, since) {
      const [row] = await db
        .select({ n: sql<number>`count(*)` })
        .from(rateLimitEvents)
        .where(and(eq(rateLimitEvents.userId, userId), eq(rateLimitEvents.bucket, bucket), gte(rateLimitEvents.createdAt, since)));
      return Number(row?.n ?? 0);
    },
    async record(userId, bucket, at) {
      await db.insert(rateLimitEvents).values({ userId, bucket, createdAt: at });
      // Opportunistic pruning (~5% of writes): drop rows older than an hour.
      if (Math.random() < 0.05) {
        await db.delete(rateLimitEvents).where(lt(rateLimitEvents.createdAt, new Date(at.getTime() - 60 * 60 * 1000)));
      }
    },
  };
}

/** Pure sliding-window check against any store. Allows and records, or denies. */
export async function allowRequest(
  store: RateStore,
  userId: number,
  bucket: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): Promise<boolean> {
  const since = new Date(now - windowMs);
  const n = await store.countSince(userId, bucket, since);
  if (n >= limit) return false;
  await store.record(userId, bucket, new Date(now));
  return true;
}

const memoryFallback = new MemoryRateStore();

export const RATE_LIMIT_MESSAGE = "Slow down a bit — the mentor will be ready again shortly.";

/**
 * The production entry point: DB-backed when available, in-memory fallback
 * otherwise, FAIL-OPEN on store errors.
 */
export async function checkRate(
  db: Db | null | undefined,
  userId: number,
  bucket: "mentor.coach" | "mentor.operator",
  limit = 30,
  windowMs = 60_000,
): Promise<boolean> {
  try {
    const store = db ? dbRateStore(db) : memoryFallback;
    return await allowRequest(store, userId, bucket, limit, windowMs);
  } catch {
    // Fail-open: never let rate limiting break a lesson. Try the memory fallback
    // so at least per-instance protection remains; if even that fails, allow.
    try {
      return await allowRequest(memoryFallback, userId, bucket, limit, windowMs);
    } catch {
      return true;
    }
  }
}
