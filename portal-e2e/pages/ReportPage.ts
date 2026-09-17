import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReportPage extends BasePage {
  readonly title = this.page.locator('#title');
  readonly type = this.page.locator('#type');
  readonly fromDate = this.page.locator('#fromDate');
  readonly fromHour = this.page.locator('#fromHour');
  readonly toDate = this.page.locator('#toDate');
  readonly toHour = this.page.locator('#toHour');
  readonly merchantId = this.page.locator('#merchantId');
  readonly timeType = this.page.locator('#timeType');
  readonly transOnly = this.page.locator('#transOnly');
  readonly queryButton = this.page.locator('#btnQuery');
  readonly result = this.page.locator('#result');

  async open(type?: string) { await this.page.goto(type ? `/report?type=${type}` : '/report'); }
  async query(merchant = 'E000001') {
    if (await this.merchantId.isVisible()) await this.merchantId.fill(merchant);
    await this.queryButton.click();
    await this.waitForResult(this.result);
  }
  rows() { return this.result.locator('tr').filter({ has: this.result.locator('td') }); }
  async assertInitial() {
    await expect(this.title).toBeVisible();
    await expect(this.fromDate).toHaveAttribute('placeholder', 'yyyyMMdd');
    await expect(this.toDate).toHaveAttribute('placeholder', 'yyyyMMdd');
    await expect(this.queryButton).toBeVisible();
  }
}
