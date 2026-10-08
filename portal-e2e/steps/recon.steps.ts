import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { Given, When, Then } from '../fixtures';
import { dataRows, expectHeaders, expectTableContains } from './support/htmlTable';

/** US-RCN-*（SRS 4.5）對帳結果查詢。mock 觸發值見 mockoon/routes/recon.json */

Given('我在對帳查詢頁', async ({ reconPage }) => {
  await reconPage.goto();
  await expect(reconPage.queryButton).toBeVisible();
});

// ---------- 初始狀態 ----------

Then('對帳類型應該選在 {string}', async ({ reconPage }, label: string) => {
  await expect(reconPage.type.locator('option:checked')).toHaveText(label);
});

Then('對帳區間欄位值應該是 {string} 到 {string}', async ({ reconPage }, from: string, to: string) => {
  await expect(reconPage.from).toHaveValue(from);
  await expect(reconPage.to).toHaveValue(to);
});

Then('差異明細區應該是空白', async ({ reconPage }) => {
  await expect(reconPage.detail).toBeEmpty();
});

Then('對帳類型下拉應該恰好有選項:', async ({ reconPage }, table: DataTable) => {
  const labels = table.raw().map((row) => row[0]);
  await expect(reconPage.type.locator('option')).toHaveText(labels);
});

// ---------- 查詢動作 ----------

When('我把對帳類型改成 {string}', async ({ reconPage }, label: string) => {
  await reconPage.type.selectOption({ label });
});

When('我把對帳類型改成 {string} 並按下查詢', async ({ reconPage }, label: string) => {
  await reconPage.type.selectOption({ label });
  await reconPage.query();
});

When('我把對帳區間起改成 {string} 並按下查詢', async ({ reconPage }, from: string) => {
  await reconPage.from.fill(from);
  await reconPage.query();
});

When('我查詢差異明細 {string}', async ({ reconPage }, reconId: string) => {
  await reconPage.queryDetail(reconId);
});

// ---------- 差異明細結果 ----------

Then('差異明細表格應該有 {int} 筆資料', async ({ reconPage }, count: number) => {
  await expect(dataRows(reconPage.detailTable)).toHaveCount(count);
});

Then(
  '差異明細表格應該有 {int} 個欄位且第一欄是 {string} 最後一欄是 {string}',
  async ({ reconPage }, count: number, first: string, last: string) => {
    await expectHeaders(reconPage.detailTable, count, first, last);
  },
);

Then('差異明細表格應該包含以下資料:', async ({ reconPage }, table: DataTable) => {
  await expectTableContains(reconPage.detailTable, table.hashes());
});
