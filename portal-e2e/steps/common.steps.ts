import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures';

const protectedPages: Record<string, string> = {
  '首頁': '/',
  '交易報表': '/report?type=trans',
  '對帳查詢': '/recon',
  '服務條款設定': '/tos',
  '銀行帳戶註冊': '/bankacc',
  'CSR 交易查詢': '/csr',
};

Given('我以 {string} 身分登入 Portal', async ({ loginPage }, username) => {
  await loginPage.login(username, username);
});

Given('我尚未登入 Portal', async ({ basePage }) => {
  await basePage.clearSession();
});

When('我以 {string} 身分重新登入 Portal', async ({ loginPage }, username) => {
  await loginPage.login(username, username);
});

When('我按下登出', async ({ basePage }) => {
  await basePage.logout();
});

When('我按下查詢', async ({ basePage }) => {
  await basePage.clickQueryAndWait();
});

When('我直接開啟 {string}', async ({ basePage }, pageName) => {
  const path = protectedPages[pageName];
  if (!path) throw new Error(`Unknown protected page: ${pageName}`);
  await basePage.goto(path);
});

When('我再次開啟首頁', async ({ basePage }) => {
  await basePage.goto('/');
});

Then('我應看見登入頁', async ({ page, basePage }) => {
  await expect(page).toHaveURL(/\/(?:login|doLogin)(?:;jsessionid=[^/?#]+)?$/);
  await basePage.expectHeading('登入');
});

Then('我仍應看見登入頁', async ({ page, basePage }) => {
  await expect(page).toHaveURL(/\/(?:login|doLogin)(?:;jsessionid=[^/?#]+)?$/);
  await basePage.expectHeading('登入');
});

Then('我應進入首頁', async ({ homePage }) => {
  await homePage.expectHeading('功能選單');
});

Then('我仍處於已登入狀態', async ({ basePage }) => {
  await expect(basePage.topbar).toContainText('new-pay Portal');
  await basePage.expectLogoutLinkVisible();
});

Then('頁首應顯示帳號 {string}', async ({ basePage }, username) => {
  await expect.poll(() => basePage.loggedInUser()).toBe(username);
});

Then('頁首應顯示帳號與角色 {string}', async ({ basePage, homePage }, username) => {
  await expect.poll(() => basePage.loggedInUser()).toBe(username);
  await expect.poll(() => homePage.loggedInRole()).toBe(username);
});

Then('商家代碼應為 {string}', async ({ basePage }, merchantId) => {
  await basePage.expectMerchantValue(merchantId);
});

Then('畫面不應新增錯誤訊息', async ({ basePage }) => {
  await basePage.expectMessageEmpty();
});

Then('頁面標題應為 {string}', async ({ basePage }, heading) => {
  await basePage.expectHeading(heading);
});

Then('我應看見 {string} 頁面', async ({ basePage }, heading) => {
  await basePage.expectHeading(heading);
});

Then('我應看見 OLS 對帳結果查詢頁', async ({ basePage }) => {
  await basePage.expectHeading('OLS 對帳結果查詢');
});

Then('我應看見帳戶清單', async ({ bankaccPage }) => {
  await expect(bankaccPage.table).toBeVisible();
});

Then('登入錯誤訊息應為 {string}', async ({ loginPage }, message) => {
  await expect(loginPage.errorMessage).toHaveText(message);
});

Then('帳號與密碼欄位應為空白', async ({ loginPage }) => {
  await loginPage.expectEmptyCredentials();
});

Then('登入錯誤訊息不應出現', async ({ loginPage }) => {
  await expect(loginPage.errorMessage).toHaveCount(0);
});

Then('結果區應顯示 {string}', async ({ basePage }, text) => {
  await basePage.expectBodyText(text);
});

Then('結果區應包含 {string}', async ({ basePage }, text) => {
  await basePage.expectBodyText(text);
});

Then('{string} 應包含 {string}', async ({ basePage }, areaName, text) => {
  await basePage.expectResultAreaContains(areaName, text);
});