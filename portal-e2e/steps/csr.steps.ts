import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures';

const transactionHeaders = ['TXID', 'AMOUNT', 'TX_STATUS', 'TX_DT', 'AUTH_DT', 'MERCHANDIZE_NAME', 'REFERENCE', 'RETURN_CODE'];
const refundHeaders = ['TXID', 'MERCHANT_ID', 'AMOUNT', 'REFUND_STATUS', 'REFUND_DATE', 'CREATE_TIME', 'RETURN_CODE', 'RETURN_MSG'];

Given('我在 CSR 交易查詢頁', async ({ csrPage }) => {
  await csrPage.open();
});

When('我將門號設為 {string} 並查詢', async ({ csrPage }, msisdn) => {
  await csrPage.query(msisdn);
});

When('我以 {string} 身分重新登入並開啟 CSR 交易查詢', async ({ loginPage, csrPage }, username) => {
  await loginPage.login(username, username);
  await csrPage.open();
});

Then('門號欄應為 {string}', async ({ csrPage }, msisdn) => {
  await expect(csrPage.msisdn).toHaveValue(msisdn);
});

Then('結果區初始文字應為 {string}', async ({ csrPage }, text) => {
  await expect(csrPage.result).toHaveText(text);
});

Then('交易結果表應依交易時間新到舊排列', async ({ csrPage }) => {
  await csrPage.expectTransactionsNewestFirst();
});

Then('退款結果表應包含原交易的退款', async ({ csrPage }) => {
  await expect(csrPage.refundTable).toContainText('T202609160001');
});

Then('兩個表格應各自顯示總筆數', async ({ csrPage }) => {
  await expect(csrPage.result).toContainText('total rows: 2');
  await expect(csrPage.result).toContainText('total rows: 1');
});

Then('交易表格應有八個規定欄位', async ({ csrPage }) => {
  await csrPage.expectHeaders(csrPage.transactionTable, transactionHeaders);
});

Then('退款表格應有八個規定欄位', async ({ csrPage }) => {
  await csrPage.expectHeaders(csrPage.refundTable, refundHeaders);
});

Then('狀態與回應代碼應保留原代碼且空值顯示 {string}', async ({ csrPage }, nullText) => {
  await expect(csrPage.result).toContainText('D');
  await expect(csrPage.result).toContainText('F');
  await expect(csrPage.result).toContainText(nullText);
});

Then('商品名稱與商家資訊應顯示於交易結果', async ({ csrPage }) => {
  await expect(csrPage.transactionTable).toContainText('線上商店商品');
  await expect(csrPage.transactionTable).toContainText('merchant@example.test');
});

Then('交易表格與退款表格都應顯示 {string}', async ({ csrPage }, text) => {
  await csrPage.expectTransactionsTotal(text);
  await csrPage.expectRefundsTotal(text);
});

Then('退款表格應顯示 {string}', async ({ csrPage }, text) => {
  await csrPage.expectRefundsTotal(text);
});

Then('交易與退款結果都應顯示 {string}', async ({ csrPage }, text) => {
  await csrPage.expectTransactionsTotal(text);
  await csrPage.expectRefundsTotal(text);
});

Then('兩張表格之間仍應顯示 {string}', async ({ csrPage }, text) => {
  await expect(csrPage.result).toContainText(text);
});

Then('交易結果最多顯示十筆且總筆數為 {string}', async ({ csrPage }, total) => {
  expect(await csrPage.rowCount(csrPage.transactionTable)).toBe(10);
  await csrPage.expectTableTotal(csrPage.transactionTable, total);
});

Then('畫面不應出現門號格式錯誤提示', async ({ csrPage }) => {
  await expect(csrPage.result).not.toContainText('門號格式錯誤');
});

Then('瀏覽器頁面標題應為 {string}', async ({ basePage }, title) => {
  await expect.poll(() => basePage.title()).toBe(title);
});

Then('我應看見 CSR 交易查詢頁面', async ({ basePage }) => {
  await basePage.expectHeading('查詢 new-pay 交易紀錄');
});