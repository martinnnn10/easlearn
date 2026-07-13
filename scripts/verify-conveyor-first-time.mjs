/**
 * P0 — Conveyor first-time experience QA (anonymous homepage entry).
 * Run: pnpm run verify:conveyor-fte
 * Requires: QA_BASE_URL (default http://127.0.0.1:3002)
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3002";
const OUT = path.join(__dirname, "..", "qa-screenshots", "conveyor-fte");
const ENTRY = `${BASE}/labs?entry=home&mode=practice#conveyor-troubleshoot`;

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

async function auditViewport(name, viewport) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    ...viewport,
    storageState: undefined,
  });
  const page = await ctx.newPage();
  const checks = [];
  const t0 = Date.now();

  await page.addInitScript(() => {
    localStorage.removeItem("eas-conveyor-lab-briefing-complete-v1");
    localStorage.removeItem("eas-conveyor-lab-first-time-guide-v1");
    sessionStorage.removeItem("eas-conveyor-fte-metrics-v1");
  });

  await page.goto(ENTRY, { waitUntil: "domcontentloaded", timeout: 60000 });
  await dismissCookies(page);

  const briefingVisible = await page.getByRole("dialog").filter({ hasText: /LINE 4 CONVEYOR DOWN/i }).isVisible().catch(() => false);
  checks.push({ check: `${name} mission briefing visible`, pass: briefingVisible });

  const briefingText = await page.locator("#conveyor-mission-title").textContent().catch(() => "");
  checks.push({
    check: `${name} briefing states role within 10s`,
    pass: Boolean(briefingText?.includes("LINE 4")),
    detail: briefingText?.slice(0, 40),
  });

  const startBtn = page.getByRole("button", { name: /start troubleshooting/i });
  await startBtn.click({ timeout: 10000 });
  const tBriefingDismiss = Date.now() - t0;
  checks.push({
    check: `${name} briefing dismiss under 30s`,
    pass: tBriefingDismiss < 30000,
    detail: `${tBriefingDismiss}ms`,
  });

  await page.waitForSelector(".conveyor-lab", { timeout: 15000 });
  const playerVisible = await page.locator(".conveyor-lab").isVisible();
  checks.push({ check: `${name} lab loads after briefing`, pass: playerVisible });

  await page.getByRole("button", { name: /skip tour/i }).click({ timeout: 3000 }).catch(() => {});

  const faultInjectorHidden = (await page.getByText(/Fault Injector/i).count()) === 0;
  checks.push({ check: `${name} fault injector hidden in practice`, pass: faultInjectorHidden });

  const operatorReport = await page.locator('[data-conveyor-guide="operator-report"]').count();
  checks.push({ check: `${name} operator report anchor present`, pass: operatorReport > 0 });

  if (name === "mobile375") {
    await page.getByRole("button", { name: /^Diag$/i }).click({ timeout: 5000 });
    await page.waitForTimeout(600);
  }

  const takeReading = page.getByRole("button", { name: /take reading/i }).first();
  await takeReading.scrollIntoViewIfNeeded().catch(() => {});
  await takeReading.click({ timeout: 8000 });
  await page.waitForTimeout(400);
  const tFirstAction = Date.now() - t0;
  checks.push({
    check: `${name} first action under 60s`,
    pass: tFirstAction < 60000,
    detail: `${tFirstAction}ms`,
  });

  const metrics = await page.evaluate(() => {
    const raw = sessionStorage.getItem("eas-conveyor-fte-metrics-v1");
    return raw ? JSON.parse(raw) : null;
  });
  checks.push({
    check: `${name} FTE metrics recorded`,
    pass: Boolean(metrics?.briefingDismissAt && metrics?.firstActionAt),
  });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2);
  checks.push({ check: `${name} no horizontal overflow`, pass: overflow });

  await page.screenshot({ path: path.join(OUT, `conveyor-fte-${name}.png`), fullPage: false });
  await browser.close();

  return { checks, metrics, tBriefingDismiss, tFirstAction };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`Conveyor FTE QA at ${ENTRY}\n`);

  const desktop = await auditViewport("desktop", { viewport: { width: 1280, height: 900 } });
  const mobile = await auditViewport("mobile375", devices["iPhone 13"]);

  const allChecks = [...desktop.checks, ...mobile.checks];
  const report = {
    timestamp: new Date().toISOString(),
    entry: ENTRY,
    goals: {
      roleUnder10s: "Briefing visible on load with LINE 4 dispatch",
      actionUnder30s: "Start troubleshooting + first meter action",
      diagnosisUnder5min: "Manual — select root cause in lab",
    },
    desktop: desktop,
    mobile: mobile,
    results: allChecks,
    passed: allChecks.filter((c) => c.pass).length,
    total: allChecks.length,
  };

  await writeFile(path.join(OUT, "conveyor-fte-qa.json"), JSON.stringify(report, null, 2));

  console.log("\n=== CONVEYOR FIRST-TIME EXPERIENCE QA ===\n");
  for (const r of allChecks.filter((c) => !c.pass)) {
    console.log(`FAIL ${r.check}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed\n`);
  process.exit(report.passed === report.total ? 0 : 1);
}

main();
