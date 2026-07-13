/**
 * QA — lesson completion must not fire on quiz pass alone (card lessons).
 * Requires: DATABASE_URL, running server, auth-capable DB user.
 *
 * Run:
 *   $env:QA_BASE_URL="http://127.0.0.1:3001"
 *   pnpm exec tsx scripts/verify-lesson-completion-fix.mjs
 */
import { chromium } from "playwright";
import { config as loadEnv } from "dotenv";
import mysql from "mysql2/promise";
import path from "node:path";
import { fileURLToPath } from "node:url";

loadEnv({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3001";
const MODULE = "hvac-fundamentals";
const LESSON = "refrigeration-cycle";
const LESSON_URL = `${BASE}/courses/${MODULE}/${LESSON}`;

const KC_ANSWERS = [
  "Liquid refrigerant absorbs heat and evaporates to gas",
  "Evaporator flooding risk — liquid may reach the compressor",
];
const QUIZ_ANSWERS = [
  "Low refrigerant charge",
  "Condenser not fully condensing — investigate charge, airflow, or restriction",
  "TXV stuck open or overcharge flooding the evaporator",
  "Low refrigerant charge",
];

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

async function registerAndLogin(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
  await dismissCookies(page);
  const registerTab = page.getByRole("button", { name: /sign up|create account|register/i });
  if (await registerTab.count()) {
    await registerTab.first().click().catch(() => {});
  }
  await page.getByLabel(/name/i).fill("Completion QA").catch(async () => {
    await page.locator('input[name="name"]').fill("Completion QA");
  });
  await page.getByLabel(/email/i).fill(email).catch(async () => {
    await page.locator('input[type="email"]').fill(email);
  });
  const pwd = page.locator('input[type="password"]');
  if ((await pwd.count()) >= 2) {
    await pwd.nth(0).fill(password);
    await pwd.nth(1).fill(password).catch(() => pwd.nth(0).fill(password));
  } else {
    await pwd.first().fill(password);
  }
  const submit = page.getByRole("button", { name: /sign up|create account|register/i });
  if (await submit.count()) {
    await submit.first().click();
  } else {
    await page.getByRole("button", { name: /log in|sign in/i }).click();
  }
  await page.waitForTimeout(2000);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
  await dismissCookies(page);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await page.waitForTimeout(2500);
}

async function answerAssessment(page, answers) {
  for (let i = 0; i < answers.length; i++) {
    await page.getByRole("button", { name: new RegExp(answers[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }).click();
    const next = page.getByRole("button", { name: /^Next$/i });
    if (await next.isEnabled().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(300);
    }
  }
  await page.getByRole("button", { name: /submit/i }).click();
  await page.waitForTimeout(800);
  const cont = page.getByRole("button", { name: /continue/i });
  if (await cont.count()) {
    await cont.first().click();
    await page.waitForTimeout(500);
  }
}

async function advanceToCard(page, targetIndex) {
  const player = page.locator(".lesson-card-player");
  for (let i = 0; i < targetIndex; i++) {
    const next = player.getByRole("button", { name: /Next/i });
    if (!(await next.isEnabled())) {
      const choices = player.locator(".lesson-card-stage button[type='button']");
      for (let c = 0; c < (await choices.count()); c++) {
        const text = (await choices.nth(c).innerText()).trim();
        if (text && !/^(Previous|Next|Outline)$/i.test(text)) {
          await choices.nth(c).click();
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

function hasCompletedBadge(page) {
  return page.getByText(/^Completed$/i).isVisible().catch(() => false);
}

async function resetLessonProgress(conn, email) {
  const [users] = await conn.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  if (!users.length) return;
  const userId = users[0].id;
  const [lessons] = await conn.query(
    `SELECT cl.id FROM course_lessons cl
     JOIN course_modules cm ON cm.id = cl.moduleId
     WHERE cm.slug = ? AND cl.slug = ? LIMIT 1`,
    [MODULE, LESSON]
  );
  if (!lessons.length) return;
  const lessonId = lessons[0].id;
  await conn.query("DELETE FROM user_progress WHERE userId = ? AND lessonId = ?", [userId, lessonId]);
  await conn.query("DELETE FROM lesson_assessment_attempts WHERE userId = ? AND lessonId = ?", [
    userId,
    lessonId,
  ]);
}

async function getModuleCompletedCount(conn, email) {
  const [users] = await conn.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  if (!users.length) return null;
  const userId = users[0].id;
  const [mods] = await conn.query("SELECT id FROM course_modules WHERE slug = ? LIMIT 1", [MODULE]);
  if (!mods.length) return null;
  const moduleId = mods[0].id;
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM user_progress WHERE userId = ? AND moduleId = ? AND completed = 1",
    [userId, moduleId]
  );
  return Number(rows[0]?.c ?? 0);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("FAIL: DATABASE_URL not set — cannot run authenticated completion QA locally.");
    console.error("Set DATABASE_URL in .env or environment, restart server, re-run.");
    process.exit(1);
  }

  const email = `completion-qa-${Date.now()}@eas-qa.local`;
  const password = "CompletionQa123!";
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  try {
    await registerAndLogin(page, email, password);
    await resetLessonProgress(conn, email);

    await page.goto(LESSON_URL, { waitUntil: "networkidle", timeout: 60000 });
    await dismissCookies(page);
    await page.waitForSelector(".lesson-card-player", { timeout: 20000 });

    const openCompleted = await hasCompletedBadge(page);
    results.push({ step: "1-open-not-completed", pass: !openCompleted });

    await page.locator(".lesson-assess-panel, #ilu-assess").scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate(() => document.getElementById("ilu-assess")?.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(500);

    if (await page.locator(".lesson-assess-panel").count()) {
      await answerAssessment(page, KC_ANSWERS);
      await answerAssessment(page, QUIZ_ANSWERS);
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const afterQuizCompleted = await hasCompletedBadge(page);
    results.push({ step: "2-after-quiz-not-completed", pass: !afterQuizCompleted });

    await advanceToCard(page, 11);
    await page.waitForTimeout(1500);
    const afterSummaryCompleted = await hasCompletedBadge(page);
    results.push({ step: "3-after-summary-completed", pass: afterSummaryCompleted });

    const countBeforeModule = await getModuleCompletedCount(conn, email);
    await page.goto(`${BASE}/courses/${MODULE}`, { waitUntil: "networkidle", timeout: 60000 });
    await dismissCookies(page);
    await page.waitForTimeout(1000);
    const countAfter = await getModuleCompletedCount(conn, email);
    results.push({
      step: "4-module-count-accurate",
      pass: countAfter === 1 && countBeforeModule === 1,
      detail: `completed=${countAfter}`,
    });
  } finally {
    await conn.end();
    await browser.close();
  }

  console.log("\n=== LESSON COMPLETION FIX QA ===\n");
  let passed = 0;
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} [${r.step}]${r.detail ? ` — ${r.detail}` : ""}`);
    if (r.pass) passed++;
  }
  console.log(`\nSummary: ${passed}/${results.length}\n`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
