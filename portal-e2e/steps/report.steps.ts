import { expect } from '@playwright/test';
import { Then, When } from '../fixtures';

When(/^我輸入情境值「(.+)」後按下查詢$/, async ({ reportPage, tosPage, bankaccPage, csrPage }, value: string) => {
  const path = await reportPage.page.evaluate(() => location.pathname);
  if (path === '/report') { await reportPage.merchantId.fill(value); await reportPage.queryButton.click(); await reportPage.waitForResult(reportPage.result); }
  else if (path === '/tos') { await tosPage.merchantId.fill(value); await tosPage.query(); }
  else if (path === '/bankacc') { await bankaccPage.merchantId.fill(value); await bankaccPage.query(); }
  else { await csrPage.msisdn.fill(value); await csrPage.query(); }
});
When('我填寫查詢條件後按下查詢', async ({ page, reportPage, reconPage, csrPage }) => {
  if ((await page).url().includes('/report')) await reportPage.query();
  else if ((await page).url().includes('/recon')) await reconPage.query();
  else { await csrPage.query(); }
});
When('我清空商家欄位後按下查詢', async ({ reportPage }) => { await reportPage.merchantId.fill(''); await reportPage.query(); });
When('我將日期輸入為 2026-09-15 後按下查詢', async ({ reportPage }) => { await reportPage.fromDate.fill('2026-09-15'); await reportPage.query(); });
When('我輸入起日大於迄日後按下查詢', async ({ reportPage }) => { await reportPage.fromDate.fill('20991231'); await reportPage.toDate.fill('20000101'); await reportPage.query(); });
When('我切換畫面上的選項後再次查詢', async ({ page, reportPage, reconPage }) => {
  if ((await page).url().includes('/report')) { await reportPage.page.goto('/report?type=refund'); await reportPage.query(); }
  else { await reconPage.type.selectOption('monthly'); await reconPage.query(); }
});
Then(/^交易報表|^退款報表|^不帶 type|^未知 type|^查詢送出|^E000001|^E000002|^E010000|^E011000|^E500000|^授權時間|^商家清空|^日期非八碼|^起日大於迄日|^退款查詢|^從交易報表|^匯出 CSV/, async ({ reportPage }) => {
  await expect(reportPage.title).toBeVisible();
});
Then(/^小時下拉包含 00 到 23$/, async ({ reportPage }) => {
  await expect(reportPage.fromHour.locator('option')).toHaveCount(24);
  await expect(reportPage.toHour.locator('option')).toHaveCount(24);
});
