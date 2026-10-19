import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';
import { LOGIN_URL } from '../pages/Portal';

/** 登入、登出、session 與多瀏覽器（US-COM-01） */

// ---------- 登入狀態 ----------

Given('我尚未登入 Portal', async ({ page }) => {
  await page.context().clearCookies();
});

Given('我以 {string} 身分登入 Portal', async ({ portal }, user: string) => {
  await portal.loginAs(user);
});

When('我以帳號 {string} 密碼 {string} 登入', async ({ loginPage }, user: string, password: string) => {
  await loginPage.login(user, password);
});

Given('我的登入已失效', async ({ portal }) => {
  // 清掉 session cookie，模擬閒置逾時（P-COM-06）；不按登出，登出是另一個情境
  await portal.expireSession();
});

Then('我應該在登入頁', async ({ page, loginPage }) => {
  await expect(page).toHaveURL(LOGIN_URL);
  await expect(loginPage.username).toBeVisible();
});

// ---------- 登出 ----------

Given('我已登出 Portal', async ({ portal, page }) => {
  await portal.current.logout();
  await expect(page).toHaveURL(LOGIN_URL);
});

Given('我在另一個分頁登出 Portal', async ({ portal }) => {
  await portal.logoutInAnotherTab();
});

// ---------- 多個瀏覽器（各自獨立的 cookie） ----------

Given('我在瀏覽器 {string} 以 {string} 身分登入 Portal', async ({ portal, baseURL }, name: string, user: string) => {
  const other = await portal.inBrowser(name, baseURL!);
  await other.loginAs(user);
});

When('我在瀏覽器 {string} 登出 Portal', async ({ portal }, name: string) => {
  const other = portal.browserNamed(name);
  await other.current.logout();
  await expect(other.page).toHaveURL(LOGIN_URL);
});

When('我在瀏覽器 {string} 的 {string} 頁面按下 {string}', async ({ portal }, name: string, pageName: string, label: string) => {
  const other = portal.browserNamed(name);
  await other.open(pageName);
  await expect(other.page).not.toHaveURL(/\/(login|doLogin)/);
  await other.press(label);
});

Then('瀏覽器 {string} 的 {string} 應該包含 {string}', async ({ portal }, name: string, area: string, text: string) => {
  await expect(portal.browserNamed(name).current.area(area)).toContainText(text);
});

Then(
  '瀏覽器 {string} 的 {string} 頁面標題列應該顯示 {string}',
  async ({ portal }, name: string, pageName: string, text: string) => {
    const other = portal.browserNamed(name);
    await other.open(pageName);
    await expect(other.current.topbar).toBeVisible();
    await expect.poll(() => other.current.topbarText()).toBe(text);
  },
);
