import { expect } from '@playwright/test';
import { Then } from '../fixtures';

/** 服務條款頁（tos.html）特有句型 */

Then('服務條款版次應該是 {string}', async ({ tosPage }, ver: string) => {
  await expect(tosPage.form).toBeVisible();
  await expect(tosPage.version).toHaveText(ver);
});

Then('服務條款目前內容應該是 {string}', async ({ tosPage }, content: string) => {
  await expect(tosPage.form).toBeVisible();
  await expect(tosPage.currentContent).toHaveText(content);
});
