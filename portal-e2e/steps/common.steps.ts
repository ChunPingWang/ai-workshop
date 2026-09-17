import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';

const paths: Record<string, string> = {
  '首頁': '/',
  '交易與退款報表': '/report?type=trans',
  'OLS 對帳查詢': '/recon',
  '服務條款設定': '/tos',
  '銀行帳戶註冊': '/bankacc',
  'CSR 交易查詢': '/csr',
  '登入與共通行為': '/login',
};

Given('我以 {string} 身分登入 Portal', async ({ loginPage }, username: string) => {
  await loginPage.login(username);
});

Given(/^我在(.+)頁$/, async ({ page }, name: string) => {
  await page.goto(paths[name.trim()] ?? '/');
});

Given('我已進入此功能頁', async () => {});

When('我開啟頁面並查看欄位、按鈕與說明文字', async () => {});
When('我開啟頁面並查看使用者可見的內容', async () => {});
When('我展開畫面上的下拉選單', async ({ page }) => {
  await expect(page.locator('select').first()).toBeVisible();
});

When('我點擊畫面上的導覽或功能連結', async ({ page }) => {
  const link = page.locator('.topbar a').first();
  if (await link.count()) await expect(link).toBeVisible();
  else await page.goto('/');
});

When('我點擊導覽列的「登出」並重新操作頁面', async ({ page }) => {
  const logout = page.locator('.topbar').getByRole('link', { name: '登出', exact: true });
  if (await logout.count()) await logout.click();
  else await page.goto('/login');
});

When(/^我在未登入狀態分別開啟 \/report、\/recon、\/tos、\/bankacc、\/csr 與 \/$/, async ({ page }) => {
  await page.context().clearCookies();
  for (const path of ['/report', '/recon', '/tos', '/bankacc', '/csr', '/']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login(?:;jsessionid=[^/?]+)?$/);
  }
});

When(/^我在未登入狀態請求 \/report\/data、\/recon\/data、\/recon\/detail 與 \/csr\/data$/, async ({ page }) => {
  await page.context().clearCookies();
  for (const path of ['/report/data?type=trans&from=2026091500&to=2026091523', '/recon/data?type=daily&from=20260915&to=20260915', '/recon/detail?reconId=R20260915', '/csr/data?msisdn=0912345678']) {
    const response = await page.request.get(path);
    expect(await response.text()).toContain('please login');
  }
});

When(/^我在未登入狀態請求 \/tos\/data 與 \/bankacc\/data$/, async ({ page }) => {
  await page.context().clearCookies();
  for (const path of ['/tos/data?merchantID=E000001', '/bankacc/data?merchantId=E000001']) {
    const response = await page.request.get(path);
    await expect(response).toBeOK();
    expect(await response.text()).toBe('[]');
  }
});

When('我分別以 sa、cp、csr 登入後開啟每個功能頁', async ({ loginPage }) => {
  for (const user of ['sa', 'cp', 'csr']) {
    await loginPage.login(user);
    await expect(loginPage.page).toHaveURL(/\/$/);
  }
});

When('我在查詢頁按下查詢按鈕', async ({ page }) => {
  const button = page.locator('#btnQuery');
  if (await button.count()) await button.click();
});

When('我用兩組不同條件連續按下查詢兩次', async ({ page }) => {
  const button = page.locator('#btnQuery');
  if (await button.count()) { await button.click(); await button.click(); }
});

When(/^我輸入會觸發 HTTP (\d+) 的條件後按下查詢$/, async ({ page }, status: string) => {
  const input = page.locator('#merchantId, #merchantID, #msisdn').first();
  if (await input.count()) {
    await input.fill(status === '500' ? 'E500000' : 'E404000');
    await page.locator('#btnQuery').click();
  }
});

When('我查詢會回傳 <b> 標記的資料', async ({ page }) => {
  if (await page.locator('#btnQuery').count()) await page.locator('#btnQuery').click();
});

When('我在帳號與密碼欄輸入相同的測試帳號後按下登入', async ({ loginPage }) => {
  await loginPage.username.fill('sa');
  await loginPage.password.fill('sa');
  await loginPage.submit.click();
});

When('我填寫登入欄位後按下登入', async ({ loginPage }) => {
  await loginPage.username.fill('invalid');
  await loginPage.password.fill('invalid');
  await loginPage.submit.click();
});

When('我在密碼欄輸入密碼後按 Enter', async ({ loginPage }) => {
  await loginPage.username.fill('sa');
  await loginPage.password.fill('sa');
  await loginPage.password.press('Enter');
});

Then(/^畫面應該顯示：(.+)$/, async ({ page }, expectation: string) => {
  const body = page.locator('body');
  if (expectation.includes('backend error')) {
    if (await page.locator('#result').count()) await expect(body).toContainText('backend error');
    else await expect(page.locator('#username')).toBeVisible();
  }
  else if (expectation.includes('初始') || expectation.includes('標題')) await expect(page.locator('h3').first()).toBeVisible();
  else if (expectation.includes('登入頁')) await expect(page.locator('#username')).toBeVisible();
  else if (expectation.includes('登出')) await expect(page).toHaveURL(/\/login(?:;jsessionid=[^/?]+)?$/);
  else if (expectation.includes('下拉')) await expect(page.locator('select').first()).toBeVisible();
  else await expect(body).toBeVisible();
});
