/**
 * Authenticated Relay Simulator visual QA.
 * Mocks subscriber session via tRPC intercept (no DATABASE_URL required).
 * Run: QA_BASE_URL=http://localhost:3000 node scripts/relay-authenticated-qa.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const OUT = path.join(__dirname, "..", "qa-screenshots", "fullstack");

const MOCK_USER = {
  id: 9001,
  openId: "qa-relay-openid",
  name: "QA Relay Subscriber",
  email: "qa-relay@easlearn.test",
  role: "user",
  subscriptionTier: "pro",
  subscriptionStatus: "active",
};

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.route("**/api/trpc/**", async (route) => {
    const url = route.request().url();
    if (url.includes("auth.me")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ result: { data: { json: MOCK_USER } } }]),
      });
    }
    if (url.includes("stripe.getSubscription")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            result: {
              data: {
                json: {
                  tier: "pro",
                  status: "active",
                  hasActiveSubscription: true,
                  isTrial: false,
                  trialDaysRemaining: null,
                  trialEndsAt: null,
                  trialStartAt: null,
                  trialExpired: false,
                  stripeCustomerId: null,
                },
              },
            },
          },
        ]),
      });
    }
    return route.continue();
  });

  await page.goto(`${BASE}/labs#relay`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByRole("button", { name: /accept all/i }).click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const paywall = await page.getByText(/subscribe to unlock/i).count();
  const coilText = await page.getByText(/COIL/i).count();
  const viewStd = await page.getByRole("link", { name: /view standard/i }).count();
  const diagramSvg = await page.locator(".electrical-diagram svg, svg.electrical-diagram").count();
  const anySvg = await page.locator("svg").count();

  const shot = path.join(OUT, "relay-authenticated-subscriber.png");
  await page.screenshot({ path: shot, fullPage: true });

  const failures = [];
  if (paywall > 0) failures.push("Paywall still visible for mocked subscriber");
  if (viewStd === 0) failures.push("View Standard link missing");
  if (anySvg < 5) failures.push(`Insufficient SVG (${anySvg})`);
  if (coilText === 0) failures.push("Relay coil label not visible");

  const trpcHtml = consoleErrors.filter((t) => /Unexpected token|not valid JSON/i.test(t));

  const report = {
    pass: failures.length === 0 && trpcHtml.length === 0,
    paywallVisible: paywall > 0,
    viewStandardLinks: viewStd,
    coilLabels: coilText,
    svgCount: anySvg,
    diagramSvg,
    screenshot: shot,
    failures,
    consoleErrors: consoleErrors.slice(0, 10),
    trpcHtmlErrors: trpcHtml,
    note: "Subscriber session mocked via tRPC route intercept",
  };

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  process.exit(report.pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
