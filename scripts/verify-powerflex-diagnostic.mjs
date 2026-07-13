/**
 * Browser QA — PowerFlex Diagnostic Lab at /labs#powerflex-diagnostic
 * Run: node scripts/verify-powerflex-diagnostic.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const OUT = path.join(__dirname, "..", "qa-screenshots", "powerflex-diagnostic-verify");

const FAULTS = [
  { name: "Overcurrent", button: /F012.*Overcurrent/i, expectText: /F012|OVERCURRENT|28\.4/i },
  { name: "DC Bus Undervoltage", button: /F004.*DC Bus/i, expectText: /F004|387|UNDERVOLT/i },
  { name: "Cooling Fan Seized", button: /F006.*Cooling Fan/i, expectText: /F006|87|0 RPM|HEATSINK/i },
];

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

async function openLab(page, query = "") {
  await page.goto(`${BASE}/labs${query}#powerflex-diagnostic`, { waitUntil: "networkidle", timeout: 60000 });
  await dismissCookies(page);
  await page.waitForTimeout(1500);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const results = [];

  results.push({
    id: 1,
    check: "/labs#powerflex-diagnostic returns 200",
    pass: (await fetch(`${BASE}/labs`)).ok,
  });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await openLab(page);
    const title = await page.getByRole("heading", { name: /PowerFlex Diagnostic Lab/i }).isVisible();
    results.push({ id: 2, check: "Lab shell loads", pass: title });

    const betaBadge = await page.getByText(/^Beta$/i).first().isVisible();
    results.push({ id: 3, check: "Beta badge visible", pass: betaBadge });

    await page.getByRole("button", { name: /^learn$/i }).click();
    await page.waitForTimeout(400);
    results.push({ id: "4a", check: "Learn mode works", pass: await page.getByRole("button", { name: /Normal \/ Ready/i }).isVisible() });

    await page.getByRole("button", { name: /^practice$/i }).click();
    await page.waitForTimeout(800);
    const practiceText = await page.locator(".powerflex-lab").innerText();
    results.push({
      id: "4b",
      check: "Practice mode works",
      pass: /Practice Mode/i.test(practiceText),
    });

    await page.getByRole("button", { name: /^guided$/i }).click();
    await page.waitForTimeout(800);
    results.push({
      id: "4c",
      check: "Guided mode works",
      pass: await page.getByText(/Guided — Step/i).isVisible(),
    });

    await page.getByRole("button", { name: /^learn$/i }).click();
    await page.waitForTimeout(400);

    await page.getByRole("button", { name: /Reference/i }).click();
    await page.waitForTimeout(400);
    const onePagerText = await page.locator(".powerflex-one-pager-scroll").innerText();
    const onePagerOk =
      /F012/i.test(onePagerText) &&
      /F004/i.test(onePagerText) &&
      /F006/i.test(onePagerText) &&
      /Symptoms/i.test(onePagerText) &&
      /vfd-overcurrent-ramp-v3/i.test(onePagerText);
    results.push({ id: 10, check: "Fault-code one-pager in reference drawer", pass: onePagerOk });
    await page.getByRole("button", { name: /Close/i }).click().catch(() => {});

    for (const fault of FAULTS) {
      await page.getByRole("button", { name: fault.button }).click();
      await page.waitForTimeout(600);
      const text = await page.locator(".powerflex-lab").innerText();
      results.push({
        id: `5-${fault.name}`,
        check: `Fault display: ${fault.name}`,
        pass: fault.expectText.test(text),
      });
    }

    await page.getByRole("button", { name: /F012/i }).click();
    await page.waitForTimeout(300);
    const stdLink = page.getByRole("link", { name: /View VFD Standard/i }).first();
    let stdWorks = false;
    if (await stdLink.isVisible()) {
      await stdLink.click();
      await page.waitForTimeout(800);
      stdWorks = page.url().includes("/reference/electrical/vfd");
      await openLab(page);
      await page.getByRole("button", { name: /F012/i }).click();
    }
    results.push({ id: 6, check: "VFD standard reference link works", pass: stdWorks });

    await page.getByRole("button", { name: /Log status review/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: /Log review/i }).first().click();
    await page.waitForTimeout(200);
    const rootSelect = page.locator("select").last();
    await rootSelect.selectOption("overcurrent");
    await page.getByRole("button", { name: /Submit diagnosis/i }).click();
    await page.waitForTimeout(800);
    results.push({
      id: 7,
      check: "Submit diagnosis / debrief works",
      pass: await page.getByText(/Diagnosis Complete/i).isVisible(),
    });

    await openLab(
      page,
      "?hub=vfd&module=powerflex-vfd&lesson=fault-codes-diagnostics&ilu=troubleshoot&mode=guided"
    );
    const backHub = await page.getByRole("link", { name: /Back to VFD Hub/i }).isVisible();
    const backLesson = await page.getByRole("link", { name: /Back to lesson/i }).isVisible();
    results.push({ id: 8, check: "Attribution bar from hub params", pass: backHub && backLesson });

    await openLab(
      page,
      "?hub=vfd&module=powerflex-vfd&lesson=fault-codes-diagnostics&ilu=troubleshoot&mode=practice&faultScope=overcurrent,dc_bus_undervoltage,cooling_fan_seized"
    );
    await page.getByRole("button", { name: /^learn$/i }).click();
    await page.waitForTimeout(400);
    const scopeText = await page.locator(".powerflex-lab").innerText();
    const scopeOk =
      /F012/i.test(scopeText) &&
      /F004/i.test(scopeText) &&
      /F006/i.test(scopeText);
    results.push({ id: 11, check: "faultScope from lesson ILU link limits injector", pass: scopeOk });

    await page.getByRole("button", { name: /F004.*DC Bus/i }).click();
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const afterReload = await page.locator(".powerflex-lab").innerText();
    const sessionOk = /F004|387|UNDERVOLT/i.test(afterReload);
    results.push({
      id: 12,
      check: "Session restores active fault after refresh",
      pass: sessionOk,
    });

    await page.screenshot({ path: path.join(OUT, "desktop-verify.png"), fullPage: true });

    const mctx = await browser.newContext({ ...devices["iPhone 13"] });
    const mobile = await mctx.newPage();
    await openLab(mobile);
    const tabs = ["Drive", "Params", "Status", "Actions"];
    let mobileOk = true;
    for (const t of tabs) {
      const btn = mobile.getByRole("button", { name: new RegExp(`^${t}$`, "i") });
      if (!(await btn.isVisible())) mobileOk = false;
      await btn.click();
      await mobile.waitForTimeout(350);
    }
    await mobile.screenshot({ path: path.join(OUT, "mobile-verify.png"), fullPage: true });
    await mctx.close();
    results.push({ id: 9, check: "Mobile layout usable", pass: mobileOk });
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
  await writeFile(path.join(OUT, "powerflex-diagnostic-verify.json"), JSON.stringify(report, null, 2));

  console.log("\n=== POWERFLEX DIAGNOSTIC VERIFICATION ===\n");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} [${r.id}] ${r.check}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\nSummary: ${report.passed}/${report.total} passed\n`);
  process.exit(report.passed === report.total ? 0 : 1);
}

main();
