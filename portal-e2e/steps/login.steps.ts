import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';

When('我開啟登入頁', async ({ loginPage }) => {
  await loginPage.open();
});

When('我輸入帳號 {string} 與密碼 {string}', async ({ loginPage }, username: string, password: string) => {
  await loginPage.fill(username, password);
});

When(
  '我以帳號 {string} 密碼 {string} 連續登入失敗 {int} 次',
  async ({ loginPage }, username: string, password: string, times: number) => {
    await loginPage.open();
    for (let i = 0; i < times; i++) {
      await loginPage.fill(username, password);
      await loginPage.submitForm();
      await expect(loginPage.error).toBeVisible();
    }
  },
);

When('我直接以網址開啟登入送出位址', async ({ portal, page }) => {
  portal.lastNavigation = await page.goto('/doLogin');
});

When('另一個瀏覽器也以 {string} 身分登入 Portal', async ({ portal, baseURL }, user: string) => {
  await portal.loginInAnotherBrowser(user, baseURL!);
});

Then('標題列應該只顯示 {string} 且沒有任何連結', async ({ loginPage }, text: string) => {
  await expect(loginPage.topbar).toHaveText(text);
  await expect(loginPage.topbar.locator('a')).toHaveCount(0);
});

Then('游標應該停在 {string} 欄', async ({ loginPage }, label: string) => {
  await expect(loginPage.field(label)).toBeFocused();
});

Then('頁面應該顯示錯誤訊息 {string}', async ({ loginPage }, text: string) => {
  await expect(loginPage.error).toHaveText(text);
});

Then('我應該仍是未登入狀態', async ({ page }) => {
  // 用同一個瀏覽器的 cookie 開首頁，未登入會被 302 導向登入頁
  const res = await page.request.get('/', { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()['location']).toMatch(/\/login/);
});

Then(
  '錯誤訊息 {string} 應該位於 {string} 按鈕之下、測試帳號提示之上',
  async ({ loginPage }, text: string, button: string) => {
    await expect(loginPage.error).toHaveText(text);
    const err = (await loginPage.error.boundingBox())!;
    const btn = (await loginPage.button(button).boundingBox())!;
    const hint = (await loginPage.hint.boundingBox())!;
    expect(err.y).toBeGreaterThan(btn.y);
    expect(err.y).toBeLessThan(hint.y);
  },
);

Then('頁面不應該顯示驗證碼欄位', async ({ page }) => {
  // 此步驟出現在「連錯多次後成功登入」之後，當下已在首頁；驗證碼要看的是登入頁，
  // 所以另外取一次登入頁 HTML 檢查（不切換目前頁面）：只有帳號、密碼兩個輸入框，沒有驗證碼
  const html = await (await page.request.get('/login')).text();
  expect(html.match(/<input\b/gi) ?? []).toHaveLength(2);
  expect(html).not.toMatch(/驗證碼|captcha/i);
});

Then('頁面應該顯示方法不允許的錯誤頁', async ({ portal, page }) => {
  expect(portal.lastNavigation?.status()).toBe(405);
  await expect(page.locator('body')).toContainText('405');
});

