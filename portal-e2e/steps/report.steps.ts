import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { Given, Then, When } from '../fixtures';

Given('我在交易報表頁', async ({ reportPage }) => {
  await reportPage.open();
});

When('我清空商家欄並以交易時間查詢', async ({ reportPage }) => {
  await reportPage.setMerchant('');
  await reportPage.setTimeType('tx');
  await reportPage.query();
});

When('我清空商家欄並按查詢', async ({ reportPage }) => {
  await reportPage.setMerchant('');
  await reportPage.query();
});

When('我以未支援的報表類型開啟報表頁', async ({ reportPage }) => {
  await reportPage.open('unknown');
});

When('我將商家欄設為 {string} 並按查詢', async ({ reportPage }, merchantId) => {
  await reportPage.setMerchantAndQuery(merchantId);
});

When('我將起日設為 {string} 並將迄日設為 {string} 後查詢', async ({ reportPage }, from, to) => {
  await reportPage.setDatesAndQuery(from, to);
});

When('我將起日與迄日設為 {string} 並選擇 {string} 到 {string} 後查詢', async ({ reportPage }, date, fromHour, toHour) => {
  await reportPage.setDateRange(date, date);
  await reportPage.setHours(fromHour, toHour);
  await reportPage.query();
});

When('我清空起日與迄日並按查詢', async ({ reportPage }) => {
  await reportPage.setDateRange('', '');
  await reportPage.query();
});

When('我選擇授權時間並按查詢', async ({ reportPage }) => {
  await reportPage.setTimeType('auth');
  await reportPage.query();
});

When(/^我從頂端導覽開啟退款報表(並按查詢|並查詢)?$/, async ({ reportPage }, querySuffix?: string) => {
  await reportPage.openRefundFromNavigation();
  if (querySuffix) await reportPage.query();
});

When('我將起日設為 {string} 並按查詢', async ({ reportPage }, from) => {
  await reportPage.fromDate.fill(from);
  await reportPage.query();
});

When('我將商家欄設為單引號並按查詢', async ({ reportPage }) => {
  await reportPage.setMerchant("'");
  await reportPage.query();
});

When('我送出查詢並暫停後端回應', async ({ reportPage }) => {
  await reportPage.startQueryWithHeldResponse();
});

When('我在第一次查詢回應前連續按下查詢兩次', async ({ reportPage }) => {
  await reportPage.queryTwiceAndReleaseInReverse();
});

When('我以 {string} 身分重新登入並開啟交易報表', async ({ loginPage, reportPage }, username) => {
  await loginPage.login(username, username);
  await reportPage.open();
});

When('我登出後返回已開啟的交易報表並查詢', async ({ basePage, reportPage }) => {
  await basePage.invalidateSessionWithoutNavigation();
  await reportPage.query();
});

Then('起日與迄日應為瀏覽器當日', async ({ reportPage }) => {
  await expect(reportPage.fromDate).toHaveValue(await reportPage.fromDate.inputValue());
  await expect(reportPage.toDate).toHaveValue(await reportPage.fromDate.inputValue());
});

Then('起始小時應為 {string} 且結束小時應為 {string}', async ({ reportPage }, fromHour, toHour) => {
  await expect(reportPage.fromHour).toHaveValue(fromHour);
  await expect(reportPage.toHour).toHaveValue(toHour);
});

Then('商家欄應為 {string} 且時間類型為交易時間', async ({ reportPage }, merchantId) => {
  await expect(reportPage.merchantId).toHaveValue(merchantId);
  await expect(reportPage.timeType).toHaveValue('tx');
});

Then('兩個小時選單各應有 24 個從 {string} 到 {string} 的選項', async ({ reportPage }, first, last) => {
  for (const which of ['from', 'to'] as const) {
    const options = await reportPage.hourOptions(which);
    expect(options).toHaveLength(24);
    expect(options[0]).toBe(first);
    expect(options[23]).toBe(last);
  }
});

Then('交易時間應由早到晚排列且空值顯示 {string}', async ({ reportPage }, nullText) => {
  await reportPage.expectSortedByColumn(reportPage.table, 6);
  await expect(reportPage.result).toContainText(nullText);
});

Then('空的欄位應顯示 {string}', async ({ reportPage }, nullText) => {
  await expect(reportPage.table).toContainText(nullText);
});

Then('查詢結果應包含不同商家的交易資料', async ({ reportPage }) => {
  await reportPage.setMerchant('');
  await reportPage.query();
  await expect(reportPage.table).toContainText('E000001');
  await expect(reportPage.table).toContainText('E000002');
});

