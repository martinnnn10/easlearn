/**
 * Fault of the Day — the viral daily loop.
 *
 * One free industrial troubleshooting challenge per day. Everyone in the world
 * gets the SAME fault (deterministic by UTC date), solves it in the existing
 * simulator, and gets a shareable Wordle-style score card. Daily + shared +
 * zero-login-to-play is the most proven organic-growth mechanic there is, and
 * here it teaches a real, employable skill instead of guessing a word.
 *
 * Pure + deterministic so client and server always agree on "today's fault".
 */

import { SIMULATOR_CATALOG, type SimulatorCatalogEntry } from "./simulatorCatalog";

/** UTC date key, e.g. "2026-06-30" — the seed everyone shares. */
export function getDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Start of the UTC day for a given date key (for "solved today" queries). */
export function startOfUtcDay(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

/** Eligible pool: production, immersive (v3) scenarios that are clickable. */
export function getDailyPool(): SimulatorCatalogEntry[] {
  return SIMULATOR_CATALOG.filter(
    e => e.status === "production" && e.engine === "v3" && e.clickable,
  );
}

/** Deterministic hash of a string → unsigned 32-bit int. */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Today's challenge — same for everyone on a given UTC date. */
export function pickDailyChallenge(dateKey: string = getDateKey()): SimulatorCatalogEntry | null {
  const pool = getDailyPool();
  if (pool.length === 0) return null;
  // Sort for stability regardless of catalog ordering, then index by date hash.
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[hashStr(dateKey) % sorted.length];
}

/** Wordle-style shareable result card text. */
export function buildShareText(opts: {
  dateKey: string;
  methodologyPercent: number;
  percentile: number | null;
  tier: string;
}): string {
  const blocks = (pct: number) => {
    const filled = Math.round((pct / 100) * 5);
    return "🟩".repeat(filled) + "⬜".repeat(5 - filled);
  };
  const rank = opts.percentile != null ? ` · top ${100 - opts.percentile}%` : "";
  return [
    `⚡ Fault of the Day ${opts.dateKey}`,
    `${blocks(opts.methodologyPercent)} ${opts.methodologyPercent}%${rank}`,
    `Diagnosed like a ${opts.tier}.`,
    `Can you fix it? easlearn.org/daily`,
  ].join("\n");
}
