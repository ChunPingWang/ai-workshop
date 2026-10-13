import { expect } from '@playwright/test';
import { Then } from '../fixtures';

Then('帳戶清單中不應該有任何按鈕或連結', async ({ bankaccPage }) => {
  await expect(bankaccPage.list.locator('table td').first()).toBeVisible();
  await expect(bankaccPage.list.locator('button, a, input')).toHaveCount(0);
});
