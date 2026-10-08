import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { Given, When, Then } from '../fixtures';
import { dataRows, expectHeaders, expectTableContains } from './support/htmlTable';

/** US-CSR-*（SRS 4.8）CSR 交易查詢。mock 觸發值見 mockoon/routes/csr.json */

Given('我在 CSR 交易查詢頁', async ({ csrPage }) => {
  await csrPage.goto();
  await expect(csrPage.queryButton).toBeVisible();
});

Then('門號欄位值應該是 {string}', async ({ csrPage }, value: string) => {
  await expect(csrPage.msisdn).toHaveValue(value);
});

When('我查詢門號 {string}', async ({ csrPage }, msisdn: string) => {
  await csrPage.query(msisdn);
});

// ---------- 交易表（第一張）與退款表（第二張） ----------

Then('交易表格應該有 {int} 筆資料', async ({ csrPage }, count: number) => {
  await expect(dataRows(csrPage.transTable)).toHaveCount(count);
});

Then(
  '交易表格應該有 {int} 個欄位且第一欄是 {string} 最後一欄是 {string}',
  async ({ csrPage }, count: number, first: string, last: string) => {
    await expectHeaders(csrPage.transTable, count, first, last);
  },
);

Then('交易表格應該包含以下資料:', async ({ csrPage }, table: DataTable) => {
  await expectTableContains(csrPage.transTable, table.hashes());
});

Then('交易表格應該包含商品名稱 {string}', async ({ csrPage }, name: string) => {
  await expect(csrPage.transTable).toContainText(name);
});

Then('交易表格第 {int} 筆的 TXID 應該是 {string}', async ({ csrPage }, index: number, txid: string) => {
  // TXID 是第一欄；P-CSR-03：依 TX_DT 降冪，最新在最上
  const row = dataRows(csrPage.transTable).nth(index - 1);
  await expect(row.locator('td').first()).toHaveText(txid);
});

Then('退款表格應該有 {int} 筆資料', async ({ csrPage }, count: number) => {
  await expect(dataRows(csrPage.refundTable)).toHaveCount(count);
});

Then(
  '退款表格應該有 {int} 個欄位且第一欄是 {string} 最後一欄是 {string}',
  async ({ csrPage }, count: number, first: string, last: string) => {
    await expectHeaders(csrPage.refundTable, count, first, last);
  },
);
