import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReconPage extends BasePage {
  readonly type: Locator;
  readonly from: Locator;
  readonly to: Locator;
  readonly queryButton: Locator;
  readonly result: Locator;
  readonly reconId: Locator;
  readonly detailButton: Locator;
  readonly detail: Locator;
  readonly summaryTable: Locator;
  readonly detailTable: Locator;

  constructor(page: Page) {
    super(page);
    this.type = page.locator('#type');
    this.from = page.locator('#from');
    this.to = page.locator('#to');
    this.queryButton = page.locator('#btnQuery');
    this.result = page.locator('#result');
    this.reconId = page.locator('#reconId');
    this.detailButton = page.locator('#btnDetail');
    this.detail = page.locator('#detail');
    this.summaryTable = this.result.locator('table');
    this.detailTable = this.detail.locator('table');
  }

  async open() {
    await this.goto('/recon');
  }

  async setType(type: 'daily' | 'monthly') {
    await this.type.selectOption(type);
  }

  async setDateRange(from: string, to: string) {
    await this.from.fill(from);
    await this.to.fill(to);
  }

  async querySummary() {
    await this.queryButton.click();
    await this.waitForResult(this.result);
  }

  async querySummaryWith(from: string, kind: string) {
    await this.from.fill(from);
    await this.setType(kind === '每月彙總' ? 'monthly' : 'daily');
    await this.querySummary();
  }

  async setReconId(value: string) {
    await this.reconId.fill(value);
  }

  async queryDetail(value?: string) {
    if (value !== undefined) await this.setReconId(value);
    await this.detailButton.click();
    await this.waitForResult(this.detail);
  }

  async expectTableRows(table: Locator, rows: Record<string, string>[]) {
    await this.expectDataRows(table, rows);
  }

  async expectDailyRowsInOrder() {
    const rows = this.dataRows(this.summaryTable);
    await expect(rows.nth(0)).toContainText('R20260915');
    await expect(rows.nth(1)).toContainText('R20260916');
  }

  async expectSummaryColumnCount(count: number) {
    await expect(this.summaryTable.locator('th')).toHaveCount(count);
  }
}