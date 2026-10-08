import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { Given, When, Then } from '../fixtures';
import { dataRows, expectHeaders, expectTableContains } from './support/htmlTable';

/**
 * 跨頁面共用步驟：登入／登出／導覽／未登入行為／報表結果區（#result）。
 * 各功能頁自己的步驟放在 steps/<功能>.steps.ts。
 */

// 登入頁網址：/login 或 /doLogin（登入失敗直接 return view）；
// 全新瀏覽器的第一個 redirect 可能帶 Tomcat 的 URL session tracking（/login;jsessionid=XXXX）
const LOGIN_URL = /\/(login|doLogin)(;jsessionid=[^/?#]+)?$/;

/**
 * 已知 Portal 現況 bug（US-COM-01 備註）：全新瀏覽器第一次登入的 redirect 會落在 /;jsessionid=XXXX，
 * 這個 URL 比對不到 @GetMapping("/")，由 welcome page 直接 render index 模板——沒有 model，
 * 導覽列的帳號/角色是空的。測試在斷言導覽列前先用乾淨 URL 重開一次，讓 controller 正常 render。
 */
async function gotoCleanUrlIfJsessionid(page: Page) {
  if (page.url().includes(';jsessionid=')) {
    await page.goto(page.url().replace(/;jsessionid=[^/?#]+/, ''));
  }
}

// ---------- 登入與導覽 ----------

Given('我在登入頁', async ({ loginPage }) => {
  await loginPage.goto();
  await expect(loginPage.submit).toBeVisible();
});

Given('我以 {string} 身分登入 Portal', async ({ loginPage, homePage }, role: string) => {
  // 帳號即角色、密碼同帳號：sa/sa、cp/cp、csr/csr
  await loginPage.goto();
  await loginPage.login(role, role);
  await gotoCleanUrlIfJsessionid(loginPage.page);
  await expect(homePage.heading).toBeVisible();
});

When('我輸入帳號 {string} 與密碼 {string} 並送出', async ({ loginPage }, username: string, password: string) => {
  await loginPage.login(username, password);
});

When('我點擊導覽列的 {string}', async ({ homePage }, text: string) => {
  await homePage.gotoNav(text);
});

When('我點擊首頁選單的 {string}', async ({ homePage }, text: string) => {
  await homePage.menuLink(text).click();
});

When('我直接開啟 {string} 頁面', async ({ page }, path: string) => {
  lastPostStatus = null;
  await page.goto(path);
});

When('我在另一個分頁登出', async ({ page }) => {
  // session cookie 是整個 context 共用的：另開分頁 /logout 讓 session 失效，原分頁的舊畫面保持不動
  const other = await page.context().newPage();
  await other.goto('/logout');
  await other.close();
});

Then('我應該看到功能選單', async ({ homePage }) => {
  await expect(homePage.heading).toBeVisible();
});

Then('我應該看到頁面標題 {string}', async ({ page }, title: string) => {
  await expect(page.locator('.wrap h3').first()).toHaveText(title);
});

Then('瀏覽器分頁標題應該是 {string}', async ({ page }, title: string) => {
  await expect(page).toHaveTitle(title);
});

Then('導覽列應該顯示登入者 {string}', async ({ page, homePage }, user: string) => {
  await gotoCleanUrlIfJsessionid(page);
  expect(await homePage.loggedInUser()).toBe(user);
});

Then('導覽列的登入者應該是空白', async ({ homePage }) => {
  await expect(homePage.topbar.locator('span').first()).toHaveText('');
});

Then('導覽列應該顯示角色 {string}', async ({ homePage }, role: string) => {
  await expect(homePage.topbar).toContainText(role);
});

Then('我應該停留在登入頁', async ({ page, loginPage }) => {
  await expect(page).toHaveURL(LOGIN_URL);
  await expect(loginPage.submit).toBeVisible();
});

Then('登入頁應該顯示錯誤訊息 {string}', async ({ loginPage }, message: string) => {
  await expect(loginPage.error).toHaveText(message);
});

Then('登入頁不應該顯示錯誤訊息', async ({ loginPage }) => {
  // th:if 不成立時錯誤訊息元素根本不存在（P-LGN-09）
  await expect(loginPage.error).toHaveCount(0);
});

Then('我可以依序開啟所有功能頁而不被導回登入頁', async ({ page }) => {
  const paths = ['/', '/report?type=trans', '/report?type=refund', '/recon', '/tos', '/bankacc', '/csr'];
  for (const path of paths) {
    await page.goto(path);
    await expect(page).not.toHaveURL(LOGIN_URL);
    await expect(page.locator('.wrap h3').first()).toBeVisible();
  }
});

// ---------- 通用畫面斷言 ----------

Then('頁面應該顯示說明 {string}', async ({ page }, text: string) => {
  await expect(page.locator('body')).toContainText(text);
});

Then('頁面應該顯示按鈕 {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
});

// tos 頁的商家欄位 id 是 merchantID、bankacc 是 merchantId，各頁只會有其中一個
Then('商家代碼欄位值應該是 {string}', async ({ page }, value: string) => {
  await expect(page.locator('#merchantID, #merchantId')).toHaveValue(value);
});

// ---------- 未登入直接打端點 ----------

Then('頁面內容應該是 {string}', async ({ page }, text: string) => {
  await expect(page.locator('body')).toHaveText(text);
});

// POST 步驟與回應斷言共用的暫存（同一個 scenario 內先送出再斷言）
let lastPostResponseBody = '';
let lastPostStatus: number | null = null;

When('我未登入直接以 POST 送出 {string} 並附上表單:', async ({ page }, path: string, table: DataTable) => {
  const response = await page.request.post(path, { form: table.rowsHash() });
  lastPostStatus = response.status();
  lastPostResponseBody = (await response.text()).trim();
});

Then('回應內容應該是 {string}', async ({}, expected: string) => {
  expect(lastPostResponseBody).toBe(expected);
});

Then('回應狀態碼應該是 {int}', async ({ page }, status: number) => {
  if (lastPostStatus !== null) {
    // 剛以 POST 送出過表單 → 用該回應的狀態碼
    expect(lastPostStatus).toBe(status);
    return;
  }
  // 頁面導航拿不到 response 物件，以目前網址重打一次拿狀態碼
  const response = await page.request.get(page.url());
  expect(response.status()).toBe(status);
});

// ---------- 查詢與結果區（report / recon 共用 #btnQuery / #result） ----------

When('我按下查詢', async ({ page }) => {
  await page.locator('#btnQuery').click();
  await expect(page.locator('#result')).not.toHaveText(/查詢中/, { timeout: 10_000 });
});

Then('結果區應該顯示 {string}', async ({ page }, text: string) => {
  await expect(page.locator('#result')).toContainText(text);
});

Then('結果區不應該包含 {string}', async ({ page }, text: string) => {
  await expect(page.locator('#result')).not.toContainText(text);
});

Then('結果表格應該有 {int} 筆資料', async ({ page }, count: number) => {
  await expect(dataRows(page.locator('#result table').first())).toHaveCount(count);
});

Then(
  '結果表格應該有 {int} 個欄位且第一欄是 {string} 最後一欄是 {string}',
  async ({ page }, count: number, first: string, last: string) => {
    await expectHeaders(page.locator('#result table').first(), count, first, last);
  },
);

Then('結果表格應該包含以下資料:', async ({ page }, table: DataTable) => {
  await expectTableContains(page.locator('#result table').first(), table.hashes());
});

Then('結果表格第 {int} 筆的 TXID 應該是 {string}', async ({ page }, index: number, txid: string) => {
  // TXID 是報表類表格的第一欄
  const row = dataRows(page.locator('#result table').first()).nth(index - 1);
  await expect(row.locator('td').first()).toHaveText(txid);
});

Then('查詢結果應該顯示後端錯誤', async ({ page }) => {
  // PortalController.relay() 捕捉例外後回 "backend error: ..." 純文字（P-COM-15）
  await expect(page.locator('#result')).toContainText('backend error');
});
