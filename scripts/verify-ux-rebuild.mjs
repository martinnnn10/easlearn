/**
 * Priority 4 UX rebuild — screenshot verification
 * Run: pnpm exec tsx scripts/verify-ux-rebuild.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3001";
const OUT = path.join(__dirname, "..", "qa-screenshots", "ux");

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 2000 }).catch(() => {});
}

async function checkHorizontalScroll(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  // Step 1 — Nav
  for (const vp of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 375, height: 812 },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
    await dismissCookies(page);
    if (vp.name === "mobile") {
      await page.getByRole("button", { name: /open menu/i }).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, "nav-mobile.png"), fullPage: false });
    } else {
      const mainNav = page.getByRole("navigation", { name: /main navigation/i });
      const hasNav = await mainNav.getByRole("link", { name: /^learn$/i }).isVisible();
      const hasHubs = await mainNav.getByRole("button", { name: /^hubs$/i }).isVisible();
      await page.screenshot({ path: path.join(OUT, "nav-desktop.png"), fullPage: false });
      results.push({ step: "1-nav-labels", viewport: vp.name, hasNav, hasHubs, pass: hasNav && hasHubs });
    }
    const hScroll = await checkHorizontalScroll(page);
    results.push({ step: "1-nav", viewport: vp.name, hScroll, pass: !hScroll });
    await page.close();
  }

  // Step 2 — Home
  for (const vp of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 375, height: 812 },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await dismissCookies(page);
    await page.screenshot({ path: path.join(OUT, `home-${vp.name}.png`), fullPage: true });
    const hasCta = await page.getByRole("link", { name: /start learning/i }).isVisible();
    const hasHero = await page.getByRole("heading", { name: /industrial training built for the plant floor/i }).isVisible();
    const hScroll = await checkHorizontalScroll(page);
    results.push({ step: "2-home", viewport: vp.name, hasCta, hasHero, hScroll, pass: hasCta && hasHero && !hScroll });
    await page.close();
  }

  // Step 3 — Courses
  for (const vp of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 375, height: 812 },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`${BASE}/courses`, { waitUntil: "networkidle" });
    await dismissCookies(page);
    await page.screenshot({ path: path.join(OUT, `courses-${vp.name}.png`), fullPage: true });
    const hasHeader = await page.getByRole("heading", { name: /learn by skill track/i }).isVisible();
    const moduleCards = await page.locator("a.card-panel").count();
    const hScroll = await checkHorizontalScroll(page);
    results.push({
      step: "3-courses",
      viewport: vp.name,
      hasHeader,
      moduleCards,
      hScroll,
      pass: hasHeader && !hScroll && (moduleCards >= 2 || moduleCards === 0),
    });
    await page.close();
  }

  // Step 4 — Lesson (card format)
  const lessonPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await lessonPage.goto(
    `${BASE}/courses/plc-fundamentals/io-troubleshooting?qa=full`,
    { waitUntil: "networkidle", timeout: 60000 }
  );
  await dismissCookies(lessonPage);
  await lessonPage.waitForSelector(".lesson-rise-layout", { timeout: 15000 });
  await lessonPage.screenshot({ path: path.join(OUT, "lesson-player-desktop.png"), fullPage: true });

  // KC block test — find choice slide and verify Next disabled until answered
  let kcPass = false;
  for (let i = 0; i < 15; i++) {
    const hasChoices = await lessonPage.locator('button[disabled]').filter({ hasText: /.+/ }).count();
    const nextBtn = lessonPage.getByRole("button", { name: /next/i });
    const nextDisabled = await nextBtn.isDisabled();
    const choiceBtns = lessonPage.locator(".lesson-card-stage button").filter({ hasText: /.+/ });
    const choiceCount = await choiceBtns.count();
    if (choiceCount >= 2 && nextDisabled) {
      await choiceBtns.first().click();
      await lessonPage.waitForTimeout(300);
      kcPass = !(await nextBtn.isDisabled());
      await lessonPage.screenshot({ path: path.join(OUT, "lesson-player-kc-feedback.png"), fullPage: false });
      break;
    }
    if (!(await nextBtn.isDisabled())) await nextBtn.click();
    await lessonPage.waitForTimeout(200);
  }
  results.push({ step: "4-lesson", kcPass, pass: kcPass });

  const lessonMobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await lessonMobile.goto(
    `${BASE}/courses/plc-fundamentals/io-troubleshooting?qa=full`,
    { waitUntil: "networkidle" }
  );
  await dismissCookies(lessonMobile);
  await lessonMobile.waitForSelector(".lesson-rise-layout", { timeout: 15000 });
  await lessonMobile.screenshot({ path: path.join(OUT, "lesson-player-mobile.png"), fullPage: true });
  await lessonMobile.close();
  await lessonPage.close();

  // Step 5 — Simulator layout
  for (const vp of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 375, height: 812 },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`${BASE}/labs#conveyor-troubleshoot`, { waitUntil: "networkidle" });
    await dismissCookies(page);
    await page.waitForSelector(".sim-lab-layout", { timeout: 15000 });
    await page.screenshot({ path: path.join(OUT, `labs-${vp.name}.png`), fullPage: true });
    const hasFlagship = await page.getByText(/flagship labs/i).isVisible();
    const hasInstructions =
      (await page.locator("[data-sim-instructions]").first().isVisible().catch(() => false)) ||
      (await page.locator("[data-sim-instructions-mobile]").first().isVisible().catch(() => false));
    const hScroll = await checkHorizontalScroll(page);
    results.push({
      step: "5-labs",
      viewport: vp.name,
      hasInstructions,
      hasFlagship,
      hScroll,
      pass: hasInstructions && hasFlagship && !hScroll,
    });
    await page.close();
  }

  await browser.close();

  console.log("\n=== UX REBUILD SCREENSHOT AUDIT ===\n");
  for (const r of results) {
    console.log(JSON.stringify(r));
  }
  const allPass = results.every((r) => r.pass);
  console.log(`\nOverall: ${allPass ? "PASS" : "FAIL"}`);
  process.exit(allPass ? 0 : 1);
}

main();
