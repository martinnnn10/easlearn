/**
 * Open Graph routes — make shared links actually spread.
 *
 * Two safe, additive pieces (no change to the SPA serve path):
 *   1. /og/daily.svg and /og/skills/:code.svg — branded share-card images.
 *   2. Crawler-only meta injection for /daily and /verify/skills/:code — when a
 *      social scraper (LinkedIn, X, Slack, Facebook, iMessage) fetches the page,
 *      it gets rich OG/Twitter tags; real browsers fall straight through to the
 *      SPA via next(). This is the standard prerender-for-bots pattern, not cloaking.
 *
 * SVG note: title/description unfurl everywhere; SVG og:image renders in most
 * modern scrapers. A PNG renderer (satori/resvg) is the future upgrade for
 * pixel-perfect cards on every platform.
 */

import type { Express, Request, Response, NextFunction } from "express";
import { getDb } from "../db";
import { eq, and, gte } from "drizzle-orm";
import { scenarioCompletions, certificationLevels, users } from "../../drizzle/schema";
import { pickDailyChallenge, getDateKey, startOfUtcDay } from "@shared/dailyChallenge";

const BOT_UA =
  /(facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Googlebot|bingbot|redditbot|Pinterest|vkShare|embedly|quora link preview|outbrain|Applebot|iframely)/i;

function esc(s: string): string {
  return s.replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function baseUrl(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string)?.split(",")[0] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

/** Branded SVG share card. */
function renderCardSvg(opts: { kicker: string; big: string; sub: string; foot: string }): string {
  const blocks = Array.from({ length: 5 }, (_, i) => {
    const pct = parseInt(opts.big) || 0;
    const filled = Math.round((pct / 100) * 5);
    const fill = i < filled ? "#10b981" : "#1f2937";
    return `<rect x="${72 + i * 80}" y="470" width="64" height="64" rx="12" fill="${fill}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#0a0f0a"/><stop offset="1" stop-color="#0d160d"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="8" fill="#10b981"/>
  <text x="72" y="110" font-family="Arial" font-size="30" font-weight="bold" fill="#10b981">${esc(opts.kicker)}</text>
  <text x="72" y="300" font-family="Arial" font-size="150" font-weight="bold" fill="#ffffff">${esc(opts.big)}</text>
  <text x="72" y="380" font-family="Arial" font-size="40" font-weight="bold" fill="#a7f3d0">${esc(opts.sub)}</text>
  ${blocks}
  <text x="1128" y="600" text-anchor="end" font-family="Arial" font-size="30" font-weight="bold" fill="#10b981">${esc(opts.foot)}</text>
</svg>`;
}

function sendMetaHtml(res: Response, m: { url: string; title: string; desc: string; image: string }) {
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.send(`<!doctype html><html><head>
<meta charset="utf-8"/>
<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.desc)}"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${esc(m.url)}"/>
<meta property="og:title" content="${esc(m.title)}"/>
<meta property="og:description" content="${esc(m.desc)}"/>
<meta property="og:image" content="${esc(m.image)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(m.title)}"/>
<meta name="twitter:description" content="${esc(m.desc)}"/>
<meta name="twitter:image" content="${esc(m.image)}"/>
</head><body><a href="${esc(m.url)}">EASLearn</a></body></html>`);
}

export function registerOgRoutes(app: Express) {
  // --- Image endpoints ---
  app.get("/og/daily.svg", async (_req, res) => {
    try {
      const challenge = pickDailyChallenge(getDateKey());
      res.setHeader("content-type", "image/svg+xml");
      res.setHeader("cache-control", "public, max-age=3600");
      res.send(
        renderCardSvg({
          kicker: "⚡ FAULT OF THE DAY",
          big: getDateKey(),
          sub: challenge?.title ?? "Industrial Troubleshooting",
          foot: "easlearn.org/daily",
        }),
      );
    } catch {
      res.status(500).end();
    }
  });

  app.get("/og/skills/:code.svg", async (req, res) => {
    try {
      res.setHeader("content-type", "image/svg+xml");
      res.setHeader("cache-control", "public, max-age=3600");
      res.send(
        renderCardSvg({
          kicker: "VERIFIED COMPETENCY",
          big: "EAS",
          sub: "Industrial Troubleshooting",
          foot: "easlearn.org",
        }),
      );
    } catch {
      res.status(500).end();
    }
  });

  // --- Crawler-only meta injection (real users fall through to the SPA) ---
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ua = (req.headers["user-agent"] as string) || "";
      if (!BOT_UA.test(ua)) return next();
      const url = `${baseUrl(req)}${req.path}`;

      if (req.path === "/daily") {
        const challenge = pickDailyChallenge(getDateKey());
        let solvers = 0;
        const db = await getDb();
        if (db && challenge) {
          const rows = await db
            .select({ id: scenarioCompletions.id })
            .from(scenarioCompletions)
            .where(
              and(
                eq(scenarioCompletions.scenarioSlug, challenge.id),
                gte(scenarioCompletions.completedAt, startOfUtcDay(getDateKey())),
              ),
            );
          solvers = rows.length;
        }
        return sendMetaHtml(res, {
          url,
          title: `Fault of the Day — ${challenge?.title ?? "Industrial Troubleshooting"}`,
          desc: `A real machine is down. ${solvers} people have diagnosed today's fault. Can you fix it? Free daily challenge.`,
          image: `${baseUrl(req)}/og/daily.svg`,
        });
      }

      const skillsMatch = req.path.match(/^\/verify\/skills\/([A-Za-z0-9_-]+)$/);
      if (skillsMatch) {
        const code = skillsMatch[1];
        let name = "A verified technician";
        const db = await getDb();
        if (db) {
          const [cert] = await db
            .select({ userId: certificationLevels.userId })
            .from(certificationLevels)
            .where(eq(certificationLevels.verificationCode, code))
            .limit(1);
          if (cert) {
            const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, cert.userId)).limit(1);
            if (u?.name) name = u.name;
          }
        }
        return sendMetaHtml(res, {
          url,
          title: `${name} — Verified Industrial Competency`,
          desc: `Measured troubleshooting competency, verified by EASLearn. View the full Skills Passport.`,
          image: `${baseUrl(req)}/og/skills/${encodeURIComponent(code)}.svg`,
        });
      }

      return next();
    } catch {
      return next();
    }
  });
}
