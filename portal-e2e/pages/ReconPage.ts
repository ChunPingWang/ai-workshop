import { Locator, Page } from '@playwright/test';
import { BasePage, ButtonSpec } from './BasePage';

/** recon.html：彙總（#result）與差異明細（#detail）兩個獨立結果區 */
export class ReconPage extends BasePage {
  readonly path = '/recon';
  readonly result: Locator;
  readonly detail: Locator;

  protected readonly fields: Record<string, string> = {
    類型: '#type',
    '區間(起)': '#from',
    '區間(迄)': '#to',
    對帳批次編號: '#reconId',
  };
  protected readonly buttons: Record<string, ButtonSpec> = {
    查詢: { selector: '#btnQuery', waitFor: /\/recon\/data/ },
    查差異明細: { selector: '#btnDetail', waitFor: /\/recon\/detail/ },
  };
  protected readonly areas: Record<string, string> = {
    結果區: '#result',
    查詢結果區: '#result',
    明細區: '#detail',
    差異明細區: '#detail',
  };
  protected readonly tables = {
    結果表格: { selector: '#result table' },
    明細表格: { selector: '#detail table' },
  };

  constructor(page: Page) {
    super(page);
    this.result = page.locator('#result');
    this.detail = page.locator('#detail');
  }
}
