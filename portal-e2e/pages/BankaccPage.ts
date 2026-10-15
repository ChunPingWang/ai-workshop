import { expect, Locator, Page, Response } from '@playwright/test';
import { BasePage } from './BasePage';

export class BankaccPage extends BasePage {
  readonly merchantId: Locator;
  readonly bankCode: Locator;
  readonly bankAccount: Locator;
  readonly currency: Locator;
  readonly foreignBank: Locator;
  readonly saveButton: Locator;
  readonly message: Locator;
  readonly listButton: Locator;
  readonly list: Locator;
  readonly table: Locator;
  private priorListText = '';

  constructor(page: Page) {
    super(page);
    this.merchantId = page.locator('#merchantId');
    this.bankCode = page.locator('#bankCode');
    this.bankAccount = page.locator('#bankAcc');
    this.currency = page.locator('#currency');
    this.foreignBank = page.locator('#foreign');
    this.saveButton = page.locator('#btnSave');
    this.message = page.locator('#msg');
    this.listButton = page.locator('#btnList');
    this.list = page.locator('#list');
    this.table = this.list.locator('table');
  }

  async open() {
    await this.goto('/bankacc');
  }

  async queryList(merchantId?: string): Promise<Response> {
    if (merchantId !== undefined) await this.merchantId.fill(merchantId);
    const response = this.page.waitForResponse((item) => item.url().includes('/bankacc/data'));
    await this.listButton.click();
    const result = await response;
    await result.finished();
    return result;
  }

  async fillRegistration(bankCode: string, bankAccount: string, currency = 'NTD', isDomestic = 'Y') {
    await this.bankCode.fill(bankCode);
    await this.bankAccount.fill(bankAccount);
    await this.currency.selectOption(currency);
    if (isDomestic === 'N') await this.foreignBank.check();
    else await this.foreignBank.uncheck();
  }

  async save(): Promise<Response> {
    const saveResponse = this.page.waitForResponse((item) => item.url().includes('/bankacc/save'));
    await this.saveButton.click();
    const result = await saveResponse;
    await result.finished();
    return result;
  }

  async registerAndWaitForList(bankCode: string, bankAccount: string, currency = 'NTD', isDomestic = 'Y') {
    await this.fillRegistration(bankCode, bankAccount, currency, isDomestic);
    const listResponse = this.page.waitForResponse((item) => item.url().includes('/bankacc/data'));
    await this.save();
    await listResponse;
    await expect(this.table.locator('tr').first().locator('th')).toHaveCount(6);
  }

  async expectRows(rows: Record<string, string>[]) {
    await this.expectDataRows(this.table, rows);
  }

  async captureList() {
    this.priorListText = await this.list.innerText();
  }

  async expectListUnchanged() {
    await expect(this.list).toHaveText(this.priorListText);
  }

  async expectListHeaderCount(count: number) {
    await expect(this.table.locator('tr').first().locator('th')).toHaveCount(count);
  }

  async expectInsertionOrder() {
    const rows = this.dataRows(this.table);
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('007');
    await expect(rows.nth(1)).toContainText('004');
  }
}