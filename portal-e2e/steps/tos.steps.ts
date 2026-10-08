import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { Given, When, Then } from '../fixtures';

/** US-TOS-*（SRS 4.6）服務條款設定。mock 觸發值見 mockoon/routes/tos.json */

Given('我在服務條款設定頁', async ({ tosPage }) => {
  await tosPage.goto();
  await expect(tosPage.queryButton).toBeVisible();
});

// ---------- 查詢與三種狀態（S1 新增／S2 檢視／S3 新版次） ----------

When('我查詢商家 {string} 的服務條款', async ({ tosPage }, merchantID: string) => {
  await tosPage.query(merchantID);
});

Then('服務條款表單應該顯示', async ({ tosPage }) => {
  await expect(tosPage.form).toBeVisible();
});

Then('服務條款表單應該隱藏', async ({ tosPage }) => {
  await expect(tosPage.form).toBeHidden();
});

Then('服務條款版次應該顯示 {string}', async ({ tosPage }, version: string) => {
  await expect(tosPage.verShow).toHaveText(version);
});

Then('目前內容應該包含 {string}', async ({ tosPage }, text: string) => {
  await expect(tosPage.curContent).toContainText(text);
});

Then('目前內容應該包含多行文字:', async ({ tosPage }, table: DataTable) => {
  // <pre> 保留 \n，逐行比對確認換行真的有呈現（不是被接成一行）
  const lines = (await tosPage.curContent.innerText()).split('\n').map((s) => s.trim());
  for (const [want] of table.raw()) {
    expect(lines).toContain(want.trim());
  }
});

Then('編輯區應該顯示', async ({ tosPage }) => {
  await expect(tosPage.editArea).toBeVisible();
});

Then('編輯區應該隱藏', async ({ tosPage }) => {
  await expect(tosPage.editArea).toBeHidden();
});

Then('{string} 按鈕應該顯示', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
});

Then('{string} 按鈕應該隱藏', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name, exact: true })).toBeHidden();
});

// ---------- 編輯與存檔 ----------

When(
  '我填入生效日期 {string} 內容 {string} 註記 {string}',
  async ({ tosPage }, startDate: string, content: string, note: string) => {
    await tosPage.startDate.fill(startDate);
    await tosPage.content.fill(content);
    await tosPage.note.fill(note);
  },
);

When('我按下 {string}', async ({ page, tosPage }, name: string) => {
  if (name === '存檔') {
    // 存檔成功後會自動重查，重查 callback 會清空 #msg（P-TOS-09）；延遲重查回應讓存檔訊息可被斷言
    await tosPage.delayNextRequery();
  }
  await page.getByRole('button', { name, exact: true }).click();
});

When('自動重查完成', async ({ page }) => {
  // 等被延遲的 /tos/data 回應處理完（networkidle = 500ms 沒有新請求）
  await page.waitForLoadState('networkidle');
});

Then('服務條款內容欄位應該是空的', async ({ tosPage }) => {
  await expect(tosPage.content).toHaveValue('');
});

Then('註記欄位應該是空的', async ({ tosPage }) => {
  await expect(tosPage.note).toHaveValue('');
});

Then('存檔訊息應該包含 {string}', async ({ tosPage }, text: string) => {
  await expect(tosPage.msg).toContainText(text);
});

Then('存檔訊息應該是空的', async ({ tosPage }) => {
  await expect(tosPage.msg).toHaveText('');
});
