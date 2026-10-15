import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures';

const bankHeaders = ['商家', '銀行代碼', '帳號', '幣別', '國內外', '狀態'];

Given('我在商家銀行帳戶註冊頁', async ({ bankaccPage }) => {
  await bankaccPage.open();
});

Given('我先查詢已註冊帳戶', async ({ bankaccPage }) => {
  await bankaccPage.queryList();
  await bankaccPage.captureList();
});

When('我查詢已註冊帳戶', async ({ bankaccPage }) => {
  await bankaccPage.queryList();
});

When('我以 {string} 身分重新登入並查詢已註冊帳戶', async ({ loginPage, bankaccPage }, username) => {
  await loginPage.login(username, username);
  await bankaccPage.open();
  await bankaccPage.queryList();
});

When('我在目前頁面登出後再次查詢清單', async ({ basePage, bankaccPage }) => {
  await basePage.invalidateSessionWithoutNavigation();
  await bankaccPage.queryList();
});

When('我將商家代碼設為 {string} 並查詢已註冊帳戶', async ({ bankaccPage }, merchantId) => {
  await bankaccPage.queryList(merchantId);
});

When('我選擇幣別 {string} 並設定國內外為 {string}', async ({ bankaccPage }, currency, location) => {
  const domesticValue = location === '國內' ? 'Y' : 'N';
  await bankaccPage.fillRegistration('', '', currency, domesticValue);
});

When('我輸入銀行代碼 {string} 與帳號 {string} 並註冊', async ({ bankaccPage }, bankCode, account) => {
  const currency = await bankaccPage.currency.inputValue();
  const isDomestic = await bankaccPage.foreignBank.isChecked() ? 'N' : 'Y';
  await bankaccPage.registerAndWaitForList(bankCode, account, currency, isDomestic);
});

When('我輸入銀行代碼 {string}、帳號 {string} 並按註冊', async ({ bankaccPage }, bankCode, account) => {
  await bankaccPage.registerAndWaitForList(bankCode, account);
});

When('我以銀行代碼 {string} 與帳號 {string} 嘗試註冊', async ({ bankaccPage }, bankCode, account) => {
  await bankaccPage.fillRegistration(bankCode, account);
  await bankaccPage.save();
});

When('我輸入非數字銀行代碼 {string} 與已使用帳號 {string} 並註冊', async ({ bankaccPage }, bankCode, account) => {
  await bankaccPage.registerAndWaitForList(bankCode, account);
});

When('我以未登入狀態送出帳戶註冊', async ({ bankaccPage }) => {
  await bankaccPage.save();
});

Then('銀行代碼與銀行帳號應為空白', async ({ bankaccPage }) => {
  await expect(bankaccPage.bankCode).toHaveValue('');
  await expect(bankaccPage.bankAccount).toHaveValue('');
});

Then('幣別應為 {string} 且外國銀行未勾選', async ({ bankaccPage }, currency) => {
  await expect(bankaccPage.currency).toHaveValue(currency);
  await expect(bankaccPage.foreignBank).not.toBeChecked();
});

Then('註冊訊息與帳戶清單應為空白', async ({ bankaccPage }) => {
  await expect(bankaccPage.message).toBeEmpty();
  await expect(bankaccPage.list).toBeEmpty();
});

Then('帳戶清單應顯示六個中文欄位', async ({ bankaccPage }) => {
  await bankaccPage.expectHeaders(bankaccPage.table, bankHeaders);
});

Then('清單應顯示國外帳戶 {string} 狀態 {string} 與國內帳戶 {string} 狀態 {string}', async ({ bankaccPage }, foreignCurrency, foreignStatus, domesticCurrency, domesticStatus) => {
  await expect(bankaccPage.table).toContainText(foreignCurrency);
  await expect(bankaccPage.table).toContainText(foreignStatus);
  await expect(bankaccPage.table).toContainText(domesticCurrency);
  await expect(bankaccPage.table).toContainText(domesticStatus);
  await expect(bankaccPage.table).toContainText('國外');
  await expect(bankaccPage.table).toContainText('國內');
});

Then('清單資料應依回應順序全部呈現', async ({ bankaccPage }) => {
  const rows = bankaccPage.dataRows(bankaccPage.table);
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('007');
  await expect(rows.nth(1)).toContainText('004');
});

Then('清單應只有六個欄位表頭且沒有資料列', async ({ bankaccPage }) => {
  await bankaccPage.expectHeaders(bankaccPage.table, bankHeaders);
  expect(await bankaccPage.rowCount(bankaccPage.table)).toBe(0);
});

Then('清單應只有六個欄位表頭', async ({ bankaccPage }) => {
  await bankaccPage.expectHeaders(bankaccPage.table, bankHeaders);
});

Then('原有帳戶清單應保持不變', async ({ bankaccPage }) => {
  await bankaccPage.expectListUnchanged();
});

Then('註冊訊息應顯示 {string}', async ({ bankaccPage }, message) => {
  await expect(bankaccPage.message).toContainText(message);
});

Then('註冊訊息應包含 {string}', async ({ bankaccPage }, message) => {
  await expect(bankaccPage.message).toContainText(message);
});

Then('註冊完成後應自動查詢帳戶清單', async ({ bankaccPage }) => {
  await bankaccPage.expectListHeaderCount(6);
});

Then('清單查詢完成後註冊訊息仍應保留', async ({ bankaccPage }) => {
  await expect(bankaccPage.message).toContainText('OK');
});

Then('畫面不應顯示格式或重複資料的前端驗證訊息', async ({ bankaccPage }) => {
  await expect(bankaccPage.message).not.toContainText(/格式|重複/);
});

Then('狀態欄應以 {string} 與 {string} 代碼顯示', async ({ bankaccPage }, approved, pending) => {
  await expect(bankaccPage.table).toContainText(approved);
  await expect(bankaccPage.table).toContainText(pending);
});