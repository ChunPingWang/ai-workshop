import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { Given, When, Then } from '../fixtures';
import { dataRows, expectTableContains } from './support/htmlTable';

/** US-BNK-*（SRS 4.7）商家銀行帳戶註冊。mock 觸發值見 mockoon/routes/bankacc.json */

Given('我在銀行帳戶頁', async ({ bankaccPage }) => {
  await bankaccPage.goto();
  await expect(bankaccPage.saveButton).toBeVisible();
});

// ---------- 初始狀態 ----------

Then('銀行代碼欄位應該是空的', async ({ bankaccPage }) => {
  await expect(bankaccPage.bankCode).toHaveValue('');
});

Then('銀行帳號欄位應該是空的', async ({ bankaccPage }) => {
  await expect(bankaccPage.bankAcc).toHaveValue('');
});

Then('幣別應該選在 {string}', async ({ bankaccPage }, label: string) => {
  await expect(bankaccPage.currency.locator('option:checked')).toHaveText(label);
});

Then('幣別下拉應該恰好有選項:', async ({ bankaccPage }, table: DataTable) => {
  const labels = table.raw().map((row) => row[0]);
  await expect(bankaccPage.currency.locator('option')).toHaveText(labels);
});

Then('外國銀行應該未勾選', async ({ bankaccPage }) => {
  await expect(bankaccPage.foreign).not.toBeChecked();
});

Then('註冊訊息應該是空的', async ({ bankaccPage }) => {
  await expect(bankaccPage.msg).toHaveText('');
});

Then('帳戶列表應該是空白', async ({ bankaccPage }) => {
  await expect(bankaccPage.list).toBeEmpty();
});

// ---------- 動作 ----------

When('我把商家代碼改成 {string}', async ({ bankaccPage }, merchantId: string) => {
  await bankaccPage.merchantId.fill(merchantId);
});

When('我填入銀行代碼 {string} 帳號 {string}', async ({ bankaccPage }, bankCode: string, bankAcc: string) => {
  await bankaccPage.bankCode.fill(bankCode);
  await bankaccPage.bankAcc.fill(bankAcc);
});

When('我把幣別改成 {string}', async ({ bankaccPage }, label: string) => {
  await bankaccPage.currency.selectOption({ label });
});

When('我勾選外國銀行', async ({ bankaccPage }) => {
  await bankaccPage.foreign.check();
});

When('我按下註冊', async ({ bankaccPage }) => {
  await bankaccPage.saveButton.click();
});

When('我按下查詢已註冊帳戶', async ({ bankaccPage }) => {
  await bankaccPage.listAccounts();
});

// ---------- 結果 ----------

Then('註冊訊息應該包含 {string}', async ({ bankaccPage }, text: string) => {
  await expect(bankaccPage.msg).toContainText(text);
});

Then('註冊訊息不應該包含 {string}', async ({ bankaccPage }, text: string) => {
  await expect(bankaccPage.msg).not.toContainText(text);
});

Then('帳戶列表應該有 {int} 筆資料', async ({ bankaccPage }, count: number) => {
  await expect(dataRows(bankaccPage.listTable)).toHaveCount(count);
});

Then('帳戶列表應該包含以下資料:', async ({ bankaccPage }, table: DataTable) => {
  await expectTableContains(bankaccPage.listTable, table.hashes());
});
