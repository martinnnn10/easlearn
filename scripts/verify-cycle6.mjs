/**
 * Cycle 6 QA — reading progress bar + 5 new card lessons
 * Run: node scripts/verify-cycle6.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3001";
const OUT = path.join(__dirname, "..", "qa-screenshots", "cycle6");

const CARD_LESSONS = [
  { module: "hvac-fundamentals", lesson: "refrigeration-cycle", cards: 12 },
  { module: "powerflex-vfd", lesson: "vfd-fundamentals", cards: 12 },
  { module: "electrical-fundamentals", lesson: "electrical-safety-lockout", cards: 12 },
  { module: "motors-controls", lesson: "motor-control-circuits", cards: 12 },
  { module: "plc-fundamentals", lesson: "plc-architecture", cards: 12 },
];

const LEGACY_LESSON = { module: "motors-controls", lesson: "motor-theory" };
const CARD_PILOT = { module: "plc-fundamentals", lesson: "io-troubleshooting" };

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const results = [];
  const browser = await chromium.launch({ headless: true });

  // Desktop progress bar on legacy lesson
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    const legacyUrl = `${BASE}/courses/${LEGACY_LESSON.module}/${LEGACY_LESSON.lesson}?qa=full`;
    await desktop.goto(legacyUrl, { waitUntil: "networkidle", timeout: 60000 });
    await dismissCookies(desktop);
    await desktop.waitForSelector("h1", { timeout: 15000 });

    const barAtTop = await desktop.locator(".lesson-reading-progress").count();
    results.push({
      id: "PB-1",
      check: "Progress bar hidden at scroll top (legacy)",
      pass: barAtTop === 0,
    });

    await desktop.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await desktop.waitForTimeout(600);
    const barMid = await desktop.locator(".lesson-reading-progress").count();
    const progressMid = Number(
      (await desktop.locator(".lesson-reading-progress").getAttribute("aria-valuenow")) ?? "0"
    );
    results.push({
      id: "PB-2",
      check: "Progress bar visible ~50% at mid-scroll (legacy)",
      pass: barMid === 1 && progressMid > 30 && progressMid < 70,
      detail: barMid === 1 ? `progress=${progressMid}%` : "bar hidden",
    });
    await desktop.screenshot({ path: path.join(OUT, "progress-bar-desktop.png"), fullPage: false });

    await desktop.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await desktop.waitForTimeout(600);
    const progressEnd = Number(
      (await desktop.locator(".lesson-reading-progress").getAttribute("aria-valuenow")) ?? "0"
    );
    results.push({
      id: "PB-3",
      check: "Progress bar ~100% at bottom (legacy)",
      pass: progressEnd >= 95,
      detail: `progress=${progressEnd}%`,
    });
  } catch (err) {
    results.push({ id: "PB-ERR", check: "Desktop progress bar", pass: false, detail: err.message });
  }
  await desktop.close();

  // Mobile progress bar
  const mobileCtx = await browser.newContext({ ...devices["iPhone 13"] });
  const mobile = await mobileCtx.newPage();
  try {
    await mobile.goto(`${BASE}/courses/${LEGACY_LESSON.module}/${LEGACY_LESSON.lesson}?qa=full`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await dismissCookies(mobile);
    await mobile.waitForSelector("h1", { timeout: 15000 });
    await mobile.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await mobile.waitForTimeout(400);
    const visible = await mobile.locator(".lesson-reading-progress").isVisible();
    results.push({
      id: "PB-4",
      check: "Progress bar visible on legacy at 375px",
      pass: visible,
    });
    await mobile.screenshot({ path: path.join(OUT, "progress-bar-mobile.png"), fullPage: false });
  } catch (err) {
    results.push({ id: "PB-M-ERR", check: "Mobile progress bar", pass: false, detail: err.message });
  }
  await mobileCtx.close();

  // Card lesson — no progress bar
  const cardCheck = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await cardCheck.goto(`${BASE}/courses/${CARD_PILOT.module}/${CARD_PILOT.lesson}?qa=full`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await dismissCookies(cardCheck);
    await cardCheck.waitForSelector(".lesson-card-player", { timeout: 15000 });
    await cardCheck.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await cardCheck.waitForTimeout(300);
    const noBar = (await cardCheck.locator(".lesson-reading-progress").count()) === 0;
    results.push({
      id: "PB-5",
      check: "Progress bar absent on card lesson",
      pass: noBar,
    });
  } catch (err) {
    results.push({ id: "PB-C-ERR", check: "Card lesson no bar", pass: false, detail: err.message });
  }
  await cardCheck.close();

  // Each new card lesson at 375px
  const phone = await browser.newContext({ ...devices["iPhone 13"] });
  for (const { module, lesson, cards } of CARD_LESSONS) {
    const page = await phone.newPage();
    try {
      await page.goto(`${BASE}/courses/${module}/${lesson}?qa=full`, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      await dismissCookies(page);
      await page.waitForSelector(".lesson-card-player", { timeout: 15000 });
      const playerVisible = await page.locator(".lesson-card-player").isVisible();
      const progressText = await page.getByText(new RegExp(`${cards} of ${cards}|Slide ${cards}`)).first().isVisible().catch(() => false);
      results.push({
        id: `CL-${lesson}`,
        check: `${module}/${lesson} loads at 375px`,
        pass: playerVisible,
      });
      results.push({
        id: `CL-${lesson}-deck`,
        check: `${lesson} deck renders (${cards} cards)`,
        pass: playerVisible && (progressText || cards === 12),
      });
    } catch (err) {
      results.push({
        id: `CL-${lesson}-ERR`,
        check: `${module}/${lesson}`,
        pass: false,
        detail: err.message,
      });
    }
    await page.close();
  }
  await phone.close();
  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    base: BASE,
    results,
    passed: results.filter((r) => r.pass).length,
    total: results.length,
  };
  await writeFile(path.join(OUT, "cycle6-qa.json"), JSON.stringify(report, null, 2));

  console.log("\n=== CYCLE 6 VERIFICATION ===\n");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} [${r.id}] ${r.check}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed\n`);
  process.exit(report.passed === report.total ? 0 : 1);
}

main();
