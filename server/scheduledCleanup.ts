/**
 * Scheduled cleanup handler for stale data.
 * Called by Heartbeat cron at /api/scheduled/cleanup-sessions.
 * Purges:
 *   - simulator_sessions older than 7 days
 *   - client_errors older than 30 days
 */
import type { Request, Response } from "express";
import { getDb } from "./db";
import { simulatorSessions, clientErrors } from "../drizzle/schema";
import { lt } from "drizzle-orm";
import { sdk } from "./_core/sdk";

const STALE_SESSION_DAYS = 7;
const STALE_ERROR_DAYS = 30;

export async function handleCleanupSessions(req: Request, res: Response) {
  try {
    // Authenticate the cron request
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        error: "Database not available",
        timestamp: new Date().toISOString(),
      });
    }

    // 1. Purge stale simulator sessions (older than 7 days)
    const sessionCutoff = new Date(Date.now() - STALE_SESSION_DAYS * 24 * 60 * 60 * 1000);
    const sessionResult = await db
      .delete(simulatorSessions)
      .where(lt(simulatorSessions.updatedAt, sessionCutoff));
    const deletedSessions = (sessionResult as any)?.[0]?.affectedRows ?? 0;

    // 2. Purge old client errors (older than 30 days)
    const errorCutoff = new Date(Date.now() - STALE_ERROR_DAYS * 24 * 60 * 60 * 1000);
    const errorResult = await db
      .delete(clientErrors)
      .where(lt(clientErrors.createdAt, errorCutoff));
    const deletedErrors = (errorResult as any)?.[0]?.affectedRows ?? 0;

    console.log(
      `[Cleanup] Purged ${deletedSessions} stale sessions (>${STALE_SESSION_DAYS}d) and ${deletedErrors} old errors (>${STALE_ERROR_DAYS}d)`
    );

    return res.json({
      ok: true,
      sessions: {
        deletedCount: deletedSessions,
        cutoffDate: sessionCutoff.toISOString(),
      },
      errors: {
        deletedCount: deletedErrors,
        cutoffDate: errorCutoff.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cleanup] Cleanup error:", error);
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url, taskUid: (req as any).taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
