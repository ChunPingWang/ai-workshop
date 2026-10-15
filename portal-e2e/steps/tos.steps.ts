import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures';

Given('我在服務條款設定頁', async ({ tosPage }) => {
  await tosPage.open();
});

Given('我查詢商家 {string} 的服務條款', async ({ tosPage }, merchantId) => {
  await tosPage.queryAndWaitForForm(merchantId);
});

Given('我在新增服務條款模式', async ({ tosPage }) => {
  await tosPage.queryAndWaitForForm('E000002');
});

When('我按下建立新版次', async ({ tosPage }) => {
  await tosPage.createNewVersion();
});

When('我輸入生效日期 {string}、內容 {string} 與註記 {string} 並存檔', async ({ tosPage }, date, content, note) => {
  await tosPage.fillDraft(date, content, note);
  await tosPage.saveAndHoldRefresh();
});

When('我輸入生效日期 {string} 與內容 {string} 並存檔', async ({ tosPage }, date, content) => {
  await tosPage.fillDraft(date, content);
  await tosPage.saveAndHoldRefresh();
});

When('我建立新版次並輸入生效日期 {string}、內容 {string} 與註記 {string} 後存檔', async ({ tosPage }, date, content, note) => {
  await tosPage.createNewVersion();
  await tosPage.fillDraft(date, content, note);
  await tosPage.saveAndHoldRefresh();
});

When('自動重查回到檢視狀態後我再次建立新版次', async ({ tosPage }) => {
  await tosPage.releaseHeldRefresh();
  await expect(tosPage.newVersionButton).toBeVisible();
  await tosPage.createNewVersion();
});

When('我以商家 {string}、生效日期 {string} 與內容 {string} 存檔', async ({ tosPage }, merchantId, date, content) => {
  await tosPage.merchantId.fill(merchantId);
  await tosPage.fillDraft(date, content);
  await tosPage.saveAndHoldRefresh();
});

When('我輸入含單引號的內容並存檔', async ({ tosPage }) => {
  await tosPage.fillDraft('20260916090000', "條款內容'");
  await tosPage.saveAndHoldRefresh();
});

When('我直接開啟商家 {string} 的條款頁並指定版次 {string}', async ({ tosPage }, merchantId, version) => {
  await tosPage.openPublicTerms(merchantId, version);
});

When('我直接開啟未指定商家與版次的條款頁', async ({ tosPage }) => {
  await tosPage.openPublicTerms();
});

When('我直接開啟商家 {string} 且不指定版次的條款頁', async ({ tosPage }, merchantId) => {
  await tosPage.openPublicTerms(merchantId);
});

When('我在目前條款頁清除登入狀態後重新查詢', async ({ basePage, tosPage }) => {
  await basePage.invalidateSessionWithoutNavigation();
  await tosPage.query();
});

When('我以未登入狀態存檔服務條款', async ({ tosPage }) => {
  await tosPage.saveAndHoldRefresh();
});

Then('條款表單、版次、內容與訊息區應隱藏', async ({ tosPage }) => {
  await expect(tosPage.form).toBeHidden();
});

Then('畫面應顯示最新版次 {string} 與最新版條款內容', async ({ tosPage }, version) => {
  await expect(tosPage.form).toBeVisible();
  await expect(tosPage.version).toHaveText(version);
  await expect(tosPage.currentContent).toContainText(`服務條款 v${version}`);
});

Then('畫面應顯示新版條款網址', async ({ tosPage }) => {
  await expect(tosPage.currentContent).toContainText('http://localhost:8099/getToS.jsp');
});

Then('編輯區與存檔按鈕應隱藏且建立新版次按鈕應顯示', async ({ tosPage }) => {
  await expect(tosPage.editArea).toBeHidden();
  await expect(tosPage.saveButton).toBeHidden();
  await expect(tosPage.newVersionButton).toBeVisible();
});

Then('畫面應顯示版次 {string}', async ({ tosPage }, version) => {
  await expect(tosPage.version).toHaveText(version);
});

Then('條款內容應保留兩行文字', async ({ tosPage }) => {
  await expect(tosPage.currentContent).toContainText('第一行服務條款\n第二行服務條款');
});

Then('畫面應顯示版次 {string} 與 {string}', async ({ tosPage }, version, text) => {
  await expect(tosPage.version).toHaveText(version);
  await expect(tosPage.currentContent).toContainText(text);
});

Then('編輯區與存檔按鈕應顯示', async ({ tosPage }) => {
  await expect(tosPage.editArea).toBeVisible();
  await expect(tosPage.saveButton).toBeVisible();
});

Then('建立新版次按鈕應隱藏', async ({ tosPage }) => {
  await expect(tosPage.newVersionButton).toBeHidden();
});

Then('畫面應預覽版次 {string} 且編輯區應顯示', async ({ tosPage }, version) => {
  await expect(tosPage.version).toHaveText(version);
  await expect(tosPage.editArea).toBeVisible();
});

Then('訊息區應短暫顯示 {string}', async ({ tosPage }, message) => {
  await expect(tosPage.message).toContainText(message);
});

Then('存檔後應自動重新查詢且回到條款檢視狀態', async ({ tosPage }) => {
  await tosPage.releaseHeldRefresh();
  await expect(tosPage.form).toBeVisible();
  await expect(tosPage.editArea).toBeHidden();
  await expect(tosPage.newVersionButton).toBeVisible();
});

Then('存檔後應自動重新查詢', async ({ tosPage }) => {
  await tosPage.releaseHeldRefresh();
  await expect(tosPage.form).toBeVisible();
});

Then('存檔失敗後仍應自動重新查詢', async ({ tosPage }) => {
  await tosPage.releaseHeldRefresh();
  await expect(tosPage.form).toBeVisible();
});

Then('條款內容與註記應為空白', async ({ tosPage }) => {
  await expect(tosPage.content).toHaveValue('');
  await expect(tosPage.note).toHaveValue('');
});

Then('生效日期欄應保留 {string}', async ({ tosPage }, date) => {
  await expect(tosPage.startDate).toHaveValue(date);
});

Then('舊版內容與網址仍應可見', async ({ tosPage }) => {
  await expect(tosPage.currentContent).toContainText('服務條款 v2');
  await expect(tosPage.currentContent).toContainText('/getToS.jsp');
});

Then('條款表單仍應隱藏', async ({ tosPage }) => {
  await expect(tosPage.form).toBeHidden();
});

Then('條款頁應顯示 {string}', async ({ basePage }, text) => {
  await basePage.expectBodyText(text);
});

Then('條款頁應顯示全域預設條款', async ({ basePage }) => {
  await basePage.expectBodyText('new-pay 全域預設服務條款');
});

Then('畫面只應提供建立新版次的操作', async ({ tosPage }) => {
  await expect(tosPage.newVersionButton).toBeVisible();
  await expect(tosPage.saveButton).toBeHidden();
});

Then('編輯區應隱藏', async ({ tosPage }) => {
  await expect(tosPage.editArea).toBeHidden();
});