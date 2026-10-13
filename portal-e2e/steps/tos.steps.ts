import { expect } from '@playwright/test';
import { Given, Then } from '../fixtures';

Given('重新查詢的回應會延遲', async ({ portal }) => {
  // 只延遲「存檔之後」的自動重查，讓存檔訊息在被清空前看得到（README「已知地雷」）
  await portal.delayData(3_000, (url) => /\/tos\/data/.test(url) && portal.lastSaveAt > 0);
  portal.skipResponseWait = false;
});

Then('條款區塊應該隱藏', async ({ tosPage }) => {
  await expect(tosPage.form).toBeHidden();
});

Then('條款區塊應該顯示', async ({ tosPage }) => {
  await expect(tosPage.form).toBeVisible();
});

Then('服務條款版次應該顯示 {string}', async ({ tosPage }, ver: string) => {
  await expect(tosPage.version).toHaveText(ver);
});

Then('目前內容應該顯示 {string}', async ({ tosPage }, text: string) => {
  await expect(tosPage.currentContent).toContainText(text);
});

Then('目前內容應該分行顯示 {string} 與 {string}', async ({ tosPage }, first: string, second: string) => {
  await expect(tosPage.currentContent).toContainText(first);
  const lines = (await tosPage.currentContent.innerText()).split('\n').map((l) => l.trim());
  expect(lines.indexOf(first)).toBeGreaterThanOrEqual(0);
  expect(lines.indexOf(second)).toBe(lines.indexOf(first) + 1);
});

Then('目前內容不應該有粗體文字', async ({ tosPage }) => {
  await expect(tosPage.currentContent.locator('b')).toHaveCount(0);
});

Then('編輯欄位應該隱藏', async ({ tosPage }) => {
  await expect(tosPage.editArea).toBeHidden();
});

Then('條款區塊不應該有可輸入版次的欄位', async ({ tosPage }) => {
  await expect(tosPage.form).toBeVisible();
  await expect(tosPage.version).toHaveJSProperty('tagName', 'B');
  await expect(tosPage.form.locator('input[id*="ver" i], select[id*="ver" i]')).toHaveCount(0);
});

Then('畫面上不應該有修改舊版次的按鈕', async ({ tosPage }) => {
  await expect(tosPage.form.locator('button:visible')).toHaveText(['建立新版次']);
});

Then('等自動重查完成後訊息區仍應該顯示以 {string} 開頭的訊息', async ({ portal, tosPage }, prefix: string) => {
  await portal.waitForRequeryAfterSave(/\/tos\/data/);
  await expect(tosPage.msg).toHaveText(new RegExp(`^${prefix}`));
});
