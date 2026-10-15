import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CsrPage extends BasePage {
  readonly msisdn: Locator;
  readonly queryButton: Locator;
  readonly result: Locator;
  readonly tables: Locator;
  readonly transactionTable: Locator;
  readonly refundTable: Locator;

  constructor(page: Page) {
    super(page);
    this.msisdn = page.locator('#msisdn');
    this.queryButton = page.locator('#btnQuery');
    this.result = page.locator('#result');
    this.tables = this.result.locator('table');
    this.transactionTable = this.tables.nth(0);
    this.refundTable = this.tables.nth(1);
  }

  async open() {
    await this.goto('/csr');
  }

  async query(msisdn?: string) {
    if (msisdn !== undefined) await this.msisdn.fill(msisdn);
    await this.queryButton.click();
    await this.waitForResult(this.result);
  }

  async expectRows(table: Locator, rows: Record<string, string>[]) {
    await this.expectDataRows(table, rows);
  }

  async rowCount(table: Locator): Promise<number> {
    return super.rowCount(table);
  }

  async expectTransactionsNewestFirst() {
    const rows = this.dataRows(this.transactionTable);
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator('td').nth(3)).toHaveText('20260916100000');
    await expect(rows.nth(1).locator('td').nth(3)).toHaveText('20260915100000');
  }

  async expectTableTotal(table: Locator, total: string) {
    await expect(table.locator('xpath=following-sibling::p[1]')).toContainText(total);
  }

  async expectTransactionsTotal(total: string) {
    await this.expectTableTotal(this.transactionTable, total);
  }

  async expectRefundsTotal(total: string) {
    await this.expectTableTotal(this.refundTable, total);
  }
}