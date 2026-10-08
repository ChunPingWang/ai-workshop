import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * /recon：OLS 對帳結果查詢（US-RCN-*，SRS 4.5）
 * 主查詢 → $.get('/recon/data') 塞 #result；差異明細 → $.get('/recon/detail') 塞 #detail，兩區互相獨立
 */
export class ReconPage extends BasePage {
  readonly type: Locator;
  readonly from: Locator;
  readonly to: Locator;
  readonly queryButton: Locator;
  readonly result: Locator;
  readonly resultTable: Locator;
  readonly reconId: Locator;
  readonly detailButton: Locator;
  readonly detail: Locator;
  readonly detailTable: Locator;

  constructor(page: Page) {
    super(page);
    this.type = page.locator('#type');
    this.from = page.locator('#from');
    this.to = page.locator('#to');
    this.queryButton = page.locator('#btnQuery');
    this.result = page.locator('#result');
    this.resultTable = this.result.locator('table').first();
    this.reconId = page.locator('#reconId');
    this.detailButton = page.locator('#btnDetail');
    this.detail = page.locator('#detail');
    this.detailTable = this.detail.locator('table').first();
  }

  async goto() {
    await this.page.goto('/recon');
  }

  async query() {
    await this.queryButton.click();
    await this.waitForResult(this.result);
  }

  async queryDetail(reconId: string) {
    await this.reconId.fill(reconId);
    await this.detailButton.click();
    await this.waitForResult(this.detail);
  }
}
