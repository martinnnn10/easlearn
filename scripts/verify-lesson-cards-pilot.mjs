/**
 * Browser QA — Priority 1 slide lesson pilot (polish)
 * Run: pnpm exec tsx scripts/verify-lesson-cards-pilot.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3002";
const PILOT = "/courses/plc-fundamentals/io-troubleshooting";
const PILOT_FULL = `${PILOT}?qa=full`;
const OUT = path.join(__dirname, "..", "qa-screenshots", "lesson-cards-pilot");

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

async function openPilot(page, fullDeck = false) {
  await page.goto(`${BASE}${fullDeck ? PILOT_FULL : PILOT}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await dismissCookies(page);
  await page.waitForSelector("h1", { timeout: 15000 });
  await page.waitForTimeout(800);
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

async function main() {
  await mkdir(OUT, { recursive: true });
  const results = [];

  results.push({
    id: 1,
    check: "Pilot lesson route returns 200",
    pass: (await fetch(`${BASE}${PILOT}`)).ok,
  });

  const browser = await chromium.launch({ headless: true });

  const guest = await browser.newContext();
  const guestPage = await guest.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await openPilot(guestPage);
    results.push({
      id: 2,
      check: "Logged-out preview label",
      pass: await guestPage.getByText(/Preview 1 of 2/i).isVisible(),
    });
    results.push({
      id: 3,
      check: "Logged-out subscribe CTA",
      pass: await guestPage.getByRole("link", { name: /Subscribe to continue/i }).first().isVisible(),
    });
    await guestPage.screenshot({ path: path.join(OUT, "desktop-logged-out.png"), fullPage: true });
  } catch (err) {
    results.push({ id: "G-ERR", check: "Logged-out preview", pass: false, detail: err.message });
  }
  await guest.close();

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await openPilot(desktop, true);
    await advanceToCard(desktop, 11);
    results.push({
      id: 4,
      check: "Summary card lab CTAs",
      pass:
        (await desktop.getByRole("link", { name: /Open Multimeter Lab/i }).isVisible()) &&
        (await desktop.getByRole("link", { name: /Open Conveyor Lab/i }).isVisible()),
    });
    results.push({
      id: 6,
      check: "Full deck progress shows 12 cards",
      pass: await desktop.getByText(/12 of 12/i).isVisible(),
    });
    await desktop.screenshot({ path: path.join(OUT, "desktop-summary.png"), fullPage: true });

    await openPilot(desktop, true);
    await advanceToCard(desktop, 8);
    await desktop.screenshot({ path: path.join(OUT, "desktop-mcq-card.png"), fullPage: false });
    results.push({
      id: 5,
      check: "MCQ on dedicated card",
      pass: await desktop
        .locator(".lesson-card-stage")
        .getByText(/After clearing a jam|Most likely fix/i)
        .first()
        .isVisible(),
    });

    const progressionUnified =
      (await desktop.getByText(/80% knowledge check/i).first().isVisible()) ||
      (await desktop.getByText(/Pass the knowledge check \(80%\)/i).isVisible()) ||
      (await desktop.locator(".lesson-ilu-strip, [class*='ilu']").first().isVisible().catch(() => false));
    await desktop.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await desktop.waitForTimeout(500);
    const assessInPlayer = await desktop.locator(".lesson-card-player .lesson-assess-panel").count();
    const assessBelowDeck =
      (await desktop.getByText(/Sign in to complete knowledge checks/i).isVisible()) ||
      (await desktop.getByText(/1 · Knowledge Check/i).isVisible()) ||
      (await desktop.getByText(/Use Practice and Troubleshoot labs above/i).isVisible()) ||
      (await desktop.getByText(/Pass the knowledge check/i).isVisible());
    results.push({
      id: 9,
      check: "ILU assess panel below card deck with unified progression copy",
      pass: assessInPlayer === 0 && (progressionUnified || assessBelowDeck) && assessBelowDeck,
    });
  } catch (err) {
    results.push({ id: "D-ERR", check: "Desktop polish", pass: false, detail: err.message });
  }
  await desktop.close();

  const phonePortrait = await browser.newContext({ ...devices["iPhone 13"] });
  const mobileP = await phonePortrait.newPage();
  try {
    await openPilot(mobileP, true);
    await mobileP.screenshot({ path: path.join(OUT, "mobile-portrait.png"), fullPage: true });
    results.push({
      id: 7,
      check: "Mobile portrait usable",
      pass: await mobileP.locator(".lesson-card-player").isVisible(),
    });
    await advanceToCard(mobileP, 8);
    await mobileP.screenshot({ path: path.join(OUT, "mobile-mcq-portrait.png"), fullPage: false });
  } catch (err) {
    results.push({ id: "MP-ERR", check: "Mobile portrait", pass: false, detail: err.message });
  }
  await phonePortrait.close();

  const phoneLandscape = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 844, height: 390 },
  });
  const mobileL = await phoneLandscape.newPage();
  try {
    await openPilot(mobileL);
    await mobileL.screenshot({ path: path.join(OUT, "mobile-landscape.png"), fullPage: true });
    results.push({
      id: 8,
      check: "Mobile landscape usable",
      pass: await mobileL.locator(".lesson-card-player").isVisible(),
    });
  } catch (err) {
    results.push({ id: "ML-ERR", check: "Mobile landscape", pass: false, detail: err.message });
  }
  await phoneLandscape.close();

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    base: BASE,
    pilot: PILOT,
    results,
    passed: results.filter((r) => r.pass).length,
    total: results.length,
  };
  await writeFile(path.join(OUT, "lesson-cards-pilot.json"), JSON.stringify(report, null, 2));

  console.log("\n=== LESSON CARDS PILOT VERIFICATION ===\n");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} [${r.id}] ${r.check}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed\n`);
  process.exit(report.passed === report.total ? 0 : 1);
}

main();
