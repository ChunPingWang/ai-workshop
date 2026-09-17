import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class IndexPage extends BasePage {
  readonly headings = this.page.locator('.wrap > h3');
  readonly boxes = this.page.locator('.wrap > .box');
  readonly links = this.page.locator('.wrap a');

  async open() { await this.page.goto('/'); }

  async assertContent() {
    await expect(this.page).toHaveTitle('new-pay Portal');
    await expect(this.page.getByText('SA Portal (BO / PM / Finance BO)', { exact: true })).toBeVisible();
    await expect(this.page.getByText('Merchant Portal (CP)', { exact: true })).toBeVisible();
    await expect(this.page.getByText('CSR Portal', { exact: true })).toBeVisible();
  }
}
