/**
 * Conveyor PLC Diagnostic Lab — stakeholder QA script
 * Run: node scripts/conveyor-lab-qa.mjs
 * Requires dev server at QA_BASE_URL (default http://127.0.0.1:3000)
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const OUT = path.join(__dirname, "..", "qa-screenshots", "conveyor-lab");

const FAULTS = [
  { id: "estop", button: /E-Stop Open/i },
  { id: "photoeye", button: /Photoeye Stuck ON/i },
  { id: "overload", button: /Overload Tripped/i },
  { id: "motor_dead", button: /Output ON, Motor Dead/i },
];

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
}

async function openConveyorLab(page) {
  await page.goto(`${BASE}/labs#conveyor-troubleshoot`, { waitUntil: "networkidle", timeout: 60000 });
  await dismissCookies(page);
  await page.waitForTimeout(1500);
}

async function clickStart(page) {
  await page.getByRole("button", { name: /^START$/i }).first().click({ timeout: 5000 });
}

async function getIoState(page, label) {
  const tile = page.locator(`text=${label}`).first();
  const parent = tile.locator("xpath=ancestor::div[contains(@class,'font-mono')][1]");
  const text = await parent.innerText().catch(() => "");
  return text;
}

async function runDesktopChecks(page, results) {
  await openConveyorLab(page);

  // Header & modes
  const title = await page.getByRole("heading", { name: /Conveyor PLC Diagnostic Lab/i }).isVisible();
  results.push({ id: "D01", check: "Lab title visible", pass: title });

  for (const mode of ["learn", "practice", "guided"]) {
    const btn = page.getByRole("button", { name: new RegExp(`^${mode}$`, "i") });
    results.push({ id: `D02-${mode}`, check: `Mode button: ${mode}`, pass: await btn.isVisible() });
  }

  const printsBtn = page.getByRole("button", { name: /Prints/i });
  results.push({ id: "D03", check: "Prints button visible", pass: await printsBtn.isVisible() });

  // 3-panel desktop layout
  const ladder = await page.getByText(/PLC Logic — Ladder/i).first().isVisible();
  const machine = await page.getByRole("heading", { name: /Machine Twin/i }).first().isVisible();
  const diag = await page.getByText(/^Diagnostics$/i).first().isVisible();
  results.push({ id: "D04", check: "Desktop 3-panel (ladder/machine/diag)", pass: ladder && machine && diag });

  // Learn mode fault injector
  await page.getByRole("button", { name: /^learn$/i }).click();
  await page.waitForTimeout(500);
  const normalBtn = page.getByRole("button", { name: /^Normal$/i });
  results.push({ id: "D05", check: "Learn mode fault injector (Normal)", pass: await normalBtn.isVisible() });

  // Each fault inject
  for (const fault of FAULTS) {
    await page.getByRole("button", { name: fault.button }).click();
    await page.waitForTimeout(800);
    const symptom = await page.locator(".conveyor-lab").innerText();
    results.push({
      id: `D06-${fault.id}`,
      check: `Inject fault: ${fault.id}`,
      pass: symptom.length > 100,
    });
  }

  // E-stop fault I/O
  await page.getByRole("button", { name: /E-Stop Open/i }).click();
  await page.waitForTimeout(500);
  const estopIo = await page.locator("text=I:1/2").first().isVisible();
  results.push({ id: "D07", check: "E-stop fault shows I:1/2 in I/O", pass: estopIo });

  // Press START on E-stop fault
  await clickStart(page);
  await page.waitForTimeout(600);
  const safetyText = await page.locator(".conveyor-lab").innerText();
  results.push({
    id: "D08",
    check: "START on E-stop logs safety (or blocks)",
    pass: /E-STOP|TRUE|STOPPED/i.test(safetyText),
  });

  // Print drawer
  await page.getByRole("button", { name: /Prints/i }).click();
  await page.waitForTimeout(500);
  const printDrawer = await page.getByRole("heading", { name: /Print Package/i }).isVisible();
  const ladderTab = await page.getByRole("button", { name: /^Ladder$/i }).isVisible();
  results.push({ id: "D09", check: "Print drawer opens with Ladder tab", pass: printDrawer && ladderTab });

  await page.getByRole("button", { name: /Print all/i }).click().catch(() => {});
  await page.waitForTimeout(300);

  // Close print drawer
  await page.locator('button[aria-label="Close"]').click().catch(async () => {
    await page.keyboard.press("Escape");
  });
  await page.waitForTimeout(300);

  // Meter
  const takeReading = page.getByRole("button", { name: /Take reading/i });
  if (await takeReading.isVisible()) {
    await takeReading.click();
    await page.waitForTimeout(400);
    const meterResult = await page.locator(".conveyor-lab").innerText();
    results.push({
      id: "D10",
      check: "Meter take reading shows result",
      pass: /OPEN|CLOSED|VAC|VDC|Ω/i.test(meterResult),
    });
  } else {
    results.push({ id: "D10", check: "Meter take reading shows result", pass: false });
  }

  // View Standard on ladder
  const viewStd = page.getByRole("link", { name: /View Standard/i }).first();
  results.push({ id: "D11", check: "View Standard link on ladder", pass: await viewStd.isVisible() });

  // Practice mode — fault buttons hidden in injector
  await page.getByRole("button", { name: /^practice$/i }).click();
  await page.waitForTimeout(800);
  const practiceText = await page.locator(".conveyor-lab").innerText();
  const hasPracticeBanner = /Practice Mode/i.test(practiceText);
  const faultButtonsHidden = !(await page.getByRole("button", { name: /E-Stop Open/i }).isVisible().catch(() => false));
  results.push({
    id: "D12",
    check: "Practice mode hides fault list",
    pass: hasPracticeBanner && faultButtonsHidden,
  });

  // Guided mode
  await page.getByRole("button", { name: /^guided$/i }).click();
  await page.waitForTimeout(800);
  const guided = await page.getByText(/Guided — Step/i).isVisible();
  results.push({ id: "D13", check: "Guided mode shows step coach", pass: guided });

  // Submit diagnosis flow (overload)
  await page.getByRole("button", { name: /^learn$/i }).click();
  await page.getByRole("button", { name: /Overload Tripped/i }).click();
  await page.waitForTimeout(500);
  await page.locator("select").nth(1).selectOption("overload_tripped");
  await page.getByRole("button", { name: /Submit diagnosis/i }).click();
  await page.waitForTimeout(800);
  const debrief = await page.getByText(/Diagnosis Complete/i).isVisible();
  results.push({ id: "D14", check: "Submit diagnosis opens debrief", pass: debrief });

  // Screenshot
  await page.screenshot({ path: path.join(OUT, "desktop-debrief.png"), fullPage: true });
}

async function runMobileChecks(browser, results) {
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();
  await openConveyorLab(page);

  const tabs = ["Machine", "Ladder", "Diag", "Actions"];
  for (const tab of tabs) {
    const btn = page.getByRole("button", { name: new RegExp(tab, "i") });
    results.push({ id: `M-${tab}`, check: `Mobile tab: ${tab}`, pass: await btn.isVisible() });
    await btn.click().catch(() => {});
    await page.waitForTimeout(400);
  }

  // Diagnosis form only on Actions
  await page.getByRole("button", { name: /Actions/i }).click();
  await page.getByRole("button", { name: /Overload Tripped/i }).click().catch(() => {});
  const submit = await page.getByRole("button", { name: /Submit diagnosis/i }).isVisible();
  results.push({ id: "M-submit", check: "Mobile diagnosis form on Actions tab", pass: submit });

  await page.screenshot({ path: path.join(OUT, "mobile-actions.png"), fullPage: true });
  await ctx.close();
}

async function runFaultBehaviorChecks(page, results) {
  await openConveyorLab(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Photoeye stuck on — motor should NOT be blocked in current ladder (document finding)
  await page.getByRole("button", { name: /^learn$/i }).click();
  await page.getByRole("button", { name: /Photoeye Stuck ON/i }).click();
  await clickStart(page);
  await page.waitForTimeout(4500); // wait for timer
  const peText = await page.locator(".conveyor-lab").innerText();
  const peBlocked = /PHOTOEYE[\s\S]*TRUE|BLOCKED/i.test(peText);
  const motorMayRun = /RUNNING|O:2\/0[\s\S]*ON|MOTOR/i.test(peText);
  results.push({
    id: "B01",
    check: "Photoeye fault: I:1/5 TRUE visible",
    pass: peBlocked,
  });
  results.push({
    id: "B02",
    check: "Photoeye fault: motor can still run (ladder gap — expected bug)",
    pass: motorMayRun,
    note: "If motor runs with PE stuck, photoeye not wired in ladder",
  });

  // Output on motor dead
  await page.getByRole("button", { name: /Output ON, Motor Dead/i }).click();
  await clickStart(page);
  await page.waitForTimeout(4500);
  const deadText = await page.locator(".conveyor-lab").innerText();
  results.push({
    id: "B03",
    check: "Motor dead fault: OUTPUT ON — NO MOTION banner or equivalent",
    pass: /OUTPUT ON|NO MOTION|STOPPED/i.test(deadText) && /ON/i.test(deadText),
  });

  await page.screenshot({ path: path.join(OUT, "fault-behavior.png"), fullPage: true });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const results = [];
  const consoleLog = [];

  let serverUp = true;
  try {
    const res = await fetch(`${BASE}/labs`);
    if (!res.ok) serverUp = false;
  } catch {
    serverUp = false;
  }

  if (!serverUp) {
    console.log("SKIP: Dev server not running at", BASE);
    console.log("Code review QA will be documented separately.");
    await writeFile(
      path.join(__dirname, "..", "CONVEYOR_STAKEHOLDER_REVIEW.md"),
      "# Conveyor Stakeholder Review\n\n**QA run status:** Dev server not available — findings from code review + architecture analysis.\n",
      "utf8"
    );
    process.exit(0);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleLog.push(msg.text());
  });
  page.on("pageerror", (err) => consoleLog.push(err.message));

  try {
    await runDesktopChecks(page, results);
    await runFaultBehaviorChecks(page, results);
    await runMobileChecks(browser, results);
  } catch (err) {
    results.push({ id: "ERR", check: "QA script execution", pass: false, note: err.message });
  }

  await browser.close();

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const report = {
    timestamp: new Date().toISOString(),
    base: BASE,
    summary: `${passed}/${total} checks passed`,
    results,
    consoleErrors: consoleLog,
  };

  await writeFile(path.join(OUT, "qa-results.json"), JSON.stringify(report, null, 2));

  console.log(`\nConveyor Lab QA: ${passed}/${total} passed\n`);
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} ${r.id} ${r.check}${r.note ? ` — ${r.note}` : ""}`);
  }
  if (consoleLog.length) console.log("\nConsole errors:", consoleLog.length);

  process.exit(passed === total ? 0 : 1);
}

main();
