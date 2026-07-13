/**
 * Live (headed) E-stop verification with screenshots.
 * Run: pnpm exec tsx scripts/verify-safety-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3001";
const OUT = path.join(__dirname, "..", "qa-screenshots", "safety-verify");
const MOTOR_TIMER_MS = 4500;

async function dismissCookies(page) {
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 2000 }).catch(() => {});
}

async function readCoils(page) {
  return page.evaluate(() => {
    const coils = {};
    document.querySelectorAll("[data-safety-coil]").forEach((el) => {
      coils[el.getAttribute("data-safety-coil")] = el.getAttribute("data-coil-on") === "true";
    });
    return coils;
  });
}

async function ensureLadderInputOff(page, label) {
  const btn = page.locator("button").filter({ hasText: new RegExp(label, "i") }).first();
  const text = await btn.innerText();
  if (text.includes("● ON")) await btn.click();
}

async function ensureLadderInputOn(page, label) {
  const btn = page.locator("button").filter({ hasText: new RegExp(label, "i") }).first();
  const text = await btn.innerText();
  if (!text.includes("● ON")) await btn.click();
}

async function verifyLadder(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/labs?qa=full#ladder`, { waitUntil: "networkidle", timeout: 60000 });
  await dismissCookies(page);
  await page.waitForSelector("[data-safety-coil]", { timeout: 15000 });

  await ensureLadderInputOff(page, "STOP PB");
  await ensureLadderInputOff(page, "E-STOP");
  await ensureLadderInputOff(page, "GUARD SW");
  await ensureLadderInputOff(page, "OL TRIP");
  await ensureLadderInputOn(page, "START PB");
  await page.waitForTimeout(MOTOR_TIMER_MS);
  await ensureLadderInputOff(page, "START PB");
  await page.waitForTimeout(800);

  const beforeEstop = await readCoils(page);
  if (!beforeEstop.RUN_CMD) {
    throw new Error(`Ladder: RUN_CMD not energized before E-stop: ${JSON.stringify(beforeEstop)}`);
  }

  await ensureLadderInputOn(page, "E-STOP");
  await page.waitForTimeout(600);

  const afterEstop = await readCoils(page);
  const estopBtn = page.locator("button").filter({ hasText: /E-STOP/i }).first();
  await estopBtn.scrollIntoViewIfNeeded();
  await page.locator("[data-safety-coil]").first().scrollIntoViewIfNeeded();

  const shotPath = path.join(OUT, "ladder-estop.png");
  await page.screenshot({ path: shotPath, fullPage: true });

  await page.close();
  return { beforeEstop, afterEstop, shotPath };
}

async function verifyConveyor(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/labs#conveyor-troubleshoot`, { waitUntil: "networkidle", timeout: 60000 });
  await dismissCookies(page);
  await page.getByRole("button", { name: /^learn$/i }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Normal/i }).click().catch(() => {});
  await page.waitForTimeout(400);
  await page.waitForSelector("[data-safety-coil]", { timeout: 15000 });

  await page.getByRole("button", { name: /^START$/i }).first().click();
  await page.waitForTimeout(MOTOR_TIMER_MS);

  const beforeEstop = await readCoils(page);
  if (!beforeEstop.MOTOR) {
    throw new Error(`Conveyor: MOTOR not energized before E-stop: ${JSON.stringify(beforeEstop)}`);
  }

  await page.getByRole("button", { name: /ACTUATE E-STOP/i }).click();
  await page.waitForTimeout(600);

  const afterEstop = await readCoils(page);
  await page.getByRole("button", { name: /ACTUATE E-STOP/i }).scrollIntoViewIfNeeded();
  await page.locator('[data-safety-coil="MOTOR"]').scrollIntoViewIfNeeded();

  const shotPath = path.join(OUT, "conveyor-estop.png");
  await page.screenshot({ path: shotPath, fullPage: true });

  await page.close();
  return { beforeEstop, afterEstop, shotPath };
}

function outputsDeenergized(coils) {
  return !coils.RUN_CMD && !coils.SAFE_RUN && !coils.MOTOR && !(coils["GREEN LT"] || coils.GREEN);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 150,
  });

  const report = { timestamp: new Date().toISOString(), base: BASE, simulators: {} };

  try {
    const ladder = await verifyLadder(browser);
    report.simulators.ladder = {
      beforeEstop: ladder.beforeEstop,
      afterEstop: ladder.afterEstop,
      screenshot: ladder.shotPath,
      pass: outputsDeenergized(ladder.afterEstop),
    };

    const conveyor = await verifyConveyor(browser);
    report.simulators.conveyor = {
      beforeEstop: conveyor.beforeEstop,
      afterEstop: conveyor.afterEstop,
      screenshot: conveyor.shotPath,
      pass: outputsDeenergized(conveyor.afterEstop),
    };
  } finally {
    await browser.close();
  }

  await writeFile(path.join(OUT, "verify-report.json"), JSON.stringify(report, null, 2));

  console.log("\n=== LIVE E-STOP SCREENSHOT VERIFY ===\n");
  for (const [name, sim] of Object.entries(report.simulators)) {
    console.log(`${name.toUpperCase()}:`);
    console.log(`  Before E-stop: ${JSON.stringify(sim.beforeEstop)}`);
    console.log(`  After E-stop:  ${JSON.stringify(sim.afterEstop)}`);
    console.log(`  Screenshot:    ${sim.screenshot}`);
    console.log(`  PASS:          ${sim.pass ? "YES — outputs de-energized" : "NO — outputs still on"}\n`);
  }

  const allPass = Object.values(report.simulators).every((s) => s.pass);
  process.exit(allPass ? 0 : 1);
}

main();
