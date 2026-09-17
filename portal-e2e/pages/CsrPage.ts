import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CsrPage extends BasePage {
  readonly msisdn = this.page.locator('#msisdn');
  readonly queryButton = this.page.locator('#btnQuery');
  readonly result = this.page.locator('#result');

  async open() { await this.page.goto('/csr'); }
  async query() { await this.queryButton.click(); await this.waitForResult(this.result); }
  rows() { return this.result.locator('tr').filter({ has: this.result.locator('td') }); }
}
