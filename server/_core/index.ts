import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { rateLimit } from "express-rate-limit";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerOgRoutes } from "./ogRoutes";
import { registerPublicApi } from "./publicApi";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const server = createServer(app);

  // Stripe webhook needs raw body BEFORE json parser
  const { handleStripeWebhook } = await import("../stripe/webhook");
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Rate limiting — protect API endpoints from abuse/scraping
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
  });

  const strictLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit to 10 requests per minute for sensitive endpoints
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Rate limit exceeded. Please slow down." },
  });

  // Apply strict rate limit to contact form and assessment submission
  app.use("/api/trpc/contact.submit", strictLimiter);
  app.use("/api/trpc/assessments.submitResult", strictLimiter);
  app.use("/api/trpc/scenarios.generate", strictLimiter);

  // Apply general rate limit to all API routes
  app.use("/api/trpc", apiLimiter);

  // Sitemap for SEO
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { tutorials } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      const baseUrl = "https://easlearn.org";
      
      let tutorialUrls = "";
      if (db) {
        const allTutorials = await db
          .select({ slug: tutorials.slug, updatedAt: tutorials.updatedAt })
          .from(tutorials)
          .where(eq(tutorials.isPublished, true));
        
        tutorialUrls = allTutorials.map(t => `
  <url>
    <loc>${baseUrl}/tutorials/${t.slug}</loc>
    <lastmod>${t.updatedAt ? new Date(t.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join("");
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/courses</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/tutorials</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/simulator</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/pricing</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/resources</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/certifications</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/videos</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>${tutorialUrls}
</urlset>`;

      res.set("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (err) {
      console.error("Sitemap generation error:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    const baseUrl = "https://easlearn.org";
    res.set("Content-Type", "text/plain");
    res.send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /team\n\nSitemap: ${baseUrl}/sitemap.xml`);
  });

  // Weekly digest cron endpoint (secured with API key)
  app.post("/api/cron/weekly-digest", async (req, res) => {
    try {
      // Simple auth: check for a shared secret in the Authorization header
      const authHeader = req.headers.authorization;
      const expectedKey = process.env.BUILT_IN_FORGE_API_KEY;
      if (!expectedKey || !authHeader || authHeader !== `Bearer ${expectedKey}`) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { sendWeeklyDigest } = await import("../weeklyDigest");
      const result = await sendWeeklyDigest();
      return res.json(result);
    } catch (error) {
      console.error("[Cron] Weekly digest error:", error);
      return res.status(500).json({ error: "Failed to generate digest" });
    }
  });

  // ─── Security Headers ───────────────────────────────────────────────
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // XSS protection (legacy but still useful for older browsers)
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Referrer policy — send origin only on cross-origin requests
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Permissions policy — disable unused browser features
    res.setHeader("Permissions-Policy", "camera=(), microphone=(self), geolocation=(), payment=(self)");
    // Basic CSP — allow same-origin, Google Fonts, analytics, Stripe
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.umami.is https://manus-analytics.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https: http:",
        "connect-src 'self' https://api.stripe.com https://*.umami.is https://*.manus.space https://manus-analytics.com wss:",
        "frame-src 'self' https://js.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://checkout.stripe.com",
        "upgrade-insecure-requests",
      ].join("; ")
    );
    // HSTS — only in production
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  // Scheduled cleanup handler (Heartbeat cron)
  const { handleCleanupSessions } = await import("../scheduledCleanup");
  app.post("/api/scheduled/cleanup-sessions", handleCleanupSessions);

  // Onboarding drip email handler (Heartbeat cron — daily 10:00 UTC)
  const { handleOnboardingDrip } = await import("../onboardingDrip");
  app.post("/api/scheduled/onboarding-drip", handleOnboardingDrip);

  // Simulator session save via sendBeacon (for beforeunload flush)
  app.post("/api/simulator-session/save", async (req, res) => {
    try {
      const { sdk } = await import("./sdk");
      const authenticateRequest = sdk.authenticateRequest.bind(sdk);
      const user = await authenticateRequest(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { scenarioId, playMode, difficulty, phase, gameState, currentScore, actionCount, elapsedSeconds } = req.body;
      if (!scenarioId || !phase) return res.status(400).json({ error: "Missing required fields" });

      const { getDb } = await import("../db");
      const { simulatorSessions } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const existing = await db.select({ id: simulatorSessions.id })
        .from(simulatorSessions)
        .where(and(eq(simulatorSessions.userId, user.id), eq(simulatorSessions.scenarioId, scenarioId)))
        .limit(1);

      if (existing.length > 0) {
        await db.update(simulatorSessions).set({
          playMode: playMode || "standard",
          difficulty: difficulty || "standard",
          phase,
          gameState,
          currentScore: currentScore || 0,
          actionCount: actionCount || 0,
          elapsedSeconds: elapsedSeconds || 0,
        }).where(eq(simulatorSessions.id, existing[0].id));
      } else {
        await db.insert(simulatorSessions).values({
          userId: user.id,
          scenarioId,
          playMode: playMode || "standard",
          difficulty: difficulty || "standard",
          phase,
          gameState,
          currentScore: currentScore || 0,
          actionCount: actionCount || 0,
          elapsedSeconds: elapsedSeconds || 0,
        });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("[SimSession] Save via beacon failed:", error);
      return res.status(500).json({ error: "Save failed" });
    }
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Public API v1 (key-authed) — must precede the /api/* 404 catch-all.
  registerPublicApi(app);

  // Catch-all for unknown /api/ routes — return proper 404 instead of SPA HTML
  app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "Not Found", message: "This API endpoint does not exist." });
  });

  // OG share-card images + crawler-only meta injection (real users fall through).
  // Registered before the SPA serve so link unfurls work without touching it.
  registerOgRoutes(app);

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");

  // In production, use the exact port provided (deployment platform expects it)
  // In development, find an available port if the preferred one is busy
  let port = preferredPort;
  if (process.env.NODE_ENV === "development") {
    port = await findAvailablePort(preferredPort);
    if (port !== preferredPort) {
      console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/ (NODE_ENV=${process.env.NODE_ENV || 'undefined'})`);
  });
}

startServer().catch(console.error);
