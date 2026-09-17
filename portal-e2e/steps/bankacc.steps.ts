import { expect } from '@playwright/test';
import { Then, When } from '../fixtures';

When('我填寫表單後按下畫面上的送出或存檔按鈕', async ({ bankaccPage }) => {
  await bankaccPage.bankCode.fill('001');
  await bankaccPage.bankAccount.fill('123456');
  await bankaccPage.save();
});

When('我將銀行代碼輸入 999 後按下註冊', async ({ bankaccPage }) => { await bankaccPage.bankCode.fill('999'); await bankaccPage.save(); });
When('我清空銀行代碼與帳號後按下註冊', async ({ bankaccPage }) => { await bankaccPage.bankCode.fill(''); await bankaccPage.bankAccount.fill(''); await bankaccPage.save(); });
When('我在帳號欄輸入非數字文字後按下註冊', async ({ bankaccPage }) => { await bankaccPage.bankAccount.fill('abc'); await bankaccPage.save(); });
When('我完成一次註冊後再次註冊另一個帳戶', async ({ bankaccPage }) => { await bankaccPage.save(); await bankaccPage.bankAccount.fill('654321'); await bankaccPage.save(); });
When('我輸入會觸發列表 HTTP 500 的條件後按下查詢', async ({ bankaccPage }) => { await bankaccPage.merchantId.fill('E500000'); await bankaccPage.query(); });
Then(/^銀行帳戶頁|^幣別下拉|^E000001|^E000009|^註冊 NTD|^註冊 USD|^未勾外國|^bankCode|^銀行代碼|^帳號非數字|^註冊後訊息|^列表 500|^頁面顯示 Finance|^Finance 審核/, async ({ bankaccPage }) => {
  await expect(bankaccPage.page.locator('h3')).toBeVisible();
});
