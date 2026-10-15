import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { Given, Then, When } from '../fixtures';

Given('我在對帳查詢頁', async ({ reconPage }) => {
  await reconPage.open();
});

When('我以每日對帳查詢預設日期範圍', async ({ reconPage }) => {
  await reconPage.setType('daily');
  await reconPage.querySummary();
});

When('我選擇每月對帳並查詢', async ({ reconPage }) => {
  await reconPage.setType('monthly');
  await reconPage.querySummary();
});

When('我將起日設為 {string} 並查詢每日對帳', async ({ reconPage }, from) => {
  await reconPage.setDateRange(from, await reconPage.to.inputValue());
  await reconPage.setType('daily');
  await reconPage.querySummary();
});

When('我將起日設為 {string} 並查詢每月對帳', async ({ reconPage }, from) => {
  await reconPage.setDateRange(from, await reconPage.to.inputValue());
  await reconPage.setType('monthly');
  await reconPage.querySummary();
});

When('我輸入批次識別 {string} 並查差異明細', async ({ reconPage }, reconId) => {
  await reconPage.queryDetail(reconId);
});

When('我清空批次識別並查差異明細', async ({ reconPage }) => {
  await reconPage.queryDetail('');
});

When('我先查每日彙總並查詢批次 {string} 的差異', async ({ reconPage }, reconId) => {
  await reconPage.setType('daily');
  await reconPage.querySummary();
  await reconPage.queryDetail(reconId);
});

When('我切換為每月對帳', async ({ reconPage }) => {
  await reconPage.setType('monthly');
});

When('我以 {string} 查詢 {string}', async ({ reconPage }, trigger, kind) => {
  if (kind === '差異明細') {
    await reconPage.queryDetail(trigger);
  } else {
    await reconPage.querySummaryWith(trigger, kind);
  }
});

When('我以 {string} 身分重新登入並開啟對帳查詢', async ({ loginPage, reconPage }, username) => {
  await loginPage.login(username, username);
  await reconPage.open();
});

Then('對帳類型應為每日對帳', async ({ reconPage }) => {
  await expect(reconPage.type).toHaveValue('daily');
});

Then('起日與迄日應分別為 {string} 與 {string}', async ({ reconPage }, from, to) => {
  await expect(reconPage.from).toHaveValue(from);
  await expect(reconPage.to).toHaveValue(to);
});

Then('彙總區應顯示 {string}', async ({ reconPage }, text) => {
  await expect(reconPage.result).toContainText(text);
});

Then('批次識別欄應為空白且差異明細區應為空白', async ({ reconPage }) => {
  await expect(reconPage.reconId).toHaveValue('');
  await expect(reconPage.detail).toBeEmpty();
});

Then('彙總表應顯示每日批次 {string} 與 {string}', async ({ reconPage }, firstId, secondId) => {
  await expect(reconPage.summaryTable).toContainText(firstId);
  await expect(reconPage.summaryTable).toContainText(secondId);
});

Then('每日批次應依日期由早到晚排列', async ({ reconPage }) => {
  await reconPage.expectDailyRowsInOrder();
});

Then('結果應顯示一致標記 {string}、差異標記 {string} 與差異筆數 {string}', async ({ reconPage }, consistent, different, count) => {
  await expect(reconPage.summaryTable).toContainText(consistent);
  await expect(reconPage.summaryTable).toContainText(different);
  await expect(reconPage.summaryTable).toContainText(count);
});

Then('彙總表應顯示批次 {string} 與日期 {string}', async ({ reconPage }, reconId, date) => {
  await expect(reconPage.summaryTable).toContainText(reconId);
  await expect(reconPage.summaryTable).toContainText(date);
});

Then('每月彙總應顯示七個規定欄位', async ({ reconPage }) => {
  await reconPage.expectSummaryColumnCount(7);
});

Then('彙總區應顯示空表格與 {string}', async ({ reconPage }, text) => {
  await reconPage.expectEmptySummary(text);
});

Then('差異表應包含以下資料:', async ({ reconPage }, dataTable: DataTable) => {
  await reconPage.expectTableRows(reconPage.detailTable, dataTable.hashes());
});

Then('差異結果應按明細序號排列', async ({ reconPage }) => {
  const rows = reconPage.dataRows(reconPage.detailTable);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Amount not match');
});

Then('差異區應顯示空表格與 {string}', async ({ reconPage }, text) => {
  await reconPage.expectEmptyDetail(text);
});

Then('差異區應顯示 {string}', async ({ reconPage }, text) => {
  await expect(reconPage.detail).toContainText(text);
});

Then('畫面不應出現批次識別必填提示', async ({ basePage }) => {
  await basePage.expectBodyNotToContain('必填');
});

Then('彙總結果與差異明細應同時保留', async ({ reconPage }) => {
  await expect(reconPage.summaryTable).toBeVisible();
  await expect(reconPage.detailTable).toBeVisible();
});

Then('日期、彙總結果與差異明細應仍保留', async ({ reconPage }) => {
  await expect(reconPage.from).toHaveValue('20000101');
  await expect(reconPage.to).toHaveValue('20991231');
  await expect(reconPage.summaryTable).toBeVisible();
  await expect(reconPage.detailTable).toBeVisible();
});
