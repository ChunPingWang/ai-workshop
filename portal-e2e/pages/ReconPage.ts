import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReconPage extends BasePage {
  readonly type = this.page.locator('#type');
  readonly from = this.page.locator('#from');
  readonly to = this.page.locator('#to');
  readonly queryButton = this.page.locator('#btnQuery');
  readonly result = this.page.locator('#result');
  readonly reconId = this.page.locator('#reconId');
  readonly detailButton = this.page.locator('#btnDetail');
  readonly detail = this.page.locator('#detail');

  async open() { await this.page.goto('/recon'); }
  async query() { await this.queryButton.click(); await this.waitForResult(this.result); }
  async queryDetail() { await this.detailButton.click(); await this.waitForResult(this.detail); }
  rows(container = this.result) { return container.locator('tr').filter({ has: container.locator('td') }); }
}
