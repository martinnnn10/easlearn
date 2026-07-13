/**
 * Public API v1 — the integration layer for OEMs, CMMS systems, enterprise HR,
 * and partners. Key-authed (api_keys), scoped, and read-mostly. This is what
 * turns EASLearn from an app into a platform others build on.
 *
 *   GET /api/v1/verify/:code          (scope: verify) — verify a Skills Passport
 *   GET /api/v1/talent?domain=&min=   (scope: talent) — search the competency graph
 *   GET /api/v1/jobs                  (scope: jobs)   — list open roles
 *
 * Registered before the SPA serve. Self-contained; failures return JSON errors,
 * never the SPA HTML.
 */

import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { apiKeys, certificationLevels, users, jobPostings, scenarioCompletions } from "../../drizzle/schema";
import { buildCompetencyProfile } from "../competency";

interface ApiReq extends Request {
  apiScopes?: string[];
  apiOwnerId?: number;
}

function extractKey(req: Request): string | null {
  const auth = req.headers["authorization"];
  if (typeof auth === "string" && auth.startsWith("Bearer ")) return auth.slice(7).trim();
  const x = req.headers["x-api-key"];
  if (typeof x === "string") return x.trim();
  return null;
}

function requireScope(scope: string) {
  return async (req: ApiReq, res: Response, next: NextFunction) => {
    try {
      const key = extractKey(req);
      if (!key) return res.status(401).json({ error: "missing_api_key" });
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "unavailable" });
      const hash = crypto.createHash("sha256").update(key).digest("hex");
      const [row] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, hash)).limit(1);
      if (!row || !row.active) return res.status(401).json({ error: "invalid_api_key" });
      const scopes = row.scopes.split(",");
      if (!scopes.includes(scope)) return res.status(403).json({ error: "insufficient_scope", required: scope });
      req.apiScopes = scopes;
      req.apiOwnerId = row.ownerId;
      // Best-effort last-used stamp.
      db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id)).catch(() => {});
      next();
    } catch {
      res.status(500).json({ error: "internal" });
    }
  };
}

export function registerPublicApi(app: Express) {
  // Verify a Skills Passport by its certification verification code.
  app.get("/api/v1/verify/:code", requireScope("verify"), async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "unavailable" });
      const [cert] = await db
        .select({ userId: certificationLevels.userId })
        .from(certificationLevels)
        .where(eq(certificationLevels.verificationCode, req.params.code))
        .limit(1);
      if (!cert) return res.status(404).json({ error: "not_found" });
      const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, cert.userId)).limit(1);
      const profile = await buildCompetencyProfile(db, cert.userId, u?.name ?? "Verified Technician");
      res.json({
        verified: true,
        name: profile.name,
        overallCompetency: profile.overall.competencyPercent,
        tier: profile.overall.tier,
        domains: profile.domains.filter(d => d.attempts > 0).map(d => ({ domain: d.domain, label: d.label, competency: d.masteryPercent })),
      });
    } catch {
      res.status(500).json({ error: "internal" });
    }
  });

  // Search the verified competency graph.
  app.get("/api/v1/talent", requireScope("talent"), async (req: ApiReq, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "unavailable" });
      const domain = String(req.query.domain ?? "");
      const min = Math.max(0, Math.min(100, Number(req.query.min ?? 60)));
      const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 20)));
      if (!domain) return res.status(400).json({ error: "domain_required" });

      const ids = (await db.selectDistinct({ userId: scenarioCompletions.userId }).from(scenarioCompletions)).slice(0, 500);
      const out: { name: string; competency: number; overall: number; verifyCode: string | null }[] = [];
      for (const { userId } of ids) {
        const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
        const p = await buildCompetencyProfile(db, userId, u?.name ?? "Technician");
        const score = p.domains.find(d => d.domain === domain)?.masteryPercent ?? 0;
        if (score >= min) out.push({ name: p.name, competency: score, overall: p.overall.competencyPercent, verifyCode: p.verificationCode });
      }
      out.sort((a, b) => b.competency - a.competency);
      res.json({ domain, min, results: out.slice(0, limit) });
    } catch {
      res.status(500).json({ error: "internal" });
    }
  });

  // List open roles.
  app.get("/api/v1/jobs", requireScope("jobs"), async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "unavailable" });
      const jobs = await db
        .select({ id: jobPostings.id, title: jobPostings.title, company: jobPostings.company, location: jobPostings.location, remote: jobPostings.remote, requiredDomain: jobPostings.requiredDomain, minCompetency: jobPostings.minCompetency })
        .from(jobPostings)
        .where(eq(jobPostings.status, "open"))
        .orderBy(desc(jobPostings.createdAt))
        .limit(100);
      res.json({ jobs });
    } catch {
      res.status(500).json({ error: "internal" });
    }
  });
}
