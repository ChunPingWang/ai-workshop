import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';

/**
 * 跨頁共用句型：開頁、導覽、輸入、按鈕、區域與標題斷言。
 * 一律透過 portal.current（依網址判斷目前頁面）取 Page Object，標籤對照表在 pages/*Page.ts。
 */

// ---------- 開頁與導覽 ----------

Given('我在 {string} 頁面', async ({ portal, page }, name: string) => {
  await portal.open(name);
  await expect(page).not.toHaveURL(/\/(login|doLogin)/);
  await expect(portal.current.heading).toBeVisible();
});

When('我直接開啟 {string} 頁面', async ({ portal }, name: string) => {
  await portal.open(name);
});

When('我直接開啟網址 {string}', async ({ page }, url: string) => {
  await page.goto(url);
});

When('我點選導覽列的 {string}', async ({ portal }, text: string) => {
  await portal.current.gotoNav(text);
});

When('我重新整理頁面', async ({ page }) => {
  await page.reload();
});

Then('頁面標題應該是 {string}', async ({ portal }, title: string) => {
  await expect(portal.current.heading).toHaveText(title);
});

Then('我應該仍在 {string} 頁面', async ({ portal }, name: string) => {
  const want = new URL(portal.pathOf(name), 'http://x');
  await expect.poll(() => portal.currentPath()).toBe(want.pathname + want.search);
  await expect(portal.current.heading).toBeVisible();
});

// ---------- 輸入與按鈕 ----------

When(/^我輸入(生效日期|服務條款內容|銀行代碼|銀行帳號) "([^"]*)"$/, async ({ portal }, label: string, value: string) => {
  await portal.current.field(label).fill(value);
});

When('我按下 {string}', async ({ portal }, label: string) => {
  await portal.press(label);
});

Then('應該看得到 {string} 按鈕', async ({ portal }, label: string) => {
  await expect(portal.current.button(label)).toBeVisible();
});

// ---------- 區域斷言 ----------

Then('{string} 應該顯示 {string}', async ({ portal }, area: string, text: string) => {
  await expect(portal.current.area(area)).toContainText(text);
});

Then('{string} 應該包含 {string}', async ({ portal }, area: string, text: string) => {
  await expect(portal.current.area(area)).toContainText(text);
});

// ---------- 標題列 ----------

Then('標題列應該顯示 {string}', async ({ portal }, text: string) => {
  await expect(portal.current.topbar).toBeVisible();
  await expect.poll(() => portal.current.topbarText()).toBe(text);
});

Then('標題列不應該顯示任何帳號', async ({ portal }) => {
  // 先確認標題列已渲染，再斷言帳號／角色兩個 span 都是空的
  await expect(portal.current.topbar).toContainText('new-pay Portal');
  const spans = portal.current.topbar.locator('span');
  await expect(spans).toHaveCount(2);
  await expect(spans.nth(0)).toHaveText('');
  await expect(spans.nth(1)).toHaveText('');
});
