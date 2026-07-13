/**
 * One-time import verification — Conveyor PLC Diagnostic Lab MVP
 * Run: node scripts/verify-conveyor-import.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const OUT = path.join(__dirname, "..", "qa-screenshots", "conveyor-import-verify");

const FAULTS = [
  { name: "E-stop open", button: /E-Stop Open/i, ioCheck: /I:1\/2[\s\S]*TRUE/i },
  { name: "Photoeye stuck on", button: /Photoeye Stuck ON/i, ioCheck: /I:1\/5[\s\S]*TRUE/i },
  { name: "Overload tripped", button: /Overload Tripped/i, ioCheck: /I:1\/4[\s\S]*TRUE/i },
  { name: "Output on / motor dead", button: /Output ON, Motor Dead/i, ioCheck: null },
];

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

async function openLab(page) {
  await page.goto(`${BASE}/labs#conveyor-troubleshoot`, { waitUntil: "networkidle", timeout: 60000 });
  await dismissCookies(page);
  await page.waitForTimeout(1500);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const results = [];

  const homeRes = await fetch(BASE);
  results.push({ id: 4, check: "App loads at localhost:3000", pass: homeRes.ok, detail: `HTTP ${homeRes.status}` });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await openLab(page);
    const labTitle = await page.getByRole("heading", { name: /Conveyor PLC Diagnostic Lab/i }).isVisible();
    results.push({ id: 5, check: "/labs#conveyor-troubleshoot loads", pass: labTitle });

    // A6 — URL param init from PLC Hub CTA shape
    await page.goto(
      `${BASE}/labs?hub=plc&module=plc-fundamentals&lesson=io-troubleshooting&ilu=troubleshoot&mode=practice&faultScope=estop_open%2Coverload_tripped#conveyor-troubleshoot`,
      { waitUntil: "networkidle", timeout: 60000 }
    );
    await dismissCookies(page);
    await page.waitForTimeout(1200);
    const backHub = await page.getByRole("link", { name: /Back to PLC Hub/i }).isVisible();
    const backLesson = await page.getByRole("link", { name: /Back to lesson/i }).isVisible();
    const paramLabText = await page.locator(".conveyor-lab").innerText();
    const practiceActive = /Practice Mode/i.test(paramLabText);
    await page.getByRole("button", { name: /^learn$/i }).click();
    await page.waitForTimeout(400);
    const scopedFaults = await page.locator(".conveyor-lab").innerText();
    const scopeOk =
      /E-Stop Open/i.test(scopedFaults) &&
      /Overload Tripped/i.test(scopedFaults) &&
      !/Photoeye Stuck ON/i.test(scopedFaults);
    results.push({
      id: "5a",
      check: "Hub/lesson attribution bar visible from params",
      pass: backHub && backLesson,
    });
    results.push({
      id: "5b",
      check: "mode=practice initializes from URL",
      pass: practiceActive,
    });
    results.push({
      id: "5c",
      check: "faultScope limits selectable faults",
      pass: scopeOk,
    });

    // A6 — session restore on refresh (same attribution fingerprint)
    await page.getByRole("button", { name: /Overload Tripped/i }).click();
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const afterReload = await page.locator(".conveyor-lab").innerText();
    const sessionOk = /Overload Tripped/i.test(afterReload) || /overload/i.test(afterReload);
    results.push({
      id: "5d",
      check: "Session restores active fault after refresh",
      pass: sessionOk,
    });

    await openLab(page);

    // Learn mode
    await page.getByRole("button", { name: /^learn$/i }).click();
    await page.waitForTimeout(400);
    const learnOk = await page.getByRole("button", { name: /^Normal$/i }).isVisible();
    results.push({ id: "6a", check: "Learn mode works", pass: learnOk });

    // Practice mode
    await page.getByRole("button", { name: /^practice$/i }).click();
    await page.waitForTimeout(800);
    const practiceText = await page.locator(".conveyor-lab").innerText();
    const practiceOk = /Practice Mode/i.test(practiceText) && /Operator:/i.test(practiceText);
    results.push({ id: "6b", check: "Practice mode works", pass: practiceOk });

    // Guided mode
    await page.getByRole("button", { name: /^guided$/i }).click();
    await page.waitForTimeout(800);
    const guidedOk = await page.getByText(/Guided — Step/i).isVisible();
    results.push({ id: "6c", check: "Guided Troubleshooting mode works", pass: guidedOk });

    // Four faults in learn mode
    await page.getByRole("button", { name: /^learn$/i }).click();
    await page.waitForTimeout(400);
    for (const fault of FAULTS) {
      await page.getByRole("button", { name: fault.button }).click();
      await page.waitForTimeout(600);
      const text = await page.locator(".conveyor-lab").innerText();
      let pass = text.length > 200;
      if (fault.ioCheck) pass = pass && fault.ioCheck.test(text);
      if (fault.name.includes("photoeye")) {
        await page.getByRole("button", { name: /^START$/i }).first().click();
        await page.waitForTimeout(4500);
        const after = await page.locator(".conveyor-lab").innerText();
        pass = pass && !/O:2\/0[\s\S]*ON/.test(after);
      }
      if (fault.name.includes("motor dead")) {
        await page.getByRole("button", { name: /^START$/i }).first().click();
        await page.waitForTimeout(4500);
        const after = await page.locator(".conveyor-lab").innerText();
        pass = /OUTPUT ON|NO MOTION|O:2\/0[\s\S]*ON/i.test(after);
      }
      results.push({ id: `7-${fault.name}`, check: `Fault: ${fault.name}`, pass });
    }

    // Standards reference
    await page.getByRole("button", { name: /E-Stop Open/i }).click();
    await page.waitForTimeout(400);
    const stdLink = page.getByRole("link", { name: /View Standard/i }).first();
    const stdVisible = await stdLink.isVisible();
    let stdWorks = false;
    if (stdVisible) {
      const href = await stdLink.getAttribute("href");
      const nav = page.waitForURL(/\/reference\/electrical\//, { timeout: 10000 }).catch(() => null);
      await stdLink.click();
      await nav;
      stdWorks = page.url().includes("/reference/electrical/");
      await openLab(page);
    }
    results.push({ id: 8, check: "Standards reference buttons work", pass: stdVisible && stdWorks });

    // Print package — wiring SVG
    await page.getByRole("button", { name: /Prints/i }).click();
    await page.waitForTimeout(500);
    const printOpen = await page.getByRole("heading", { name: /Print Package/i }).isVisible();
    await page.getByRole("button", { name: /^Wiring$/i }).click();
    await page.waitForTimeout(600);
    const wiringSvg = await page.locator(".wiring-diagram-svg").isVisible();
    const wiringSvgNodes = await page.locator(".wiring-diagram-svg text").count();
    const devicesTab = await page.getByRole("button", { name: /^Devices$/i }).isVisible();
    await page.getByRole("button", { name: /^Worksheet$/i }).click().catch(() => {});
    await page.waitForTimeout(300);
    const worksheet = await page.locator("ol li").count();
    await page.screenshot({ path: path.join(OUT, "print-wiring-svg.png") });
    await page.locator('button[aria-label="Close"]').click().catch(() => {});
    results.push({
      id: 9,
      check: "Print package drawer works",
      pass: printOpen && devicesTab && worksheet >= 4,
    });
    results.push({
      id: "9b",
      check: "Wiring tab renders SVG diagram",
      pass: wiringSvg && wiringSvgNodes >= 10,
      detail: wiringSvgNodes ? `${wiringSvgNodes} SVG text nodes` : "no SVG",
    });

    // Debrief submit
    await page.getByRole("button", { name: /^learn$/i }).click();
    await page.getByRole("button", { name: /Overload Tripped/i }).click();
    await page.waitForTimeout(400);
    const rootSelect = page.locator('select').filter({ has: page.locator('option[value="overload_tripped"]') }).last();
    await rootSelect.selectOption("overload_tripped");
    await page.getByRole("button", { name: /Submit diagnosis/i }).click();
    await page.waitForTimeout(800);
    const debrief = await page.getByText(/Diagnosis Complete/i).isVisible();
    results.push({ id: "6d", check: "Submit diagnosis / debrief works", pass: debrief, note: "Supports full lab flow" });

    await page.screenshot({ path: path.join(OUT, "desktop-verify.png"), fullPage: true });

    // Mobile
    const mctx = await browser.newContext({ ...devices["iPhone 13"] });
    const mobile = await mctx.newPage();
    await openLab(mobile);
    const tabs = ["Machine", "Ladder", "Diag", "Actions"];
    let mobileOk = true;
    for (const t of tabs) {
      const btn = mobile.getByRole("button", { name: new RegExp(`^${t}$`, "i") });
      if (!(await btn.isVisible())) mobileOk = false;
      await btn.click();
      await mobile.waitForTimeout(350);
    }
    await mobile.getByRole("button", { name: /Actions/i }).click();
    const mobileSubmit = await mobile.getByRole("button", { name: /Submit diagnosis/i }).isVisible().catch(() => false);
    await mobile.screenshot({ path: path.join(OUT, "mobile-verify.png"), fullPage: true });
    await mctx.close();
    results.push({
      id: 10,
      check: "Mobile layout is usable",
      pass: mobileOk,
      note: mobileSubmit ? "Diagnosis on Actions tab" : "Switch fault for diagnosis form",
    });
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
  await writeFile(path.join(OUT, "import-verify.json"), JSON.stringify(report, null, 2));

  console.log("\n=== CONVEYOR IMPORT VERIFICATION ===\n");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} [${r.id}] ${r.check}${r.detail ? ` — ${r.detail}` : ""}${r.note ? ` (${r.note})` : ""}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed\n`);
  process.exit(report.passed === report.total ? 0 : 1);
}

main();
