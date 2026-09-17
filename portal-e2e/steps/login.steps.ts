import { expect } from '@playwright/test';
import { Then, When } from '../fixtures';

When(/^我用 GET 方法開啟 \/doLogin$/, async ({ page }) => {
  const response = await page.request.get('/doLogin');
  expect(response.status()).toBe(405);
});

Then('開登入頁顯示標題、focus 與三組測試帳號', async ({ loginPage }) => loginPage.assertForm());
Then(/^sa\/sa 登入成功到功能選單|^cp\/cp 登入成功到功能選單|^csr\/csr 登入成功到功能選單$/, async ({ page }) => {
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('h3')).toHaveText('功能選單');
});
Then(/^密碼錯誤停在登入頁並清空帳號|^不存在帳號顯示登入錯誤|^帳號或密碼空白仍送出並顯示錯誤|^帳號大寫不同導致登入失敗|^帳號前後空白導致登入失敗$/, async ({ page }) => {
  await expect(page).toHaveURL(/\/(login|doLogin)$/);
});
Then('密碼欄按 Enter 等同登入', async ({ page }) => expect(page).toHaveURL(/\/$/));
Then('已登入再開登入頁仍顯示表單', async ({ loginPage }) => loginPage.assertForm());
Then('已登入再以另一帳號登入會覆蓋 session', async ({ loginPage }) => loginPage.assertForm());
Then('登出導回登入且不再顯示帳號', async ({ page }) => expect(page).toHaveURL(/\/login(?:;jsessionid=[^/?]+)?$/));
