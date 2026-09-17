import { expect } from '@playwright/test';
import { Then } from '../fixtures';

Then('首頁應該顯示三個 Portal 區塊標題', async ({ indexPage }) => indexPage.assertContent());
Then(/^首頁顯示(?:各區塊連結與 FSD 章節|未依角色過濾註記)$/, async ({ indexPage }) => {
  await indexPage.assertContent();
  await expect(indexPage.page.locator('.wrap a')).toHaveCount(7);
});
Then('首頁連結導到對應功能頁', async ({ indexPage }) => {
  await expect(indexPage.links).toHaveCount(7);
});
Then('csr 也看得到並能進入 SA 連結', async ({ indexPage }) => indexPage.assertContent());
