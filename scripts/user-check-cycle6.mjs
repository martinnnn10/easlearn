import { chromium, devices } from "playwright";

const BASE = "http://127.0.0.1:3001";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();
await page.goto(`${BASE}/courses/hvac-fundamentals/refrigeration-cycle?qa=full`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForSelector(".lesson-card-player", { timeout: 20000 });
await page.getByRole("button", { name: /accept/i }).click({ timeout: 2000 }).catch(() => {});
const nextBtn = page.locator(".lesson-card-player").getByRole("button", { name: /Next/i });
await nextBtn.click({ timeout: 10000 });
await page.waitForTimeout(500);
const card2 = await page.evaluate(() => ({
  heading: document.querySelector(".lesson-card-stage h2, .lesson-card-stage h3")?.textContent?.trim(),
  svgCount: document.querySelectorAll(".lesson-diagram-block svg, .lesson-card-stage svg").length,
  hasPh: /P-h|pressure-enthalpy|enthalpy diagram/i.test(document.body.innerText),
}));
console.log("CARD 2 (after Next from card 1):", JSON.stringify(card2, null, 2));
await page.screenshot({ path: "qa-screenshots/cycle6/ref-card2-mobile.png" });

const legacy = await ctx.newPage();
await legacy.goto(`${BASE}/courses/motors-controls/motor-theory?qa=full`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await legacy.waitForSelector("h1", { timeout: 20000 });
await legacy.evaluate(() => window.scrollTo(0, 1200));
await legacy.waitForTimeout(500);
const bar = await legacy.evaluate(() => ({
  visible: Boolean(document.querySelector(".lesson-reading-progress")),
  progress: document.querySelector(".lesson-reading-progress")?.getAttribute("aria-valuenow"),
  barTop: document.querySelector(".lesson-reading-progress")?.getBoundingClientRect().top,
  navBottom: document.querySelector("header")?.getBoundingClientRect().bottom,
}));
console.log("LEGACY BAR:", JSON.stringify(bar, null, 2));
await legacy.screenshot({ path: "qa-screenshots/cycle6/legacy-progress-mobile-check.png" });
await browser.close();
