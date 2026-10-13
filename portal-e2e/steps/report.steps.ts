import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';

When('我以報表類型 {string} 開啟報表頁', async ({ reportPage }, type: string) => {
  await reportPage.openWithType(type);
});

When('我以未指定報表類型的網址開啟報表頁', async ({ reportPage }) => {
  await reportPage.openWithType(null);
});

Then('結果表格中的 {string} 應該以粗體呈現', async ({ reportPage }, text: string) => {
  await expect(reportPage.result.locator('table b', { hasText: text })).toBeVisible();
});

Then('結果表格的表頭應該是淡藍底色', async ({ portal, reportPage }) => {
  expect(await portal.style(reportPage.result.locator('th'), 'background-color')).toBe('rgb(217, 226, 243)'); // #d9e2f3
});

Then('結果表格應該有灰色格線', async ({ portal, reportPage }) => {
  const td = reportPage.result.locator('td');
  expect(await portal.style(td, 'border-top-color')).toBe('rgb(153, 153, 153)'); // #999
  expect(await portal.style(td, 'border-top-style')).toBe('solid');
});
