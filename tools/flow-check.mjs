import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const outputDir = path.resolve("artifacts/qa");
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));

await page.addInitScript(() => {
  if (!sessionStorage.getItem("daziwu:qa-initialized")) {
    localStorage.removeItem("daziwu:v2:guest-session");
    localStorage.removeItem("daziwu:v2:guest-state");
    sessionStorage.setItem("daziwu:qa-initialized", "true");
  }
});
await page.goto("http://localhost:3100", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "直接进入梧桐里 3B" }).click();
await assertVisibleText(page, "今日待办");

await page.getByRole("button", { name: /记一笔费用/ }).click();
await assertVisibleText(page, "记一笔共同费用");
await page.getByLabel("费用名称").fill("夜间电费");
await page.getByLabel("总金额").fill("10.01");
await assertVisibleText(page, "¥2.51");
await page.screenshot({ path: path.join(outputDir, "mobile-expense-modal.png") });
await page.getByRole("button", { name: "确认并保存费用" }).click();
await assertStatus(page, "费用已保存");
await waitForStatusGone(page);

await page.locator(".mobile-nav button").filter({ hasText: "费用" }).click();
await assertVisibleText(page, "费用账本");
await assertVisibleText(page, "夜间电费");
await page.screenshot({ path: path.join(outputDir, "mobile-expenses.png"), fullPage: true });
await page.getByRole("button", { name: "记录已转账" }).click();
await assertStatus(page, "已记录结算");
await waitForStatusGone(page);

await page.locator(".mobile-nav button").filter({ hasText: "家务" }).click();
await assertVisibleText(page, "家务排班");
await page.screenshot({ path: path.join(outputDir, "mobile-chores.png"), fullPage: true });
await page.getByRole("button", { name: "完成任务" }).click();
await assertStatus(page, "下一轮由阿哲负责");
await waitForStatusGone(page);

await page.locator(".mobile-nav button").filter({ hasText: "用品" }).click();
await page.getByRole("button", { name: "认领采购" }).first().click();
await assertStatus(page, "其他室友不会重复购买");
await waitForStatusGone(page);
await page.getByRole("button", { name: "完成采购并入库" }).click();
await assertVisibleText(page, "完成抽纸采购");
await page.screenshot({ path: path.join(outputDir, "mobile-purchase-modal.png") });
await page.getByRole("button", { name: "确认入库并记账" }).click();
await assertStatus(page, "共同费用只生成了一次");
await waitForStatusGone(page);
await page.screenshot({ path: path.join(outputDir, "mobile-supplies-after.png"), fullPage: true });

await page.reload({ waitUntil: "networkidle" });
await assertVisibleText(page, "今日待办");
await page.locator(".mobile-nav button").filter({ hasText: "费用" }).click();
await assertVisibleText(page, "费用账本");
assert.equal(await page.getByText("抽纸补货", { exact: true }).count(), 2, "原始账目和本次采购应各有一笔抽纸补货");
assert.equal(await page.getByText("夜间电费", { exact: true }).count(), 1, "新增费用应持久化且不重复");

await page.locator(".mobile-nav button").filter({ hasText: "今天" }).evaluate((button) => button.click());
await assertVisibleText(page, "今日待办");
await assertVisibleText(page, "一句话记账、调家务、报缺货");
await page.getByRole("button", { name: /一句话记账、调家务、报缺货/ }).click();
await assertVisibleText(page, "AI 理解意图，程序核算并执行");
await page.getByRole("button", { name: "生成确认单" }).click();
await assertVisibleText(page, "林一 ¥9.00、周周 ¥9.00、许言 ¥9.00、阿哲 ¥9.00");
await page.waitForFunction(() => getComputedStyle(document.querySelector(".assistant-confirm")).opacity === "1");
await page.screenshot({ path: path.join(outputDir, "mobile-ai-confirmation.png") });
await page.getByRole("button", { name: "确认执行" }).click();
await assertStatus(page, "费用已保存");
await waitForStatusGone(page);
await page.locator(".mobile-nav button").filter({ hasText: "费用" }).click();
await assertVisibleText(page, "牛奶");

await page.locator(".mobile-nav button").filter({ hasText: "更多" }).click();
await assertVisibleText(page, "小屋管理");
await page.screenshot({ path: path.join(outputDir, "mobile-more.png"), fullPage: true });
await page.getByRole("button", { name: /通知与安静时段/ }).click();
await assertVisibleText(page, "只有需要行动时才提醒");
await page.getByLabel(/费用待结算提醒/).uncheck();
await page.getByRole("button", { name: "保存偏好" }).click();
await assertStatus(page, "通知偏好已保存在本机");

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
assert.equal(overflow, false, "移动端不应出现横向溢出");
assert.deepEqual(pageErrors, [], "页面运行错误应为 0");
assert.deepEqual(consoleErrors, [], "控制台错误应为 0");

console.log(JSON.stringify({
  status: "passed",
  flows: ["访客进入", "整数分分摊", "新增费用", "结算", "完成家务", "认领采购", "入库并自动记账", "刷新后持久化", "AI 意图确认后记账", "通知偏好"],
  pageErrors,
  consoleErrors,
}, null, 2));

await context.close();
await browser.close();

async function assertVisibleText(targetPage, text) {
  await targetPage.getByText(text, { exact: false }).first().waitFor({ state: "visible" });
}

async function assertStatus(targetPage, text) {
  await targetPage.getByRole("status").filter({ hasText: text }).waitFor({ state: "visible" });
}

async function waitForStatusGone(targetPage) {
  await targetPage.getByRole("status").waitFor({ state: "hidden" });
}
