import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * /report?type=trans|refund：交易／退款報表（US-RPT-*／US-RFD-*，SRS 4.3／4.4）
 * 查詢 → $.get('/report/data') → backend /sa/report/trans|refund → HTML 表格塞進 #result
 * type=refund 時標題換成「退款交易報表查詢」、#transOnly（商家＋時間類型）隱藏
 */
export class ReportPage extends BasePage {
  readonly title: Locator;
  readonly fromDate: Locator;
  readonly fromHour: Locator;
  readonly toDate: Locator;
  readonly toHour: Locator;
  /** 商家＋時間類型的外層 span，refund 時整塊隱藏 */
  readonly transOnly: Locator;
  readonly merchantId: Locator;
  readonly timeType: Locator;
  readonly queryButton: Locator;
  readonly result: Locator;
  readonly resultTable: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('#title');
    this.fromDate = page.locator('#fromDate');
    this.fromHour = page.locator('#fromHour');
    this.toDate = page.locator('#toDate');
    this.toHour = page.locator('#toHour');
    this.transOnly = page.locator('#transOnly');
    this.merchantId = page.locator('#merchantId');
    this.timeType = page.locator('#timeType');
    this.queryButton = page.locator('#btnQuery');
    this.result = page.locator('#result');
    this.resultTable = this.result.locator('table').first();
  }

  async goto(type: 'trans' | 'refund' = 'trans') {
    await this.page.goto('/report?type=' + type);
  }

  async query() {
    await this.queryButton.click();
    await this.waitForResult(this.result);
  }
}
