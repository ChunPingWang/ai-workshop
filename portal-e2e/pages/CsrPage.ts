import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * /csr：CSR 交易查詢（US-CSR-*，SRS 4.8）
 * 輸入門號 → $.get('/csr/data') → backend /csr/trans → 交易表(8欄) + <hr/>Refunds: + 退款表(8欄) 塞進 #result
 */
export class CsrPage extends BasePage {
  readonly msisdn: Locator;
  readonly queryButton: Locator;
  readonly result: Locator;
  /** 第一張表：交易；第二張表：退款（<hr/>Refunds: 之後） */
  readonly transTable: Locator;
  readonly refundTable: Locator;

  constructor(page: Page) {
    super(page);
    this.msisdn = page.locator('#msisdn');
    this.queryButton = page.locator('#btnQuery');
    this.result = page.locator('#result');
    this.transTable = this.result.locator('table').nth(0);
    this.refundTable = this.result.locator('table').nth(1);
  }

  async goto() {
    await this.page.goto('/csr');
  }

  async query(msisdn: string) {
    await this.msisdn.fill(msisdn);
    await this.queryButton.click();
    await this.waitForResult(this.result);
  }
}
