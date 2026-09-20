import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const outputDir = path.resolve("artifacts/qa");
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});

const checks = [
  { name: "mobile-welcome", width: 390, height: 844, entered: false },
  { name: "mobile-today", width: 390, height: 844, entered: true },
  { name: "tablet-today", width: 820, height: 1180, entered: true },
  { name: "desktop-today", width: 1440, height: 1000, entered: true },
];

const results = [];
for (const check of checks) {
  const context = await browser.newContext({ viewport: { width: check.width, height: check.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  if (check.entered) {
    await page.addInitScript(() => {
      localStorage.setItem("daziwu:v2:guest-session", JSON.stringify({ id: "visual-qa", createdAt: new Date().toISOString() }));
      localStorage.removeItem("daziwu:v2:guest-state");
    });
  } else {
    await page.addInitScript(() => {
      localStorage.removeItem("daziwu:v2:guest-session");
      localStorage.removeItem("daziwu:v2:guest-state");
    });
  }
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText ?? "unknown"}`);
  });
  await page.goto("http://localhost:3100", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.body.innerText.trim().length > 20);
  const overflow = await page.evaluate(() => ({
    horizontal: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  await page.screenshot({ path: path.join(outputDir, `${check.name}.png`), fullPage: true });
  results.push({
    ...check,
    overflow,
    pageErrors,
    consoleErrors,
    failedRequests,
    title: await page.title(),
    bodyText: (await page.locator("body").innerText()).slice(0, 120),
  });
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
