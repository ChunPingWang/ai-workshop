import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';

/** US-LGN-*（SRS 4.1）登入頁專屬步驟；登入／導轉等共用句型在 common.steps.ts */

Then('登入頁應該顯示標題 {string}', async ({ page }, title: string) => {
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
});

Then('帳號欄位應該自動聚焦', async ({ loginPage }) => {
  await expect(loginPage.username).toBeFocused();
});

Then('帳號欄位應該是空的', async ({ loginPage }) => {
  await expect(loginPage.username).toHaveValue('');
});

When(
  '我輸入帳號 {string} 與密碼 {string} 並在密碼欄按 Enter',
  async ({ loginPage }, username: string, password: string) => {
    await loginPage.username.fill(username);
    await loginPage.password.fill(password);
    await loginPage.password.press('Enter');
  },
);
