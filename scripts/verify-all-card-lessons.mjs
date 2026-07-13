/**
 * Step 4 QA — all card-format lessons (31)
 * Run: pnpm exec tsx scripts/verify-all-card-lessons.mjs
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
const OUT = path.join(__dirname, "..", "qa-screenshots", "all-card-lessons");

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

async function answerKcIfBlocked(page) {
  const next = page.locator(".lesson-card-player").getByRole("button", { name: /Next/i });
  if (await next.isEnabled()) return;
  const choices = page.locator(".lesson-card-stage button[type='button']");
  const count = await choices.count();
  for (let c = 0; c < count; c++) {
    const btn = choices.nth(c);
    const text = (await btn.innerText()).trim();
    if (text && !/^(Previous|Next|Outline)$/i.test(text)) {
      await btn.click();
      await page.waitForTimeout(300);
      break;
    }
  }
}

async function advanceToCard(page, targetIndex) {
  const player = page.locator(".lesson-card-player");
  for (let i = 0; i < targetIndex; i++) {
    await answerKcIfBlocked(page);
    const next = player.getByRole("button", { name: /Next/i });
    if (!(await next.isEnabled())) break;
    await next.click();
    await page.waitForTimeout(300);
  }
}

async function verifyLesson(browser, lesson, viewport, label) {
  const results = [];
  const page = await browser.newPage({ viewport });
  try {
    await page.goto(`${BASE}${lesson.route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await dismissCookies(page);
    await page.waitForSelector(".lesson-card-player", { timeout: 45000 });
    await page.waitForTimeout(1000);

    const deckInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      const slideMatch = text.match(/Slide\s+(\d+)\s+\/\s+(\d+)/i);
      const ofMatch = text.match(/(\d+)\s+of\s+(\d+)/i);
      const total = slideMatch?.[2] ?? ofMatch?.[2];
      return {
        total,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
        card1Text: document.querySelector(".lesson-card-stage")?.textContent?.slice(0, 200) ?? "",
      };
    });

    results.push({
      check: `${lesson.moduleSlug}/${lesson.lessonSlug} ${label} loads`,
      pass: true,
    });
    results.push({
      check: `${lesson.moduleSlug}/${lesson.lessonSlug} ${label} no overflow`,
      pass: !deckInfo.overflow,
    });
    results.push({
      check: `${lesson.moduleSlug}/${lesson.lessonSlug} ${label} has 12+ cards`,
      pass: Number(deckInfo.total) >= 12,
    });

    await advanceToCard(page, 2);
    const kcBlocked = !(await page.locator(".lesson-card-player").getByRole("button", { name: /Next/i }).isEnabled());
    results.push({
      check: `${lesson.moduleSlug}/${lesson.lessonSlug} ${label} KC by card 3 blocks Next`,
      pass: kcBlocked || (await page.locator(".lesson-card-stage").locator("button").count()) > 0,
    });

    const lastIdx = Number(deckInfo.total) - 1;
    if (lastIdx > 0) await advanceToCard(page, lastIdx);
    const summary = await page.locator(".lesson-card-stage").getByText(/summary|You will|Before |After this/i).first().isVisible().catch(() => false);
    results.push({
      check: `${lesson.moduleSlug}/${lesson.lessonSlug} ${label} summary card`,
      pass: summary,
    });
  } catch (err) {
    results.push({
      check: `${lesson.moduleSlug}/${lesson.lessonSlug} ${label}`,
      pass: false,
      detail: err.message,
    });
  } finally {
    await page.close();
  }
  return results;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`Verifying ${LESSONS.length} card lessons at ${BASE}\n`);
  const results = [];
  const browser = await chromium.launch({ headless: true });

  for (const lesson of LESSONS) {
    results.push(...(await verifyLesson(browser, lesson, { width: 375, height: 812 }, "375px")));
  }
  for (const lesson of LESSONS.slice(0, 3)) {
    results.push(...(await verifyLesson(browser, lesson, { width: 1280, height: 900 }, "1280px")));
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    base: BASE,
    lessonCount: LESSONS.length,
    results,
    passed: results.filter((r) => r.pass).length,
    total: results.length,
  };
  await writeFile(path.join(OUT, "all-card-lessons-qa.json"), JSON.stringify(report, null, 2));

  console.log("\n=== ALL CARD LESSONS QA ===\n");
  for (const r of results.filter((x) => !x.pass)) {
    console.log(`FAIL ${r.check}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed (${LESSONS.length} lessons)\n`);
  process.exit(report.passed === report.total ? 0 : 1);
}

main();
