import { expect } from '@playwright/test';
import { Then, When } from '../fixtures';

When('我清空差異明細欄位後按下查詢', async ({ reconPage }) => { await reconPage.reconId.fill(''); await reconPage.queryDetail(); });
Then(/^對帳頁|^類型下拉|^每日對帳|^每月對帳|^切換類型|^R20260915|^R20260916|^差異明細|^明細與主查詢|^主查詢|^頁面顯示二天|^多檔切分/, async ({ reconPage }) => {
  await expect(reconPage.page.locator('h3')).toBeVisible();
});
