/**
 * Browser QA — PLC Hub shell at /hubs/plc
 * Run: node scripts/verify-plc-hub.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const OUT = path.join(__dirname, "..", "qa-screenshots", "plc-hub-verify");

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const results = [];

  const homeRes = await fetch(`${BASE}/hubs/plc`);
  results.push({ id: 1, check: "/hubs/plc returns 200", pass: homeRes.ok, detail: `HTTP ${homeRes.status}` });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto(`${BASE}/hubs/plc`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await dismissCookies(page);
    await page.waitForTimeout(1000);

    const title = await page.getByRole("heading", { name: /PLC Hub/i }).first().isVisible();
    results.push({ id: 2, check: "PLC Hub heading visible", pass: title });

    const benchmark = await page.getByRole("heading", { name: /Conveyor PLC Diagnostic Lab/i }).isVisible();
    results.push({ id: 3, check: "Benchmark card visible", pass: benchmark });

    const lessonCount = await page.getByText(/Lesson \d/).count();
    results.push({
      id: 4,
      check: "Six lesson cards listed",
      pass: lessonCount >= 6,
      detail: `${lessonCount} lesson labels`,
    });

    const iluChain = await page.getByText(/ILU chain: lesson → practice/i).first().isVisible();
    results.push({ id: 5, check: "ILU chain documented in header", pass: iluChain });

    const openLab = page.getByRole("link", { name: /Open Conveyor Lab/i });
    const labHref = await openLab.getAttribute("href");
    const labParamsOk =
      labHref?.includes("hub=plc") &&
      labHref?.includes("ilu=troubleshoot") &&
      labHref?.includes("#conveyor-troubleshoot");
    results.push({
      id: 6,
      check: "Conveyor CTA preserves hub/ilu params",
      pass: Boolean(labParamsOk),
      detail: labHref ?? "no href",
    });

    await openLab.click();
    await page.waitForTimeout(1500);
    const onLab = page.url().includes("conveyor-troubleshoot") || page.url().includes("/labs");
    results.push({ id: 7, check: "Conveyor CTA navigates to lab", pass: onLab, detail: page.url() });

    const backHub = await page.getByRole("link", { name: /Back to PLC Hub/i }).isVisible().catch(() => false);
    results.push({
      id: "7a",
      check: "Lab shows Back to PLC Hub from hub param",
      pass: backHub,
    });

    await page.goto(`${BASE}/hubs/plc`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const courseLink = page.getByRole("link", { name: /Course module/i }).first();
    await courseLink.click();
    await page.waitForTimeout(1000);
    const onCourse = page.url().includes("/courses/plc-fundamentals");
    results.push({ id: 8, check: "Course module CTA works", pass: onCourse });

    await page.goto(`${BASE}/hubs/plc`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, "plc-hub-desktop.png"), fullPage: true });

    const mobileCtx = await browser.newContext({ ...devices["iPhone 13"] });
    const mobile = await mobileCtx.newPage();
    await mobile.goto(`${BASE}/hubs/plc`, { waitUntil: "domcontentloaded" });
    await dismissCookies(mobile);
    await mobile.waitForTimeout(600);
    const mobileHeading = await mobile.getByRole("heading", { name: /PLC Hub/i }).first().isVisible();
    await mobile.screenshot({ path: path.join(OUT, "plc-hub-mobile.png"), fullPage: true });
    await mobileCtx.close();
    results.push({ id: 9, check: "Mobile layout renders", pass: mobileHeading });
  } catch (err) {
    results.push({ id: "ERR", check: "Browser verification", pass: false, detail: err.message });
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    base: BASE,
    results,
    passed: results.filter((r) => r.pass).length,
    total: results.length,
  };
  await writeFile(path.join(OUT, "plc-hub-verify.json"), JSON.stringify(report, null, 2));

  console.log("\n=== PLC HUB VERIFICATION ===\n");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} [${r.id}] ${r.check}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed\n`);
  process.exit(report.passed === report.total ? 0 : 1);
}

main();
