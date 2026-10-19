import { expect } from '@playwright/test';
import { Then } from '../fixtures';

/** 銀行帳戶頁（bankacc.html）特有句型 */

Then('帳戶清單應該只有表頭 {string}', async ({ bankaccPage }, headers: string) => {
  const table = bankaccPage.table('帳戶清單');
  // 先確認表頭已渲染（ajax callback 已執行），再斷言沒有資料列
  await expect(table.locator('th')).toHaveText(headers.split('、'));
  await expect(bankaccPage.dataRows(table)).toHaveCount(0);
});
