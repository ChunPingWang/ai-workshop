import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class TosPage extends BasePage {
  lastSaveResponse = '';
  readonly merchantId = this.page.locator('#merchantID');
  readonly queryButton = this.page.locator('#btnQuery');
  readonly form = this.page.locator('#form');
  readonly version = this.page.locator('#verShow');
  readonly currentContent = this.page.locator('#curContent');
  readonly editArea = this.page.locator('#editArea');
  readonly startDate = this.page.locator('#startDate');
  readonly content = this.page.locator('#content');
  readonly note = this.page.locator('#note');
  readonly saveButton = this.page.locator('#btnSave');
  readonly newVersionButton = this.page.locator('#btnNewVer');
  readonly message = this.page.locator('#msg');

  async open() { await this.page.goto('/tos'); }
  async query() {
    const responsePromise = this.page.waitForResponse(response => response.url().includes('/tos/data'));
    await this.queryButton.click();
    const response = await responsePromise;
    if (response.ok() && response.headers()['content-type']?.includes('json')) {
      await expect(this.form).toBeVisible();
    } else {
      await expect(this.queryButton).toBeVisible();
    }
  }
  async save() {
    const saveResponse = this.page.waitForResponse(response =>
      response.url().includes('/tos/save') && response.request().method() === 'POST');
    const queryResponse = this.page.waitForResponse(response =>
      response.url().includes('/tos/data') && response.request().method() === 'GET');
    await this.saveButton.click();
    this.lastSaveResponse = await (await saveResponse).text();
    await queryResponse;
    await expect(this.form).toBeVisible();
  }
}
