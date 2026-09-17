import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class BankaccPage extends BasePage {
  readonly merchantId = this.page.locator('#merchantId');
  readonly bankCode = this.page.locator('#bankCode');
  readonly bankAccount = this.page.locator('#bankAcc');
  readonly currency = this.page.locator('#currency');
  readonly foreign = this.page.locator('#foreign');
  readonly saveButton = this.page.locator('#btnSave');
  readonly message = this.page.locator('#msg');
  readonly listButton = this.page.locator('#btnList');
  readonly list = this.page.locator('#list');

  async open() { await this.page.goto('/bankacc'); }
  async save() { await this.saveButton.click(); await expect(this.message).not.toHaveText(''); }
  async query() { await this.listButton.click(); await expect(this.list).not.toHaveText('查詢中'); }
  rows() { return this.list.locator('tr').filter({ has: this.list.locator('td') }); }
}
