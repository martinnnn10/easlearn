/**
 * Rate limiter — sliding-window logic + fallback behavior. No DB required: the
 * store is injectable, and checkRate's fallback path is exercised with a store
 * that throws (must FAIL-OPEN — never crash a lesson).
 */
import { describe, it, expect } from "vitest";
import { MemoryRateStore, allowRequest, checkRate, RATE_LIMIT_MESSAGE, type RateStore } from "./rateLimit";

const MIN = 60_000;

describe("rate limiter — sliding window", () => {
  it("allows normal usage under the limit", async () => {
    const store = new MemoryRateStore();
    for (let i = 0; i < 10; i++) {
      expect(await allowRequest(store, 1, "mentor.coach", 30, MIN)).toBe(true);
    }
  });

  it("blocks excessive usage over the limit", async () => {
    const store = new MemoryRateStore();
    for (let i = 0; i < 30; i++) await allowRequest(store, 1, "mentor.coach", 30, MIN);
    expect(await allowRequest(store, 1, "mentor.coach", 30, MIN)).toBe(false);
  });

  it("the window slides — old hits expire", async () => {
    const store = new MemoryRateStore();
    const t0 = Date.now();
    for (let i = 0; i < 30; i++) await allowRequest(store, 1, "mentor.coach", 30, MIN, t0);
    expect(await allowRequest(store, 1, "mentor.coach", 30, MIN, t0)).toBe(false);
    // 61s later the window has moved past the burst.
    expect(await allowRequest(store, 1, "mentor.coach", 30, MIN, t0 + 61_000)).toBe(true);
  });

  it("buckets are independent (coach vs operator) and per-user", async () => {
    const store = new MemoryRateStore();
    for (let i = 0; i < 30; i++) await allowRequest(store, 1, "mentor.coach", 30, MIN);
    expect(await allowRequest(store, 1, "mentor.coach", 30, MIN)).toBe(false);
    expect(await allowRequest(store, 1, "mentor.operator", 30, MIN)).toBe(true); // other bucket
    expect(await allowRequest(store, 2, "mentor.coach", 30, MIN)).toBe(true); // other user
  });

  it("checkRate FAILS OPEN when the store errors (never crashes a lesson)", async () => {
    const broken = {
      // A "db" whose queries throw — dbRateStore calls will reject.
      select() { throw new Error("db down"); },
      insert() { throw new Error("db down"); },
      delete() { throw new Error("db down"); },
    } as never;
    // Falls back to the shared memory store, and ultimately allows.
    expect(await checkRate(broken, 999, "mentor.coach")).toBe(true);
  });

  it("checkRate uses the in-memory fallback when db is null (local/dev)", async () => {
    // Unique user id so the shared fallback store is clean for this test.
    const uid = 123456;
    for (let i = 0; i < 30; i++) expect(await checkRate(null, uid, "mentor.operator")).toBe(true);
    expect(await checkRate(null, uid, "mentor.operator")).toBe(false);
  });

  it("exposes the learner-facing copy", () => {
    expect(RATE_LIMIT_MESSAGE).toBe("Slow down a bit — the mentor will be ready again shortly.");
  });

  it("a custom store honors the interface (injectability)", async () => {
    let recorded = 0;
    const store: RateStore = {
      async countSince() { return 0; },
      async record() { recorded++; },
    };
    expect(await allowRequest(store, 1, "mentor.coach", 30, MIN)).toBe(true);
    expect(recorded).toBe(1);
  });
});
