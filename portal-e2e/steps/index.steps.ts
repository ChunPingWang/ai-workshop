import { expect } from '@playwright/test';
import { Then } from '../fixtures';

/** US-HOME-*（SRS 4.2）首頁功能選單：三個 .box，各有 <b> 標題與 <ul> 連結 */

Then('首頁應該顯示區塊 {string}', async ({ homePage }, name: string) => {
  await expect(homePage.menuBoxes.locator('b').filter({ hasText: name })).toBeVisible();
});

Then('{string} 區塊應該有 {int} 個連結', async ({ homePage }, name: string, count: number) => {
  const box = homePage.menuBoxes.filter({ hasText: name });
  await expect(box.locator('ul a')).toHaveCount(count);
});

Then('首頁應該顯示連結 {string}', async ({ homePage }, text: string) => {
  await expect(homePage.menuLink(text)).toBeVisible();
});
