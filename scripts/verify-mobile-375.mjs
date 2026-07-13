/**
 * Step 1F — Mobile 375px QA for all card-format lessons (31).
 * Run: pnpm run verify:mobile375
 * Requires dev server: QA_BASE_URL (default http://127.0.0.1:3002)
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LESSON_PRACTICE_MAP } from "../shared/lessonPracticeMap.ts";
import { isCardFormatLesson } from "../shared/lessonCardContent.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3002";
const OUT = path.join(__dirname, "..", "qa-screenshots", "mobile-375");
const VIEWPORT = { width: 375, height: 667 };

const LESSONS = LESSON_PRACTICE_MAP.flatMap((p) =>
  p.units
    .filter((u) => isCardFormatLesson(p.pathSlug, u.lessonSlug))
    .map((u) => ({
      moduleSlug: p.pathSlug,
      lessonSlug: u.lessonSlug,
      route: `/courses/${p.pathSlug}/${u.lessonSlug}?qa=full`,
    }))
);

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

function auditMobileMetrics(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const horizScroll =
      doc.scrollWidth > doc.clientWidth + 2 || body.scrollWidth > body.clientWidth + 2;
    const overflowPx = Math.max(doc.scrollWidth - doc.clientWidth, body.scrollWidth - body.clientWidth);

    const smallFonts = [];
    const smallTargets = [];
    const walk = (el) => {
      if (!(el instanceof HTMLElement)) return;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      const directText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent?.trim() ?? "")
        .join(" ")
        .trim();
      if (directText.length > 8) {
        const fs = parseFloat(style.fontSize);
        if (fs > 0 && fs < 14) {
          smallFonts.push({ tag: el.tagName, fs, text: directText.slice(0, 60) });
        }
      }

      const interactive =
        el.tagName === "BUTTON" ||
        el.tagName === "A" ||
        el.getAttribute("role") === "button" ||
        style.cursor === "pointer";
      if (interactive && rect.width > 0 && rect.height > 0) {
        const tappable = Math.min(rect.width, rect.height);
        if (tappable < 44) {
          smallTargets.push({
            tag: el.tagName,
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40),
          });
        }
      }
      for (const child of el.children) walk(child);
    };
    walk(body);

    return {
      horizScroll,
      overflowPx,
      smallFonts: smallFonts.slice(0, 8),
      smallTargets: smallTargets.slice(0, 10),
      hasCardPlayer: Boolean(document.querySelector(".lesson-card-player")),
    };
  });
}

async function verifyLesson(page, lesson) {
  const key = `${lesson.moduleSlug}/${lesson.lessonSlug}`;
  const checks = [];

  try {
    await page.goto(`${BASE}${lesson.route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await dismissCookies(page);
    await page.waitForSelector(".lesson-card-player", { timeout: 45000 });
    await page.waitForTimeout(800);

    const metrics = await auditMobileMetrics(page);
    checks.push({ check: `${key} loads card player`, pass: metrics.hasCardPlayer });
    checks.push({ check: `${key} no horizontal overflow`, pass: !metrics.horizScroll, detail: metrics.horizScroll ? `+${metrics.overflowPx}px` : undefined });

    const cardStageFonts = await page.locator(".lesson-card-stage *").evaluateAll((els) => {
      const bad = [];
      for (const el of els) {
        if (!(el instanceof HTMLElement)) continue;
        const style = getComputedStyle(el);
        if (style.display === "none") continue;
        const text = (el.textContent || "").trim();
        if (text.length < 12) continue;
        const fs = parseFloat(style.fontSize);
        if (fs > 0 && fs < 14 && !["SPAN", "LABEL"].includes(el.tagName)) {
          bad.push({ tag: el.tagName, fs, text: text.slice(0, 50) });
        }
      }
      return bad.slice(0, 5);
    });
    checks.push({
      check: `${key} card text >= 14px`,
      pass: cardStageFonts.length <= 2,
      detail: cardStageFonts.length > 2 ? `${cardStageFonts.length} small nodes` : undefined,
    });

    const navTargets = await page.locator(".lesson-card-player button").evaluateAll((btns) =>
      btns.map((b) => {
        const r = b.getBoundingClientRect();
        return { text: (b.textContent || "").trim().slice(0, 20), min: Math.min(r.width, r.height) };
      })
    );
    const smallNav = navTargets.filter((t) => t.min > 0 && t.min < 44);
    checks.push({
      check: `${key} nav tap targets >= 44px`,
      pass: smallNav.length === 0,
      detail: smallNav.length ? JSON.stringify(smallNav.slice(0, 3)) : undefined,
    });

    const slug = `${lesson.moduleSlug}-${lesson.lessonSlug}`.replace(/[^a-z0-9-]/gi, "-");
    await page.screenshot({ path: path.join(OUT, `${slug}.png`), fullPage: false });
  } catch (err) {
    checks.push({ check: key, pass: false, detail: err.message });
  }

  return checks;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`Mobile 375px QA — ${LESSONS.length} card lessons at ${BASE}\n`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();

  const results = [];
  for (const lesson of LESSONS) {
    results.push(...(await verifyLesson(page, lesson)));
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    viewport: VIEWPORT,
    base: BASE,
    lessonCount: LESSONS.length,
    results,
    passed: results.filter((r) => r.pass).length,
    total: results.length,
  };
  await writeFile(path.join(OUT, "mobile-375-qa.json"), JSON.stringify(report, null, 2));

  console.log("\n=== MOBILE 375px CARD LESSONS ===\n");
  for (const r of results.filter((x) => !x.pass)) {
    console.log(`FAIL ${r.check}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed (${LESSONS.length} lessons)\n`);
  process.exit(report.passed === report.total ? 0 : 1);
}

main();
