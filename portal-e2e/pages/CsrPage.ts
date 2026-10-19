import { Locator, Page } from '@playwright/test';
import { BasePage, ButtonSpec } from './BasePage';

/** csr.html：#result 內依序為 交易表格、total rows、<hr/>Refunds:、退款表格、total rows */
export class CsrPage extends BasePage {
  readonly path = '/csr';
  readonly result: Locator;

  protected readonly fields: Record<string, string> = { 門號: '#msisdn' };
  protected readonly buttons: Record<string, ButtonSpec> = {
    查詢: { selector: '#btnQuery', waitFor: /\/csr\/data/ },
  };
  protected readonly areas: Record<string, string> = { 結果區: '#result', 查詢結果區: '#result' };
  protected readonly tables = {
    結果表格: { selector: '#result table' },
    交易表格: { selector: '#result table', nth: 0 },
    退款表格: { selector: '#result table', nth: 1 },
  };

  constructor(page: Page) {
    super(page);
    this.result = page.locator('#result');
  }
}
