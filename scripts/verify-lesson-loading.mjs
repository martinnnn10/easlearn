/**
 * Lesson loading audit — all routes from LESSON_PRACTICE_MAP.
 * Run: pnpm exec tsx scripts/verify-lesson-loading.mjs
 * Env: QA_BASE_URL (default http://127.0.0.1:3000)
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LESSON_PRACTICE_MAP } from "../shared/lessonPracticeMap.ts";
import { courseLessonRoute } from "../shared/hubRegistry.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const OUT = path.join(__dirname, "..", "qa-screenshots", "lesson-loading-audit");

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 375, height: 812 },
];

const LESSONS = LESSON_PRACTICE_MAP.flatMap((p) =>
  p.units.map((u) => ({
    pathSlug: p.pathSlug,
    pathTitle: p.pathTitle,
    lessonSlug: u.lessonSlug,
    lessonTitle: u.lessonTitle,
    route: courseLessonRoute(p.pathSlug, u.lessonSlug),
    cardFormat: u.lessonFormat === "cards",
  }))
);

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 2000 }).catch(() => {});
}

function isBenignConsoleError(text) {
  const t = text.toLowerCase();
  return (
    t.includes("favicon") ||
    t.includes("umami") ||
    t.includes("analytics") ||
    t.includes("content security policy") ||
    t.includes("refused to load the font") ||
    t.includes("trpcclienterror") ||
    t.includes("unable to transform response") ||
    t.includes("api query error") ||
    (t.includes("failed to load resource") && (t.includes("429") || t.includes("500")))
  );
}

async function auditLesson(page, lesson, viewport) {
  const issues = [];
  const consoleErrors = [];

  const onConsole = (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!isBenignConsoleError(text)) consoleErrors.push(text);
    }
  };
  page.on("console", onConsole);

  const url = `${BASE}${lesson.route}?qa=full`;
  let httpStatus = 0;
  try {
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    httpStatus = resp?.status() ?? 0;
  } catch (err) {
    page.off("console", onConsole);
    return {
      lesson,
      viewport: viewport.name,
      pass: false,
      httpStatus,
      issues: [{ check: "navigation", detail: err.message }],
      consoleErrors,
    };
  }

  await dismissCookies(page);
  await page
    .waitForSelector("h1, .lesson-card-player, text=Lesson not found", { timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(600);

  const metrics = await page.evaluate(() => {
    const bodyText = (document.body?.innerText || "").trim();
    const notFound =
      /lesson not found/i.test(bodyText) ||
      /module not found/i.test(bodyText) ||
      bodyText === "";
    const h1 = document.querySelector("h1");
    const cardPlayer = document.querySelector(".lesson-card-player");
    const preview = /preview \d+ of \d+/i.test(bodyText);
    const markdown = document.querySelector(".lesson-content, .prose, [class*='streamdown']");
    const brokenImages = Array.from(document.querySelectorAll("img")).filter((img) => {
      const el = img;
      return el.complete && el.naturalWidth === 0 && Boolean(el.src) && !el.src.startsWith("data:");
    });
    const hasContent = Boolean(cardPlayer || h1 || markdown || preview || bodyText.length > 120);

    return {
      notFound,
      hasContent,
      title: document.title,
      h1: h1?.textContent?.trim() || "",
      cardPlayer: Boolean(cardPlayer),
      preview,
      bodyLen: bodyText.length,
      brokenImages: brokenImages.map((img) => img.src).slice(0, 5),
    };
  });

  page.off("console", onConsole);

  if (httpStatus >= 400) {
    issues.push({ check: "http-status", detail: String(httpStatus) });
  }
  if (metrics.notFound) {
    issues.push({ check: "not-found-copy", detail: "Page shows not-found or empty body" });
  }
  if (!metrics.hasContent) {
    issues.push({ check: "missing-content", detail: `bodyLen=${metrics.bodyLen}` });
  }
  if (lesson.cardFormat && !metrics.cardPlayer && !metrics.preview) {
    issues.push({ check: "card-player-missing", detail: "Expected .lesson-card-player or preview" });
  }
  if (metrics.brokenImages.length > 0) {
    issues.push({ check: "broken-images", detail: metrics.brokenImages.join(", ") });
  }
  if (consoleErrors.length > 0) {
    issues.push({ check: "console-errors", detail: consoleErrors.slice(0, 3).join(" | ") });
  }

  const slug = lesson.route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  await page.screenshot({
    path: path.join(OUT, `${viewport.name}-${slug}.png`),
    fullPage: false,
  }).catch(() => {});

  return {
    lesson,
    viewport: viewport.name,
    pass: issues.length === 0,
    httpStatus,
    metrics,
    issues,
    consoleErrors,
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const probe = await fetch(`${BASE}/`).catch(() => null);
  if (!probe?.ok) {
    console.error(`\nFAIL: Server not reachable at ${BASE} (status ${probe?.status ?? "n/a"})\n`);
    process.exit(2);
  }

  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  for (const viewport of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.width < 500,
      hasTouch: viewport.width < 500,
    });
    const page = await ctx.newPage();

    for (const lesson of LESSONS) {
      try {
        allResults.push(await auditLesson(page, lesson, viewport));
      } catch (err) {
        allResults.push({
          lesson,
          viewport: viewport.name,
          pass: false,
          issues: [{ check: "unexpected", detail: err.message }],
        });
      }
      await page.waitForTimeout(400);
    }
    await ctx.close();
  }

  await browser.close();

  const failing = allResults.filter((r) => !r.pass);
  const passCount = allResults.filter((r) => r.pass).length;
  const uniqueLessons = LESSONS.length;

  const report = {
    timestamp: new Date().toISOString(),
    base: BASE,
    lessonsInMap: uniqueLessons,
    viewportRuns: allResults.length,
    passed: passCount,
    failed: failing.length,
    results: allResults,
  };

  await writeFile(path.join(OUT, "lesson-loading-audit.json"), JSON.stringify(report, null, 2));

  console.log("\n=== LESSON LOADING AUDIT ===\n");
  console.log(`Base URL: ${BASE}`);
  console.log(`Lessons in map: ${uniqueLessons}`);
  console.log(`Viewport runs: ${allResults.length} (${VIEWPORTS.map((v) => v.name).join(" + ")})`);
  console.log(`Passed: ${passCount}/${allResults.length}\n`);

  for (const r of failing) {
    console.log(
      `FAIL [${r.viewport}] ${r.lesson.route} — ${r.lesson.lessonTitle}`
    );
    for (const i of r.issues || []) {
      console.log(`  - ${i.check}: ${i.detail}`);
    }
  }

  const lessonPassByRoute = new Map();
  for (const lesson of LESSONS) {
    const runs = allResults.filter((r) => r.lesson.route === lesson.route);
    lessonPassByRoute.set(lesson.route, runs.every((r) => r.pass));
  }
  const lessonsPassing = [...lessonPassByRoute.values()].filter(Boolean).length;
  console.log(`\nLessons passing both viewports: ${lessonsPassing}/${uniqueLessons}\n`);

  process.exit(failing.length === 0 ? 0 : 1);
}

main();
