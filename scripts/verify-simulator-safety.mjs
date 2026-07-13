/**
 * Simulator safety logic audit — browser verification with DOM coil reads.
 * Run: pnpm exec tsx scripts/verify-simulator-safety.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3001";
const OUT = path.join(__dirname, "..", "qa-screenshots", "simulator-safety-audit");
const MOTOR_TIMER_MS = 4000;

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

function allOutputsOff(coils) {
  const keys = ["RUN_CMD", "SAFE_RUN", "MOTOR", "GREEN LT", "GREEN", "RED LT", "RED"];
  return keys.every((k) => !coils[k]);
}

function motorRunning(coils) {
  return Boolean(coils.MOTOR);
}

async function clickLadderInput(page, label) {
  const btn = page.locator("button").filter({ hasText: new RegExp(label, "i") }).first();
  await btn.click();
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

async function runLadderToMotor(page) {
  await ensureLadderInputOff(page, "STOP PB");
  await ensureLadderInputOff(page, "E-STOP");
  await ensureLadderInputOff(page, "GUARD SW");
  await ensureLadderInputOff(page, "OL TRIP");
  await ensureLadderInputOn(page, "START PB");
  await page.waitForTimeout(MOTOR_TIMER_MS);
  let coils = await readCoils(page);
  if (!motorRunning(coils)) {
    await ensureLadderInputOff(page, "START PB");
    await page.waitForTimeout(600);
    coils = await readCoils(page);
  }
  return coils;
}

async function auditLadderLogic(page) {
  const results = { name: "Ladder Logic Simulator", tests: {} };

  await page.goto(`${BASE}/labs?qa=full#ladder`, { waitUntil: "networkidle", timeout: 60000 });
  await dismissCookies(page);
  await page.waitForTimeout(1200);
  await page.waitForSelector("[data-safety-coil]", { timeout: 15000 });

  // TEST 1 — E-STOP
  let coils = await runLadderToMotor(page);
  const running = motorRunning(coils);
  if (running) {
    await ensureLadderInputOn(page, "E-STOP");
    await page.waitForTimeout(500);
    coils = await readCoils(page);
    const pass = allOutputsOff(coils) && !coils.RUN_CMD && !coils.SAFE_RUN;
    results.tests.estop = {
      pass,
      detail: pass
        ? "E-stop actuated → RUN_CMD, SAFE_RUN, MOTOR all OFF"
        : `After E-stop: ${JSON.stringify(coils)}`,
    };
  } else {
    results.tests.estop = { pass: false, detail: `Could not reach motor running state: ${JSON.stringify(coils)}` };
  }

  // Reset inputs for next tests
  await ensureLadderInputOff(page, "E-STOP");
  await ensureLadderInputOff(page, "GUARD SW");
  await ensureLadderInputOff(page, "STOP PB");
  await ensureLadderInputOff(page, "OL TRIP");
  await page.waitForTimeout(400);

  // TEST 2 — GUARD
  coils = await runLadderToMotor(page);
  if (motorRunning(coils)) {
    await ensureLadderInputOn(page, "GUARD SW");
    await page.waitForTimeout(500);
    coils = await readCoils(page);
    const guardBlocks = !coils.SAFE_RUN && !coils.MOTOR;
    await ensureLadderInputOn(page, "START PB");
    await page.waitForTimeout(800);
    const coilsAfterStart = await readCoils(page);
    const cannotRestart = !coilsAfterStart.MOTOR;
    results.tests.guard = {
      pass: guardBlocks && cannotRestart,
      detail: guardBlocks
        ? cannotRestart
          ? "Guard open drops SAFE_RUN/MOTOR; START cannot restart"
          : `Motor restarted with guard open: ${JSON.stringify(coilsAfterStart)}`
        : `Guard open did not drop outputs: ${JSON.stringify(coils)}`,
    };
    await ensureLadderInputOff(page, "GUARD SW");
    await page.waitForTimeout(300);
  } else {
    results.tests.guard = { pass: false, detail: "Could not establish running state" };
  }

  // TEST 3 — SEAL-IN
  await ensureLadderInputOff(page, "STOP PB");
  await ensureLadderInputOff(page, "E-STOP");
  await ensureLadderInputOff(page, "GUARD SW");
  await ensureLadderInputOn(page, "START PB");
  await page.waitForTimeout(600);
  let sealHeld = (await readCoils(page)).RUN_CMD;
  await ensureLadderInputOff(page, "START PB");
  await page.waitForTimeout(600);
  sealHeld = sealHeld && (await readCoils(page)).RUN_CMD;
  await ensureLadderInputOn(page, "STOP PB");
  await page.waitForTimeout(500);
  const afterStop = await readCoils(page);
  results.tests.sealin = {
    pass: sealHeld && !afterStop.RUN_CMD && !afterStop.MOTOR,
    detail: sealHeld
      ? !afterStop.RUN_CMD
        ? "Seal-in held after START release; STOP cleared RUN_CMD"
        : `STOP failed to break seal-in: ${JSON.stringify(afterStop)}`
      : "Seal-in did not hold after START release",
  };
  await ensureLadderInputOff(page, "STOP PB");

  // TEST 4 — OL TRIP
  coils = await runLadderToMotor(page);
  if (motorRunning(coils)) {
    await ensureLadderInputOn(page, "OL TRIP");
    await page.waitForTimeout(500);
    const afterOl = await readCoils(page);
    const motorOff = !afterOl.MOTOR;
    await ensureLadderInputOn(page, "START PB");
    await page.waitForTimeout(800);
    const afterStartOl = await readCoils(page);
    const needsReset = !afterStartOl.MOTOR;
    results.tests.ol = {
      pass: motorOff && needsReset,
      detail: motorOff
        ? needsReset
          ? "OL trip de-energized motor; restart blocked until OL cleared"
          : "Motor restarted with OL still tripped"
        : `Motor still on after OL trip: ${JSON.stringify(afterOl)}`,
    };
    await ensureLadderInputOff(page, "OL TRIP");
  } else {
    results.tests.ol = { pass: false, detail: "Could not establish running state" };
  }

  results.tests.vfdFault = { pass: true, detail: "N/A" };
  return results;
}

async function openConveyorLab(page) {
  await page.goto(`${BASE}/labs#conveyor-troubleshoot`, { waitUntil: "networkidle", timeout: 60000 });
  await dismissCookies(page);
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /^learn$/i }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Normal/i }).click().catch(() => {});
  await page.waitForTimeout(400);
}

async function releaseConveyorStop(page) {
  const pressed = await page.evaluate(() =>
    Array.from(document.querySelectorAll("div")).some(
      (el) => el.textContent?.includes("STOP PB") && el.textContent?.includes("STOP PRESSED")
    )
  );
  if (pressed) await page.getByRole("button", { name: /^STOP$/i }).first().click();
}

async function runConveyorToMotor(page) {
  await releaseConveyorStop(page);
  await page.getByRole("button", { name: /^START$/i }).first().click();
  await page.waitForTimeout(MOTOR_TIMER_MS);
  return readCoils(page);
}

async function auditConveyor(page) {
  const results = { name: "Conveyor PLC Diagnostic Lab", tests: {} };
  await openConveyorLab(page);
  await page.waitForSelector("[data-safety-coil]", { timeout: 15000 });

  let coils = await runConveyorToMotor(page);
  if (!motorRunning(coils)) {
    results.tests.estop = { pass: false, detail: `Motor never energized: ${JSON.stringify(coils)}` };
    results.tests.guard = { pass: false, detail: "Skipped — no running state" };
    results.tests.sealin = { pass: false, detail: "Skipped — no running state" };
    results.tests.ol = { pass: false, detail: "Skipped — no running state" };
    results.tests.vfdFault = { pass: true, detail: "N/A" };
    return results;
  }

  // TEST 1 E-STOP
  await page.getByRole("button", { name: /ACTUATE E-STOP/i }).click();
  await page.waitForTimeout(500);
  coils = await readCoils(page);
  results.tests.estop = {
    pass: allOutputsOff(coils) && !coils.RUN_CMD && !coils.SAFE_RUN,
    detail: `After E-stop: ${JSON.stringify(coils)}`,
  };

  await page.getByRole("button", { name: /RESET E-STOP/i }).click();
  await page.waitForTimeout(400);
  coils = await runConveyorToMotor(page);

  // TEST 2 GUARD
  if (motorRunning(coils)) {
    await page.getByRole("button", { name: /TOGGLE GUARD/i }).click();
    await page.waitForTimeout(500);
    const afterGuard = await readCoils(page);
    await page.getByRole("button", { name: /^START$/i }).first().click();
    await page.waitForTimeout(800);
    const afterStart = await readCoils(page);
    results.tests.guard = {
      pass: !afterGuard.SAFE_RUN && !afterGuard.MOTOR && !afterStart.MOTOR,
      detail: `Guard open: ${JSON.stringify(afterGuard)}; restart attempt: ${JSON.stringify(afterStart)}`,
    };
    await page.getByRole("button", { name: /TOGGLE GUARD/i }).click();
    await page.waitForTimeout(300);
  } else {
    results.tests.guard = { pass: false, detail: "No running state after E-stop reset" };
  }

  // TEST 3 SEAL-IN
  coils = await runConveyorToMotor(page);
  const runCmdDuringStart = (await readCoils(page)).RUN_CMD;
  await page.waitForTimeout(500);
  const runCmdAfterPulse = (await readCoils(page)).RUN_CMD;
  await page.getByRole("button", { name: /^STOP$/i }).first().click();
  await page.waitForTimeout(500);
  const afterStop = await readCoils(page);
  results.tests.sealin = {
    pass: runCmdDuringStart && runCmdAfterPulse && !afterStop.RUN_CMD && !afterStop.MOTOR,
    detail: `Seal during/after start: ${runCmdDuringStart}/${runCmdAfterPulse}; after STOP: ${JSON.stringify(afterStop)}`,
  };
  await releaseConveyorStop(page);
  await page.waitForTimeout(300);

  // TEST 4 OL
  coils = await runConveyorToMotor(page);
  if (motorRunning(coils)) {
    await page.getByRole("button", { name: /TRIP OL/i }).click();
    await page.waitForTimeout(500);
    const afterOl = await readCoils(page);
    await page.getByRole("button", { name: /^START$/i }).first().click();
    await page.waitForTimeout(800);
    const afterStartOl = await readCoils(page);
    results.tests.ol = {
      pass: !afterOl.MOTOR && !afterStartOl.MOTOR,
      detail: `After OL: ${JSON.stringify(afterOl)}; restart: ${JSON.stringify(afterStartOl)}`,
    };
    await page.getByRole("button", { name: /RESET OL/i }).click();
  } else {
    results.tests.ol = { pass: false, detail: "No running state for OL test" };
  }

  results.tests.vfdFault = { pass: true, detail: "N/A" };
  return results;
}

async function readDriveState(page) {
  return page.evaluate(() => {
    const line1 = document.querySelector('[data-drive-display="line1"]')?.textContent?.trim() || "";
    const line2 = document.querySelector('[data-drive-display="line2"]')?.textContent?.trim() || "";
    const freqText =
      document.querySelector('[data-drive-value="output-freq"]')?.textContent?.trim() || "0 Hz";
    const freq = parseFloat(freqText) || 0;
    return { line1, line2, freq };
  });
}

async function auditPowerFlex(page) {
  const results = { name: "PowerFlex VFD Lab", tests: {} };
  await page.goto(`${BASE}/labs#powerflex-diagnostic`, { waitUntil: "networkidle", timeout: 60000 });
  await dismissCookies(page);
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /^learn$/i }).click();
  await page.waitForTimeout(400);

  results.tests.estop = { pass: true, detail: "N/A — drive lab has no discrete E-stop ladder" };
  results.tests.guard = { pass: true, detail: "N/A" };
  results.tests.sealin = { pass: true, detail: "N/A" };
  results.tests.ol = { pass: true, detail: "N/A" };

  const faults = [
    { id: "F004", button: /F004.*DC Bus/i, code: "F004" },
    { id: "F006", button: /F006.*Cooling Fan/i, code: "F006" },
    { id: "F012", button: /F012.*Overcurrent/i, code: "F012" },
  ];

  const faultResults = [];
  for (const fault of faults) {
    await page.getByRole("button", { name: fault.button }).click();
    await page.waitForTimeout(600);
    const drive = await readDriveState(page);
    const codeOk = drive.line1.includes(fault.code);
    const outputOff = drive.freq === 0;
    const startHidden = !(await page.getByRole("button", { name: /▶ START/i }).isVisible().catch(() => false));
    faultResults.push({
      fault: fault.id,
      pass: codeOk && outputOff && startHidden,
      detail: `${drive.line1} | ${drive.line2} | freq=${drive.freq}Hz | startHidden=${startHidden}`,
    });
    await page.getByRole("button", { name: /Normal/i }).click().catch(() => {});
    await page.waitForTimeout(400);
  }

  const allFaultPass = faultResults.every((f) => f.pass);
  results.tests.vfdFault = {
    pass: allFaultPass,
    detail: faultResults.map((f) => `${f.fault}:${f.pass ? "PASS" : "FAIL"} (${f.detail})`).join("; "),
  };

  return results;
}

function formatReport(sim) {
  const t = sim.tests;
  return {
    simulator: sim.name,
    test1: t.estop,
    test2: t.guard,
    test3: t.sealin,
    test4: t.ol,
    test5: t.vfdFault,
    allPass: Object.values(t).every((x) => x.pass),
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const sims = [];
  for (const audit of [auditLadderLogic, auditConveyor, auditPowerFlex]) {
    try {
      sims.push(formatReport(await audit(page)));
    } catch (err) {
      sims.push({
        simulator: audit.name,
        error: err.message,
        allPass: false,
      });
    }
  }

  await browser.close();

  const report = { timestamp: new Date().toISOString(), base: BASE, simulators: sims };
  await writeFile(path.join(OUT, "simulator-safety-audit.json"), JSON.stringify(report, null, 2));

  console.log("\n=== SIMULATOR SAFETY AUDIT ===\n");
  for (const sim of sims) {
    console.log(`SIMULATOR: ${sim.simulator}`);
    if (sim.error) {
      console.log(`ERROR: ${sim.error}\n`);
      continue;
    }
    console.log(`TEST 1 E-STOP: ${sim.test1.pass ? "PASS" : "FAIL"} — ${sim.test1.detail}`);
    console.log(`TEST 2 GUARD: ${sim.test2.pass ? "PASS" : "FAIL"} — ${sim.test2.detail}`);
    console.log(`TEST 3 SEAL-IN: ${sim.test3.pass ? "PASS" : "FAIL"} — ${sim.test3.detail}`);
    console.log(`TEST 4 OL TRIP: ${sim.test4.pass ? "PASS" : "FAIL"} — ${sim.test4.detail}`);
    console.log(`TEST 5 VFD FAULT: ${sim.test5.pass ? "PASS" : "FAIL"} — ${sim.test5.detail}`);
    console.log(`RETESTED: ${sim.allPass ? "PASS" : "FAIL"}\n`);
  }

  const allPass = sims.every((s) => s.allPass);
  process.exit(allPass ? 0 : 1);
}

main();