Then('查詢結果應包含商家 {string} 與 {string} 的資料', async ({ reportPage }, firstMerchant, secondMerchant) => {
  await expect(reportPage.table).toContainText(firstMerchant);
  await expect(reportPage.table).toContainText(secondMerchant);
});

Then('查詢結果仍依交易時間由早到晚排列', async ({ reportPage }) => {
  await reportPage.expectSortedByColumn(reportPage.table, 6);
});

Then('結果表格應該包含以下資料:', async ({ reportPage }, dataTable: DataTable) => {
  await reportPage.expectRows(dataTable.hashes());
});

Then('結果表格應有 {int} 筆資料列', async ({ reportPage }, count: number) => {
  await expect.poll(() => reportPage.rows()).toBe(count);
});

Then('結果應顯示空表格', async ({ reportPage }) => {
  await expect(reportPage.table).toBeVisible();
  expect(await reportPage.rows()).toBe(0);
});

Then('結果應顯示空表格與 {string}', async ({ reportPage }, text) => {
  await expect(reportPage.table).toBeVisible();
  expect(await reportPage.rows()).toBe(0);
  await expect(reportPage.result).toContainText(text);
});

Then('查詢結果應顯示 {string}', async ({ reportPage }, text) => {
  await expect(reportPage.result).toContainText(text);
});

Then('畫面不應出現日期格式錯誤提示', async ({ basePage }) => {
  await basePage.expectBodyNotToContain('日期格式錯誤');
});

Then('結果區應顯示交易資料而不是格式錯誤提示', async ({ reportPage }) => {
  await expect(reportPage.table).toBeVisible();
  await expect(reportPage.result).toContainText('total rows: 3');
  await reportPage.expectNoDateFormatError();
});

Then('商品名稱應以粗體顯示 {string}', async ({ reportPage }, text) => {
  await reportPage.expectBoldText(text);
});

Then('結果表頭應為淡藍底且格線為灰色', async ({ reportPage }) => {
  await reportPage.expectTableHeaderStyle();
});

Then('資料列背景應為白色', async ({ reportPage }) => {
  await reportPage.expectTableCellStyle();
});

Then('結果區應持續顯示 {string}', async ({ reportPage }, text) => {
  try {
    await expect(reportPage.result).toHaveText(text);
  } finally {
    await reportPage.releaseQueryResponse();
  }
});

Then('結果區應顯示最後到達的查詢回應', async ({ reportPage }) => {
  await expect(reportPage.result).toContainText('total rows: 3');
  expect(await reportPage.rows()).toBe(3);
});

Then('我應看見交易報表結果', async ({ reportPage }) => {
  await expect(reportPage.heading).toHaveText('交易報表查詢');
  await expect(reportPage.result).toContainText('total rows: 10');
});

Then('商家與時間類型欄位應顯示', async ({ reportPage }) => {
  await expect(reportPage.merchantId).toBeVisible();
  await expect(reportPage.timeType).toBeVisible();
});

Then('商家與時間類型欄位應隱藏', async ({ reportPage }) => {
  await expect(reportPage.transactionFields).toBeHidden();
});

Then('日期、小時、查詢按鈕與結果區應可使用', async ({ reportPage }) => {
  await expect(reportPage.fromDate).toBeVisible();
  await expect(reportPage.fromHour).toBeVisible();
  await expect(reportPage.toDate).toBeVisible();
  await expect(reportPage.toHour).toBeVisible();
  await expect(reportPage.queryButton).toBeVisible();
  await expect(reportPage.result).toBeVisible();
});

Then('退款時間應由早到晚排列', async ({ reportPage }) => {
  await reportPage.expectSortedByColumn(reportPage.table, 3);
});

Then('退款結果應依退款時間排序', async ({ reportPage }) => {
  await reportPage.expectSortedByColumn(reportPage.table, 3);
});

Then('商家與時間類型不應影響退款結果', async ({ reportPage }) => {
  await expect(reportPage.transactionFields).toBeHidden();
  await expect(reportPage.table).toContainText('T202609160001');
});

Then('結果應包含交易時間 {string}', async ({ reportPage }, timestamp) => {
  await expect(reportPage.table).toContainText(timestamp);
});

Then('結果表格應顯示授權時間範例交易', async ({ reportPage }) => {
  await expect(reportPage.table).toContainText('T202609160004');
});