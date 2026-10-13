import { Locator, Page } from '@playwright/test';
import { BasePage, ButtonSpec } from './BasePage';

/** report.html：交易報表與退款報表共用，差別在 hidden #type（trans／refund） */
export class ReportPage extends BasePage {
  readonly path = '/report?type=trans';
  readonly title: Locator;
  readonly transOnly: Locator;
  readonly result: Locator;

  protected readonly fields: Record<string, string> = {
    '日期(起)': '#fromDate',
    '時(起)': '#fromHour',
    '日期(迄)': '#toDate',
    '時(迄)': '#toHour',
    商家: '#merchantId',
    時間類型: '#timeType',
  };
  protected readonly buttons: Record<string, ButtonSpec> = {
    查詢: { selector: '#btnQuery', waitFor: /\/report\/data/ },
  };
  protected readonly areas: Record<string, string> = { 結果區: '#result' };
  protected readonly tables = { 結果表格: { selector: '#result table' } };

  constructor(page: Page) {
    super(page);
    this.title = page.locator('#title');
    this.transOnly = page.locator('#transOnly');
    this.result = page.locator('#result');
  }

  /** 以指定的 type 參數開啟；type 為 null 時網址不帶 type */
  async openWithType(type: string | null) {
    await this.page.goto(type === null ? '/report' : `/report?type=${encodeURIComponent(type)}`);
  }
}
