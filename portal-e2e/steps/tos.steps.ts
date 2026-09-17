import { expect } from '@playwright/test';
import { Then, When } from '../fixtures';
import { TosPage } from '../pages/TosPage';

async function openEmptyForm(tosPage: TosPage) {
  await tosPage.merchantId.fill('E000002');
  await tosPage.query();
}

When('我查詢商家代碼 {string} 後建立新版次', async ({ tosPage }, merchantId) => {
  await tosPage.merchantId.fill(merchantId);
  await tosPage.query();
  await tosPage.newVersionButton.click();
});

When('我以商家代碼 {string} 填寫新條款後存檔', async ({ tosPage }, merchantId) => {
  await tosPage.merchantId.fill(merchantId);
  await tosPage.query();
  if (await tosPage.newVersionButton.isVisible()) await tosPage.newVersionButton.click();
  await tosPage.content.fill('測試條款');
  await tosPage.save();
});

When('我以商家代碼 {string} 建立新版次並存檔', async ({ tosPage }, merchantId) => {
  await tosPage.merchantId.fill(merchantId);
  await tosPage.query();
  await tosPage.newVersionButton.click();
  await tosPage.content.fill('第三版測試條款');
  await tosPage.save();
});

When('我在條款內容輸入 FAIL 後按下存檔', async ({ tosPage }) => {
  await openEmptyForm(tosPage);
  await tosPage.content.fill('FAIL');
  await tosPage.save();
});

When('我存檔後再次按下查詢', async ({ tosPage }) => {
  await openEmptyForm(tosPage);
  await tosPage.content.fill('測試條款');
  await tosPage.save();
  await tosPage.query();
});

When('我清空條款內容後按下存檔', async ({ tosPage }) => {
  await openEmptyForm(tosPage);
  await tosPage.content.fill('');
  await tosPage.save();
});

When('我輸入非十四碼生效日期後按下存檔', async ({ tosPage }) => {
  await openEmptyForm(tosPage);
  await tosPage.startDate.fill('1');
  await tosPage.save();
});

When('我清空商家代碼後按下查詢', async ({ tosPage }) => {
  await tosPage.merchantId.fill('');
  await tosPage.query();
});

When('我輸入會觸發服務條款 HTTP {int} 的條件後按下查詢', async ({ tosPage }, status) => {
  await tosPage.merchantId.fill(status === 500 ? 'E500000' : 'E404000');
  await tosPage.query();
});

When('我以 E999JSON 作為商家代碼後按下查詢', async ({ tosPage }) => {
  await tosPage.merchantId.fill('E999JSON');
  await tosPage.query();
});

Then('版次應該顯示 {string}', async ({ tosPage }, version) => {
  await expect(tosPage.version).toHaveText(version);
});

Then('條款編輯區應該顯示且內容與註記為空白', async ({ tosPage }) => {
  await expect(tosPage.editArea).toBeVisible();
  await expect(tosPage.content).toHaveValue('');
  await expect(tosPage.note).toHaveValue('');
});

Then('存檔回應應該包含 {string}', async ({ tosPage }, text) => {
  expect(tosPage.lastSaveResponse).toContain(text);
});

Then('存檔後條款表單仍然顯示', async ({ tosPage }) => {
  await expect(tosPage.form).toBeVisible();
});

Then('訊息區應該為空白', async ({ tosPage }) => {
  await expect(tosPage.message).toHaveText('');
});
