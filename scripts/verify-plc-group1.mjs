/**
 * Step 2 QA — PLC Fundamentals Group 1 card conversions (4 lessons)
 * Run: node scripts/verify-plc-group1.mjs
 * Requires dev server: QA_BASE_URL (default http://127.0.0.1:3000)
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3002";
const OUT = path.join(__dirname, "..", "qa-screenshots", "plc-group1");

const LESSONS = [
  { slug: "ladder-logic-basics", kcHeading: /Knowledge check — contact types/i },
  { slug: "timers-counters", kcHeading: /Knowledge check — TON done bit/i },
  { slug: "communication-faults", kcHeading: /Knowledge check — adapter fault LED/i },
  { slug: "program-troubleshooting", kcHeading: /Knowledge check — when forcing is allowed/i },
];

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

async function advanceToCard(page, targetIndex) {
  const player = page.locator(".lesson-card-player");
  for (let i = 0; i < targetIndex; i++) {
    const next = player.getByRole("button", { name: /Next/i });
    if (!(await next.isEnabled())) {
      const choices = player.locator(".lesson-card-stage button[type='button']");
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
    if (!(await next.isEnabled())) break;
    await next.click();
    await page.waitForTimeout(350);
  }
}

async function verifyLesson(browser, lesson, viewport, label) {
  const results = [];
  const page = await browser.newPage({ viewport });
  const route = `/courses/plc-fundamentals/${lesson.slug}?qa=full`;

  try {
    const res = await fetch(`${BASE}${route.replace("?qa=full", "")}`);
    results.push({ check: `${lesson.slug} ${label} route 200`, pass: res.ok });

    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await dismissCookies(page);
    await page.waitForSelector(".lesson-card-player", { timeout: 45000 });
    await page.waitForTimeout(1500);

    const deck = await page.evaluate(() => {
      const text = document.body.innerText;
      const slideMatch = text.match(/Slide\s+(\d+)\s+\/\s+(\d+)/i);
      const ofMatch = text.match(/(\d+)\s+of\s+(\d+)/i);
      const total = slideMatch?.[2] ?? ofMatch?.[2];
      return {
        cardCount: total,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      };
    });
    results.push({
      check: `${lesson.slug} ${label} shows 13 cards`,
      pass: deck.cardCount === "13",
    });
    results.push({
      check: `${lesson.slug} ${label} no horizontal overflow`,
      pass: !deck.overflow,
    });

    await advanceToCard(page, 4);
    const kc1 = await page.locator(".lesson-card-stage").getByText(lesson.kcHeading).first().isVisible();
    results.push({ check: `${lesson.slug} ${label} KC card 5 visible`, pass: kc1 });

    const nextDisabled = await page.locator(".lesson-card-player").getByRole("button", { name: /Next/i }).isEnabled();
    results.push({
      check: `${lesson.slug} ${label} KC blocks Next until answered`,
      pass: !nextDisabled,
    });

    await advanceToCard(page, 12);
    const summary = await page.locator(".lesson-card-stage").getByText(/summary|Read rungs|Check PRE|Monitor first|Fix the wire/i).first().isVisible();
    results.push({ check: `${lesson.slug} ${label} summary card`, pass: summary });

    await page.screenshot({
      path: path.join(OUT, `${lesson.slug}-${label}.png`),
      fullPage: false,
    });
  } catch (err) {
    results.push({
      check: `${lesson.slug} ${label}`,
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
  const results = [];
  const browser = await chromium.launch({ headless: true });

  for (const lesson of LESSONS) {
    results.push(...(await verifyLesson(browser, lesson, { width: 375, height: 812 }, "375px")));
    results.push(...(await verifyLesson(browser, lesson, { width: 1280, height: 900 }, "1280px")));
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    base: BASE,
    lessons: LESSONS.map((l) => l.slug),
    results,
    passed: results.filter((r) => r.pass).length,
    total: results.length,
  };
  await writeFile(path.join(OUT, "plc-group1-qa.json"), JSON.stringify(report, null, 2));

  console.log("\n=== PLC GROUP 1 VERIFICATION ===\n");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} ${r.check}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed\n`);
  process.exit(report.passed === report.total ? 0 : 1);
}

main();
