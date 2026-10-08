import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';

/** US-RPT-*／US-RFD-*（SRS 4.3／4.4）交易與退款報表。mock 觸發值見 mockoon/routes/report.json */

Given('我在交易報表頁', async ({ reportPage }) => {
  await reportPage.goto('trans');
  await expect(reportPage.queryButton).toBeVisible();
});

When('我前往退款報表頁', async ({ reportPage }) => {
  await reportPage.goto('refund');
  await expect(reportPage.queryButton).toBeVisible();
});

// ---------- 初始狀態 ----------

Then('商家欄位應該顯示且值為 {string}', async ({ reportPage }, value: string) => {
  await expect(reportPage.merchantId).toBeVisible();
  await expect(reportPage.merchantId).toHaveValue(value);
});

Then('時間類型應該選在 {string}', async ({ reportPage }, label: string) => {
  await expect(reportPage.timeType.locator('option:checked')).toHaveText(label);
});

Then('日期起訖欄位應該是 {int} 碼數字', async ({ reportPage }, digits: number) => {
  const pattern = new RegExp(`^\\d{${digits}}$`);
  await expect(reportPage.fromDate).toHaveValue(pattern);
  await expect(reportPage.toDate).toHaveValue(pattern);
});

Then('起始小時應該選在 {string}', async ({ reportPage }, value: string) => {
  await expect(reportPage.fromHour).toHaveValue(value);
});

Then('結束小時應該選在 {string}', async ({ reportPage }, value: string) => {
  await expect(reportPage.toHour).toHaveValue(value);
});

Then(
  '起始小時下拉應該有 {int} 個選項且第一個是 {string} 最後一個是 {string}',
  async ({ reportPage }, count: number, first: string, last: string) => {
    const options = reportPage.fromHour.locator('option');
    await expect(options).toHaveCount(count);
    await expect(options.first()).toHaveText(first);
    await expect(options.last()).toHaveText(last);
  },
);

Then(
  '結束小時下拉應該有 {int} 個選項且第一個是 {string} 最後一個是 {string}',
  async ({ reportPage }, count: number, first: string, last: string) => {
    const options = reportPage.toHour.locator('option');
    await expect(options).toHaveCount(count);
    await expect(options.first()).toHaveText(first);
    await expect(options.last()).toHaveText(last);
  },
);

Then('商家與時間類型欄位應該隱藏', async ({ reportPage }) => {
  await expect(reportPage.transOnly).toBeHidden();
});

// ---------- 查詢動作 ----------

When('我把商家欄位改成 {string} 並按下查詢', async ({ reportPage }, merchantId: string) => {
  await reportPage.merchantId.fill(merchantId);
  await reportPage.query();
});

When('我清空商家欄位並按下查詢', async ({ reportPage }) => {
  await reportPage.merchantId.fill('');
  await reportPage.query();
});

When('我把起始日期改成 {string} 並按下查詢', async ({ reportPage }, fromDate: string) => {
  await reportPage.fromDate.fill(fromDate);
  await reportPage.query();
});

When(
  '我把起始日期改成 {string} 且結束日期改成 {string} 並按下查詢',
  async ({ reportPage }, fromDate: string, toDate: string) => {
    await reportPage.fromDate.fill(fromDate);
    await reportPage.toDate.fill(toDate);
    await reportPage.query();
  },
);

When('我把時間類型改成 {string} 並按下查詢', async ({ reportPage }, label: string) => {
  await reportPage.timeType.selectOption({ label });
  await reportPage.query();
});

// ---------- 結果呈現 ----------

Then('結果區應該出現粗體文字 {string}', async ({ reportPage }, text: string) => {
  // Portal 用 $('#result').html(data) 塞回應、不轉義（P-COM-25），<b> 會真的變粗體元素
  await expect(reportPage.result.locator('b', { hasText: text })).toBeVisible();
});

Then('結果區應該先顯示 {string} 再顯示查詢結果', async ({ page, reportPage }, interim: string) => {
  // 延遲一次 /report/data 回應，讓「查詢中...」的中間狀態留得住、可被斷言（P-COM-27）
  await page.route(
    '**/report/data*',
    async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.continue();
    },
    { times: 1 },
  );
  await reportPage.queryButton.click();
  await expect(reportPage.result).toHaveText(interim);
  await reportPage.waitForResult(reportPage.result);
  await expect(reportPage.resultTable).toBeVisible();
});
