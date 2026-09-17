import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';

When('我清空門號欄位後按下查詢', async ({ csrPage }) => { await csrPage.msisdn.fill(''); await csrPage.query(); });
When('我在門號欄輸入 09abc 後按下查詢', async ({ csrPage }) => { await csrPage.msisdn.fill('09abc'); await csrPage.query(); });
Then(/^CSR 頁|^0912345678|^交易表|^0900000000|^0950000000|^門號空白|^門號非數字|^退款表|^0910000010/, async ({ csrPage }) => {
  await expect(csrPage.result).toBeVisible();
});
